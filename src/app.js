import { candidates, parentMutations } from './data.js';
import { experiments } from './experiment-data.js';
import {
  coefficientOfVariation,
  experimentStatus,
  filterExperiments,
  findExperiment,
  sampleStandardDeviation,
  sortedExperiments,
} from './experiments.js';
import { evidenceFigures, pocketSites, wetLabMilestones } from './midterm-evidence.js';
import { initNavigationMotion } from './motion.js';
import { initHomeMotion } from './home-motion.js?v=20260829-native-sticky';
import { initTeamMotion } from './team-motion.js';
import { createDemoPrediction } from './demo-prediction.js';
import {
  AMINO_ACIDS,
  PARENT_MUTATIONS,
  applyMutations,
  buildParentSequence,
  mergeMutationLabels,
  normalizeMutations,
  parseFasta,
  parseMutations,
  saturationMutations,
  validateMutations,
  verifyParentSequence,
} from './sequence.js';

const residueNames = {
  A: 'Alanine', C: 'Cysteine', D: 'Aspartate', E: 'Glutamate', F: 'Phenylalanine',
  G: 'Glycine', H: 'Histidine', I: 'Isoleucine', K: 'Lysine', L: 'Leucine',
  M: 'Methionine', N: 'Asparagine', P: 'Proline', Q: 'Glutamine', R: 'Arginine',
  S: 'Serine', T: 'Threonine', V: 'Valine', W: 'Tryptophan', Y: 'Tyrosine',
};

let wildTypeSequence = '';
let m3Sequence = '';
let parentSequence = '';
let currentParent = 'M3';
let selectedExperiment = findExperiment('Q191R');
let currentAddition = 'Q191R';
let currentModelIndex = 0;
let structureViewer;
let navigationMotion;
let homeMotion;
let teamMotion;
let currentStructureKind = 'complex';
let paeLoaded = false;
let batchRows = [];

const APP_VIEWS = ['overview', 'team', 'design', 'experiments', 'batch'];

