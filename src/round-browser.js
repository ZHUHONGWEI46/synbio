import { roundRecords } from './round-records.js';
import { normalizeMutations } from './sequence.js';

let activeRound = 0;
let selectedId;
export function currentRound() { return activeRound; }
export function recordsForRound(round = activeRound, query = '') {
  const tokens = query.trim().toUpperCase().split(/[\s/,，]+/).filter(Boolean);
  return roundRecords.filter(row => row.round === Number(round) && tokens.every(token => row.fullMutation.includes(token)))
    .sort((a, b) => (b.average ?? -Infinity) - (a.average ?? -Infinity));
}
export function asExperiment(row) {
  if (!row) return undefined;
  return { ...row, normalized: true, mean: row.average, relativeToParent: row.average,
    originalReplicates: row.replicates, replicates: row.replicates.filter(Number.isFinite), round: `R${row.round}` };
}
export function findRoundExperiment(mutation) {
  const label = normalizeMutations(mutation);
  const matches = roundRecords.filter(row => row.round === activeRound &&
    (row.mutation === label || row.fullMutation === label));
  return asExperiment(matches.find(row => row.id === selectedId) ?? matches[0]);
}
export function roundStatistics(row) {
  const values = row.replicates.filter(Number.isFinite);
  const n = values.length;
  const mean = n ? values.reduce((a, b) => a + b, 0) / n : null;
  const sd = n > 1 ? Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : null;
  return { n, sd, cv: sd !== null && mean !== 0 ? sd / Math.abs(mean) * 100 : null };
}
const format = (value, digits = 3) => Number.isFinite(value) ? value.toFixed(digits) : '—';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function initRoundBrowser({ onSelect, onRound, onFocus }) {
  const page = document.querySelector('[data-app-view="experiments"]');
  const heading = page.querySelector('.page-heading');
  heading.querySelector('.eyebrow').textContent = 'R0—R3 / EXPERIMENTAL RECORDS';
  heading.querySelector('p').textContent = '正式候选表：重复值及均值均为相对同批次 PSW（M3）的归一化活性。各轮分别展示，不做跨批次直接排名；SD 与 CV 为描述性统计。';
  const layout = page.querySelector('.data-layout');
  layout.innerHTML = '<section class="content-card round-data-panel"><div data-round-controls></div><p class="round-scope" data-round-scope></p><div class="round-overview" data-round-overview></div><div class="round-bars" data-round-bars aria-label="当前轮次前十候选相对 PSW 活性"></div><div class="data-table-wrap"><table><thead><tr><th>排序</th><th>PSW 上新增突变</th><th>完整构建</th><th>归一化重复 1 / 2 / 3</th><th>有效 n</th><th>均值 / PSW</th><th>SD</th><th>CV (%)</th><th>结构联动</th></tr></thead><tbody data-round-table></tbody></table></div><p class="round-source" data-round-source></p></section>';
  layout.style.gridTemplateColumns = '1fr';
  const panel = document.createElement('section');
  panel.className = 'round-design-panel';
  panel.innerHTML = '<h2>各轮实测候选</h2><div data-round-controls></div><label>选择变体<select data-round-choice aria-label="选择实测变体"></select></label><div class="round-sites" data-round-sites></div><p class="round-scope" data-round-scope></p>';
  const ranking = document.getElementById('candidate-table-body')?.closest('section');
  if (ranking) ranking.replaceWith(panel); else document.querySelector('.score-panel').prepend(panel);
  const hosts = [layout, panel];
  for (const host of hosts) {
    host.querySelector('[data-round-controls]').innerHTML = '<div class="round-tabs" aria-label="实验轮次">'+[0,1,2,3].map(n => `<button type="button" data-round="${n}">R${n}</button>`).join('')+'</div>';
    host.addEventListener('click', event => {
      const tab = event.target.closest('[data-round]');
      if (tab) { activeRound = Number(tab.dataset.round); const first = recordsForRound()[0]; selectedId = first?.id; render(); if (first) { onRound?.(activeRound); onSelect(asExperiment(first), false); } }
      const site = event.target.closest('[data-round-site]');
      if (site) onFocus?.(Number(site.dataset.roundSite));
      const record = event.target.closest('[data-round-record]');
      if (record) { choose(record.dataset.roundRecord, true); }
    });
  }
  const filter = document.createElement('label');
  filter.className = 'round-filter'; filter.innerHTML = '搜索突变<input placeholder="例如 F430M 或 L335A/N506A" aria-label="搜索正式实验记录" />';
  layout.querySelector('[data-round-controls]').append(filter);
  filter.querySelector('input').addEventListener('input', render);
  panel.querySelector('[data-round-choice]').addEventListener('change', event => choose(event.target.value, false));
  function choose(id, navigate) {
    const row = roundRecords.find(x => x.id === id);
    if (!row) return;
    activeRound = row.round; selectedId = row.id; render();
    panel.querySelector('[data-round-choice]').value = row.id;
    onSelect(asExperiment(row), navigate);
  }
  function render() {
    const all = recordsForRound();
    const rows = recordsForRound(activeRound, filter.querySelector('input').value);
    const scope = activeRound === 3 ? 'R3：五突变组合的回顾性挑战。仅展示实测结果，不纳入 R0—R2 前向 benchmark、训练或模型选择。' : `R${activeRound}：正式实验候选。PSW = D281P/G420W/N514S；相对基线 1.0。`;
    for (const host of hosts) {
      host.querySelector('[data-round-scope]').textContent = scope;
      host.querySelectorAll('[data-round]').forEach(b => { b.classList.toggle('is-active', Number(b.dataset.round) === activeRound); b.setAttribute('aria-pressed', String(Number(b.dataset.round) === activeRound)); });
    }
    panel.querySelector('[data-round-choice]').innerHTML = all.map(x => `<option value="${x.id}">${escape(x.mutation)} · ${format(x.average)}× · 表行 ${x.id.split(':')[1]}</option>`).join('');
    const chosen = all.find(x => x.id === selectedId) ?? all[0];
    if (chosen) {
      selectedId = chosen.id;
      panel.querySelector('[data-round-choice]').value = chosen.id;
      panel.querySelector('[data-round-sites]').innerHTML = '<small>新增位点映射：</small>' + chosen.mutation.split('/').map(token => `<button type="button" data-round-site="${token.match(/\d+/)?.[0]}">${escape(token)}</button>`).join('');
    }
    layout.querySelector('[data-round-overview]').textContent = `${rows.length} / ${all.length} 条候选 · ${all.filter(x=>x.average>1).length} 条均值高于 PSW · ${all.filter(x=>x.replicates.includes(null)).length} 条含缺失重复`;
    const max = Math.max(1, ...rows.map(x => x.average ?? 0));
    layout.querySelector('[data-round-bars]').innerHTML = rows.slice(0,10).map(x => `<button type="button" data-round-record="${x.id}"><span>${escape(x.mutation)}</span><i style="--bar-width:${(x.average??0)/max*100}%"><b></b><em style="left:${100/max}%"></em></i><strong>${format(x.average)}×</strong></button>`).join('')+'<small>前十候选 · 竖线为 PSW 1.0 基线 · 点击联动结构位点</small>';
    layout.querySelector('[data-round-table]').innerHTML = rows.map(x => { const s=roundStatistics(x); return `<tr><td>${all.indexOf(x)+1}</td><td>${escape(x.mutation)}</td><td>${escape(x.fullMutation)}</td><td>${x.replicates.map(v=>format(v,4)).join(' / ')}</td><td>${s.n}</td><td>${format(x.average,4)}×</td><td>${format(s.sd,4)}</td><td>${format(s.cv,2)}</td><td><button type="button" class="candidate-button" data-round-record="${x.id}">定位位点 ↗</button></td></tr>`; }).join('') || '<tr><td colspan="9">无匹配记录</td></tr>';
    layout.querySelector('[data-round-source]').textContent = `来源：data/processed/round_${activeRound}.xlsx · Sheet1。空值保留为 —；有效重复少于 2 时不计算 SD/CV。结构按完整构建匹配已有对接模型；没有专属模型时仅作参考位点映射。`;
  }
  render();
  return { selectMutation(fullMutation,navigate = true) {
    const normalized = normalizeMutations(fullMutation);
    const row = roundRecords.find(record=>normalizeMutations(record.fullMutation)===normalized);
    if (!row) return false;
    choose(row.id,navigate); return true;
  } };
}
