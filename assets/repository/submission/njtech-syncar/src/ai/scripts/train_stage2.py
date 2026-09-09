"""
Stage 2: ESM-Effect regression head fine-tuning
===============================================

Multi-site Concat-Delta Embedding regression on top of a (Stage-1)
fine-tuned ESM-2 35M encoder. Supports 1-3 mutation sites per sample
and K-fold stratified cross-validation.

Usage (from ``src/ai/``):
    python -m scripts.train_stage2 \
        --stage1_dir ../results/checkpoints/stage1 \
        --data_path ../data/MAB2962_multi_v1.pkl \
        --save_name stage2 \
        --cross_validation 4
"""
from __future__ import annotations

import argparse
import os
import random
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import torch
import yaml
from scipy.stats import spearmanr
from sklearn.metrics import ndcg_score
from sklearn.model_selection import StratifiedKFold
from torch.amp import GradScaler, autocast
from torch.utils.data import DataLoader

# Make ``models`` importable when running as ``python scripts/<name>.py``
_THIS_DIR = Path(__file__).resolve().parent
_AI_ROOT = _THIS_DIR.parent
if str(_AI_ROOT) not in sys.path:
    sys.path.insert(0, str(_AI_ROOT))

from models import ESMEffectModel, MultiSiteDataset, collate_fn  # noqa: E402

_PROJECT_ROOT = _AI_ROOT.parent.parent
DATA_DIR = _PROJECT_ROOT / "data"
DEFAULT_CHECKPOINT_DIR = _PROJECT_ROOT / "results" / "checkpoints"


# ---------------------------------------------------------------------------
# Seed / device helpers
# ---------------------------------------------------------------------------

def set_seed(seed: int = 42) -> None:
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    random.seed(seed)


def _resolve_device(device):
    if device is not None:
        return device
    try:
        if torch.cuda.is_available():
            _t = torch.zeros(1, device="cuda")
            _ = _t + 1
            del _t
            torch.cuda.empty_cache()
            return "cuda"
    except Exception as _e:
        print(f"[Stage 2] CUDA 不可用 ({_e})，回退到 CPU")
    return "cpu"


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------