export function viewFromHash(hash = '') {
  const requestedView = String(hash).replace(/^#/, '');
  return APP_VIEWS.includes(requestedView) ? requestedView : 'overview';
}

export function modelPathForSelection(selection) {
  const normalized = String(selection ?? '').trim();
  if (normalized === 'complex') return '/assets/structures/MAB2962-complex-docking.pdb';
  const match = normalized.match(/(?:模型\s*)?([0-4])$/);
  if (!match) return undefined;
  const modelIndex = match[1];
  return `/fold_2026_07_18_14_35/fold_2026_07_18_14_35_model_${modelIndex}.cif`;
}

function currentStructureLabel() {
  return currentStructureKind === 'complex'
    ? '最新复合物对接构象 · 未能量最小化'
    : `AlphaFold3 真实结构模型 ${currentModelIndex}`;
}

export function analysisGroupsForControls(settings = {}) {
  return ['activity', 'stability', 'structure'].filter((group) => settings[group] === true);
}

export function mutationLabel(candidateOrMutation) {
  const mutation = typeof candidateOrMutation === 'string'
    ? candidateOrMutation
    : candidateOrMutation?.mutation;
  return normalizeMutations([...parentMutations, mutation].filter(Boolean).join('/'));
}

export function renderCandidateText(mutation) {
  const experiment = findExperiment(mutation);
  if (!experiment) return `${mutation}：待实验，未发现真实实验记录。`;
  return `${mutationLabel(mutation)}：已实验验证；相对M3 ${experiment.relativeToParent.toFixed(3)}×；吸光值均值 ${experiment.mean.toFixed(4)}。`;
}

export function candidateForControls(position, residueValue) {
  const targetResidue = String(residueValue ?? '').trim().charAt(0).toUpperCase();
  const site = Number.parseInt(String(position).trim(), 10);
  return candidates.find((candidate) => candidate.position === site && candidate.to === targetResidue);
}

export function paeColor(value) {
  const ratio = Math.max(0, Math.min(1, Number(value) / 31.75));
  const start = [37, 68, 157];
  const end = [233, 238, 251];
  const rgb = start.map((channel, index) => Math.round(channel + ((end[index] - channel) * ratio)));
  return `rgb(${rgb.join(', ')})`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setStatus(message, state = 'idle') {
  setText('control-status', message);
  const status = document.getElementById('control-status');
  if (status) status.dataset.state = state;
}

function renderMidtermEvidence() {
  const milestones = document.getElementById('wet-lab-milestones');
  if (milestones) milestones.innerHTML = wetLabMilestones.map(({ mutation, result, label, batch }) => `
    <article class="milestone-card"><span>${batch}</span><strong>${mutation}</strong><div><b>${result}</b><small>${label}</small></div></article>
  `).join('');

  const gallery = document.getElementById('evidence-gallery');
  if (gallery) gallery.innerHTML = evidenceFigures.map((figure, index) => `
    <button class="evidence-card" type="button" data-evidence-index="${index}" aria-label="查看原图：${figure.title}">
      <span class="evidence-image"><img src="${encodeURI(figure.src)}" alt="${figure.title}" loading="lazy" /></span>
      <span class="evidence-copy"><strong>${figure.title}</strong><small>${figure.caption}</small></span>
    </button>
  `).join('');
}

function showEvidenceFigure(index) {
  const figure = evidenceFigures[Number(index)];
  const dialog = document.getElementById('evidence-dialog');
  if (!figure || !dialog) return;
  const image = document.getElementById('evidence-dialog-image');
  if (image) {
    image.src = encodeURI(figure.src);
    image.alt = figure.title;
  }
  setText('evidence-dialog-title', figure.title);
  setText('evidence-dialog-caption', figure.caption);
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

function downloadText(filename, content, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function selectedPosition() {
  return Number.parseInt(document.getElementById('site-input')?.value ?? '1', 10);
}

function updateMutationPreview(addition) {
  let mutation;
  try {
    mutation = parseMutations(addition)[0];
  } catch {
    return;
  }
  if (!mutation) return;
  setText('from-residue', mutation.from);
  setText('from-name', residueNames[mutation.from] ?? mutation.from);
  setText('to-residue', mutation.to);
  setText('to-name', residueNames[mutation.to] ?? mutation.to);
  setText('full-mutation-label', currentParent === 'M3' ? mergeMutationLabels('M3', addition) : normalizeMutations(addition));
  setText('selected-mutation', normalizeMutations(addition));
  resetDemoPrediction();
}

function resetDemoPrediction() {
  const results = document.getElementById('ai-demo-results');
  if (results) results.hidden = true;
  setText('ai-status', '点击按钮生成当前候选的演示评分');
  setText('ai-submit', '运行演示预测');
}

function runDemoPrediction() {
  const candidate = currentParent === 'M3'
    ? mutationLabel(currentAddition)
    : normalizeMutations(currentAddition);
  const result = createDemoPrediction(candidate);
  setText('ai-demo-candidate', result.candidate);
  setText('ai-demo-overall', String(result.overall));
  setText('ai-demo-activity', String(result.activity));
  setText('ai-demo-stability', String(result.stability));
  setText('ai-demo-structure', String(result.structure));
  setText('ai-demo-summary', result.summary);
  setText('ai-status', `${result.disclaimer} 评分仅用于界面与流程展示。`);
  setText('ai-submit', '重新运行演示');
  const results = document.getElementById('ai-demo-results');
  if (results) results.hidden = false;
}

function focusResidue(position) {
  if (!structureViewer || !Number.isInteger(position)) return;
  try {
    structureViewer.structureInteractivity({
      elements: { auth_asym_id: 'A', auth_seq_id: position },
      action: ['select', 'focus'],
      applyGranularity: true,
      focusOptions: { minRadius: 12, extraRadius: 8 },
    });
  } catch (error) {
    console.warn(`无法自动定位残基 ${position}。`, error);
  }
}

function focusStructureElement(chainId, label) {
  if (!structureViewer || !chainId) return;
  try {
    structureViewer.structureInteractivity({
      elements: { auth_asym_id: chainId, auth_seq_id: 1 },
      action: ['select', 'focus'],
      applyGranularity: true,
      focusOptions: { minRadius: 8, extraRadius: 5 },
    });
    setText('structure-distance', `${label} · 链 ${chainId} · 已聚焦`);
  } catch (error) {
    console.warn(`无法自动聚焦 ${label}。`, error);
  }
}

function updateExperimentResult(experiment) {
  selectedExperiment = experiment;
  if (!experiment) {
    setText('experiment-relative', '—');
    setText('experiment-status', '待实验');
    setText('experiment-summary', '当前构建尚无实验记录。');
    setText('experiment-mean', '—');
    setText('experiment-sd', '—');
    setText('experiment-cv', '—');
    setText('experiment-replicates', '—');
    return;
  }
  const gain = (experiment.relativeToParent - 1) * 100;
  setText('experiment-relative', `${experiment.relativeToParent.toFixed(3)}×`);
  setText('experiment-status', '已实验验证');
  setText('experiment-summary', `${experiment.mutation} 相对 M3 亲本${gain >= 0 ? '提高' : '降低'} ${Math.abs(gain).toFixed(1)}%。`);
  setText('experiment-mean', experiment.mean.toFixed(4));
  setText('experiment-sd', sampleStandardDeviation(experiment.replicates).toFixed(4));
  setText('experiment-cv', `${coefficientOfVariation(experiment.replicates).toFixed(2)}%`);
  setText('experiment-replicates', experiment.replicates.map((value) => value.toFixed(4)).join(' · '));
  setText('experiment-source', experiment.source);
}

function selectExperiment(experiment, { focus = true } = {}) {
  if (!experiment) return;
  currentAddition = experiment.mutation;
  const mutation = parseMutations(experiment.mutation)[0];
  const siteInput = document.getElementById('site-input');
  const residueSelect = document.getElementById('residue-select');
  const combinationInput = document.getElementById('combination-input');
  if (siteInput) siteInput.value = String(mutation.position);
  if (residueSelect) residueSelect.value = mutation.to;
  if (combinationInput) combinationInput.value = experiment.mutation;
  setText('structure-distance', `位点 ${mutation.position} · 点击序列或结构可联动`);
  setText('structure-subtitle', `MAB2962 · 链 A · 位点 ${mutation.position} · ${currentStructureLabel()}`);
  updateMutationPreview(experiment.mutation);
  updateExperimentResult(experiment);
  renderSequence(mutation.position);
  document.querySelectorAll('[data-candidate]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.candidate === experiment.mutation));
  });
  setStatus(`${experiment.mutation} 已通过序列校验，并读取真实 Round 0 实验结果。`, 'ready');
  setText('selection-feedback', `当前显示 ${mutationLabel(experiment.mutation)} 的真实实验结果。`);
  if (focus) focusResidue(mutation.position);
}

function renderCandidateRanking() {
  const body = document.getElementById('candidate-table-body');
  if (!body) return;
  body.innerHTML = sortedExperiments().slice(0, 7).map((experiment, index) => `
    <tr><td><span class="rank">${index + 1}</span></td><td><button class="candidate-button" type="button" data-candidate="${experiment.mutation}" aria-pressed="${experiment === selectedExperiment}">${experiment.mutation}</button></td><td>${experiment.relativeToParent.toFixed(3)}×</td><td><span class="${experiment.relativeToParent > 1 ? 'recommendation' : 'neutral-tag'}">${experimentStatus(experiment)}</span></td></tr>
  `).join('');
}

function renderSequence(activePosition = selectedPosition()) {
  const grid = document.getElementById('sequence-grid');
  if (!grid || !parentSequence) return;
  const measured = new Set(experiments.map(({ mutation }) => parseMutations(mutation)[0].position));
  const parentSites = new Set(PARENT_MUTATIONS.map((mutation) => parseMutations(mutation)[0].position));
  const lines = [];
  for (let start = 0; start < parentSequence.length; start += 50) {
    const chunk = parentSequence.slice(start, start + 50);
    const cells = [...chunk].map((residue, offset) => {
      const position = start + offset + 1;
      const classes = ['residue-cell'];
      if (position === activePosition) classes.push('is-selected');
      if (currentParent === 'M3' && parentSites.has(position)) classes.push('is-parent');
      if (measured.has(position)) classes.push('is-measured');
      return `<button type="button" class="${classes.join(' ')}" data-sequence-position="${position}" title="${residue}${position} · ${residueNames[residue] ?? residue}">${residue}</button>`;
    }).join('');
    lines.push(`<div class="sequence-line"><span class="sequence-index">${String(start + 1).padStart(4, '0')}</span><span class="sequence-residues">${cells}</span></div>`);
  }
  grid.innerHTML = lines.join('');
}

function updateFromControls() {
  if (!parentSequence) return;
  const position = selectedPosition();
  const to = document.getElementById('residue-select')?.value;
  const from = parentSequence[position - 1];
  if (!from || !AMINO_ACIDS.includes(to)) {
    setStatus(`位点必须在 1–${parentSequence.length} 之间。`, 'error');
    return;
  }
  const addition = `${from}${position}${to}`;
  const combinationInput = document.getElementById('combination-input');
  if (combinationInput) combinationInput.value = addition;
  currentAddition = addition;
  updateMutationPreview(addition);
  const experiment = currentParent === 'M3' ? findExperiment(addition) : undefined;
  updateExperimentResult(experiment);
  setStatus(experiment ? `${addition} 有真实实验记录，点击生成并定位。` : `${addition} 序列合法；暂无实验记录。`, experiment ? 'ready' : 'idle');
}

function generateDesign() {
  if (!parentSequence) return;
  const value = document.getElementById('combination-input')?.value ?? '';
  const validation = validateMutations(parentSequence, value);
  if (!validation.valid) {
    setStatus(validation.errors.join('；'), 'error');
    return;
  }
  currentAddition = validation.normalized;
  updateMutationPreview(currentAddition);
  const first = validation.mutations[0];
  if (first) {
    const siteInput = document.getElementById('site-input');
    const residueSelect = document.getElementById('residue-select');
    if (siteInput) siteInput.value = String(first.position);
    if (residueSelect) residueSelect.value = first.to;
    setText('structure-distance', `位点 ${first.position} · 已完成序列校验`);
    renderSequence(first.position);
    focusResidue(first.position);
  }
  const experiment = currentParent === 'M3' && validation.mutations.length === 1 ? findExperiment(validation.normalized) : undefined;
  updateExperimentResult(experiment);
  setStatus(experiment ? `${validation.normalized} 已读取真实实验结果。` : `${validation.normalized} 已生成突变序列；状态：待实验。`, 'ready');
}

function applyParent(parent) {
  currentParent = parent;
  parentSequence = parent === 'M3' && m3Sequence ? m3Sequence : buildParentSequence(wildTypeSequence, parent);
  setText('parent-context-label', parent === 'M3' ? PARENT_MUTATIONS.join('/') : 'WT · MAB2962');
  setText('sequence-note', parent === 'M3'
    ? `${m3Sequence ? 'M3 序列来自项目 FASTA，已与 WT 校验仅含 D281P/G420W/N514S' : 'M3 FASTA 未载入，当前按声明突变从 WT 生成备用序列'}；三突变体暂使用 WT 结构进行位点映射。`
    : '当前显示 MAB2962 野生型序列与真实 AlphaFold3 结构。');
  updateFromControls();
  renderSequence();
}

function commitAppView(view) {
  document.querySelectorAll('[data-app-view]').forEach((section) => { section.hidden = section.dataset.appView !== view; });
  document.querySelectorAll('.subnav-menu [data-view-target]').forEach((button) => button.classList.toggle('is-active', button.dataset.viewTarget === view));
  location.hash = view;
}

function afterAppViewChange(view) {
  navigationMotion?.syncIndicators();
  if (view === 'overview') requestAnimationFrame(() => homeMotion?.refresh());
  if (view === 'team') requestAnimationFrame(() => teamMotion?.play());
  if (view === 'design') requestAnimationFrame(() => structureViewer?.plugin?.canvas3d?.requestResize?.());
  if (view === 'experiments') drawExperimentChart(filterExperiments());
}

function switchAppView(view) {
  const current = document.querySelector('[data-app-view]:not([hidden])');
  const target = document.querySelector(`[data-app-view="${view}"]`);
  if (!target || current === target) {
    commitAppView(view);
    afterAppViewChange(view);
    return;
  }
  if (navigationMotion) navigationMotion.transitionViews(current, target, () => commitAppView(view), () => afterAppViewChange(view));
  else {
    commitAppView(view);
    afterAppViewChange(view);
  }
}

function setWorkbenchNavigation(visible) {
  const subnav = document.getElementById('workbench-subnav');
  const trigger = document.getElementById('workbench-trigger');
  if (subnav) subnav.classList.toggle('is-visible', visible);
  if (trigger) {
    trigger.classList.toggle('is-active', visible);
    trigger.setAttribute('aria-expanded', String(visible));
  }
}

function openProjectTopic(topicId) {
  document.querySelectorAll('[data-project-topic]').forEach((button) => button.classList.toggle('is-active', button.dataset.projectTopic === topicId));
  setWorkbenchNavigation(false);
  if (topicId === 'team') {
    switchAppView('team');
    return;
  }
  switchAppView('overview');
  const sectionByTopic = {
    validation: 'home-dbtl',
    engineering: 'home-evolution',
    'wet-lab': 'home-screening',
    verifiability: 'home-verification',
  };
  requestAnimationFrame(() => homeMotion?.scrollTo(sectionByTopic[topicId] ?? 'home-hero'));
}

function bindNavigation() {
  document.addEventListener('click', (event) => {
    const projectTopic = event.target.closest('[data-project-topic]');
    if (projectTopic) {
      event.preventDefault();
      navigationMotion?.selectPrimary(projectTopic);
      navigationMotion?.closeMenu();
      openProjectTopic(projectTopic.dataset.projectTopic);
      return;
    }
    const workbenchTrigger = event.target.closest('#workbench-trigger');
    if (workbenchTrigger) {
      event.preventDefault();
      navigationMotion?.selectPrimary(workbenchTrigger);
      document.querySelectorAll('[data-project-topic]').forEach((button) => button.classList.remove('is-active'));
      setWorkbenchNavigation(true);
      switchAppView('design');
      return;
    }
    const target = event.target.closest('[data-view-target]');
    if (target) {
      event.preventDefault();
      if (target.closest('.subnav-menu')) navigationMotion?.selectSecondary(target);
      else navigationMotion?.selectPrimary(document.getElementById('workbench-trigger'));
      document.querySelectorAll('[data-project-topic]').forEach((button) => button.classList.remove('is-active'));
      setWorkbenchNavigation(true);
      switchAppView(target.dataset.viewTarget);
      return;
    }
    const candidate = event.target.closest('[data-candidate]');
    if (candidate) selectExperiment(findExperiment(candidate.dataset.candidate));
    const jump = event.target.closest('[data-jump-site]');
    if (jump) {
      switchAppView('design');
      const siteInput = document.getElementById('site-input');
      if (siteInput) siteInput.value = jump.dataset.jumpSite;
      updateFromControls();
      focusResidue(Number(jump.dataset.jumpSite));
    }
    const knownSiteButton = event.target.closest('[data-known-site]');
    if (knownSiteButton) {
      const position = Number(knownSiteButton.dataset.knownSite);
      const site = pocketSites.find((item) => item.position === position);
      if (!site) return;
      const sequenceSearch = document.getElementById('sequence-search');
      if (sequenceSearch) sequenceSearch.value = String(position);
      renderSequence(position);
      setText('structure-distance', `${site.label} · 报告候选口袋位点 · 当前候选未改变`);
      setText('structure-subtitle', `MAB2962 · 链 A · 定位 ${site.label} · ${currentStructureLabel()}`);
      setStatus(`已定位 ${site.label}（${site.note}）；当前候选 ${currentAddition} 保持不变。`, 'ready');
      document.querySelector('[data-viewer-tab="structure"]')?.click();
      focusResidue(position);
    }
    const evidenceButton = event.target.closest('[data-evidence-index]');
    if (evidenceButton) showEvidenceFigure(evidenceButton.dataset.evidenceIndex);
  });
  window.addEventListener('hashchange', () => {
    const view = viewFromHash(location.hash);
    const current = document.querySelector('[data-app-view]:not([hidden])')?.dataset.appView;
    if (current === view) return;
    setWorkbenchNavigation(!['overview', 'team'].includes(view));
    switchAppView(view);
  });
}

function bindViewerTabs() {
  document.querySelectorAll('[data-viewer-tab]').forEach((button) => button.addEventListener('click', () => {
    const tab = button.dataset.viewerTab;
    document.querySelectorAll('[data-viewer-tab]').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-selected', String(selected));
    });
    ['structure', 'sequence', 'pae'].forEach((name) => {
      const panel = document.getElementById(`${name}-panel`);
      if (panel) panel.hidden = name !== tab;
    });
    if (tab === 'structure') requestAnimationFrame(() => structureViewer?.plugin?.canvas3d?.requestResize?.());
    if (tab === 'pae') loadPae();
  }));
}

async function loadPae() {
  if (paeLoaded) return;
  setText('pae-status', '正在读取 1184 × 1184 PAE 矩阵…');
  try {
    const response = await fetch('/fold_2026_07_18_14_35/fold_2026_07_18_14_35_full_data_0.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const pae = data.pae;
    if (!Array.isArray(pae) || !pae.length) throw new Error('JSON 中没有 PAE 矩阵');
    const canvas = document.getElementById('pae-canvas');
    const context = canvas.getContext('2d');
    const size = canvas.width;
    const step = pae.length / size;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        context.fillStyle = paeColor(pae[Math.floor(y * step)][Math.floor(x * step)]);
        context.fillRect(x, y, 1, 1);
      }
    }
    paeLoaded = true;
    setText('pae-status', `已载入真实 PAE 数据：${pae.length} × ${pae.length}。`);
  } catch (error) {
    setText('pae-status', `PAE 数据载入失败：${error.message}`);
  }
}

