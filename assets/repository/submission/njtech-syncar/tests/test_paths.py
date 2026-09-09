"""
Path-resolution regression tests.

Background:
    During the recent reorganization of ``src/ai/main/`` into
    ``models/`` / ``data/`` / ``scripts/``, several modules had to
    switch from a hard-coded ``os.path.dirname(os.path.dirname(__file__))``
    pattern (which pointed at ``src/ai/``) to a three-level walk-up that
    lands at ``submission/njtech-syncar/``. These tests lock that
    resolution in place so future moves can't silently restore old,
    broken paths.
"""

from __future__ import annotations

import importlib


def _expected_project_root():
    """``submission/njtech-syncar/`` — three levels above ``src/ai/``."""
    # conftest has already put ``src/ai/`` on sys.path, so we can read
    # one of our own modules' ``__file__`` to anchor the resolution.
    from data import constants as data_constants

    return data_constants.__file__.rsplit("/src/ai/data/constants.py", 1)[0]


def test_constants_data_dir_points_to_project_root():
    """``data/constants.py:DATA_DIR`` must equal ``<project>/data``."""
    from data import constants

    expected = f"{_expected_project_root()}/data"
    assert constants.DATA_DIR == expected, (
        f"constants.DATA_DIR = {constants.DATA_DIR!r}, expected {expected!r}"
    )


def test_preprocess_data_dir_points_to_project_root():
    """``data/preprocess.py:DATA_DIR`` must equal ``<project>/data``."""
    from data import preprocess

    expected = f"{_expected_project_root()}/data"
    assert preprocess.DATA_DIR == expected, (
        f"preprocess.DATA_DIR = {preprocess.DATA_DIR!r}, expected {expected!r}"
    )


def test_constants_and_preprocess_agree():
    """Both modules' DATA_DIR should resolve to the same directory."""
    from data import constants, preprocess

    assert constants.DATA_DIR == preprocess.DATA_DIR


def test_scripts_share_data_dir():
    """All CLI entry points must agree on DATA_DIR."""
    from scripts import prepare_multi_data, train_stage1, train_stage2

    dirs = {
        "prepare_multi_data": prepare_multi_data.DATA_DIR,
        "train_stage1": train_stage1.DATA_DIR,
        "train_stage2": train_stage2.DATA_DIR,
    }
    unique = set(str(d) for d in dirs.values())
    assert len(unique) == 1, f"DATA_DIR disagree across scripts: {dirs}"


def test_scripts_checkpoint_dir_is_under_results():
    """All CLI scripts must default to ``<project>/results/checkpoints``."""
    from scripts import train_stage1, train_stage2

    expected = f"{_expected_project_root()}/results/checkpoints"
    assert str(train_stage1.DEFAULT_CHECKPOINT_DIR) == expected
    assert str(train_stage2.DEFAULT_CHECKPOINT_DIR) == expected
