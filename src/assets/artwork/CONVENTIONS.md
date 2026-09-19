# SVG authoring conventions

Every mark on this site is drawn here. These rules are what make a dozen
hand-authored assets read as one commissioned set rather than as assorted clip
art — so they are binding, not advisory.

## Grid

- Motifs are authored on a **24-unit** viewBox (`0 0 24 24`).
- Ornaments and the hero use larger viewBoxes, but still on a 24-unit module.
- Every coordinate is a multiple of **0.5** units. No coordinate is more precise
  than that; if a curve needs finer control, move the control point instead.

## Line

| Property | Rule |
|---|---|
| Stroke width | Exactly three: `--stroke-hairline`, `--stroke-standard`, `--stroke-emphasis`. No fourth value exists. |
| Stroke colour | `--color-antique-gold` for ornament, `--color-maroon` for structure, `--color-deep-red` for the mauli cord only. |
| Caps and joins | `round` everywhere. The vocabulary is drawn with a brush, not a ruler — no mitred corners. |
| Fills | Ornament is **stroke-only**. The only filled shapes are the diya flame, flower centres, bulb glows and the mauli tassel. |

## Opacity

Depth is built from four fixed steps and nothing between them:

| Token | Value | Role |
|---|---|---|
| `--opacity-background` | 0.12 | Furthest back — washes, lattice fills |
| `--opacity-mid` | 0.34 | Mid-ground — skylines, roundels |
| `--opacity-foreground` | 0.60 | Foreground — arches, finials, petals |
| `--opacity-focal` | 1.00 | The one thing the eye should land on |

These steps were raised from an earlier, lower set after rendering. Gold on
ivory is only about 1.8:1 at full strength, so a step that looks reasonable as a
number can be entirely below perception on the page. Judge the ladder on screen,
never on paper.

A fifth value is a mistake, not a refinement.

## Colour

**No SVG in this project contains a colour hex literal.** Every stroke and fill
references a custom property, so changing the palette is a one-line edit and
never an asset edit. ESLint fails the build on a hex literal in source.

## Geometry

- **Arches** use the cusped *mehrab* profile — five cusps, 2:3 width-to-height.
- **Lotus** has seven petals, bilaterally symmetric, the outer pair swept down.
- **Symmetry**: ornament is mirror-symmetric about its own vertical axis unless
  it depicts something physical (the cord, the hands, a falling petal).
- **Scatter** positions are authored constants. Never randomised — the artwork
  must be identical on every load so it can be reviewed and regression-tested.

## Density

Ornament occupies **20–35%** of any panel's area, measured as inked area over
panel area. Below that the composition reads as unfinished; above it, the
ornament competes with the text it is meant to frame.

## Coherence test

Any two assets placed side by side at the same scale must read as drawn by the
same hand. Where a new asset fails this against the existing set, **the new
asset is redrawn** — the set is not loosened to accommodate it.

## Vocabulary

Drawing draws only from the deck's own elements: lotus, eternal knot, kalash,
peepal tree, diya, temple skyline, mauli cord, jaali lattice, hanging bell,
mango-leaf *toran*. No motif is invented outside this list, and none is borrowed
from a tradition the deck does not use.
