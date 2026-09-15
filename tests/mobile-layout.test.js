import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read = file => fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
test('mobile menu exposes all original routes with accessible expand and escape behavior',()=>{
  assert.match(read('index.html'),/id="mobile-menu-toggle"[^>]+aria-controls="primary-navigation"[^>]+aria-expanded="false"/);
  const js=read('src/mobile-layout.js');
  assert.match(js,/event.key === 'Escape'/);
  assert.match(js,/narrow.addEventListener\('change', update\)/);
  assert.match(js,/toggle.setAttribute\('aria-expanded', String\(open\)\)/);
});
test('mobile views use one bounded scroll container and readable touch controls',()=>{
  const css=read('mobile.css');
  assert.match(css,/html, body \{ height: 100%; overflow: hidden/);
  assert.match(css,/height: calc\(100dvh - 64px\)/);
  assert.match(css,/input, select, textarea \{ font-size: 16px/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/team-constellation \{ display: grid; grid-template-columns: repeat\(2/);
});
test('mobile research directories collapse before anchor offsets are calculated',()=>{
  const js=read('src/mobile-layout.js');
  assert.match(js,/document.createElement\('details'\)/);
  assert.match(js,/details.open = false/);
  assert.match(js,/summary.focus\(\{preventScroll:true\}\)/);
  assert.match(js,/\}, true\)/);
  assert.match(js,/工作台区域快捷跳转/);
});
test('portrait workbench suggests landscape without forcing orientation and can be dismissed',()=>{
  const js=read('src/mobile-layout.js');
  assert.match(js,/关闭横屏提示/);
  assert.match(js,/orientationHint.hidden = true/);
  assert.match(js,/也可以继续竖屏使用/);
  assert.doesNotMatch(js,/orientation\.lock|requestFullscreen/);
  assert.match(read('mobile.css'),/orientation: portrait/);
});
test('mobile homepage separates the car caption and catalytic stages',()=>{
  const css=read('mobile.css');
  assert.match(css,/\.car-engine-stage \.story-structure-frame \{ display: none; \}/);
  assert.match(css,/\.car-engine-stage figcaption[^}]+width: 90%/);
  assert.match(css,/\.is-journey \.catalytic-link \{ top: 205px; \}/);
  assert.match(css,/\.reaction-route\.is-journey \.catalytic-grid \{ height: 380px; flex-basis: 380px; \}/);
});
