# MAB2962 historical forward benchmark

This is the formal, minimal and reproducible code submission for the historical single-new-mutation benchmark. It evaluates the fixed temporal splits `R0 -> R1`, `R0 -> R2`, and `R0+R1 -> R2`; Round 3 is deliberately excluded from all code paths, training, validation, and model selection.

## What is reproduced

- **ESM2 zero-shot:** local ESM2-650M masked-marginal log-odds at the added mutation site; no experimental labels are fitted.
- **EvolvePro-style RF:** frozen ESM2-650M mean embeddings with a fixed five-seed Random Forest regressor. This is an engineering baseline inspired by EvolvePro-style sequence representations, not a claim to run the published EvolvePro implementation.
- **FCNN:** the same frozen embeddings with a fixed one-hidden-layer, five-seed neural-regression ensemble.

All scalers and supervised fits use only the rows available before the test round. RF/FCNN settings are fixed in `src/models.py`; R2 is never used for hyperparameter selection. MAB2962 is 1184 aa, so embeddings use overlapping windows and coordinate-wise pooling rather than silent truncation.

## Environment and run

```bash
python -m pip install -r src/ai/historical_benchmark/requirements.txt
python src/ai/historical_benchmark/run_all.py
```

The run uses CUDA automatically when available. It is deliberately offline: before execution, provide the already cached local fair-esm source and checkpoint expected by `src/esm2.py` (`esm2_t33_650M_UR50D`). The program refuses network downloads. Canonical inputs are read directly from [`data/processed/`](../../../data/processed/); they are not copied into this directory.

## Outputs

- `results/round_activity_summary.csv`: experimental best value, median, and fraction above PSW for R0-R2.
- `results/historical_benchmark_master_table.csv`: Spearman, Pearson, and Top-5 diagnostics for the nine benchmark cells.
- `results/r1_feedback_comparison.csv`: R0->R2 vs R0+R1->R2 Spearman changes.
- `results/historical_predictions.csv`: per-variant predictions.
- `results/protocol.json`: fixed configurations and leakage audit.
- `figures/historical_spearman.png` and `.svg`: metric comparison.

## Layout

```text
historical_benchmark/
├── data/README.md       # canonical input contract; no duplicate data
├── features/README.md   # ignored local ESM2 embedding cache
├── src/                 # loaders, offline ESM2, fixed models and evaluation
├── run_all.py           # one-command entry point
├── run_benchmark.py     # direct benchmark entry point
└── requirements.txt     # locked package family/version floors
```

Earlier Stage 1/2 model code, configurations, training scripts, and their tests have been removed from the submission. Only the separate legacy data-preparation utility remains; it is not a benchmark entry point and must not be used to support the reported R0-R2 results.