def evaluate(model, loader, device):
    """在测试集上评估"""
    model.eval()
    all_preds, all_targets = [], []

    with torch.no_grad():
        for batch in loader:
            wt_batch = batch["wt_batch"]
            mut_batch = batch["mut_batch"]
            positions = batch["positions"].to(device)
            position_mask = batch.get("position_mask")
            if position_mask is not None:
                position_mask = position_mask.to(device)
            scores = batch["scores"].cpu().numpy()

            preds = model(wt_batch, mut_batch, positions, position_mask).detach().cpu().numpy()
            all_preds.extend(preds)
            all_targets.extend(scores)

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)

    sp = spearmanr(all_preds, all_targets).statistic
    try:
        preds_norm = (all_preds - all_preds.min()) / (all_preds.max() - all_preds.min() + 1e-8)
        targets_norm = (all_targets - all_targets.min()) / (all_targets.max() - all_targets.min() + 1e-8)
        ndcg = ndcg_score(targets_norm.reshape(1, -1), preds_norm.reshape(1, -1))
    except Exception:
        ndcg = 0.0

    mse = np.mean((all_preds - all_targets) ** 2)

    return {
        "spearmanr": sp if not np.isnan(sp) else 0.0,
        "ndcg": ndcg,
        "mse": mse,
        "preds": all_preds,
        "targets": all_targets,
    }


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train_fold(
    model, train_records, test_records,
    lr_esm=1e-5, lr_head=1e-4,
    epochs=15, batch_size=8,
    patience=5, seed=42, device=None,
    save_dir=None, fold_idx=0,
    max_sites=3,
):
    """单折训练"""
    set_seed(seed + fold_idx)

    train_dataset = MultiSiteDataset(train_records, max_sites=max_sites)
    test_dataset = MultiSiteDataset(test_records, max_sites=max_sites)

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        collate_fn=lambda b: collate_fn(b, device, max_sites),
    )
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        collate_fn=lambda b: collate_fn(b, device, max_sites),
    )

    print(f"  Fold {fold_idx+1}: train={len(train_dataset)}, test={len(test_dataset)}")

    head_params = []
    esm_params = []
    for name, param in model.named_parameters():
        if not param.requires_grad:
            continue
        if name.startswith(("fc1.", "fc2.", "fc3.", "dropout.")):
            head_params.append(param)
        elif "esm_model" in name:
            esm_params.append(param)
        else:
            head_params.append(param)

    lr_esm_scaled = batch_size * lr_esm
    lr_head_scaled = batch_size * lr_head

    param_groups = [
        {"params": esm_params, "lr": lr_esm_scaled},
        {"params": head_params, "lr": lr_head_scaled},
    ]

    optimizer = torch.optim.AdamW(param_groups, betas=(0.9, 0.999), weight_decay=0.01)

    total_steps = epochs * len(train_loader)
    scheduler = torch.optim.lr_scheduler.OneCycleLR(
        optimizer,
        max_lr=[lr_esm_scaled, lr_head_scaled],
        total_steps=total_steps,
    )

    criterion = torch.nn.MSELoss()
    scaler = GradScaler("cuda") if device.startswith("cuda") else None

    best_spearman = float("-inf")
    best_epoch = 0
    no_improve = 0

    for epoch in range(epochs):
        model.train()
        epoch_loss = 0.0
        n_batches = 0

        for batch in train_loader:
            wt_batch = batch["wt_batch"]
            mut_batch = batch["mut_batch"]
            positions = batch["positions"].to(device)
            position_mask = batch["position_mask"].to(device)
            targets = batch["scores"].to(device)

            optimizer.zero_grad()

            amp_device = (
                "cuda"
                if (isinstance(device, str) and device.startswith("cuda"))
                or (hasattr(device, "type") and device.type == "cuda")
                else "cpu"
            )
            with autocast(amp_device, dtype=torch.bfloat16, enabled=(amp_device == "cuda")):
                preds = model(wt_batch, mut_batch, positions, position_mask)
                loss = criterion(preds, targets)

            if scaler is not None:
                scaler.scale(loss).backward()
                scaler.unscale_(optimizer)
            else:
                loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=0.1)
            if scaler is not None:
                scaler.step(optimizer)
                scaler.update()
            else:
                optimizer.step()
            scheduler.step()

            epoch_loss += loss.item()
            n_batches += 1

        avg_loss = epoch_loss / max(n_batches, 1)
        current_lrs = scheduler.get_last_lr()

        metrics = evaluate(model, test_loader, device)
        is_best = metrics["spearmanr"] > best_spearman

        print(f"  Fold {fold_idx+1} Epoch {epoch+1}: loss={avg_loss:.4f}, "
              f"Spearman={metrics['spearmanr']:.3f}, lr={current_lrs[0]:.2e}")

        if is_best:
            best_spearman = metrics["spearmanr"]
            best_epoch = epoch + 1
            no_improve = 0
            if save_dir:
                os.makedirs(save_dir, exist_ok=True)
                torch.save({
                    "epoch": epoch,
                    "model_state": model.state_dict(),
                    "optimizer_state": optimizer.state_dict(),
                    "scheduler_state": scheduler.state_dict(),
                    "metrics": metrics,
                    "best_spearman": best_spearman,
                    "seed": seed,
                }, f"{save_dir}/fold{fold_idx+1}_best.pt")
                print(f"  Fold {fold_idx+1} ★ 最佳模型 (Spearman={best_spearman:.3f})")
        else:
            no_improve += 1

        if no_improve >= patience:
            print(f"  Fold {fold_idx+1}: 早停 epoch {epoch+1}, 最佳 epoch={best_epoch}")
            break

    return {
        "fold": fold_idx + 1,
        "best_spearman": best_spearman,
        "best_epoch": best_epoch,
        "metrics": metrics,
    }


