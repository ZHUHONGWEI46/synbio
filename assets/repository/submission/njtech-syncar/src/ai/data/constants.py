"""
共享常量与工具函数
==================

所有模块共享的常量、工具函数，避免魔法数字和代码重复。

Constants:
    FASTA_OFFSET: FASTA内部位置与实验记录编号之间的偏移
    PROJECT_ROOT: 项目根目录路径
    DATA_DIR: 数据目录
    CHECKPOINT_DIR: checkpoint 目录

Functions:
    get_project_root(): 获取项目根目录
    set_seed(): 设置随机种子
    parse_mutation(): 解析突变字符串 'S229G' -> (wt, pos, mt, fasta_pos)
    validate_mutation(): 验证突变与WT序列的一致性
"""

import os
import re
import random
import numpy as np
import torch

# ══════════════════════════════════════════════════════════════
# 路径常量
# ══════════════════════════════════════════════════════════════

# 项目根目录：src/ai/data/constants.py → strip 4 path segments →
# submission/njtech-syncar/. Then DATA_DIR sits next to ``src/``.
# Resolution matches data/preprocess.py exactly (same end-result).
_CURRENT_FILE = os.path.abspath(__file__)
_PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(_CURRENT_FILE)
        )
    )
)

DATA_DIR = os.path.join(_PROJECT_ROOT, 'data')
CHECKPOINT_DIR = os.path.join(_PROJECT_ROOT, 'results', 'checkpoints')
OUTPUT_DIR = os.path.join(_PROJECT_ROOT, 'results')


# ══════════════════════════════════════════════════════════════
# 编号系统常量
# ══════════════════════════════════════════════════════════════

# 编号系统：Excel突变命名 = 原始蛋白编号
# FASTA序列 = 原始蛋白（如果必要，去除N端若干 aa）
# FASTA内部位置 = Excel编号 + FASTA_OFFSET
FASTA_OFFSET = 0


# ══════════════════════════════════════════════════════════════
# 工具函数
# ══════════════════════════════════════════════════════════════

def get_project_root() -> str:
    """获取项目根目录"""
    return _PROJECT_ROOT


def set_seed(seed: int = 42):
    """设置随机种子（CPU + GPU）"""
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    random.seed(seed)


# ══════════════════════════════════════════════════════════════
# 突变解析
# ══════════════════════════════════════════════════════════════

# 突变字符串正则表达式
MUTATION_PATTERN = re.compile(r'^([A-Z])(\d+)([A-Z])$')


def parse_mutation(mutation_str: str) -> tuple:
    """
    解析突变字符串，返回 (wt, pos, mt, fasta_pos)

    Args:
        mutation_str: 突变字符串，如 'S229G'

    Returns:
        (wt, pos, mt, fasta_pos)
        - wt: 野生型氨基酸单字母码
        - pos: Excel编号（1-indexed）
        - mt: 突变后氨基酸单字母码
        - fasta_pos: FASTA内部位置（1-indexed）

    Raises:
        ValueError: 无法解析突变字符串

    Examples:
        >>> parse_mutation('S229G')
        ('S', 229, 'G', 229)
    """
    mutation_str = mutation_str.strip()
    m = MUTATION_PATTERN.match(mutation_str)
    if not m:
        raise ValueError(f"无法解析突变: {mutation_str}，期望格式如 S229G")

    wt = m.group(1)
    pos = int(m.group(2))
    mt = m.group(3)
    fasta_pos = pos + FASTA_OFFSET

    return wt, pos, mt, fasta_pos


def parse_mutation_full(mutation_str: str) -> tuple:
    """
    解析突变字符串，返回完整的5元组（含idx）

    Returns:
        (wt, orig_pos, idx, mt, fasta_pos)
        - idx: 0-indexed数组索引 = fasta_pos - 1

    与 parse_mutation 兼容，但额外返回 idx
    """
    wt, pos, mt, fasta_pos = parse_mutation(mutation_str)
    return wt, pos, fasta_pos - 1, mt, fasta_pos


# 向后兼容别名（供旧代码使用）
parse_mutation_str = parse_mutation_full


def validate_mutation(mutation_str: str, wt_sequence: str) -> bool:
    """
    验证突变与WT序列的一致性

    Args:
        mutation_str: 突变字符串，如 'S229G'
        wt_sequence: 野生型序列

    Returns:
        True 如果WT匹配，否则 False
    """
    try:
        wt, pos, mt, fasta_pos = parse_mutation(mutation_str)
        idx = fasta_pos - 1  # 转为0-indexed
        if not (0 <= idx < len(wt_sequence)):
            return False
        return wt_sequence[idx] == wt
    except (ValueError, IndexError):
        return False


def parse_mutation_list(mutation_str: str) -> list:
    """
    解析多位点突变字符串，返回单突变列表

    支持格式:
        - 'S229G' -> ['S229G']
        - 'S229G+E154S' -> ['S229G', 'E154S']
        - 'S229G+V231E+Y157H' -> ['S229G', 'V231E', 'Y157H']

    Args:
        mutation_str: 多位点突变字符串

    Returns:
        单突变字符串列表

    Raises:
        ValueError: 无法解析
    """
    parts = mutation_str.replace('+', ' ').split()
    result = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if not MUTATION_PATTERN.match(part):
            raise ValueError(f"无法解析突变: {part}，期望格式如 S229G")
        result.append(part)
    return result


def get_fasta_pos(mutation_str: str) -> int:
    """从突变字符串获取FASTA内部位置（1-indexed）"""
    _, _, _, fasta_pos = parse_mutation(mutation_str)
    return fasta_pos


def get_idx(mutation_str: str) -> int:
    """从突变字符串获取0-indexed位置（用于数组索引）"""
    _, _, _, fasta_pos = parse_mutation(mutation_str)
    return fasta_pos - 1


def apply_mutations(wt_sequence: str, mutations: list) -> str:
    """
    在WT序列上应用突变，返回突变后的序列

    Args:
        wt_sequence: 野生型序列
        mutations: 突变字符串列表，如 ['S229G', 'E154S']

    Returns:
        突变后的序列
    """
    seq = list(wt_sequence)
    for m in mutations:
        _, _, mt, fasta_pos = parse_mutation(m)
        idx = fasta_pos - 1
        if 0 <= idx < len(seq):
            seq[idx] = mt
    return ''.join(seq)
