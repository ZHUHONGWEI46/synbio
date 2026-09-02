import assert from 'node:assert/strict';
import test from 'node:test';

import { evidenceFigures, pocketSites, wetLabMilestones } from '../src/midterm-evidence.js';

test('exposes the eight report-backed pocket sites in report order', () => {
  assert.deepEqual(pocketSites.map(({ label }) => label), ['D281', 'I302', 'M303', 'G306', 'A342', 'L343', 'V344', 'V396']);
  assert.ok(pocketSites.every(({ position, wildTypeResidue }) => Number.isInteger(position) && typeof wildTypeResidue === 'string'));
});

test('keeps historical wet-lab milestones explicitly separate from Round 0', () => {
  assert.deepEqual(wetLabMilestones.map(({ mutation, result }) => [mutation, result]), [
    ['A342E', '+45%'],
    ['N514Y', '+67%'],
    ['D281P', '+100%'],
    ['D281P/G420W/N514S', '4.8×'],
  ]);
  assert.ok(wetLabMilestones.every(({ batch }) => batch && !/Round 0/i.test(batch)));
});

test('uses six supplied report figures instead of placeholders', () => {
  assert.equal(evidenceFigures.length, 6);
  assert.ok(evidenceFigures.every(({ src, title, caption }) => src.startsWith('/NJTech-SynCAR-2026-main/') && title && caption));
});
