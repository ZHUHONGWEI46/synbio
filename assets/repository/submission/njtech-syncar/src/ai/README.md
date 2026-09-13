# src/ai · AI / computational code

## Formal code submission

The formal model entry point is the reproducible historical benchmark:

```bash
python -m pip install -r src/ai/historical_benchmark/requirements.txt
python src/ai/historical_benchmark/run_all.py
```

See [`historical_benchmark/README.md`](./historical_benchmark/README.md) for the three time-ordered splits, input schema, local ESM2 requirement, output files, and explicit exclusion of Round 3. It reads `data/processed/round_0.xlsx` through `round_2.xlsx` in place and does not alter experimental data.

## Retained historical utility

[`legacy_data_processing/preprocess.py`](./legacy_data_processing/preprocess.py) is retained only for preparing its documented legacy Excel inputs. It is not a model-training entry point and is not used for the reported R0—R2 benchmark.
