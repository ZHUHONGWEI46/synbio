"""
Stage 1: MLM 自适应 — fair-esm ESM-2 35M + LoRA
===============================================

Trains fair-esm ESM-2 35M with LoRA adapters on a masked-LM objective
over MAB2962 sequences (WT + all single mutants). At the end of each
"save every" epoch we save two checkpoints:

* ``last.pt`` / ``best.pt`` — full training state (LoRA + head +
  optimizer + scheduler + scaler + meta).
* ``esm_encoder.pt``       — LoRA-merged encoder state_dict that can be
  loaded directly into Stage 2's `ESMEffectModel`.

Usage (from ``src/ai/``):
    python -m scripts.train_stage1 --config ../configs/baseline.yaml --seed 42

Or with explicit CLI flags (overrides config):
    python -m scripts.train_stage1 --lora_r 8 --epochs 50 --batch_size 4
"""
from __future__ import annotations

import argparse
import os
import random
import sys
from pathlib import Path

import numpy as np
import torch
import yaml
from scipy.stats import spearmanr
from sklearn.metrics import ndcg_score
from torch.amp import GradScaler, autocast
from torch.utils.data import DataLoader

import esm

# Make ``data`` and ``models`` importable when running as ``python scripts/<name>.py``
_THIS_DIR = Path(__file__).resolve().parent
_AI_ROOT = _THIS_DIR.parent
if str(_AI_ROOT) not in sys.path:
    sys.path.insert(0, str(_AI_ROOT))

from data.preprocess import build_all_sequences_for_mlm  # noqa: E402
from models import ESM2WithLMHead, MLMDataset, apply_lora, compute_mlm_loss, mlm_collate  # noqa: E402
from models.esm_lm_head import PROTEIN_MODEL_NAME  # noqa: E402

# Default project-level data / checkpoint directories.
# `submission/njtech-syncar/data/` and `submission/njtech-syncar/results/checkpoints/`.
_PROJECT_ROOT = _AI_ROOT.parent.parent  # src/ai/scripts -> src/ai -> src -> submission/njtech-syncar
DATA_DIR = _PROJECT_ROOT / "data"
DEFAULT_CHECKPOINT_DIR = _PROJECT_ROOT / "results" / "checkpoints"


# ---------------------------------------------------------------------------
# Seed / device helpers (kept here so the script is self-contained for CLI use)
# ---------------------------------------------------------------------------

def set_seed(seed: int = 42) -> None:
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    random.seed(seed)


def _resolve_device(device):
    if device is not None:
        return device
    # 严格检测：调用 cudaGetDeviceCount 后用小 tensor 验证，避免 RTX 5070 间歇性 Error 304
    try:
        if torch.cuda.is_available():
            _t = torch.zeros(1, device="cuda")
            _ = _t + 1
            del _t
            torch.cuda.empty_cache()
            return "cuda"
    except Exception as _e:
        print(f"[Stage 1] CUDA 不可用 ({_e})，回退到 CPU")
    return "cpu"


# ---------------------------------------------------------------------------
# Zero-shot DMS validation
# ---------------------------------------------------------------------------

