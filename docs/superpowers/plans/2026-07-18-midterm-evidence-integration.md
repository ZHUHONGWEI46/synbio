# Midterm Evidence Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the verified M3 FASTA, wet-lab milestones/evidence images, and known pocket-site navigation into the existing MutDesign frontend.

**Architecture:** Keep the existing single-page app and visual system. Add a focused `midterm-evidence.js` data module, extend sequence utilities with an explicit parent-sequence verifier, render evidence and site controls from data, and keep historical experiment batches separate from Round 0.

**Tech Stack:** HTML, CSS, browser-native JavaScript modules, Mol*, Node test runner.

---

### Task 1: Encode and verify the new scientific source data

**Files:**
- Create: `src/midterm-evidence.js`
- Modify: `src/sequence.js`
- Test: `tests/midterm-evidence.test.js`
- Test: `tests/sequence.test.js`

- [ ] **Step 1: Write failing tests** for the eight pocket sites, four historical milestones, image paths, and exact WT→M3 differences at 281/420/514.
- [ ] **Step 2: Run `node --test tests/midterm-evidence.test.js tests/sequence.test.js`** and verify the new exports are missing.
- [ ] **Step 3: Implement `midterm-evidence.js` and `verifyParentSequence(wildType, m3)`** with explicit error messages for length and unexpected residue differences.
- [ ] **Step 4: Run the focused tests** and verify they pass.

### Task 2: Load the supplied M3 FASTA

**Files:**
- Modify: `src/app.js`
- Test: `tests/markup.test.js`

- [ ] **Step 1: Add a failing markup/source test** requiring the exact supplied M3 FASTA path and source-status copy.
- [ ] **Step 2: Run `node --test tests/markup.test.js`** and verify the path assertion fails.
- [ ] **Step 3: Fetch WT and M3 in parallel, validate M3, and use it in `applyParent`**; retain generated-M3 fallback with visible status.
- [ ] **Step 4: Run markup and sequence tests** and verify green results.

### Task 3: Add pocket-site structure navigation

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Test: `tests/markup.test.js`

- [ ] **Step 1: Add failing assertions** for eight `data-known-site` controls and the non-mutating location hint.
- [ ] **Step 2: Run markup tests** and verify the expected missing-control failure.
- [ ] **Step 3: Add the compact pocket-site panel and bind click handling** to Mol* focus, sequence highlighting, and status feedback without changing the selected experiment.
- [ ] **Step 4: Run focused tests** and verify green results.

### Task 4: Add historical wet-lab milestones and evidence gallery

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Test: `tests/markup.test.js`
- Test: `tests/midterm-evidence.test.js`

- [ ] **Step 1: Add failing assertions** for milestone cards, batch-separation warning, six evidence figures, and an evidence dialog.
- [ ] **Step 2: Run the focused tests** and verify they fail for missing markup.
- [ ] **Step 3: Render milestone/evidence cards from `midterm-evidence.js` and bind the native dialog** with image, caption, and close behavior.
- [ ] **Step 4: Run the full test suite** and verify all tests pass.

### Task 5: Browser and visual QA

**Files:**
- Modify: `design-qa.md`
- Create: `audits/midterm-evidence/*`

- [ ] **Step 1: Open the local prototype in the in-app browser** and verify M3 source status, pocket-site focus, evidence dialog, and independent panel scrolling.
- [ ] **Step 2: Capture design and overview evidence states** at 1280×720.
- [ ] **Step 3: Build a combined comparison board** with the previous approved screenshots and inspect visible differences.
- [ ] **Step 4: Fix P0/P1/P2 issues, rerun tests, and update `design-qa.md` to `final result: passed`.**

