"""
MAB2962 数据预处理
================

从原始 Excel + FASTA 重建训练数据，整合新实验数据。

编号系统（2026-04-29）：
  Excel 突变命名 = 原始蛋白编号（如 S229G = 原始蛋白位置 229）
  FASTA 序列 = 当前提交数据中的 MAB2962 序列
  偏移关系：FASTA 内部位置 = Excel 编号 + ORIGINAL_PROTEIN_OFFSET

数据来源：
  1. MAB2962相关信息.xlsx

CLI 入口见 ``src/ai/scripts/preprocess.py``。
"""

import os
import re

import pandas as pd
import torch

# Project-level data directory: this file lives at src/ai/data/preprocess.py,
# so ../../data is the top-level submission data directory.
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(_THIS_DIR, '..', '..', '..', 'data'))

ORIGINAL_PROTEIN_OFFSET = 0  # 当前提交数据中 FASTA 内部位置与 Excel 编号一致


def load_old_excel_mutations():
    """从旧 Excel 读取突变数据（MAB2962相关信息.xlsx）"""
    excel_path = os.path.join(DATA_DIR, 'MAB2962相关信息.xlsx')
    df_excel = pd.read_excel(excel_path, sheet_name='Sheet1', header=None)
    wt = str(df_excel.iloc[0, 1]).strip()

    mutations = []
    for i in range(5, len(df_excel)):
        name_raw = str(df_excel.iloc[i, 0]).strip()
        activity = df_excel.iloc[i, 1]
        if pd.isna(name_raw) or pd.isna(activity):
            continue
        if '野生型' in name_raw:
            continue
        try:
            activity = float(activity)
        except (ValueError, TypeError):
            continue
        match = re.match(r'^([A-Z])([0-9]+)([A-Z])$', name_raw)
        if not match:
            continue
        excel_pos = int(match.group(2))
        alt_aa = match.group(3)
        fasta_pos = excel_pos + ORIGINAL_PROTEIN_OFFSET
        if not (1 <= fasta_pos <= len(wt)):
            continue
        mutations.append({
            'excel_pos': excel_pos,
            'fasta_pos': fasta_pos,
            'alt_aa': alt_aa,
            'activity': activity,
            'excel_name': name_raw,
            'source': 'old',
        })
    return wt, mutations


def load_new_excel_mutations(excel_filename='20260416-MAB2962蛋白单双突变结果.xlsx'):
    """
    从新 Excel 读取突变数据。
    左侧列(A,B)=单点，右侧列(F,G)=双点。
    单点按 ORIGINAL_PROTEIN_OFFSET 转换，双点直接解析。
    """
    excel_path = os.path.join(DATA_DIR, excel_filename)
    df_excel = pd.read_excel(excel_path, sheet_name='Sheet1', header=None)
    n_cols = df_excel.shape[1]

    singles = []
    for i in range(1, len(df_excel)):
        name_raw = str(df_excel.iloc[i, 0]).strip()
        act_str = str(df_excel.iloc[i, 1]).strip() if n_cols > 1 else ''
        if pd.isna(name_raw) or name_raw in ('nan', 'MAB2962', '野生型', 'WT'):
            continue
        try:
            activity = float(act_str)
        except Exception:
            continue
        match = re.match(r'^([A-Z])([0-9]+)([A-Z])$', name_raw)
        if match:
            excel_pos = int(match.group(2))
            alt_aa = match.group(3)
            singles.append({
                'excel_pos': excel_pos,
                'fasta_pos': excel_pos + ORIGINAL_PROTEIN_OFFSET,
                'alt_aa': alt_aa,
                'activity': activity,
                'excel_name': name_raw,
                'source': 'new',
            })

    doubles = []
    if n_cols >= 7:
        double_name_col, double_activity_col = 5, 6
    elif n_cols >= 5:
        double_name_col, double_activity_col = 3, 4
    else:
        double_name_col, double_activity_col = None, None

    for i in range(1, len(df_excel)):
        if double_name_col is None:
            break
        name_raw = str(df_excel.iloc[i, double_name_col]).strip()
        act_str = str(df_excel.iloc[i, double_activity_col]).strip()
        if pd.isna(name_raw) or name_raw in ('nan', ''):
            continue
        try:
            activity = float(act_str)
        except Exception:
            activity = None
        doubles.append({'name': name_raw, 'activity': activity, 'source': 'new'})
    return singles, doubles


