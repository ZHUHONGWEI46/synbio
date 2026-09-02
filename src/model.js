import { candidates } from './data.js';

export function findCandidate(mutation) {
  if (typeof mutation !== 'string') return undefined;

  const normalizedMutation = mutation.trim().toUpperCase();
  return candidates.find((candidate) => candidate.mutation === normalizedMutation);
}

export function mutationLabel(candidate) {
  if (candidate.mutation) return candidate.mutation;
  return `${candidate.from}${candidate.position}${candidate.to}`;
}
