import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  AMINO_ACIDS,
  applyMutations,
  buildParentSequence,
  normalizeMutations,
  parseFasta,
  parseMutations,
  saturationMutations,
  validateMutations,
  verifyParentSequence,
} from '../src/sequence.js';

const fastaText = fs.readFileSync(new URL('../MAB2962.fa', import.meta.url), 'utf8');
const wildType = fastaText.split(/\r?\n/).filter((line) => !line.startsWith('>')).join('');

test('parses the real MAB2962 FASTA and preserves its 1184-aa sequence', () => {
  const parsed = parseFasta(fastaText);

  assert.match(parsed.header, /^MAB2962/);
  assert.equal(parsed.sequence.length, 1184);
  assert.equal(parsed.sequence[280], 'D');
  assert.equal(parsed.sequence[419], 'G');
  assert.equal(parsed.sequence[513], 'N');
});

test('normalizes mixed separators and orders combination mutations by position', () => {
  assert.equal(normalizeMutations('N514S:D281P / G420W'), 'D281P/G420W/N514S');
  assert.deepEqual(parseMutations('C412I'), [{ from: 'C', position: 412, to: 'I', mutation: 'C412I' }]);
});

test('rejects duplicate sites and residues that do not match the sequence', () => {
  const duplicate = validateMutations(wildType, 'D281P/D281G');
  const wrongResidue = validateMutations(wildType, 'A387V');

  assert.equal(duplicate.valid, false);
  assert.match(duplicate.errors.join(' '), /重复位点 281/);
  assert.equal(wrongResidue.valid, false);
  assert.match(wrongResidue.errors.join(' '), /第387位实际为F/);
});

test('builds the verified M3 parent and applies an additional fourth mutation', () => {
  const m3 = buildParentSequence(wildType, 'M3');
  const m4 = applyMutations(m3, 'C412I');

  assert.equal(m3[280], 'P');
  assert.equal(m3[419], 'W');
  assert.equal(m3[513], 'S');
  assert.equal(m4[411], 'I');
  assert.equal(m4.length, wildType.length);
});

test('verifies the supplied M3 FASTA against WT and the three declared parent mutations', () => {
  const m3Text = fs.readFileSync(new URL('../NJTech-SynCAR-2026-main/submission/njtech-syncar/data/raw/MAB2962 D281P-G420W-N514S.fa', import.meta.url), 'utf8');
  const m3 = parseFasta(m3Text).sequence;

  assert.deepEqual(verifyParentSequence(wildType, m3), [
    { position: 281, from: 'D', to: 'P', mutation: 'D281P' },
    { position: 420, from: 'G', to: 'W', mutation: 'G420W' },
    { position: 514, from: 'N', to: 'S', mutation: 'N514S' },
  ]);
});

test('rejects an M3 sequence containing an undeclared extra difference', () => {
  const invalidM3 = applyMutations(buildParentSequence(wildType, 'M3'), 'A38R');

  assert.throws(() => verifyParentSequence(wildType, invalidM3), /额外差异 A38R/);
});

test('generates all 19 valid saturation mutations for a site', () => {
  const mutations = saturationMutations(wildType, 1066);

  assert.equal(mutations.length, 19);
  assert.equal(new Set(mutations).size, 19);
  assert.ok(mutations.every((mutation) => /^C1066[A-Z]$/.test(mutation)));
  assert.ok(!mutations.includes('C1066C'));
  assert.deepEqual([...AMINO_ACIDS].sort(), [...new Set(AMINO_ACIDS)].sort());
});
