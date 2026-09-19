# Wedding Invitation — Executable Task Breakdown

**Document:** `resc/docs/4-exec.md`
**Implements:** `resc/docs/3-plan.md`
**Revised:** Tasks 166–219 re-cut for the client brief in `1-details.md`, which replaced the event card grid with a full-page scroll journey. Tasks 1–165 are unchanged and complete.
**Root:** `/Users/sreetam/code/wedding-invitation`

Each task is independently implementable, touches the fewest files that make sense, and carries one concern. Tasks are ordered so that every dependency is already satisfied when a task begins.

**Per task:** `Files` — what to create or edit · `Do` — the single change · `Done` — how to know it worked.

**Naming rule for this build:** no function, component, variable, CSS class, test name or file name may encode a specification rule identifier. Names describe behaviour. Specification traceability lives in this document and in commit messages, never in source symbols.

---

## Phase 0 — Foundation & tokens (Tasks 1–25)

**Task 1: Scaffold the Vite + React + TypeScript project**
- Files: `package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`
- Do: Initialise Vite with the React + TypeScript template. Install `react` and `react-dom` as the only runtime dependencies.
- Done: `npm run dev` serves a blank page with no console errors.

**Task 2: Enable strict TypeScript**
- Files: `tsconfig.json`
- Do: Turn on `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- Done: `npx tsc --noEmit` exits zero.

**Task 3: Install and configure Tailwind**
- Files: `package.json`, `src/index.css`, `vite.config.ts`
- Do: Add Tailwind 4 as a dev dependency and wire its Vite plugin. No theme values yet.
- Done: A Tailwind utility class applied in `App.tsx` takes effect.

**Task 4: Add the npm script set**
- Files: `package.json`
- Do: Define `dev`, `build`, `preview`, `typecheck`, `lint`, `test`.
- Done: Each script runs and exits zero on the empty project.

**Task 5: Configure ESLint and Prettier**
- Files: `eslint.config.js`, `.prettierrc`, `package.json`
- Do: TypeScript and React-hooks rules; Prettier for formatting. Add a lint rule banning raw hex colour literals in `src/`.
- Done: `npm run lint` passes; introducing a hex literal fails it.

**Task 6: Set up the test runner**
- Files: `vitest.config.ts`, `package.json`
- Do: Add Vitest with jsdom and Testing Library. One trivial passing test to prove wiring.
- Done: `npm run test` passes.

**Task 7: Create the directory skeleton**
- Files: `src/data/`, `src/lib/`, `src/hooks/`, `src/components/{layout,a11y,artwork,countdown,events,signatures,gallery,sections}/`, `src/assets/{artwork,images,fonts}/`, `scripts/`, `public/`
- Do: Create the empty directory tree with a `.gitkeep` in each.
- Done: Tree matches the plan's layout section.

**Task 8: Define the palette custom properties**
- Files: `src/index.css`
- Do: Declare `--color-maroon`, `--color-deep-red`, `--color-mauli-orange`, `--color-antique-gold`, `--color-ivory`, `--color-sand-beige`, `--color-haldi-turmeric` on `:root` with the specified hex values. This is the only file in the project containing colour hex literals.
- Done: Values resolve in DevTools on `:root`.

**Task 9: Map the Tailwind theme onto the palette properties**
- Files: `src/index.css`
- Do: Point Tailwind's colour theme at the custom properties via `@theme`. Do not restate any hex value.
- Done: `bg-maroon` renders the palette maroon; changing the custom property changes the utility.

**Task 10: Define the illustration tokens**
- Files: `src/index.css`
- Do: Declare three stroke-width properties (hairline, standard, emphasis) and four opacity-step properties (background, mid, foreground, focal).
- Done: All seven resolve on `:root`.

**Task 11: Define the layout tokens**
- Files: `src/index.css`
- Do: Declare content max-width, the three gutter values, the two vertical-rhythm values, and the card border radius.
- Done: All resolve on `:root`.

**Task 12: Add the global reset**
- Files: `src/index.css`
- Do: Set `color-scheme: light`, zero body margin, explicit body background, `img { max-width: 100% }`, `[hidden] { display: none !important }`, `box-sizing: border-box`.
- Done: A bare page renders on the ivory ground with no default margin.

**Task 13: Apply safe-area insets to the root**
- Files: `src/index.css`
- Do: Pad `:root` top and bottom with the environment safe-area insets, with a zero fallback.
- Done: Content clears the notch in an iOS simulator at the top and the home indicator at the bottom.

**Task 14: Set the viewport and colour-scheme meta tags**
- Files: `index.html`
- Do: Add the viewport meta with `viewport-fit=cover`, and a `color-scheme` meta of `light`.
- Done: Present in the served document head.

**Task 15: Vendor the open-licence font files**
- Files: `src/assets/fonts/`
- Do: Add subset `woff2` files for the display face, the Devanagari face and the body face, plus their licence files.
- Done: Files present; licences included alongside them.

**Task 16: Declare the font faces**
- Files: `src/index.css`
- Do: Write `@font-face` blocks for the three faces with `font-display: swap` and correct `unicode-range` per face.
- Done: Network panel shows each face fetched once, from the site's own origin.

**Task 17: Define the three font stacks as custom properties**
- Files: `src/index.css`
- Do: Declare display, Devanagari and body stacks, each ending in a system serif fallback chain.
- Done: Removing the vendored files still yields readable serif text.

**Task 18: Tune the fallback font metrics**
- Files: `src/index.css`
- Do: Add `size-adjust`, `ascent-override` and `descent-override` to each fallback so the swap causes no reflow.
- Done: Recording a page load with fonts throttled shows no layout shift attributable to the swap.

**Task 19: Build the fluid type scale**
- Files: `src/index.css`
- Do: Express each role in the type scale as a `clamp()` utility with the specified mobile and desktop bounds.
- Done: Heading sizes interpolate smoothly between 390 px and 1440 px.

**Task 20: Build the Container component**
- Files: `src/components/layout/Container.tsx`
- Do: Apply max-width, centring and the three responsive gutters. Side padding is set here and nowhere else.
- Done: Content keeps at least a 20 px side gutter at 320 px.

**Task 21: Build the Section component**
- Files: `src/components/layout/Section.tsx`
- Do: Render a `<section>` with `aria-labelledby` pointing at its own heading, plus vertical rhythm. Wraps Container.
- Done: Rendered markup exposes a labelled region to accessibility tooling.

**Task 22: Build the VisuallyHidden component**
- Files: `src/components/a11y/VisuallyHidden.tsx`
- Do: Clip content visually while keeping it in the accessibility tree.
- Done: Text is invisible on screen and read by a screen reader.

**Task 23: Build the SkipLink component**
- Files: `src/components/a11y/SkipLink.tsx`
- Do: A link that is hidden until focused and jumps to the main landmark.
- Done: First Tab press on a loaded page reveals it; activating it moves focus into main content.

**Task 24: Build a plain Divider component**
- Files: `src/components/layout/Divider.tsx`
- Do: A horizontal gold rule using the palette token. Ornamental artwork is added later.
- Done: Renders between two blocks at the correct colour and weight.

**Task 25: Verify the typography foundation with no font files**
- Files: none (verification)
- Do: Temporarily empty the font directory and load a page containing Latin text and the Devanagari theme title on macOS, Windows and Android.
- Done: Both scripts render in a real serif with no missing-glyph boxes and no layout shift. Restore the files.

---

## Phase 1 — Data layer & pure logic (Tasks 26–60)

**Task 26: Declare the scalar and sentinel types**
- Files: `src/data/types.ts`
- Do: Declare the ISO date, ISO time, ISO instant and the pending-value sentinel types.
- Done: Types compile and are exported.

**Task 27: Declare the Venue type**
- Files: `src/data/types.ts`
- Do: Add the venue shape: id, name, address lines, city, maps URL, optional coordinates.
- Done: Compiles.

**Task 28: Declare the signature identifier and event types**
- Files: `src/data/types.ts`
- Do: Add the signature identifier union (five members) and the event shape, with the signature field required.
- Done: An event literal omitting the signature fails type checking.

**Task 29: Declare the countdown configuration type**
- Files: `src/data/types.ts`
- Do: Add target instant (or sentinel), heading label and completed message.
- Done: Compiles.

**Task 30: Declare the story and gallery types**
- Files: `src/data/types.ts`
- Do: Add story beat and gallery image shapes, with intrinsic dimensions and required alt text.
- Done: Compiles.

**Task 31: Declare the root content type**
- Files: `src/data/types.ts`
- Do: Assemble the root shape. Hero image id is optional; gallery may be empty.
- Done: A content object with no hero image and an empty gallery type-checks.

**Task 32: Author the couple, theme and hero content**
- Files: `src/data/content.ts`
- Do: Fill in the two names, the hashtag, the theme title in both scripts, and the tagline. Omit the hero image id.
- Done: Type-checks against the root type.

**Task 33: Author the venue entries**
- Files: `src/data/content.ts`
- Do: Add the two known venues by name with pending sentinels for address, city and maps URL.
- Done: Type-checks.

**Task 34: Author the event entries**
- Files: `src/data/content.ts`
- Do: Add the four functions with known dates and venue references, pending start times, and one distinct signature identifier each.
- Done: Type-checks; no signature identifier repeats.

**Task 35: Author the countdown configuration**
- Files: `src/data/content.ts`
- Do: Set the target to the pending sentinel; write the heading label and completed message.
- Done: Type-checks.

**Task 36: Author the story and footer content**
- Files: `src/data/content.ts`
- Do: Add the story heading with pending beat bodies, and pending footer message and host lines.
- Done: Type-checks.

**Task 37: Author an empty gallery**
- Files: `src/data/content.ts`
- Do: Set the gallery to an empty array — the default configuration until photographs exist.
- Done: Type-checks.

**Task 38: Implement pending-value detection**
- Files: `src/lib/isPending.ts`
- Do: A single predicate returning whether a value is the pending sentinel. The only place the sentinel string appears outside the content file.
- Done: Exported and typed as a type guard.

**Task 39: Test pending-value detection**
- Files: `src/lib/isPending.test.ts`
- Do: Cover the sentinel, empty string, zero, null, undefined and a normal string.
- Done: Tests pass; a normal string returns false.

**Task 40: Validate referential integrity**
- Files: `src/data/validate.ts`
- Do: Check every event's venue reference, every story beat's image reference and the hero image reference resolve. Return messages naming the offending field path.
- Done: Breaking a reference produces a message naming it.

**Task 41: Validate identifier uniqueness**
- Files: `src/data/validate.ts`
- Do: Check ids are unique within venues, events, story beats and gallery images.
- Done: A duplicate id is reported with both locations.

**Task 42: Validate required collections and alt text**
- Files: `src/data/validate.ts`
- Do: Require a non-empty event list; require every gallery image to carry alt text of at least three characters. Permit an empty gallery.
- Done: An empty gallery passes; a blank alt fails.

**Task 43: Validate date and time formats**
- Files: `src/data/validate.ts`
- Do: Check each date parses as a real calendar date and each start time matches a 24-hour pattern.
- Done: An impossible date such as the thirty-first of February fails.

**Task 44: Validate that end times follow start times**
- Files: `src/data/validate.ts`
- Do: Where an end time exists, require it to be later than the start on the same date.
- Done: An inverted pair fails with a message naming the event.

**Task 45: Validate venue map URLs**
- Files: `src/data/validate.ts`
- Do: Require every non-pending maps URL to parse as an absolute HTTPS URL.
- Done: A relative or http URL fails.

**Task 46: Validate that the countdown target carries an explicit UTC offset**
- Files: `src/data/validate.ts`
- Do: Accept the pending sentinel, or an ISO instant ending in `Z` or a signed offset. Reject a floating local time.
- Done: A target without an offset fails the check with a message explaining that it would differ per timezone.

**Task 47: Validate signature assignment and uniqueness**
- Files: `src/data/validate.ts`
- Do: Require every event to declare a signature, and require each non-default identifier to be claimed at most once.
- Done: Two events claiming the same signature fail with both event ids named.

**Task 48: Validate signature asset presence**
- Files: `src/data/validate.ts`
- Do: Where an event claims the hand-opening signature, require its artwork files to exist on disk.
- Done: Renaming a hand asset fails the check.

**Task 49: Validate countdown and wedding-event consistency**
- Files: `src/data/validate.ts`
- Do: Where the countdown target is not pending, require it to resolve to the same moment as the wedding event's date and start time.
- Done: A one-hour discrepancy fails.

**Task 50: Assemble the validation runner**
- Files: `src/data/validate.ts`
- Do: Run every check, collect all failures rather than stopping at the first, and return them as a list.
- Done: A content file with three distinct faults reports all three.

**Task 51: Test the validation rules**
- Files: `src/data/validate.test.ts`
- Do: One focused test per check, each using a minimal fixture with a single deliberate fault.
- Done: Every check has a failing-case and a passing-case test.

**Task 52: Wire validation into the build**
- Files: `scripts/validate-content.ts`, `vite.config.ts`
- Do: A Vite plugin that runs the validation runner at build start and throws with the collected messages.
- Done: Validation output appears in build logs.

**Task 53: Verify the build fails on invalid content**
- Files: none (verification)
- Do: Temporarily introduce a duplicate signature, a floating-time countdown target and a missing venue reference; run the build.
- Done: The build exits non-zero and names all three fields. Revert.

**Task 54: Implement the full date formatter**
- Files: `src/lib/formatDate.ts`
- Do: Format a date as weekday, day, month and year using the Indian English locale.
- Done: A December date renders as `Friday, 11 December 2026`.

**Task 55: Implement the time and time-range formatters**
- Files: `src/lib/formatDate.ts`
- Do: Format a single time in twelve-hour form; format a pair as a range; format a lone start as an open-ended time.
- Done: A start with no end renders as the time followed by `onwards`.

**Task 56: Test the date and time formatters**
- Files: `src/lib/formatDate.test.ts`
- Do: Cover midnight, noon, a single-digit hour, a range, and an open-ended start.
- Done: Noon renders as `12:00 PM`, not `00:00 PM`.

**Task 57: Implement the duration breakdown**
- Files: `src/lib/formatDuration.ts`
- Do: Take a millisecond count and return days, hours, minutes and seconds. Accept the value as an argument; never read the clock here.
- Done: Exported as a pure function with no imports.

**Task 58: Implement duration padding and label pluralisation**
- Files: `src/lib/formatDuration.ts`
- Do: Zero-pad hours, minutes and seconds to two digits; leave days unpadded and uncapped; pluralise each label against its own value.
- Done: One day renders as `1 Day`; zero hours renders as `0 Hours`.

**Task 59: Test the duration formatter**
- Files: `src/lib/formatDuration.test.ts`
- Do: Cover 692 days, 59 seconds, exactly zero, a negative input, and a value just under 24 hours.
- Done: Under 24 hours still returns a days value of zero rather than omitting it. Negative input does not throw.

**Task 60: Implement and test event ordering and grouping**
- Files: `src/lib/groupEventsByDate.ts`, `src/lib/groupEventsByDate.test.ts`
- Do: Sort events by date then start time, then group consecutive same-date events under one key. Ordering is computed, never taken from array position.
- Done: Two events on one date produce one group; shuffling the input array produces identical output.

---

## Phase 2 — Static page skeleton (Tasks 61–97)

**Task 61: Compose the application shell**
- Files: `src/App.tsx`
- Do: Render header, main landmark and footer regions in order, with section placeholders. Pass content down as props from the single content object.
- Done: Document exposes exactly one main landmark.

**Task 62: Mount the skip link and its target**
- Files: `src/App.tsx`
- Do: Place the skip link as the first focusable element and give the main landmark the matching id.
- Done: Tab then Enter from a fresh load moves focus into main content.

**Task 63: Build the static header bar**
- Files: `src/components/layout/Header.tsx`
- Do: Sticky bar with the monogram on the left and a navigation slot on the right. Transparent; scroll behaviour comes later.
- Done: Header remains visible while scrolling, offset by the top safe-area inset.

**Task 64: Build the navigation link list**
- Files: `src/components/layout/Nav.tsx`
- Do: Render in-page links for story, events and gallery. Plain links; active state comes later.
- Done: Each link scrolls to its section on activation.

**Task 65: Omit navigation links for absent sections**
- Files: `src/components/layout/Nav.tsx`
- Do: Accept the list of present sections and render only those links.
- Done: With an empty gallery, no gallery link appears in the DOM.

**Task 66: Build the fact-value component**
- Files: `src/components/a11y/FactValue.tsx`
- Do: Render the supplied value, or a visibly marked pending placeholder when the value is the sentinel. Never returns null.
- Done: A pending value renders visible text rather than an empty node.

**Task 67: Test the fact-value component**
- Files: `src/components/a11y/FactValue.test.tsx`
- Do: Assert a real value renders as-is and a pending value renders the visible placeholder.
- Done: Neither case renders an empty element.

**Task 68: Build the hero text block**
- Files: `src/components/sections/Hero.tsx`
- Do: Render theme title, ornamental divider, couple names as the sole page heading, date label, city label, tagline and hashtag in that order.
- Done: Exactly one top-level heading exists on the page.

**Task 69: Mark Devanagari runs with a language attribute**
- Files: `src/components/sections/Hero.tsx`
- Do: Wrap the Devanagari theme title in an element carrying the Hindi language attribute.
- Done: The attribute is present on the title element only.

**Task 70: Reserve the hero's full height**
- Files: `src/components/sections/Hero.tsx`
- Do: Give the hero a minimum height of one small viewport height, reserved before any asset resolves.
- Done: No layout shift on load with the network throttled.

**Task 71: Add the hero scroll affordance**
- Files: `src/components/sections/Hero.tsx`
- Do: A real button at the bottom edge with an accessible name. Wire the scroll behaviour later.
- Done: Reachable by keyboard with a visible focus ring.

**Task 72: Build the venue link in its active form**
- Files: `src/components/events/VenueLink.tsx`
- Do: Render an anchor to the maps URL opening in a new tab, with a map-pin icon and the venue name.
- Done: Anchor carries the correct rel attributes for a new-tab link.

**Task 73: Build the venue link in its pending form**
- Files: `src/components/events/VenueLink.tsx`
- Do: Where the maps URL is pending, render plain non-interactive text instead of an anchor.
- Done: No anchor element is produced; nothing is focusable.

**Task 74: Announce the new-tab behaviour in the venue link name**
- Files: `src/components/events/VenueLink.tsx`
- Do: Compose an accessible name naming the venue and stating that it opens in a new tab.
- Done: Accessibility inspector reports the full name.

**Task 75: Build the event card structure**
- Files: `src/components/events/EventCard.tsx`
- Do: Render the motif slot, the function name, and the optional Devanagari name beneath it as a third-level heading.
- Done: Heading level follows the section heading with no skipped level.

**Task 76: Render the event card metadata rows**
- Files: `src/components/events/EventCard.tsx`
- Do: Render date, time and venue rows, routing every value through the fact-value component.
- Done: A pending start time renders a visible pending time row.

**Task 77: Render the optional event card fields**
- Files: `src/components/events/EventCard.tsx`
- Do: Render dress code and note only when supplied. Absent optional fields render nothing at all, not an empty row.
- Done: An event with neither field produces no stray empty elements.

**Task 78: Style the event card**
- Files: `src/components/events/EventCard.tsx`
- Do: Sand-beige background, a one-pixel gold border at reduced opacity, no shadow, card radius from the layout token.
- Done: Matches the specified treatment at all widths.

**Task 79: Build the date group heading**
- Files: `src/components/events/DateGroup.tsx`
- Do: Render one formatted date heading above the cards that share it.
- Done: Two same-date events show the date once.

**Task 80: Build the event list**
- Files: `src/components/events/EventList.tsx`
- Do: Run the grouping function over the events and render a date group per result.
- Done: Reordering the content array does not change rendered order.

**Task 81: Build the events section frame**
- Files: `src/components/sections/Events.tsx`
- Do: Wrap the event list in a labelled section with its heading.
- Done: Section is exposed as a labelled region.

**Task 82: Make the event card grid responsive**
- Files: `src/components/sections/Events.tsx`
- Do: Two columns at and above the large breakpoint, two with reduced padding at the medium breakpoint, one below.
- Done: Correct column count at 390, 768, 1024 and 1440 px.

**Task 83: Build the story section heading and intro**
- Files: `src/components/sections/Story.tsx`
- Do: Render the story heading and the optional intro paragraph.
- Done: Absent intro renders nothing.

**Task 84: Render text-only story beats**
- Files: `src/components/sections/Story.tsx`
- Do: Render year eyebrow, heading and body for a beat with no image, at full measure.
- Done: A beat with no image leaves no empty image frame.

**Task 85: Render paired story beats with alternating sides**
- Files: `src/components/sections/Story.tsx`
- Do: Where a beat has an image, pair image and text; alternate sides at and above the medium breakpoint; stack image above text below it.
- Done: Beat one is image-left, beat two image-right on desktop; both stack on mobile.

**Task 86: Omit the story section when it has no beats**
- Files: `src/components/sections/Story.tsx`, `src/App.tsx`
- Do: Render nothing, and report the section as absent so its nav link is dropped.
- Done: With no beats, neither section nor link exists in the DOM.

**Task 87: Separate story beats with a divider**
- Files: `src/components/sections/Story.tsx`
- Do: Place a divider between consecutive beats, not after the last.
- Done: Three beats produce two dividers.

**Task 88: Build the gallery thumbnail**
- Files: `src/components/gallery/Thumbnail.tsx`
- Do: A button wrapping an image with explicit intrinsic dimensions, lazy loading beyond the first row, and an accessible name built from the alt text.
- Done: Grid reserves space before images load.

**Task 89: Build the gallery grid**
- Files: `src/components/gallery/GalleryGrid.tsx`
- Do: Masonry-style columns — three at the large breakpoint, two at the small, one below.
- Done: Correct column count at each breakpoint.

**Task 90: Omit the gallery below six photographs**
- Files: `src/components/sections/Gallery.tsx`, `src/App.tsx`
- Do: Render nothing when fewer than six images exist, and report the section as absent.
- Done: With an empty gallery, neither section, heading nor nav link exists.

**Task 91: Build the gallery section frame**
- Files: `src/components/sections/Gallery.tsx`
- Do: Wrap the grid in a labelled section with its heading.
- Done: Section is exposed as a labelled region when present.

**Task 92: Build the footer content**
- Files: `src/components/sections/Footer.tsx`
- Do: Render the closing message, host lines, hashtag and tagline in order. No links.
- Done: No anchor elements exist in the footer.

**Task 93: Style the footer**
- Files: `src/components/sections/Footer.tsx`
- Do: Maroon ground, ivory text, a gold rule above the content, bottom padding including the safe-area inset.
- Done: Content clears the home indicator on iOS.

**Task 94: Set the document title and description**
- Files: `index.html`
- Do: Title composed of both names and the theme title; description set to the tagline.
- Done: Browser tab shows the composed title.

**Task 95: Add the social preview meta tags**
- Files: `index.html`
- Do: Open Graph title, description, image, url and type, plus the summary-large-image card tag. The image path points at the raster produced later.
- Done: Tags present; the image path is the committed public asset path.

**Task 96: Set the document language and theme colour**
- Files: `index.html`
- Do: Root language attribute set to English; theme colour set to the palette maroon.
- Done: Both present in the served document.

**Task 97: Run the responsive and no-photograph audit**
- Files: none (verification)
- Do: With an empty gallery and no hero image, load the page at 320, 360, 390, 768, 1024, 1440 and 2560 px.
- Done: No horizontal scroll at any width; every pending value is visible; no empty frame or placeholder box appears; the page reads as a complete invitation.

---

## Phase 3 — Illustration system & artwork (Tasks 98–132)

Runs in parallel with Phases 4–6. Depends only on Phase 0 tokens.

**Task 98: Write the SVG authoring conventions**
- Files: `src/assets/artwork/CONVENTIONS.md`
- Do: Record the 24-unit grid, coordinate rounding to half units, the three permitted stroke widths, the four permitted opacity steps, round caps and joins, stroke-only ornament, and the prohibition on hex literals.
- Done: Document exists and is referenced from every artwork task below.

**Task 99: Build the shared SVG token defs**
- Files: `src/components/artwork/svgTokens.ts`
- Do: Export the custom-property references used by every artwork component for stroke width, stroke colour and opacity, so no drawing restates a raw value.
- Done: Exported and consumed by at least one component.

**Task 100: Build the motif icon wrapper**
- Files: `src/components/artwork/MotifIcon.tsx`
- Do: One wrapper taking a motif name, applying a shared viewBox, gold stroke and the hidden-from-assistive-tech attribute.
- Done: Renders a placeholder motif at the correct size and is absent from the accessibility tree.

**Task 101: Draw the lotus motif**
- Files: `src/components/artwork/motifs/lotus.tsx`
- Do: Seven petals, bilaterally symmetric, outer pair swept down, on the 24-unit grid.
- Done: Renders crisply at 24 px and 96 px; uses only permitted stroke widths.

**Task 102: Draw the eternal-knot motif**
- Files: `src/components/artwork/motifs/eternalKnot.tsx`
- Done: Closed interlace, mirror-symmetric, single stroke weight.

**Task 103: Draw the kalash motif**
- Files: `src/components/artwork/motifs/kalash.tsx`
- Done: Pot, mango leaves and coconut, mirror-symmetric.

**Task 104: Draw the diya motif**
- Files: `src/components/artwork/motifs/diya.tsx`
- Done: Lamp body stroked, flame filled — the flame is one of the few permitted filled shapes.

**Task 105: Draw the peepal-tree motif**
- Files: `src/components/artwork/motifs/peepalTree.tsx`
- Done: Canopy and trunk, hairline stroke, reads at 24 px.

**Task 106: Draw the bell motif**
- Files: `src/components/artwork/motifs/bell.tsx`
- Done: Bell and clapper, mirror-symmetric.

**Task 107: Draw the ornamental divider**
- Files: `src/components/artwork/ornaments/DividerOrnament.tsx`
- Do: A centred lotus flanked by tapering rules.
- Done: Scales to any container width without distorting the centre motif.

**Task 108: Draw the corner flourish**
- Files: `src/components/artwork/ornaments/CornerFlourish.tsx`
- Do: A vine-and-leaf corner piece, mirrorable to all four corners by transform.
- Done: One asset serves all four corners.

**Task 109: Draw the jaali lattice pattern**
- Files: `src/components/artwork/ornaments/JaaliPattern.tsx`
- Do: A tiling lattice defined as an SVG pattern, intended for fills at the background opacity step.
- Done: Tiles seamlessly with no visible seam at the repeat boundary.

**Task 110: Upgrade the divider to use the ornament**
- Files: `src/components/layout/Divider.tsx`
- Do: Replace the plain rule with the divider ornament.
- Done: Every existing divider call site renders the ornament with no API change.

**Task 111: Draw the hero ground and corner wash**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: Vertical ivory-to-sand gradient, plus a deep-red watercolour bleed in the top-left at the background opacity step.
- Done: Renders full-bleed with no seams.

**Task 112: Draw the hero temple skyline**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: Line-art skyline along the bottom edge, gold hairline, background opacity step.
- Done: Sits behind all later layers.

**Task 113: Draw the hero arch with lattice fill**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: Centred five-cusp arch at a two-to-three width-to-height ratio, standard stroke, filled with the jaali pattern at the background opacity step.
- Done: Arch profile matches the reference proportion.

**Task 114: Draw the hero peepal roundel**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: A circular tree vignette inside the arch at the mid opacity step.
- Done: Contained entirely within the arch at every width.

**Task 115: Draw the hero mauli cord and tassel**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: An S-curve entering top-right and sweeping down-left, stroked with a red-to-orange gradient carrying gold flecks, ending in a tassel. Rendered at full opacity as the focal element.
- Done: Reads as the dominant element of the composition.

**Task 116: Draw the hero lotus finial**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: A lotus hanging from the top centre on a fine chain, foreground opacity step.
- Done: Chain aligns to the composition's vertical centre.

**Task 117: Draw the hero diya and glow**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: A lit lamp in the bottom-right with a warm radial glow, full opacity.
- Done: Glow does not wash out adjacent text.

**Task 118: Place the hero petals**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: Seven petals at authored constant positions, mixed red and ivory, foreground opacity step. No randomisation.
- Done: Positions are identical on every reload.

**Task 119: Configure hero composition scaling**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: Set the viewBox and a slice-preserving aspect ratio so the composition crops like a cover-fitted image.
- Done: No letterboxing at 390×844 or 2560×1440.

**Task 120: Hide fine hero detail on small screens**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: Hide the skyline, roundel and petals below the small breakpoint using a media query inside the SVG.
- Done: The 390 px rendering is clean rather than busy.

**Task 121: Hide the hero composition from assistive technology**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: Mark the whole composition as decorative.
- Done: Accessibility tree shows no artwork nodes.

**Task 122: Animate the hero draw-in**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: Draw the cord once via stroke offset over 1400 ms and fade the remaining layers over 800 ms. One pass, never repeated.
- Done: Plays once on load; a second visit within the session does not replay mid-session.

**Task 123: Provide the hero draw-in static fallback**
- Files: `src/components/artwork/HeroComposition.tsx`
- Do: Render every layer at its final state on first paint under reduced motion and with scripting disabled.
- Done: With JavaScript off, the composition is complete and static.

**Task 124: Mount the hero composition behind the hero text**
- Files: `src/components/sections/Hero.tsx`
- Do: Render the composition as the hero background; keep the photograph path as an override branch for when an image id is supplied.
- Done: With no image id the composition renders; supplying one switches to the photograph treatment.

**Task 125: Set hero text colour for the drawn ground**
- Files: `src/components/sections/Hero.tsx`
- Do: Use maroon text on the light composition with no darkening gradient; keep the ivory-on-gradient treatment only for the photograph branch.
- Done: Measured contrast on the composition exceeds eight to one.

**Task 126: Write the raster rendering script**
- Files: `scripts/render-rasters.swift`
- Do: Load an SVG in a web view at a fixed size and write a PNG snapshot. Uses only frameworks present in macOS.
- Done: Running it by hand produces a PNG of the requested dimensions.

**Task 127: Add the raster npm script**
- Files: `package.json`
- Do: Add a script invoking the raster renderer. It must not be referenced by the build script.
- Done: The build script contains no reference to it.

**Task 128: Generate and commit the social preview image**
- Files: `public/og-image.png`
- Do: Render the hero composition at 1200×630 and commit the output.
- Done: File committed; the social meta tag resolves to it.

**Task 129: Generate and commit the icons**
- Files: `public/favicon.png`, `public/apple-touch-icon.png`
- Do: Render the lotus motif at 32 px and 180 px and commit both.
- Done: Both committed.

**Task 130: Link the icons in the document head**
- Files: `index.html`
- Do: Add the icon and apple-touch-icon links.
- Done: Tab icon appears; adding to an iOS home screen shows the touch icon.

**Task 131: Audit the artwork for raw colour literals**
- Files: none (verification)
- Do: Search the artwork directory and components for hex colour literals.
- Done: Zero matches outside the stylesheet that defines the palette.

**Task 132: Review illustration coherence**
- Files: none (verification)
- Do: Render every authored asset side by side at equal scale. Check stroke widths against the permitted three, opacities against the permitted four, and ornament density against the twenty-to-thirty-five-percent band.
- Done: The set reads as one hand. Any asset that does not is redrawn, not excused.

---

## Phase 4 — Motion foundation (Tasks 133–147)

**Task 133: Build the reduced-motion hook**
- Files: `src/hooks/useReducedMotion.ts`
- Do: Read the media query, subscribe to changes, and return the current preference. The single script-side source of truth.
- Done: Toggling the OS setting updates consumers without a reload.

**Task 134: Test the reduced-motion hook**
- Files: `src/hooks/useReducedMotion.test.ts`
- Do: Assert the initial value and that a change event updates it.
- Done: Both cases pass.

**Task 135: Add the stylesheet-side reduced-motion rules**
- Files: `src/index.css`
- Do: Under the reduced-motion query, remove transitions and animations and force scroll behaviour to auto. Covers first paint before scripting runs.
- Done: A reduced-motion load shows no transition even before hydration.

**Task 136: Build the scroll-reveal observer**
- Files: `src/hooks/useScrollReveal.ts`
- Do: Observe an element and report when it crosses fifteen percent into view. Fire once, then disconnect.
- Done: Scrolling away and back does not re-fire.

**Task 137: Add reveal stagger with a cap**
- Files: `src/hooks/useScrollReveal.ts`
- Do: Offset grouped items by eighty milliseconds each, capping total stagger at four hundred and eighty regardless of count.
- Done: Twenty items finish staggering within the cap.

**Task 138: Bypass reveal under reduced motion**
- Files: `src/hooks/useScrollReveal.ts`
- Do: Where the preference is set, report revealed immediately and register no observer.
- Done: No observer is created in that configuration.

**Task 139: Apply reveal to sections**
- Files: `src/components/layout/Section.tsx`
- Do: Consume the reveal hook and apply the fade-and-rise transition.
- Done: Each section reveals once on first approach.

**Task 140: Apply staggered reveal to cards and thumbnails**
- Files: `src/components/events/EventList.tsx`, `src/components/gallery/GalleryGrid.tsx`
- Do: Pass group index into the reveal hook so items stagger within their group.
- Done: Cards in a row reveal in sequence, not together.

**Task 141: Build the active-section hook**
- Files: `src/hooks/useActiveSection.ts`
- Do: Track which registered section occupies the largest share of the viewport and return exactly one identifier.
- Done: Never returns null or more than one, including at both scroll extremes.

**Task 142: Test the active-section hook**
- Files: `src/hooks/useActiveSection.test.ts`
- Do: Assert single-winner behaviour at top, middle and bottom of the document.
- Done: Exactly one active identifier in all three positions.

**Task 143: Mark the active navigation link**
- Files: `src/components/layout/Nav.tsx`
- Do: Apply the active treatment — deep-red text plus a gold underline — to the reported section's link.
- Done: Exactly one link is marked at every scroll position.

**Task 144: Add the header scroll state**
- Files: `src/components/layout/Header.tsx`
- Do: Past sixty-four pixels, apply the translucent ivory ground, the sand-beige bottom border and the backdrop blur, transitioning over two hundred milliseconds.
- Done: Transition is smooth and reverses correctly on scroll to top.

**Task 145: Add smooth scrolling on navigation**
- Files: `src/components/layout/Nav.tsx`
- Do: Scroll the target section to just below the header on activation.
- Done: The target heading is not hidden behind the sticky header.

**Task 146: Make navigation scrolling instant under reduced motion**
- Files: `src/components/layout/Nav.tsx`
- Do: Where the preference is set, jump rather than animate.
- Done: No smooth scroll occurs in that configuration.

**Task 147: Wire the hero scroll affordance**
- Files: `src/components/sections/Hero.tsx`
- Do: Connect the hero button to scroll to the first section below the fold, honouring the motion preference.
- Done: Activating it lands on the story section.

---

## Phase 5 — Live countdown (Tasks 148–165)

**Task 148: Build the countdown core**
- Files: `src/hooks/useCountdown.ts`
- Do: On each tick compute remaining time as target minus current clock, read fresh. Never decrement a stored value and never derive a tick from the previous one. Accept a clock function as an injectable argument defaulting to the real clock.
- Done: The hook holds no accumulated elapsed time.

**Task 149: Align ticks to the second boundary**
- Files: `src/hooks/useCountdown.ts`
- Do: Schedule each next tick for the remainder of the current wall-clock second rather than a flat interval.
- Done: Displayed seconds flip in step with the system clock.

**Task 150: Resynchronise on tab visibility**
- Files: `src/hooks/useCountdown.ts`
- Do: On returning to visible, recompute and repaint immediately, ahead of the next scheduled tick.
- Done: A backgrounded tab shows the correct value on its first visible frame.

**Task 151: Stop cleanly at zero**
- Files: `src/hooks/useCountdown.ts`
- Do: On the tick that crosses zero, report completion and clear the timer.
- Done: No timer remains scheduled afterwards.

**Task 152: Clean up on unmount**
- Files: `src/hooks/useCountdown.ts`
- Do: Clear the pending timer and remove the visibility listener on unmount.
- Done: Repeated hot reloads accumulate no timers.

**Task 153: Test the countdown hook**
- Files: `src/hooks/useCountdown.test.ts`
- Do: Using the injected clock, assert correct values across an hour of simulated time, no drift after a simulated day, correct behaviour across the zero crossing, and cleanup on unmount.
- Done: A simulated day produces zero accumulated drift.

**Task 154: Build the countdown unit**
- Files: `src/components/countdown/CountdownUnit.tsx`
- Do: Render one numeral with its pluralised label beneath.
- Done: Label matches its own value's plurality.

**Task 155: Fix the countdown digit widths**
- Files: `src/components/countdown/CountdownUnit.tsx`
- Do: Apply tabular figures, with a fixed-width container sized to the widest glyph as a fallback.
- Done: Numerals do not jitter as digits change.

**Task 156: Assemble the countdown display**
- Files: `src/components/countdown/Countdown.tsx`
- Do: Render the four units in order. The days unit always renders, showing zero when under a day remains.
- Done: With under twenty-four hours left, four units still render.

**Task 157: Render the completed state**
- Files: `src/components/countdown/Countdown.tsx`
- Do: Replace the units with the completed message once the target has passed, without a reload.
- Done: Swap occurs on the crossing tick.

**Task 158: Render the pending-target fallback**
- Files: `src/components/countdown/Countdown.tsx`
- Do: Where the target is the pending sentinel, render the static hero date label instead. No numerals, no zeros, no ticking, no error.
- Done: Current content renders the date label and nothing throws.

**Task 159: Hide the ticking numerals from assistive technology**
- Files: `src/components/countdown/Countdown.tsx`
- Do: Mark the numeric display decorative.
- Done: Accessibility tree contains no ticking numbers.

**Task 160: Build the countdown screen-reader sentence**
- Files: `src/components/countdown/CountdownLiveText.tsx`
- Do: A visually hidden sentence stating the remaining days and hours, with live-region announcements switched off.
- Done: Present in the accessibility tree, absent from the visual render.

**Task 161: Throttle the screen-reader sentence**
- Files: `src/components/countdown/CountdownLiveText.tsx`
- Do: Refresh it at most once per minute, regardless of tick rate.
- Done: Sixty ticks produce at most one update.

**Task 162: Keep the countdown ticking under reduced motion**
- Files: `src/components/countdown/Countdown.tsx`
- Do: Remove digit transitions under the preference while leaving the tick running. The countdown is information, not decoration.
- Done: With the preference set, seconds still advance.

**Task 163: Mount the countdown in the hero**
- Files: `src/components/sections/Hero.tsx`
- Do: Place it below the city label, above the tagline.
- Done: Order matches the specified hero sequence.

**Task 164: Verify timezone invariance**
- Files: none (verification)
- Do: Set a real target temporarily. Load the page in two browser profiles with timezones set to Kolkata and New York simultaneously.
- Done: Both show identical numerals at the same instant. Revert the target.

**Task 165: Verify long-run drift and background recovery**
- Files: none (verification)
- Do: Leave a tab open overnight; separately, background a tab for five minutes and return.
- Done: Overnight value matches a freshly loaded tab. The backgrounded tab is correct on its first visible frame.

---

## Phase 5.5 — Re-shape content & sections (Tasks 166–177)

The brief replaced the card grid with a full-page journey. These tasks move the
data and sections onto the new shape before any of the new motion is built.

**Task 166: Create the event palette file**
- Files: `src/data/eventPalettes.ts`
- Do: Four palettes taken from the decor decks — Mehndi green garden, Haldi organza brights, Sangeet night, Marriage Mangal Sutra. Each declares a ground, a text colour, accents, and the swatches the panel displays. One file, so a client-supplied palette replaces it wholesale.
- Done: Every event id resolves to a palette; no hex literal outside the stylesheet.

**Task 167: Add the palette custom properties**
- Files: `src/index.css`
- Do: Declare every event palette token alongside the site palette. Scoped by panel, never used elsewhere.
- Done: All tokens resolve; the site palette is unchanged.

**Task 168: Extend the content contract for panels**
- Files: `src/data/types.ts`
- Do: Rename the signature union to panel entrance ids; add an optional decor note to events; add place, emblem and a pending-capable body to story beats; add the invitation message to the root.
- Done: Compiles; a beat without an emblem fails type checking.

**Task 169: Author the new content**
- Files: `src/data/content.ts`
- Do: Add decor notes conveying each event's *theme* rather than its inventory; add place and emblem to all seven story beats; add the invitation heading with a pending message.
- Done: Type-checks; no beat carries a year the client did not supply.

**Task 170: Validate palette contrast**
- Files: `src/data/validate.ts`, `src/data/validate.test.ts`
- Do: Require every event to resolve to a palette, and that palette's ground and text to meet at least 4.5 : 1.
- Done: A deliberately low-contrast pair fails the build naming the event.

**Task 171: Validate story emblems and unsupplied years**
- Files: `src/data/validate.ts`, `src/data/validate.test.ts`
- Do: Require an emblem on every beat; reject a year on any beat the client did not date.
- Done: Both cases fail with a message naming the beat.

**Task 172: Build the invitation message section**
- Files: `src/components/sections/InvitationMessage.tsx`, `src/App.tsx`
- Do: Between hero and story. Renders its pending marker rather than removing itself — an invitation missing its invitation reads as a defect, not as a choice.
- Done: Renders with a visible pending marker; sits in the right place in the document order.

**Task 173: Frame the invitation with corner flourishes**
- Files: `src/components/sections/InvitationMessage.tsx`
- Do: Place the existing corner ornament at all four corners by mirroring.
- Done: One asset serves four corners; nothing is duplicated.

**Task 174: Draw the place emblems**
- Files: `src/components/artwork/emblems/`
- Do: Seven emblems on the 24-unit grid under the existing conventions — hills, skyline, yacht, market arch, castle, ring, island.
- Done: Placed beside the existing motifs they read as the same hand.

**Task 175: Build the placeholder image treatment**
- Files: `src/components/artwork/PlaceholderImage.tsx`
- Do: An authored frame carrying a motif, for where a photograph will go. It must always read as a placeholder and never imitate a photograph.
- Done: Nobody could mistake it for a real image.

**Task 176: Show placeholders in the gallery**
- Files: `src/components/sections/Gallery.tsx`, `src/components/gallery/GalleryGrid.tsx`
- Do: Below six real photographs, fill the grid with placeholders instead of omitting the section, so the finished shape is visible.
- Done: With an empty gallery the section renders six placeholders; with six real photographs it renders those.

**Task 177: Rebuild the story as a route**
- Files: `src/components/sections/Story.tsx`
- Do: Beats become stops on a continuous route. Each shows place, emblem, heading, prose, and a date only where supplied. Alternating sides above the medium breakpoint; single column with a leading-edge route line below it.
- Done: All seven beats render in order, six showing place alone and the engagement showing its date.

---

## Phase 6 — Panel journey engine (Tasks 178–191)

Built and proven on **plain coloured panels**. No entrance artwork in this phase.

**Task 178: Build the panel shell**
- Files: `src/components/events/EventPanel.tsx`
- Do: A full-viewport labelled region with its content centred and capped to the content column.
- Done: Occupies at least `100svh`; content does not stretch across a 2560 px screen.

**Task 179: Drive the panel ground from its palette**
- Files: `src/components/events/EventPanel.tsx`
- Do: Apply the event's palette as the panel ground and text colour.
- Done: Four panels, four distinct colour worlds.

**Task 180: Blend the ground across the seam**
- Files: `src/index.css`
- Do: A panel's ground reaches full strength when it owns the viewport and blends toward its neighbour at the seam — a transition, not a cut.
- Done: Scrolling the journey shows no hard colour edge.

**Task 181: Lay out the panel content**
- Files: `src/components/events/EventPanel.tsx`
- Do: Function name with its Devanagari form, day and date, time, venue link, palette swatches, decor note.
- Done: Every fact from the card grid survives, with none lost in the move.

**Task 182: Build the panel lifecycle state machine**
- Files: `src/hooks/usePanelState.ts`
- Do: Five states with legal transitions only, carried over from the signature design.
- Done: A transition that skips a state is rejected.

**Task 183: Add the dual-threshold observer**
- Files: `src/hooks/usePanelState.ts`
- Do: Enter crossing 40% into view, exit below 10%.
- Done: One observer per panel.

**Task 184: Prove the hysteresis gap**
- Files: `src/hooks/usePanelState.test.ts`
- Do: Oscillate the ratio narrowly around each threshold and assert the state does not follow.
- Done: Wobbling between 11% and 39% produces no transition.

**Task 185: Add the mid-flight guard and queue cap**
- Files: `src/hooks/usePanelState.ts`
- Do: A trigger during a running animation is stored as the pending target and applied on completion; further triggers overwrite it rather than queueing.
- Done: Ten rapid triggers leave exactly one pending target.

**Task 186: Cap concurrent panel animations**
- Files: `src/hooks/usePanelSlot.ts`
- Do: At most two, which at a seam is exactly the outgoing and incoming pair.
- Done: A third request waits rather than dropping.

**Task 187: Build the progress rail**
- Files: `src/components/events/JourneyProgress.tsx`
- Do: Four stops marking position in the sequence. Decorative; the navigation stays the accessible control.
- Done: Hidden from assistive technology; becomes a row of dots below the medium breakpoint.

**Task 188: Provide the settled fallback**
- Files: `src/components/events/EventPanel.tsx`
- Do: Under reduced motion or without scripting, panels render settled and stacked, in order, fully readable, with no observer registered.
- Done: With scripting disabled all four panels are readable in sequence.

**Task 189: Build the entrance registry**
- Files: `src/components/events/entrances/registry.ts`
- Do: Map entrance id to component, with a plain default. The one file a new entrance touches.
- Done: An unknown id falls back to the default rather than throwing.

**Task 190: Replace the card grid with the journey**
- Files: `src/components/sections/Events.tsx`, `src/App.tsx`, `src/App.test.tsx`
- Do: Swap the date-grouped grid for the panel sequence, ordered by date. Update the whole-page tests to the new structure.
- Done: Four panels in chronological order; every existing fact assertion still passes.

**Task 191: Verify the plain journey**
- Files: none (verification)
- Do: Scroll top to bottom and back, at 390 px and 1440 px, with every panel on the default treatment.
- Done: No scroll-jacking, no horizontal scroll, no hard colour edges, every panel settles correctly after five fast passes.

---

## Phase 7 — Panel entrances (Tasks 192–213)

Ordered so each hand-over is built only once both of its sides exist.

**Task 192: Prototype the hand parting in isolation**
- Files: scratch, deleted after
- Do: Two plain rectangles; iterate perspective distance and transform origin until the parting reads as depth rather than as a sliding door. Record the values.
- Done: Values recorded and carried forward. Prototype deleted.

**Task 193: Draw the left hand**
- Files: `src/components/artwork/entrances/handLeft.tsx`
- Do: Stylised gold-and-green line art with mehendi patterning on the palm-facing surface — that is the surface the opening reveals. Transparent ground, no baked-in shadow.
- Done: Under 24 KB compressed.

**Task 194: Draw the right hand**
- Files: `src/components/artwork/entrances/handRight.tsx`
- Do: The mirrored counterpart with inner edges that meet exactly.
- Done: Placed together, no gap and no overlap.

**Task 195: Draw the mehndi garden backdrop**
- Files: `src/components/artwork/entrances/mehndiGarden.tsx`
- Do: Layered foliage in the Mehndi palette, with warm floral accents.
- Done: Reads as a garden at both 390 px and 1440 px.

**Task 196: Assemble the hand layer stack**
- Files: `src/components/events/entrances/MehndiHands.tsx`
- Do: Backdrop, contact shadow, two hands, using the recorded perspective values.
- Done: Rotating a hand shows visible foreshortening.

**Task 197: Animate the hands parting**
- Files: `src/components/events/entrances/MehndiHands.tsx`
- Do: Part over 900 ms with a 120 ms stagger, revealing the panel details, and settle at the panel edges framing the content.
- Done: The stagger is perceptible without looking uneven.

**Task 198: Animate the hands closing**
- Files: `src/components/events/entrances/MehndiHands.tsx`
- Do: Return to centre over 540 ms with no stagger — they close as a clasp.
- Done: Under 60% of the entrance duration.

**Task 199: Author the Haldi burst constants**
- Files: `src/components/events/entrances/haldiBursts.ts`
- Do: Nine bursts with fixed positions, sizes and angles in the deck's organza brights. Random generation prohibited: the panel must be identical on every load.
- Done: No random call in the module.

**Task 200: Break the colour out of the closing hands**
- Files: `src/components/events/entrances/HaldiBurst.tsx`
- Do: The entrance begins at the seam the hands close on, so the colour bursts from between them.
- Done: Scrolling from Mehndi to Haldi reads as one continuous gesture.

**Task 201: Animate the colour wash**
- Files: `src/components/events/entrances/HaldiBurst.tsx`
- Do: A radial wash expands over 700 ms, carrying the ground from green to peach.
- Done: Transform and opacity only.

**Task 202: Animate the pigment bursts**
- Files: `src/components/events/entrances/HaldiBurst.tsx`
- Do: Nine bursts scale and fade outward over 500 ms, staggered 40 ms.
- Done: Reads as a throw of colour, not a simultaneous pop.

**Task 203: Animate the Haldi exit**
- Files: `src/components/events/entrances/HaldiBurst.tsx`
- Do: The wash recedes toward the seam over 420 ms.
- Done: Under 60% of the entrance.

**Task 204: Darken the ground into evening**
- Files: `src/components/events/entrances/SangeetLights.tsx`
- Do: Carry the ground from Haldi peach to Sangeet night across the seam — dusk falling, not a cut.
- Done: No hard edge between the two panels.

**Task 205: Draw the lamp strings**
- Files: `src/components/artwork/entrances/lampString.tsx`
- Do: Strings with individually addressable bulbs and glows.
- Done: Each bulb is targetable; under 8 KB.

**Task 206: Animate the lamps descending and igniting**
- Files: `src/components/events/entrances/SangeetLights.tsx`
- Do: Strings descend over 700 ms on an overshoot curve so they swing and settle; bulbs then ignite in sequence, staggered 70 ms.
- Done: The settle reads as physical; no flicker loop remains.

**Task 207: Light the neon hashtag**
- Files: `src/components/events/entrances/SangeetLights.tsx`
- Do: Render the hashtag as a neon sign, as the deck specifies. The one place it is an object rather than text.
- Done: Its accessible name still reads as the hashtag.

**Task 208: Animate the Sangeet exit**
- Files: `src/components/events/entrances/SangeetLights.tsx`
- Do: Bulbs extinguish in reverse over 280 ms, strings retract over 420 ms, and the ground begins warming.
- Done: Under 60% of the entrance.

**Task 209: Profile the stroke-draw technique**
- Files: scratch, discarded after
- Do: Before styling, animate a representative path's stroke offset and record a performance trace. The property is not compositor-accelerated, so the decision belongs on day one.
- Done: A measured figure exists. Above 20 ms, convert to a transform-driven mask reveal and note the change.

**Task 210: Lift the ground into the ceremony**
- Files: `src/components/events/entrances/MauliKnot.tsx`
- Do: Carry the ground from Sangeet night to ivory — dawn after the night before.
- Done: The journey resolves into the site's own palette.

**Task 211: Draw the arch and tie the knot**
- Files: `src/components/events/entrances/MauliKnot.tsx`
- Do: The arch draws itself framing the details; the cord draws over 1100 ms and the knot ties from 800 ms, so it forms while the last of the cord is still arriving.
- Done: The overlap reads as one continuous gesture.

**Task 212: Animate the Marriage exit**
- Files: `src/components/events/entrances/MauliKnot.tsx`
- Do: The knot unties over 260 ms, the cord retracts over 540 ms.
- Done: Under 60% of the entrance.

**Task 213: Review the journey as one sequence**
- Files: none (verification)
- Do: Scroll the whole journey down and back with the panel labels obscured.
- Done: It reads as one celebration rather than four animations. Each hand-over is unmistakable. Text meets 4.5 : 1 at every frame. At least 55 fps on a mid-range 2021 Android device.

---

## Phase 8 — Gallery lightbox (Tasks 214–227)

Independent of Phases 5–7 once Phase 4 has landed.

**Task 214: Build the focus trap hook**
- Files: `src/hooks/useFocusTrap.ts`
- Do: Cycle Tab and Shift-Tab within a container; record the previously focused element and restore it on release.
- Done: Tabbing past the last control returns to the first.

**Task 215: Test the focus trap hook**
- Files: `src/hooks/useFocusTrap.test.ts`
- Do: Cover forward wrap, backward wrap and restoration on release.
- Done: All three pass.

**Task 216: Build the body scroll lock hook**
- Files: `src/hooks/useBodyScrollLock.ts`
- Do: Prevent background scrolling while active and restore the exact prior scroll position on release.
- Done: Position is preserved to the pixel.

**Task 217: Handle iOS rubber-band scrolling in the lock**
- Files: `src/hooks/useBodyScrollLock.ts`
- Do: Add the fixed-position compensation iOS Safari requires, since overflow alone leaks there.
- Done: Verified on a real iOS device that the background does not move.

**Task 218: Build the lightbox dialog shell**
- Files: `src/components/gallery/Lightbox.tsx`
- Do: A modal dialog with an accessible name over a dark scrim, consuming the focus trap and scroll lock.
- Done: Screen reader announces a dialog on open.

**Task 219: Letterbox the lightbox image**
- Files: `src/components/gallery/Lightbox.tsx`
- Do: Constrain the image to ninety percent of viewport width and eighty-five percent of height, preserving aspect.
- Done: Portrait and landscape images both fit without cropping.

**Task 220: Add the lightbox close control**
- Files: `src/components/gallery/Lightbox.tsx`
- Do: A close button with an accessible name and a hit area of at least forty-four pixels square.
- Done: Reachable by keyboard with a visible focus ring.

**Task 221: Add previous and next controls with wrapping**
- Files: `src/components/gallery/Lightbox.tsx`
- Do: Buttons at the same minimum hit size. Next from the last image goes to the first; previous from the first goes to the last.
- Done: Wrapping works in both directions.

**Task 222: Implement the lightbox keyboard contract**
- Files: `src/components/gallery/Lightbox.tsx`
- Do: Escape closes; left and right arrows move between images.
- Done: All three keys work while focus is anywhere inside the dialog.

**Task 223: Add swipe navigation**
- Files: `src/components/gallery/Lightbox.tsx`
- Do: A horizontal swipe of at least forty-eight pixels moves between images. This is an addition to the buttons, never a replacement — every action remains reachable by keyboard.
- Done: Buttons remain fully functional on touch devices.

**Task 224: Add the caption and position indicator**
- Files: `src/components/gallery/Lightbox.tsx`
- Do: Show the caption where present and a current-of-total indicator.
- Done: Indicator updates on every navigation.

**Task 225: Restore focus to the originating thumbnail**
- Files: `src/components/gallery/Lightbox.tsx`, `src/components/sections/Gallery.tsx`
- Do: On close, return focus to the exact thumbnail button that opened the lightbox, not merely the first.
- Done: Opening the sixth thumbnail and closing returns focus to the sixth.

**Task 226: Own the open-image state in the gallery section**
- Files: `src/components/sections/Gallery.tsx`
- Do: Hold the open index here — the one piece of state shared between grid and lightbox. Do not lift it to the shell.
- Done: Opening a thumbnail does not re-render other sections.

**Task 227: Hide the page behind the open lightbox**
- Files: `src/components/sections/Gallery.tsx`
- Do: Mark the rest of the page hidden from assistive technology while the lightbox is open.
- Done: Screen reader reaches only dialog content.

---

## Phase 9 — Hardening & launch (Tasks 228–245)

**Task 228: Write the print stylesheet**
- Files: `src/index.css`
- Do: Print the hero heading block and the events section on one A4 page — white ground, maroon text, motif icons only. Hide header, gallery, countdown and every signature layer.
- Done: Print preview fits one page.

**Task 229: Verify the scripting-disabled experience**
- Files: none (verification)
- Do: Load with JavaScript disabled.
- Done: All text, event cards and thumbnails render; the countdown is replaced by the static date with no frozen zeros; every signature shows its finished state.

**Task 230: Audit heading hierarchy and landmarks**
- Files: none (verification)
- Do: Walk the document outline.
- Done: One top-level heading, no skipped levels, every section a labelled region.

**Task 231: Audit focus indicators**
- Files: none (verification)
- Do: Tab through every interactive element.
- Done: Every one shows a visible indicator of at least two pixels with offset. No element suppresses its outline without a replacement.

**Task 232: Audit colour contrast across animation frames**
- Files: none (verification)
- Do: Sample text contrast at rest and at each signature's peak frame.
- Done: Every sample meets at least four and a half to one; non-text indicators meet three to one.

**Task 233: Run the mobile screen-reader pass**
- Files: none (verification)
- Do: Traverse the page with VoiceOver on iOS.
- Done: Sections read in order; the countdown is not announced per second; signature phase does not alter reading order.

**Task 234: Run the desktop screen-reader pass**
- Files: none (verification)
- Do: Traverse the page with NVDA on Windows.
- Done: Same criteria as the mobile pass.

**Task 235: Run Lighthouse and fix regressions**
- Files: as needed
- Do: Mobile run under simulated slow network and throttled processor.
- Done: Performance at least ninety, accessibility at least ninety-five, best practices at least ninety-five.

**Task 236: Verify the transfer budget**
- Files: none (verification)
- Do: Measure a cold load in the network panel.
- Done: Total initial transfer at or under three hundred and twenty kilobytes compressed.

**Task 237: Audit for third-party origins**
- Files: none (verification)
- Do: Review every network request and every asset reference in the built output.
- Done: Zero requests to any origin but the site's own; no font CDN; no remote asset reference.

**Task 238: Verify cumulative layout stability**
- Files: none (verification)
- Do: Record a full scroll down and back.
- Done: Layout shift at or under zero point zero two.

**Task 239: Verify console silence**
- Files: none (verification)
- Do: Load a production build and exercise every interaction.
- Done: No errors and no warnings.

**Task 240: Verify the build on a machine without macOS tooling**
- Files: none (verification)
- Do: Clean-clone and build where no Swift toolchain exists.
- Done: Build succeeds; committed rasters are used as-is; the raster script is never invoked.

**Task 241: Write the handover note**
- Files: `resc/docs/5-handover.md`
- Do: List every field still holding a pending sentinel, where it surfaces in the UI, and what is needed to fill it.
- Done: Every visible pending value on the built page appears in the list.

**Task 242: Configure the deployment environment**
- Files: `.env.production`, `vite.config.ts`
- Do: Set the canonical site URL and the deploy base path for the chosen host.
- Done: Built output references absolute URLs correctly in the social meta tags.

**Task 243: Deploy to the static host**
- Files: host configuration
- Do: Publish the built directory over HTTPS.
- Done: The site loads at its URL with no mixed-content warning.

**Task 244: Verify link previews in the channels that matter**
- Files: none (verification)
- Do: Share the URL into WhatsApp and iMessage — the two channels this invitation will actually travel through.
- Done: Both render the title, description and preview image.

**Task 245: Verify on real devices**
- Files: none (verification)
- Do: Open on a physical iPhone and a physical Android handset, not simulators. Exercise scrolling, every signature, the lightbox and the countdown.
- Done: All behave as on desktop; scroll lock holds; no layer flickers.
