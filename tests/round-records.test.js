import test from 'node:test';
import assert from 'node:assert/strict';
import { roundRecords } from '../src/round-records.js';
import { recordsForRound, asExperiment, roundStatistics } from '../src/round-browser.js';

test('official rounds preserve all 231 sequence-verified records', () => {
  assert.equal(roundRecords.length, 231);
  assert.deepEqual([0,1,2,3].map(n => recordsForRound(n).length), [28,89,94,20]);
  assert.equal(new Set(roundRecords.map(x => x.id)).size, 231);
  assert.ok(roundRecords.every(x => x.sequenceVerified && Number.isFinite(x.average)));
  assert.equal(roundRecords.filter(x => x.replicates.includes(null)).length, 6);
});
test('combination search matches separated mutation tokens', () => {
  const rows = recordsForRound(3, 'L335A/N506A');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].mutation, 'L335A/N506A');
  assert.ok(recordsForRound(3).every(x => x.fullMutation.split('/').length === 5));
});
test('normalized results retain missing repeat positions and exclude them from statistics', () => {
  const row = roundRecords.find(x => x.replicates.includes(null));
  const projected = asExperiment(row);
  assert.deepEqual(projected.originalReplicates, row.replicates);
  assert.equal(projected.replicates.length, row.replicates.filter(Number.isFinite).length);
  assert.equal(projected.relativeToParent, row.average);
  assert.equal(projected.normalized, true);
  assert.deepEqual(roundStatistics({replicates: [1, null, null]}), {n:1, sd:null, cv:null});
  assert.deepEqual(roundStatistics({replicates: [null, null, null]}), {n:0, sd:null, cv:null});
});
