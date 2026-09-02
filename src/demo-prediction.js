function hashText(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function scoreFrom(seed, offset) {
  return 55 + ((seed >>> offset) % 38);
}

export function createDemoPrediction(candidate) {
  const normalized = String(candidate ?? '').trim().toUpperCase();
  const seed = hashText(normalized || 'MAB2962');
  const activity = scoreFrom(seed, 0);
  const stability = scoreFrom(seed, 7);
  const structure = scoreFrom(seed, 14);
  const overall = Math.round((activity * .45) + (stability * .25) + (structure * .3));

  return {
    mode: 'demo',
    candidate: normalized,
    overall,
    activity,
    stability,
    structure,
    summary: overall >= 78 ? '演示优先级：较高' : overall >= 66 ? '演示优先级：中等' : '演示优先级：较低',
    disclaimer: '演示数据，不代表真实模型预测。',
  };
}
