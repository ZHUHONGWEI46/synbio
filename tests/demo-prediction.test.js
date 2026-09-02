import assert from 'node:assert/strict';
import test from 'node:test';

import { createDemoPrediction } from '../src/demo-prediction.js';

test('creates a deterministic presentation-only score for the same candidate', () => {
  const first = createDemoPrediction('Q191R/D281P/G420W/N514S');
  const second = createDemoPrediction('Q191R/D281P/G420W/N514S');

  assert.deepEqual(first, second);
  assert.equal(first.mode, 'demo');
  assert.match(first.disclaimer, /演示数据/);
  assert.ok(first.activity >= 55 && first.activity <= 92);
  assert.ok(first.stability >= 55 && first.stability <= 92);
  assert.ok(first.structure >= 55 && first.structure <= 92);
});

test('changes the presentation score when the candidate changes', () => {
  const q191r = createDemoPrediction('Q191R/D281P/G420W/N514S');
  const c412i = createDemoPrediction('C412I/D281P/G420W/N514S');

  assert.notDeepEqual(q191r, c412i);
});
