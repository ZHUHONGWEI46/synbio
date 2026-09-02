const evidenceBase = '/NJTech-SynCAR-2026-main/submission/njtech-syncar/docs/中期进展汇报/中期进展图片';

export const pocketSites = Object.freeze([
  { label: 'D281', position: 281, wildTypeResidue: 'D', source: '分子对接口袋分析', note: 'GABA 5 Å 口袋候选位点' },
  { label: 'I302', position: 302, wildTypeResidue: 'I', source: '分子对接口袋分析', note: 'GABA 5 Å 口袋候选位点' },
  { label: 'M303', position: 303, wildTypeResidue: 'M', source: '分子对接口袋分析', note: 'GABA 5 Å 口袋候选位点' },
  { label: 'G306', position: 306, wildTypeResidue: 'G', source: '分子对接口袋分析', note: 'GABA 5 Å 口袋候选位点' },
  { label: 'A342', position: 342, wildTypeResidue: 'A', source: '分子对接口袋分析', note: 'GABA 5 Å 口袋候选位点' },
  { label: 'L343', position: 343, wildTypeResidue: 'L', source: '分子对接口袋分析', note: 'GABA 5 Å 口袋候选位点' },
  { label: 'V344', position: 344, wildTypeResidue: 'V', source: '分子对接口袋分析', note: 'GABA 5 Å 口袋候选位点' },
  { label: 'V396', position: 396, wildTypeResidue: 'V', source: '分子对接口袋分析', note: 'GABA 5 Å 口袋候选位点' },
]);

export const wetLabMilestones = Object.freeze([
  { mutation: 'A342E', result: '+45%', label: '相对 WT', batch: '半理性设计 · 单点验证' },
  { mutation: 'N514Y', result: '+67%', label: '相对 WT', batch: '半理性设计 · 单点验证' },
  { mutation: 'D281P', result: '+100%', label: '相对 WT', batch: '半理性设计 · 单点验证' },
  { mutation: 'D281P/G420W/N514S', result: '4.8×', label: '相对 WT', batch: '组合突变实验' },
]);

export const evidenceFigures = Object.freeze([
  {
    title: '高通量筛选原理',
    caption: '利用产物与显色体系在 435 nm 的吸收变化评价细胞催化活力。',
    src: `${evidenceBase}/图2 高通量筛选方法原理.jpg`,
  },
  {
    title: '96 孔板筛选流程',
    caption: '中期汇报中的培养、转化、显色和吸光值检测实验流程。',
    src: `${evidenceBase}/图3 高通量筛选方法的流程图.jpg`,
  },
  {
    title: 'A342 位点验证',
    caption: 'A342 位点突变体的细胞催化活力实验图，A342E 为报告中的正向结果。',
    src: `${evidenceBase}/图5 MAB2962 中 342、514 位进行突变后突变体的细胞催化活力-1.jpg`,
  },
  {
    title: 'N514 位点验证',
    caption: 'N514 位点突变体的细胞催化活力实验图，N514Y 为报告中的正向结果。',
    src: `${evidenceBase}/图5 MAB2962 中 342、514 位进行突变后突变体的细胞催化活力-2.jpg`,
  },
  {
    title: 'D281P 亲本组合筛选',
    caption: '以 D281P 为亲本在 N514、G420 位点继续筛选组合突变的实验结果。',
    src: `${evidenceBase}/图8 以 D281P 为亲本，在 N514、G420位饱和突变获得的正向突变体的细胞催化活力-2.jpg`,
  },
  {
    title: 'Zero-shot 候选实验结果',
    caption: 'Zero-shot 候选相对 M3 亲本的 Round 0 实验结果；本区不展示模型计算过程。',
    src: `${evidenceBase}/图9 Zero-shot预测后结果.jpg`,
  },
]);
