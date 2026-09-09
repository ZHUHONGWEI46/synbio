"""
Shared test fixtures for the AI smoke suite.

Responsibilities:
    1. Make ``src/ai/`` importable as top-level packages (``data``,
       ``models``, ``scripts.*``). The directory layout is non-standard
       (``src/ai/`` lives at depth 3 from the project root, no top-level
       ``src/__init__.py``), so we add it to ``sys.path`` ourselves
       rather than depending on editable-install hooks.
    2. Build a tiny synthetic MAB2962-style single-mutant pkl on demand so
       smoke tests can exercise preprocess/load paths without touching
       the real ``data/raw/`` Excels.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import pytest
import torch

# Resolve src/ai/ and inject it onto sys.path so ``import models`` /
# ``import data`` / ``import scripts.*`` all work.
_THIS_DIR = Path(__file__).resolve().parent
_AI_ROOT = _THIS_DIR.parent / "src" / "ai"
if str(_AI_ROOT) not in sys.path:
    sys.path.insert(0, str(_AI_ROOT))


@pytest.fixture(scope="session")
def ai_root() -> Path:
    """Absolute path to ``src/ai/``."""
    return _AI_ROOT


@pytest.fixture(scope="session")
def synthetic_mab2962_pkl(tmp_path_factory) -> Path:
    """Build a minimal single-mutant pkl in the same shape as the real one.

    Layout matches ``data/preprocess.py:save_pkl``:
        {"MAB2962_Araya_2026": {"df": DataFrame, "wild_type": str}}

    The DataFrame has ``mutant``, ``wt_aa``, ``mt_aa``, ``pos`` (0-indexed),
    ``score``, ``wt_seq``, ``mut_seq``. Sequence length is 130 aa with
    20 evenly-spaced mutants — enough to exercise masking & forward pass
    code without slowing the test suite down.
    """
    wt = "MKTAYIAKQRQISFVKSHRSRQHTERE" * 5  # 130 aa, ~equal aa mix
    rows = []
    for i in range(20):
        pos = i * 5
        if pos >= len(wt):
            break
        mt_aa = "V"
        mut_seq = wt[:pos] + mt_aa + wt[pos + 1:]
        rows.append(
            {
                "mutant": f"A{pos + 1}V",  # 1-indexed mutation label
                "wt_aa": wt[pos],
                "mt_aa": mt_aa,
                "pos": pos,  # 0-indexed
                "score": float(i % 3),
                "wt_seq": wt,
                "mut_seq": mut_seq,
            }
        )
    df = pd.DataFrame(rows)

    pkl_path = tmp_path_factory.mktemp("smoke") / "tiny_mab2962.pkl"
    torch.save({"MAB2962_Araya_2026": {"df": df, "wild_type": wt}}, pkl_path)
    return pkl_path
