# Flower photographs: sources

Two files here are cut out from free stock photographs, under the
[Pixabay Content License](https://pixabay.com/service/license-summary/),
which allows free use and modification with no attribution required.

The other five — `tray-bouquet`, `liner-roses`, `envelope-bouquet`,
`tied-posy` and `standing-posy` — are **supplied by the couple**: they come
from the Canva template this site is modelled on, sent here as download
links, and are published there already cut out.

## The originals

| Key | Source | What it is |
|---|---|---|
| WR | Pixabay [3083094](https://pixabay.com/photos/flowers-white-roses-arrangement-3083094/) | A spray of open white roses and buds |
| BIG | Pixabay [3306242](https://pixabay.com/photos/rose-flower-white-arrangement-3306242/) | Three large white wild roses with dark leaves |
| CA1 | Supplied: `mellowcreamstudio.my.canva.site` `84bf4244…png` | A round bouquet of cream garden roses, eucalyptus and astilbe, tied with a lace bow |
| CA2 | Supplied: `mellowcreamstudio.my.canva.site` `955f8dc7…png` | A small posy — one ranunculus, jasmine, astilbe, spotted leaves — bound in twine |
| CA3 | Supplied: `mellowcreamstudio.my.canva.site` `b65f7462…png` | The same posy, arranged differently: one ranunculus, jasmine, astilbe, eucalyptus |
| CA4 | Supplied: `mellowcreamstudio.my.canva.site` `af16b489…png` | A slim posy of one ranunculus, jasmine, astilbe and eucalyptus, bound in twine, its stems long and free |

## The files

| File | Built from | Where it is used |
|---|---|---|
| `standing-posy.webp` | CA4 | Envelope page, over the sealed envelope's corner |
| `tray-bouquet.webp` | CA1, main mass only | Home, beside the silver tray |
| `liner-roses.webp` | CA1, cut above the bow and the cut edge faded | Home, three copies around the bouquet in the opened envelope |
| `tied-posy.webp` | CA3 | Home, behind the playlist (mirrored); details, in the envelope's left shoulder |
| `wild-rose-spray.webp` | WR | Home, behind the "A time" print, and mirrored behind the "Once" print |
| `envelope-bouquet.webp` | CA2 | Home, standing in the names envelope |
| `wild-roses-on-frame.webp` | BIG | Home, lying on the "A time" print's corner, and mirrored on the "Once" print's |

## How they were made

**Pixabay originals** are published already cut out, as transparent PNGs with
clean edges at full resolution.

**Supplied originals** arrive as transparent PNGs on a wide canvas (1600×893,
or 799×446 for `CA4`) with the arrangement small in the middle, so each was
cropped to its own alpha bounding box and resized. `CA4` was already large
enough in its frame to be used at its own resolution, so it was only cropped. `CA1` also carries six petals and leaves detached
from the bouquet, which would float in mid-air once the bouquet is tucked
behind the tray: only the largest connected run of opaque pixels is kept.
`liner-roses` is `CA1` cut straight across above the bow, with the alpha
faded over the last 70px, so the cut disappears into the envelope's shadow.

Files are 360–1200px wide, WebP, quality 84–86, alpha quality 95.
The width and height in `src/components/art/Flowers.tsx` must match each file.
