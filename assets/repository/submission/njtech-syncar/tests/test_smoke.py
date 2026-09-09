"""
Smoke tests for ``src/ai/``.

These tests guard the recent reorganization:

    * ``test_imports``         — every submodule imports cleanly
    * ``test_esm_lm_head_forward`` — Stage 1 backbone + MLM head forward
    * ``test_esm_effect_forward``  — Stage 2 multi-site regression forward
    * ``test_preprocess_helpers``  — sequence construction & split logic

All tests run on CPU and finish in a few seconds. They do not require
real data — a synthetic pkl is provided by ``conftest.py``.
"""

from __future__ import annotations

import importlib

import torch

import data
import models
from data.preprocess import build_all_sequences_for_mlm, stratified_split
from models import (
    ESM2WithLMHead,
    ESMEffectModel,
    MLMDataset,
    MultiSiteDataset,
    apply_lora,
    collate_fn,
    compute_mlm_loss,
    mlm_collate,
)


def test_imports():
    """Every submodule under src/ai/ should import without error."""
    for mod in [
        "data",
        "data.preprocess",
        "data.constants",
        "models",
        "models.esm_lm_head",
        "models.esm_effect",
        "scripts",
        "scripts.preprocess",
        "scripts.prepare_multi_data",
        "scripts.run_full_pipeline_leakage_safe",
        "scripts.train_stage1",
        "scripts.train_stage2",
    ]:
        importlib.import_module(mod)


def test_esm_lm_head_forward():
    """ESM-2 + MLM head should produce logits of shape [B, L, V]."""
    import esm

    esm_base, alphabet = esm.pretrained.esm2_t12_35M_UR50D()
    batch_converter = alphabet.get_batch_converter()
    vocab_size = len(alphabet.all_toks)

    peft_model = apply_lora(esm_base, lora_r=4, lora_alpha=8)
    model = ESM2WithLMHead(peft_model, vocab_size)
    model.eval()

    seqs = ["MKTAYIAKQRQISFVK", "ARNDCEQGHILKMFPSTWYV"]
    batch = [(f"seq_{i}", s) for i, s in enumerate(seqs)]
    _, _, tokens = batch_converter(batch)

    with torch.no_grad():
        logits, hidden = model(tokens)

    assert logits.shape[0] == len(seqs)
    assert logits.shape[1] == tokens.shape[1]
    assert logits.shape[2] == vocab_size
    assert hidden.shape[:2] == (len(seqs), tokens.shape[1])


def test_esm_effect_forward():
    """Multi-site Concat-Delta model should produce per-batch scalars."""
    model = ESMEffectModel(freeze_up_to=8, dropout_rate=0.2, max_sites=3)
    model.eval()

    trainable, total = model.get_trainable_params()
    # 35M has 12 transformer layers; freezing 8 means ~4/12 of encoder +
    # head are trainable. Snapshot it at ~34.5% to detect regressions.
    ratio = trainable / total
    assert 0.30 < ratio < 0.40, f"trainable/total={ratio:.3f} out of expected band"

    # Synthetic 2-sample batch, single-site (positions 0-indexed).
    batch_data = [
        ("wt", "MKTAYIAKQRQISFVKSHRSRQHTERE"),
        ("mt", "MKTAYIAKQRQISFVKGHRSRQHTERE"),
    ]
    positions = torch.tensor([0, 1], dtype=torch.long)

    with torch.no_grad():
        preds = model(batch_data, batch_data, positions)
    assert preds.shape == (2,)


def test_preprocess_helpers(synthetic_mab2962_pkl):
    """``build_all_sequences_for_mlm`` and ``stratified_split`` behave."""
    data_blob = torch.load(synthetic_mab2962_pkl, weights_only=False)
    entry = data_blob["MAB2962_Araya_2026"]
    wt, df = entry["wild_type"], entry["df"]

    seqs = build_all_sequences_for_mlm(wt, df)
    # WT + one sequence per mutant row.
    assert len(seqs) == 1 + len(df)
    # All generated sequences have the WT length.
    assert all(len(s) == len(wt) for s in seqs)
    # WT is the first entry verbatim.
    assert seqs[0] == wt

    # stratified_split expects a 'bin' column or generic label column.
    # ``stratified_split`` calls ``reset_index(drop=True)`` on both halves,
    # so DataFrame indices are not a meaningful disjointness check; the
    # canonical safety property is "no duplicate mutants between halves",
    # which is exactly what the original code guarantees by construction
    # (test_df = df.drop(train_idx).copy()).
    df_with_bin = df.copy()
    df_with_bin["bin"] = (df_with_bin["score"] >= 1.0).astype(int)
    train_df, test_df = stratified_split(df_with_bin, train_size=8, seed=42)
    assert len(train_df) == 8
    assert len(test_df) + len(train_df) == len(df_with_bin)
    assert set(train_df["mutant"]).isdisjoint(set(test_df["mutant"]))
