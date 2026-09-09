# Wiki-Grounded Content Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate six confirmed Wiki topics and descriptive experiment reproducibility metrics into the existing four-view MutDesign frontend without adding unsupported platform features.

**Architecture:** Add one immutable Wiki projection module and one tabbed dossier renderer inside the existing Overview page. Reuse the experiment helper module for derived SD/CV statistics, then surface those values in the selected-candidate rail and Round 0 table. Keep `index.html` semantic, `app.js` responsible for browser rendering/interactions, and `styles.css` aligned with the current compact visual system.

**Tech Stack:** Static HTML, CSS, browser ES modules, Node built-in test runner, Mol* unchanged.

**Repository note:** `/Users/zhuhongwei/Desktop/NJTech-SynCAR-2026` has no `.git` metadata. Commit steps are replaced by explicit test and file-state checkpoints; do not initialize a new repository without user authorization.

---

### Task 1: Create the confirmed Wiki content projection

**Files:**
- Create: `src/wiki-content.js`
- Create: `tests/wiki-content.test.js`
- Read-only sources: `NJTech-SynCAR-2026-main/submission/njtech-syncar/wiki/*.md`
- Read-only source: `NJTech-SynCAR-2026-main/submission/njtech-syncar/attributions.md`

- [ ] **Step 1: Write the failing Wiki data tests**

Create `tests/wiki-content.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { verificationAssets, wikiDossier } from '../src/wiki-content.js';

test('publishes exactly the six confirmed Wiki dossier topics', () => {
  assert.deepEqual(wikiDossier.map(({ id }) => id), [
    'validation',
    'engineering',
    'wet-lab',
    'verifiability',
    'safety',
    'attributions',
  ]);
  assert.ok(wikiDossier.every(({ label, title, summary, source, facts }) => label && title && summary && source && facts.length));
});

test('keeps the four repository verification fingerprints exact', () => {
  assert.deepEqual(verificationAssets.map(({ sha256 }) => sha256), [
    'bfb9e72796a1f80b6fe768fbda52d2cb009b7a6e4ca93d263c0df19250b71c8f',
    '18b20b5a715b02cba91b02bd48646737a361f36b54d8ac863cee2afaaf6868d4',
    'a3063d88f96ab6f2a0a09aec90f48485f4afeeb349f85de79489a172d3c9df7b',
    '170a3b875964a83f6ab8db8f2372fce2dbbe3b6bef127dab18c125d4fc21595f',
  ]);
});

test('does not expose placeholder-only Wiki material as confirmed content', () => {
  const serialized = JSON.stringify(wikiDossier);
  assert.doesNotMatch(serialized, /YYYY-MM-DD|BBa_XXXX|<\s*队名\s*>|待补充|\.\.\.|…/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/wiki-content.test.js
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/wiki-content.js`.

- [ ] **Step 3: Implement the immutable Wiki projection**

Create `src/wiki-content.js` with the following exports and confirmed values:

```js
export const verificationAssets = Object.freeze([
  Object.freeze({
    name: 'zero-shot 初筛吸光值',
    path: 'data/raw/zero-shot 初筛吸光值.xlsx',
    sha256: 'bfb9e72796a1f80b6fe768fbda52d2cb009b7a6e4ca93d263c0df19250b71c8f',
  }),
  Object.freeze({
    name: 'Round 0 候选整理数据',
    path: 'data/processed/round_0.xlsx',
    sha256: '18b20b5a715b02cba91b02bd48646737a361f36b54d8ac863cee2afaaf6868d4',
  }),
  Object.freeze({
    name: 'MAB2962 野生型序列',
    path: 'data/raw/MAB2962.fa',
    sha256: 'a3063d88f96ab6f2a0a09aec90f48485f4afeeb349f85de79489a172d3c9df7b',
  }),
  Object.freeze({
    name: 'M3 三突变体序列',
    path: 'data/raw/MAB2962 D281P-G420W-N514S.fa',
    sha256: '170a3b875964a83f6ab8db8f2372fce2dbbe3b6bef127dab18c125d4fc21595f',
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
    facts: freezeFacts(verificationAssets.map(({ name, path, sha256 }) => ({ label: name, value: path, detail: `SHA-256 ${sha256}`, hash: sha256 }))),
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
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/wiki-content.test.js
```

