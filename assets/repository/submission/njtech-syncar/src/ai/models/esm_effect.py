"""
ESM-Effect regression model (Stage 2 model)
============================================

Multi-site Concat-Delta Embedding model used in Stage 2 to score
1-3 mutation sites jointly. Frozen early transformer layers, fine-tuned
later layers, and a 3-layer MLP head on the concatenated
``[mut_emb; wt_emb; delta_emb]`` representation per site (mean-pooled
across sites).

Companion dataset/collate helpers live here as well so the model file
is self-contained:

    * `MultiSiteDataset` — list-of-dicts dataset.
    * `collate_fn` — pads positions/mask to ``max_sites`` length.

The training loop, cross-validation and evaluation all live in
``src/ai/scripts/train_stage2.py``.
"""

from __future__ import annotations

import torch
from torch.utils.data import Dataset


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

class MultiSiteDataset(Dataset):
    """Multi-site mutation dataset (1-3 sites per record).

    Each record is a dict with keys:
        - ``wt_seq``   (str)  wild-type sequence
        - ``mut_seq``  (str)  mutated sequence (mutations applied)
        - ``positions``(list[int]) 0-indexed sequence positions of mutations
        - ``score``    (float) target activity score (will be normalised
                                   by the training loop using train-set min/max)
    """

    def __init__(self, records: list[dict], max_sites: int = 3):
        self.records = records
        self.max_sites = max_sites

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        rec = self.records[idx]
        return {
            "wt_seq": rec["wt_seq"],
            "mut_seq": rec["mut_seq"],
            "positions": rec["positions"],  # list of 0-indexed positions
            "score": rec["score"],
        }


# ---------------------------------------------------------------------------
# Collate
# ---------------------------------------------------------------------------

def collate_fn(batch, device, max_sites: int = 3):
    """Pad variable-length `positions` to ``max_sites`` for batching.

    Returns a dict with:
        - ``wt_batch``:    list of (title, seq) pairs for ESM tokenisation
        - ``mut_batch``:   list of (title, seq) pairs for ESM tokenisation
        - ``positions``:   [B, max_sites] long tensor, padding = -1
        - ``position_mask``:[B, max_sites] float tensor, valid = 1.0
        - ``scores``:      [B] float tensor
    """
    wt_seqs = [b["wt_seq"] for b in batch]
    mut_seqs = [b["mut_seq"] for b in batch]
    scores = torch.tensor([b["score"] for b in batch], dtype=torch.float32, device=device)

    padded_positions = []
    position_mask = []
    for b in batch:
        pos = b["positions"][:max_sites]
        mask = [1] * len(pos) + [0] * (max_sites - len(pos))
        padded = pos + [-1] * (max_sites - len(pos))
        padded_positions.append(padded)
        position_mask.append(mask)

    positions = torch.tensor(padded_positions, dtype=torch.long, device=device)
    position_mask = torch.tensor(position_mask, dtype=torch.float32, device=device)

    wt_batch = [(f"wt_{i}", s) for i, s in enumerate(wt_seqs)]
    mut_batch = [(f"mut_{i}", s) for i, s in enumerate(mut_seqs)]

    return {
        "wt_batch": wt_batch,
        "mut_batch": mut_batch,
        "positions": positions,
        "position_mask": position_mask,
        "scores": scores,
    }


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------

