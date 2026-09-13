# Canonical benchmark inputs

This directory intentionally contains no copied experimental data. `src/data.py` reads the canonical processed tables in the repository root:

```text
data/processed/round_0.xlsx
data/processed/round_1.xlsx
data/processed/round_2.xlsx
```

Each table must contain `name`, `seq`, `replicate1`, `replicate2`, `replicate3`, and `average`. The historical benchmark structurally rejects every round other than 0, 1, and 2; in particular, it never opens `round_3.xlsx`.