Expected: 3 tests pass, 0 fail.

- [ ] **Step 5: Record the checkpoint**

Run:

```bash
test -f src/wiki-content.js && test -f tests/wiki-content.test.js
```

Expected: exit 0. No commit is attempted because the workspace has no Git metadata.

---

### Task 2: Add descriptive experiment SD and CV helpers

**Files:**
- Modify: `src/experiments.js`
- Modify: `tests/experiments.test.js`

- [ ] **Step 1: Write failing statistics tests**

Extend the existing import in `tests/experiments.test.js` with both `coefficientOfVariation` and `sampleStandardDeviation`, then add:

```js
test('calculates sample SD and CV for the measured Q191R replicates', () => {
  const row = findExperiment('Q191R');
  assert.equal(Number(sampleStandardDeviation(row.replicates).toFixed(6)), 0.006864);
  assert.equal(Number(coefficientOfVariation(row.replicates).toFixed(3)), 5.354);
});

test('returns zero CV when replicates are insufficient or have zero mean', () => {
  assert.equal(coefficientOfVariation([0.12]), 0);
  assert.equal(coefficientOfVariation([-1, 0, 1]), 0);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/experiments.test.js
```

Expected: FAIL because `coefficientOfVariation` is not exported.

- [ ] **Step 3: Implement the minimal CV helper**

Append to `src/experiments.js` after `sampleStandardDeviation`:

```js
export function coefficientOfVariation(values) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) return 0;
  return (sampleStandardDeviation(values) / Math.abs(mean)) * 100;
}
```

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
node --test tests/experiments.test.js
npm test
```

Expected: focused tests pass; full suite has 0 failures.

- [ ] **Step 5: Record the checkpoint**

Run:

```bash
rg -n 'coefficientOfVariation' src/experiments.js tests/experiments.test.js
```

Expected: helper and tests are both listed.

---

### Task 3: Add the semantic Wiki dossier shell

**Files:**
- Modify: `index.html`
- Modify: `tests/markup.test.js`

- [ ] **Step 1: Write failing markup tests**

Add to `tests/markup.test.js`:

```js
test('provides an accessible Wiki-grounded dossier inside Project Overview', () => {
  const html = read('index.html');
  assert.match(html, /id="wiki-dossier"/);
  assert.match(html, /id="wiki-dossier-tabs"[^>]+role="tablist"/);
  assert.match(html, /id="wiki-dossier-panels"/);
  assert.match(html, /内容以仓库 Wiki 为准/);
});

test('labels descriptive experiment statistics without inventing a QC threshold', () => {
  const html = read('index.html');
  assert.match(html, /id="experiment-sd"/);
  assert.match(html, /id="experiment-cv"/);
  assert.match(html, /标准差/);
  assert.match(html, /CV/);
  assert.match(html, /尚未定义验收阈值/);
});
```

- [ ] **Step 2: Run the markup test and verify RED**

Run:

```bash
node --test tests/markup.test.js
```

Expected: FAIL because the dossier and statistics markup are absent.

- [ ] **Step 3: Add the dossier shell below wet-lab evidence**

Insert after `#wet-lab-evidence` in `index.html`:

```html
<section id="wiki-dossier" class="wiki-dossier content-card" aria-labelledby="wiki-dossier-title">
  <div class="evidence-heading">
    <div>
      <span class="eyebrow">PROJECT DOSSIER</span>
      <h2 id="wiki-dossier-title">Wiki 项目档案</h2>
      <p>内容以仓库 Wiki 为准；未确认和空模板内容不提前展示。</p>
    </div>
    <span class="data-badge">截至 2026-07-15</span>
  </div>
  <div id="wiki-dossier-tabs" class="wiki-dossier-tabs" role="tablist" aria-label="Wiki 项目主题"></div>
  <div id="wiki-dossier-panels" class="wiki-dossier-panels"></div>
</section>
```

- [ ] **Step 4: Add SD/CV placeholders and table columns**

In the right-rail `.result-details`, add:

```html
<div><span>重复标准差</span><strong id="experiment-sd">0.0069</strong></div>
<div><span>变异系数 CV</span><strong id="experiment-cv">5.35%</strong></div>
```

In the Experiment page heading, change the descriptive line to:

