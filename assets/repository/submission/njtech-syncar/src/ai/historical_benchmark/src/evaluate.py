"""Leak-free benchmark metrics and top-k diagnostics."""
from __future__ import annotations
import numpy as np
from scipy.stats import pearsonr, spearmanr

def correlations(y, prediction):
    mask = np.isfinite(y) & np.isfinite(prediction)
    if mask.sum() < 3: return {"n": int(mask.sum()), "spearman": np.nan, "pearson": np.nan}
    return {"n": int(mask.sum()), "spearman": float(spearmanr(y[mask], prediction[mask]).statistic), "pearson": float(pearsonr(y[mask], prediction[mask]).statistic)}

def topk(y, prediction, k=5):
    mask = np.isfinite(y) & np.isfinite(prediction)
    if mask.sum() < k: return {"topk": k, "topk_overlap": np.nan, "topk_above_psw": np.nan}
    y, prediction = y[mask], prediction[mask]
    actual = set(np.argsort(-y, kind="stable")[:k]); predicted = set(np.argsort(-prediction, kind="stable")[:k])
    return {"topk": k, "topk_overlap": len(actual & predicted), "topk_above_psw": int((y[list(predicted)] > 1.0).sum())}
