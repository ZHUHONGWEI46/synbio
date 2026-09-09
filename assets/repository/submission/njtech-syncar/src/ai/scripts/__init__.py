"""
src/ai/scripts
==============

Entry-point scripts (CLI) for the MAB2962 mutation-effect pipeline.

Usage (run from ``src/ai/``):
    python -m scripts.preprocess
    python -m scripts.prepare_multi_data
    python -m scripts.train_stage1  --config ../configs/baseline.yaml
    python -m scripts.train_stage2  --stage1_dir ../results/checkpoints/stage1 --save_name stage2
    python -m scripts.run_full_pipeline_leakage_safe --save_name v12_multi

Or via the thin wrappers under ``src/ai/scripts/<name>.py`` (run from
anywhere with the ``src/ai/`` directory on ``$PYTHONPATH``).

Module-level helpers (training loops, evaluation) live alongside the
models in ``src/ai/models/``; these scripts are pure orchestration.
"""
