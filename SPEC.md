# Spec: Sreetam & Bhavna — wedding invitation site

The current reference for this codebase: what the site is, how it is built,
where everything lives, the rules it follows, and a log of changes. Read this
before changing anything.

`resc/docs/` has the original project documents: `1-details.md` (brief),
`2-spec.md` (first spec), `3-plan.md`, `4-exec.md` and `5-handover.md`. They
describe an **earlier design**, a single scrolling page with an "event journey"
and animated panels, which was later replaced by the four-page design below.
Their principles (self-sufficiency, dependency policy, contrast, accessibility)
still apply. Their page layouts and section lists do not. Where they disagree
with this file, this file wins.

---

## 1. Objective

A static wedding invitation site for **Sreetam & Bhavna**, 11–13 December
2026, Bhubaneswar. Most guests will open it from a WhatsApp link on a phone.
Each side of the family has its own link, which puts their child's name first
everywhere on the site (§5.1).

- **Theme:** *Mangal Sutra* (मंगल सूत्र). Tagline: "Bound by rituals, crafted by
  devotion, celebrated forever." Hashtag: `#SreekomilaBhav`.
- **Four functions:**

| id | Name | Title on site | Date | Time | Venue |
|---|---|---|---|---|---|
| `mehndi` | Mehndi | The Henna Garden | 2026-12-11 | 18:00 | Hotel Suraj Palace, Patia Road |
| `haldi` | Haldi | Touched by Turmeric | 2026-12-12 | 10:30 | Aura Lawns, Patia |
| `sangeet` | Sangeet | Strings & Songs | 2026-12-12 | 19:00 | Aura Lawns, Patia |
| `marriage` | Marriage | Bound by Thread | 2026-12-13 | 11:00 | Greenland Resort, Patia |

- **Countdown target:** `2026-12-13T11:00:00+05:30` (the marriage ceremony, IST).
- **Visual model:** a hand-crafted paper invitation laid on a table: maroon
  velvet envelope, gold wax seal with the couple's monogram, embossed ivory
  cards, a silver tray, polaroids, a vinyl sleeve, white roses. Behind every
  page is a faint black-and-white photograph of two hands reaching for each
  other. The design copies a reference website (screenshots in
  `resc/website-ss/`, not committed).

### Success criteria (standing)

- Every fact on the page comes from `src/data/content.ts`, and no other file
  holds content.
- The build fails on invalid content (see §5.8–5.9).
- Works with scripting disabled, because every page, in every name order, is
  prerendered to its own HTML file.
- No horizontal scroll at any width from 320px up.
- Reduced motion is respected, and keyboard focus is visible.
- No runtime network calls to third parties. Fonts and images are vendored.

---

## 2. Tech stack

| Concern | Choice |
|---|---|
| UI | React 19 (`react`, `react-dom`: the **only** runtime dependencies) |
| Build | Vite, with a client build, an SSR build and a prerender step |
| Language | TypeScript, `strict` |
| Styling | One hand-written stylesheet, `src/index.css`. Tailwind 4 is wired in (`@theme inline` mirrors the tokens) but the pages use plain class names |
| Tests | Vitest + Testing Library (jsdom) |
| Lint / format | ESLint 9 (flat config), Prettier |
| Routing | Path routes, no router library (`src/routes.ts`, `useRoute`); each address is a prerendered `index.html` |
| Hosting | Any static host over HTTPS that serves `folder/index.html` for `/folder/` (all common ones do). Output is `dist/` |

## 3. Commands

```bash
npm install
npm run dev          # Vite dev server, http://localhost:5173
npm run typecheck    # tsc for app + node configs
npm run lint         # eslint .
npm test             # vitest run (167 tests at time of writing)
npm run build        # typecheck → client build → SSR build → prerender 12 addresses into dist/**/index.html
npm run preview      # serve dist/
npm run preview:lan  # serve dist/ on the local network (open the printed Network URL on a phone on the same Wi-Fi)
npm run rasters      # macOS only: re-render og-image / favicons from the live dev server (swift)
```

Deploy: `cp .env.example .env.production`, then set `VITE_SITE_URL` (so the
`og:image` tag becomes absolute and WhatsApp shows a preview image). Set
`VITE_BASE_PATH` if the site is served from a sub-path. Then run
`npm run build` and upload `dist/`.

---

## 4. Project structure

```
index.html                 Document shell, meta/OG tags, sets html.js and adds a missing trailing slash before the bundle loads
vite.config.ts             React + Tailwind + content-validation plugin + absolute OG URLs
scripts/
  validate-content.ts      Vite plugin: runs validateContent() at build start and fails the build on errors
  prerender.mjs            Writes one prerendered index.html per address (page × name order), reorders the
                           names in each head, deletes dist-ssr/
  render-rasters.swift     Renders og-image.png / favicon.png / apple-touch-icon.png (macOS WebKit)
  shoot.swift              Screenshot helper (URL, width, height, out, scrollY)
public/                    favicon.png, apple-touch-icon.png, og-image.png (committed rasters)
probe-*.html               Dev-only pages that mount src/probes/* for inspecting artwork in isolation
resc/docs/                 Original brief, spec, plan, execution log, handover (historical)
src/
  main.tsx                 Hydrates prerendered markup, or renders fresh in dev
  entry-server.tsx         render(path) and prerenderTargets() for the prerender step
  App.tsx                  Chooses the page and the name order from the address. The only place pages are composed
  routes.ts                PAGES = envelope | home | details | story; /[order]/<page>/ (+ routes.test.ts)
  index.css                ALL styling: fonts, tokens, type scale, every component's CSS
  data/
    types.ts               The content contract (types only)
    content.ts             Every word and fact on the site
    eventPalettes.ts       Per-function colour worlds + dress-code swatches
    validate.ts            Build-time content checks (+ validate.test.ts)
  pages/
    EnvelopePage.tsx       Landing: names, sealed envelope, "open" stamp
    HomePage.tsx           The invitation "table": absolute canvas of objects (§5.2)
    DetailsPage.tsx        The Details: invitation, date & location, dress code, timeline
    StoryPage.tsx          Our Story: photo route of beats, closing message
  components/
    Backdrop.tsx           The fixed background photograph (hands), focal-point anchored
    PrintFill.tsx          What fills a polaroid's well: a gallery photograph, or PhotoStandIn until there is one
    a11y/                  FactValue (pending-value renderer), SkipLink, VisuallyHidden
    countdown/             Countdown, CountdownUnit, CountdownLiveText (screen-reader text, coarse updates)
    art/                   Hand-authored SVG/CSS artwork: Maroon (envelopes, polaroid), Metal (wax seal,
                           tray, key, earrings), Paper (embossed card, ovals, stamps), Florals (the
                           drawn sprays, now only lining the home envelope), Vinyl, Ornament, Paths
                           (dashed route lines + hearts), LineIcons, PlaceIcons, PhotoStandIn,
                           geometry.ts. CONVENTIONS.md = SVG authoring rules. Flowers.tsx is the
                           exception: <FlowerPhoto photo="…"> renders one cut-out flower
                           photograph (see §5.2 and assets/images/flowers/)
  hooks/                   useRoute, useCountdown, useReducedMotion, useStagedReveal (+ dormant, see §9)
  lib/                     isPending/knownValue, formatDate, formatDuration, coupleNames, arrival,
                           photoUrl (gallery path → bundled URL, via import.meta.glob), …
  probes/                  Isolated artwork viewers used by probe-*.html
  assets/fonts/            Vendored woff2 + LICENSES.md + OFL.txt
  assets/images/           background-hands.jpg, white-rose.png (the drawn sprays' rose)
  assets/images/flowers/   Nine cut-out flower arrangements (WebP with alpha); several are built from
                           two or more photographs + SOURCES.md (Pexels and Pixabay ids, what went
                           into each file, how they were cut out and composited)
  assets/images/photos/    The couple's photographs, cropped to the polaroid well (see §6)
  test/                    Vitest setup + smoke test
```

