# Parts · 元件库贡献

> 元件编号遵循 `AISB26-<队伍编号>-<元件序号>`。本队报名序号为 047；两个元件均无专利或保密限制。

## 1. 我们贡献的元件 / Our Parts

| 元件编号 | 名称 | 类型 | 功能描述 | 表征状态 |
|---|---|---|---|---|
| AISB26-047-001 | PSW-F430M | CDS | PSW 背景的 MAB2962 羧酸还原酶 F430M 变体，催化 GABA 还原反应 | 已表征 |
| AISB26-047-002 | PSW-L417A | CDS | PSW 背景的 MAB2962 羧酸还原酶 L417A 变体，催化 GABA 还原反应 | 已表征 |

## 2. 元件详情

### AISB26-047-001 · PSW-F430M

- **序列**：[sequence.fasta](../parts/AISB26-047-001/sequence.fasta)，3,555 bp CDS；表达质粒图见 [map.png](../parts/AISB26-047-001/map.png)。
- **设计依据**：在 Mycobacterium abscessus MAB2962 的 PSW 三突变体背景上引入 F430M。ESM-2 35M 用作训练编码器；ESM2-650M 用作 zero-shot 候选打分/对照。
- **构建方法**：全质粒反向 PCR、DpnI 消化和 DNA 测序验证，详见 [Wet Lab](./Wet-Lab-Experiments.md) 第 6.1 节。
- **功能表征**：纯酶归一化活性 1.74 ± 0.21；全细胞 1,4-丁二胺相对 PSW 产量 1.423 ± 0.039；三次重复及原始数据见 [characterization.md](../parts/AISB26-047-001/characterization.md)。
- **使用建议 / 局限**：用于 GABA 还原和 1,4-丁二胺路线的候选比较；尚未完成底物谱和放大验证。
- **是否保密**：否。

### AISB26-047-002 · PSW-L417A

- **序列**：[sequence.fasta](../parts/AISB26-047-002/sequence.fasta)，3,555 bp CDS；表达质粒图见 [map.png](../parts/AISB26-047-002/map.png)。
- **设计依据**：在 Mycobacterium abscessus MAB2962 的 PSW 三突变体背景上引入 L417A。ESM-2 35M 用作训练编码器；ESM2-650M 用作 zero-shot 候选打分/对照。
- **构建方法**：全质粒反向 PCR、DpnI 消化和 DNA 测序验证，详见 [Wet Lab](./Wet-Lab-Experiments.md) 第 6.1 节。
- **功能表征**：纯酶归一化活性 1.61 ± 0.07；全细胞 1,4-丁二胺相对 PSW 产量 1.473 ± 0.142；三次重复及原始数据见 [characterization.md](../parts/AISB26-047-002/characterization.md)。
- **使用建议 / 局限**：用于 GABA 还原和 1,4-丁二胺路线的候选比较；尚未完成底物谱和放大验证。
- **是否保密**：否。

*最后更新：2026年9月9日*
