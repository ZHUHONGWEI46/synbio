const psw = 'D281P/G420W/N514S';
export const dockingModels = [
  {id:'WT',label:'WT · 野生型',file:'WT.pdb',mutation:'',addition:'',parent:'WT'},
  {id:'PSW',label:'PSW · 三突变亲本',file:'PSW_complex.pdb',mutation:psw,addition:'',parent:'M3'},
  {id:'G980M',label:'G980M · WT 背景单突变',file:'G980M_complex.pdb',mutation:'G980M',addition:'G980M',parent:'WT'},
  ...['F430M','G980M','L417A','N506A','N506A-G980M'].map(extra=>({id:`PSW-${extra}`,label:`PSW-${extra} · ${extra.includes('-')?'五':'四'}突变`,file:`PSW-${extra}_complex.pdb`,mutation:`${psw}/${extra.replaceAll('-','/')}`,addition:extra.replaceAll('-','/'),parent:'M3'})),
];
const canonical = value => String(value??'').toUpperCase().split('/').filter(Boolean).sort().join('/');
export function dockingModel(selection) { return dockingModels.find(model=>`dock:${model.id}`===selection); }
export function dockingPath(selection) {
  const model = dockingModel(selection);
  return model ? `assets/structures/variants/${model.file}` : undefined;
}
export function matchingDockingModel(fullMutation) {
  return dockingModels.find(model=>canonical(model.mutation)===canonical(fullMutation));
}
export function dockingMatches(selection, fullMutation) {
  const model = dockingModel(selection);
  return Boolean(model && canonical(model.mutation)===canonical(fullMutation));
}
