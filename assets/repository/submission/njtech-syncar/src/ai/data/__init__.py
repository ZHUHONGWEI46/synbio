"""
src/ai/data
============

Data loading and preprocessing for the MAB2962 mutation-effect pipeline.

Public API:
    - `load_old_excel_mutations`, `load_new_excel_mutations`,
      `merge_mutations`, `parse_double_mutations`,
      `build_all_sequences_for_mlm`, `stratified_split`
      (from ``preprocess``) — see ``scripts/preprocess.py`` for the CLI.
    - Shared constants and mutation-string utilities from ``constants``.

The project-level data directory used by these helpers is
``submission/njtech-syncar/data/`` (resolved by walking four levels up
from this file). Constants exposed under :data:`src.ai.data.constants`
use the same resolution so all data lookups agree.
"""

from .preprocess import (
    ORIGINAL_PROTEIN_OFFSET,
    build_all_sequences_for_mlm,
    load_new_excel_mutations,
    load_old_excel_mutations,
    merge_mutations,
    parse_double_mutations,
    stratified_split,
)
from . import constants

__all__ = [
    "ORIGINAL_PROTEIN_OFFSET",
    "build_all_sequences_for_mlm",
    "load_new_excel_mutations",
    "load_old_excel_mutations",
    "merge_mutations",
    "parse_double_mutations",
    "stratified_split",
    "constants",
]
