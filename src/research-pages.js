import { feedbackDiagram } from './narrative.js?v=20260909-gsap-complete';
import { dockingModels } from './docking-models.js';
const base = 'assets/repository/submission/njtech-syncar/wiki/';
export const researchModules = [
  ['validation', '干湿闭环', 'Integrated-Validation.md', '从候选设计到实验反馈，追踪每一轮验证。'],
  ['engineering', '工程循环', 'Engineering-Cycle.md', '阶段性迭代、设计依据与尚待完成的工作。'],
  ['wet-lab', '湿实验', 'Wet-Lab-Experiments.md', '突变构建、筛选、纯酶表征与产物检测。'],
  ['ai-methods', 'AI 计算方法', 'AI-Computational-Methods.md', '两阶段模型、数据组织与评估方案。'],
  ['verifiability', '可验证性', 'Verifiability.md', '数据来源、文件指纹与复现边界。'],
  ['human-practices', '项目影响', 'Human-Practices.md', '外部反馈如何改变实验解释、评价指标与项目边界。'],
  ['education', '教育与科普', 'Education.md', '面向本科生解释 AI、酶工程与实验验证。'],
  ['collaboration', '团队合作', 'Collaboration.md', '跨团队技术交流、双方贡献与未完成方向。'],
  ['ai-safety', '安全与伦理', 'AI-Ethics-Safety.md', '数据、模型、隐私与双重用途边界。'],
  ['attributions', '贡献标注', 'Attributions.md', '团队原创工作、外部协助和工具来源。'],
];
const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const moduleRoutes = {
  validation: ['设计候选', '构建变体', '实验验证', '数据反馈'],
  engineering: ['提出问题', '设计方案', '实施测试', '迭代记录'],
  'wet-lab': ['突变构建', '活性筛选', '纯酶表征', '产物检测'],
  'ai-methods': ['数据组织', '特征表征', '模型评估', '候选推荐'],
  verifiability: ['原始文件', '来源追踪', '指纹校验', '复现边界'],
  'human-practices': ['听取反馈', '改变设计', '落实验证', '说明边界'],
  education: ['目标受众', '科普活动', '材料归档', '反馈记录'],
  collaboration: ['交流问题', '双方贡献', '形成启发', '未来接口'],
  'ai-safety': ['数据来源', '用途风险', '安全材料', '诚信边界'],
  attributions: ['团队贡献', '外部协助', '模型工具', 'AI 辅助'],
};
export function researchHeaderArt(id) {
  const row = researchModules.findIndex(module => module[0] === id);
  if (row < 0) return '';
  return `<div class="research-header-art" aria-hidden="true" style="--art-row:${(row % 5) * 25}%"><div class="research-art-sprite"></div><svg class="research-art-orbit" viewBox="0 0 700 180"><path d="M25 145 C190 175 455 5 675 70"/><circle r="3"><animateMotion dur="14s" repeatCount="indefinite" path="M25 145 C190 175 455 5 675 70"/></circle></svg><small>研究流程示意 · 非实验结果</small></div>`;
}
export function moduleGuide(id) {
  if (id === 'human-practices') return `<div class="impact-directory"><div><small>PROJECT IMPACT</small><h2>反馈不是装饰，而是设计输入。</h2><p>查看外部意见如何改变实验解释、评价尺度与项目边界。</p></div><nav aria-label="项目影响相关页面"><a href="#human-practices" data-project-topic="human-practices"><b>人类实践</b><span>反馈如何进入设计</span></a><a href="#education" data-project-topic="education"><b>教育科普</b><span>面向本科生的沟通</span></a><a href="#collaboration" data-project-topic="collaboration"><b>团队合作</b><span>跨团队技术交流</span></a><a href="#ai-safety" data-project-topic="ai-safety"><b>安全与伦理</b><span>能力与风险边界</span></a><a href="#attributions" data-project-topic="attributions"><b>贡献标注</b><span>原创、协助与工具</span></a></nav></div>`;
  if (id === 'ai-methods') return `<span class="route-caption">历史时间前向评估 / R0—R2</span><div class="method-pipeline"><div><small>INPUT</small><b>PSW 背景候选</b><p>R0、R1、R2<br>实验相对活性</p></div><div><small>ENCODER</small><b>ESM2-650M</b><p>冻结序列表征<br>zero-shot 基线</p></div><div><small>MODELS</small><b>RF 与 FCNN</b><p>仅用历史轮次拟合<br>固定未来测试集</p></div><div><small>EVALUATION</small><b>Spearman 排序评估</b><p>三个时间划分<br>Round 3 不参与</p></div></div><p>已归档历史 benchmark；表现随模型与测试轮次变化。网页评分仍仅作演示。</p>`;
  if (id === 'validation') return `<div class="validation-map evidence-map">${feedbackDiagram()}<div><span class="route-caption">EVIDENCE MAP / R0 → R1 → R2</span><h2>实验反馈真正进入下一轮。</h2><div class="evidence-chain" aria-label="R0到R2的闭环证据"><span><small>01 · ZERO-SHOT</small><b>推荐 R0 候选</b><em>实验最佳 1.118×</em></span><i>→</i><span><small>02 · TRAIN</small><b>R0 标签训练模型</b><em>进入 R1 预测与实验</em></span><i>→</i><span><small>03 · FEEDBACK</small><b>加入 R1 实验标签</b><em>固定 R2 未来测试集</em></span><i>→</i><span><small>04 · VERIFY</small><b>前向评估＋湿实验</b><em>FCNN −0.040 → 0.118</em></span></div><p>该提升只属于同一 R2 测试集上的 FCNN，不代表所有模型改善；R3 为独立的回顾性边界挑战。</p><div class="evidence-actions"><a href="#ai-methods" data-project-topic="ai-methods">核对模型评估 ↗</a><a href="#wet-lab" data-project-topic="wet-lab">核对湿实验 ↗</a><a href="#verifiability" data-project-topic="verifiability">核对来源与缺口 ↗</a></div></div></div>`;
  if (id === 'verifiability') return `<div class="evidence-boundaries"><div><b>可检查的材料</b><p>R0—R2 正式候选表、历史 benchmark 代码、表征结果、两个 DNA 元件及数据指纹。</p></div><div><b>尚待补齐的证据</b><p>实际运行日志、模型缓存版本、输出文件哈希与实验重复类型确认。</p></div></div><p>Round 3 仅作高阶突变方法边界分析；复现需要本地 ESM2 模型缓存。</p>`;
  if (id === 'engineering') return `<span class="route-caption">ITERATION JOURNAL / 工程笔记</span><p>按版本追踪“为什么改、改了什么”。下方时间线来自原始迭代表；未完成事项单独标记，不将脚本归档等同于模型验证完成。</p>`;
  return `<span class="route-caption">实验方法索引 <small>METHODS · 非完成状态</small></span><ol>${moduleRoutes[id].map((label, i) => `<li><span>0${i + 1}</span><strong>${label}</strong></li>`).join('')}</ol>`;
}
function inline(text, source) {
  return escape(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/&lt;(\/?(?:sup|sub))&gt;/g, '<$1>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, title, link) => {
      const module = researchModules.find((item) => link.endsWith(item[2]));
      if (module) return `<a href="#${module[0]}" data-project-topic="${module[0]}">${title}</a>`;
      const url = new URL(link.replaceAll('&amp;', '&'), new URL(source, location.href));
      return ['http:', 'https:'].includes(url.protocol) ? `<a href="${escape(url.href)}" target="_blank" rel="noopener">${title}</a>` : title;
    });
}
export function renderDocument(markdown, source, id) {
  const lines = markdown.split(/\r?\n/); const output = []; const contents = []; let index = 0;
  const render = (text) => inline(text, source);
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || /^---+$/.test(line.trim()) || /^# /.test(line)) { index++; continue; }
    if (line.startsWith('```')) {
      const code = []; index++; while (index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++]);
      output.push(`<pre><code>${escape(code.join('\n'))}</code></pre>`); index++; continue;
    }
    const heading = line.match(/^(#{2,4}) (.+)$/);
    if (heading) {
      const anchor = `${id}-section-${index}`; const level = heading[1].length;
      output.push(`<h${level} id="${anchor}">${render(heading[2])}</h${level}>`);
      if (level === 2) contents.push(`<button type="button" data-research-anchor="${anchor}">${escape(heading[2].replace(/ \/ .*/, ''))}</button>`);
      index++; continue;
    }
    if (/^\s*\|/.test(line)) {
      const rows = []; while (index < lines.length && /^\s*\|/.test(lines[index])) rows.push(lines[index++]);
      const cells = (row, tag) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => `<${tag}>${render(c.trim())}</${tag}>`).join('');
      const dataRows = rows.slice(1).filter((row) => !/^\s*\|[\s:|-]+\|\s*$/.test(row));
      if (id === 'engineering' && rows[0].includes('触发原因')) {
        output.push(`<ol class="research-timeline">${dataRows.map((row) => {
          const [version, time, change, reason] = row.trim().replace(/^\||\|$/g, '').split('|').map((c) => render(c.trim()));
          return `<li><b>${version}<small>${time}</small></b><div><p>${change}</p><em>触发原因 / ${reason}</em></div></li>`;
        }).join('')}</ol>`);
      } else output.push(`<div class="research-table"><table><thead><tr>${cells(rows[0], 'th')}</tr></thead><tbody>${dataRows.map((row) => `<tr>${cells(row, 'td')}</tr>`).join('')}</tbody></table></div>`); continue;
    }
    if (/^\s*(?:- |\d+\. )/.test(line)) {
      const ordered = /^\s*\d+\./.test(line); const tag = ordered ? 'ol' : 'ul'; const list = [];
      const checklist = /^\s*- \[[ x]\]/i.test(line);
      while (index < lines.length && /^\s*(?:- |\d+\. )/.test(lines[index])) {
        const item = lines[index++].replace(/^\s*(?:- |\d+\. )/, '');
        if (checklist && /^\[[ x]\]/i.test(item)) {
          const done = /^\[x\]/i.test(item);
          list.push(`<li class="${done ? 'is-recorded' : 'is-pending'}"><span>${done ? '已归档' : '待完成'}</span><div>${render(item.slice(3).trim())}</div></li>`);
        } else list.push(`<li>${render(item)}</li>`);
      }
      output.push(`<${tag}${checklist ? ' class="research-checklist"' : ''}>${list.join('')}</${tag}>`); continue;
    }
    if (line.startsWith('>')) output.push(`<aside class="research-source-note">${render(line.replace(/^>\s*/, ''))}</aside>`);
    else output.push(`<p>${render(line)}</p>`);
    index++;
  }
  return { html: output.join('\n'), contents: contents.join('') };
}