function drawExperimentChart(rows) {
  const canvas = document.getElementById('experiment-chart');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 20, right: 18, bottom: 74, left: 48 };
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  const values = rows.map(({ relativeToParent }) => relativeToParent);
  const min = Math.min(.82, ...values) - .02;
  const max = Math.max(1.13, ...values) + .02;
  const plotHeight = height - padding.top - padding.bottom;
  const yFor = (value) => padding.top + ((max - value) / (max - min)) * plotHeight;
  context.strokeStyle = '#e5e9f2';
  context.lineWidth = 1;
  [0.85, 0.9, 0.95, 1, 1.05, 1.1].forEach((value) => {
    const y = yFor(value);
    context.beginPath(); context.moveTo(padding.left, y); context.lineTo(width - padding.right, y); context.stroke();
    context.fillStyle = '#8b95a9'; context.font = '10px sans-serif'; context.fillText(value.toFixed(2), 10, y + 3);
  });
  const barWidth = Math.max(4, (width - padding.left - padding.right) / Math.max(rows.length, 1) - 4);
  rows.forEach((row, index) => {
    const slot = (width - padding.left - padding.right) / rows.length;
    const x = padding.left + (index * slot) + ((slot - barWidth) / 2);
    const baseline = yFor(min);
    const y = yFor(row.relativeToParent);
    context.fillStyle = row.relativeToParent > 1 ? '#5d6cff' : '#b9c1d2';
    context.fillRect(x, y, barWidth, baseline - y);
    context.save(); context.translate(x + (barWidth / 2), height - padding.bottom + 8); context.rotate(-Math.PI / 3);
    context.fillStyle = '#69758b'; context.font = '9px sans-serif'; context.fillText(row.mutation, 0, 0); context.restore();
  });
  context.strokeStyle = '#1aaa7a'; context.lineWidth = 2; context.setLineDash([5, 4]);
  context.beginPath(); context.moveTo(padding.left, yFor(1)); context.lineTo(width - padding.right, yFor(1)); context.stroke(); context.setLineDash([]);
}