def validate_on_dms(model, df, alphabet, batch_converter, device, n_samples=20, seed=42):
    """
    Stage 1 验证：在 DMS 任务上做 zero-shot logit_diff 评估。
    logit_diff = logP(mt_aa) - logP(wt_aa) at the mutation position.
    """
    model.eval()
    wt = df.iloc[0]["wt_seq"]

    sample_df = df.sample(n=min(n_samples, len(df)), random_state=seed)
    preds, targets = [], []

    with torch.no_grad():
        for _, row in sample_df.iterrows():
            pos = row["pos"]
            wt_aa = row["wt_aa"]
            mt_aa = row["mt_aa"]
            mut_seq = row["mut_seq"]

            batch_data = [("mt", mut_seq)]
            _, _, tokens = batch_converter(batch_data)
            tokens = tokens.to(device)

            logits, _ = model(tokens)
            lp = torch.log_softmax(logits[0], dim=-1)

            token_pos = pos + 1
            if token_pos >= lp.shape[0]:
                continue

            wt_aa_id = alphabet.get_idx(wt_aa)
            mt_aa_id = alphabet.get_idx(mt_aa)

            score = (lp[token_pos, mt_aa_id] - lp[token_pos, wt_aa_id]).item()
            preds.append(score)
            targets.append(row["score"])

    if len(preds) < 3:
        return {"spearmanr": 0.0, "ndcg": 0.0, "n_samples": len(preds)}

    sp = spearmanr(preds, targets).statistic
    try:
        ndcg = ndcg_score(np.array(targets).reshape(1, -1), np.array(preds).reshape(1, -1))
    except Exception:
        ndcg = 0.0

    return {"spearmanr": sp, "ndcg": ndcg, "n_samples": len(preds)}


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train_stage1(
    protein,
    df,
    lora_r: int = 8,
    lr: float = 1e-4,
    epochs: int = 50,
    batch_size: int = 4,
    mask_ratio: float = 0.15,
    patience: int = 10,
    seed: int = 42,
    device=None,
    save_dir=None,
    save_every: int = 2,
    protected_positions=None,
):
    set_seed(seed)
    device = _resolve_device(device)
    print(f"\n[Stage 1] 设备: {device}")
    if device == "cuda":
        print(f"[Stage 1] GPU: {torch.cuda.get_device_name(0)}")

    # 加载 fair-esm ESM-2 35M
    print(f"[Stage 1] 加载 fair-esm ESM-2 35M")
    esm_base, alphabet = esm.pretrained.esm2_t12_35M_UR50D()
    batch_converter = alphabet.get_batch_converter()
    vocab_size = len(alphabet.all_toks)
    print(f"[Stage 1] vocab_size={vocab_size}, embed_dim={esm_base.embed_dim}, n_layers={esm_base.num_layers}")

    # 应用 LoRA
    print(f"[Stage 1] 应用 LoRA, rank={lora_r}")
    peft_model = apply_lora(esm_base, lora_r=lora_r, lora_alpha=lora_r * 2)

    # 包装成带 LM Head 的模型
    model = ESM2WithLMHead(peft_model, vocab_size)

    if hasattr(model.esm, "enable_input_require_grads"):
        model.esm.enable_input_require_grads()
    if hasattr(model.esm, "gradient_checkpointing_enable"):
        model.esm.gradient_checkpointing_enable(
            gradient_checkpointing_kwargs={"use_reentrant": False}
        )
        print("[Stage 1] 已启用梯度检查点")

    model = model.to(device)

    n_trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    n_total = sum(p.numel() for p in model.parameters())
    print(f"[Stage 1] 可训练参数: {n_trainable:,} / {n_total:,} ({100*n_trainable/n_total:.3f}%)")

    # 加载序列
    all_seqs = build_all_sequences_for_mlm(protein["wild_type"], df)
    print(f"[Stage 1] 可用序列数: {len(all_seqs)} (WT + {len(all_seqs)-1} 条突变)")

    optimizer = torch.optim.Adam(
        [p for p in model.parameters() if p.requires_grad],
        lr=lr,
        weight_decay=0.01,
    )

    warmup_steps = min(50, epochs // 5)

    def lr_lambda(step):
        if step < warmup_steps:
            return (step + 1) / warmup_steps
        total_cosine_steps = epochs - warmup_steps
        if total_cosine_steps <= 0:
            return 0.5
        progress = (step - warmup_steps) / total_cosine_steps
        return 0.5 * (1 + np.cos(np.pi * progress))

    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)

    scaler = GradScaler("cuda") if device.startswith("cuda") else None

    best_loss = float("inf")
    best_epoch = 0
    no_improve = 0

    for epoch in range(epochs):
        current_lr = optimizer.param_groups[0]["lr"]
        print(f"\n{'='*60}")
        print(f"[Stage 1] Epoch {epoch+1}/{epochs}, lr={current_lr:.6f}")
        print("=" * 60)

        epoch_seed = seed + epoch
        dataset = MLMDataset(
            all_seqs,
            alphabet,
            mask_ratio=mask_ratio,
            seed=epoch_seed,
            protected_positions=protected_positions,
        )
        loader = DataLoader(
            dataset,
            batch_size=batch_size,
            shuffle=True,
            collate_fn=mlm_collate(alphabet, batch_converter, device),
        )
        print(f"[Stage 1] Epoch {epoch+1}: {len(loader)} batches")

        model.train()
        epoch_loss = 0.0
        n_batches = 0

        for batch_idx, batch in enumerate(loader):
            optimizer.zero_grad()
            input_ids = batch["input_ids"]

            amp_device = (
                "cuda"
                if (isinstance(device, str) and device.startswith("cuda"))
                or (hasattr(device, "type") and device.type == "cuda")
                else "cpu"
            )
            with autocast(amp_device, dtype=torch.bfloat16, enabled=(amp_device == "cuda")):
                logits, _ = model(input_ids)
                loss = compute_mlm_loss(logits, batch, device)

            if loss.requires_grad:
                if scaler is not None:
                    scaler.scale(loss).backward()
                    scaler.unscale_(optimizer)
                else:
                    loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                if scaler is not None:
                    scaler.step(optimizer)
                    scaler.update()
                else:
                    optimizer.step()

            epoch_loss += loss.item()
            n_batches += 1

            if batch_idx % 50 == 0:
                print(f"  batch {batch_idx}/{len(loader)}, loss={loss.item():.4f}")

        avg_loss = epoch_loss / max(n_batches, 1)
        print(f"[Stage 1] Epoch {epoch+1} 完成, avg_loss={avg_loss:.4f}")

        scheduler.step()

        is_best = avg_loss < best_loss
        if is_best:
            best_loss = avg_loss
            best_epoch = epoch + 1
            no_improve = 0
        else:
            no_improve += 1

        if save_dir is not None:
            os.makedirs(save_dir, exist_ok=True)

            # 保存前先复制 state_dict，避免被后续 merge_and_unload() 修改
            model_state_snapshot = {k: v.cpu().clone() for k, v in model.state_dict().items()}

            ckpt = {
                "epoch": epoch,
                "model_state": model_state_snapshot,
                "optimizer_state": optimizer.state_dict(),
                "scheduler_state": scheduler.state_dict(),
                "scaler_state": scaler.state_dict() if scaler is not None else None,
                "best_loss": best_loss,
                "best_epoch": best_epoch,
                "avg_loss": avg_loss,
                "config": {
                    "model": PROTEIN_MODEL_NAME,
                    "lora_r": lora_r, "lr": lr, "epochs": epochs,
                    "batch_size": batch_size, "mask_ratio": mask_ratio,
                    "patience": patience, "seed": seed,
                    "vocab_size": vocab_size,
                },
            }
            torch.save(ckpt, f"{save_dir}/last.pt")
            if is_best:
                torch.save(ckpt, f"{save_dir}/best.pt")
                print(f"[Stage 1] ★ 最佳模型 (epoch={epoch+1}, loss={avg_loss:.4f})")

            # 保存 Stage 2 兼容权重（merge 后纯 ESM-2 state_dict）
            if is_best or (epoch + 1) % save_every == 0:
                merged_esm = model.esm.merge_and_unload()
                esm_state = merged_esm.state_dict()
                torch.save(esm_state, f"{save_dir}/esm_encoder.pt")

            if (epoch + 1) % save_every == 0:
                torch.save(ckpt, f"{save_dir}/epoch_{epoch+1}.pt")

        if no_improve >= patience:
            print(f"[Stage 1] 早停: {no_improve} 轮 loss 无改善, 最佳 epoch={best_epoch}, loss={best_loss:.4f}")
            break

    # Reload the best checkpoint into a *fresh* model. The training loop
    # may have called `merge_and_unload()` on `model` for esm_encoder.pt
    # dumping, which permanently mutates the in-memory encoder from
    # "LoRA-wrapped" to "merged". The best.pt snapshot, by contrast,
    # captures the *pre-merge* state, so reloading it into the already-
    # merged `model` would produce `Missing key(s) / Unexpected key(s)`
    # errors. Build a new LoRA-wrapped model just for the reload.
    if save_dir is not None:
        best_path = f"{save_dir}/best.pt"
        if os.path.exists(best_path):
            ckpt = torch.load(best_path, map_location=device, weights_only=False)
            fresh_esm_base, _ = esm.pretrained.esm2_t12_35M_UR50D()
            fresh_peft = apply_lora(fresh_esm_base, lora_r=lora_r, lora_alpha=lora_r * 2)
            fresh_model = ESM2WithLMHead(fresh_peft, vocab_size)
            fresh_model.load_state_dict(ckpt["model_state"])
            model = fresh_model.to(device)
            print(f"[Stage 1] 已恢复最佳模型 (epoch={ckpt['best_epoch']}, loss={ckpt['best_loss']:.4f})")

    print("\n[Stage 1] 最终 DMS zero-shot 验证...")
    final_metrics = validate_on_dms(
        model, df, alphabet, batch_converter, device, n_samples=len(df), seed=seed
    )
    print(
        f"[Stage 1] 最终 Zero-shot: Spearman={final_metrics['spearmanr']:.3f}, "
        f"NDCG={final_metrics['ndcg']:.3f} (n={final_metrics['n_samples']})"
    )

    return {
        "best_loss": best_loss,
        "best_epoch": best_epoch,
        "final_spearman": final_metrics["spearmanr"],
        "final_ndcg": final_metrics["ndcg"],
        "config": {
            "model": PROTEIN_MODEL_NAME,
            "lora_r": lora_r, "lr": lr, "epochs": epochs,
            "batch_size": batch_size, "mask_ratio": mask_ratio,
            "patience": patience, "seed": seed,
            "vocab_size": vocab_size,
        },
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _load_yaml_config(path: str | None) -> dict:
    if path is None:
        return {}
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    # Allow flat keys or nested under "stage1"
    if "stage1" in cfg and isinstance(cfg["stage1"], dict):
        cfg = {**cfg, **cfg["stage1"]}
    return cfg


def _build_argparser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Stage 1: fair-esm ESM-2 35M MLM 自适应")
    parser.add_argument("--config", type=str, default=None,
                        help="YAML config file (overridden by explicit CLI flags)")
    parser.add_argument("--lora_r", "-r", type=int, default=8)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--epochs", "-e", type=int, default=50)
    parser.add_argument("--batch_size", "-b", type=int, default=4)
    parser.add_argument("--mask_ratio", "-mr", type=float, default=0.15)
    parser.add_argument("--patience", "-pt", type=int, default=10)
    parser.add_argument("--seed", "-s", type=int, default=42)
    parser.add_argument("--save_every", "-se", type=int, default=2)
    parser.add_argument("--save_name", "-n", type=str, default="stage1")
    parser.add_argument("--data_path", type=str, default=None,
                        help="Stage 1 数据 pkl 路径（默认 data/MAB2962_v1.pkl）")
    parser.add_argument("--protein_key", type=str, default=None,
                        help="pkl 顶层 key（如 MAB2962_Araya_2026），默认按文件名推断")
    parser.add_argument("--cpu", action="store_true")
    parser.add_argument("--checkpoint_dir", type=str, default=None,
                        help="checkpoint 输出根目录（默认 submission/njtech-syncar/results/checkpoints）")
    return parser


def main() -> None:
    parser = _build_argparser()
    args = parser.parse_args()

    cfg = _load_yaml_config(args.config)
    # CLI flags take precedence over YAML
    for k, v in cfg.items():
        if not hasattr(args, k):
            continue
        cli_default = _build_argparser().get_default(k)
        if getattr(args, k) == cli_default:
            setattr(args, k, v)

    print("=" * 60)
    print("Stage 1: fair-esm ESM-2 35M MLM 自适应")
    print("=" * 60)
    print(f"模型: {PROTEIN_MODEL_NAME}")
    print(f"LoRA rank={args.lora_r}, lr={args.lr}, epochs={args.epochs}, "
          f"batch_size={args.batch_size}, mask_ratio={args.mask_ratio}")

    if args.data_path is None:
        pkl_path = DATA_DIR / "MAB2962_v1.pkl"
    else:
        pkl_path = Path(args.data_path)
    if not pkl_path.exists():
        print(f"数据文件不存在: {pkl_path}")
        return

    data = torch.load(pkl_path, weights_only=False)

    if args.protein_key is not None:
        key = args.protein_key
    else:
        candidates = [k for k in data.keys() if not k.startswith("_")]
        if len(candidates) == 1:
            key = candidates[0]
        else:
            stem = pkl_path.stem
            key = stem
            if key not in data:
                key = candidates[0]
    entry = data[key]
    protein = {"wild_type": entry["wild_type"]}
    df = entry["df"]
    print(f"数据文件: {pkl_path}")
    print(f"pkl key: {key}")
    print(f"WT长度={len(protein['wild_type'])}, 突变数={len(df)}")

    device = "cpu" if args.cpu else None
    checkpoint_root = Path(args.checkpoint_dir) if args.checkpoint_dir else DEFAULT_CHECKPOINT_DIR
    save_dir = checkpoint_root / args.save_name

    results = train_stage1(
        protein=protein,
        df=df,
        lora_r=args.lora_r,
        lr=args.lr,
        epochs=args.epochs,
        batch_size=args.batch_size,
        mask_ratio=args.mask_ratio,
        patience=args.patience,
        seed=args.seed,
        device=device,
        save_dir=str(save_dir),
        save_every=args.save_every,
    )

    torch.save(results, save_dir / "results.pt")
    print(f"\n[Stage 1] 结果已保存: {save_dir}")
    print(f"[Stage 1] 最佳 loss: {results['best_loss']:.4f}, 最佳 epoch: {results['best_epoch']}")
    print(f"[Stage 1] 最终 Zero-shot Spearman: {results['final_spearman']:.3f}")


if __name__ == "__main__":
    main()
