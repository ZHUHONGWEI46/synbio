import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('workbench markup provides labelled semantic landmarks and selection feedback', () => {
  const html = read('index.html');

  assert.match(html, /<header[\s>]/);
  assert.match(html, /<main[\s>]/);
  assert.match(html, /<aside[^>]+aria-label="蛋白质与突变设置"/);
  assert.match(html, /<section[^>]+aria-labelledby="structure-title"/);
  assert.match(html, /<aside[^>]+aria-label="实验结果与预测接口"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /<button[^>]+type="button"/);
  assert.match(html, /<label[^>]+for="protein-select"/);
});

test('exposes five working frontend views and the real-data design controls', () => {
  const html = read('index.html');

  assert.match(html, /data-view-target="overview"/);
  assert.match(html, /data-view-target="design"/);
  assert.match(html, /data-view-target="experiments"/);
  assert.match(html, /data-view-target="batch"/);
  assert.match(html, /data-app-view="team"/);
  assert.match(html, /id="parent-select"/);
  assert.match(html, /id="sequence-panel"/);
  assert.match(html, /id="pae-panel"/);
  assert.match(html, /id="experiment-table-body"/);
  assert.match(html, /id="batch-generate"/);
});

test('keeps the workbench sub-navigation centered and downward-revealed', () => {
  const html = read('index.html');
  const css = read('styles.css');
  const app = read('src/app.js');

  assert.match(html, /id="workbench-subnav"[^>]*class="workbench-subnav"/);
  assert.match(html, /data-app-view="overview"[^>]*aria-labelledby="overview-title"/);
  assert.match(html, /id="subnav-handle"[^>]+aria-controls="workbench-menu"/);
  assert.match(html, /id="workbench-menu"[^>]+class="subnav-menu"/);
  assert.match(html, /data-project-topic="validation"[^>]*>\s*<img src="assets\/navigation\/01_closed_loop\.png"/);
  assert.match(html, /data-project-topic="team"/);
  assert.doesNotMatch(html, /data-project-topic="safety"|data-project-topic="attributions"/);
  assert.match(html, /id="workbench-trigger"[^>]*>[\s\S]*?assets\/navigation\/07_design_workbench\.png/);
  assert.match(css, /\.workbench-subnav\s*\{[^}]*left:\s*50vw[^}]*width:\s*46px/);
  assert.match(css, /\.subnav-menu\s*\{[^}]*top:\s*calc\(100% \+ 8px\)/);
  assert.doesNotMatch(css, /\.workbench-subnav:hover[^}]*width:\s*min\(510px/);
  assert.doesNotMatch(css, /\.workbench-subnav\.is-open/);
  assert.doesNotMatch(app, /shouldExpand/);
  assert.match(app, /navigationMotion\?\.selectSecondary\(target\)/);
  assert.match(app, /setWorkbenchNavigation\(true\);\s*switchAppView\('design'\)/);
});

test('labels the interactive AI panel as a presentation-only simulation', () => {
  const html = read('index.html');

  assert.match(html, /演示模式/);
  assert.match(html, /运行演示预测/);
  assert.match(html, /演示数据，不代表真实模型预测/);
  assert.match(html, /id="ai-demo-results"/);
  assert.doesNotMatch(html, /模型尚未接入|预测服务暂未配置/);
});

test('keeps hash navigation in sync after initial page load', () => {
  const app = read('src/app.js');

  assert.match(app, /addEventListener\('hashchange'/);
  assert.match(app, /viewFromHash\(/);
});

test('links the interactive app and exposes parent context with a real structure viewer', () => {
  const html = read('index.html');

  assert.match(html, /<script\s+type="module"\s+src="src\/app\.js(?:\?[^\"]+)?"><\/script>/);
  assert.match(html, /D281P\/G420W\/N514S/);
  assert.match(html, /id="molstar-app"/);
  assert.match(html, /真实三维结构/);
});

test('stylesheet declares design tokens, focus visibility, and compact reference breakpoints', () => {
  const css = read('styles.css');

  assert.match(css, /--color-accent:/);
  assert.match(css, /--focus-ring:/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*1320px\)/);
  assert.match(css, /@media\s*\(max-width:\s*1150px\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
});

test('desktop grid matches the supplied compact 280-fluid-330 layout', () => {
  const css = read('styles.css');

  assert.match(css, /grid-template-columns:\s*280px\s+minmax\(460px,\s*1fr\)\s+330px/);
});

test('reference typography stays compact instead of scaling dashboard copy up', () => {
  const css = read('styles.css');

  assert.match(css, /\.site-header\s*\{[^}]*height:\s*74px/);
  assert.match(css, /\.brand-team\s*\{[^}]*font-size:\s*19px/);
  assert.match(css, /\.panel-section h1[^}]*font-size:\s*15px/);
  assert.match(css, /\.field-stack label\s*\{[^}]*font-size:\s*12px/);
  assert.match(css, /\.field-stack select,\s*\.field-stack input\s*\{[^}]*font-size:\s*13px/);
  assert.match(css, /\.experiment-value strong\s*\{[^}]*font-size:\s*32px/);
});

test('desktop workbench keeps page fixed and scrolls panels independently', () => {
  const css = read('styles.css');

  assert.match(css, /html,\s*body\s*\{[^}]*height:\s*100%[^}]*overflow:\s*hidden/);
  assert.match(css, /\.workbench\s*\{[^}]*height:\s*calc\(100dvh\s*-\s*74px\)[^}]*overflow:\s*hidden/);
  assert.match(css, /\.control-panel,\s*\.score-panel\s*\{[^}]*height:\s*100%[^}]*overflow-y:\s*auto/);
  assert.match(css, /\.structure-view\s*\{[^}]*flex:\s*1[^}]*min-height:\s*0/);
});

