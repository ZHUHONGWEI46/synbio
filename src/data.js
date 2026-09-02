import { experiments } from './experiment-data.js';
import { PARENT_MUTATIONS } from './sequence.js';

export const parentMutations = [...PARENT_MUTATIONS];
export const candidates = experiments.map((experiment) => {
  const [, from, position, to] = experiment.mutation.match(/^([A-Z])(\d+)([A-Z])$/);
  return { ...experiment, from, position: Number(position), to };
});

export const experimentSummary = {
  testedVariants: experiments.length,
  parent: parentMutations.join('/'),
  assay: '发酵上清液活性初筛',
};
