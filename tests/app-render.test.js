import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import * as app from '../src/app.js';

const {
  candidateForControls,
  mutationLabel,
  renderCandidateText,
} = app;

const readSource = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('renders measured C412I experiment data without inventing a prediction score', () => {
  const text = renderCandidateText('C412I');

  assert.match(text, /1\.078/);
  assert.match(text, /C412I/);
  assert.match(text, /已实验验证/);
  assert.doesNotMatch(text, /预测得分|活性提升概率/);
});

test('shows the full parent plus selected extension mutation label', () => {
  assert.equal(mutationLabel('C412I'), 'D281P/C412I/G420W/N514S');
});

test('finds a measured candidate from the editable site and residue controls', () => {
  assert.equal(candidateForControls('412', 'I · Isoleucine')?.mutation, 'C412I');
  assert.equal(candidateForControls('999', 'A · Alanine'), undefined);
});

test('maps every available structure model selector value to a real local mmCIF file', () => {
  assert.equal(typeof app.modelPathForSelection, 'function');
  assert.match(app.modelPathForSelection('complex'), /MAB2962-complex-docking\.pdb$/);
  assert.match(app.modelPathForSelection('AlphaFold3 · 模型 0'), /model_0\.cif$/);
  assert.match(app.modelPathForSelection('AlphaFold3 · 模型 4'), /model_4\.cif$/);
  assert.equal(app.modelPathForSelection('not-a-model'), undefined);
});

test('maps PAE values to bounded heatmap colors', () => {
  assert.equal(typeof app.paeColor, 'function');
  assert.match(app.paeColor(0), /^rgb\(/);
  assert.match(app.paeColor(31.75), /^rgb\(/);
  assert.notEqual(app.paeColor(0), app.paeColor(31.75));
});

test('the app does not ship the removed Wiki dossier renderer', () => {
  const appSource = readSource('src/app.js');
  assert.doesNotMatch(appSource, /from '.\/wiki-content\.js'|renderWikiDossier|data-wiki-topic|wiki-source/);
});

test('renders descriptive SD and CV values from measured replicates', () => {
  const appSource = readSource('src/app.js');
  assert.match(appSource, /coefficientOfVariation/);
  assert.match(appSource, /sampleStandardDeviation/);
  assert.match(appSource, /experiment-sd/);
  assert.match(appSource, /experiment-cv/);
  assert.match(appSource, /row\.replicates/);
});
