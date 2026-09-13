#!/usr/bin/env python
"""One-command entry point for the minimal historical benchmark."""
from pathlib import Path
import os
ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
from run_benchmark import main
if __name__ == "__main__": main()
