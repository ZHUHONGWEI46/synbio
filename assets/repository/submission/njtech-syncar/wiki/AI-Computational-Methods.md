# AI / Computational Methods

> 本页记录截至 2026-07-15 中期汇报节点已经形成的 AI / 计算方法。训练指标尚未锁定的部分不在本页给出数值。

---

## 1. 任务定义 / Task Formulation

**输入**：MAB2962 羧酸还原酶野生型 / 突变体氨基酸序列、突变位点信息、湿实验获得的相对活性数据。

**输出**：候选突变体的活性预测或排序，用于指导后续四突变、五突变实验验证。

**当前目标**：在三突变体 D281P/G420W/N514S 的基础上，探索进一步提升活性的候选组合。

---

## 2. 模型架构 / Model Architecture

### 2.1 整体框架

当前方案采用两阶段流程：

1. **Stage 1：上游语言模型微调**。以 ESM-2 35M (`facebook/esm2_t12_35M_UR50D`) 为编码器骨架，注入 LoRA 适配矩阵，使用掩码语言建模任务让模型适应 MAB2962 序列空间。
2. **Stage 2：活性回归模型**。加载 Stage 1 编码器，构建突变体与野生型的 delta embedding，并通过 MLP 回归头预测活性。

### 2.2 关键组件

| 组件 | 类型 | 是否原创 | 备注 |
|---|---|---|---|
| ESM-2 35M 编码器 | 预训练蛋白语言模型 | 否 | 作为序列表征骨架 |
| LoRA 适配层 | 参数高效微调 | 否 / 本项目配置使用 | `r=8, alpha=16` |
| Delta Embedding 表征 | 突变效应特征 | 本项目适配 | 对突变位点提取 MT-WT embedding 差值 |
| MLP 回归头 | 活性回归 | 本项目训练 | 1440 -> 256 -> 64 -> 1 |

### 2.3 当前配置

配置文件见 `src/ai/configs/baseline.yaml`。中期报告中使用的关键设置包括：

| 项目 | 当前值 |
|---|---|
| Stage 1 mask 概率 | 15% |
| Stage 1 LoRA | `r=8, alpha=16` |
| Stage 2 解冻层 | 前 8 层冻结，后 4 层微调 |
| Stage 2 交叉验证 | 4-Fold StratifiedKFold |
| Stage 2 回归损失 | MSE |

---

## 3. 数据 / Data

| 数据 | 路径 | 用途 | 来源 |
|---|---|---|---|
| zero-shot 初筛吸光值 | `data/raw/zero-shot 初筛吸光值.xlsx` | 候选验证与后续模型反馈 | 本项目湿实验 |
| round_0 整理数据 | `data/processed/round_0.xlsx` | 候选序列与活性整理 | 本项目湿实验结果整理 |
| MAB2962 序列 | `data/raw/MAB2962.fa` | 序列输入 | 本项目序列资料 |
| MAB2962 D281P/G420W/N514S 序列 | `data/raw/MAB2962 D281P-G420W-N514S.fa` | 三突变体序列输入 | 本项目序列资料 |

完整数据指纹见 [`data/README.md`](../data/README.md)。

---

## 4. 训练与评估 / Training & Evaluation

### 4.1 当前进度

- 已整理 Stage 1 / Stage 2 训练脚本与配置。
- 已建立面向 MAB2962 突变体的两阶段建模方案。
- 中期节点的训练与验证指标尚未锁定，因此本页暂不填 Spearman、Top-K 命中率等结果。

### 4.2 评估指标计划

| 指标 | 用途 | 当前状态 |
|---|---|---|
| Spearman | 衡量预测排序与实测活性的相关性 | 待训练结果锁定 |
| Top-K 命中率 | 衡量推荐候选进入湿实验后的命中情况 | 待后续实验验证 |
| NDCG | 衡量高活性候选排序质量 | 待训练结果锁定 |

### 4.3 基线对比

中期报告中列出的待比较方法包括 ESM2-650M zero-shot、MSA-Transformer 和 ESM-IF1。当前训练结果尚未锁定，具体数值后续补充。

---

## 5. 复现指南 / Reproducibility

当前可查看的脚本入口：

```bash
cd src/ai
python -m scripts.prepare_multi_data --help
python -m scripts.train_stage1 --help
python -m scripts.train_stage2 --help
```

完整训练需要对应的数据 pkl、PyTorch / ESM 环境和计算资源；长时间训练命令待数据与依赖锁定后补充。

---

## 6. 与湿实验的衔接 / Coupling with the Wet Lab

zero-shot 候选已经进入湿实验验证，最高活性约为三突变体的 1.12 倍。该轮数据将作为后续 Stage 1 / Stage 2 模型迭代的反馈数据。闭环过程见 [Integrated Validation](./Integrated-Validation.md)。

---

## 7. 局限与未来工作 / Limitations & Future Work

- 当前受算力限制，先采用 ESM-2 35M 进行概念性验证。
- 更大模型与更完整基线对比需要后续算力和训练结果支持。
- 当前中期提交不包含模型权重；如后续公开，应在 `results/README.md` 和 `data/README.md` 中补充版本、路径和校验信息。

---

*最后更新：2026-07-15*