def train_stage2(
    protein,
    records,
    stage1_dir=None,
    freeze_up_to: int = 8,
    dropout_rate: float = 0.2,
    lr_esm: float = 1e-5,
    lr_head: float = 1e-4,
    epochs: int = 15,
    batch_size: int = 8,
    patience: int = 5,
    cross_validation: int = 4,
    seed: int = 42,
    device=None,
    save_name: str = "stage2",
    max_sites: int = 3,
    fold_indices=None,
):
    """Stage 2 主训练函数。

    Args:
        protein: dict，{'wild_type': str}
        records: list of dict，每条包含 wt_seq, mut_seq, positions (list), score
        stage1_dir: Stage 1 checkpoint 目录（可选；可为 list/tuple，每个 fold 一份）
        freeze_up_to: 冻结前 N 层（默认 8，35M 共 12 层）
        cross_validation: K 折交叉验证（默认 4）
        seed: 随机种子
        save_name: checkpoint 保存名称
        max_sites: 最大支持的多位点数量（默认 3）
    """
    set_seed(seed)
    device = _resolve_device(device)
    print(f"\n[Stage 2] 设备: {device}")
    if device == "cuda":
        print(f"[Stage 2] GPU: {torch.cuda.get_device_name(0)}")

    stage1_esm_state = None
    if isinstance(stage1_dir, (list, tuple)):
        print(f"[Stage 2] 使用按 fold 对齐的 Stage 1 权重，共 {len(stage1_dir)} 份")
    elif stage1_dir:
        esm_encoder_path = os.path.join(stage1_dir, "esm_encoder.pt")
        if os.path.exists(esm_encoder_path):
            stage1_esm_state = torch.load(esm_encoder_path, map_location="cpu", weights_only=False)
            print(f"[Stage 2] 加载 Stage 1 ESM 权重: {esm_encoder_path}")

    df = pd.DataFrame(records)
    df["bin"] = (df["score"] >= 1.0).astype(int)

    all_results = []
    save_dir = DEFAULT_CHECKPOINT_DIR / save_name

    if fold_indices is None:
        skf = StratifiedKFold(n_splits=cross_validation, shuffle=True, random_state=seed)
        split_indices = [
            {"train_idx": train_idx.tolist(), "test_idx": test_idx.tolist()}
            for train_idx, test_idx in skf.split(df, df["bin"])
        ]
    else:
        split_indices = fold_indices
        if len(split_indices) != cross_validation:
            raise ValueError(
                f"fold_indices 数量 {len(split_indices)} 与 cross_validation={cross_validation} 不一致"
            )

    for fold_idx, split in enumerate(split_indices):
        train_idx = np.array(split["train_idx"], dtype=int)
        test_idx = np.array(split["test_idx"], dtype=int)
        print(f"\n{'='*60}")
        print(f"[Stage 2] Fold {fold_idx + 1}/{cross_validation}")
        print("=" * 60)
        if device.startswith("cuda"):
            torch.cuda.empty_cache()

        train_recs = [records[i] for i in train_idx]
        test_recs = [records[i] for i in test_idx]

        # 归一化：只用训练集
        tmin = min(r["score"] for r in train_recs)
        tmax = max(r["score"] for r in train_recs)
        for r in train_recs:
            r["score"] = (r["score"] - tmin) / (tmax - tmin + 1e-8)
        for r in test_recs:
            r["score"] = (r["score"] - tmin) / (tmax - tmin + 1e-8)

        model = ESMEffectModel(freeze_up_to=freeze_up_to, dropout_rate=dropout_rate, max_sites=max_sites)
        trainable, total = model.get_trainable_params()
        print(f"[Stage 2] 模型: 可训练参数 {trainable:,} / {total:,} ({100*trainable/total:.2f}%)")

        fold_stage1_esm_state = stage1_esm_state
        if isinstance(stage1_dir, (list, tuple)):
            fold_stage1_dir = stage1_dir[fold_idx]
            esm_encoder_path = os.path.join(fold_stage1_dir, "esm_encoder.pt")
            if os.path.exists(esm_encoder_path):
                fold_stage1_esm_state = torch.load(esm_encoder_path, map_location="cpu", weights_only=False)
                print(f"[Stage 2] Fold {fold_idx + 1} 加载专属 Stage 1 ESM 权重: {esm_encoder_path}")

        if fold_stage1_esm_state is not None:
            loaded = model.esm_model.load_state_dict(fold_stage1_esm_state, strict=False)
            print(f"[Stage 2] 权重加载完成: {len(loaded.missing_keys)} 缺失")

        model = model.to(device)

        result = train_fold(
            model=model,
            train_records=train_recs,
            test_records=test_recs,
            lr_esm=lr_esm,
            lr_head=lr_head,
            epochs=epochs,
            batch_size=batch_size,
            patience=patience,
            seed=seed,
            device=device,
            save_dir=str(save_dir),
            fold_idx=fold_idx,
            max_sites=max_sites,
        )
        all_results.append(result)
        print(f"  Fold {fold_idx+1}: Spearman={result['best_spearman']:.3f}")

    if all_results:
        spearmans = [r["best_spearman"] for r in all_results]
        print(f"\n[Stage 2] 各折 Spearman: {[f'{s:.3f}' for s in spearmans]}")
        print(f"[Stage 2] 平均 Spearman: {np.mean(spearmans):.3f} ± {np.std(spearmans):.3f}")

        cv_results = {
            "fold_results": all_results,
            "fold_indices": split_indices,
            "avg_spearman": float(np.mean(spearmans)),
            "std_spearman": float(np.std(spearmans)),
            "config": {
                "stage1_dir": stage1_dir,
                "freeze_up_to": freeze_up_to,
                "dropout_rate": dropout_rate,
                "lr_esm": lr_esm,
                "lr_head": lr_head,
                "epochs": epochs,
                "batch_size": batch_size,
                "patience": patience,
                "cross_validation": cross_validation,
                "seed": seed,
                "max_sites": max_sites,
            },
        }
        os.makedirs(save_dir, exist_ok=True)
        torch.save(cv_results, save_dir / "cv_results.pt")
        print(f"[Stage 2] 结果已保存: {save_dir}/cv_results.pt")

    return cv_results if all_results else None


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _load_records(data_path: Path) -> tuple[dict, list[dict]]:
    """Load MAB2962 records from a .pkl file (multi or single format)."""
    data = torch.load(data_path, weights_only=False)

    multi_key = next((cand for cand in ["MAB2962_multi"] if cand in data), None)
    if multi_key is not None:
        entry = data[multi_key]
        return {"wild_type": entry["wild_type"]}, list(entry["records"])

    df_key = next((cand for cand in ["MAB2962_Araya_2026"] if cand in data), None)
    if df_key is None:
        raise KeyError(f"Unknown data format: keys={list(data.keys())}")
    entry = data[df_key]
    protein = {"wild_type": entry["wild_type"]}
    df = entry["df"]
    records = []
    for _, row in df.iterrows():
        pos = row["pos"]
        if isinstance(pos, (int, np.integer)):
            pos = [int(pos)]
        else:
            pos = [int(p) for p in pos]
        records.append({
            "wt_seq": row["wt_seq"],
            "mut_seq": row["mut_seq"],
            "positions": pos,
            "score": row["score"],
        })
    return protein, records


