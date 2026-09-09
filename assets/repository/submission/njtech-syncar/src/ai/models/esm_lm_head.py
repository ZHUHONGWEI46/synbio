"""
ESM-2 + LM Head (Stage 1 model)
===============================

A thin wrapper around fair-esm's `ESM-2` 35M with:
    * LoRA adapters injected via `peft` (only Q/K/V/Out projections are
      adapted, plus `embed_tokens` is allowed to update).
    * A tied LM head sharing weights with `embed_tokens`, used for
      masked-LM training on MAB2962 sequences.

Companion helpers also live here:
    * `MLMDataset` and `mlm_collate` — data pipeline for Stage 1.
    * `compute_mlm_loss` — masked-LM cross-entropy across a batch with
      per-sample variable mask counts.
    * `apply_lora` — convenience wrapper around `peft.get_peft_model`.

The training loop itself lives in
``src/ai/scripts/train_stage1.py``.
"""

from __future__ import annotations

import numpy as np
import torch
from torch.utils.data import Dataset

# ---------------------------------------------------------------------------
# Backbone identifier
# ---------------------------------------------------------------------------

PROTEIN_MODEL_NAME = "facebook/esm2_t12_35M_UR50D"

# Default LoRA target modules for fair-esm Transformer layers.
LORA_MODULES = [
    "self_attn.q_proj",
    "self_attn.k_proj",
    "self_attn.v_proj",
    "self_attn.out_proj",
]


# ---------------------------------------------------------------------------
# LoRA injection
# ---------------------------------------------------------------------------

def apply_lora(model, lora_r: int = 8, lora_alpha: int = 16, lora_dropout: float = 0.05):
    """Wrap a fair-esm model with LoRA adapters on the attention projections."""
    from peft import LoraConfig, get_peft_model

    lora_cfg = LoraConfig(
        r=lora_r,
        lora_alpha=lora_alpha,
        target_modules=LORA_MODULES,
        lora_dropout=lora_dropout,
        bias="none",
        modules_to_save=["embed_tokens"],
    )
    return get_peft_model(model, lora_cfg)


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------

class ESM2WithLMHead(torch.nn.Module):
    """fair-esm ESM-2 + tied LM Head for MLM training.

    The LM head reuses the embedding matrix (weight tying), so we can
    drop it entirely at inference time and keep only the encoder.
    """

    def __init__(self, esm_model, vocab_size: int):
        super().__init__()
        self.esm = esm_model
        self.vocab_size = vocab_size
        self.lm_head = torch.nn.Linear(esm_model.embed_dim, vocab_size, bias=False)
        self.lm_head.weight = esm_model.embed_tokens.weight

    def forward(self, tokens, repr_layers=None):
        if repr_layers is None:
            repr_layers = [self.esm.num_layers]
        results = self.esm(tokens, repr_layers=repr_layers, return_contacts=False)
        hidden = results["representations"][self.esm.num_layers]
        logits = self.lm_head(hidden)
        return logits, hidden


# ---------------------------------------------------------------------------
# MLM dataset & collate
# ---------------------------------------------------------------------------

