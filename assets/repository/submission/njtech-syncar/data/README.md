# Data

> 这一目录用于存放数据文件，但 **大文件不要直接 commit**。

## 目录约定

```
data/
├── raw/         # 原始数据（绝大多数 .gitignore 掉）
├── processed/   # 处理后数据（同上）
└── README.md    # 数据目录索引（本文件）
```

## 数据索引

| 数据集 | 路径 | 来源 | 大小 | 获取方式 | 数据指纹 (SHA-256) |
|---|---|---|---|---|---|
| zero-shot 初筛吸光值 | `data/raw/zero-shot 初筛吸光值.xlsx` | 本项目湿实验结果 | 10,129 B | 随仓库提交 | `bfb9e72796a1f80b6fe768fbda52d2cb009b7a6e4ca93d263c0df19250b71c8f` |
| zero-shot 候选整理数据 | `data/processed/round_0.xlsx` | 本项目湿实验结果整理 | 10,769 B | 随仓库提交 | `18b20b5a715b02cba91b02bd48646737a361f36b54d8ac863cee2afaaf6868d4` |
| MAB2962 野生型序列 | `data/raw/MAB2962.fa` | 本项目湿实验与序列资料 | 1,235 B | 随仓库提交 | `a3063d88f96ab6f2a0a09aec90f48485f4afeeb349f85de79489a172d3c9df7b` |
| MAB2962 D281P/G420W/N514S 序列 | `data/raw/MAB2962 D281P-G420W-N514S.fa` | 本项目湿实验与序列资料 | 1,235 B | 随仓库提交 | `170a3b875964a83f6ab8db8f2372fce2dbbe3b6bef127dab18c125d4fc21595f` |

> 当前提交区仅收录中期汇报所需的小体量数据文件。更大的原始数据、测序数据、模型权重或中间缓存不直接进入仓库；如后续需要公开，应补充外部存储链接、版本号和校验和。

## 大数据如何处理

- 推荐用 [Git LFS](https://git-lfs.com/) 或 [DVC](https://dvc.org/)；
- 或者把数据放在公开数据库（NCBI / Zenodo / OSF）并在此处给出下载脚本。

## 数据卫生

- **不要** commit 任何包含个人身份信息的数据；
- **不要** commit 受版权保护或受限授权的数据集；
- 必要时使用 `data/.gitkeep` 占位但忽略大文件（已在 `.gitignore` 中配置）。