function renderExperimentTable() {
  const query = document.getElementById('experiment-search')?.value ?? '';
  const direction = document.getElementById('experiment-direction')?.value ?? 'all';
  const rows = filterExperiments({ query, direction });
  const body = document.getElementById('experiment-table-body');
  if (body) body.innerHTML = rows.map((row) => {
    const rank = sortedExperiments().findIndex(({ mutation }) => mutation === row.mutation) + 1;
    const standardDeviation = sampleStandardDeviation(row.replicates);
    const cv = coefficientOfVariation(row.replicates);
    return `<tr class="${row.relativeToParent > 1 ? 'row-positive' : ''}"><td>${rank}</td><td><button class="candidate-button" data-candidate="${row.mutation}" type="button">${row.mutation}</button></td><td>${mutationLabel(row.mutation)}</td><td>${row.replicates.map((value) => value.toFixed(4)).join(' / ')}</td><td>${row.mean.toFixed(4)}</td><td>${standardDeviation.toFixed(4)}</td><td>${cv.toFixed(2)}%</td><td class="${row.relativeToParent > 1 ? 'value-positive' : ''}">${row.relativeToParent.toFixed(3)}×</td><td>${experimentStatus(row)}</td></tr>`;
  }).join('');
  setText('experiment-count', `共 ${rows.length} 条`);
  drawExperimentChart(rows);
}

