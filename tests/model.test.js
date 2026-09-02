import test from 'node:test';
import assert from 'node:assert/strict';

import { candidates, parentMutations } from '../src/data.js';
import { findCandidate, mutationLabel } from '../src/model.js';

test('exposes the three-mutation parent and real measured candidates', () => {
  assert.deepEqual(parentMutations, ['D281P', 'G420W', 'N514S']);
  assert.equal(candidates.length, 28);

  const candidate = findCandidate('Q191R');
  assert.equal(candidate.relativeToParent, 1.11802325581395);
  assert.equal(mutationLabel(candidate), 'Q191R');
});

test('looks up candidates without case sensitivity and returns undefined when absent', () => {
  assert.equal(findCandidate('c412i').mutation, 'C412I');
  assert.equal(findCandidate('A999Z'), undefined);
});

test('formats a candidate label from residue fields when no mutation string is supplied', () => {
  assert.equal(mutationLabel({ from: 'C', position: 412, to: 'I' }), 'C412I');
});
