"""
Leakage-safe full retraining pipeline
=====================================

Combines Stage 1 + Stage 2 into a single CV pipeline that ensures no
Stage 2 test sample ever sees the corresponding single-mutant in the
Stage 1 MLM training set:

    1. Split Stage 2 data into K folds (stratified by ``type`` + score-bin).
    2. For each fold:
        * Build a Stage-1 training subset by removing any single mutant
          that overlaps with the fold's test set.
        * Train Stage 1 with the held-out positions protected from MLM
          masking.
    3. Use the fold-specific Stage 1 weights to warm-start the
       corresponding Stage 2 fold.

Usage (from ``src/ai/``):
    python -m scripts.run_full_pipeline_leakage_safe --save_name v12_multi --cv 4
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd
import torch
from sklearn.model_selection import StratifiedKFold

# Make ``scripts`` importable so we can re-use the stage trainers directly
_THIS_DIR = Path(__file__).resolve().parent
_AI_ROOT = _THIS_DIR.parent
if str(_AI_ROOT) not in sys.path:
    sys.path.insert(0, str(_AI_ROOT))

from scripts.train_stage1 import train_stage1  # noqa: E402
from scripts.train_stage2 import train_stage2  # noqa: E402

_PROJECT_ROOT = _AI_ROOT.parent.parent
DATA_DIR = _PROJECT_ROOT / "data"
CHECKPOINT_DIR = _PROJECT_ROOT / "results" / "checkpoints"


def load_stage_data():
    stage1_data = torch.load(DATA_DIR / "MAB2962_v1.pkl", weights_only=False)
    single_entry = stage1_data["MAB2962_Araya_2026"]
    protein = {"wild_type": single_entry["wild_type"]}
    single_df = single_entry["df"].copy()

    stage2_data = torch.load(DATA_DIR / "MAB2962_multi_v1.pkl", weights_only=False)
    multi_entry = stage2_data["MAB2962_multi"]
    records = [dict(r) for r in multi_entry["records"]]
    return protein, single_df, records


def make_stage2_fold_indices(records, n_splits: int = 4, seed: int = 42):
    df = pd.DataFrame(records)
    stratify = df["type"].astype(str) + "_" + (df["score"] >= 1.0).astype(int).astype(str)
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=seed)
    return [
        {"train_idx": train_idx.tolist(), "test_idx": test_idx.tolist()}
        for train_idx, test_idx in skf.split(df, stratify)
    ]


def build_stage1_training_subset(single_df, held_out_record_indices, all_records):
    held_out_mutants = {
        all_records[idx]["mutant"]
        for idx in held_out_record_indices
        if all_records[idx].get("type") == "single"
    }
    if not held_out_mutants:
        return single_df.copy().reset_index(drop=True)
    train_df = single_df[~single_df["mutant"].isin(held_out_mutants)].copy().reset_index(drop=True)
    return train_df


def build_protected_positions(stage1_train_df):
    positions = stage1_train_df["pos"].astype(int).tolist()
    return {seq_idx + 1: {pos} for seq_idx, pos in enumerate(positions)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Leakage-safe full retraining pipeline")
    parser.add_argument("--save_name", type=str, default="v12_multi")
    parser.add_argument("--cv", type=int, default=4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--stage1_epochs", type=int, default=50)
    parser.add_argument("--stage2_epochs", type=int, default=15)
    parser.add_argument("--stage1_batch_size", type=int, default=4)
    parser.add_argument("--stage2_batch_size", type=int, default=8)
    parser.add_argument("--cpu", action="store_true")
    parser.add_argument("--checkpoint_dir", type=str, default=None)
    args = parser.parse_args()

    protein, single_df, records = load_stage_data()
    stage2_fold_indices = make_stage2_fold_indices(records, n_splits=args.cv, seed=args.seed)

    ckpt_root = Path(args.checkpoint_dir) if args.checkpoint_dir else CHECKPOINT_DIR
    save_dir = ckpt_root / args.save_name
    save_dir.mkdir(parents=True, exist_ok=True)
    torch.save({"fold_indices": stage2_fold_indices}, save_dir / "stage2_fold_indices.pt")

    device = "cpu" if args.cpu else None
    stage1_dirs = []

    print("=" * 70)
    print("Leakage-safe full pipeline")
    print("=" * 70)
    print(f"Stage1 singles: {len(single_df)}")
    print(f"Stage2 total records: {len(records)}")
    print(f"Save name: {args.save_name}")

    for fold_idx, split in enumerate(stage2_fold_indices, start=1):
        test_idx = split["test_idx"]
        stage1_train_df = build_stage1_training_subset(single_df, test_idx, records)
        protected_positions = build_protected_positions(stage1_train_df)
        fold_stage1_dir = save_dir / f"stage1_fold{fold_idx}"

        print("\n" + "=" * 70)
        print(f"[Pipeline] Stage1 fold {fold_idx}/{args.cv}")
        print(f"[Pipeline] held-out Stage2 test samples: {len(test_idx)}")
        print(f"[Pipeline] Stage1 train singles: {len(stage1_train_df)}")
        print("=" * 70)

        result = train_stage1(
            protein=protein,
            df=stage1_train_df,
            epochs=args.stage1_epochs,
            batch_size=args.stage1_batch_size,
            seed=args.seed + fold_idx - 1,
            device=device,
            save_dir=str(fold_stage1_dir),
            protected_positions=protected_positions,
        )
        torch.save(result, fold_stage1_dir / "results.pt")
        stage1_dirs.append(str(fold_stage1_dir))

    print("\n" + "=" * 70)
    print("[Pipeline] Stage2 training with fixed fold splits")
    print("=" * 70)

    stage2_result = train_stage2(
        protein=protein,
        records=records,
        stage1_dir=stage1_dirs,
        epochs=args.stage2_epochs,
        batch_size=args.stage2_batch_size,
        cross_validation=args.cv,
        seed=args.seed,
        device=device,
        save_name=args.save_name,
        fold_indices=stage2_fold_indices,
    )

    torch.save(
        {
            "stage1_dirs": stage1_dirs,
            "stage2_fold_indices": stage2_fold_indices,
            "stage2_result": stage2_result,
        },
        save_dir / "pipeline_summary.pt",
    )


if __name__ == "__main__":
    main()
