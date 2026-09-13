# Verifiability · 可验证性

## 1. 复现 R0—R2 历史 benchmark

```bash
python -m pip install -r src/ai/historical_benchmark/requirements.txt
python src/ai/historical_benchmark/run_all.py
```

入口、输入约定与输出说明位于 [`src/ai/historical_benchmark/README.md`](../src/ai/historical_benchmark/README.md)。代码只接受 `data/processed/round_0.xlsx`、`round_1.xlsx` 和 `round_2.xlsx`，并在代码层面拒绝 Round 3。运行需要预先存在的本地 ESM2-650M 缓存；程序不联网下载模型。

## 2. 可核对的结果

| 证据 | 位置 |
| --- | --- |
| R0—R2 处理后数据及三次平行 | `data/processed/round_0.xlsx` 至 `round_2.xlsx` |
| 时间前向 Spearman 表 | [AI / Computational Methods](./AI-Computational-Methods.md) 第 3 节 |
| 固定参数、隔离约束和结果输出 | `src/ai/historical_benchmark/run_benchmark.py`；运行生成的 `results/protocol.json` |
| 纯酶与全细胞验证 | `data/raw/pure_enzyme_activity_normalized.xlsx`；`data/raw/whole_cell_catalysis.xlsx` |
| 新 DNA 元件 | `parts/AISB26-047-001/`、`parts/AISB26-047-002/` 与 [Parts](./Parts.md) |

## 3. 范围与待人工补充项

- Round 3 仅为高阶突变外推的 retrospective challenge；不属于正式 benchmark。
- 仓库不含 ESM2 权重或 embedding 缓存；需由复现者提供已缓存的本地模型。
- 需补充实际运行机器、运行日期、生成的 CSV/SVG 哈希和模型缓存版本，才能形成完整的运行审计。
- 实验重复的技术/生物学属性、部分双平行记录和快筛 OD 控制情况需由实验负责人确认。

---

*最后更新：2026-09-10*