class MLMDataset(Dataset):
    """Masked-LM dataset for adaptive pretraining on MAB2962 sequences.

    Each epoch a fresh mask pattern is drawn (controlled by ``seed``) so
    the model sees different corruptions across epochs without needing
    to materialise a separate dataset for every mask combination.

    Optionally, a per-sequence set of protected positions can be passed
    in (1-indexed, sequence-local) so positions used for downstream
    scoring are never masked out — used by the leakage-safe pipeline
    to keep held-out single mutants out of the MLM training signal.
    """

    def __init__(
        self,
        sequences: list[str],
        alphabet,
        mask_ratio: float = 0.15,
        seed: int = 42,
        protected_positions: dict | None = None,
    ):
        self.sequences = sequences
        self.alphabet = alphabet
        self.mask_ratio = mask_ratio
        self.rng = np.random.default_rng(seed)
        self.protected_positions = protected_positions or {}

    def __len__(self):
        return len(self.sequences)

    def _mask_sequence(self, seq, seq_idx):
        tokens = self.alphabet.tokenize(seq)
        seq_len = len(tokens)

        protected = self.protected_positions.get(seq_idx, set())
        candidates = [i for i in range(seq_len) if i not in protected]
        if not candidates:
            candidates = list(range(seq_len))

        n_mask = max(1, int(len(candidates) * self.mask_ratio))
        mask_indices = self.rng.choice(
            len(candidates),
            size=min(n_mask, len(candidates)),
            replace=False,
        )
        mask_indices = sorted([candidates[i] for i in mask_indices])

        original_ids = [self.alphabet.get_idx(tokens[i]) for i in mask_indices]

        masked_tokens = tokens.copy()
        for i in mask_indices:
            masked_tokens[i] = "<mask>"

        return masked_tokens, original_ids, mask_indices

    def __getitem__(self, idx):
        seq = self.sequences[idx]
        masked_tokens, original_ids, mask_indices = self._mask_sequence(seq, idx)
        masked_seq = "".join(masked_tokens)
        return masked_seq, original_ids, mask_indices


def mlm_collate(alphabet, batch_converter, device):
    """Build a collate function bound to a specific alphabet/converter/device.

    Returns a `collate_fn(batch)` that:
      1. tokenises the masked sequences with fair-esm's batch_converter,
      2. converts positions to fair-esm token indices (+1 for CLS),
      3. returns a dict with `input_ids`, `labels`, `mask_positions`.
    """

    def collate_fn(batch):
        masked_texts, original_lists, pos_lists = zip(*batch)
        batch_data = [(f"seq_{i}", s) for i, s in enumerate(masked_texts)]
        _, _, tokens = batch_converter(batch_data)
        tokens = tokens.to(device)

        batch_labels = []
        batch_pred_positions = []

        for bi, (orig_list, pos_list) in enumerate(zip(original_lists, pos_lists)):
            labels_for_sample = []
            positions_for_sample = []

            for orig_id, pos in zip(orig_list, pos_list):
                token_pos = pos + 1  # +1 to skip the CLS token
                if token_pos < tokens.shape[1]:
                    labels_for_sample.append(orig_id)
                    positions_for_sample.append(token_pos)

            batch_labels.append(labels_for_sample)
            batch_pred_positions.append(positions_for_sample)

        return dict(
            input_ids=tokens,
            labels=batch_labels,
            mask_positions=batch_pred_positions,
        )

    return collate_fn


# ---------------------------------------------------------------------------
# MLM loss
# ---------------------------------------------------------------------------

def compute_mlm_loss(logits, batch, device) -> torch.Tensor:
    """Compute MLM cross-entropy loss for a batch with variable-length masks.

    `logits`: [B, L, V] tensor from `ESM2WithLMHead.forward`.
    `batch["mask_positions"]`: list of length B; each entry is a list of
        1-indexed token positions (already offset for CLS) that should be
        predicted.
    `batch["labels"]`: list of length B; each entry is a list of token
        ids aligned with the corresponding positions.
    """
    batch_size, seq_len, _ = logits.shape
    all_logits = []
    all_labels = []

    for bi in range(batch_size):
        positions = batch["mask_positions"][bi]
        label_ids = batch["labels"][bi]
        if not positions:
            continue
        lp = torch.log_softmax(logits[bi], dim=-1)
        gathered_logits = lp[positions]  # [n_mask, vocab]
        all_logits.append(gathered_logits)
        all_labels.extend(label_ids)

    if not all_logits:
        return torch.tensor(0.0, device=device)

    flat_logits = torch.cat(all_logits, dim=0)  # [total_mask, vocab]
    flat_labels = torch.tensor(all_labels, device=device, dtype=torch.long)
    return torch.nn.functional.cross_entropy(flat_logits, flat_labels, reduction="mean")