def merge_mutations(old_muts, new_singles):
    """
    合并新旧单点突变数据。
    新数据优先（覆盖旧数据中相同的条目）。
    返回 DataFrame，含 mutation, fasta_pos, ref_aa, alt_aa, activity
    """
    seen = {}  # (fasta_pos, alt_aa) -> {'activity': ..., 'source': ...}

    for m in old_muts:
        key = (m['fasta_pos'], m['alt_aa'])
        seen[key] = {'activity': m['activity'], 'source': 'old'}

    for m in new_singles:
        key = (m['fasta_pos'], m['alt_aa'])
        seen[key] = {'activity': m['activity'], 'source': 'new'}

    # 从旧Excel获取WT序列
    excel_path = os.path.join(DATA_DIR, 'MAB2962相关信息.xlsx')
    df_excel = pd.read_excel(excel_path, sheet_name='Sheet1', header=None)
    wt = str(df_excel.iloc[0, 1]).strip()

    rows = []
    for (fasta_pos, alt_aa), info in sorted(seen.items()):
        if not (1 <= fasta_pos <= len(wt)):
            continue
        ref_aa = wt[fasta_pos - 1]
        if ref_aa == alt_aa:
            continue
        excel_pos = fasta_pos - ORIGINAL_PROTEIN_OFFSET
        mutation = f"{ref_aa}{excel_pos}{alt_aa}"
        rows.append({
            'mutation': mutation,
            'fasta_pos': fasta_pos,
            'ref_aa': ref_aa,
            'alt_aa': alt_aa,
            'activity': info['activity'],
            'bin': 1 if info['activity'] >= 1.0 else 0,
            'source': info['source'],
        })
    return pd.DataFrame(rows)


def parse_double_mutations(doubles, wt):
    """解析双点突变，返回 DataFrame"""
    rows = []
    for d in doubles:
        if d['activity'] is None:
            continue
        parts = d['name'].split('-')
        if len(parts) != 2:
            continue
        mutations = []
        valid = True
        for part in parts:
            m = re.match(r'^([A-Z])([0-9]+)([A-Z])$', part.strip())
            if not m:
                valid = False
                break
            wt_aa, excel_pos, mt = m.group(1), int(m.group(2)), m.group(3)
            fasta_pos = excel_pos + ORIGINAL_PROTEIN_OFFSET
            if not (1 <= fasta_pos <= len(wt)):
                valid = False
                break
            if wt[fasta_pos - 1] != wt_aa:
                valid = False
                break
            mutations.append({'fasta_pos': fasta_pos, 'wt': wt_aa, 'mt': mt})
        if not valid:
            continue
        # 命名：按fasta_pos排序
        mutations.sort(key=lambda x: x['fasta_pos'])
        double_name = '+'.join(f"{m['wt']}{m['fasta_pos']-ORIGINAL_PROTEIN_OFFSET}{m['mt']}" for m in mutations)
        fasta_positions = [m['fasta_pos'] for m in mutations]
        rows.append({
            'mutation': double_name,
            'fasta_positions': fasta_positions,
            'activity': d['activity'],
            'bin': 1 if d['activity'] >= 1.0 else 0,
        })
    return pd.DataFrame(rows)


def build_all_sequences_for_mlm(wt, df):
    """
    Stage 1 MLM 自适应所需的所有序列（WT + 所有单点突变）。
    兼容列名：
      - fasta_pos (1-indexed) 或 pos (0-indexed)
      - alt_aa 或 mt_aa
    """
    pos_col = 'fasta_pos' if 'fasta_pos' in df.columns else 'pos'
    alt_col = 'alt_aa' if 'alt_aa' in df.columns else 'mt_aa'
    sequences = [wt]
    for _, row in df.iterrows():
        seq_list = list(wt)
        if pos_col == 'fasta_pos':
            idx = row['fasta_pos'] - 1  # 1-indexed -> 0-indexed
        else:
            idx = int(row['pos'])  # already 0-indexed
        seq_list[idx] = row[alt_col]
        sequences.append(''.join(seq_list))
    return sequences


