# Homepage visual assets

## Hero sequence layers

| File | Intended role |
|---|---|
| `hero/sequence-frame-wide.png` | Wide middle/background frame with a clear central text area |
| `hero/sequence-ribbon-diagonal.png` | Diagonal transition ribbon for scroll-linked movement |
| `hero/sequence-frame-close.png` | Close foreground frame with larger molecular forms |

All three source images are preserved as supplied: RGBA PNG, 1672 px wide, with transparency. They should remain decorative and must not be presented as measured molecular or sequence data.

## Build-stage elements

| File | Intended role |
|---|---|
| `build/plasmid.png` | Plasmid construction step |
| `build/pcr-tube.png` | PCR step |
| `build/pipette-tip.png` | Transfer and sampling motion |
| `build/petri-dish.png` | Transformation and colony stage |
| `build/e-coli.png` | Host-cell expression stage |
| `build/deep-well-plate.png` | Culture and screening handoff |
| `build/dna-fragment.png` | Mutation and assembly transition |

The seven supplied elements are stored as separate RGBA PNG files so they can be animated independently. They are illustrative UI assets, not literal experimental evidence.

## Test-stage reaction sequence

`test/reaction-state-01.png` through `test/reaction-state-05.png` are five transparent RGBA frames with identical 360 × 897 px canvases. Preserve their shared dimensions and alignment when building a crossfade, stepped scrub, or sprite-like reaction transition.

## DBTL cycle

`dbtl/dbtl-cycle-frame.png` is a 1254 × 1254 px transparent RGBA frame intended as the central visual for the DBTL chapter. Labels, stage progress, and real project facts should be rendered in HTML/SVG rather than baked into the image.

The four independent 1024 × 1024 px stage illustrations are:

- `dbtl/design.png`
- `dbtl/build.png`
- `dbtl/test.png`
- `dbtl/learn.png`

## Verification assets

The five 400 × 450 px transparent RGBA illustrations in `evidence/` represent FASTA, experiment spreadsheet, CIF structure, lab notebook, and SHA-256 verification records. Actual filenames, fingerprints, and provenance must remain live page text rather than image content.

## Mutation evolution

`evolution/mutation-node.png` is the supplied item 11 mutation-evolution node. It is a 1254 × 1254 px transparent RGBA illustration intended for the WT → M1 → M3 narrative; mutation names and measured values should be overlaid with HTML/SVG.

## Industrial application sequence

The three transparent layers in `application/` form the closing industrial-biomanufacturing sequence:

1. `enzyme-catalysis.png`
2. `bioreactor.png`
3. `product-output.png`

They share a 1520 px width and should be positioned independently rather than flattened into a single image.

## Organic reveal masks

`masks/organic-reveal-masks.svg` contains six black organic paths on a 2400 × 1200 white canvas. Extract or reference individual paths for section image reveals; the SVG is preserved in editable vector form.

## Scientific paper texture

`textures/lab-grid-paper.png` is a 1254 × 1254 px RGB background texture. Use it only at very low opacity in experimental and verification chapters so it does not reduce text contrast.