function createBatchRows() {
  if (!wildTypeSequence) return;
  const parent = document.getElementById('batch-parent')?.value ?? 'M3';
  const sequence = parent === 'M3' && m3Sequence ? m3Sequence : buildParentSequence(wildTypeSequence, parent);
  const position = Number(document.getElementById('batch-site')?.value);
  try {
    batchRows = saturationMutations(sequence, position).map((mutation) => ({
      mutation,
      fullMutation: parent === 'M3' ? mergeMutationLabels('M3', mutation) : mutation,
      sequence: applyMutations(sequence, mutation),
      parent,
    }));
    const body = document.getElementById('batch-table-body');
    if (body) body.innerHTML = batchRows.map((row, index) => `<tr><td>${index + 1}</td><td>${row.mutation}</td><td>${row.fullMutation}</td><td>${row.parent}</td><td><span class="neutral-tag">待实验</span></td></tr>`).join('');
    setText('batch-results-title', `${sequence[position - 1]}${position} 饱和候选`);
    setText('batch-count', `${batchRows.length} 个`);
    setText('batch-status', `已在 ${parent} 亲本上生成 ${batchRows.length} 个候选，未进行 AI 评分。`);
  } catch (error) {
    setText('batch-status', error.message);
  }
}

function exportBatchCsv() {
  if (!batchRows.length) createBatchRows();
  const lines = ['mutation,full_mutation,parent,status', ...batchRows.map((row) => `${row.mutation},${row.fullMutation},${row.parent},待实验`)];
  downloadText('MAB2962_saturation_candidates.csv', `\ufeff${lines.join('\n')}`, 'text/csv;charset=utf-8');
}