```html
<p>28 个四突变候选、三次重复、均值、标准差与相对 M3 活性。CV 仅作描述性统计，Wiki 尚未定义验收阈值。</p>
```

Add `<th>SD</th><th>CV</th>` between mean and relative-M3 headers in the experiment table.

- [ ] **Step 5: Run the markup test and verify GREEN**

Run:

```bash
node --test tests/markup.test.js
```

Expected: all markup tests pass.

---

### Task 4: Render and switch Wiki dossier topics

**Files:**
- Modify: `src/app.js`
- Modify: `styles.css`
- Modify: `tests/app-render.test.js`

- [ ] **Step 1: Write failing renderer contract tests**

Add to `tests/app-render.test.js`:

```js
import fs from 'node:fs';

const readSource = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('the app imports Wiki dossier data and renders source-labelled tabs', () => {
  const appSource = readSource('src/app.js');
  assert.match(appSource, /from '.\/wiki-content\.js'/);
  assert.match(appSource, /function renderWikiDossier\(/);
  assert.match(appSource, /data-wiki-topic/);
  assert.match(appSource, /aria-selected/);
  assert.match(appSource, /wiki-source/);
});
```

Merge the new `fs` import with the existing Node imports rather than declaring it twice.

- [ ] **Step 2: Run the renderer contract test and verify RED**

Run:

```bash
node --test tests/app-render.test.js
```

Expected: FAIL because `app.js` has no Wiki renderer.

- [ ] **Step 3: Add Wiki imports and renderer**

At the top of `src/app.js`, add:

```js
import { wikiDossier } from './wiki-content.js';
```

Add these functions after `setStatus`:

```js
function wikiFactMarkup({ label, value, detail, hash }) {
  return `
    <article class="wiki-fact">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${detail}</small>
      ${hash ? `<code>${hash}</code>` : ''}
    </article>
  `;
}

function activateWikiTopic(topicId) {
  document.querySelectorAll('[data-wiki-topic]').forEach((button) => {
    const active = button.dataset.wikiTopic === topicId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-wiki-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.wikiPanel !== topicId;
  });
}

function renderWikiDossier() {
  const tabs = document.getElementById('wiki-dossier-tabs');
  const panels = document.getElementById('wiki-dossier-panels');
  if (!tabs || !panels) return;
  tabs.innerHTML = wikiDossier.map((topic, index) => `
    <button type="button" role="tab" id="wiki-tab-${topic.id}" data-wiki-topic="${topic.id}" aria-controls="wiki-panel-${topic.id}" aria-selected="${index === 0}">${topic.label}</button>
  `).join('');
  panels.innerHTML = wikiDossier.map((topic, index) => `
    <section id="wiki-panel-${topic.id}" class="wiki-topic-panel" role="tabpanel" aria-labelledby="wiki-tab-${topic.id}" data-wiki-panel="${topic.id}"${index === 0 ? '' : ' hidden'}>
      <div class="wiki-topic-heading"><div><h3>${topic.title}</h3><p>${topic.summary}</p></div><span>${topic.facts.length} 项</span></div>
      <div class="wiki-facts">${topic.facts.map(wikiFactMarkup).join('')}</div>
      <p class="wiki-source">来源：${topic.source}</p>
    </section>
  `).join('');
}
```

- [ ] **Step 4: Bind the tab interaction and initialize the renderer**

Inside the existing document click handler in `bindNavigation`, add:

```js
const wikiTopic = event.target.closest('[data-wiki-topic]');
if (wikiTopic) activateWikiTopic(wikiTopic.dataset.wikiTopic);
```

Inside `initialiseWorkbench`, call `renderWikiDossier()` before loading project sequence data.

- [ ] **Step 5: Add compact dossier styles**

Add to `styles.css` near the Overview styles:

