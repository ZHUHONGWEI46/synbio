export const AMINO_ACIDS = Object.freeze(['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y']);
export const PARENT_MUTATIONS = Object.freeze(['D281P', 'G420W', 'N514S']);

const AMINO_ACID_SET = new Set(AMINO_ACIDS);
const MUTATION_PATTERN = /^([ACDEFGHIKLMNPQRSTVWY])(\d+)([ACDEFGHIKLMNPQRSTVWY])$/;

export function parseFasta(text) {
  const lines = String(text ?? '').trim().split(/\r?\n/);
  const headerLine = lines.find((line) => line.trim().startsWith('>'));
  const sequence = lines
    .filter((line) => !line.trim().startsWith('>'))
    .join('')
    .replace(/\s/g, '')
    .toUpperCase();

  if (!headerLine || !sequence) throw new Error('FASTA文件缺少标题或序列。');
  if ([...sequence].some((residue) => !AMINO_ACID_SET.has(residue))) throw new Error('FASTA序列包含非法氨基酸。');

  return { header: headerLine.trim().slice(1).trim(), sequence };
}

export function parseMutations(value) {
  const tokens = String(value ?? '')
    .toUpperCase()
    .trim()
    .split(/[\s/:,;]+/)
    .filter(Boolean);

  if (!tokens.length) return [];

  return tokens.map((token) => {
    const match = token.match(MUTATION_PATTERN);
    if (!match) throw new Error(`突变格式错误：${token}`);
    const [, from, position, to] = match;
    return { from, position: Number(position), to, mutation: `${from}${Number(position)}${to}` };
  });
}

export function normalizeMutations(value) {
  return parseMutations(value)
    .sort((a, b) => a.position - b.position || a.mutation.localeCompare(b.mutation))
    .map(({ mutation }) => mutation)
    .join('/');
}

export function validateMutations(sequence, value) {
  const normalizedSequence = String(sequence ?? '').trim().toUpperCase();
  const errors = [];
  let mutations = [];

  try {
    mutations = parseMutations(value);
  } catch (error) {
    errors.push(error.message);
    return { valid: false, errors, mutations, normalized: '' };
  }

  const seen = new Set();
  for (const mutation of mutations) {
    if (seen.has(mutation.position)) errors.push(`重复位点 ${mutation.position}`);
    seen.add(mutation.position);
    if (mutation.position < 1 || mutation.position > normalizedSequence.length) {
      errors.push(`位点 ${mutation.position} 超出序列范围 1–${normalizedSequence.length}`);
      continue;
    }
    const actual = normalizedSequence[mutation.position - 1];
    if (actual !== mutation.from) errors.push(`第${mutation.position}位实际为${actual}，不能输入${mutation.mutation}`);
    if (mutation.from === mutation.to) errors.push(`${mutation.mutation} 没有改变氨基酸`);
  }

  return {
    valid: errors.length === 0,
    errors,
    mutations,
    normalized: mutations.slice().sort((a, b) => a.position - b.position).map(({ mutation }) => mutation).join('/'),
  };
}

export function applyMutations(sequence, value) {
  const validation = validateMutations(sequence, value);
  if (!validation.valid) throw new Error(validation.errors.join('；'));
  const output = [...String(sequence).trim().toUpperCase()];
  for (const mutation of validation.mutations) output[mutation.position - 1] = mutation.to;
  return output.join('');
}

export function buildParentSequence(wildTypeSequence, parent = 'WT') {
  return parent === 'M3' ? applyMutations(wildTypeSequence, PARENT_MUTATIONS.join('/')) : wildTypeSequence;
}

export function verifyParentSequence(wildTypeSequence, parentSequence) {
  const wildType = String(wildTypeSequence ?? '').trim().toUpperCase();
  const parent = String(parentSequence ?? '').trim().toUpperCase();
  if (!wildType || !parent) throw new Error('WT 或 M3 序列为空。');
  if (wildType.length !== parent.length) throw new Error(`M3 序列长度 ${parent.length} 与 WT ${wildType.length} 不一致。`);

  const expected = PARENT_MUTATIONS.map((mutation) => parseMutations(mutation)[0]);
  const expectedByPosition = new Map(expected.map((mutation) => [mutation.position, mutation]));
  const observed = [];

  for (let index = 0; index < wildType.length; index += 1) {
    if (wildType[index] === parent[index]) continue;
    const position = index + 1;
    const mutation = `${wildType[index]}${position}${parent[index]}`;
    const declared = expectedByPosition.get(position);
    if (!declared || declared.mutation !== mutation) throw new Error(`M3 序列包含额外差异 ${mutation}。`);
    observed.push({ position, from: wildType[index], to: parent[index], mutation });
  }

  const missing = expected.filter(({ mutation }) => !observed.some((item) => item.mutation === mutation));
  if (missing.length) throw new Error(`M3 序列缺少声明突变 ${missing.map(({ mutation }) => mutation).join('/')}。`);
  return observed;
}

export function saturationMutations(sequence, position) {
  const site = Number(position);
  if (!Number.isInteger(site) || site < 1 || site > sequence.length) throw new Error(`位点必须在 1–${sequence.length} 之间。`);
  const from = sequence[site - 1];
  return AMINO_ACIDS.filter((to) => to !== from).map((to) => `${from}${site}${to}`);
}

export function mergeMutationLabels(parent, additions) {
  const base = parent === 'M3' ? PARENT_MUTATIONS : [];
  return normalizeMutations([...base, ...parseMutations(additions).map(({ mutation }) => mutation)].join('/'));
}
