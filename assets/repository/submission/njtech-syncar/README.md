# AI + Synthetic Biology Project — Team NJTech-SynCAR

> **面向丁二胺生物制造的 AI 驱动羧酸还原酶改造平台**
>
> 一句话项目介绍：本项目融合半理性设计与AI闭环进化，提升CAR对GABA的催化效率，突破1,4-丁二胺绿色生物制造的关键酶瓶颈。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Wiki](https://img.shields.io/badge/Wiki-/wiki-blue)](./wiki/Home.md)

---

## 1. 项目简介 / Project Overview

**研究问题**：如何利用 AI 辅助酶工程提高羧酸还原酶（CAR）对 GABA 的识别与转化效率，突破从 L-谷氨酸经 GABA 生物制造 1,4-丁二胺路线中的关键酶催化瓶颈。

**所选赛道**：T3 工业生物制造

**核心方法**：结合半理性突变设计、高通量酶活筛选与蛋白序列结构特征建模，构建“实验数据反馈—AI 学习—突变预测—湿实验验证”的 CAR 定向改造闭环。

**预期产出**：获得活性提升的 CAR 候选突变体及相关 DNA 元件，形成可追溯的酶活数据集、AI 预测模型与训练/推理脚本，并输出面向 1,4-丁二胺绿色生物制造的可复现技术路线、实验验证结果和 Wiki/报告材料。

---

## 2. 目录结构 / Repository Layout

```
.
├── README.md                  # 你正在看的这份文件
├── LICENSE                    # 默认 MIT，必要时可替换
├── .gitignore
├── requirements.txt           # Python 依赖清单
├── Dockerfile                 # 一键复现的容器配置
├── attributions.md            # 项目贡献标注（每一行代码、每一份数据的来源都在这里）
│
├── src/
│   ├── ai/                    # AI / 计算代码
│   │   ├── README.md
│   │   ├── models/            # 模型定义
│   │   ├── data/              # 数据加载与预处理脚本
│   │   └── scripts/           # 训练 / 推理 / 评估的入口脚本
│   └── wet_lab/               # 与湿实验配套的脚本（数据分析、图表绘制等）
│       └── README.md
│
├── data/                      # 数据（大文件请配合 Git LFS 或公开数据集链接）
│   ├── raw/                   # 原始数据
│   ├── processed/             # 处理后数据
│   └── README.md
│
├── notebooks/                 # 探索性分析与可视化（.ipynb）
├── docs/                      # 设计文档、技术备忘录、演示稿
├── results/                   # 关键结果与图表
│   ├── figures/
│   └── README.md
│
├── parts/                     # DNA 元件设计、序列与表征数据
│   └── README.md
│
├── safety/                    # 安全审批材料归档
│   ├── README.md
│   └── checkin_records/       # Check-In 记录
│
└── wiki/                      # 项目 Wiki 页面（评审依据之一）
    ├── Home.md
    ├── Project-Description.md
    ├── Design.md
    ├── AI-Computational-Methods.md   # 必设页面
    ├── Wet-Lab-Experiments.md         # 必设页面
    ├── Integrated-Validation.md
    ├── Verifiability.md
    ├── Engineering-Cycle.md
    ├── Parts.md
    ├── Human-Practices.md
    ├── AI-Ethics-Safety.md            # 必设页面
    ├── Education.md
    ├── Collaboration.md
    └── Attributions.md                # 必设页面
```

---

## 3. 快速开始 / Getting Started

### 3.1 环境准备

```bash
python -m pip install -r requirements.txt
```

> 完整 AI 训练脚本还依赖与本地硬件匹配的 PyTorch / ESM 相关环境；长时间训练前请先根据 `src/ai/` 中脚本和配置锁定依赖版本。

### 3.2 一键复现关键结果

```bash
# 当前一键复现流程正在完善中；可先查看中期材料、数据与阶段性结果索引
ls docs/中期进展汇报
ls data/raw data/processed
cat data/README.md
cat results/README.md
```

> 完整训练 / 评估的一键复现命令待训练数据、模型权重与评估指标锁定后补充。

---

## 4. 给评审 / 同行的快速导航

| 你想了解……                             | 请打开                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| 项目要解决什么问题、怎么做               | [`wiki/Project-Description.md`](./wiki/Project-Description.md)           |
| AI 模型架构、数据、基线                  | [`wiki/AI-Computational-Methods.md`](./wiki/AI-Computational-Methods.md) |
| 湿实验方案与原始数据                     | [`wiki/Wet-Lab-Experiments.md`](./wiki/Wet-Lab-Experiments.md)           |
| 干湿如何闭环                             | [`wiki/Integrated-Validation.md`](./wiki/Integrated-Validation.md)       |
| 第三方如何复现关键结果                   | [`wiki/Verifiability.md`](./wiki/Verifiability.md)                       |
| AI 伦理与安全说明                        | [`wiki/AI-Ethics-Safety.md`](./wiki/AI-Ethics-Safety.md)                 |
| 哪些部分是我们做的、哪些是站在巨人肩膀上 | [`attributions.md`](./attributions.md)                                   |

---

## 5. 团队 / Team

| 姓名   | 角色         | 主要负责                         |
| ------ | ------------ | -------------------------------- |
| 郑妍   | Primary PI   | 项目设计                         |
| 王昕   | Secondary PI | 指导与审核                       |
| 蔡一南 | 队长         | 突变构建与筛选，项目管理         |
| 郑天恩 | AI / 计算    | 模型设计与训练，推荐优势突变体   |
| 陈静雯 | 湿实验       | 纯酶表征、全细胞催化、杂泛性验证 |
| 朱宏伟 | 人类实践     | wiki 编辑、报告材料              |

---

## 6. 许可与引用 / License & Citation

- 代码以 MIT 协议开源（见 [`LICENSE`](./LICENSE)）。
- 提交至大赛 Registry 的 DNA 元件遵循大赛共享协议。
- 引用本项目：

```bibtex
@misc{your_team_2026,
  title  = {面向丁二胺生物制造的 AI 驱动羧酸还原酶改造平台},
  author = {NJTech-SynCAR},
  year   = {2026},
  note   = {AI + 合成生物创新大赛 2026 赛季},
  url    = {待官方仓库同步后补充}
}
```

---

## 7. 联系 / Contact

- 队长邮箱：2844550384@qq.com
- Primary PI 邮箱：zyan@njtech.edu.cn
- 大赛组委会：synbio@tju.edu.cn
