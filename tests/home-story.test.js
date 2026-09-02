import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('builds a nine-chapter scientific homepage from supplied assets', () => {
  const html = read('index.html');
  assert.equal((html.match(/data-home-chapter="\d{2}"/g) ?? []).length, 9);
  assert.match(html, /assets\/home\/hero\/sequence-frame-wide\.png/);
  assert.match(html, /assets\/home\/build\/deep-well-plate\.png/);
  assert.match(html, /assets\/home\/dbtl\/dbtl-cycle-frame\.png/);
  assert.match(html, /assets\/home\/application\/product-output\.png/);
});

test('turns the supplied member cutouts into an independent, fully fitted team view', () => {
  const html = read('index.html');
  const css = read('styles.css');
  const motion = read('src/team-motion.js');

  assert.match(html, /id="team"[^>]+data-app-view="team"[^>]+hidden/);
  assert.match(html, /id="home-team"[^>]+class="team-chapter"/);
  assert.doesNotMatch(html, /id="home-team"[^>]+data-home-chapter/);
  assert.equal((html.match(/assets\/team\/member-0[1-5]-[^"\s]+\.png/g) ?? []).length, 5);
  assert.match(html, /assets\/team\/prop-protein-structure\.png/);
  assert.match(html, /assets\/team\/prop-data-dashboard\.png/);
  assert.match(html, /assets\/team\/prop-lab-equipment\.png/);
  for (const name of ['郑天恩', '蔡一南', '郑研老师', '陈静雯', '朱宏伟']) assert.match(html, new RegExp(name));
  assert.doesNotMatch(html, /数据与计算|结构与设计|项目统筹|实验与记录|湿实验验证/);
  assert.match(html, /id="home-application"[^>]+data-home-chapter="09"/);
  assert.match(css, /\.team-chapter\s*\{/);
  assert.match(css, /\.team-page\s*\{[^}]*height:\s*calc\(100dvh - 74px\)/);
  assert.match(css, /\.team-constellation\s*\{/);
  assert.match(css, /\.team-member-03\s*\{/);
  assert.match(motion, /\.team-member/);
  assert.match(motion, /gsap\.timeline/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /repeat:\s*-1/);
});

test('uses ScrollTrigger choreography with reduced-motion and mobile fallbacks', () => {
  const motion = read('src/home-motion.js');
  const css = read('styles.css');
  assert.match(motion, /ScrollTrigger/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /trigger: '#home-hero'/);
  assert.match(motion, /trigger: '#home-dbtl'/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.hero-layout\s*\{[^}]*grid-template-columns:\s*1fr/);
});

test('blends chapter surfaces and settles only near desktop chapter boundaries', () => {
  const motion = read('src/home-motion.js');
  const css = read('styles.css');
  assert.match(css, /scroll-snap-type:\s*none/);
  assert.match(css, /background:\s*linear-gradient\(180deg, transparent, var\(--next-surface/);
  assert.match(motion, /settleAtChapterBoundary/);
  assert.match(motion, /const threshold = Math\.min\(scroller\.clientHeight \* 0\.2, 190\)/);
  assert.match(motion, /activeStickyScene/);
  assert.match(motion, /approachingStickyScene/);
  assert.match(motion, /onEnter:\s*cancelSettle/);
  assert.match(motion, /onEnterBack:\s*cancelSettle/);
  assert.match(motion, /chapterOffsets\.filter\(\(value\) => value > 4 \|\| scrollDirection < 0\)/);
  assert.match(motion, /matchMedia\('\(min-width: 761px\) and \(min-height: 700px\)'\)/);
  assert.match(motion, /if \(desktopNarrative\.matches\)/);
});

test('grounds the AI-SynBio story in repository model code without publishing unverified scores', () => {
  const html = read('index.html');
  assert.match(html, /AI–SYNBIO CHALLENGE 2026/);
  assert.match(html, /AI-GUIDED PRIORITIZATION/);
  assert.match(html, /ESM-2 · 35M/);
  assert.match(html, /Concat-Delta/);
  assert.match(html, /真实模型运行时未接入 · 工作台提供明确标注的演示评分/);
});

test('fits the desktop wet-lab scene into the available viewport height', () => {
  const css = read('styles.css');
  assert.match(css, /@media\s*\(min-width:\s*761px\)[\s\S]*\.screening-chapter\s*\{[^}]*height:\s*calc\(100dvh - 74px\)/);
  assert.match(css, /\.screening-chapter\s*>\s*\.home-shell\s*\{[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\)/);
  assert.match(css, /\.screening-stage\s*\{[^}]*min-height:\s*0/);
  assert.match(css, /\.screening-stage\s*\{[^}]*height:\s*auto/);
});

test('lets native sticky positioning own the DBTL hold without a GSAP pin spacer', () => {
  const motion = read('src/home-motion.js');
  const css = read('styles.css');
  assert.doesNotMatch(motion, /pin:\s*true/);
  assert.match(motion, /trigger:\s*'#home-dbtl'[\s\S]{0,260}end:\s*'bottom bottom'/);
  assert.match(css, /\.dbtl-chapter\s*>\s*\.home-shell\s*\{[^}]*position:\s*sticky/);
  assert.match(css, /\.dbtl-chapter\s*\{[^}]*height:\s*calc\(\(100dvh - 74px\) \* 2\)/);
});

test('uses a compact translucent DBTL core instead of a large opaque white disc', () => {
  const css = read('styles.css');
  assert.match(css, /\.dbtl-center\s*\{[^}]*width:\s*clamp\(96px, 8vw, 108px\)/);
  assert.match(css, /\.dbtl-center\s*\{[^}]*backdrop-filter:\s*blur\(12px\)/);
  assert.doesNotMatch(css, /\.dbtl-center\s*\{[^}]*background:\s*rgb\(255 255 255 \/ \.94\)/);
});

test('keeps experimental baselines explicit and does not invent AI predictions', () => {
  const html = read('index.html');
  assert.match(html, /4\.8× WT · 中期报告/);
  assert.match(html, /1\.118× M3/);
  assert.match(html, /不能与 Round 0/);
  assert.doesNotMatch(html, /AI预测得分|模型置信度[^尚]/);
});

test('gives the manufacturing finale a readable two-line headline and labelled visual flow', () => {
  const html = read('index.html');
  const css = read('styles.css');

  assert.match(html, /<h2><span>让每一轮实验，<\/span><span>成为下一轮设计的起点。<\/span><\/h2>/);
  assert.match(html, /<figcaption><b>01<\/b>酶催化<\/figcaption>/);
  assert.match(html, /<figcaption><b>02<\/b>生物反应器<\/figcaption>/);
  assert.match(html, /<figcaption><b>03<\/b>产品输出<\/figcaption>/);
  assert.match(css, /\.application-copy h2 span\s*\{[^}]*display:\s*block/);
  assert.match(css, /\.application-stage img\s*\{[^}]*contrast\(1\.12\)/);
});
