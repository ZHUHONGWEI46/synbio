# Navigation Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add restrained GSAP motion to MutDesign’s primary navigation, page transitions, icon feedback, and a downward-opening workbench submenu.

**Architecture:** Keep application routing and data behavior in `src/app.js`, and isolate all animation state, timers, input-mode behavior, and GSAP timelines in a new `src/motion.js` controller. Restructure the workbench submenu into a fixed handle button plus an independently positioned dropdown panel, with synchronous reduced-motion fallbacks.

**Tech Stack:** HTML, CSS, ES modules, GSAP core, Node’s built-in test runner, Mol* viewer, in-app browser QA.

---

## File map

- Create `src/motion.js`: navigation animation controller and reduced-motion behavior.
- Create `tests/motion.test.js`: static contract tests for dependency, markup, CSS, and integration boundaries.
- Modify `index.html`: semantic workbench handle button, dropdown wrapper, and motion indicator hooks.
- Modify `styles.css`: fixed handle/dropdown layout, animation-ready states, responsive fallback, and reduced-motion rules.
- Modify `src/app.js`: initialize the motion controller and route navigation events through it without moving business logic.
- Modify `package.json` and `package-lock.json`: add the local `gsap` runtime dependency.
- Update `design-qa.md`: record final browser evidence after implementation.

Repository note: `/Users/zhuhongwei/Desktop/NJTech-SynCAR-2026` is not currently a Git repository. The commit steps below are retained for a future Git-backed copy but must be skipped in this directory unless the user initializes Git.

### Task 1: Lock the motion contract with failing tests

**Files:**
- Create: `tests/motion.test.js`
- Contract targets: `index.html`, `styles.css`, `src/app.js`, `src/motion.js`, `package.json`

- [ ] **Step 1: Write the failing structural tests**

