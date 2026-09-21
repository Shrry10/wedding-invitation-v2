# Object photographs: sources

Objects on the site used to be drawn (`src/components/art/`). This folder is
for the ones that are not, because the drawing lost the thing that identified
them: the envelope's cloth came out as card, the mount's board as a flat wash,
the seal as a printed token, the record as a hole in the page.

Every file here is **supplied by the couple**: each comes from the Canva
template this site is modelled on, sent here as a download link, and is
published there already cut out on a wide transparent canvas with the object
small and off-centre in it.

| File | Source | What it is |
|---|---|---|
| `silver-plate.webp` | `0839830b…png` | The chased silver salver the home page's "The Details" badge lies on |
| `envelope-sealed.webp` | `c1190c41…png` | The envelope as it arrives, flap down — the invitation page's one object |
| `envelope-open-back.webp` | `8dabc499…png` | The same envelope opened: back panel and thrown-back flap |
| `envelope-open-front.webp` | `22a8cfab…png` | Its front pocket, in register with the back |
| `photo-mount.webp` | `4a7183ae…png` | The maroon instant-photo mount: square aperture, deep band below it |
| `wax-seal.webp` | `761bacb4…png` | The gold wax seal, struck blank |
| `record.webp` | `ac6b5e57…png` | A twelve-inch pressing, seen square on |

## How they were made

Each original was cropped to its own alpha bounding box and resized, then
written as WebP at quality 84–86, alpha quality 95. The width and height in
`src/components/art/Objects.tsx` must match each file.

Three of them needed more than a crop.

**The two discs** — `silver-plate` and `record` — are cut so the disc is
tangent to all four sides of the box. That is what lets the page treat each
file as a circle: `.plate-shadow` and `.record-shadow` are the whole box, and
`.turning` spins about `50% 50%` with no measured centre to drift. Both crops
come out 78% opaque, which is π/4, so the cut is right. `record` is squared off
to 680 × 680 from a 681 × 683 box, because a disc two pixels out of round
wobbles once it is turning.

**Both halves of the open envelope** are trimmed three pixels in from their
published edge and then bled. Whoever cut them left a pale rim a couple of
pixels wide at *full* alpha — the studio sweep the envelope was shot against,
kept rather than cut. It is invisible on the light page, but every edge where
one half lies over the other's dark interior, which is most of the inside of
the envelope, showed it as a bright hairline. Pushing colour outwards does not
help, because the rim is opaque: the alpha has to come in past it. The bleed
that follows is a normalised convolution — blur the colour weighted by the
mask, blur the mask, divide, repeat — so the new edge carries the paper's own
colour rather than whatever was behind it.

**The two halves** are one object published as two. They
arrive on the same 2399 × 1339 canvas and are already in register on it, so
they are cropped to one shared box — 668, 48 to 1738, 1238 — rather than to
each one's own, and written at one size. Laid one over the other with flowers
between them, they line up.

`envelope-open-back` also arrives with a printed floral liner inside the flap,
which this site does not want: the flowers here are objects lying in the
envelope, not a pattern printed on it. The liner is masked on colour — the
maroon runs red-over-green by 45 at every depth, so "not maroon" is either
plainly bright or not red-dominant enough, and the second test is what catches
the leaves, which are dark but green. The mask is grown five pixels, feathered,
and multiplied by the paper's own alpha so it cannot reach the cut edge. What
replaces the liner is the envelope's own cloth: a patch of the front panel,
taken from below the pocket's V where the paper is solid, stretched over the
opening in one piece and shaded from 93% at the flap's apex to 63% at the fold,
because the inside of a flap is darker the closer it gets to the crease.

Two things went wrong on the way and are worth not repeating. A tiled patch
showed its repeat as a seam across the opening. And a patch cropped high enough
to clip the pocket's notch brought that transparent triangle with it, which
stretched into a dark hole in the middle of the flap.

**The mount** is published with white board behind its aperture rather than a
hole, so the opening is cut out — every opaque near-white pixel, gated on
alpha, which measures 44, 48 to 548, 553 of the 592 × 696 crop. The cut is
taken two pixels wider than that on every side, because the board's edge pixels
are part board and part shadow, and left semi-transparent they show as a white
hairline over the print. The print then goes *under* the mount and the mount's
own edge falls over it, the way a window mount actually holds a photograph.