class ESMEffectModel(torch.nn.Module):
    """Multi-site Concat-Delta Embedding model.

    For 1-3 mutation sites per sample:
        1. Encode wt_seq and mut_seq with ESM-2 35M.
        2. Extract the per-site last-layer embedding (token_pos = pos + 1,
           skip CLS).
        3. Pool across valid sites with a per-site mask → [B, embed_dim].
        4. Concat [mut_emb, wt_emb, delta_emb] → [B, 3 * embed_dim].
        5. Pass through a 3-layer MLP head → scalar score.

    By default we freeze the first 8 of 12 transformer layers; only the
    last 4 layers and the regression head are trainable.
    """

    def __init__(self, freeze_up_to: int = 8, dropout_rate: float = 0.2, max_sites: int = 3):
        super().__init__()
        import esm

        self.freeze_up_to = freeze_up_to
        self.n_layers = 12
        self.embedding_dim = 480  # 35M: 480, 150M: 640
        self.max_sites = max_sites

        self.esm_model, self.alphabet = esm.pretrained.esm2_t12_35M_UR50D()
        self.batch_converter = self.alphabet.get_batch_converter()

        # Freeze embedding, final layer-norm, and the first `freeze_up_to` layers
        for param in self.esm_model.embed_tokens.parameters():
            param.requires_grad = False
        for param in self.esm_model.emb_layer_norm_after.parameters():
            param.requires_grad = False
        for i in range(freeze_up_to):
            for param in self.esm_model.layers[i].parameters():
                param.requires_grad = False

        # Concat-Delta head: 3 * embedding_dim → 256 → 64 → 1
        self.dropout = torch.nn.Dropout(dropout_rate)
        self.fc1 = torch.nn.Linear(self.embedding_dim * 3, 256)
        self.fc2 = torch.nn.Linear(256, 64)
        self.fc3 = torch.nn.Linear(64, 1)
        self.relu = torch.nn.ReLU()

    def get_trainable_params(self):
        """Return (trainable_params, total_params)."""
        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        total = sum(p.numel() for p in self.parameters())
        return trainable, total

    # -- embedding helpers --------------------------------------------------

    def _extract_site_embeddings(self, batch_data, positions):
        """Extract single-site embeddings for a batch of sequences."""
        _, _, tokens = self.batch_converter(batch_data)
        tokens = tokens.to(next(self.parameters()).device)
        results = self.esm_model(
            tokens=tokens, repr_layers=[self.n_layers], return_contacts=False
        )
        hidden = results["representations"][self.n_layers]
        token_positions = (positions + 1).unsqueeze(-1)
        site_embs = hidden.gather(
            dim=1,
            index=token_positions.unsqueeze(-1).expand(-1, 1, self.embedding_dim),
        )
        return site_embs.squeeze(1)

    def _extract_single_embedding(self, batch_item, token_pos):
        """Extract embedding of a single sequence at a single token position."""
        _, _, tokens = self.batch_converter([batch_item])
        tokens = tokens.to(next(self.parameters()).device)
        results = self.esm_model(
            tokens=tokens, repr_layers=[self.n_layers], return_contacts=False
        )
        hidden = results["representations"][self.n_layers][0]  # [seq_len, embed_dim]
        if token_pos < 0 or token_pos >= hidden.shape[0]:
            token_pos = hidden.shape[0] - 1
        return hidden[token_pos]

    def _extract_multi_site_embeddings(self, batch_data, positions, position_mask):
        """Extract embeddings for multi-site batches (1-3 sites per sample).

        Done sample-by-sample because each sample may have a different
        number of valid sites. The `position_mask` is unused here (it is
        consumed downstream for mean pooling) but is part of the signature
        for API symmetry.
        """
        device = next(self.parameters()).device
        batch_size = positions.shape[0]
        site_embs_list = []

        for b in range(batch_size):
            seq_title, seq = batch_data[b]
            pos = positions[b]
            valid_mask = pos >= 0

            for i in range(pos.shape[0]):
                if valid_mask[i]:
                    token_pos = pos[i] + 1
                    seq_len = len(seq) + 2  # CLS + seq + EOS
                    if token_pos < seq_len:
                        emb = self._extract_single_embedding((seq_title, seq), token_pos)
                    else:
                        emb = self._extract_single_embedding((seq_title, seq), -1)
                else:
                    emb = torch.zeros(self.embedding_dim, device=device)
                site_embs_list.append(emb)

        site_embs = torch.stack(site_embs_list).view(
            batch_size, positions.shape[1], self.embedding_dim
        )
        return site_embs

    # -- forward ------------------------------------------------------------

    def forward(self, wt_batch, mut_batch, positions, position_mask=None):
        """Predict activity scores for a batch.

        Args:
            wt_batch:    list of (title, wt_seq) tuples.
            mut_batch:   list of (title, mut_seq) tuples.
            positions:   [B] tensor (single-site) or [B, max_sites] tensor
                         (multi-site). 0-indexed sequence positions.
            position_mask: [B, max_sites] tensor, valid=1.0 (only used for
                         multi-site batches).
        Returns:
            predictions: [B] tensor.
        """
        is_single = positions.dim() == 1

        if is_single:
            wt_embs = self._extract_site_embeddings(wt_batch, positions)
            mut_embs = self._extract_site_embeddings(mut_batch, positions)
            delta_emb = mut_embs - wt_embs
        else:
            wt_embs = self._extract_multi_site_embeddings(wt_batch, positions, position_mask)
            mut_embs = self._extract_multi_site_embeddings(mut_batch, positions, position_mask)
            delta_emb = mut_embs - wt_embs

            if position_mask is not None:
                mask_expanded = position_mask.unsqueeze(-1)
                denom = mask_expanded.sum(dim=1) + 1e-8
                pooled_delta = (delta_emb * mask_expanded).sum(dim=1) / denom
                pooled_wt = (wt_embs * mask_expanded).sum(dim=1) / denom
                pooled_mut = (mut_embs * mask_expanded).sum(dim=1) / denom
            else:
                pooled_delta = delta_emb.mean(dim=1)
                pooled_wt = wt_embs.mean(dim=1)
                pooled_mut = mut_embs.mean(dim=1)

            delta_emb = pooled_delta
            wt_embs = pooled_wt
            mut_embs = pooled_mut

        x = torch.cat([mut_embs, wt_embs, delta_emb], dim=-1)
        x = self.dropout(x)
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.fc3(x)
        return x.squeeze(-1)
