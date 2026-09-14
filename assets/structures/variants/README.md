# MAB2962 variant docking structures

Source: user-provided `MAB2962变体对接(1).zip`. Original PDB contents are preserved.

All eight models contain chain A (1,184 residues), ATP (B), NDP/NADPH (C), Mg (D), and GAB/GABA (E). WT matches the project's MAB2962 FASTA. Coordinate residue identities were checked against WT; the exact differences are declared in `src/docking-models.js` and checked by automated tests.

- WT: no mutations.
- PSW: D281P/G420W/N514S.
- G980M: WT background, not PSW-G980M.
- PSW-F430M / PSW-G980M / PSW-L417A / PSW-N506A: PSW plus one mutation.
- PSW-N506A-G980M: PSW plus two mutations (five total).

PDB remarks identify selected GNINA docking poses, AF3-derived receptors and complexes that are **not energy-minimized**. These are computational docking models, not experimentally resolved structures. Their coordinates, pose numbers, distances or angles are not experimental activity measurements and do not establish a validated mechanism. R3 activity records remain retrospective challenges, separate from R0–R2 forward benchmarks.

Models load on demand in the structure workbench. Exact complete constructs are required to claim a candidate-specific docking model; all other candidates use clearly labelled WT or PSW reference mapping. Original AlphaFold PAE data remain reference-model data, not variant-specific PAE predictions.
