import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('complete catalytic route includes four molecules and three named enzymes', () => {
  const source = read('src/catalytic-route.js');
  for (const name of ['L-谷氨酸', 'GABA', '4-氨基丁醛', '1,4-丁二胺', 'GadA', 'CAR', 'TA']) {
    assert.ok(source.includes(name), name);
  }
  for (const molecule of ['glutamate', 'gaba', 'aldehyde', 'putrescine']) {
    assert.ok(source.includes(`molecule-${molecule}`));
  }
  assert.match(source, /关键限速酶/);
  assert.match(source, /不表示实测反应速率/);
  assert.match(source, /概念舱非结构模型/);
});

test('route animation follows the actual home scroller with static reduced-motion fallback', () => {
  const source = read('src/catalytic-route.js');
  assert.match(source, /getElementById\('home-scroll'\)/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /scrub:\.35/);
  assert.doesNotMatch(source, /pin:\s*true/);
  assert.match(read('catalytic-route.css'), /position: sticky; top: 0/);
  assert.match(source, /scroller\.clientHeight\*4\.2/);
  assert.match(source, /responsive\.revert\(\)/);
  assert.match(source, /catalytic-traveler/);
  assert.match(source, /invalidateOnRefresh:true/);
  assert.match(source, /loading="lazy" decoding="async"/);
  assert.match(read('catalytic-route.css'), /max-width:\s*760px/);
  assert.match(read('src/app.js'), /try \{ initCatalyticRoute\(\); \} catch/);
});
