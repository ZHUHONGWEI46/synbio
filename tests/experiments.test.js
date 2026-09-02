import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { experiments, zeroShotControls } from '../src/experiment-data.js';
import {
  coefficientOfVariation,
  experimentStatus,
  experimentSummary,
  filterExperiments,
  findExperiment,
  sampleStandardDeviation,
  sortedExperiments,
} from '../src/experiments.js';
import { validateMutations } from '../src/sequence.js';

const fastaText = fs.readFileSync(new URL('../MAB2962.fa', import.meta.url), 'utf8');
const wildType = fastaText.split(/\r?\n/).filter((line) => !line.startsWith('>')).join('');

test('exposes the 28 measured Round 0 candidates and five assay controls', () => {
  assert.equal(experiments.length, 28);
  assert.deepEqual(zeroShotControls.map((control) => control.name), ['WT', 'P', 'PS', 'PW', 'PSW']);
});

test('all measured candidate mutations match the wild-type MAB2962 sequence', () => {
  for (const experiment of experiments) {
    assert.equal(validateMutations(wildType, experiment.mutation).valid, true, experiment.mutation);
  }
});

test('sorts Q191R first and retains the measured C412I replicate values', () => {
  const ranked = sortedExperiments();
  const c412i = findExperiment('c412i');

  assert.equal(ranked[0].mutation, 'Q191R');
  assert.equal(ranked[0].relativeToParent, 1.11802325581395);
  assert.deepEqual(c412i.replicates, [0.1255, 0.122, 0.1232]);
  assert.equal(c412i.relativeToParent, 1.07761627906977);
});

test('filters experiments by query and relationship to the M3 parent', () => {
  assert.deepEqual(filterExperiments({ query: '1066', direction: 'all' }).map((row) => row.mutation), ['C1066L', 'C1066V']);
  assert.ok(filterExperiments({ direction: 'above' }).every((row) => row.relativeToParent > 1));
  assert.ok(filterExperiments({ direction: 'below' }).every((row) => row.relativeToParent < 1));
});

test('derives transparent experiment statuses and summary values', () => {
  assert.equal(experimentStatus(findExperiment('Q191R')), '高于M3');
  assert.equal(experimentStatus(findExperiment('A38R')), '低于M3');
  assert.equal(experimentSummary().testedVariants, 28);
  assert.equal(experimentSummary().best.mutation, 'Q191R');
});

test('calculates sample SD and CV for the measured Q191R replicates', () => {
  const row = findExperiment('Q191R');
  assert.equal(Number(sampleStandardDeviation(row.replicates).toFixed(6)), 0.006864);
  assert.equal(Number(coefficientOfVariation(row.replicates).toFixed(3)), 5.354);
});

test('returns zero CV when replicates are insufficient or have zero mean', () => {
  assert.equal(coefficientOfVariation([0.12]), 0);
  assert.equal(coefficientOfVariation([-1, 0, 1]), 0);
});