function exportBatchFasta() {
  if (!batchRows.length) createBatchRows();
  const fasta = batchRows.map((row) => `>MAB2962|${row.fullMutation}|parent=${row.parent}\n${row.sequence.match(/.{1,80}/g).join('\n')}`).join('\n');
  downloadText('MAB2962_saturation_candidates.fasta', fasta);
}

async function loadStructureModel(selection, clearExisting = true) {
  const path = modelPathForSelection(selection);
  if (!path || !structureViewer) return false;
  const isComplex = path.endsWith('.pdb');
  const format = isComplex ? 'pdb' : 'mmcif';
  const modelIndex = isComplex ? undefined : Number(path.match(/model_(\d)\.cif$/)?.[1]);
  const selector = document.getElementById('structure-select');
  const host = document.getElementById('molstar-app');
  if (selector) selector.disabled = true;
  host?.setAttribute('aria-busy', 'true');
  setText('structure-model-badge', isComplex ? '载入复合物…' : `载入 Model ${modelIndex}…`);
  try {
    if (clearExisting) await structureViewer.plugin.clear();
    await structureViewer.loadStructureFromUrl(path, format);
    currentStructureKind = isComplex ? 'complex' : 'alphafold';
    if (!isComplex) currentModelIndex = modelIndex;
    setText('structure-model-badge', isComplex ? '对接构象 · PDB' : `真实 mmCIF · Model ${modelIndex}`);
    setText('structure-model-file', isComplex ? '已载入 MAB2962-complex-docking.pdb' : `已载入 model_${modelIndex}.cif`);
    setText('structure-subtitle', `MAB2962 · 链 A · 位点 ${selectedPosition()} · ${currentStructureLabel()}`);
    setText('structure-source-note', isComplex
      ? '对接展示：文件名标为“三突”，但坐标中281、420、514仍为WT残基；该复合物基于AF3受体、未经能量最小化，不代表实验解析结构。'
      : `AlphaFold3 模型 ${modelIndex}：用于蛋白位点定位；当前 M3 暂映射在亲本结构上。`);
    const stats = isComplex
      ? [['序列长度', '1,184 aa'], ['辅因子', 'ATP · NADPH'], ['底物', 'GABA'], ['金属离子', 'Mg²⁺']]
      : [['序列长度', '1,184 aa'], ['模型 pTM', '0.75'], ['平均 atom pLDDT', '88.5'], ['PAE 矩阵', '1,184 × 1,184']];
    stats.forEach(([label, value], index) => {
      setText(`structure-stat-${index + 1}-label`, label);
      setText(`structure-stat-${index + 1}-value`, value);
    });
    document.querySelectorAll('[data-focus-chain]').forEach((button) => { button.disabled = !isComplex; });
    const resetView = document.getElementById('reset-structure-view');
    if (resetView) resetView.disabled = !isComplex;
    focusResidue(selectedPosition());
    return true;
  } catch (error) {
    host?.classList.add('has-load-error');
    const sourceLabel = isComplex ? '复合物 PDB' : `Model ${modelIndex}`;
    setText('structure-model-badge', `${sourceLabel} 载入失败`);
    setText('structure-model-file', `${sourceLabel} 读取失败`);
    console.error(`Unable to load MAB2962 structure source ${sourceLabel}.`, error);
    return false;
  } finally {
    if (selector) selector.disabled = false;
    host?.removeAttribute('aria-busy');
  }
}

