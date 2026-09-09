import { feedbackDiagram } from './narrative.js?v=20260909-gsap-complete';
const base = 'assets/repository/submission/njtech-syncar/wiki/';
export const researchModules = [
  ['validation', '干湿闭环', 'Integrated-Validation.md', '从候选设计到实验反馈，追踪每一轮验证。'],
  ['engineering', '工程循环', 'Engineering-Cycle.md', '阶段性迭代、设计依据与尚待完成的工作。'],
  ['wet-lab', '湿实验', 'Wet-Lab-Experiments.md', '突变构建、筛选、纯酶表征与产物检测。'],
  ['ai-methods', 'AI 计算方法', 'AI-Computational-Methods.md', '两阶段模型、数据组织与评估方案。'],
  ['verifiability', '可验证性', 'Verifiability.md', '数据来源、文件指纹与复现边界。'],
];
const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const moduleRoutes = {
  validation: ['设计候选', '构建变体', '实验验证', '数据反馈'],
  engineering: ['提出问题', '设计方案', '实施测试', '迭代记录'],
  'wet-lab': ['突变构建', '活性筛选', '纯酶表征', '产物检测'],
  'ai-methods': ['数据组织', '特征表征', '模型评估', '候选推荐'],
  verifiability: ['原始文件', '来源追踪', '指纹校验', '复现边界'],
};
export function moduleGuide(id) {
  if (id === 'ai-methods') return `<span class="route-caption">两阶段建模方案 / MODEL ARCHITECTURE</span><div class="method-pipeline"><div><small>INPUT</small><b>序列与实验数据</b><p>野生型 / 突变体<br>相对活性</p></div><div><small>STAGE 01</small><b>ESM-2 + LoRA</b><p>掩码语言建模<br>适应目标序列空间</p></div><div><small>STAGE 02</small><b>Δ Embedding + MLP</b><p>突变效应表征<br>活性回归</p></div><div><small>OUTPUT</small><b>候选排序</b><p>推荐后续变体<br>返回湿实验验证</p></div></div><p>依据原文方案绘制；完整训练指标尚未锁定。此处不是在线预测服务。</p>`;
  if (id === 'validation') return `<div class="validation-map">${feedbackDiagram()}<div><span class="route-caption">DESIGN ↔ EVIDENCE</span><h2>实验是连接两轮设计的桥梁。</h2><p>先查看已有实验反馈，再区分下一轮计划。推荐、构建、测试和学习并不等于四个阶段均已完成。</p><a href="#wet-lab" data-project-topic="wet-lab">交叉阅读：湿实验方法与原始图证 ↗</a></div></div>`;
  if (id === 'engineering') return `<span class="route-caption">ITERATION JOURNAL / 工程笔记</span><p>按版本追踪“为什么改、改了什么”。下方时间线来自原始迭代表；未完成事项单独标记，不将脚本归档等同于模型验证完成。</p>`;
  if (id === 'verifiability') return `<div class="evidence-boundaries"><div><b>可检查的材料</b><p>原始与处理数据、序列文件、数据指纹、阶段性图表和代码入口。</p></div><div><b>尚待补齐的证据</b><p>完整训练指标、模型权重、最终 commit 绑定与完整电子实验记录。</p></div></div><p>材料的存在不等于结论已复现；具体可验证范围以正文为准。</p>`;
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
    section.innerHTML = `<div class="research-scroll"><header class="research-header"><span>RESEARCH / NJTECH-SYNCAR</span><h1>${title}</h1><p>${description}</p><a href="${base + file}" target="_blank" rel="noopener">原始文档 ↗</a><small>资料版本：用户提供的 2026-09-08 仓库快照</small></header><div class="research-layout"><nav class="research-contents" aria-label="${title}章节目录"></nav><article class="research-article" aria-live="polite"><p>正在载入研究资料…</p></article></div></div>`;
    main.append(section);
    const route = document.createElement('div');
    route.className = 'research-route';
    route.innerHTML = moduleGuide(id);
    section.querySelector('.research-header').append(route);
    fetch(base + file).then((response) => { if (!response.ok) throw new Error('load'); return response.text(); }).then((text) => {
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
      const updateContents = () => {
        pending = false;
        if (section.hidden) return;
        const top = scroller.getBoundingClientRect().top;
        let active = 0;
        headings.forEach((heading, i) => { if (heading && heading.getBoundingClientRect().top < top + 140) active = i; });
        buttons.forEach((button, i) => { button.classList.toggle('is-current', i === active); button.setAttribute('aria-current', i === active ? 'location' : 'false'); });
      };
      scroller.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateContents); } }, { passive: true });
    }).catch(() => { section.querySelector('.research-article').innerHTML = `<p>暂时无法载入资料，请<a href="${base + file}">打开原始文档</a>查看。</p>`; });
  }
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-research-anchor]');
    if (button) document.getElementById(button.dataset.researchAnchor)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
}

function appendEvidence(section) {
  const article = section.querySelector('.research-article');
  section.querySelector('.research-contents').insertAdjacentHTML('beforeend', '<button type="button" data-research-anchor="wet-lab-evidence">历史实验图证</button><button type="button" data-research-anchor="latest-wet-results">新增结果与数据</button>');
  const gallery = document.getElementById('wet-lab-evidence');
  if (gallery) article.append(gallery);
  const evidence = document.createElement('section'); evidence.id = 'latest-wet-results';
  evidence.innerHTML = `<h2>新增结果与数据文件</h2><p>F430M 与 L417A 的全细胞催化和纯酶活性图分别展示，归一化含义以各图标注为准。新增批次原始表独立保留，不与 Round 0 自动合并。</p><div class="research-figures">${['F430M和L417A全细胞催化归一化数据.jpg', 'F430M和L417A酶活测定归一化数据.jpg'].map((file) => `<figure><a href="assets/repository/results/figures/${file}" target="_blank" rel="noopener"><img loading="lazy" src="assets/repository/results/figures/${file}" alt="${file.replace('.jpg','')}" /></a><figcaption>${file.replace('.jpg','')} · 点击查看原图</figcaption></figure>`).join('')}</div><div id="latest-data-downloads"></div>`;
  article.append(evidence);
  evidence.insertAdjacentHTML('beforeend', '<p><a href="#experiments" data-view-target="experiments">进入 Round 0 实验数据中心 →</a></p>');
  fetch('assets/repository/files.json').then((r) => r.json()).then((files) => {
    const container = document.getElementById('latest-data-downloads');
    container.innerHTML = `<h3>原始数据下载</h3><ul>${files.filter((path) => path.endsWith('.xlsx')).map((path) => `<li><a href="assets/repository/${encodeURI(path)}" download>${escape(path.split('/').pop())}</a></li>`).join('')}</ul>`;
  }).catch(() => {});
}
