# Flower photographs: sources

Most files here are cut out from free stock photographs. Both licences allow
free use and modification with no attribution required:
[Pexels License](https://www.pexels.com/license/),
[Pixabay Content License](https://pixabay.com/service/license-summary/).

Four files — `tray-bouquet`, `liner-roses`, `envelope-bouquet` and
`tied-posy` — are **supplied by the couple**: they come from the Canva
template this site is modelled on, sent here as download links, and are
published there already cut out.

## The originals

| Key | Source | What it is |
|---|---|---|
| WR | Pixabay [3083094](https://pixabay.com/photos/flowers-white-roses-arrangement-3083094/) | A spray of open white roses and buds |
| BIG | Pixabay [3306242](https://pixabay.com/photos/rose-flower-white-arrangement-3306242/) | Three large white wild roses with dark leaves |
| CA1 | Supplied: `mellowcreamstudio.my.canva.site` `84bf4244…png` | A round bouquet of cream garden roses, eucalyptus and astilbe, tied with a lace bow |
| CA2 | Supplied: `mellowcreamstudio.my.canva.site` `955f8dc7…png` | A small posy — one ranunculus, jasmine, astilbe, spotted leaves — bound in twine |
| CA3 | Supplied: `mellowcreamstudio.my.canva.site` `b65f7462…png` | The same posy, arranged differently: one ranunculus, jasmine, astilbe, eucalyptus |
| — | Pexels [12553640](https://www.pexels.com/photo/12553640/) | A posy bound in twine |

## The files

| File | Built from | Where it is used |
|---|---|---|
| `posy.webp` | Pexels 12553640 | Envelope page, over the sealed envelope's corner |
| `tray-bouquet.webp` | CA1, main mass only | Home, beside the silver tray |
| `liner-roses.webp` | CA1, cut above the bow and the cut edge faded | Home, five copies filling the opened envelope |
| `tied-posy.webp` | CA3 | Home, behind the playlist (mirrored); details, in the envelope's left shoulder |
| `wild-rose-spray.webp` | WR | Home, behind the "A time" print, and mirrored behind the "Once" print |
| `envelope-bouquet.webp` | CA2 | Home, standing in the names envelope |
| `wild-roses-on-frame.webp` | BIG | Home, lying on the "A time" print's corner, and mirrored on the "Once" print's |

## How they were made

**Pixabay originals** are published already cut out, as transparent PNGs with
clean edges at full resolution.

**Supplied originals** arrive as transparent PNGs on a 1600×893 canvas with
the arrangement small in the middle, so each was cropped to its own alpha
bounding box and resized. `CA1` also carries six petals and leaves detached
from the bouquet, which would float in mid-air once the bouquet is tucked
behind the tray: only the largest connected run of opaque pixels is kept.
`liner-roses` is `CA1` cut straight across above the bow, with the alpha
faded over the last 70px, so the cut disappears into the envelope's shadow.

**Pexels originals** were photographs on a background, downloaded at
1800–2400px and cut out here:

1. Subject mask from macOS Vision (`VNGenerateForegroundInstanceMaskRequest`,
   the model behind "Copy Subject" in Photos), at full resolution.
2. Edges refined. Vision's mask is soft at the edge, which reads as blur on a
   white page. Along a band either side of the mask's edge, bright petals take
   their alpha from how far the pixel is from the background colour (sharp),
   while dark leaves keep Vision's alpha. Partly transparent pixels have the
   background colour taken back out, so no halo is left.
3. Any edge where the arrangement ran off the original frame was faded out.

`posy` is from the first pass (1800px, eroded and feathered edge) and is
softer than the rest.

Files are 490–1200px wide, WebP, quality 84–86, alpha quality 95.
The width and height in `src/components/art/Flowers.tsx` must match each file.
