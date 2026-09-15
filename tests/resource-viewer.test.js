import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { directoryEntries } from '../src/resource-viewer.js';
import { renderDocument } from '../src/research-pages.js';
const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('resource viewer lists archived directory files without placeholder noise',()=>{
  const files=['submission/demo/src/a.py','submission/demo/src/sub/b.py','submission/demo/src/.gitkeep','submission/demo/README.md'];
  assert.deepEqual(directoryEntries(files,'submission/demo/src/'),['a.py','sub/b.py']);
});
test('repository markdown links open in the in-site resource viewer',()=>{
  globalThis.location={href:'https://example.test/synbio/#ai-methods',origin:'https://example.test'};
  const rendered=renderDocument('[source](../src/ai/historical_benchmark/)', 'https://example.test/synbio/assets/repository/submission/njtech-syncar/wiki/AI.md','test');
  assert.match(rendered.html,/class="resource-link"/);
  assert.match(rendered.html,/data-resource-url="https:\/\/example.test\/synbio\/assets\/repository\/submission\/njtech-syncar\/src\/ai\/historical_benchmark\/"/);
});
test('encoded ampersands are not shown as literal amp entities',()=>{
  globalThis.location={href:'https://example.test/synbio/',origin:'https://example.test'};
  const rendered=renderDocument('[AI Ethics &amp; Safety](./AI-Ethics-Safety.md)', 'https://example.test/synbio/assets/repository/submission/njtech-syncar/wiki/Human-Practices.md','test');
  assert.match(rendered.html,/>AI Ethics &amp; Safety</);
  assert.doesNotMatch(rendered.html,/&amp;amp;/);
});
test('code-styled link labels keep markup out of the window title',()=>{
  globalThis.location={href:'https://example.test/synbio/',origin:'https://example.test'};
  const rendered=renderDocument('[`src/example/`](../src/example/)', 'https://example.test/synbio/assets/repository/submission/demo/wiki/Page.md','test');
  assert.match(rendered.html,/data-resource-title="src\/example\/"/);
  assert.doesNotMatch(rendered.html,/data-resource-title="[^"]*code/);
});
test('resource dialog and module are wired into the page',()=>{
  assert.match(read('index.html'),/id="resource-dialog"/);
  assert.match(read('src/app.js'),/initResourceViewer\(\)/);
  assert.match(read('resource-viewer.css'),/\.resource-dialog/);
});