def stratified_split(df, train_size, seed=42):
    import numpy as np
    np.random.seed(seed)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    if 'bin' in df.columns and df['bin'].notna().any():
        train_pos = df[df['bin'] == 1].sample(n=min(train_size // 2, len(df[df['bin'] == 1])), random_state=seed)
        train_neg = df[df['bin'] == 0].sample(n=min(train_size - len(train_pos), len(df[df['bin'] == 0])), random_state=seed)
        train_idx = train_pos.index.union(train_neg.index).tolist()
    else:
        train_idx = df.sample(n=min(train_size, len(df)), random_state=seed).index.tolist()
    train_df = df.loc[train_idx].copy().reset_index(drop=True)
    test_df = df.drop(train_idx).copy().reset_index(drop=True)
    return train_df, test_df


def main():
    import argparse

    parser = argparse.ArgumentParser(description='MAB2962 数据预处理')
    parser.add_argument('--new_data_excel', type=str, default='20260416-MAB2962蛋白单双突变结果.xlsx',
                        help='包含新增单/双点实验结果的 Excel 文件名（位于 data/ 下）')
    args = parser.parse_args()

    print("=" * 60)
    print(f"MAB2962 数据预处理 v8（整合新实验数据 {args.new_data_excel}）")
    print("=" * 60)

    # 1. 加载数据
    wt, old_muts = load_old_excel_mutations()
    new_singles, new_doubles = load_new_excel_mutations(args.new_data_excel)
    print(f"WT序列长度: {len(wt)}")
    print(f"旧Excel条目: {len(old_muts)}")
    print(f"新Excel单点: {len(new_singles)}, 双点: {len(new_doubles)}")

    # 2. 合并
    df = merge_mutations(old_muts, new_singles)
    print(f"\n合并后单点突变数: {len(df)}")
    print(f"  仅旧数据: {(df['source']=='old').sum()}")
    print(f"  仅新数据: {(df['source']=='new').sum()}")
    print(f"  活性范围: [{df['activity'].min():.4f}, {df['activity'].max():.4f}]")
    print(f"  高活性(>=1x): {(df['activity']>=1.0).sum()}, 低活性: {(df['activity']<1.0).sum()}")

    # 3. 解析双点
    df_double = parse_double_mutations(new_doubles, wt)
    print(f"\n双点突变（解析后）: {len(df_double)} 个")
    for _, r in df_double.sort_values('activity', ascending=False).head(10).iterrows():
        print(f"  {r['mutation']:30s}  活性={r['activity']:.4f}")

    # 4. 验证
    errors = 0
    for _, row in df.iterrows():
        if wt[row['fasta_pos'] - 1] != row['ref_aa']:
            errors += 1
    print(f"\n验证: {len(df) - errors}/{len(df)} 突变第一字母与FASTA匹配")

    # 5. 保存 CSV（单点）
    csv_path = os.path.join(DATA_DIR, 'MAB2962_Araya_2026.csv')
    df.to_csv(csv_path, index=False)
    print(f"已保存: {csv_path}")

    # 6. 保存双点 CSV
    double_csv_path = os.path.join(DATA_DIR, 'MAB2962_double_mutations.csv')
    df_double.to_csv(double_csv_path, index=False)
    print(f"已保存: {double_csv_path}")

    # 7. 保存 pkl
    pkl_path = os.path.join(DATA_DIR, 'MAB2962_v1.pkl')
    df_for_pkl = df.rename(columns={
        'mutation': 'mutant',
        'ref_aa': 'wt_aa',
        'alt_aa': 'mt_aa',
        'fasta_pos': 'pos',
        'activity': 'score',
    }).drop(columns=['source'])
    df_for_pkl['pos'] = df_for_pkl['pos'] - 1
    df_for_pkl['wt_seq'] = wt
    mut_seqs = []
    for _, row in df_for_pkl.iterrows():
        seq_list = list(wt)
        seq_list[row['pos']] = row['mt_aa']
        mut_seqs.append(''.join(seq_list))
    df_for_pkl['mut_seq'] = mut_seqs
    pkl_data = {'MAB2962_Araya_2026': {'df': df_for_pkl, 'wild_type': wt}}
    torch.save(pkl_data, pkl_path)
    print(f"已保存: {pkl_path}")

    # 8. 保存序列列表
    seqs = build_all_sequences_for_mlm(wt, df)
    seq_path = os.path.join(DATA_DIR, 'all_sequences.txt')
    with open(seq_path, 'w') as f:
        for s in seqs:
            f.write(s + '\n')
    print(f"已保存: {seq_path} ({len(seqs)} 条序列)")

    # 9. 保存 FASTA
    fasta_path = os.path.join(DATA_DIR, 'MAB2962_WT.fasta')
    with open(fasta_path, 'w') as f:
        f.write(f">WT\n{wt}\n")
    print(f"已保存: {fasta_path}")

    print("\n预处理完成!")


if __name__ == '__main__':
    main()