async function initialiseStructureViewer() {
  const host = document.getElementById('molstar-app');
  if (!host || !globalThis.molstar?.Viewer) return;
  try {
    structureViewer = await globalThis.molstar.Viewer.create('molstar-app', {
      layoutIsExpanded: false,
      layoutShowControls: false,
      layoutShowLeftPanel: false,
      layoutShowSequence: false,
      viewportShowReset: true,
      viewportShowScreenshotControls: true,
      viewportShowExpand: true,
      viewportShowToggleFullscreen: true,
      viewportShowSettings: true,
      viewportShowSelectionMode: true,
      viewportShowAnimation: false,
      viewportBackgroundColor: '#f8faff',
    });
    await loadStructureModel('complex', false);
  } catch (error) {
    host.classList.add('has-load-error');
    setText('selection-feedback', 'MAB2962 三维结构载入失败，请刷新页面重试。');
    console.error('Unable to load MAB2962 structure.', error);
  }
}

function bindControls() {
  document.getElementById('parent-select')?.addEventListener('change', (event) => applyParent(event.currentTarget.value));
  document.getElementById('site-input')?.addEventListener('input', updateFromControls);
  document.getElementById('residue-select')?.addEventListener('change', updateFromControls);
  document.getElementById('combination-input')?.addEventListener('input', (event) => {
    const validation = validateMutations(parentSequence, event.currentTarget.value);
    setStatus(validation.valid ? `${validation.normalized} 格式与原始残基校验通过。` : validation.errors[0], validation.valid ? 'ready' : 'error');
    if (validation.valid) updateMutationPreview(validation.normalized);
  });
  document.getElementById('load-results')?.addEventListener('click', generateDesign);
  document.getElementById('structure-select')?.addEventListener('change', (event) => loadStructureModel(event.currentTarget.value));
  document.querySelectorAll('[data-focus-chain]').forEach((button) => button.addEventListener('click', () => {
    focusStructureElement(button.dataset.focusChain, button.dataset.focusLabel);
  }));
  document.getElementById('reset-structure-view')?.addEventListener('click', () => {
    try {
      structureViewer?.plugin?.managers?.camera?.reset();
      setText('structure-distance', `位点 ${selectedPosition()} · 全结构视图`);
    } catch (error) {
      console.warn('无法重置结构视图。', error);
    }
  });
  document.getElementById('sequence-search')?.addEventListener('change', (event) => {
    const position = Number(event.currentTarget.value);
    const siteInput = document.getElementById('site-input');
    if (siteInput) siteInput.value = String(position);
    renderSequence(position);
    document.querySelector(`[data-sequence-position="${position}"]`)?.scrollIntoView({ block: 'center', inline: 'center' });
    focusResidue(position);
  });
  document.getElementById('sequence-grid')?.addEventListener('click', (event) => {
    const residue = event.target.closest('[data-sequence-position]');
    if (!residue) return;
    const position = Number(residue.dataset.sequencePosition);
    const siteInput = document.getElementById('site-input');
    if (siteInput) siteInput.value = String(position);
    updateFromControls();
    renderSequence(position);
    focusResidue(position);
  });
  document.getElementById('copy-sequence')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(parentSequence);
    setText('sequence-note', '当前亲本完整序列已复制。');
  });
  document.getElementById('download-fasta')?.addEventListener('click', () => downloadText(`MAB2962_${currentParent}.fasta`, `>MAB2962|parent=${currentParent}\n${parentSequence.match(/.{1,80}/g).join('\n')}`));
  document.getElementById('ai-submit')?.addEventListener('click', runDemoPrediction);
  document.getElementById('experiment-search')?.addEventListener('input', renderExperimentTable);
  document.getElementById('experiment-direction')?.addEventListener('change', renderExperimentTable);
  document.getElementById('batch-generate')?.addEventListener('click', createBatchRows);
  document.getElementById('batch-export-csv')?.addEventListener('click', exportBatchCsv);
  document.getElementById('batch-export-fasta')?.addEventListener('click', exportBatchFasta);
  document.getElementById('evidence-dialog-close')?.addEventListener('click', () => document.getElementById('evidence-dialog')?.close());
  document.getElementById('evidence-dialog')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });
}

