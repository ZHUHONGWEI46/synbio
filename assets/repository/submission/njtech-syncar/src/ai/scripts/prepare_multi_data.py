"""
合并单点和双点突变数据，生成统一格式的 pkl 文件
================================================

输出: ``<project>/data/MAB2962_multi_v1.pkl``

Usage (from ``src/ai/``):
    python -m scripts.prepare_multi_data
    python -m scripts.prepare_multi_data --double_csv MAB2962_double_mutations.csv
"""
from __future__ import annotations

import argparse
import ast
import os
import sys
from pathlib import Path

import pandas as pd
import torch

# Make ``data`` importable for shared constants
_THIS_DIR = Path(__file__).resolve().parent
_AI_ROOT = _THIS_DIR.parent
if str(_AI_ROOT) not in sys.path:
    sys.path.insert(0, str(_AI_ROOT))

# Project-level data directory
_PROJECT_ROOT = _AI_ROOT.parent.parent
DATA_DIR = _PROJECT_ROOT / "data"


def load_single_mutations(data):
    """从 pkl 加载单点突变数据"""
    entry = data["MAB2962_Araya_2026"]
    df = entry["df"]
    wt_seq = entry["wild_type"]

    records = []
    for _, row in df.iterrows():
        pos = row["pos"]  # 0-indexed
        mut = row["mutant"]
        score = row["score"]

        # 生成突变序列
        mut_seq = wt_seq[:pos] + mut[-1] + wt_seq[pos + 1:]

        records.append({
            "mutant": mut,
            "wt_seq": wt_seq,
            "mut_seq": mut_seq,
            "positions": [pos],  # list 格式，统一处理
            "score": score,
            "type": "single",
        })

    return records


def load_double_mutations(wt_seq, csv_filename="MAB2962_double_mutations.csv"):
    """从 CSV 加载双点突变数据"""
    csv_path = DATA_DIR / csv_filename
    df = pd.read_csv(csv_path)

    records = []
    for _, row in df.iterrows():
        mut = row["mutation"]
        score = row["activity"]
        fasta_positions = ast.literal_eval(row["fasta_positions"])  # 1-indexed

        # 转换为 0-indexed
        positions = [p - 1 for p in fasta_positions]

        # 生成双点突变序列
        mut_seq = list(wt_seq)
        for i, pos in enumerate(positions):
            # 从突变名称中提取目标残基
            parts = mut.split("+")
            new_aa = parts[i][-1]
            mut_seq[pos] = new_aa
        mut_seq = "".join(mut_seq)

        records.append({
            "mutant": mut,
            "wt_seq": wt_seq,
            "mut_seq": mut_seq,
            "positions": positions,
            "score": score,
            "type": "double",
        })

    return records


def main() -> None:
    parser = argparse.ArgumentParser(description="合并单点和双点突变数据")
    parser.add_argument("--double_csv", type=str, default="MAB2962_double_mutations.csv",
                        help="双点突变 CSV 文件名（位于 data/ 下）")
    args = parser.parse_args()

    print("=" * 60)
    print("合并单点 + 双点突变数据")
    print("=" * 60)

    pkl_path = DATA_DIR / "MAB2962_v1.pkl"
    data = torch.load(pkl_path, weights_only=False)
    wt_seq = data["MAB2962_Araya_2026"]["wild_type"]
    print(f"WT序列长度: {len(wt_seq)}")

    single_records = load_single_mutations(data)
    print(f"单点突变: {len(single_records)} 条")

    double_records = load_double_mutations(wt_seq, args.double_csv)
    print(f"双点突变: {len(double_records)} 条")

    all_records = single_records + double_records

    print("\n验证突变序列:")
    for rec in all_records[:3]:
        print(f"  {rec['mutant']}: positions={rec['positions']}, score={rec['score']:.2f}")
    print("  ...")

    scores = [r["score"] for r in all_records]
    print(f"\n合并后总计: {len(all_records)} 条")
    print(f"  单点: {len(single_records)} 条, score范围 "
          f"[{min(r['score'] for r in single_records):.2f}, {max(r['score'] for r in single_records):.2f}]")
    print(f"  双点: {len(double_records)} 条, score范围 "
          f"[{min(r['score'] for r in double_records):.2f}, {max(r['score'] for r in double_records):.2f}]")

    output_path = DATA_DIR / "MAB2962_multi_v1.pkl"
    torch.save({
        "MAB2962_multi": {
            "wild_type": wt_seq,
            "records": all_records,
        }
    }, output_path)
    print(f"\n已保存: {output_path}")


if __name__ == "__main__":
    main()
