"""R0--R2-only data access and sequence-first mutation annotation."""
from __future__ import annotations

import hashlib
from collections import Counter
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parents[2]
DATA_DIR = PROJECT_ROOT / "data" / "processed"
HISTORICAL_ROUNDS = (0, 1, 2)
REQUIRED_COLUMNS = {"name", "seq", "replicate1", "replicate2", "replicate3", "average"}


def sequence_hash(sequence: str) -> str:
    return hashlib.sha256(sequence.encode("ascii")).hexdigest()


def load_round(round_id: int) -> pd.DataFrame:
    """Load only an allowed historical round; Round 3 is structurally forbidden."""
    if round_id not in HISTORICAL_ROUNDS:
        raise ValueError(f"Round {round_id} is outside the historical benchmark; allowed rounds: {HISTORICAL_ROUNDS}")
    path = DATA_DIR / f"round_{round_id}.xlsx"
    if not path.exists():
        raise FileNotFoundError(f"Missing input: {path}. See data/README.md.")
    df = pd.read_excel(path)
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"{path.name} is missing columns: {sorted(missing)}")
    df = df.copy()
    df["seq"] = df["seq"].astype(str).str.strip().str.upper()
    df["round"] = round_id
    df["sequence_hash"] = df.seq.map(sequence_hash)
    return df


def infer_background(sequences: list[str]) -> str:
    lengths = {len(s) for s in sequences}
    if len(lengths) != 1:
        raise ValueError(f"Unequal lengths require alignment: {sorted(lengths)}")
    return "".join(Counter(column).most_common(1)[0][0] for column in zip(*sequences))


def mutation_tokens(sequence: str, background: str) -> tuple[str, ...]:
    if len(sequence) != len(background):
        raise ValueError("Sequence length differs from inferred background")
    return tuple(f"{ref}{pos}{alt}" for pos, (ref, alt) in enumerate(zip(background, sequence), start=1) if ref != alt)


def annotate(df: pd.DataFrame, background: str) -> pd.DataFrame:
    out = df.copy()
    out["mutations"] = out.seq.map(lambda s: mutation_tokens(s, background))
    out["mutation_order"] = out.mutations.map(len)
    return out
