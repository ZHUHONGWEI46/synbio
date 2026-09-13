"""Minimal publication-style historical benchmark figures."""
from __future__ import annotations
from pathlib import Path
import matplotlib.pyplot as plt

COLORS = {"esm2_zero_shot":"#4C78A8", "evolvepro_rf":"#F58518", "fcnn":"#54A24B"}

def plot_spearman(summary, outdir: Path):
    outdir.mkdir(parents=True, exist_ok=True)
    plt.rcParams.update({"svg.fonttype":"none", "font.sans-serif":["Arial","Microsoft YaHei","DejaVu Sans"], "axes.linewidth":0.5})
    splits = list(summary.split.drop_duplicates()); methods = list(summary.method.drop_duplicates())
    fig, ax = plt.subplots(figsize=(7.0, 3.8)); width = .23
    for j, method in enumerate(methods):
        subset = summary[summary.method == method].set_index("split").loc[splits]
        ax.bar([i + (j-1)*width for i in range(len(splits))], subset.spearman, width=width, color=COLORS[method], label=method)
    ax.axhline(0, color="0.4", lw=.7); ax.set(xticks=range(len(splits)), xticklabels=[x.replace("_to_", "→").replace("R0_R1", "R0+R1") for x in splits], ylim=(-.15,.55), ylabel="Spearman correlation")
    ax.tick_params(labelsize=9, width=.5, length=4); ax.legend(frameon=False, fontsize=8); fig.tight_layout()
    for ext in ("png", "svg"): fig.savefig(outdir / f"historical_spearman.{ext}", dpi=300 if ext == "png" else None, bbox_inches="tight")
    plt.close(fig)