Not committed (see `.gitignore`): `node_modules`, `dist`, `website-pics/` (the
client's original photographs, ~145 MB; the cropped copies in
`src/assets/images/photos/` are what ships), `recording/`
(screen recording), `resc/support` (decor decks and reference video),
`resc/website-ss`, `resc/flower`, `resc/background-hand.jpg`, `resc/.obsidian`
(editor state), `.claude/settings.local.json`.

---

## 5. Architecture

### 5.1 Pages, name order and navigation

Four pages, addressed by path. Every address is prerendered to its own
`index.html`, so a static host serves each as a plain file:

| Path | Page | Reached from |
|---|---|---|
| `/` (default) | `EnvelopePage` | first load. Opening the envelope goes to home after ~760ms (160ms with reduced motion) |
| `/home/` | `HomePage` | the envelope. "← Back to envelope" at the bottom |
| `/details/` | `DetailsPage` | the silver tray / "The Details" oval on home |
| `/story/` | `StoryPage` | the photo strip / "Our story" oval on home |

**Name order.** An optional first segment chooses whose name leads:

| Prefix | Order everywhere | Share with |
|---|---|---|
| none (`/`, `/home/`, …) | the content's `couple.leadName` (groom: Sreetam & Bhavna) | anyone |
| `/sreetamandbhavna/` | Sreetam & Bhavna | the groom's side |
| `/bhavnaandsreetam/` | Bhavna & Sreetam | the bride's side |

So `/bhavnaandsreetam/home/` is the home page with Bhavna first. "Everywhere"
means: the envelope heading and its button label, the invitation card, the
card in the small envelope, the countdown sign-off and its spoken subject, the
story page's "With love", the wax-seal initials (BS / SB), and the page's
`<title>`, `og:title`, `twitter:title` and descriptions, so a WhatsApp preview
shows the same order. The segment is built from the names in `content.ts`
(`orderSegment`: both names joined by "and", lower case, letters and digits
only), so it follows any change of spelling there. Case and a missing
trailing slash are accepted; an unknown segment falls back to the default.

`useRoute` reads `location` through `useSyncExternalStore` and navigates with
`history.pushState`, keeping the order prefix, so moving between pages never
changes the order and the back button works. The server renders the path it
is given (`<App path>`), and the client's server snapshot is its own pathname,
so hydration always matches the file served. Old `#/home`-style links still
open the page they name. `index.html` adds a missing trailing slash before
anything draws, because some hosts would otherwise serve the root page (in the
default order) for `/bhavnaandsreetam/home`. No page imports another page.

### 5.2 Home: the absolute canvas

`HomePage` copies the reference layout exactly. It uses one canvas with a fixed
ratio (812 × 2100), and every object is placed with
`at(left%, top%, width%)`. Positions were measured off the reference
screenshot. Type inside the canvas is sized in container-query units (`cqw`), so
the whole drawing scales as one piece instead of reflowing.

Objects, top to bottom: the opened envelope packed with roses and the wax
seal, the **playlist sleeve** (a link only when `playlist.url` is known;
otherwise it shows just "Playlist" with no caption), a polaroid, **door one** (the spinning
silver tray + key, going to Details), **door two** (the story photo strip,
going to Story), Save the Date with a polaroid, and the **countdown card**
(Countdown, "Until we say *yes*", "With love and gratitude", names, closing
line, wax seal, back link).

Every polaroid on the canvas holds a photograph. `content.homePhotos` maps
each slot to a gallery image id: `invitation` (beside the card), `details-1`
to `details-3` (under the tray, top to bottom), `story-1` to `story-3` (the
"Once", "Upon", "A time" strip) and `save-the-date`. A slot left out shows
the drawn stand-in. Only `invitation` loads eagerly; the rest are lazy.

**Every flower on the site is a photograph** (`FlowerPhoto`, §4) — the drawn
`FloralSpray` set is no longer used on any page. A file may serve more than
one place, but a repeat is always mirrored, so no two places read as the same
picture: the two story prints carry the same pair, and the couple's posy
stands both behind the playlist and in the details envelope.

| Place | Photo | Placement |
|---|---|---|
| Envelope page, sealed envelope corner | `standing-posy` | `.envelope-scene__floral`, mirrored and turned 14°, blooms up on the envelope's lower left corner and the twine and stems trailing off below it |
| Home, inside the opened envelope | `tray-bouquet` + `liner-roses` | one hand-tied bouquet lying in the envelope (`.envelope-liner__bunch--middle`), blooms up on the thrown-back flap and stems into the opening, with two cut bunches of heads leaning out either side (`--left`, `--right`) and a third across the mouth of the pocket (`--front`) that covers the bouquet's lace tie. The flap is drawn first, the flowers next and the pocket last, so the flowers are held *in* the envelope; each bunch carries a close shadow on the paper behind it. The set is clipped to the paper it lies on — the flap's two edges above the fold, the envelope's full width below (`clip-path` on `.envelope-liner`) — so no bloom floats outside it |
| Home, between the sleeve and the invitation card | `tied-posy` | mirrored and turned 10°, laid over the sleeve's bottom edge, its stems running down behind the card's top edge |
| Home, the silver tray | `tray-bouquet` | a round bouquet of cream roses tied with a lace bow, mirrored and turned 36°, head up and left of the plate, bow and stems crossing its rim (laid before the plate) |
| Home, the "Once" print | `wild-rose-spray` | **behind** the print, mirrored — the "A time" arrangement reflected |
| Home, the "Once" print, on top | `wild-roses-on-frame` | laid **after** the prints, mirrored, resting on the frame's top-left corner |
| Home, the "A time" print | `wild-rose-spray` | **behind** the print; roses show over its top-right corner |
| Home, the "A time" print, on top | `wild-roses-on-frame` | laid **after** the prints, resting on the frame's top-right corner and a little way onto the photograph |
| Home, the names envelope | `envelope-bouquet` | **behind** the envelope, leaning 7° left: one posy standing in it, its stems hidden by the flap and the card, its blooms rising to the save-the-date card's height |
| Details, opened envelope | `tied-posy` | `.details__spray`, standing **in** the envelope's left shoulder: drawn inside the envelope's own card slot and after the card, so it lies over the card's left edge, while the pocket — drawn after the slot — cuts its stems. Mirrored, and sized against that slot (48% of it) |

"Behind" is DOM order: the flower's `Piece` comes before the object that
covers it — and for a flower inside an envelope, that means inside
`OpenEnvelope`'s own slot, so the pocket drawn after the slot cuts the stems.
Within the slot the details posy comes *after* the card, so it lies over the
card's left edge rather than behind it. Keep it so when moving either one.

The home and details posies are both mirrored and so face the same way; they
are on different pages, and the details one shows only what clears the card.
`standing-posy` and `tied-posy` are near-twins — the same posy arranged
differently — and a guest meets them on consecutive screens.