export function initResearchPages() {
  const main = document.querySelector('.app-main');
  for (const [id, title, file, description] of researchModules) {
    const section = document.createElement('section');
    section.className = 'page-view research-page'; section.dataset.appView = id; section.hidden = true;
    section.setAttribute('aria-label', title);
    section.innerHTML = `<div class="research-scroll"><header class="research-header"><span>RESEARCH / NJTECH-SYNCAR</span><h1>${title}</h1><p>${description}</p><a href="${base + file}" target="_blank" rel="noopener">原始文档 ↗</a><small>资料版本：用户提供的 2026-09-11 仓库快照</small></header><div class="research-layout"><nav class="research-contents" aria-label="${title}章节目录"></nav><article class="research-article" aria-live="polite"><p>正在载入研究资料…</p></article></div></div>`;
    main.append(section);
    section.querySelector('.research-header').insertAdjacentHTML('beforeend', researchHeaderArt(id));
    const route = document.createElement('div');
    route.className = 'research-route';
    route.innerHTML = moduleGuide(id);
    section.querySelector('.research-header').append(route);
    fetch(base + file + '?v=20260911').then((response) => { if (!response.ok) throw new Error('load'); return response.text(); }).then((text) => {
      const result = renderDocument(text, base + file, id);
      section.querySelector('.research-article').innerHTML = result.html;
      section.querySelector('.research-contents').innerHTML = result.contents;
      if (id === 'wet-lab') appendEvidence(section);
      const scroller = section.querySelector('.research-scroll');
      const buttons = [...section.querySelectorAll('[data-research-anchor]')];
      buttons[0]?.classList.add('is-current');
      buttons[0]?.setAttribute('aria-current', 'location');
      const headings = buttons.map((button) => document.getElementById(button.dataset.researchAnchor));
      let pending = false;
      let selectedByClick = null;
      const select = (active) => buttons.forEach((button, i) => {
        button.classList.toggle('is-current', i === active);
        if (i === active) button.setAttribute('aria-current', 'location');
        else button.removeAttribute('aria-current');
      });
      const updateContents = () => {
        pending = false;
        if (section.hidden) return;
        if (selectedByClick !== null) { select(selectedByClick); return; }
        const top = scroller.getBoundingClientRect().top;
        let active = 0;
        headings.forEach((heading, i) => { if (heading && heading.getBoundingClientRect().top < top + 140) active = i; });
        // Short final sections cannot reach the top threshold before scrolling ends.
        const maxScroll = scroller.scrollHeight - scroller.clientHeight;
        if (maxScroll > 2 && scroller.scrollTop >= maxScroll - 2) {
          headings.forEach((heading, i) => { if (heading) active = i; });
        }
        select(active);
      };
      buttons.forEach((button, i) => button.addEventListener('click', () => {
        const heading = headings[i];
        if (!heading) return;
        selectedByClick = i;
        select(i);
        // Leave room for the collapsed sticky mobile directory above the heading.
        const anchorOffset = matchMedia('(max-width: 760px)').matches ? 100 : 22;
        const target = scroller.scrollTop + heading.getBoundingClientRect().top - scroller.getBoundingClientRect().top - anchorOffset;
        scroller.scrollTo({ top: Math.max(0, target), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }));
      const resumeTracking = () => { selectedByClick = null; requestAnimationFrame(updateContents); };
      scroller.addEventListener('wheel', resumeTracking, { passive: true });
      scroller.addEventListener('touchstart', resumeTracking, { passive: true });
      scroller.addEventListener('pointerdown', (event) => {
        if (!event.target.closest('[data-research-anchor]')) resumeTracking();
      });
      scroller.addEventListener('keydown', (event) => {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) resumeTracking();
      });
      scroller.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateContents); } }, { passive: true });
    }).catch(() => { section.querySelector('.research-article').innerHTML = `<p>暂时无法载入资料，请<a href="${base + file}">打开原始文档</a>查看。</p>`; });
  }
}

