import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dockingModels,dockingPath,dockingMatches,matchingDockingModel} from '../src/docking-models.js';
const aa={ALA:'A',ARG:'R',ASN:'N',ASP:'D',CYS:'C',GLN:'Q',GLU:'E',GLY:'G',HIS:'H',ILE:'I',LEU:'L',LYS:'K',MET:'M',PHE:'F',PRO:'P',SER:'S',THR:'T',TRP:'W',TYR:'Y',VAL:'V'};
const residues = raw => new Map(raw.split(/\r?\n/).filter(l=>l.startsWith('ATOM  ')&&l[21]==='A').map(l=>[Number(l.slice(22,26)),aa[l.slice(17,20)]]));
test('all eight variant coordinates match exactly the declared mutations, with complete cofactors',()=>{
  const wt=residues(fs.readFileSync(new URL('../'+dockingPath('dock:WT'),import.meta.url),'utf8'));
  const fasta=fs.readFileSync(new URL('../MAB2962.fa',import.meta.url),'utf8').split(/\r?\n/).filter(line=>!line.startsWith('>')).join('').replace(/\s/g,'');
  assert.equal([...wt].sort((a,b)=>a[0]-b[0]).map(([,aa])=>aa).join(''),fasta);
  assert.equal(dockingModels.length,8);
  for(const model of dockingModels){
    const raw=fs.readFileSync(new URL('../'+dockingPath(`dock:${model.id}`),import.meta.url),'utf8');
    const actual=residues(raw);
    assert.equal(actual.size,1184,model.id);
    const differences=[...actual].filter(([p,a])=>wt.get(p)!==a).map(([p,a])=>`${wt.get(p)}${p}${a}`).sort();
    assert.deepEqual(differences,model.mutation.split('/').filter(Boolean).sort(),model.id);
    for(const ligand of ['ATP','NDP','MG','GAB']) assert.match(raw,new RegExp(`^HETATM.*\\s${ligand}\\s`,'m'));
    assert.match(raw,/COMPLEX IS NOT ENERGY-MINIMIZED/);
  }
});
test('WT G980M cannot match PSW G980M and combinations match regardless of token order',()=>{
  assert.equal(matchingDockingModel('G980M').id,'G980M');
  assert.equal(matchingDockingModel('G980M/N514S/G420W/D281P').id,'PSW-G980M');
  assert.equal(dockingMatches('dock:G980M','D281P/G420W/N514S/G980M'),false);
  assert.equal(matchingDockingModel('D281P/G420W/N514S/N506A/G980M').id,'PSW-N506A-G980M');
  assert.equal(matchingDockingModel('Q191R/D281P/G420W/N514S'),undefined);
  assert.equal(dockingPath('dock:../../oops'),undefined);
});