```css
.wiki-dossier { margin-top: 14px; padding: 20px; }
.wiki-dossier-tabs { display: flex; gap: 5px; margin-top: 14px; padding: 4px; overflow-x: auto; border-radius: 11px; background: #f3f5f9; scrollbar-width: thin; }
.wiki-dossier-tabs button { flex: 0 0 auto; padding: 7px 11px; border: 0; border-radius: 8px; background: transparent; color: var(--color-muted); font-size: 10px; font-weight: 800; }
.wiki-dossier-tabs button.is-active { background: #fff; color: var(--color-accent-dark); box-shadow: 0 2px 8px rgb(42 54 89 / .08); }
.wiki-topic-panel { padding-top: 14px; }
.wiki-topic-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.wiki-topic-heading h3 { margin: 0; font-size: 14px; }
.wiki-topic-heading p { margin: 4px 0 0; color: var(--color-muted); font-size: 10px; line-height: 1.55; }
.wiki-topic-heading > span { padding: 5px 7px; border-radius: 999px; background: var(--color-accent-soft); color: var(--color-accent-dark); font-size: 9px; font-weight: 800; white-space: nowrap; }
.wiki-facts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin-top: 12px; }
.wiki-fact { display: grid; min-width: 0; gap: 5px; padding: 11px; border: 1px solid var(--color-line); border-radius: 12px; background: #fbfcff; }
.wiki-fact span, .wiki-fact small { color: var(--color-muted); font-size: 9px; line-height: 1.45; }
.wiki-fact strong { font-size: 11px; line-height: 1.4; overflow-wrap: anywhere; }
.wiki-fact code { overflow-wrap: anywhere; color: #59657a; font-size: 8px; line-height: 1.4; }
.wiki-source { margin: 10px 1px 0; color: #929bae; font-size: 9px; }
```

Add responsive rules:

```css
@media (max-width: 1150px) { .wiki-facts { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 760px) { .wiki-dossier { padding: 16px; } }
@media (max-width: 460px) { .wiki-facts { grid-template-columns: 1fr; } }
```

- [ ] **Step 6: Run renderer and full tests**

Run:

```bash
node --test tests/app-render.test.js tests/wiki-content.test.js
npm test
```

Expected: all tests pass with 0 failures.

---

### Task 5: Render SD and CV in candidate details and experiment rows

**Files:**
- Modify: `src/app.js`
- Modify: `styles.css`
- Modify: `tests/app-render.test.js`

- [ ] **Step 1: Add failing statistics-rendering contract test**

Add to `tests/app-render.test.js`:

```js
test('renders descriptive SD and CV values from measured replicates', () => {
  const appSource = readSource('src/app.js');
  assert.match(appSource, /coefficientOfVariation/);
  assert.match(appSource, /sampleStandardDeviation/);
  assert.match(appSource, /experiment-sd/);
  assert.match(appSource, /experiment-cv/);
  assert.match(appSource, /row\.replicates/);
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
node --test tests/app-render.test.js
```

Expected: FAIL because the derived statistics are not rendered.

- [ ] **Step 3: Import and render selected-candidate statistics**

Extend the `./experiments.js` import in `src/app.js`:

```js
import {
  coefficientOfVariation,
  experimentStatus,
  filterExperiments,
  findExperiment,
  sampleStandardDeviation,
  sortedExperiments,
} from './experiments.js';
```

In the empty experiment branch of `updateExperimentResult`, add:

```js
setText('experiment-sd', '—');
setText('experiment-cv', '—');
```

In the measured branch, add:

```js
setText('experiment-sd', sampleStandardDeviation(experiment.replicates).toFixed(4));
setText('experiment-cv', `${coefficientOfVariation(experiment.replicates).toFixed(2)}%`);
```

- [ ] **Step 4: Add SD/CV cells to the Round 0 table renderer**

In `renderExperimentTable`, compute and render:

```js
const standardDeviation = sampleStandardDeviation(row.replicates);
const cv = coefficientOfVariation(row.replicates);
```

Use this row template order:

```js
return `<tr class="${row.relativeToParent > 1 ? 'row-positive' : ''}"><td>${rank}</td><td><button class="candidate-button" data-candidate="${row.mutation}" type="button">${row.mutation}</button></td><td>${mutationLabel(row.mutation)}</td><td>${row.replicates.map((value) => value.toFixed(4)).join(' / ')}</td><td>${row.mean.toFixed(4)}</td><td>${standardDeviation.toFixed(4)}</td><td>${cv.toFixed(2)}%</td><td class="${row.relativeToParent > 1 ? 'value-positive' : ''}">${row.relativeToParent.toFixed(3)}×</td><td>${experimentStatus(row)}</td></tr>`;
```

- [ ] **Step 5: Increase only the table's internal minimum width**

