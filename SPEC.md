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

A static, single-file wedding invitation site for **Sreetam & Bhavna**, 11–13
December 2026, Bhubaneswar. Most guests will open it from a WhatsApp link on a
phone.

- **Theme:** *Mangal Sutra* (मंगल सूत्र). Tagline: "Bound by rituals, crafted by
  devotion, celebrated forever." Hashtag: `#SreekomilaBhav`.
- **Four functions:**

| id | Name | Title on site | Date | Time | Venue |
|---|---|---|---|---|---|
| `mehndi` | Mehndi | The Henna Garden | 2026-12-11 | 19:00 | Hotel Suraj Palace, Patia Road |
| `haldi` | Haldi | Touched by Turmeric | 2026-12-12 | 10:00 | Aura Lawns, Patia |
| `sangeet` | Sangeet | Strings & Songs | 2026-12-12 | 19:00 | Aura Lawns, Patia |
| `marriage` | Marriage | Bound by Thread | 2026-12-13 | 10:00 | Greenland Resort, Patia |

- **Countdown target:** `2026-12-13T10:00:00+05:30` (the marriage ceremony, IST).
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
- Works with scripting disabled, because the HTML is prerendered.
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
| Routing | Hash routes, no router library (`src/routes.ts`, `useHashRoute`) |
| Hosting | Any static host over HTTPS. Output is `dist/` |

## 3. Commands

```bash
npm install
npm run dev          # Vite dev server, http://localhost:5173
npm run typecheck    # tsc for app + node configs
npm run lint         # eslint .
npm test             # vitest run (140 tests at time of writing)
npm run build        # typecheck → client build → SSR build → prerender into dist/index.html
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
index.html                 Document shell, meta/OG tags, sets html.js before the bundle loads
vite.config.ts             React + Tailwind + content-validation plugin + absolute OG URLs
scripts/
  validate-content.ts      Vite plugin: runs validateContent() at build start and fails the build on errors
  prerender.mjs            Injects the SSR markup into dist/index.html, deletes dist-ssr/
  render-rasters.swift     Renders og-image.png / favicon.png / apple-touch-icon.png (macOS WebKit)
  shoot.swift              Screenshot helper (URL, width, height, out, scrollY)
public/                    favicon.png, apple-touch-icon.png, og-image.png (committed rasters)
probe-*.html               Dev-only pages that mount src/probes/* for inspecting artwork in isolation
resc/docs/                 Original brief, spec, plan, execution log, handover (historical)
src/
  main.tsx                 Hydrates prerendered markup, or renders fresh in dev
  entry-server.tsx         renderToString(<App/>) for the prerender step
  App.tsx                  Chooses the page from the hash. The only place pages are composed
  routes.ts                PAGES = envelope | home | details | story; #/<page>
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
                           tray, key, earrings), Paper (embossed card, ovals, stamps), Florals, Vinyl,
                           Ornament, Paths (dashed route lines + hearts), LineIcons, PlaceIcons,
                           PhotoStandIn, geometry.ts. CONVENTIONS.md = SVG authoring rules
  hooks/                   useHashRoute, useCountdown, useReducedMotion, useStagedReveal (+ dormant, see §9)
  lib/                     isPending/knownValue, formatDate, formatDuration, coupleNames, arrival,
                           photoUrl (gallery path → bundled URL, via import.meta.glob), …
  probes/                  Isolated artwork viewers used by probe-*.html
  assets/fonts/            Vendored woff2 + LICENSES.md + OFL.txt
  assets/images/           background-hands.jpg, white-rose.png
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

### 5.1 Pages and navigation

Four pages, addressed by hash so the whole site stays one static HTML file:

| Hash | Page | Reached from |
|---|---|---|
| `#/envelope` (default) | `EnvelopePage` | first load. Opening the envelope goes to home after ~760ms (160ms with reduced motion) |
| `#/home` | `HomePage` | the envelope. "← Back to envelope" at the bottom |
| `#/details` | `DetailsPage` | the silver tray / "The Details" oval on home |
| `#/story` | `StoryPage` | the photo strip / "Our story" oval on home |

