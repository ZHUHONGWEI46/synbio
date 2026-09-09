import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('turns the homepage into a seven-part public science story', () => {
  const html = read('index.html');
  assert.equal((html.match(/data-home-chapter="\d{2}"/g) ?? []).length, 7);
  assert.match(html, /让羧酸还原酶/);
  assert.match(html, /L-谷氨酸/);
  assert.match(html, /1,4-丁二胺/);
  assert.match(html, /如何让 CAR 更高效地/);
  assert.match(html, /预测不是结论/);
  assert.match(html, /网页中的 AI 评分仅用于流程演示/);
});

test('keeps detailed project surfaces out of the homepage', () => {
  const html = read('index.html');
  const overview = html.match(/data-app-view="overview"[\s\S]*?<section id="team"/)?.[0] ?? '';
  assert.doesNotMatch(overview, /milestone-grid|evidence-gallery|home-bars|site-orbit|dbtl-stage/);
  assert.match(html, /data-app-view="experiments"[\s\S]*id="wet-lab-evidence"/);
  assert.match(html, /data-view-target="design">进入结构与突变页面/);
  assert.match(html, /data-view-target="experiments">查看实验数据中心/);
});

test('uses the latest supplied complex on the homepage with an honest qualifier', () => {
  const html = read('index.html');
  assert.match(html, /assets\/home\/hero\/latest-complex-structure\.png/);
  assert.match(html, /ATP · NADPH · Mg²⁺ · GABA/);
  assert.match(html, /对接展示 · 未能量最小化/);
});

test('keeps the team as an independent animated view', () => {
  const html = read('index.html');
  const css = read('styles.css');
  const motion = read('src/team-motion.js');
  assert.match(html, /id="team"[^>]+data-app-view="team"[^>]+hidden/);
  assert.equal((html.match(/assets\/team\/member-0[1-5]-[^"\s]+\.png/g) ?? []).length, 5);
  for (const name of ['郑天恩', '蔡一南', '郑研老师', '陈静雯', '朱宏伟']) assert.match(html, new RegExp(name));
  assert.match(css, /\.team-constellation\s*\{/);
  assert.match(motion, /gsap\.timeline/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
});

test('uses restrained GSAP motion with reduced-motion and mobile fallbacks', () => {
  const motion = read('src/home-motion.js');
  const css = read('styles.css');
  assert.match(motion, /ScrollTrigger/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /trigger: '#home-hero'/);
  assert.match(motion, /trigger: '\.learning-loop'/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.reaction-route\s*\{[^}]*grid-template-columns:\s*1fr/);
});

test('keeps experimental baselines explicit and does not invent AI predictions', () => {
  const html = read('index.html');
  assert.match(html, /1\.0 为三突变亲本基线/);
  assert.match(html, /不能与 Round 0/);
  assert.doesNotMatch(html, /AI预测得分|模型置信度[^尚]/);
});