async function loadProjectSequence() {
  const m3Path = encodeURI('/NJTech-SynCAR-2026-main/submission/njtech-syncar/data/raw/MAB2962 D281P-G420W-N514S.fa');
  const [response, m3Response] = await Promise.all([
    fetch('/MAB2962.fa'),
    fetch(m3Path).catch(() => undefined),
  ]);
  if (!response.ok) throw new Error(`FASTA读取失败：HTTP ${response.status}`);
  const fasta = parseFasta(await response.text());
  wildTypeSequence = fasta.sequence;
  try {
    if (!m3Response?.ok) throw new Error(`HTTP ${m3Response?.status ?? '网络错误'}`);
    const suppliedM3 = parseFasta(await m3Response.text());
    const differences = verifyParentSequence(wildTypeSequence, suppliedM3.sequence);
    m3Sequence = suppliedM3.sequence;
    setText('m3-source-status', `已校验项目 M3 FASTA：${differences.map(({ mutation }) => mutation).join('/')}，无额外差异。`);
  } catch (error) {
    m3Sequence = '';
    setText('m3-source-status', `M3 FASTA 校验失败，已启用 WT 前端生成备用序列：${error.message}`);
  }
  applyParent(currentParent);
  setStatus(`已读取 ${fasta.header}：${wildTypeSequence.length} aa；${m3Sequence ? '项目 M3 FASTA 校验通过' : 'M3 使用备用序列'}。`, 'ready');
  createBatchRows();
}

async function initialiseWorkbench() {
  const residueSelect = document.getElementById('residue-select');
  if (residueSelect) residueSelect.innerHTML = AMINO_ACIDS.map((residue) => `<option value="${residue}"${residue === 'R' ? ' selected' : ''}>${residue} · ${residueNames[residue]}</option>`).join('');
  navigationMotion = initNavigationMotion();
  bindNavigation();
  bindViewerTabs();
  bindControls();
  renderMidtermEvidence();
  homeMotion = initHomeMotion();
  teamMotion = initTeamMotion();
  renderCandidateRanking();
  renderExperimentTable();
  updateExperimentResult(selectedExperiment);
  try {
    await loadProjectSequence();
    selectExperiment(selectedExperiment, { focus: false });
  } catch (error) {
    setStatus(error.message, 'error');
  }
  initialiseStructureViewer();
  const initialView = viewFromHash(location.hash);
  setWorkbenchNavigation(!['overview', 'team'].includes(initialView));
  commitAppView(initialView);
  afterAppViewChange(initialView);
}

if (typeof document !== 'undefined') initialiseWorkbench();