On phones the canvas shows only about 25%–80% of its width, so a flower's
visible tip must stay inside that: the "Once" pair is set at the print's own
left edge (24.6%) for that reason, rather than mirroring the "A time" offsets
exactly.

Only the flowers visible on arrival (envelope page, the card roses, the
details envelope) load eagerly; the rest are lazy. They take the page's usual
two drop shadows from the piece they sit in.

Groups of objects move together. Change the space *between* groups rather than
moving a single object (see the comment on `at()`).

**Each group is centred across the canvas**, not measured straight off the
reference, whose collage sits about 2% right of its own middle: the tray group
carries a 2.2% correction, the story and save-the-date groups 2.4% and the
countdown 2.0%, and the envelope group needed none. Every group's ink now
centres within 1% of the coordinate space's middle at every width. A
correction moves a whole group, because what is centred is the group's ink and
not each object in it. The one exception is the "Our story" badge
(`at(42.35, …)`), which stands alone above the strip and is centred on the
canvas exactly. "The Details" badge is not: it lies on the silver tray and
belongs to that arrangement, so it sits 11–23px left of the screen's middle.

**Below 900px the canvas is zoomed.** Its width ramps from 100% at 900px to
**180%** at 600px and stays there on phones, so the empty margin of the
coordinate space falls off both edges. The canvas is not shifted: the objects
are centred in the space they are drawn in, so centring the space centres
them.

Nothing drawn is cropped: the envelope's flowers are clipped to the paper they
lie on and the story prints' flowers start at the prints' own edges. At that
zoom the record would run off the right edge, so the playlist sleeve
(`.playlist`) moves left by 2.5% of the canvas below 900px. At 390px the
envelope's box starts 27px from the left edge and the record ends 22px from
the right; at 320px, 22px and 18px.

### 5.3 Details page (flow layout)

This page is one centred column (`.page__column`, max 760px), in this order:

1. **The opening screen** (`.details__opening`): "THE DETAILS" title, "You are
   invited" script (written out on load, see §10), the opened envelope with
   the card rising out of it, then **`invitation.message`** as its caption
   ("Unfolding the celebrations"). The caption is set large, upright, on one
   line, with gold hairlines either side. The block is `min-height: 100svh`
   and the envelope takes whatever height is left (a size container, sized by
   `cqw`/`cqh`), so the fold falls just under the caption on any device.
2. **Date and Location**: four columns on ≥720px, two below. Each column is a
   subgrid (icon, name, traditional name, date + time, venue link, address), so
   the rows line up across columns. Function names never wrap (see §5.6).
3. **Dress Code**: one row per function: icon, name, and five swatches from
   `eventPalettes.ts`. Each chip is 40px (smaller if the column is), and a
   diagonal glaze of light sweeps along each row from the first colour to
   the last, in all four rows at once (§5.7).
4. **Timeline**: a dashed winding route with hearts, stops alternating sides,
   at every width. Two drawings of the route are rendered (`layout="wide"` and
   `"narrow"` in `Paths.tsx`), and the stylesheet shows one: narrow below
   600px, wide from 600px.
5. A heart flourish, the wax seal, and "← Back to home".

### 5.4 Story page

A dashed "washing line" route (`Paths.tsx`) with one print per
`story.beats[]` entry, alternating sides. A beat's `imageId` is looked up in
`content.gallery`. Every beat has a photograph (`ourstory-1` to `ourstory-7`,
in beat order). A beat with no `imageId` falls back to the authored stand-in
(`PhotoStandIn`), through the same `PrintFill` the home page uses. After the route come the closing message, "With
love", and the names.

Below 700px each stop reads label, place, sentence, **then** the print (the
heart stays beside the print). The reordering is CSS only
(`grid-template-areas` on `.route__stop`); the DOM keeps the print first,
which is the order the wide layout (700px and up) shows.

### 5.5 Content model and pending values

`src/data/types.ts` is the contract. `content.ts` is the only data file.

- `PENDING` (`'TBD'`) marks a fact that is not known yet. **`FactValue`** is the
  only component that renders it: it shows "To be confirmed" (with a labelled
  screen-reader version) and never renders nothing. Use `knownValue()` /
  `isPending()` from `lib/isPending.ts` instead of truthiness checks.
- To replace a pending value, write the real string into `content.ts`.
  Nothing else changes.
- **Photographs:** `gallery[]` lists every photograph (`id`, `src`, `width`,
  `height`, `alt`). `src` is a path from the repo root inside
  `src/assets/images/photos/`, not a URL; `lib/photoUrl.ts` turns it into the
  fingerprinted URL through `import.meta.glob`. That keeps `content.ts` plain
  data the build can import and validate before bundling. Story beats point at
  photographs with `imageId`; the home page with `homePhotos` (§5.2).
- Fields not currently rendered: `events[].dressCode`, `decorNote`, `motif` and
  `signature` (left from the old panel design); `footer.hostedByLines`;
  `couple.hashtag`; `theme.*`. The title and tagline in `index.html`'s meta
  tags are hand-written there, not read from `content.ts`.

Things still pending on the live site (as of 2026-09-19): `playlist.url`,
`footer.hostedByLines`. The venue `mapsUrl`s are Google
Maps *searches* and should be replaced with exact pins.

### 5.6 Styling system (`src/index.css`)

- **The only file with colour literals.** Tokens live in the top `:root` block.
  `@theme inline` mirrors most of them for Tailwind.
- **Palette groups:** paper/ink/maroon/gold/silver; the reference site's colours;
  per-function *decor* tokens measured from the decks (`--color-mehndi-*`,
  `--color-haldi-*`, `--color-sangeet-*`, marriage `--color-marriage-maroon`,
  `--color-deep-red`, `--color-mauli-orange`, `--color-antique-gold`,
  `--color-ivory`); and **dress-code tokens** `--color-dress-<event>-<hue>`
  (values in §10).
- **Fonts** (all vendored in `src/assets/fonts`, SIL OFL):

| Family | Role |
|---|---|
| Cormorant Garamond (variable 300–700) | Display + body: every letter of text |
| **Cinzel Figures** (Cinzel variable 400–900, `unicode-range: U+0030-0039`) | **Every digit 0–9** on the site: countdown, dates, times. Listed first in `--font-display` and `--font-body`. `size-adjust: 94%` |
| Great Vibes | Script headings (`.t-script`), plus the emphasised "yes" |
| Pinyon Script | Defined as `--font-script-alt`, not currently referenced |
| Tiro Devanagari Hindi (subset) | Devanagari names (मेहंदी etc.) |
| Marcellus | Vendored, not currently used |

  The vendored Cormorant has **no italic** file. `font-style: italic` gives a
  synthesised slant, so avoid it.
- **Type classes:** `.t-title` (big caps), `.t-script`, `.t-label` (small caps
  label), `.t-date`, `.t-prose`. Component classes use BEM-ish names
  (`.countdown__value`, `.palette__chip`, `.functions__item`).
- **Specificity:** a component class declared *after* a type class with the same
  specificity wins (for example `.details__message` overrides `.t-prose`). Keep
  new overrides below the rule they override.
- **Container queries:** the home canvas uses `cqw`. `.functions__item` is an
  `inline-size` container, so a name can size itself with `cqi`.

### 5.7 Motion

- `html.js` is set inline in `index.html`. Any motion that starts content hidden
  is guarded on it, so the visible state is the default without scripting.
