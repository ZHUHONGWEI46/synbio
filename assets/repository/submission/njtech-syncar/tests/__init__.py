"""
tests/
======

Smoke tests for the AI / computational pipeline under ``src/ai/``.

What lives here:
    * ``test_smoke.py``  — import all submodules, run a tiny forward pass
      on each model, and exercise the lightweight data helpers. These
      tests do not require real data and finish in a few seconds.
    * ``test_paths.py``  — guard against path-resolution regressions
      introduced during reorganization (project-root vs in-package).

Why these tests exist:
    The README under ``src/ai/`` says CI runs ``pytest tests/ -v``. We
    keep the suite intentionally small (no GPU, no real data) so it can
    run on every PR as a cheap regression net.

Run from ``submission/njtech-syncar/``:
    pytest tests/ -v
"""