`useHashRoute` reads `location.hash` through `useSyncExternalStore`, so the
browser's back button works. On the server it returns the default page. No
page imports another page.

### 5.2 Home: the absolute canvas

`HomePage` copies the reference layout exactly. It uses one canvas with a fixed
ratio (812 × 2100), and every object is placed with
`at(left%, top%, width%)`. Positions were measured off the reference
screenshot. Type inside the canvas is sized in container-query units (`cqw`), so
the whole drawing scales as one piece instead of reflowing.

Objects, top to bottom: the opened envelope with roses and the wax seal, the
**playlist sleeve** (a link only when `playlist.url` is known; otherwise it
shows just "Playlist" with no caption), a polaroid, **door one** (the spinning
silver tray + key, going to Details), **door two** (the story photo strip,
going to Story), Save the Date with a polaroid, and the **countdown card**
(Countdown, "Until we say *yes*", "With love and gratitude", names, closing
line, wax seal, back link).

Every polaroid on the canvas holds a photograph. `content.homePhotos` maps
each slot to a gallery image id: `invitation` (beside the card), `details-1`
to `details-3` (under the tray, top to bottom), `story-1` to `story-3` (the
"Once", "Upon", "A time" strip) and `save-the-date`. A slot left out shows
the drawn stand-in. Only `invitation` loads eagerly; the rest are lazy.

Groups of objects move together. Change the space *between* groups rather than
moving a single object (see the comment on `at()`).

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
   `eventPalettes.ts`.
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
- `useReducedMotion` turns staging off, and CSS respects
  `prefers-reduced-motion`.

### 5.8 Build pipeline

1. `validateContentPlugin` imports `content.ts`, reads the real hex values of
   `--color-*` tokens from `index.css`, and runs `validateContent`. Any failure
   stops the build with a field path and a message.
2. Client build to `dist/`, SSR build of `entry-server.tsx` to `dist-ssr/`.
3. `prerender.mjs` renders `<App/>` to a string, injects it into
   `dist/index.html`, and deletes `dist-ssr/`. `main.tsx` then hydrates.
4. `absoluteSocialUrls` rewrites `og:image` / `og:url` using `VITE_SITE_URL`.
   It warns if the variable is not set.

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
| Add the playlist link | Set `playlist.url`. The sleeve becomes a link with "Click here" |
| Change the countdown line / emphasised word | `countdown.headingLabel` and `countdown.headingEmphasis`. The last occurrence of the emphasis word is set in script + maroon. If the word is not found, the plain line is shown |
| Change a dress-code colour | Edit the hex of `--color-dress-<event>-<hue>` in `src/index.css` |
| Rename a dress-code colour | Edit `label` in `src/data/eventPalettes.ts`. Keep it to **about 8 letters**, since five swatches share a phone row (~59px per column at 360px) |
| Add or replace a photograph | Crop it to the polaroid well, **492 : 501**, at **720 × 733** px, sRGB JPEG (quality ~80), with its metadata stripped (phone photos carry GPS). Save it in `src/assets/images/photos/`, list it in `content.gallery` with alt text, then point a story beat's `imageId` or a `homePhotos` slot at it. Crop by hand around the faces: `object-fit: cover` would otherwise cut a portrait photo at its middle |
| Replace a map link | `venues[].mapsUrl` (must be HTTPS) |
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
  the screenshots afterwards. Playwright is available through the npx cache, and
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

- Playlist URL and "hosted by" lines are still pending.
- `website-pics/IMG_6590.HEIC` (a selfie in the cold) matches no placeholder
  and is unused. `home_details_2.PNG` (the mehndi lounge) was replaced by
  `home_details_2_alt` and is also unused.
- Replace the venue map searches with exact pins.
- Optional: subset the Cinzel file to digits only. Remove the unused Marcellus
  font and the dormant hooks (ask first).
- On-device checks from the handover (screen readers, Lighthouse, WhatsApp
  preview, Android Devanagari) are still to do after deploy.
