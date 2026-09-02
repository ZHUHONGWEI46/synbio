export const verificationAssets = Object.freeze([
  Object.freeze({
    name: 'zero-shot 初筛吸光值',
    path: 'data/raw/zero-shot 初筛吸光值.xlsx',
    sha256: 'bfb9e72796a1f80b6fe768fbda52d2cb009b7a6e4ca93d263c0df19250b71c8f',
    currentSha256: 'bfb9e72796a1f80b6fe768fbda52d2cb009b7a6e4ca93d263c0df19250b71c8f',
    verificationNote: '当前文件与 Wiki 登记指纹一致',
  }),
  Object.freeze({
    name: 'Round 0 候选整理数据',
    path: 'data/processed/round_0.xlsx',
    sha256: '18b20b5a715b02cba91b02bd48646737a361f36b54d8ac863cee2afaaf6868d4',
    currentSha256: '18b20b5a715b02cba91b02bd48646737a361f36b54d8ac863cee2afaaf6868d4',
    verificationNote: '当前文件与 Wiki 登记指纹一致',
  }),
  Object.freeze({
    name: 'MAB2962 野生型序列',
    path: 'data/raw/MAB2962.fa',
    sha256: 'a3063d88f96ab6f2a0a09aec90f48485f4afeeb349f85de79489a172d3c9df7b',
    currentSha256: 'd235ebf2386fc67fff0f2ddb17ab32cff5d5fd757f16d41530580b3198f64475',
    verificationNote: 'Wiki 指纹对应 CRLF；当前工作区为 LF，序列内容未变',
  }),
  Object.freeze({
    name: 'M3 三突变体序列',
    path: 'data/raw/MAB2962 D281P-G420W-N514S.fa',
    sha256: '170a3b875964a83f6ab8db8f2372fce2dbbe3b6bef127dab18c125d4fc21595f',
    currentSha256: '52b87e89a131719c326f0e6200a270c58a27d9efc6e7d18f0fe2cd13546fc9ca',
    verificationNote: 'Wiki 指纹对应 CRLF；当前工作区为 LF，序列内容未变',
  }),
]);

const freezeFacts = (facts) => Object.freeze(facts.map((fact) => Object.freeze(fact)));

export const wikiDossier = Object.freeze([
  Object.freeze({
    id: 'validation',
    label: '干湿闭环',
    title: 'Integrated Validation',
    summary: '以真实实验反馈推动下一轮候选设计，不把一次预测当作最终结论。',
    source: 'wiki/Integrated-Validation.md',
    facts: freezeFacts([
      { label: 'Design', value: '结构分析与候选位点筛选', detail: '多序列比对、AlphaFold3、分子对接与候选打分' },
      { label: 'Build', value: '单点、饱和与组合突变', detail: '构建并测序验证 CAR 突变体' },
      { label: 'Test', value: '96 孔板 A435nm 筛选', detail: '以三突变体作为 Round 0 相对活性基准' },
      { label: 'Learn', value: '实测数据回流', detail: 'Round 0 数据用于下一轮候选优先级判断' },
    ]),
  }),
  Object.freeze({
    id: 'engineering',
    label: '工程循环',
    title: 'Engineering Cycle',
    summary: '仅展示已归档的非模型工程里程碑。',
    source: 'wiki/Engineering-Cycle.md',
    facts: freezeFacts([
      { label: 'v0.1 · 2026-05', value: '项目方案与安全材料归档', detail: '完成开题与安全材料准备' },
      { label: 'v0.2 · 2026-06 至 07', value: '建立高通量筛选方法', detail: '开展 A342、N514 等位点验证' },
      { label: 'v0.3 · 2026-07', value: '获得 M3 三突变体', detail: 'D281P/G420W/N514S 表现最佳' },
      { label: 'v0.4 · 2026-07', value: '完成 Round 0 湿实验验证', detail: '整理 zero-shot 初筛与 round_0.xlsx' },
    ]),
  }),
  Object.freeze({
    id: 'wet-lab',
    label: '湿实验',
    title: 'Wet Lab / Experiments',
    summary: '已经建立 MAB2962 突变体的 96 孔板全细胞催化活力筛选流程。',
    source: 'wiki/Wet-Lab-Experiments.md',
    facts: freezeFacts([
      { label: '构建菌株', value: 'E. coli DH5α', detail: '质粒转化与扩增' },
      { label: '表达菌株', value: 'E. coli BL21(DE3)', detail: 'CAR 表达与全细胞催化' },
      { label: '反应体系', value: '20 mM GABA · 10 mM Mg²⁺', detail: '5 g/L D-葡萄糖 · 2 mM 2-ABA' },
      { label: '检测条件', value: '30℃ · 1000 rpm · 6 h', detail: '取上清测定 A435nm' },
    ]),
  }),
  Object.freeze({
    id: 'verifiability',
    label: '可验证性',
    title: 'Verifiability',
    summary: '序列、实验表和阶段性结论均可回到仓库文件复核。',
    source: 'wiki/Verifiability.md · data/README.md',
    facts: freezeFacts(verificationAssets.map(({ name, path, sha256, currentSha256, verificationNote }) => ({
      label: name,
      value: path,
      detail: 'SHA-256 文件指纹复核',
      hash: `Wiki 登记：${sha256}`,
      currentHash: currentSha256 === sha256 ? '' : `当前文件：${currentSha256}`,
      verificationNote,
    }))),
  }),
  Object.freeze({
    id: 'safety',
    label: '安全边界',
    title: 'AI Ethics & Safety',
    summary: '当前范围是单一工业酶活性改造，不涉及病原体增强、临床数据或个人隐私。',
    source: 'wiki/AI-Ethics-Safety.md',
    facts: freezeFacts([
      { label: '数据隐私', value: '不涉及可识别个人信息', detail: '不包含临床样本或人类组学数据' },
      { label: '双重用途', value: '当前判断为低风险', detail: '不涉及病原体、毒素或抗药性设计' },
      { label: '实验审核', value: '候选进入实验前经团队与 PI 审核', detail: '新增风险先更新 safety 材料' },
      { label: 'Check-In', value: '中期阶段无新增预审批事项', detail: '后续变化需单独归档' },
    ]),
  }),
  Object.freeze({
    id: 'attributions',
    label: '贡献标注',
    title: 'Attributions',
    summary: '区分团队原创工作、指导审核与外部工具支持。',
    source: 'attributions.md · wiki/Attributions.md',
    facts: freezeFacts([
      { label: '郑妍 · Primary PI', value: '项目设计与方向把控', detail: '团队指导' },
      { label: '王昕 · Secondary PI', value: '指导与审核', detail: '团队指导' },
      { label: '蔡一南 · 队长', value: '突变构建、筛选与项目管理', detail: '团队原创工作' },
      { label: '郑天恩 · 队员', value: '计算模型设计与训练', detail: '团队原创工作' },
      { label: '陈静雯 · 队员', value: '湿实验与全细胞催化', detail: '团队原创工作' },
      { label: '朱宏伟 · 队员', value: 'Wiki、报告与人类实践材料', detail: '团队原创工作' },
      { label: 'AlphaFold3', value: 'MAB2962 结构预测', detail: '外部结构预测工具' },
      { label: 'AutoDock', value: '底物与辅因子对接分析', detail: '外部分子对接工具' },
    ]),
  }),
]);
