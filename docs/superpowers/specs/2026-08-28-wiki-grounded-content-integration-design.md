# Wiki-Grounded Content Integration Design

## Goal

Use the repository Wiki as the source of truth to strengthen the existing MutDesign frontend without turning it into the full six-page platform described in `要求.docx`. Preserve the current compact four-view application and add only claims that are already supported by repository files.

## Source Priority

1. `submission/njtech-syncar/wiki/Integrated-Validation.md`
2. `submission/njtech-syncar/wiki/Wet-Lab-Experiments.md`
3. `submission/njtech-syncar/wiki/Engineering-Cycle.md`
4. `submission/njtech-syncar/wiki/Verifiability.md`
5. `submission/njtech-syncar/wiki/AI-Ethics-Safety.md`
6. `submission/njtech-syncar/attributions.md`
7. `submission/njtech-syncar/data/README.md` and `results/README.md`

The two repository copies currently have identical contents. The existing no-space path `NJTech-SynCAR-2026-main/` remains the runtime asset path so existing images and FASTA files do not break.

## What Will Be Added

### 1. Wiki project dossier inside Project Overview

Add one compact tabbed dossier below the existing metrics and wet-lab evidence. It contains six grounded sections:

- Integrated Validation: Design → Build → Test → Learn and the two documented experimental loops.
- Engineering Cycle: non-model milestones v0.1 through v0.4.
- Wet Lab: screening objective, verified workflow, strains, plasmids, and exact reaction conditions.
- Verifiability: four repository datasets with paths and SHA-256 fingerprints.
- Ethics & Safety: approved-scope statement, privacy boundary, and current Check-In status.
- Attributions: the six recorded team roles plus external tools that materially support the visible frontend data.

Tabs change content inside one card. They do not add new top-level routes and do not enlarge the header navigation.

### 2. Experiment reproducibility metrics

Use the three existing replicate values to derive sample standard deviation and coefficient of variation for each Round 0 candidate. Add these values to:

- the selected-candidate detail rail;
- the experiment table.

Do not assign pass/fail quality labels because the Wiki says the statistical method and thresholds remain to be confirmed. The interface will explicitly say that CV is descriptive and no acceptance threshold has been defined.

### 3. Traceability labels

Every new dossier section shows its Wiki source filename. Verification records show exact repository paths and hashes. Historical WT-relative results and Round 0 M3-relative results remain visibly separated.

## What Will Not Be Added

- AI model center, model scores, confidence, or predicted activity.
- User accounts, roles, permissions, database, upload persistence, or deployment administration.
- AMP, GABA, NADPH, domain coloring, or distance measurements without the required complex structures and domain boundaries.
- Mutant 3D conformations derived only by highlighting WT residues.
- Empty Wiki templates for Project Description, Design, Human Practices, Education, Collaboration, or Parts.
- Unconfirmed reagent batch numbers, ELN links, p-values, experimental owners, safety contacts, or commit hashes.

## Data and Module Design

Create `src/wiki-content.js` as a small structured, immutable projection of confirmed Wiki facts. Each exported record includes a `source` field. The browser does not render raw Markdown, which avoids introducing a Markdown parser and prevents placeholder content from leaking into the interface.

Extend `src/experiments.js` with a coefficient-of-variation helper that reuses the existing sample standard deviation function. `src/app.js` renders the dossier, switches tabs, and adds derived metrics to candidate details and rows.

## Interface Design

Reuse the current design tokens, typography, radius, shadows, cards, and purple accent. The dossier uses:

- a horizontal compact tab row;
- one content area per selected topic;
- definition lists and short tables rather than long prose;
- a source line at the bottom of each panel.

At 1280 × 720, the existing Overview first screen remains unchanged. The dossier appears further down the independently scrolling Overview page. Mobile layouts stack dossier metadata and allow horizontal tab scrolling.

## Interaction and Accessibility

- Dossier tabs use `role="tablist"`, `role="tab"`, `aria-selected`, and associated tab panels.
- Tabs work with click and preserve a visible focus ring.
- Only one dossier panel is visible at a time.
- Dataset hashes use code styling and may wrap without horizontal page overflow.
- Derived SD and CV columns remain readable in the existing horizontally scrollable experiment table.

## Testing

1. Add unit tests for coefficient of variation, including zero-mean and insufficient-replicate handling.
2. Add data tests that confirm the six dossier sections and four exact verification hashes.
3. Add markup tests for the accessible tablist, panels, descriptive CV note, SD/CV columns, and absence of unsupported claims.
4. Run the complete Node test suite.
5. Verify in the in-app browser at 1280 × 720:
   - Overview first fold is preserved;
   - each dossier tab switches correctly;
   - hashes wrap cleanly;
   - selected-candidate SD/CV matches its replicates;
   - experiment table remains usable;
   - no console errors or warnings appear.

## Acceptance Criteria

- The existing four primary views and current structure/mutation interactions still work.
- Six confirmed Wiki topics are accessible from the Overview without new routes.
- No placeholder-only Wiki page is presented as completed work.
- Round 0 rows show calculated SD and CV with no invented quality threshold.
- All new claims identify their repository source.
- Full automated tests and browser QA pass.