test('branding presents NJTech-SynCAR as the team and AI-SynBio as the event', () => {
  const html = read('index.html');

  assert.match(html, /<strong><span class="brand-team">NJTech-SynCAR<\/span><span class="brand-event">AI–SynBio<\/span><em>2026<\/em><\/strong>/);
  assert.match(html, /<title>NJTech-SynCAR \| AI–SynBio Challenge 2026<\/title>/);
  assert.match(html, /NJTECH-SYNCAR · AI–SYNBIO CHALLENGE 2026/);
  assert.doesNotMatch(html, /<small>蛋白质突变设计与实验数据平台<\/small>/);
  assert.doesNotMatch(html, /class="meta-pill">AI–SynBio Challenge 2026<\/span>/);
  assert.match(html, /class="brand-mark"[^>]*src="assets\/brand\/mutdesign-logo\.png"/);
  assert.match(html, /AlphaFold3 · 模型 0/);
});

test('loads the local AlphaFold3 mmCIF model directly in the workbench', () => {
  const html = read('index.html');
  const app = read('src/app.js');

  assert.match(html, /vendor\/molstar\/viewer\/molstar\.css/);
  assert.match(html, /vendor\/molstar\/viewer\/molstar\.js/);
  assert.match(html, /id="molstar-app"/);
  assert.doesNotMatch(html, /<iframe/);
  assert.match(app, /molstar\.Viewer\.create/);
  assert.match(app, /fold_2026_07_18_14_35_model_\$\{modelIndex\}\.cif/);
  assert.match(app, /viewportShowScreenshotControls:\s*true/);
  assert.match(app, /viewportShowToggleFullscreen:\s*true/);
});

test('offers the latest cofactor complex as a clearly qualified docking structure', () => {
  const html = read('index.html');
  const app = read('src/app.js');

  assert.match(html, /<option selected value="complex">最新复合物对接构象/);
  assert.match(html, /id="structure-source-note"/);
  assert.match(html, /281、420、514仍为WT残基/);
  for (const chain of ['B', 'C', 'D', 'E']) assert.match(html, new RegExp(`data-focus-chain="${chain}"`));
  assert.match(html, /id="reset-structure-view"/);
  assert.match(app, /loadStructureFromUrl\(path, format\)/);
  assert.match(app, /focusStructureElement/);
  assert.match(app, /未能量最小化/);
});

test('left controls expose only real choices and visible loading state', () => {
  const html = read('index.html');

  assert.match(html, /<select id="protein-select"[^>]+disabled/);
  assert.match(html, /<select id="chain-select"[^>]+disabled/);
  assert.match(html, /<option[^>]*value="4">AlphaFold3 · 模型 4<\/option>/);
  assert.match(html, /id="control-status"[^>]+aria-live="polite"/);
  assert.match(html, /id="experiment-source"/);
  assert.match(html, /id="ai-submit"/);
  assert.match(html, /id="combination-input"/);
});

test('surfaces the verified M3 source and eight non-mutating structure shortcuts', () => {
  const html = read('index.html');

  assert.match(html, /id="m3-source-status"/);
  assert.match(html, /结构定位，不改变当前候选构建/);
  assert.equal((html.match(/data-known-site="\d+"/g) ?? []).length, 8);
  for (const position of [281, 302, 303, 306, 342, 343, 344, 396]) {
    assert.match(html, new RegExp(`data-known-site="${position}"`));
  }
});

test('adds a batch-separated wet-lab evidence gallery with an accessible dialog', () => {
  const html = read('index.html');

  assert.match(html, /id="wet-lab-evidence"/);
  assert.match(html, /历史实验批次/);
  assert.match(html, /不能与 Round 0/);
  assert.match(html, /id="evidence-gallery"/);
  assert.match(html, /<dialog id="evidence-dialog"/);
  assert.match(html, /id="evidence-dialog-close"/);
});

test('omits the redundant Wiki dossier from the public project story', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /id="wiki-dossier"|Wiki 项目档案|PROJECT DOSSIER/);
});

test('labels descriptive experiment statistics without inventing a QC threshold', () => {
  const html = read('index.html');
  assert.match(html, /id="experiment-sd"/);
  assert.match(html, /id="experiment-cv"/);
  assert.match(html, /标准差/);
  assert.match(html, /CV/);
  assert.match(html, /尚未定义验收阈值/);
});
