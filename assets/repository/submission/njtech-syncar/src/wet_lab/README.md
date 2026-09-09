# src/wet_lab · 实验数据分析与图表

> 本目录放置与湿实验配套的脚本：测序数据预处理、流式数据分析、HPLC 谱图绘制等。
> 实验方案本身请写在 `wiki/Wet-Lab-Experiments.md`。

## 目录约定（建议）

```
src/wet_lab/
├── README.md
├── flow_cytometry/    # 流式细胞数据分析
├── hplc/              # HPLC 数据分析
├── sequencing/        # 测序数据处理
└── plotting/          # 通用绘图函数
```

## 输出去向

所有生成的图表统一输出到 `results/figures/`，并以 `<exp_id>_<description>.png` 命名。
