"""Offline local ESM2-650M mean embeddings and masked-marginal zero-shot scores."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

from .data import ROOT, sequence_hash

MODEL_NAME = "esm2_t33_650M_UR50D"
HIDDEN_DIM = 1280
MAX_RESIDUES = 1022  # ESM token limit minus BOS/EOS
WINDOW_STRIDE = 512
CACHE_DIR = ROOT / "features" / "esm2_650m"


def parse_mutation(token: str) -> tuple[str, int, str]:
    return token[0], int(token[1:-1]), token[-1]


def _load_local_esm2():
    """Load only the pre-existing local fair-esm source/checkpoint; never download."""
    import torch
    hub = Path(torch.hub.get_dir())
    source = hub / "facebookresearch_esm_main"
    checkpoint = hub / "checkpoints" / "esm2_t33_650M_UR50D.pt"
    if not source.exists() or not checkpoint.exists():
        raise RuntimeError(
            "Local ESM2-650M cache is missing. Expected "
            f"{source} and {checkpoint}; this benchmark refuses network download."
        )
    # An ESM3 package can occupy the same module name; force the cached fair-esm source.
    sys.modules.pop("esm", None)
    sys.path.insert(0, str(source))
    import esm
    model, alphabet = esm.pretrained.esm2_t33_650M_UR50D()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return model.eval().to(device), alphabet, device


def _windows(sequence: str) -> list[tuple[int, str]]:
    if len(sequence) <= MAX_RESIDUES:
        return [(0, sequence)]
    starts = list(range(0, len(sequence) - MAX_RESIDUES + 1, WINDOW_STRIDE))
    if starts[-1] != len(sequence) - MAX_RESIDUES:
        starts.append(len(sequence) - MAX_RESIDUES)
    return [(start, sequence[start : start + MAX_RESIDUES]) for start in starts]


def _embedding_path(sequence: str) -> Path:
    return CACHE_DIR / f"{sequence_hash(sequence)}.npy"


def ensure_mean_embeddings(sequences: list[str], batch_size: int | None = None) -> None:
    """Create 1280-d mean embeddings, caching each unique sequence once.

    Long proteins are covered by overlapping windows; overlapping residue states
    are coordinate-averaged before full-sequence mean pooling.  No truncation.
    """
    import torch
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    unique = list(dict.fromkeys(sequences))
    missing = [s for s in unique if not _embedding_path(s).exists()]
    if not missing:
        return
    model, alphabet, device = _load_local_esm2()
    converter = alphabet.get_batch_converter()
    active = batch_size or (2 if device.type == "cuda" else 1)
    for done, sequence in enumerate(missing, start=1):
        residue_sum = torch.zeros((len(sequence), HIDDEN_DIM), dtype=torch.float32)
        residue_count = torch.zeros(len(sequence), dtype=torch.float32)
        wins, pos = _windows(sequence), 0
        while pos < len(wins):
            group = wins[pos : pos + active]
            _, _, tokens = converter([(str(start), window) for start, window in group])
            try:
                with torch.inference_mode():
                    reps = model(tokens.to(device), repr_layers=[33], return_contacts=False)["representations"][33].cpu()
            except torch.cuda.OutOfMemoryError:
                if active == 1:
                    raise
                torch.cuda.empty_cache(); active = 1; continue
            for row, (start, window) in enumerate(group):
                length = len(window)
                residue_sum[start:start + length] += reps[row, 1:length + 1]
                residue_count[start:start + length] += 1
            pos += len(group)
        if torch.any(residue_count == 0):
            raise RuntimeError("Windowing left an uncovered residue")
        np.save(_embedding_path(sequence), (residue_sum / residue_count[:, None]).mean(dim=0).numpy().astype(np.float32))
        if done % 10 == 0 or done == len(missing):
            print(f"Mean embeddings: {done}/{len(missing)} newly cached", flush=True)


def mean_matrix(sequences: list[str]) -> np.ndarray:
    return np.vstack([np.load(_embedding_path(s)).astype(np.float32) for s in sequences])


def _masked_cache_path() -> Path:
    return CACHE_DIR / "masked_marginal_scores.json"


def _centered_window(sequence: str, position: int) -> tuple[int, str]:
    if len(sequence) <= MAX_RESIDUES:
        return 0, sequence
    target = position - 1
    start = min(max(0, target - MAX_RESIDUES // 2), len(sequence) - MAX_RESIDUES)
    return start, sequence[start:start + MAX_RESIDUES]


def zero_shot_scores(requests: list[tuple[str, int, str, str]], batch_size: int = 2) -> dict[tuple[str, int, str, str], float]:
    """Masked log p(mutant)/p(reference), cached by sequence hash and target site."""
    import torch
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = _masked_cache_path()
    cache = json.loads(path.read_text()) if path.exists() else {}
    def key(r): return f"{sequence_hash(r[0])}:{r[1]}:{r[2]}>{r[3]}"
    unique = list(dict.fromkeys(requests))
    missing = [r for r in unique if key(r) not in cache]
    if missing:
        model, alphabet, device = _load_local_esm2(); converter = alphabet.get_batch_converter()
        active, cursor, done = batch_size, 0, 0
        while cursor < len(missing):
            group = missing[cursor:cursor + active]
            records, positions = [], []
            for sequence, position, ref, _alt in group:
                if sequence[position - 1] != ref:
                    raise ValueError(f"Reference mismatch at position {position}")
                start, window = _centered_window(sequence, position)
                local = position - 1 - start
                masked = window[:local] + alphabet.get_tok(alphabet.mask_idx) + window[local + 1:]
                records.append((str(position), masked)); positions.append(local)
            _, _, tokens = converter(records)
            try:
                with torch.inference_mode(): logits = model(tokens.to(device), repr_layers=[], return_contacts=False)["logits"].cpu()
            except torch.cuda.OutOfMemoryError:
                if active == 1:
                    raise
                torch.cuda.empty_cache(); active = 1; continue
            logp = torch.log_softmax(logits, dim=-1)
            for row, request in enumerate(group):
                _sequence, _position, ref, alt = request
                cache[key(request)] = float((logp[row, positions[row] + 1, alphabet.get_idx(alt)] - logp[row, positions[row] + 1, alphabet.get_idx(ref)]).item())
            cursor += len(group); done += len(group)
            if done % 20 == 0 or done == len(missing):
                path.write_text(json.dumps(cache, indent=2, sort_keys=True), encoding="utf-8")
                print(f"Zero-shot scores: {done}/{len(missing)} newly cached", flush=True)
    return {r: float(cache[key(r)]) for r in unique}
