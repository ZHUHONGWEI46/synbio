"""
CLI wrapper for the data preprocessing module.

Runs ``src.ai.data.preprocess.main`` so users can do:

    cd src/ai
    python -m scripts.preprocess --new_data_excel round_0.xlsx

The implementation lives in ``src.ai.data.preprocess``; this script
exists so it can be invoked under the conventional
``scripts/preprocess.py`` name promised by the README.
"""
from data.preprocess import main

if __name__ == "__main__":
    main()
