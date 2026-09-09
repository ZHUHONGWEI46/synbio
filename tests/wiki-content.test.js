import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';

import { verificationAssets, wikiDossier } from '../src/wiki-content.js';

test('publishes exactly the six confirmed Wiki dossier topics', () => {
  assert.deepEqual(wikiDossier.map(({ id }) => id), [
    'validation',
    'engineering',
    'wet-lab',
    'verifiability',
    'safety',
    'attributions',
  ]);
  assert.ok(wikiDossier.every(({ label, title, summary, source, facts }) => label && title && summary && source && facts.length));
});

test('keeps the four repository verification fingerprints exact', () => {
  assert.deepEqual(verificationAssets.map(({ sha256 }) => sha256), [
    'bfb9e72796a1f80b6fe768fbda52d2cb009b7a6e4ca93d263c0df19250b71c8f',
    '18b20b5a715b02cba91b02bd48646737a361f36b54d8ac863cee2afaaf6868d4',
    'a3063d88f96ab6f2a0a09aec90f48485f4afeeb349f85de79489a172d3c9df7b',
    '170a3b875964a83f6ab8db8f2372fce2dbbe3b6bef127dab18c125d4fc21595f',
  ]);
});

test('does not expose placeholder-only Wiki material as confirmed content', () => {
  const serialized = JSON.stringify(wikiDossier);
  assert.doesNotMatch(serialized, /YYYY-MM-DD|BBa_XXXX|<\s*队名\s*>|待补充|\.\.\.|…/);
});

test('distinguishes documented CRLF fingerprints from the current LF FASTA files', () => {
  for (const asset of verificationAssets) {
    const file = fs.readFileSync(new URL(`../NJTech-SynCAR-2026-main/submission/njtech-syncar/${asset.path}`, import.meta.url));
    const currentSha256 = createHash('sha256').update(file).digest('hex');
    assert.equal(asset.currentSha256, currentSha256, asset.name);
    assert.ok(asset.verificationNote, asset.name);
  }
  assert.equal(verificationAssets[0].sha256, verificationAssets[0].currentSha256);
  assert.notEqual(verificationAssets[2].sha256, verificationAssets[2].currentSha256);
  assert.match(verificationAssets[2].verificationNote, /CRLF.*LF/);
});
