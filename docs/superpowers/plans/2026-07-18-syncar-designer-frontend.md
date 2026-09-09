# SynCAR Designer 静态前端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建可离线打开、读取预计算数据的 MAB2962 三栏突变设计演示前端。

**Architecture:** 用 ES modules 将候选数据、突变格式化/查找逻辑和 DOM 渲染分开。`index.html` 提供语义化工作台骨架，`styles.css` 提供可响应的视觉系统，`app.js` 将候选选择同步到结构、评分、解释和表格。

**Tech Stack:** 原生 HTML、CSS、JavaScript、Node 内置测试运行器。

---

### Task 1: 预计算数据与纯函数

**Files:**
- Create: `src/data.js`
- Create: `src/model.js`
- Create: `tests/model.test.js`
- Create: `package.json`

- [ ] **Step 1: 写失败测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { findCandidate, mutationLabel } from '../src/model.js';

test('findCandidate returns the selected precomputed candidate', () => {
  assert.equal(findCandidate('V396T').score, 86.4);
});

test('mutationLabel joins parent and extension with slashes', () => {
  assert.equal(mutationLabel(['D281P', 'G420W', 'N514S'], 'V396T'), 'D281P/G420W/N514S/V396T');
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/model.test.js`
Expected: FAIL because `src/model.js` does not exist.

- [ ] **Step 3: 实现最小数据与函数**

```js
export const candidates = [{ extension: 'V396T', score: 86.4 }];
export const findCandidate = (extension) => candidates.find((item) => item.extension === extension);
export const mutationLabel = (parent, extension) => [...parent, extension].join('/');
```

- [ ] **Step 4: 再运行测试**

Run: `node --test tests/model.test.js`
Expected: PASS with 2 passing tests.

### Task 2: 工作台静态骨架与设计令牌

**Files:**
- Create: `index.html`
- Create: `styles.css`

- [ ] **Step 1: 创建可访问的三栏骨架**

Use `header`, `main`, `aside`, `section`, labelled controls, `button` elements, and a live region for selection feedback.

- [ ] **Step 2: 创建样式令牌和响应式三栏布局**

Define CSS variables for the blue-violet system, cards, focus ring, and breakpoints at 1280px and 900px. Use no external fonts or network assets.

### Task 3: 数据绑定与候选交互

**Files:**
- Create: `src/app.js`
- Modify: `index.html`

- [ ] **Step 1: 写失败的 DOM 验证脚本**

```js
import assert from 'node:assert/strict';
import { renderCandidateText } from '../src/app.js';
assert.match(renderCandidateText('V396T'), /86\.4/);
```

- [ ] **Step 2: 运行验证并确认失败**

Run: `node tests/app-render.test.js`
Expected: FAIL because `renderCandidateText` is missing.

- [ ] **Step 3: 实现候选选择和渲染**

Export `renderCandidateText`; on selection update mutation field, score, bars, explanation, structure label and candidate row state. Candidate rows and chips must react to click and Enter/Space.

- [ ] **Step 4: 验证脚本与模块测试**

Run: `node --test tests/model.test.js && node tests/app-render.test.js`
Expected: PASS.

### Task 4: 浏览器验证

**Files:**
- Modify: `index.html`, `styles.css`, `src/app.js` as required

- [ ] **Step 1: 启动本地静态服务器并打开页面**

Run: `python3 -m http.server 4173`
Expected: browser displays the workbench without console errors.

- [ ] **Step 2: 手工检查**

Select `C412I` and confirm score, explanation, highlighted label and active table row change together. At 900px width confirm the layout becomes one column and no horizontal page overflow occurs.

- [ ] **Step 3: 运行最终验证**

Run: `node --test tests/model.test.js && node tests/app-render.test.js`
Expected: all tests pass.
