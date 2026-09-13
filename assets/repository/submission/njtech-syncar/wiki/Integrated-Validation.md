# Integrated Validation · 干湿结合验证

## 1. DBTL 闭环

```text
PSW → ESM2 zero-shot → R0 实验 → 监督模型训练
    → R1 预测与实验 → R1 数据反馈/重训练 → R2 预测与实验
```

| 阶段 | 实验结果 | 学习动作 |
| --- | --- | --- |
| R0 | 最佳 1.118；中位 0.993；42.9% 超过 PSW | 将 R0 实验标签作为监督训练数据。 |
| R1 | 最佳 1.554；中位 0.884；21.3% 超过 PSW | R0→R1 的最佳实验值提高约 39%；将 R1 标签反馈模型。 |
| R2 | 最佳 1.386；中位 0.906；25.5% 超过 PSW | 在同一 R2 测试集上，FCNN 随 R1 反馈的 Spearman 从 −0.040 提升至 0.118。 |

R0、R1、R2 的正式候选表位于 [`data/processed/`](../data/processed/)。前向划分、三个模型的全部 Spearman 结果和约束见 [AI / Computational Methods](./AI-Computational-Methods.md)。

## 2. 实验验证层次

- 全细胞初筛与复筛：`data/raw/round_0_screening.xlsx`、`round_1_screening.xlsx`、`round_2_screening.xlsx`。
- 纯酶表征：PSW-F430M 为 1.74 ± 0.21，PSW-L417A 为 1.61 ± 0.07（相对 PSW，n=3）。
- 全细胞催化：PSW-F430M 为 1.423 ± 0.039，PSW-L417A 为 1.473 ± 0.142（相对 PSW，n=3）。

详细统计说明见 [Wet-Lab-Experiments](./Wet-Lab-Experiments.md)，元件证据见 [Parts](./Parts.md)。

## 3. Round 3 的位置

Round 3 是五突变组合的 retrospective challenge / 方法边界分析。它不进入 R0—R2 的历史前向 benchmark，也不作为训练、验证、模型选择或新增 DBTL 成功的证据。

## 4. 诚实边界

前向 benchmark 的表现依赖模型与时间划分；R1 反馈带来的 FCNN 改善不能推广为所有模型均改善。当前仍需人工补充实际运行日志、模型缓存版本、生成结果文件的哈希及实验重复类型的确认。

---

*最后更新：2026-09-10*