- `useStagedReveal` brings every `[data-piece]` in once, at load. Objects are
  thrown in from their own side (`lib/arrival.ts`, `--from-x`). `data-fade`
  pieces fade only.
- The one CSS-only motion: "You are invited" on the details page is written
  out by a moving mask (`.details__written`, `@keyframes pen-write`), in one
  steady stroke with no pauses. It is guarded on `html.js`, like the other
  motion.
- The dress-code glaze (`.palette__chip::after`, `@keyframes swatch-glaze`)
  is one band of light at one steady speed, 3.2s per sweep, looping with no
  hold: it leaves the last chip as it reaches the first. Each chip draws the
  band offset by its index (`--i`) times the chip pitch (`--chip-pitch`,
  measured in `cqi` against `.palette__swatches`, which is a container), so
  the five chips show one band moving across the row. All 20 animations
  start with the page and share one start time. With reduced motion the
  band stays still across the middle of each chip at 55% opacity. It is not
  guarded on `html.js`, because it never hides anything.
- `useReducedMotion` turns staging off, and CSS respects
  `prefers-reduced-motion`.

### 5.8 Build pipeline

1. `validateContentPlugin` imports `content.ts`, reads the real hex values of
   `--color-*` tokens from `index.css`, and runs `validateContent`. Any failure
   stops the build with a field path and a message.
2. Client build to `dist/`, SSR build of `entry-server.tsx` to `dist-ssr/`.
3. `prerender.mjs` renders `<App path>` for each of the 12 addresses (4 pages ×
   3 orders), injects each into a copy of `dist/index.html`, and writes it to
   `dist/<path>index.html`. In copies whose order differs from the default it
   swaps the names in the head's hand-written title and descriptions, and it
   fails the build if those no longer spell the default order. `og:url` gets
   the address's path. Then it deletes `dist-ssr/`. `main.tsx` hydrates.
   Sizes: the envelope file is ~290 KB (38 KB gzipped); `home/` is ~3.9 MB
   (485 KB gzipped) because the canvas art is inline SVG. Guests only fetch
   it by opening a `/home/` link directly; moving there from the envelope
   renders it from the bundle.
4. `absoluteSocialUrls` rewrites `og:image` / `og:url` using `VITE_SITE_URL`.
   It warns if the variable is not set. It runs before the prerender step.

### 5.9 Validation checks (`src/data/validate.ts`)

Referential integrity (event → venue, beat → image), unique ids, collections
and alt text, date/time formats, end after start, HTTPS map URLs, **countdown
instant must carry an explicit offset**, signature assignment/uniqueness and
signature asset existence, **every gallery photograph is inside
`src/assets/images/photos/` and on disk**, every `homePhotos` slot points at a
real gallery image, countdown matches the marriage event, story beats
(emblem required, no empty year), and **panel contrast ≥ 4.5:1** (ground vs
text of each event palette, measured from the stylesheet).

---

## 6. Common edits

