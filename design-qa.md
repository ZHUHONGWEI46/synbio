# MutDesign Navigation Motion QA

- Source visual truth: `docs/superpowers/specs/2026-08-28-navigation-motion-design.md` and selected visual-companion direction A, “滑轨与层叠”.
- Desktop implementation screenshot: `artifacts/navigation-motion-desktop.png`.
- Narrow-screen implementation screenshot: `artifacts/navigation-motion-mobile.png`.
- Desktop viewport: 1536 × 900 CSS px, device scale factor 1; screenshot is 1536 × 900 pixels.
- Narrow viewport: 700 × 900 CSS px, device scale factor 1; screenshot is 700 × 900 pixels.
- State: Structure & Mutation page with the centered workbench menu open downward.

## Findings

No actionable P0, P1, or P2 visual or interaction findings remain.

- Fonts and typography: existing navigation labels, sizes, weights, wrapping, and hierarchy are unchanged.
- Spacing and layout rhythm: the 46 × 46 workbench handle remains centered; the independent submenu opens 8px below it and does not resize or shift the header.
- Colors and tokens: active pills use the existing muted surface and indigo accent tokens; no new decorative palette was introduced.
- Image quality and asset fidelity: supplied navigation PNGs keep their aspect ratio; animation targets the crop wrapper for the attribution icon so the source crop is not lost.
- Copy and content: all existing Chinese labels and destinations are unchanged. The handle exposes explicit open/close accessible labels.

## Full-view comparison evidence

The desktop capture confirms a centered, downward-opening menu with all four secondary destinations readable above the main content. The narrow-screen capture confirms the handle is removed and all four destinations remain visible in the fixed bottom navigation with no horizontal overflow.

## Focused interaction evidence

- Pointer moved from the handle into the submenu without closing it.
- Pointer exit remained open before the 120ms close delay and closed after the delay.
- Pointer exit now also closes after a submenu click; retained button focus no longer pins the hover menu open.
- All six project topics moved the shared primary indicator to distinct positions and left exactly one page visible.
- All four secondary destinations updated the hash and left exactly one page visible.
- Returning to Structure & Mutation left the Mol* viewport at 818 × 589.5 CSS px.
- Escape closed the menu and returned focus to `#subnav-handle`.
- Narrow-screen computed state: handle `display: none`, submenu `position: static`, opacity 1, four visible buttons, zero horizontal overflow.
- Browser console errors checked: none.

## Accessibility and reduced motion

- Closed submenu buttons use `tabindex=-1`; open and narrow-screen states restore `tabindex=0`.
- The handle is a native button with `aria-controls`, `aria-expanded`, and a state-specific label.
- Escape closes the dropdown and returns focus to the handle.
- `prefers-reduced-motion: reduce` is implemented in both CSS and the GSAP controller and covered by automated contract tests. The current in-app browser does not expose media-emulation controls, so this branch was not captured as a separate visual screenshot.

## Comparison history

1. Initial browser pass found pointer focus could open the menu before click and cause the click handler to close it again.
2. Added a failing regression contract, separated handle focus from menu focus, and changed fine-pointer click behavior to open-only while retaining coarse-pointer toggling.
3. Post-fix desktop, keyboard-close, primary navigation, secondary navigation, and narrow-screen evidence passed.
4. Removed submenu opacity animation entirely; the panel now reveals downward through transform only.
5. Rounded both shared indicators to full pills and slowed primary/secondary travel to 460ms/420ms with `power3.inOut` easing. Icon response now spans 500ms with a restrained 1px lift and 1.05 scale.

## Automated verification

- Command: `npm test`
- Result: 56 passed, 0 failed.

## Follow-up polish

- P3 test gap: capture the reduced-motion branch visually if a future browser environment exposes media-feature emulation.

final result: passed
