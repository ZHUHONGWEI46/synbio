# Data

## 动力学常数图片转录

[kinetic_constants.xlsx](./raw/kinetic_constants.xlsx) 收录 WT、PSW 及4种优势变体的 Km、kcat、kcat/Km。

> 这一目录用于存放数据文件，但 **大文件不要直接 commit**。

## 目录约定

```
data/
├── raw/         # 原始数据（绝大多数 .gitignore 掉）
├── processed/   # 处理后数据（同上）
└── README.md    # 数据目录索引（本文件）
```

## 数据索引

| 数据集                            | 路径                                              | 来源                                           | 大小     | 获取方式   | 数据指纹 (SHA-256)                                                   |
| --------------------------------- | ------------------------------------------------- | ---------------------------------------------- | -------- | ---------- | -------------------------------------------------------------------- |
| round_0 初筛吸光值                | `data/raw/round_0_screening.xlsx`               | 本项目湿实验结果                               | 10,129 B | 随仓库提交 | `bfb9e72796a1f80b6fe768fbda52d2cb009b7a6e4ca93d263c0df19250b71c8f` |
| zero-shot 候选整理数据            | `data/processed/round_0.xlsx`                   | 本项目湿实验结果整理                           | 6,638 B  | 随仓库提交 | `cedb1333f2d5db650cf5a94eb1ca6b6c9e2024a4698b577d839d3fd3efde497c` |
| round_1 全体复筛数据              | `data/raw/round_1_screening.xlsx`               | 本项目湿实验结果                               | 46,435 B | 随仓库提交 | `f4afc0ab42418da775bc8550b86f6f5a589170148d69330ca706d5dc4fda21a3` |
| round_1 正式候选数据              | `data/processed/round_1.xlsx`                   | 初筛与复筛合并，同突变以复筛整组覆盖；相对 PSW | 12,030 B | 随仓库提交 | `18a0a5044b6987ad0a40165766bd156a74cdf05f89dcd25a372a199bb3465cb3` |
| round_2 全体复筛数据              | `data/raw/round_2_screening.xlsx`               | 本项目湿实验结果                               | 34,028 B | 随仓库提交 | `3e276f3a695d045c8825e9b286de42384dc9546c2066072180a856856295bebc` |
| round_2 正式候选数据              | `data/processed/round_2.xlsx`                   | 初筛与复筛合并，同突变以复筛整组覆盖；相对 PSW | 12,511 B | 随仓库提交 | `862fbfb430a15548c962db291332ff90b9fc2cdb668777050ae336d0752efb75` |
| round_3 五突变体组合筛选原始数据  | `data/raw/round_3.xlsx`                         | 本项目湿实验结果                               | 10,930 B | 随仓库提交 | `f8dbe31f0fc09575070e400c32593664127772b30309069796c3f8747813d864` |
| round_3 五突变体正式候选数据      | `data/processed/round_3.xlsx`                   | 四突变体组合为五突变体；相对 PSW               | 6,342 B  | 随仓库提交 | `2fbe59ed7ccaae358de3252cdb2011c0f226c5dafb0e273997e81267ae1acd0d` |
| MAB2962 野生型蛋白序列            | `data/raw/mab2962_wild_type.faa`                | 本项目湿实验与序列资料                         | 1,235 B  | 随仓库提交 | `a3063d88f96ab6f2a0a09aec90f48485f4afeeb349f85de79489a172d3c9df7b` |
| PSW 蛋白序列（D281P/G420W/N514S） | `data/raw/mab2962_psw.faa`                      | 本项目湿实验与序列资料                         | 1,235 B  | 随仓库提交 | `170a3b875964a83f6ab8db8f2372fce2dbbe3b6bef127dab18c125d4fc21595f` |
| 纯酶活性原始读数                  | `data/raw/pure_enzyme_activity_initial.xlsx`    | 本项目纯酶 GABA 活性实验                       | 10,203 B | 随仓库提交 | `e1f35c0d7f33b3a31af1a6c94ef7826b5358c9ebef8e3d45e173565281ba6656` |
| 纯酶归一化活性                    | `data/raw/pure_enzyme_activity_normalized.xlsx` | 本项目纯酶 GABA 活性实验                       | 19,777 B | 随仓库提交 | `ae8984882037b072cf6b66814f0efde74c028f0f977b7b5095444fdfb8e8e9c2` |
| 动力学常数最终报告值              | `data/raw/kinetic_constants.xlsx`               | 本项目动力学图片与实验负责人校正               | 3,925 B  | 随仓库提交 | `3d7bafa82a9909f31301310b0e142c0183d1d976180ed549015e62c3d24a7bb2` |
| 突变体全细胞 1,4-丁二胺催化       | `data/raw/whole_cell_catalysis.xlsx`            | 本项目全细胞催化实验                           | 18,058 B | 随仓库提交 | `62b906b49972eb1195298815d2f2c3c65279a5d757667767925458c8d1bde545` |

> 文件名采用小写英文 snake_case：`raw` 保留仪器或实验来源数据，`processed` 中 round_0、round_1、round_2、round_3 统一采用 `name seq replicate1 replicate2 replicate3 average` 六列。replicate1–3 为每次测量相对原表同批次 PSW 基准的归一化值，average 使用 AVERAGE 计算有效重复的均值。

## 大数据如何处理

- 推荐用 [Git LFS](https://git-lfs.com/) 或 [DVC](https://dvc.org/)；
- 或者把数据放在公开数据库（NCBI / Zenodo / OSF）并在此处给出下载脚本。

## 数据卫生

- **不要** commit 任何包含个人身份信息的数据；
- **不要** commit 受版权保护或受限授权的数据集；
- 必要时使用 `data/.gitkeep` 占位但忽略大文件（已在 `.gitignore` 中配置）。
