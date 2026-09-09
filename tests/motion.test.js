import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const fileUrl = (file) => new URL(`../${file}`, import.meta.url);
const read = (file) => fs.readFileSync(fileUrl(file), 'utf8');
const readOptional = (file) => (fs.existsSync(fileUrl(file)) ? read(file) : '');

test('loads GSAP locally and isolates navigation motion in its own module', () => {
  const pkg = JSON.parse(read('package.json'));
  const app = read('src/app.js');
  const motion = readOptional('src/motion.js');

  assert.ok(pkg.dependencies.gsap, 'GSAP should be a local dependency');
  assert.match(app, /from '.\/motion\.js'/);
  assert.match(motion, /from '\.\.\/node_modules\/gsap\/index\.js'/);
  assert.match(motion, /export function initNavigationMotion/);
});

test('uses a semantic fixed handle and a separate downward submenu', () => {
  const html = read('index.html');
  const css = read('styles.css');

  assert.match(html, /<button[^>]+id="subnav-handle"[^>]+aria-expanded="false"/);
  assert.match(html, /id="workbench-menu"[^>]+class="subnav-menu"/);
  assert.match(css, /\.subnav-menu\s*\{[^}]*top:\s*calc\(100% \+ 8px\)/);
  assert.doesNotMatch(css, /\.workbench-subnav:hover[^}]*width:\s*min\(510px/);
});

test('provides reduced-motion and keyboard-safe menu behavior', () => {
  const css = read('styles.css');
  const motion = readOptional('src/motion.js');

  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(motion, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(motion, /event\.key === 'Escape'/);
  assert.match(motion, /handle\.focus\(\)/);
});

test('does not double-toggle when the handle receives pointer focus before click', () => {
  const motion = readOptional('src/motion.js');
  assert.match(motion, /focusin[^\n]+event\.target !== handle/);
  assert.match(motion, /handle\?\.addEventListener\('click'[^\n]+coarsePointerQuery\.matches[^\n]+setMenuOpen\(true\)/);
});

test('closes after pointer exit even when the clicked submenu item keeps focus', () => {
  const motion = readOptional('src/motion.js');
  assert.match(motion, /if \(!workbench\?\.matches\(':hover'\)\) setMenuOpen\(false\)/);
  assert.doesNotMatch(motion, /scheduleClose[\s\S]*?contains\(document\.activeElement\)/);
});

test('keeps the handle-to-menu hover path continuous without replaying the open animation', () => {
  const css = read('styles.css');
  const motion = readOptional('src/motion.js');
  assert.match(css, /\.subnav-menu::before\s*\{[^}]*bottom:\s*100%[^}]*height:\s*9px/);
  assert.match(motion, /if \(nextOpen === menuOpen\) return/);
  assert.doesNotMatch(motion, /\.to\(handle, \{ y:/);
});

test('keeps small-screen navigation visible without hover dependency', () => {
  const css = read('styles.css');
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.subnav-menu\s*\{[^}]*position:\s*static/);
});

test('reveals the submenu by movement without refresh-like opacity fading', () => {
  const css = read('styles.css');
  const motion = readOptional('src/motion.js');

  assert.match(css, /\.subnav-menu\s*\{[^}]*visibility:\s*hidden/);
  assert.match(css, /\.subnav-menu\.is-open\s*\{[^}]*visibility:\s*visible/);
  assert.doesNotMatch(motion, /\.to\(menu,\s*\{[^}]*opacity/);
  assert.doesNotMatch(motion, /\.to\(menuButtons,\s*\{[^}]*opacity/);
});

test('uses slower smooth pill movement and fully rounded indicators', () => {
  const css = read('styles.css');
  const motion = readOptional('src/motion.js');

  assert.match(css, /\.primary-nav-indicator\s*\{[^}]*border-radius:\s*999px/);
  assert.match(css, /\.primary-nav\s*\{[^}]*height:\s*48px/);
  assert.match(css, /\.primary-nav button\s*\{[^}]*height:\s*38px[^}]*min-height:\s*38px/);
  assert.match(css, /\.subnav-active-indicator\s*\{[^}]*border-radius:\s*999px/);
  assert.match(motion, /placeIndicator\(primaryIndicator, primaryNav, button, true, 0\.46\)/);
  assert.match(motion, /placeIndicator\(menuIndicator, menu, button, true, 0\.42\)/);
  assert.match(motion, /duration:\s*0\.22[\s\S]*?duration:\s*0\.28/);
  assert.match(motion, /width:\s*buttonRect\.width/);
  assert.doesNotMatch(motion, /scaleX:\s*Math\.max/);
});