Change the existing rule in `styles.css`:

```css
.experiment-table-card .data-table-wrap table { min-width: 920px; }
```

Do not widen the page or disable the current horizontal table scroll.

- [ ] **Step 6: Run focused and full tests**

Run:

```bash
node --test tests/app-render.test.js tests/experiments.test.js tests/markup.test.js
npm test
```

Expected: all tests pass with 0 failures.

---

### Task 6: Browser interaction and visual QA

**Files:**
- Modify: `design-qa.md`
- Create: `audits/wiki-integration/01-overview-first-fold.png`
- Create: `audits/wiki-integration/02-dossier-validation.png`
- Create: `audits/wiki-integration/03-dossier-verifiability.png`
- Create: `audits/wiki-integration/04-experiments-statistics.png`
- Create: `audits/wiki-integration/comparison.html`
- Create: `audits/wiki-integration/05-comparison-board.png`

- [ ] **Step 1: Run fresh full verification**

Run:

```bash
npm test
```

Expected: 0 failures.

- [ ] **Step 2: Start the local static server**

Run from the workspace root:

```bash
python3 -m http.server 64772 --bind 127.0.0.1
```

Expected: server responds at `http://localhost:64772/`. If the port is already active, reuse the running server.

- [ ] **Step 3: Verify the Overview at 1280 × 720 in the in-app browser**

Use the Browser skill and confirm:

- the original four Overview metrics and two top cards remain in the first fold;
- the dossier appears below the existing wet-lab evidence rather than replacing it;
- six dossier tabs are present;
- default Integrated Validation content has four facts;
- page scrolling remains contained within `.page-scroll`.

Save `01-overview-first-fold.png` and `02-dossier-validation.png`.

- [ ] **Step 4: Verify dossier interaction and traceability**

Click the `可验证性` tab and confirm:

- only the Verifiability panel is visible;
- all four dataset paths and exact hashes render;
- hashes wrap without horizontal page overflow;
- the panel shows its Wiki/data source label.

Click `安全边界` and `贡献标注` once each and confirm the visible panel changes without navigation. Save `03-dossier-verifiability.png`.

- [ ] **Step 5: Verify experiment statistics**

Open Experiment Data and confirm Q191R shows:

- mean `0.1282`;
- sample SD `0.0069` in selected-candidate detail;
- CV `5.35%`;
- SD/CV columns in the table;
- the descriptive-threshold note;
- usable horizontal table scrolling.

Save `04-experiments-statistics.png`.

- [ ] **Step 6: Perform source-versus-implementation visual comparison**

Create a small comparison page that places `audits/midterm-evidence/02-overview-top.png` beside the new Overview first-fold screenshot, and places the new dossier and experiment screenshots below. Capture it as `05-comparison-board.png` and inspect for spacing, type scale, card radius, overflow, and visual-density regressions.

- [ ] **Step 7: Check browser logs**

Read warning/error logs for the app tab.

Expected: no app JavaScript errors or missing asset errors.

- [ ] **Step 8: Update QA documentation**

Append to `design-qa.md`:

```md
## Wiki-grounded content integration

- Six confirmed Wiki topics render in a compact Overview dossier.
- Placeholder-only Wiki pages remain excluded.
- Verification paths and SHA-256 values match repository documentation.
- Q191R descriptive statistics: SD 0.0069; CV 5.35%.
- The original 1280 × 720 first fold remains visually consistent.
- Browser console warnings/errors: none in the final pass.
- Automated tests: record the final fresh pass count.
```

- [ ] **Step 9: Final verification gate**

Run:

```bash
npm test
```

Expected: 0 failures. Report the exact pass count from this final run.

---

## Plan Self-Review

- Spec coverage: all six confirmed Wiki topics, traceability labels, SD/CV metrics, exclusions, responsive behavior, automated tests, and browser QA are assigned to explicit tasks.
- Placeholder scan: implementation steps contain no deferred feature markers; references to excluded placeholder content appear only in tests or scope explanations.
- Type consistency: `wikiDossier`, `verificationAssets`, `sampleStandardDeviation`, and `coefficientOfVariation` use the same names across data, tests, rendering, and QA steps.
- Scope: no new top-level page, router, model function, backend, database, account system, ligand feature, or domain coloring is introduced.
