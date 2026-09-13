import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { modelPathForSelection } from '../src/app.js';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('structure URLs remain inside GitHub Pages project directory', () => {
  for (const selection of ['complex', '0', '1', '2', '3', '4']) {
    const path = modelPathForSelection(selection);
    assert.ok(path && !path.startsWith('/'));
    assert.ok(existsSync(new URL(`../${path}`, import.meta.url)));
    assert.ok(new URL(path, 'https://example.github.io/synbio/').pathname.startsWith('/synbio/'));
  }
});
test('sequence and PAE requests do not escape the project or use ignored snapshots', () => {
  const app = read('src/app.js');
  assert.doesNotMatch(app, /fetch\(['"]\//);
  assert.doesNotMatch(app, /encodeURI\(['"]\/NJTech/);
  assert.match(app, /assets\/repository\/submission\/njtech-syncar\/data\/raw\/mab2962_psw\.faa/);
});
test('homepage does not download the three-dimensional engine before it is needed', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /<script\s+src="vendor\/molstar\/molstar\.js"/);
  assert.match(read('src/app.js'), /await ensureStructureRuntime\(\)/);
});
test('hidden team artwork defers loading without replacing original pixels', () => {
  const images = read('index.html').match(/<img[^>]+src="assets\/team\/[^>]+>/g);
  assert.ok(images.length >= 10);
  assert.ok(images.every(img => img.includes('loading="lazy"')));
});
