import { experiments, zeroShotControls } from './experiment-data.js';

export function sortedExperiments(direction = 'desc') {
  const factor = direction === 'asc' ? 1 : -1;
  return experiments.slice().sort((a, b) => factor * (a.relativeToParent - b.relativeToParent) || a.mutation.localeCompare(b.mutation));
}

export function findExperiment(mutation) {
  const normalized = String(mutation ?? '').trim().toUpperCase();
  return experiments.find((experiment) => experiment.mutation === normalized);
}

export function experimentStatus(experiment) {
  if (!experiment) return '待实验';
  if (experiment.relativeToParent > 1) return '高于M3';
  if (experiment.relativeToParent < 1) return '低于M3';
  return '与M3持平';
}

export function filterExperiments({ query = '', direction = 'all', order = 'desc' } = {}) {
  const search = String(query).trim().toUpperCase();
  return sortedExperiments(order).filter((experiment) => {
    const matchesQuery = !search || experiment.mutation.includes(search) || experiment.fullMutation.includes(search);
    const matchesDirection = direction === 'above'
      ? experiment.relativeToParent > 1
      : direction === 'below'
        ? experiment.relativeToParent < 1
        : true;
    return matchesQuery && matchesDirection;
  });
}

export function experimentSummary() {
  const ranked = sortedExperiments();
  return {
    testedVariants: experiments.length,
    aboveParent: experiments.filter((row) => row.relativeToParent > 1).length,
    belowParent: experiments.filter((row) => row.relativeToParent < 1).length,
    best: ranked[0],
    parentControl: zeroShotControls.find((control) => control.name === 'PSW'),
  };
}

export function sampleStandardDeviation(values) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1));
}

export function coefficientOfVariation(values) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) return 0;
  return (sampleStandardDeviation(values) / Math.abs(mean)) * 100;
}