Create `tests/motion.test.js` with:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('loads GSAP from a local dependency and isolates motion in its own module', () => {
  const pkg = JSON.parse(read('package.json'));
  const app = read('src/app.js');
  const motion = read('src/motion.js');

  assert.ok(pkg.dependencies.gsap);
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
  const motion = read('src/motion.js');

  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(motion, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(motion, /event\.key === 'Escape'/);
  assert.match(motion, /handle\.focus\(\)/);
});

test('keeps small-screen navigation visible without hover dependency', () => {
  const css = read('styles.css');
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.subnav-menu\s*\{[^}]*position:\s*static/);
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
node --test tests/motion.test.js
```

Expected: FAIL because `src/motion.js`, `gsap`, `#subnav-handle`, and `.subnav-menu` do not exist yet.

- [ ] **Step 3: Commit the failing contract when Git is available**

```bash
git add tests/motion.test.js
git commit -m "test: define navigation motion contract"
```

Expected in the current non-Git directory: skip this step.

### Task 2: Add GSAP and restructure the submenu

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `index.html:29-35`
- Modify: `styles.css:35-55, 282-285`
- Test: `tests/motion.test.js`

- [ ] **Step 1: Install GSAP locally**

Run:

```bash
npm install gsap --save
```

Expected: `package.json` contains `dependencies.gsap`, `package-lock.json` records the resolved version, and the package is available under `node_modules/gsap`.

- [ ] **Step 2: Replace the secondary navigation markup**

Replace the current `#workbench-subnav` contents in `index.html` with:

```html
<nav id="workbench-subnav" class="workbench-subnav is-visible" aria-label="设计工作台二级导航">
  <button id="subnav-handle" class="subnav-handle" type="button" aria-label="展开设计工作台导航" aria-controls="workbench-menu" aria-expanded="false">
    <img src="assets/navigation/07_design_workbench.png" alt="" />
  </button>
  <div id="workbench-menu" class="subnav-menu" aria-hidden="true">
    <span class="subnav-active-indicator" aria-hidden="true"></span>
    <button type="button" data-view-target="overview"><img src="assets/icons/01_project_overview.png" alt="" /><span>项目概览</span></button>
    <button class="is-active" type="button" data-view-target="design"><img src="assets/icons/02_protein_structure.png" alt="" /><span>结构与突变</span></button>
    <button type="button" data-view-target="experiments"><img src="assets/icons/09_experimental_data.png" alt="" /><span>实验数据</span></button>
    <button type="button" data-view-target="batch"><img src="assets/icons/08_saturation_mutation.png" alt="" /><span>批量设计</span></button>
  </div>
</nav>
```

Add a primary indicator as the first child of `.primary-nav`:

```html
<span class="primary-nav-indicator" aria-hidden="true"></span>
```

- [ ] **Step 3: Replace width expansion with dropdown positioning**

Replace the existing workbench submenu CSS block with:

```css
.primary-nav { position: relative; }
.primary-nav-indicator { position: absolute; z-index: 0; top: 5px; left: 0; width: 1px; height: 40px; border-radius: 8px; background: #f1f3f8; opacity: 0; pointer-events: none; transform-origin: left center; will-change: transform, opacity; }
.primary-nav button { position: relative; z-index: 1; }

.workbench-subnav { position: fixed; z-index: 35; top: 82px; left: 50vw; width: 46px; height: 46px; transform: translateX(-50%); }
.workbench-subnav:not(.is-visible) { display: none; }
.subnav-handle { display: grid; width: 46px; height: 46px; padding: 4px; place-items: center; border: 1px solid #dfe4ee; border-radius: 14px; background: rgb(250 251 254 / .96); box-shadow: 0 8px 20px rgb(43 54 89 / .11); backdrop-filter: blur(12px); }
.subnav-handle img { width: 30px; height: 30px; object-fit: contain; }
.subnav-menu { position: absolute; top: calc(100% + 8px); left: 50%; display: flex; width: max-content; align-items: center; gap: 3px; padding: 5px; border: 1px solid #dfe4ee; border-radius: 12px; background: rgb(248 249 253 / .98); box-shadow: 0 12px 28px rgb(43 54 89 / .14); opacity: 0; pointer-events: none; transform: translateX(-50%) translateY(-8px) scaleY(.92); transform-origin: top center; will-change: transform, opacity; backdrop-filter: blur(12px); }
.subnav-menu.is-open { pointer-events: auto; }
.subnav-menu button { position: relative; z-index: 1; display: inline-flex; min-width: max-content; align-items: center; gap: 6px; padding: 7px 10px; border: 0; border-radius: 8px; background: transparent; color: #758097; font-size: 11px; font-weight: 760; opacity: 0; }
.subnav-menu button img { width: 20px; height: 20px; object-fit: contain; opacity: .72; }
.subnav-menu button.is-active { color: var(--color-accent-dark); }
.subnav-active-indicator { position: absolute; z-index: 0; top: 5px; left: 5px; width: 1px; height: 34px; border-radius: 8px; background: #fff; box-shadow: 0 2px 8px rgb(43 54 89 / .08); opacity: 0; transform-origin: left center; will-change: transform, opacity; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
}
```

In the existing `@media (max-width: 760px)` block, replace the submenu rules with:

```css
.workbench-subnav { top: auto; right: 10px; bottom: 10px; left: 10px; width: auto; height: 48px; transform: none; }
.workbench-subnav .subnav-handle { display: none; }
.subnav-menu { position: static; display: flex; width: 100%; height: 48px; justify-content: center; padding: 3px; opacity: 1; pointer-events: auto; transform: none; }
.subnav-menu button { display: inline-flex; min-width: 0; padding: 6px 8px; opacity: 1; font-size: 10px; }
.subnav-menu button img { width: 18px; height: 18px; }
```

- [ ] **Step 4: Run the structural test**

Run:

```bash
node --test tests/motion.test.js
```

Expected: the dependency and markup assertions pass; module assertions still fail because `src/motion.js` is not created.

- [ ] **Step 5: Commit the dependency and structure when Git is available**

```bash
git add package.json package-lock.json index.html styles.css
git commit -m "feat: prepare downward workbench navigation"
```

Expected in the current non-Git directory: skip this step.

### Task 3: Implement the isolated GSAP motion controller

**Files:**
- Create: `src/motion.js`
- Test: `tests/motion.test.js`

- [ ] **Step 1: Create `src/motion.js`**

Use this public interface and state model:

```js
import { gsap } from '../node_modules/gsap/index.js';

const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointerQuery = matchMedia('(pointer: coarse)');

function placeIndicator(indicator, container, button, animate, duration = .24) {
  if (!indicator || !container || !button) return;
  const containerRect = container.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const x = buttonRect.left - containerRect.left + container.scrollLeft;
  const scaleX = Math.max(1, buttonRect.width);
  const vars = { x, scaleX, opacity: 1, transformOrigin: 'left center' };
  gsap.killTweensOf(indicator);
  if (animate && !reducedMotionQuery.matches) gsap.to(indicator, { ...vars, duration, ease: 'power3.out' });
  else gsap.set(indicator, vars);
}

function animateIcon(button) {
  const icon = button?.querySelector('img');
  if (!icon || reducedMotionQuery.matches) return;
  gsap.killTweensOf(icon);
  gsap.timeline()
    .to(icon, { y: -2, rotation: -5, scale: 1.08, duration: .13, ease: 'power2.out' })
    .to(icon, { y: 0, rotation: 0, scale: 1, duration: .17, ease: 'power2.out' });
}

export function initNavigationMotion() {
  const primaryNav = document.querySelector('.primary-nav');
  const primaryIndicator = document.querySelector('.primary-nav-indicator');
  const workbench = document.getElementById('workbench-subnav');
  const handle = document.getElementById('subnav-handle');
  const menu = document.getElementById('workbench-menu');
  const menuIndicator = document.querySelector('.subnav-active-indicator');
  let closeTimer;
  let menuOpen = false;
  let viewTimeline;

  function setMenuOpen(nextOpen, { focusHandle = false } = {}) {
    if (!handle || !menu || coarsePointerQuery.matches && window.innerWidth <= 760) return;
    clearTimeout(closeTimer);
    menuOpen = nextOpen;
    handle.setAttribute('aria-expanded', String(nextOpen));
    handle.setAttribute('aria-label', nextOpen ? '收起设计工作台导航' : '展开设计工作台导航');
    menu.setAttribute('aria-hidden', String(!nextOpen));
    menu.classList.toggle('is-open', nextOpen);
    gsap.killTweensOf([menu, ...menu.querySelectorAll('button')]);
    if (reducedMotionQuery.matches) {
      gsap.set(menu, { opacity: nextOpen ? 1 : 0, y: nextOpen ? 0 : -8, scaleY: nextOpen ? 1 : .92 });
      gsap.set(menu.querySelectorAll('button'), { opacity: nextOpen ? 1 : 0, y: 0 });
    } else if (nextOpen) {
      gsap.timeline()
        .to(handle, { y: 1, duration: .08, ease: 'power1.out' })
        .to(handle, { y: 0, duration: .14, ease: 'power2.out' })
        .to(menu, { opacity: 1, y: 0, scaleY: 1, duration: .28, ease: 'power3.out' }, 0)
        .to(menu.querySelectorAll('button'), { opacity: 1, y: 0, duration: .18, stagger: .035, ease: 'power2.out' }, .08);
    } else {
      gsap.timeline()
        .to(menu.querySelectorAll('button'), { opacity: 0, duration: .08, stagger: .012, ease: 'power1.in' })
        .to(menu, { opacity: 0, y: -6, scaleY: .94, duration: .16, ease: 'power2.in' }, .04);
    }
    if (focusHandle) handle.focus();
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!workbench?.matches(':hover') && !workbench?.contains(document.activeElement)) setMenuOpen(false);
    }, 120);
  }

  function selectPrimary(button) {
    placeIndicator(primaryIndicator, primaryNav, button, true, .26);
    animateIcon(button);
  }

  function selectSecondary(button) {
    placeIndicator(menuIndicator, menu, button, true, .22);
    animateIcon(button);
  }

  function syncIndicators() {
    placeIndicator(primaryIndicator, primaryNav, primaryNav?.querySelector('.is-active'), false);
    placeIndicator(menuIndicator, menu, menu?.querySelector('.is-active'), false);
  }

  function transitionViews(current, target, commit, afterCommit) {
    viewTimeline?.kill();
    if (!current || current === target || reducedMotionQuery.matches) {
      commit();
      afterCommit?.();
      return;
    }
    viewTimeline = gsap.timeline({
      onComplete: () => { viewTimeline = undefined; },
    });
    viewTimeline
      .to(current, { opacity: 0, y: -4, duration: .11, ease: 'power1.in' })
      .add(() => {
        gsap.set(current, { clearProps: 'opacity,transform' });
        commit();
        afterCommit?.();
        gsap.set(target, { opacity: 0, y: 8 });
      })
      .to(target, { opacity: 1, y: 0, duration: .23, ease: 'power2.out', clearProps: 'opacity,transform' });
  }

  handle?.addEventListener('click', () => setMenuOpen(!menuOpen));
  workbench?.addEventListener('mouseenter', () => { if (!coarsePointerQuery.matches) setMenuOpen(true); });
  workbench?.addEventListener('mouseleave', scheduleClose);
  workbench?.addEventListener('focusin', () => setMenuOpen(true));
  workbench?.addEventListener('focusout', scheduleClose);
  workbench?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenuOpen(false, { focusHandle: true });
    }
  });
  window.addEventListener('resize', syncIndicators);
  requestAnimationFrame(syncIndicators);

  return {
    closeMenu: () => setMenuOpen(false),
    openMenu: () => setMenuOpen(true),
    selectPrimary,
    selectSecondary,
    syncIndicators,
    transitionViews,
    destroy() {
      clearTimeout(closeTimer);
      viewTimeline?.kill();
      window.removeEventListener('resize', syncIndicators);
    },
  };
}
```

- [ ] **Step 2: Run the motion contract test**

Run:

```bash
node --test tests/motion.test.js
```

Expected: PASS.

- [ ] **Step 3: Commit the controller when Git is available**

```bash
git add src/motion.js tests/motion.test.js
git commit -m "feat: add GSAP navigation motion controller"
```

Expected in the current non-Git directory: skip this step.

### Task 4: Integrate animation without mixing in business logic

**Files:**
- Modify: `src/app.js:1-20, 338-390, 670-690`
- Test: `tests/motion.test.js`, `tests/markup.test.js`

- [ ] **Step 1: Import and store the controller**

At the top of `src/app.js`, add:

```js
import { initNavigationMotion } from './motion.js';
```

Near the other module state, add:

```js
let navigationMotion;
```

- [ ] **Step 2: Split view state changes from the animated transition**

Replace `switchAppView` with:

```js
function commitAppView(view) {
  document.querySelectorAll('[data-app-view]').forEach((section) => { section.hidden = section.dataset.appView !== view; });
  document.querySelectorAll('.subnav-menu [data-view-target]').forEach((button) => button.classList.toggle('is-active', button.dataset.viewTarget === view));
  location.hash = view;
}

function afterAppViewChange(view) {
  navigationMotion?.syncIndicators();
  if (view === 'design') requestAnimationFrame(() => structureViewer?.plugin?.canvas3d?.requestResize?.());
  if (view === 'experiments') drawExperimentChart(filterExperiments());
}

function switchAppView(view) {
  const current = document.querySelector('[data-app-view]:not([hidden])');
  const target = document.querySelector(`[data-app-view="${view}"]`);
  if (!target || current === target) {
    commitAppView(view);
    afterAppViewChange(view);
    return;
  }
  navigationMotion?.transitionViews(current, target, () => commitAppView(view), () => afterAppViewChange(view));
  if (!navigationMotion) {
    commitAppView(view);
    afterAppViewChange(view);
  }
}
```

- [ ] **Step 3: Add selection feedback to existing delegated navigation**

Inside `bindNavigation`, add the calls before existing routing actions:

```js
if (projectTopic) {
  event.preventDefault();
  navigationMotion?.selectPrimary(projectTopic);
  navigationMotion?.closeMenu();
  openProjectTopic(projectTopic.dataset.projectTopic);
  return;
}

if (workbenchTrigger) {
  event.preventDefault();
  navigationMotion?.selectPrimary(workbenchTrigger);
  document.querySelectorAll('[data-project-topic]').forEach((button) => button.classList.remove('is-active'));
  setWorkbenchNavigation(true);
  switchAppView('design');
  return;
}

if (target) {
  event.preventDefault();
  navigationMotion?.selectSecondary(target);
  document.querySelectorAll('[data-project-topic]').forEach((button) => button.classList.remove('is-active'));
  setWorkbenchNavigation(true);
  switchAppView(target.dataset.viewTarget);
  return;
}
```

Do not add a click listener directly to each navigation item; preserve the existing delegated listener so icon clicks continue to resolve through `closest()`.

- [ ] **Step 4: Initialize motion before binding navigation**

At the beginning of `initialiseWorkbench`, use:

```js
navigationMotion = initNavigationMotion();
bindNavigation();
```

- [ ] **Step 5: Update the existing markup test for the new downward menu**

In `tests/markup.test.js`, replace the old “hover-revealed width” assertions with:

```js
assert.match(html, /id="subnav-handle"[^>]+aria-controls="workbench-menu"/);
assert.match(html, /id="workbench-menu"[^>]+class="subnav-menu"/);
assert.match(css, /\.subnav-menu\s*\{[^}]*top:\s*calc\(100% \+ 8px\)/);
assert.doesNotMatch(css, /\.workbench-subnav:hover[^}]*width:\s*min\(510px/);
assert.match(app, /navigationMotion\?\.selectSecondary\(target\)/);
```

- [ ] **Step 6: Run all automated tests**

Run:

```bash
npm test
```

Expected: all existing 48 tests plus the four new motion tests pass.

- [ ] **Step 7: Commit the integration when Git is available**

```bash
git add src/app.js tests/markup.test.js
git commit -m "feat: animate MutDesign navigation transitions"
```

Expected in the current non-Git directory: skip this step.

### Task 5: Browser QA and final motion tuning

**Files:**
- Verify and tune only when a recorded browser finding requires it: `src/motion.js`, `styles.css`
- Modify: `design-qa.md`
- Create: `artifacts/navigation-motion-desktop.png`
- Create: `artifacts/navigation-motion-reduced.png`

- [ ] **Step 1: Start or confirm the local server**

Run:

```bash
curl -I http://localhost:64772/
```

Expected: HTTP 200. If the server is not running, start it with:

```bash
python3 -m http.server 64772 --bind 127.0.0.1
```

Expected: the process reports `Serving HTTP on 127.0.0.1 port 64772` and remains running during QA.

- [ ] **Step 2: Verify desktop interactions at 1536 × 900**

In the in-app browser:

1. Hover the central workbench icon and verify the panel drops down without changing header width.
2. Move the pointer from the handle into the menu and verify it stays open.
3. Move away and verify the 120ms delayed close does not flicker.
4. Click all six primary topics and verify the active pill moves in the correct direction.
5. Click all four secondary destinations and verify page transitions complete with only one page visible.
6. Return to the structure page and verify Mol* still fills its container.
7. Check browser console errors.

Save a representative open-menu screenshot to `artifacts/navigation-motion-desktop.png`.

- [ ] **Step 3: Verify keyboard and reduced-motion behavior**

1. Tab to the central handle and press Enter to open.
2. Tab through all four submenu buttons.
3. Press Escape and verify the menu closes and focus returns to the handle.
4. Emulate `prefers-reduced-motion: reduce`; verify navigation remains functional without staged motion.
5. Save evidence to `artifacts/navigation-motion-reduced.png`.

- [ ] **Step 4: Verify the small-screen fallback**

At a viewport below 760px, verify the four secondary items remain visible in the bottom bar, the handle is hidden, and no hover-only action is required.

- [ ] **Step 5: Run the final test suite**

Run:

```bash
npm test
```

Expected: every test passes with zero failures.

- [ ] **Step 6: Update `design-qa.md`**

Record:

- source design: `docs/superpowers/specs/2026-08-28-navigation-motion-design.md` and the selected A visual companion screen;
- implementation screenshots and viewport;
- primary, secondary, keyboard, responsive, and reduced-motion states tested;
- console result;
- any P0/P1/P2 findings and the post-fix evidence;
- `final result: passed` only after no actionable P0/P1/P2 issue remains.

- [ ] **Step 7: Commit QA evidence when Git is available**

```bash
git add design-qa.md artifacts/navigation-motion-desktop.png artifacts/navigation-motion-reduced.png
git commit -m "test: verify navigation motion states"
```

Expected in the current non-Git directory: skip this step.
