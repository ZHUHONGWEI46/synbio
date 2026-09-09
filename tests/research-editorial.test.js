import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderDocument, moduleGuide } from '../src/research-pages.js';
import { feedbackDiagram } from '../src/narrative.js';

test('engineering timeline retains all five original versions, dates and reasons', () => {
  const md = fs.readFileSync(new URL('../assets/repository/submission/njtech-syncar/wiki/Engineering-Cycle.md', import.meta.url), 'utf8');
  const { html } = renderDocument(md, 'Engineering-Cycle.md', 'engineering');
  assert.match(html, /research-timeline/);
  for (const row of md.split('\n').filter(line => /^\| v0\./.test(line))) {
    for (const cell of row.slice(1, -1).split('|').map(value => value.trim())) {
      const plain = cell.replaceAll('`', '');
      assert.ok(html.replace(/<[^>]+>/g, '').includes(plain), `Missing source cell: ${plain}`);
    }
  }
  assert.equal((html.match(/class="is-recorded"/g) ?? []).length, 5);
  assert.equal((html.match(/class="is-pending"/g) ?? []).length, 4);
});

test('guide variants distinguish architecture, evidence boundaries and wet lab index', () => {
  assert.match(moduleGuide('ai-methods'), /STAGE 01[\s\S]*STAGE 02/);
  assert.match(moduleGuide('ai-methods'), /完整训练指标尚未锁定/);
  assert.match(moduleGuide('verifiability'), /尚待补齐的证据/);
  assert.match(moduleGuide('wet-lab'), /非完成状态/);
  assert.doesNotMatch(moduleGuide('engineering'), /<ol>/);
});

test('diagram is accessible and explicitly a process illustration', () => {
  const html = feedbackDiagram();
  assert.match(html, /role="img" aria-label=/);
  assert.match(html, /研究流程示意 · 推荐仍需实验验证/);
  assert.doesNotMatch(html, /准确率|置信度|%/);
});

test('editorial parser keeps untrusted text inert in headings, code and timeline', () => {
  const {html} = renderDocument('## <script>alert(1)</script>\n\n```\n<img src=x onerror=alert(1)>\n```', 'test.md', 'engineering');
  assert.doesNotMatch(html, /<script>|<img/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
});
