# src/ai · AI / 计算代码

```
src/ai/
├── README.md          # 本文件
├── models/            # 模型定义（PyTorch / TF）
├── data/              # 数据加载与预处理
└── scripts/           # 入口脚本：数据准备 / Stage 1 / Stage 2
```

## 入口脚本约定

| 脚本 | 用途 | 典型用法 |
|---|---|---|
| `scripts/prepare_multi_data.py` | 整理多位点突变数据 | `python -m scripts.prepare_multi_data --help` |
| `scripts/train_stage1.py` | Stage 1：ESM-2 MLM 自适应微调 | `python -m scripts.train_stage1 --config configs/baseline.yaml --seed 42` |
| `scripts/train_stage2.py` | Stage 2：突变效应回归模型训练 | `python -m scripts.train_stage2 --config configs/baseline.yaml` |
| `scripts/run_full_pipeline_leakage_safe.py` | 数据泄漏防护下的完整训练流程 | `python -m scripts.run_full_pipeline_leakage_safe --help` |

## 配置管理

- 推荐使用 [Hydra](https://hydra.cc/) 或 OmegaConf；
- 把配置文件放在 `configs/` 而不是写死在代码里——这是可验证性的关键。

## 单元测试

把简单单元测试放在 `tests/`（与 src 同级），CI 自动跑：
```bash
pytest tests/ -v
```