| Want to… | Do this |
|---|---|
| Change any wording or fact | Edit `src/data/content.ts`, then rebuild |
| Send a link with one name first | `https://<site>/bhavnaandsreetam/` or `/sreetamandbhavna/` (any page can follow: `/bhavnaandsreetam/story/`). The plain `/` uses `couple.leadName` |
| Change the site title or share description | Edit `index.html`. Keep the names in the default order and spelled `Sreetam &amp; Bhavna` / `Sreetam and Bhavna`: the prerender swaps exactly those for the other order |
| Add the playlist link | Set `playlist.url`. The sleeve becomes a link with "Click here" (maroon, like every cue) |
| Change the countdown line / emphasised word | `countdown.headingLabel` and `countdown.headingEmphasis`. The last occurrence of the emphasis word is set in script + maroon. If the word is not found, the plain line is shown |
| Change a dress-code colour | Edit the hex of `--color-dress-<event>-<hue>` in `src/index.css` |
| Change the glaze speed | `animation` duration on `.palette__chip::after` (3.2s = one sweep of the row) |
| Rename a dress-code colour | Edit `label` in `src/data/eventPalettes.ts`. Keep it to **about 8 letters**, since five swatches share a phone row (~59px per column at 360px) |
| Add or replace a photograph | Crop it to the polaroid well, **492 : 501**, at **720 × 733** px, sRGB JPEG (quality ~80), with its metadata stripped (phone photos carry GPS). Save it in `src/assets/images/photos/`, list it in `content.gallery` with alt text, then point a story beat's `imageId` or a `homePhotos` slot at it. Crop by hand around the faces: `object-fit: cover` would otherwise cut a portrait photo at its middle |
| Replace a map link | `venues[].mapsUrl` (must be HTTPS) |
| Replace or add a flower photograph | Prefer a photograph published already cut out (Pixabay's transparent-background filter has sharp ones); otherwise cut one out as `src/assets/images/flowers/SOURCES.md` describes. Check the edge at 100%: a soft edge reads as blur on a white page. Save as WebP about 1000px wide in `src/assets/images/flowers/`, add it to `FLOWERS` in `Flowers.tsx` with its exact width and height, and record its source in `SOURCES.md`. A repeat of a photo already on the page must be mirrored, so the two places do not read as one picture twice |
| Regenerate social images | `npm run dev`, then `npm run rasters` (macOS) |

---

## 7. Code style

Comments explain **why** a decision was made, often citing the measurement
or the reference. Keep that density. Names are full words. Content is never
hard-coded in components.

```tsx
/**
 * A line with one word of it set apart. Falls back to the plain line when
 * there is no word to emphasise or it is not in the line, so a copy edit in
 * the content file can never make words disappear.
 */
function EmphasisedLine({ text, emphasis }: { text: string; emphasis: string | undefined }) {
  const index = emphasis === undefined || emphasis === '' ? -1 : text.lastIndexOf(emphasis)
  if (emphasis === undefined || index === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <em className="t-script countdown__emphasis">{emphasis}</em>
      {text.slice(index + emphasis.length)}
    </>
  )
}
```

- Prettier: see `.prettierrc` (no semicolons, single quotes, width 100).
- Colours: only in `index.css`, and components reference `var(--token)`.
- SVG artwork follows `src/assets/artwork/CONVENTIONS.md` (grid, three stroke
  weights, round caps, four opacity steps).
- Accessibility: decorative art is `aria-hidden`, pending facts go through
  `FactValue`, and the countdown's spoken text updates coarsely
  (`CountdownLiveText`).

## 8. Testing strategy

- **Unit (Vitest):** `lib/*` formatters and helpers, hooks (`useCountdown`,
  `useReducedMotion`, …), `FactValue`, and `validate.test.ts` (one test per
  content rule). Tests sit next to their source as `*.test.ts(x)`.
- **Build as a test:** `npm run build` runs typecheck, content validation and
  the prerender. A passing build means the shipped content is valid.
- **Visual check (manual, required for any visual change):** run the dev server
  and screenshot the affected section at **1440, 760, 390 and 320px** wide. Check
  that `document.documentElement.scrollWidth` equals the viewport width (no
  horizontal overflow) and that labels don't spill out of their columns. For
  the timeline, also check **599 and 600px**, where it switches between the
  phone and wide drawings. For the details opening screen, check the
  **height** as well: at 390×844, 1440×900 and a landscape phone (844×390),
  "Unfolding the celebrations" must be the last thing visible. Delete
  the screenshots afterwards. For routing or name-order changes, also load
  every address (§5.1) in `npm run preview` and check the title, the order of
  every visible name, and the console for hydration errors. Playwright is available through the npx cache, and
  `scripts/shoot.swift` works on macOS.

## 9. Boundaries

- **Always:** keep content in `content.ts`; keep colours in `index.css`; run
  typecheck, lint and tests before committing; check visual changes at the four
  widths above; keep the site working without scripting.
- **Ask first:** adding any runtime dependency (the policy is react + react-dom
  only); loading anything from a third-party origin at runtime; deleting the
  dormant modules left from the old panel design (`usePanelState`,
  `usePanelSlot`, `useScrollReveal`, `useActiveSection`, `useBodyScrollLock`,
  `useFocusTrap`, `lib/scrollToSection`, `lib/groupEventsByDate`); committing
  large binaries or the client decks; changing event facts that conflict with
  the brief (the decks disagree on Mehndi/Haldi times, and the brief wins).
- **Never:** hotlink images or fonts; hide a pending fact instead of rendering
  it through `FactValue`; lower the palette contrast check; commit `.env*`
  files with real values.

---

## 10. Change log

### 2026-09-20: flowers held in the envelope, groups centred (branch `real-flower-photos`, merged into `main`)

**The opened envelope holds bouquets** (`HomePage.tsx`; `index.css`
`.envelope-liner`, `.envelope-liner__bunch--*`)
- The five copies of `liner-roses` that packed the opening read as a printed
  lining, because they filled the whole diamond between the flap and the
  pocket and stopped exactly on its edges. In their place: the hand-tied
  `tray-bouquet` lying in the envelope, two cut bunches of heads leaning out
  either side of it, and a third bunch across the mouth of the pocket.
- The layering was already flap, then flowers, then pocket; what changed is
  where the flowers sit in it. The bouquet's blooms now rise onto the flap and
  its stems run down past the notch, so maroon paper shows above and around
  the arrangement and the flowers read as being *in* the envelope.
- The front bunch exists to cover the bouquet's lace tie. The tie falls above
  the notch (78.8% of the card slot), and sinking the bouquet far enough for
  the pocket to cover it takes the blooms off the flap altogether.
- The clip no longer follows the pocket's V: it is the flap's two edges above
  the fold and the envelope's full width below, so a bloom may lie on the flap
  but never outside the paper. Each bunch carries a close maroon shadow.

**Every group on the home canvas is centred** (`HomePage.tsx`, the lefts in
`at()`; `index.css` `.canvas`)
- Measured against the canvas, the groups' ink centred at 50.3, 53.3, 52.4,
  52.4 and 52.0%: the envelope group sat on the middle and everything below
  it sat right of it, which is what reading down the page showed. The lefts
  now carry a correction per group — tray 2.2%, story 2.4%, save-the-date
  2.4%, countdown 2.0% — and every group centres within 1% of the middle.
- The phone rule's `translateX(-2.2%)` on `.canvas` is gone with it: it moved
  the whole space to compensate for objects that are now centred in it.
  Measured at 320, 360, 390, 430 and 599px, the leftmost and rightmost boxes
  end 10–20px and 3–5px from the screen edges, as they did before, and there
  is no horizontal overflow at any width.
- The story group's correction took the "Our story" badge 2.4% left of the
  screen's middle, which review caught. The badge is now centred on the canvas
  exactly (`at(42.35, 40.9, 15.3)`), measured as on the screen's middle to
  within a pixel at 390, 820, 1280 and 1440px.

**The flap's crease is a gradient** (`OpenEnvelope`, `Maroon.tsx`): the shade
along the fold was a 150-unit stroke blurred by 20, which gave it two edges of
its own and read as a darker band painted across the inside of the envelope —
plain on both the home and the details pages once the flowers stopped covering
it. It is now a linear gradient over the same flap clip, transparent 260 above
the fold, 0.3 of `--color-maroon-deep` at the fold and transparent 320 below,
so the fold is the only darkest line.

**The envelope page carries a supplied posy** (`standing-posy.webp`;
`Flowers.tsx`, `EnvelopePage.tsx`, `.envelope-scene__floral`): the Pexels posy
on the sealed envelope — artificial flowers, and the one file on the site with
a soft cut edge — is replaced by a fifth photograph from the couple's Canva
template (`CA4` in `SOURCES.md`): one ranunculus, jasmine, astilbe and
eucalyptus bound in twine. It is published cut out, so it was only cropped to
its alpha box (360 × 438) and encoded; at 360px wide it still covers the
largest size it is drawn at, 359 device pixels on a 430px screen at 3×. Same
placement as before, a little larger to hold the old posy's weight: 40% of the
envelope rather than 34%, at 6%/43%. `posy.webp` is deleted.

**The details envelope holds its posy** (`DetailsPage.tsx`; `index.css`
`.details__spray`): it was laid over the whole object, so its twine and stems
ran down the front of the pocket and it read as a posy resting against the
envelope. It now sits in the envelope's own card slot, which the pocket is
drawn after, so the pocket cuts its stems — the same order that holds the home
page's bouquet. Within the slot it comes after the card, so its blooms lie
over the card's left edge and the pocket is the only thing covering any of it.
Mirrored, and about a fifth larger: 48% of the slot, which is 36% of the
envelope against 27% before. Checked at 700, 390 and 320px: the stems are cut
by the pocket's left shoulder at every width and the blooms stay on screen.

**The names card's names sit lower** (`NamesCard`, `Paper.tsx`): its head
padding went from 10% to 15% of the card's width, so the names drop about 2%
of the card's height. They were centred on all that shows of the card, but the
flap's point cuts across the foot of it, so they read as riding high.

**Checks:** typecheck, lint, 167 tests and the build pass. Screenshots of the
envelope, home and details pages at 1280, 700, 430, 390 and 320px, and
`probe-florals.html`: the envelope reads as holding flowers with no lace tie
showing, both envelopes are even maroon with no band across the inside, each
group centres, the "Our story" badge is on the screen's middle, the names sit
lower, the details posy's stems are cut by the pocket, and nothing is cropped
that was not cropped before. Screenshots deleted
afterwards.

### 2026-09-20: real flower photographs (branch `real-flower-photos`, merged into `main`)

**Why:** in review every floral prop read as the same flower (one photographed
rose stamped into drawn sprays), and none had real leaves.

**What changed** (after four review passes)
- New `components/art/Flowers.tsx`: `<FlowerPhoto photo="…">` renders one
  cut-out flower arrangement from `assets/images/flowers/`. Nine files, from
  Pexels and Pixabay (free licences, no attribution needed; what went into
  each and how, in `SOURCES.md`). Each place uses a different one (table in
  §5.2).
- Second pass, from review:
  - The envelope lining on home is the drawn sprays again, as before. The
    photographed lining did not look as good.
  - The tray's bouquet, the story strip's flowers and the "Save the Date"
    flowers are now laid **behind** the plate, the prints and the names
    envelope, so only the blooms show past them.
  - Sharper edges: the Pixabay photographs are published already cut out at
    full resolution. The card roses were cut again at 2400px with a refined
    edge (colour-keyed petals, background colour removed from edge pixels)
    instead of a feathered mask.
- Third pass, from review:
  - Four of the files are now **built from several photographs**, so each
    place shows an arrangement rather than one stock picture: the tray has a
    full bouquet (garden roses, wild roses, buds, two sprigs of blossom); the
    blossom branch rises out of a knot of roses; the "Save the Date" bank of
    small roses has cream garden roses set into it.
  - Two small sprigs (`rose-on-frame`, `wild-roses-on-frame`) are laid
    **after** the prints, so they rest on the frames' corners, one of them a
    little way onto the photograph.
  - `SOURCES.md` records the two rules that keep a composite from reading as
    a collage: crop where the surroundings are already transparent, and fade
    any edge the crop had to cut through.
- Fourth pass, from review:
  - The tray now carries a **whole hand-tied bouquet** (Pexels 28077219: white
    flowers, eucalyptus, ribbon-bound stems), its head filled out with three
    copies of the cream garden roses, because the photograph's own head had
    few roses. It is mirrored and turned so the head sits up and left of the
    plate and the stems cross its rim, as the reference the couple sent does.
    The layered cluster it replaced did not read as a bouquet.
  - The "Once" group is layered in the order the review asked for: blossom
    (the tiniest flowers) at the back, wild roses to the sides, one garden
    rose in the middle, then the print, then a crisp garden rose on top of
    the frame. That front rose is cropped past its own petals so no fade
    touches it — the earlier one looked blurred at its edge.
- Envelope page (posy) and details page (rose bunch) are as in the first pass.
- `probe-florals.html` shows the drawn sprays and then every arrangement.
- The flower files weigh about 1.1 MB in total (seven files after the fifth
  pass). Only the flowers seen on arrival load eagerly.
- The prerendered home page is **278 KB** of HTML, down from 3.9 MB on `main`:
  every drawn spray is gone from the page, the envelope's lining included, and
  those nine inline SVG sprays were almost all of that weight.

- Fifth pass, from review — **the couple's own flowers**. Three cut-out PNGs
  from the Canva template the site is modelled on were sent as download links
  and are now the site's bouquets (`SOURCES.md`, "Supplied"):
  - `tray-bouquet` is the round bouquet with the lace bow. Its six detached
    petals were dropped (they would float in mid-air behind the tray).
  - `envelope-bouquet` stands in the save-the-date envelope.
  - `tied-posy` — one ranunculus, jasmine and astilbe bound in twine — stands
    between the playlist sleeve and the invitation card (mirrored), and in
    the details envelope's left shoulder.
  - `liner-roses` is the tray's bouquet with its bow and stems cut off and
    the cut edge faded. Five copies fill the opened envelope on home, which
    ends the drawn `FloralSpray` lining: five bows in a row read as five
    bouquets, so only heads are used. The liner is clipped to the envelope's
    opening, so nothing floats outside the paper. (Review replaced this
    arrangement later the same day — see the entry above.)
  - The "Once" print now carries the "A time" pair mirrored, as review asked;
    `blossom-branch`, `rose-on-frame`, `rose-cluster` and `rose-bunch` are
    deleted. A repeated photograph is always mirrored (§5.2).
  - **The playlist stands in the invitation card's column**: the sleeve's left
    edge and the record's right edge sit on the card's two edges
    (`at(51.1, 0.6, 22.6)`; the record overhangs its own box by 3.5%). It is
    drawn *before* the envelope now, so the envelope's shoulder covers the
    corner where they meet.
  - **The names card is no longer plain** (`NamesCard`, `Paper.tsx`): it
    carries the invitation card's own frame — the same double rule and corner
    filigree — drawn at the envelope slot's proportion (300 × 318) so nothing
    is stretched. Its foot is padded 46%, because the bottom of the card is
    behind the pocket and the names have to centre in what shows; its head is
    padded 15%, a little deeper than that arithmetic asks, because the flap's
    point cuts across the foot of what shows.

**Checks:** typecheck, lint, 167 tests and the build pass. Screenshots of the
envelope, home and details pages at 1440, 760, 390 and 320px: no horizontal
overflow, the flowers behind the story prints stay on screen on phones, and
the blossom does not cross the "Our story" label. `npm run preview` at `/`,
`/home/`, `/details/` and `/bhavnaandsreetam/home/`: no console errors,
every flower image loads, and the prerendered HTML carries the `<img>` tags,
so they show without scripting. Screenshots deleted afterwards.

**Left alone:** the envelope-page posy's source is artificial flowers and its
edge is softer than the new ones; it was not flagged in review, so it stays
until asked. (It was replaced by a supplied posy later the same day — see the
entry above.)

### 2026-09-20: story words before photographs on phones (branch `story-words-first`, merged into `main`)

**Story page, below 700px** (`index.css` `.route__stop`, `.route__print`,
`.route__label`)
- Each stop now shows its label, place and sentence first, then the
  photograph. The heart stays in the photograph's row. Before, the photograph
  came first.
- Spacing: the label lost its 12px top margin, and the print gained 14px
  above it. From 700px up the print resets to no margin, so the wide route is
  unchanged.
- Checked at 320, 390, 760 and 1440px: phones show words then print, 760 and
  1440 look the same as before. Lint and 167 tests pass, and so does the build.
  Screenshots deleted afterwards.
- Two comments in `index.css` that said the words sit "under" the print now
  describe them without a position, since that depends on the width.

### 2026-09-20: review round 3 (branch `review-round-3`, merged into `main`)

**Home on a phone is zoomed in, with the record in frame** (`index.css`
`.canvas`, `.canvas > .playlist`; `HomePage.tsx` `PlaylistDoor`)
- The phone zoom went from 165% to 180% of the screen width (the ramp's
  multiplier from 1.3 to 1.6, so it still reaches full zoom at 600px). The
  shift went from −2.3% to −2.2%.
- At 165% the record already sat within ~4px of the edge on some screens,
  and at 180% it ran off. The sleeve (both the plain piece and the link
  version) now has the class `playlist` and moves 2.5% of the canvas left
  below 900px.
- Measured at 320, 360, 390, 430 and 599px: the envelope's box and the
  record's box each end 10–18px from the screen edges; only the decorative
  sprig at 23.9% is cropped (3–6px). No horizontal overflow at any width.
  At 900px and up nothing changed.

**BHUBANESWAR in maroon** (`.card__where`): the city on the home page's
invitation card is `var(--color-maroon)`, measured equal to the countdown's
"yes": `rgb(91, 26, 34)`. It was ink-soft.

**No white line round the photographs** (`Maroon.tsx` `Polaroid`)
- The SVG well under each photograph was a pale silver-to-cream gradient.
  The photograph is HTML laid over it, and where the two antialias, on a
  tilted print especially, the pale well showed as a hairline. The well is
  now `var(--color-maroon-deep)`, so the same pixels read as the shadow of
  the recess. The unused `-well` gradient was removed.
- Measured on the story page at 390px (3× pixels): pale pixels directly
  under the maroon frame went from 13–85 per print to 0–13, and the ones
  left are white in the photographs themselves. The home page's eight
  prints were checked the same way.

**New times** (`content.ts`): Mehndi 18:00, Haldi 10:30, Sangeet 19:00
(unchanged), Marriage 11:00. The countdown target moved with the marriage
ceremony to `2026-12-13T11:00:00+05:30` (validation requires the two to
match). Checked on the details page: "6:00 PM, 10:30 AM, 7:00 PM, 11:00 AM"
in both Date and Location and the timeline.

**Dress code: smaller chips with a moving glaze** (`index.css`
`.palette__swatches`, `.palette__chip`, `@keyframes swatch-glaze`;
`DetailsPage.tsx` sets `--i` on each chip)
- Chips are 40px, down from 48px (`--chip-size`).
- A diagonal band of light (118°, paper at 62% at its centre) crosses each
  row from the first colour to the last, in all four rows together, at a
  medium 3.2s per sweep. How it is built is in §5.7.
- Checked by pausing the animations and stepping through the cycle at 390
  and 1440px: the band lights chip 1, 2, 3, 4, 5 in order, in the same
  column in every row, and all 20 animations share one start time.

**Checks:** typecheck, lint, 167 tests and the build all pass. Screenshots at
1440, 760, 390 and 320px (home, details, story), no horizontal overflow, and
no console or hydration errors in `npm run preview` on home, details and
story, including `/bhavnaandsreetam/`. Screenshots deleted afterwards.

### 2026-09-20: cue colour and name order by address (branch `name-order`, merged into `main`)

**Every cue in the maroon of "yes"** (`index.css`, `EnvelopePage.tsx`)
- "Click here" (`.oval__cue`, `.sleeve__cue`), "Tap to open" (new
  `.envelope-scene__cue`) and "← Back to …" (`.back-link`) are now
  `var(--color-maroon)` (`#5b1a22`), the colour of the countdown's "yes"
  (`.countdown__emphasis`). They were ink-soft or ink before.
- `.back-link` used to turn maroon on hover. Since it is maroon at rest, hover
  now underlines it instead (1px, offset 0.35em).
- The sleeve's "Click here" only shows once `playlist.url` is set, so it is not
  visible yet.

**Name order chosen by the address** (`routes.ts`, `hooks/useRoute.ts`,
`App.tsx`, `HomePage.tsx`, `lib/coupleNames.ts`, `types.ts`,
`entry-server.tsx`, `scripts/prerender.mjs`, `index.html`)
- Pages moved from hash addresses (`#/home`) to paths (`/home/`), with an
  optional order prefix: `/bhavnaandsreetam/…` or `/sreetamandbhavna/…`
  (§5.1). Paths were chosen over a hash prefix (`#/bhavnaandsreetam/home`)
  because a hash never reaches the server. With a hash, every link would
  load the one prerendered file in the default order: the bride's side would
  see "Sreetam & Bhavna" first and then watch it swap, and the WhatsApp
  preview would always read "Sreetam & Bhavna". A query parameter has the same
  problem.
- `useHashRoute` was replaced by `useRoute`. `coupleNames`, `coupleInitials`
  and `coupleMonogram` take an optional lead. New type `LeadName`.
- The home page's invitation card set `groomName` then `brideName` directly,
  so it ignored `leadName`. It now takes the ordered pair from `App`.
- The prerender now writes 12 files instead of 1 (§5.8). Old `#/home` links
  still work.
- Tests: `routes.test.ts` (16), `coupleNames.test.ts` (3), `App.test.tsx`
  (8: every page in every order leads with the right name, seal initials,
  card order, the envelope opening keeps the prefix, the back button, and an
  old hash link).
- Checked in `npm run preview` at 1440, 760, 390 and 320px: all 12 addresses
  have the right title, every visible name leads with the chosen one, no
  horizontal overflow, and no console or hydration errors. At 390 and 1440px,
  the envelope → home → details → back → story flow keeps
  `/bhavnaandsreetam/`, the browser back button works, `/#/details` opens
  details, and `/bhavnaandsreetam/home` gets its slash added. The cue colours
  were measured equal to the "yes": `rgb(91, 26, 34)`. The dev server was also
  checked at `/bhavnaandsreetam/home`.

### 2026-09-19: the couple's photographs and the closing message (branch `photographs`, merged into `main`)

**Every polaroid now holds a real photograph** (`content.ts`, `types.ts`,
`HomePage.tsx`, `StoryPage.tsx`, `PrintFill.tsx`, `lib/photoUrl.ts`,
`validate.ts`)
- The client's files in `website-pics/` are named after their placeholders.
  They were matched as: `home_invitation` → the polaroid beside the invitation
  card; `home_details_1–3` → the three under the tray, top to bottom;
  `home_ourstory_1–3` → "Once", "Upon", "A time"; `home_below_savethedate` →
  the polaroid beside Save the Date; `ourstory_1–7` → the seven story beats in
  order (college, reply, common ground, proposal, Christmas, New Year,
  engagement).
- Each was cropped to the well (492 : 501) at 720 × 733, with a focal point
  chosen per photo, converted to sRGB, and saved without metadata: 15 files,
  27–143 KB each, ~1.2 MB in all. HEIC files were rotated by their EXIF
  orientation first. `home_details_1` was cropped 14% tighter to remove the
  carousel arrows left from an Instagram screenshot.
- Review: the client swapped the second tray photograph for
  `home_details_2_alt.JPG` (henna cones on a brass tray, previously
  `IMG_7851`). It is also an Instagram screenshot, with the like and comment
  counts down its right edge past 88% of the width, so it is cropped to the
  left 86% (centre x 0.43, y 0.45). It is still `home-details-2.jpg`, and the
  alt text was rewritten to match.

**Story page: "Message for you"** (`content.ts`, `.story__message-text`)
- `story.closingMessage` changed from pending to the client's message: "As
  our beautiful journey turns the page to forever, we couldn't imagine taking
  this next big step without you. Please gather with us to celebrate this new
  beginning and shower our day with your love, blessings, and positivity."
- It keeps the box's existing small letterspaced caps. `text-wrap: balance`
  was added because the plain wrap left "positivity." alone on the last line
  at 1440px. Checked at 1440, 760, 390 and 320px: 4 to 7 even lines, no
  overflow.
- New content field `homePhotos` (slot → image id) and type `HomePhotoSlot`.
  `GalleryImage.src` is now a repo path, resolved by `photoUrl()`. The story
  page's own `StoryPrint` became the shared `PrintFill`, and `.route__fill`
  became `.print-fill`.
- New checks: gallery files must be in the photo folder and on disk, and
  `homePhotos` must point at real images. Four tests added.
- Checked at 1440, 760, 390 and 320px on home and story: all 15 photographs
  load, no stand-ins remain, no horizontal overflow, no page errors. The
  largest print shows at ~283px (home, 1440px), so 720px covers a 2× screen.

### 2026-09-19: review round 2 (branch `review-round-2`, merged into `main`)

**"INVITATION" in bold** (`.card__kicker`, home page card): weight 700, up
from the label weight of 500.

**Details page: the fold falls under the caption** (`DetailsPage.tsx`,
`.details__opening`, `.details__envelope`)
- The title, the script line, the envelope and "Unfolding the celebrations" are
  wrapped in `.details__opening`, which is at least `100svh` tall. The column's
  top padding moved into it. The envelope container is `flex: 1` and
  `container-type: size`. The envelope itself (420 × 470) is
  `min(82cqw, 420px, 100cqh × 420/470)` wide, or 92cqw below 600px, so it fits
  whichever dimension runs out first. Vertical gaps use `svh`.
- Checked at 320×568, 360×640, 390×844, 430×932, 768×1024, 1000×570,
  1440×900 and 1920×1080. In each, the caption is the last thing on screen and
  "Date and Location" starts below the fold. Landscape phones (667×375,
  844×390) also fit, with the envelope at its 140px minimum height.

**"You are invited" written out on load** (`.details__written`, `@keyframes
pen-write`)
- A left-to-right mask with a short soft edge, in one steady stroke over 2.2s,
  starting 380ms after load. It is not a letter-by-letter typing effect,
  because Great Vibes joins its letters and splitting it into spans would
  break the joins. Pauses between words were tried and removed: the client
  said they made the page feel like it was lagging. The span is padded so the
  swashes stay inside the mask.
  Guarded by `html.js`. Turned off for reduced motion.

**Timeline: the winding route on phones too** (`Paths.tsx`, `DetailsPage.tsx`,
`.schedule*`)
- New `SCHEDULE_NARROW` route spec with heavier marks in box units, wider cards
  (0.42), and a longer drop (470). `scheduleRouteNodes`,
  `scheduleRouteViewBox`, `ScheduleRoute` and `SCHEDULE_ROUTE_LAYOUT` now take
  a layout (`'wide' | 'narrow'`). Each stop gets `--stop-y-wide` and
  `--stop-y-narrow`, and CSS picks one of them.
- Below 600px the date and time go on two lines (`.schedule__date` /
  `.schedule__time`, with the `·` hidden), and the route takes back up to 12px
  of the column's side padding. The straight rail and the per-stop
  `HeartMark` were removed from the details page. The story page still uses
  `HeartMark`.
- The wide layout now starts at 600px instead of 700px. At 600–699px the
  phone drawing's line looked too heavy when scaled up that far.

### 2026-09-19: review round 1 (copy, dress code, typography)

**Copy**
- Playlist sleeve: removed the "To be confirmed" caption under "Playlist". While
  `playlist.url` is pending, the sleeve shows only its title. Once a URL exists
  it becomes a link with the "Click here" cue. (`HomePage.tsx`, `PlaylistDoor`)
- Countdown card: the closing line (`footer.message`) changed from pending to
  **"Can't wait to celebrate with you"**. It displays in caps via
  `.countdown__contact`. (`content.ts`)
- Details page: `invitation.message` changed from pending to **"Unfolding the
  celebrations"**. (`content.ts`)

**"Unfolding the celebrations" styling** (`.details__message` in `index.css`)
- Moved up from prose size to `clamp(1.1rem, 0.62rem + 2.4vw, 2.2rem)`, in full
  ink colour, with a 1px gold-deep hairline on each side
  (`::before`/`::after`, fading outward).
- An italic version was tried and rejected by the client. It stays in upright
  Cormorant.
- Always one line (`white-space: nowrap`). The size scales with the viewport and
  was checked to fit at 320px.

**Dress-code colours** (`index.css` tokens `--color-dress-*`,
`eventPalettes.ts` swatches)
- The swatches now show the couple's chosen dress code instead of the colours
  measured from the decor. They have their own token block. The decor tokens
  still drive each palette's `ground`/`text` (contrast check) and are
  otherwise unchanged.
- Labels are English and deliberately non-generic, each set drawing on one
  theme:

| Function | Swatches (label: hex) |
|---|---|
| Mehndi | Juniper `#2f6b3a` · Pistachio `#9caf88` · Peony `#e58fac` · Poppy `#b01e2f` · Peacock `#2c5aa0` |
| Haldi | Daffodil `#f5c518` · Ochre `#cf9a1b` · Marigold `#f07f1e` · Bluebell `#a8cdea` · Azure `#3d85c6` |
| Sangeet | Topaz `#e3cf9f` · Platinum `#c3c6cb` · Amethyst `#5e2b87` · Garnet `#a8182e` · Emerald `#0e7a52` |
| Marriage | Pearl `#f6f2e7` · Buttercup `#f7e59b` · Chambray `#9dbbe0` · Wisteria `#c8a8d8` · Celadon `#9cc5a1` |

- History: the first pass used plain names (Green, Sage…), with Haldi ending in
  Sky/Cerulean/Cobalt. Cobalt was then replaced by a mustard (Ochre). The
  second pass used Hindi names (Tulsi, Sarson…), which the client rejected in
  favour of English. Sunflower, Champagne, Moonstone and Hydrangea were swapped
  for shorter names because they spilled out of their columns at 360px.

**Date and Location names on one line** (`.functions__item`,
`.functions__item .function-name__title`)
- `.functions__item` is now an `inline-size` container. The title is `nowrap` at
  `min(clamp(0.92rem, 0.84rem + 0.35vw, 1.08rem), 11.5cqi)`. "Touched by
  Turmeric" is about 9.2× its font size wide, so at 11.5cqi it can run a few
  pixels into the column gutter. It is centred, so it never reaches a
  neighbour. On desktop the size is unchanged (~17px).

**Countdown "yes"** (`types.ts`, `content.ts`, `HomePage.tsx`, `index.css`)
- New optional content field `countdown.headingEmphasis` (`'yes'`).
  `EmphasisedLine` sets that word in Great Vibes, maroon, `1.9em`,
  `line-height: 0` (`.countdown__emphasis`).

**Numerals: Cinzel for every digit** (`index.css`, `assets/fonts`)
- Cormorant's old-style figures (a descending 4 and 9, 1 and 0 at x-height)
  looked uneven in the countdown and dates. Six candidates were compared
  (Cormorant, Marcellus, Playfair Display, Bodoni Moda, Cinzel, Gilda Display,
  Libre Caslon Display). **Cinzel** was chosen: even-height engraved figures
  that sit well next to Cormorant, and a variable 400–900 range that covers
  every weight in use.
- Added `src/assets/fonts/cinzel-variable-latin.woff2` (26 KB, Google Fonts
  latin subset, OFL; listed in `LICENSES.md`). It is declared as `Cinzel
  Figures` with `unicode-range: U+0030-0039` and put first in the display and
  body stacks, so only digits change. Colons and letters stay in Cormorant.
  (Not subset to digits only, because `fonttools` was not installed.
  `pyftsubset --unicodes=U+0030-0039` would shrink it further.)

**Repository**
- First commit. The stray root files `100` and `270` (tiny PNGs from a shell
  redirect) were deleted. Large reference binaries are git-ignored (§4).

---

## 11. Open questions / next steps

- Dress-code labels spill past their column at 320px (Pistachio, Daffodil,
  Marigold, Platinum, Amethyst, Buttercup, Chambray) and Buttercup does by a
  hair at 1440px. This was already so before round 3, and it is centred, so
  it runs into the gutter rather than into a neighbour. Not changed.

- `standing-posy` (envelope page) and `tied-posy` (home and details) are the
  same posy arranged differently, and a guest meets them on consecutive
  screens. Both are the couple's own flowers, so they stay unless asked.
- Playlist URL and "hosted by" lines are still pending.
- `public/og-image.png` (the WhatsApp preview picture) has "Sreetam & Bhavna"
  drawn into it, and it is from the earlier design. Links from
  `/bhavnaandsreetam/` get the right title but this same picture. The
  `raster-og.html` page that `npm run rasters` expects no longer exists.
  Options: a new picture with no names in it, or one picture per order.
- Hosting is not chosen yet. Whichever host is used, check that
  `/bhavnaandsreetam/home/` serves `dist/bhavnaandsreetam/home/index.html`.
  There is no 404 page: an unknown path is a host 404.
- `website-pics/IMG_6590.HEIC` (a selfie in the cold) matches no placeholder
  and is unused. `home_details_2.PNG` (the mehndi lounge) was replaced by
  `home_details_2_alt` and is also unused.
- Replace the venue map searches with exact pins.
- Optional: subset the Cinzel file to digits only. Remove the unused Marcellus
  font and the dormant hooks (ask first).
- On-device checks from the handover (screen readers, Lighthouse, WhatsApp
  preview, Android Devanagari) are still to do after deploy.