def _load_yaml_config(path: str | None) -> dict:
    if path is None:
        return {}
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    if "stage2" in cfg and isinstance(cfg["stage2"], dict):
        cfg = {**cfg, **cfg["stage2"]}
    return cfg


def _build_argparser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Stage 2: ESM-Effect 回归头微调")
    parser.add_argument("--config", type=str, default=None)
    parser.add_argument("--data_path", type=str, default=None)
    parser.add_argument("--stage1_dir", "-s1", type=str, default=None)
    parser.add_argument("--freeze_up_to", "-f", type=int, default=8)
    parser.add_argument("--dropout", "-d", type=float, default=0.2)
    parser.add_argument("--lr_esm", type=float, default=5e-6)
    parser.add_argument("--lr_head", type=float, default=5e-4)
    parser.add_argument("--epochs", "-e", type=int, default=15)
    parser.add_argument("--batch_size", "-b", type=int, default=8)
    parser.add_argument("--patience", "-pt", type=int, default=5)
    parser.add_argument("--cross_validation", "-cv", type=int, default=4)
    parser.add_argument("--seed", "-s", type=int, default=42)
    parser.add_argument("--save_name", "-n", type=str, default="stage2")
    parser.add_argument("--max_sites", type=int, default=3)
    parser.add_argument("--cpu", action="store_true")
    parser.add_argument("--checkpoint_dir", type=str, default=None)
    return parser


def main() -> None:
    parser = _build_argparser()
    args = parser.parse_args()

    cfg = _load_yaml_config(args.config)
    for k, v in cfg.items():
        if not hasattr(args, k):
            continue
        cli_default = _build_argparser().get_default(k)
        if getattr(args, k) == cli_default:
            setattr(args, k, v)

    set_seed(args.seed)
    print(f"随机种子: {args.seed}")
    print("=" * 60)
    print("Stage 2: MAB2962 — ESM-Effect 回归头微调")
    print("=" * 60)

    if args.data_path is None:
        data_path = DATA_DIR / "MAB2962_multi_v1.pkl"
    else:
        data_path = Path(args.data_path)
    print(f"加载数据: {data_path}")
    protein, records = _load_records(data_path)
    print(f"WT长度={len(protein['wild_type'])}, 数据数={len(records)}")

    if args.checkpoint_dir:
        global DEFAULT_CHECKPOINT_DIR
        DEFAULT_CHECKPOINT_DIR = Path(args.checkpoint_dir)

    device = "cuda" if torch.cuda.is_available() and not args.cpu else "cpu"

    results = train_stage2(
        protein=protein,
        records=records,
        stage1_dir=args.stage1_dir,
        freeze_up_to=args.freeze_up_to,
        dropout_rate=args.dropout,
        lr_esm=args.lr_esm,
        lr_head=args.lr_head,
        epochs=args.epochs,
        batch_size=args.batch_size,
        patience=args.patience,
        cross_validation=args.cross_validation,
        seed=args.seed,
        device=device,
        save_name=args.save_name,
        max_sites=args.max_sites,
    )

    print("\n[Stage 2] 训练完成!")
    if results:
        print(f"平均 Spearman: {results['avg_spearman']:.3f} ± {results['std_spearman']:.3f}")


if __name__ == "__main__":
    main()
