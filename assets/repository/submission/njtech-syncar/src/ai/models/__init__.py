"""
src/ai/models
=============

Model definitions for the MAB2962 mutation-effect prediction pipeline.

Public API:
    - ESM2WithLMHead: ESM-2 + MLM head (used in Stage 1, fair-esm LoRA).
    - ESMEffectModel: Multi-site concat-delta regression model (used in Stage 2).
    - MultiSiteDataset, collate_fn: Dataset & collate for 1-3 mutation sites.
    - MLMDataset, mlm_collate: Dataset & collate for Stage 1 masked-LM training.
"""

from .esm_lm_head import ESM2WithLMHead, MLMDataset, mlm_collate, apply_lora, compute_mlm_loss
from .esm_effect import ESMEffectModel, MultiSiteDataset, collate_fn

__all__ = [
    "ESM2WithLMHead",
    "ESMEffectModel",
    "MultiSiteDataset",
    "collate_fn",
    "MLMDataset",
    "mlm_collate",
    "apply_lora",
    "compute_mlm_loss",
]
