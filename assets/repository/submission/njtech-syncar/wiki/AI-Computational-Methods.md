# AI / Computational Methods

> 本页记录 MAB2962—GABA 体系中按实验时间推进的 R0—R2 设计—实验—学习闭环。模型输出只用于候选排序；评估值均为 Spearman 相关系数。

---

## 1. 任务与边界 / Task and scope

以三突变体 PSW（D281P/G420W/N514S）为起点，预测在其背景上新增一个突变后的相对活性，并用湿实验测量结果检验排序。正式历史 benchmark 只使用 `data/processed/round_0.xlsx`、`round_1.xlsx` 和 `round_2.xlsx`；Round 3 不参与训练、验证、模型选择或本页的模型结论。

## 2. PSW 到 R2 的闭环 / DBTL cycle

| 阶段 | 做了什么 | 实验反馈与据此调整 |
| --- | --- | --- |
| PSW → ESM2 zero-shot | 以 PSW 为背景，用 ESM2 zero-shot 对新增突变排序，构建候选。 | 将候选送入 R0 实验，而不把 PLM 分数当作活性。 |
| R0 实验 | 测量 zero-shot 候选活性。 | R0 最佳值为 1.118、中位数 0.993，42.9% 候选超过 PSW；因此以 R0 实验标签训练监督模型。 |
| R1 预测与实验 | 以 R0 为训练数据，比较 ESM2、EvolvePro-style RF 与 FCNN 的前向预测，并完成 R1 实验。 | R1 最佳值为 1.554、中位数 0.884，21.3% 候选超过 PSW。R0→R1 的最佳实验值由 1.118 提升至 1.554，约提高 39%。 |
| R1 反馈 → R2 | 将 R1 标签加入训练集，固定 R2 为未来测试集，重新训练 RF 与 FCNN 后预测并实验验证。 | R2 最佳值为 1.386、中位数 0.906，25.5% 候选超过 PSW。FCNN 在同一 R2 测试集上的 Spearman 从 −0.040 提高至 0.118。 |

这是一条“AI 预测 → 实验验证 → 数据反馈/重训练 → 下一轮预测与实验”的时间顺序闭环。R1 或 R2 的最佳实验值是对应轮次候选集中的观察值，不应解释为所有模型均准确或所有轮次均持续提升。

## 3. 正式 benchmark / Historical forward benchmark

代码位于 [`src/ai/historical_benchmark/`](../src/ai/historical_benchmark/)，入口为：

```bash
python -m pip install -r src/ai/historical_benchmark/requirements.txt
python src/ai/historical_benchmark/run_all.py
```

| 时间划分（训练 → 测试） | ESM2 zero-shot | EvolvePro-style RF | FCNN |
| --- | ---: | ---: | ---: |
| R0 → R1 | 0.467 | 0.158 | 0.137 |
| R0 → R2 | 0.033 | 0.073 | −0.040 |
| R0 + R1 → R2 | 0.033 | 0.071 | 0.118 |

ESM2 为不拟合实验标签的 zero-shot 基线。RF 和 FCNN 均使用 ESM2-650M 冻结序列表征；RF 是受 EvolvePro 方法思路启发的工程化基线，并不声称复现或全面优于 EvolvePro 的已发表实现。超参数固定，监督模型的标准化器和拟合仅使用训练轮次；R2 不用于超参数选择。

加入 R1 反馈后，只有 FCNN 在同一 R2 测试集上出现由 −0.040 到 0.118 的提升；ESM2 保持 0.033，RF 从 0.073 变为 0.071。因此结果支持“实验反馈可能改善该低样本设置中的部分模型”，不支持“所有模型均预测准确”或“新模型全面优于基线”的结论。

## 4. 实现与可复现性 / Implementation

正式代码只读取已有的处理后数据，不复制或改写原始数据。其关键约束如下：

- ESM2 使用本地缓存的 `esm2_t33_650M_UR50D`，程序拒绝联网下载；1184 aa 序列以重叠窗口池化，避免静默截断。
- 结果输出包括轮次活性摘要、九个 benchmark 单元的指标表、R1 反馈比较、逐候选预测、协议 JSON 与 Spearman 图。
- 旧 Stage 1/2 模型、配置和训练脚本已从提交区移除；仅保留历史数据处理工具，不作为本页结果的证据。

详见 [`src/ai/historical_benchmark/README.md`](../src/ai/historical_benchmark/README.md) 与 [可验证性页面](./Verifiability.md)。

## 5. Round 3：高阶突变外推边界 / Retrospective challenge

`data/processed/round_3.xlsx` 保留五突变组合的 20 条测量记录（18 种唯一组合），用于 **retrospective challenge / 方法边界分析**：它可帮助检验单新增突变、时间前向 benchmark 是否能外推至更高阶组合。Round 3 不进入上述模型代码，未用于训练、验证、模型选择，也不被用作声称额外 DBTL 成功或模型优于基线的证据。

## 6. 局限 / Limitations

- 数据量与突变覆盖仅限 MAB2962—GABA—PSW 背景，不能推及其他 CAR、底盘或底物。
- 前向结果随测试轮次和模型而变化，不能由单一 Spearman 值概括。
- 五突变及更高阶组合尚无纳入正式训练流程的可复现建模与系统验证。
- 本仓库不分发 ESM2 权重或 embedding 缓存；复现者需具备 README 所列的本地模型缓存。

---

*最后更新：2026-09-10*
