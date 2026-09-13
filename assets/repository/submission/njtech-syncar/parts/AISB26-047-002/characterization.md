# AISB26-047-002 · PSW-L417A 功能表征

- 最后更新：2026年9月9日
- 元件类型：3,555 bp MAB2962 CDS；PSW 三突变体背景上新增 L417A。

## 文件与构建说明

FASTA 文件 `sequence.fasta` 是本次提交的 **CDS**，只包含 AISB26-047-002 的 3,555 bp 编码序列；`map.png` 是该 CDS 所在的 pET28a 表达质粒图，质粒全长约 8,848 bp。两者长度不同是因为图谱包含表达载体骨架、标签和抗性元件。

以 pET28a-MAB2962 的 PSW 三突变体为模板，按 [Wet-Lab-Experiments.md](../../wiki/Wet-Lab-Experiments.md) 第 6.1 节采用全质粒反向 PCR 构建，DpnI 消化模板后转化，挑取单克隆进行 DNA 测序验证。

## 纯酶 GABA 活性

纯酶表达、纯化和活性检测参见 [Wet-Lab-Experiments.md](../../wiki/Wet-Lab-Experiments.md) 第 6.4–6.5 节。纯酶活性反应的酶终浓度统一为 **1 g/L**；归一化活性以 PSW = 1 计算。

| 变体 | 三次归一化活性 | 平均值 ± SD | n | 原始数据 |
|---|---|---:|---:|---|
| PSW-L417A | 1.69、1.57、1.58 | 1.61 ± 0.07 | 3 | [pure_enzyme_activity_normalized.xlsx](../../data/raw/pure_enzyme_activity_normalized.xlsx) |

## 全细胞 1,4-丁二胺催化

全细胞表达、催化和 HPLC 检测方法参见 [Wet-Lab-Experiments.md](../../wiki/Wet-Lab-Experiments.md) 第 6.6–6.7 节。本批原始数据记录的细胞密度为 OD600 = 40、反应时间为 22 h；相对产量以同批 PSW 对照归一化为 1。

| 变体 | 三次产物浓度（mM） | 三次相对 PSW 产量 | 平均相对产量 ± SD | n | 原始数据 |
|---|---|---|---:|---:|---|
| PSW-L417A | 0.6945、0.8422、0.7610 | 1.336、1.620、1.463 | 1.473 ± 0.142 | 3 | [whole_cell_catalysis.xlsx](../../data/raw/whole_cell_catalysis.xlsx) |

## 结论与局限

在上述批次和归一化定义下，PSW-L417A 的纯酶 GABA 活性及全细胞 1,4-丁二胺相对产量均高于 PSW。结果为三次重复的均值 ± 样本 SD；未在此声明统计显著性。不同批次、底物谱和放大条件尚未验证。
