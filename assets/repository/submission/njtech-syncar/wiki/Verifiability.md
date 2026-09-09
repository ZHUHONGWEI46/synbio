# Verifiability

> 本页说明截至 2026-07-15 中期节点，第三方可以检查和复核哪些材料，以及哪些内容仍待后续补齐。

---

## 1. 能验证什么 / What can be verified

| 关键内容 | 验证方式 | 预计时间 |
|---|---|---|
| 中期报告与图表附件 | 打开 `docs/中期进展汇报/07_中期进展汇报.docx` 与 `docs/中期进展汇报/中期进展图片/` | <30 分钟 |
| zero-shot 初筛吸光值 | 查看 `data/raw/zero-shot 初筛吸光值.xlsx` | <10 分钟 |
| zero-shot 候选整理数据 | 查看 `data/processed/round_0.xlsx` | <10 分钟 |
| MAB2962 序列文件 | 查看 `data/raw/MAB2962.fa` 与 `data/raw/MAB2962 D281P-G420W-N514S.fa` | <10 分钟 |
| 当前 AI 代码结构 | 查看 `src/ai/`、`src/ai/configs/baseline.yaml` 和 `tests/` | <30 分钟 |

---

## 2. 计算可验证 / Computational

### 2.1 当前代码入口

当前提交区包含 Stage 1 / Stage 2 建模脚本、配置和基础测试。完整训练与评估命令需等待训练数据 pkl、模型权重和依赖版本锁定后补充。

```bash
cd src/ai
python -m scripts.prepare_multi_data --help
python -m scripts.train_stage1 --help
python -m scripts.train_stage2 --help
```

### 2.2 环境

- Python 依赖入口：`requirements.txt`
- 容器入口：`Dockerfile`
- 深度学习相关依赖需根据本地硬件与训练方案进一步锁定。

### 2.3 数据指纹

| 数据集 | 路径 | SHA-256 |
|---|---|---|
| zero-shot 初筛吸光值 | `data/raw/zero-shot 初筛吸光值.xlsx` | `bfb9e72796a1f80b6fe768fbda52d2cb009b7a6e4ca93d263c0df19250b71c8f` |
| zero-shot 候选整理数据 | `data/processed/round_0.xlsx` | `18b20b5a715b02cba91b02bd48646737a361f36b54d8ac863cee2afaaf6868d4` |
| MAB2962 野生型序列 | `data/raw/MAB2962.fa` | `a3063d88f96ab6f2a0a09aec90f48485f4afeeb349f85de79489a172d3c9df7b` |
| MAB2962 D281P/G420W/N514S 序列 | `data/raw/MAB2962 D281P-G420W-N514S.fa` | `170a3b875964a83f6ab8db8f2372fce2dbbe3b6bef127dab18c125d4fc21595f` |

---

## 3. 实验可验证 / Experimental

- 湿实验方案与中期结果见 [Wet-Lab-Experiments](./Wet-Lab-Experiments.md)。
- 当前原始 / 处理数据索引见 [`data/README.md`](../data/README.md)。
- 当前阶段性结果索引见 [`results/README.md`](../results/README.md)。
- 批号、仪器型号、完整 ELN 链接仍需后续补齐。

---

## 4. 过程可追溯 / Audit Trail

- **代码版本**：最终提交前需将关键结果与 commit hash 绑定。
- **数据版本**：当前小体量数据已列 SHA-256；大文件、模型权重或缓存不直接提交。
- **实验记录**：电子实验记录路径待补充。

---

## 5. 我们做不到完美的地方 / Honest Limitations

- 当前中期节点尚未锁定完整 AI 训练指标。
- 当前 Wiki 中仍有部分页面等待后续材料确认后更新。
- 当前提交区不包含模型权重。

---

## 6. 反馈渠道 / Feedback

如需复核材料，可优先检查 `data/README.md`、`results/README.md`、`docs/中期进展汇报/` 和本 Wiki 页面。

---

*最后更新：2026-07-15*
