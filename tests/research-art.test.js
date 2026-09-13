import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { researchModules, researchHeaderArt } from '../src/research-pages.js';

test('five research mastheads map to distinct decorative atlas strips', () => {
  researchModules.forEach(([id], row) => {
    const html = researchHeaderArt(id);
    assert.ok(html.includes(`--art-row:${row * 25}%`));
    assert.ok(html.includes('aria-hidden="true"'));
    assert.ok(html.includes('非实验结果'));
  });
  assert.equal(researchHeaderArt('unknown'), '');
  assert.ok(existsSync(new URL('../assets/research/header-art-atlas.png', import.meta.url)));
});
test('masthead art retains mobile layout and reduced-motion fallback', () => {
  const css = readFileSync(new URL('../research-art.css', import.meta.url), 'utf8');
  assert.ok(css.includes('max-width: 760px'));
  assert.ok(css.includes('prefers-reduced-motion: reduce'));
  assert.ok(css.includes('mask-composite: intersect'));
});
