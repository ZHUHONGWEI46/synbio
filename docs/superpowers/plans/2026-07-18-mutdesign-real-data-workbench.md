# MutDesign Real Data Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unsupported prediction content with a fully interactive frontend driven by the real MAB2962 sequence, AlphaFold3 outputs, and 28 Round 0 experiments.

**Architecture:** Keep the current dependency-light HTML/CSS/ES modules app. Isolate sequence mutation logic and experiment querying into pure modules, keep immutable source data in a dedicated module, and let `app.js` orchestrate DOM, Mol*, Canvas visualizations, downloads, and SPA view switching.

**Tech Stack:** HTML, CSS, browser ES modules, Node test runner, Mol* 5.10.1, Canvas 2D.

---

### Task 1: Sequence and mutation domain

**Files:**
- Create: `src/sequence.js`
- Create: `tests/sequence.test.js`

- [ ] Write failing tests for FASTA parsing, canonical mutation ordering, residue validation, duplicate rejection, mutant sequence generation, and 19-member saturation sets.
- [ ] Run `node --test tests/sequence.test.js` and confirm failures are caused by missing exports.
- [ ] Implement `parseFasta`, `parseMutations`, `normalizeMutations`, `validateMutations`, `applyMutations`, `buildParentSequence`, and `saturationMutations` with one-based residue numbering.
- [ ] Run the focused tests and then `node --test`.

### Task 2: Real experiment data domain

**Files:**
- Create: `src/experiment-data.js`
- Create: `src/experiments.js`
- Create: `tests/experiments.test.js`
- Modify: `src/data.js`

- [ ] Write failing tests proving there are 28 measured candidates, every mutation matches the WT residue, Q191R ranks first at `1.11802325581395`, C412I carries three replicate values, and search/filter operations are deterministic.
- [ ] Run the focused tests and confirm the missing data/query APIs fail.
- [ ] Encode the inspected workbook rows with source labels and implement `sortedExperiments`, `findExperiment`, `filterExperiments`, `experimentStatus`, and summary helpers.
- [ ] Replace fake scored candidates in `src/data.js` with real site metadata and parent constants.
- [ ] Run all tests.

### Task 3: Honest multi-view markup

**Files:**
- Modify: `index.html`
- Modify: `tests/markup.test.js`

- [ ] Add failing markup assertions for four navigation views, WT/M3 parent selection, structure/sequence/PAE tabs, experiment controls, batch design controls, and the exact “模型尚未接入” copy.
- [ ] Add assertions that fake score/probability copy is absent.
- [ ] Run markup tests and confirm RED.
- [ ] Rebuild semantic markup while preserving the supplied MutDesign brand and existing Mol* host IDs.
- [ ] Run markup tests and all tests.

### Task 4: App interactions and data visualizations

**Files:**
- Modify: `src/app.js`
- Create: `src/charts.js`
- Modify: `tests/app-render.test.js`

- [ ] Add failing tests for parent-aware candidate creation, experiment selection, AI unavailable response, and PAE color mapping helpers.
- [ ] Implement SPA navigation, FASTA loading, sequence rendering, one-way sequence-to-Mol* focus, honest experiment rendering, candidate search/filter, Canvas replicate/relative charts, and lazy PAE heatmap rendering.
- [ ] Implement CSV/FASTA downloads and session-only candidate lists.
- [ ] Configure Mol* native reset, screenshot, fullscreen, selection, and settings controls.
- [ ] Run focused tests and the complete suite.

### Task 5: Batch saturation workflow

**Files:**
- Modify: `src/app.js`
- Modify: `index.html`
- Modify: `styles.css`

- [ ] Add browser-independent tests showing WT C1066 creates 19 candidates and M3 extends labels to four mutations.
- [ ] Implement parent/site validation, 19-row generation, candidate preview, select-all state, and CSV/multi-FASTA export.
- [ ] Add clear status messages for invalid positions and downloads.
- [ ] Run all tests.

### Task 6: Compact visual system and verification

**Files:**
- Modify: `styles.css`
- Modify: `design-qa.md`
- Create: `audits/real-data-workbench/*`

- [ ] Extend the existing 74px MutDesign system with compact navigation, panels, tables, tabs, sequence cells, charts, heatmap, empty states, and mobile breakpoints.
- [ ] Run `node --test` and confirm zero failures.
- [ ] Open `http://127.0.0.1:4173/` in the in-app browser at 1280×720 and test navigation, real candidate selection, sequence focus, batch generation, PAE load, exports, scroll containment, and console errors.
- [ ] Capture implementation screenshots, compare against the supplied MutDesign source at the same viewport, fix P0/P1/P2 drift, and write `design-qa.md` with `final result: passed`.

