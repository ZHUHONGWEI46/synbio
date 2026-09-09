import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const structure = fs.readFileSync(new URL('../assets/structures/MAB2962-complex-docking.pdb', import.meta.url), 'utf8');

test('packages the supplied 1184-residue docking complex with all four cofactors', () => {
  assert.match(structure, /RECEPTOR IS AF3-DERIVED; COMPLEX IS NOT ENERGY-MINIMIZED/);
  assert.match(structure, /^ATOM\s+\d+\s+\S+\s+LEU A1184/m);
  for (const residue of ['ATP', 'NDP', 'MG', 'GAB']) assert.match(structure, new RegExp(`^HETATM.*\\s${residue}\\s`, 'm'));
});

test('does not mislabel the supplied protein coordinates as the declared M3 mutations', () => {
  assert.match(structure, /^ATOM.*\sASP A\s*281\s/m);
  assert.match(structure, /^ATOM.*\sGLY A\s*420\s/m);
  assert.match(structure, /^ATOM.*\sASN A\s*514\s/m);
});