function appendEvidence(section) {
  const article = section.querySelector('.research-article');
  section.querySelector('.research-contents').insertAdjacentHTML('beforeend', '<button type="button" data-research-anchor="wet-lab-evidence">历史实验图证</button><button type="button" data-research-anchor="latest-wet-results">新增结果与数据</button>');
  const gallery = document.getElementById('wet-lab-evidence');
  if (gallery) article.append(gallery);
  const evidence = document.createElement('section'); evidence.id = 'latest-wet-results';
  evidence.innerHTML = `<h2>新增结果与数据文件</h2><p>F430M 与 L417A 的全细胞催化和纯酶活性图分别展示，归一化含义以各图标注为准。新增批次原始表独立保留，不与 Round 0 自动合并。</p><div class="research-figures">${['F430M和L417A全细胞催化归一化数据.jpg', 'F430M和L417A酶活测定归一化数据.jpg'].map((file) => `<figure><a href="assets/repository/results/figures/${file}" target="_blank" rel="noopener"><img loading="lazy" src="assets/repository/results/figures/${file}" alt="${file.replace('.jpg','')}" /></a><figcaption>${file.replace('.jpg','')} · 点击查看原图</figcaption></figure>`).join('')}</div>`;
  article.append(evidence);
  const structures = document.createElement('section');
  structures.id = 'variant-docking-structures';
  structures.innerHTML = '<h2>变体对接结构</h2><p>已核对 8 个模型的 A 链残基与突变构建。下列实验候选可在工作台查看对应模型；结构来自 AF3 来源受体的 GNINA 对接代表构象，未经能量最小化，不作为实测活性或机制已验证的证据。</p><div class="docking-evidence-links">'+dockingModels.filter(model=>model.parent==='M3'&&model.addition).map(model=>`<a href="#design" data-docking-model="${model.id}"><strong>${model.id}</strong><span>${model.addition.includes('/')?'R3 · 五突变回顾性挑战':'R1 · 四突变候选'} ↗</span></a>`).join('')+'</div><p>WT、PSW 亲本与 WT 背景 G980M 单突变模型可通过工作台“结构来源”独立查看。G980M 单突变与 PSW-G980M 四突变不能互换实验结果。</p>';
  evidence.before(structures);
  section.querySelector('.research-contents').insertAdjacentHTML('beforeend','<button type="button" data-research-anchor="variant-docking-structures">变体对接结构</button>');
  const parts = document.createElement('section');
  parts.innerHTML = '<h2>已表征 DNA 元件</h2><p>PSW-F430M 与 PSW-L417A：纯酶相对活性分别为 1.74 ± 0.21、1.61 ± 0.07；全细胞相对产物表现分别为 1.423 ± 0.039、1.473 ± 0.142（相对 PSW，n=3）。</p>' + ['001', '002'].map((n, i) => '<p><strong>AISB26-047-' + n + ' · ' + ['PSW-F430M', 'PSW-L417A'][i] + '</strong> · <a href="assets/repository/submission/njtech-syncar/parts/AISB26-047-' + n + '/sequence.fasta" download>CDS 序列</a> · <a href="assets/repository/submission/njtech-syncar/parts/AISB26-047-' + n + '/characterization.md" target="_blank" rel="noopener">表征记录</a></p>').join('');
  evidence.before(parts);
  evidence.insertAdjacentHTML('beforeend', '<p><a href="#experiments" data-view-target="experiments">进入 Round 0 实验数据中心 →</a></p>');
}
