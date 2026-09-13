from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
BENCHMARK = ROOT / "src" / "ai" / "historical_benchmark"
sys.path.insert(0, str(BENCHMARK))

from src.data import HISTORICAL_ROUNDS, DATA_DIR, load_round

def test_benchmark_uses_canonical_processed_data():
    assert DATA_DIR == ROOT / "data" / "processed"
    assert HISTORICAL_ROUNDS == (0, 1, 2)

def test_historical_inputs_follow_schema():
    for round_id in HISTORICAL_ROUNDS:
        frame = load_round(round_id)
        assert {"name", "seq", "replicate1", "replicate2", "replicate3", "average"}.issubset(frame.columns)

def test_round3_is_structurally_rejected():
    try:
        load_round(3)
    except ValueError:
        return
    raise AssertionError("Round 3 must not enter the historical benchmark")
