# Wedding Invitation — Modular Implementation Plan

**Document:** `resc/docs/3-plan.md`
**Implements:** `resc/docs/2-spec.md` v5
**Revised:** for the client brief in `1-details.md`, which changed the Events architecture after Phases 0–5 were built
**Implementation root:** `/Users/sreetam/code/wedding-invitation/src`
**Status:** Ready to execute. No work in this plan is blocked.

> Rule references in square brackets — `[E6]`, `[SG4]`, `[C19]` — point at numbered rules in the specification. Every component below exists to satisfy specific rules; if a component implements no rule, it should not be built.

---

## 0. How to use this plan

| Section | Answers |
|---|---|
| §2 | What shape is the system? |
| §3 | What order do we build it in, and when is each stage done? |
| §4 | What are the components, and what is each one responsible for? |
| §5 | What depends on what, and what can be built in parallel? |
| §6 | What is likely to go wrong, and what do we do about it? |
| §7 | How do we know we are finished? |

**Effort key:** **S** ≈ under half a day · **M** ≈ half to one day · **L** ≈ two to three days. Rough, for sequencing only.

**Two standing rules for the whole build:**

1. **Engine before art.** Every animation system is built and proven with a deliberately plain placeholder before real artwork goes near it. Debugging a state machine through a 24 KB hand illustration is how a two-day task becomes a week.
2. **Nothing merges red.** Each phase has an exit gate in §3. A phase is not done because its files exist; it is done when its gate passes.

---

## 1. Constraints that shape the plan

These four spec decisions drive most of the sequencing. They are restated here because they explain *why* the phase order is what it is.

| Constraint | Consequence for the plan |
|---|---|
| **Runtime dependencies are `react` + `react-dom` only** [§2.1] | Every behaviour — the countdown, the five-state signature lifecycle, focus trapping, scroll locking, reveal-on-scroll — is our own code. Each gets its own phase slot and its own tests. Nothing is one `npm install` away |
| **Every asset is authored here** [§2.2] | Illustration is a build phase (P3), not a procurement task. It sits on the critical path and needs a quality gate [C32], not just a completion tick |
| **Photographs are optional** [S9] | The page must be complete with an empty `gallery` and no `hero.imageId`. Every phase is verified in that configuration *first*, and with photographs second — not the other way round |
| **`TBD` sentinels render visibly** [E6, K10] | Facts are still outstanding [§12.1]. The build stays green and shippable throughout. There is no "wait for content" phase, and no phase is blocked on the couple |

---

## 2. Architecture

### 2.1 Layers

Five layers. **Dependencies point downward only.** A lower layer never imports from a higher one — this is what keeps the data and formatting logic testable without rendering anything.

```
┌──────────────────────────────────────────────────────────┐
│  L5  Page composition        AppShell                    │
├──────────────────────────────────────────────────────────┤
│  L4  Sections                Hero · Story · Events ·     │
│                              Gallery · Footer            │
├──────────────────────────────────────────────────────────┤
│  L3  Feature modules         countdown/ · signatures/ ·  │
│                              events/ · gallery/          │
├──────────────────────────────────────────────────────────┤
│  L2  Primitives & behaviour  layout/ · a11y/ · artwork/  │
│                              · hooks/                    │
├──────────────────────────────────────────────────────────┤
│  L1  Data & pure logic       data/ · lib/  (no React,    │
│                              no DOM, no side effects)    │
└──────────────────────────────────────────────────────────┘
```

**L1 is pure.** No React import, no DOM access, no `Date.now()` captured at module scope. Every function takes its inputs explicitly — including the current time — which is what makes the countdown testable at arbitrary instants without mocking the clock globally.

### 2.2 Data flow

One direction, no stores, no context for content:

```
content.ts ──► validate.ts ──► AppShell ──► sections ──► feature modules ──► primitives
  (authored)     (build-time,      (props, top-down — no global state)
                  fails the build)
```

Three pieces of state exist at runtime. Nothing else is stateful:

| State | Owner | Scope |
|---|---|---|
| Countdown remaining time | `useCountdown` inside `Countdown` | One component |
| Per-card signature phase | `useSignatureState` inside each `SignatureStage` | One card |
| Page-wide signature concurrency | `useSignatureSlot`, module-level counter | Shared across cards [SG12] |

`useSignatureSlot` is the one piece of genuinely shared state. It is a module-level counter with subscribe/release, not context — it changes on animation boundaries, and putting it in context would re-render every card each time a slot moved.

### 2.3 Token flow

This is what makes [§5.2.1]'s "SVG takes colours from custom properties" real, and what makes a palette change a one-line edit:

```
index.css  ──►  :root custom properties  ──┬──►  Tailwind theme mapping  ──► components
(§4.1 palette,   --maroon, --antique-gold  │
 §4.6 stroke     --stroke-hair/std/emph    └──►  SVG fill/stroke via var()  ──► artwork
 and opacity     --op-bg/mid/fg/focal
 ladders)
```

**No authored SVG contains a hex literal.** Every stroke, fill and opacity references a custom property. This is enforced by review and by the grep in [C32].

### 2.4 Directory layout

Extends [§13] of the spec with the pieces the plan adds:

```
src/
  main.tsx · App.tsx · index.css
  data/        types.ts · content.ts · validate.ts
  lib/         formatDate · formatDuration · groupEventsByDate · isTBD
  hooks/       useCountdown · useSignatureState · useSignatureSlot ·
               useScrollReveal · useActiveSection · useReducedMotion ·
               useFocusTrap · useBodyScrollLock
  components/
    layout/    AppShell · Header · Nav · Container · Section · Divider
    a11y/      SkipLink · VisuallyHidden · FactValue
    artwork/   MotifIcon · Ornament · HeroComposition
    countdown/ Countdown · CountdownUnit · CountdownLiveText
    events/    EventList · DateGroup · EventCard · VenueLink
    signatures/ SignatureStage · registry · MehendiHands · HaldiSplash ·
                SangeetLights · MauliKnot · DefaultMotif
    gallery/   GalleryGrid · Thumbnail · Lightbox
    sections/  Hero · Story · Events · Gallery · Footer
  assets/      artwork/ · images/ · fonts/
scripts/       render-rasters.swift · validate-content.ts (Vite plugin)
public/        og-image.png · favicon.png · apple-touch-icon.png   (committed)
```

---

## 3. Phases

Ten phases. Each states what it delivers, what it needs first, and the gate that closes it.

### Phase overview

| # | Phase | Effort | Needs | Delivers |
|---|---|---|---|---|
| P0 | Foundation & tokens | M | — | Scaffold, palette, typography, layout primitives |
| P1 | Data layer & pure logic | M | P0 | Typed content, build-time validation, formatters |
| P2 | Static page skeleton | L | P1 | A complete, readable, unanimated invitation |
| P3 | Illustration system & artwork | L | P0 | Hero composition, motifs, ornaments, rasters |
| P4 | Motion foundation | M | P2 | Reveal, nav active state, reduced-motion source of truth |
| P5 | Live countdown | M | P1, P4 | The hero counter [K1–K16] |
| P6 | Panel journey engine | L | P4 | Full-page panels, colour journey, lifecycle, proven on plain panels |
| P7 | Panel entrances | L | P3, P6 | The four real entrances, handing over to each other |
| P8 | Gallery lightbox | M | P2, P4 | Full lightbox with focus management |
| P9 | Hardening & launch | L | all | Audits, budgets, print, meta, handover |

### Revision after the brief

The brief arrived once Phases 0–5 were complete. **Phases 0–5 stand unchanged** —
foundation, data layer, illustration system, motion primitives and the countdown
are all unaffected, and the countdown went live on the confirmed date.

What changed is everything downstream of the Events section:

| | Built in P2 | Now required |
|---|---|---|
| Events | Two-column card grid, grouped by date | Four **full-viewport panels** in a scroll journey |
| Palette | One palette page-wide | A palette **per panel**, carried from the decor decks |
| Motion | Four independent card signatures | Four panel entrances that **hand over** to one another |
| Sections | Hero → Story → Events → Gallery → Footer | Hero → **Invitation** → Story → Journey → Gallery → Footer |
| Story | Alternating image/text beats | A **route with seven stops**, each a place |
| Photos | Section omitted below six | **Authored placeholders**, so the finished shape is visible |

An extra phase slots in before P6:

| # | Phase | Effort | Needs | Delivers |
|---|---|---|---|---|
| **P5.5** | **Re-shape content & sections** | M | P5 | Event palettes, invitation section, story-as-journey data, placeholder images |

**Critical path:** P0 → P1 → P2 → P4 → P6 → P7 → P9.
P3 and P8 sit off it — see [§5.3].

---

### P0 — Foundation & tokens · **M**

**Delivers** a scaffold that renders nothing but has every token, stack and primitive the rest of the build assumes.

| # | Task | Effort |
|---|---|---|
| P0.1 | Vite + React 19 + TS strict + Tailwind 4 scaffold; `dev`/`build`/`preview`/`typecheck`/`lint` scripts [§11.4] | S |
| P0.2 | Palette custom properties, including `haldi-turmeric` [§4.1]; Tailwind theme mapped to them, not duplicating them | S |
| P0.3 | Illustration tokens — three stroke weights, four opacity steps [§4.6] — as custom properties | S |
| P0.4 | `@font-face` for three OFL faces, `font-display: swap`; three fallback stacks [§4.3] | M |
| P0.5 | Fallback metric tuning: `size-adjust` / `ascent-override` so the font swap shifts nothing | M |
| P0.6 | Global reset: `color-scheme: light` [§8.3], safe-area insets, `img{max-width:100%}`, viewport meta with `viewport-fit=cover` [D5] | S |
| P0.7 | `Container`, `Section`, `Divider`, `SkipLink`, `VisuallyHidden` | M |
| P0.8 | Type scale as fluid `clamp()` utilities [§4.3] | S |

**Gate P0.** A page with one heading and one paragraph renders in the correct faces. Emptying `src/assets/fonts/` leaves it readable in the system stack with **no layout shift and no fallback box glyphs**, Devanagari included — verified on macOS, Windows and Android [C31]. `npm run build` and `npm run typecheck` pass.

> **Do P0.5 properly.** Metric tuning is dull and easy to defer, and deferring it means chasing a CLS regression in P9 with the whole page built on top of it.

---

### P1 — Data layer & pure logic · **M**

**Delivers** the single source of truth and every pure function that reads it. No React in this phase.

| # | Task | Effort |
|---|---|---|
| P1.1 | `types.ts` — the [§5.1] contract verbatim, including `SignatureId` and the `TBD` sentinel type | S |
| P1.2 | `content.ts` — real facts from [§3], `TBD` sentinels everywhere else [§5.1] | S |
| P1.3 | `validate.ts` — rules V1–V14, each returning a message naming the offending field | M |
| P1.4 | Vite plugin wiring validation into `buildStart` so a violation **fails the build** [C2] | S |
| P1.5 | `isTBD` — sentinel detection, one place [E6, K10] | S |
| P1.6 | `formatDate` — `Intl`, `en-IN`, `Friday, 11 December 2026` [E4] | S |
| P1.7 | `formatDuration` — ms → days/hours/minutes/seconds, padding and pluralisation [K6–K8] | M |
| P1.8 | `groupEventsByDate` — sort then group, ordering computed never authored [E1, E2] | M |
| P1.9 | Unit tests for P1.5–P1.8, including the leap-second-adjacent and DST-boundary cases | M |

**Gate P1.** Deliberately corrupting `content.ts` — duplicate signature [V12], floating-time countdown target [V10], missing `venueId` [V1] — fails `npm run build` with a message naming the field. Restoring it passes. `formatDuration` returns correct output for 692 days, for 59 seconds, for exactly zero, and for a negative input.

> **Why V10 earns its own test.** A countdown target without an explicit UTC offset is the defect most likely to survive to production: it looks right on the developer's machine and is wrong for every guest in another timezone. Catch it at build time or not at all.

---

### P2 — Static page skeleton · **L**

**Delivers** the entire invitation as readable, responsive, unanimated HTML. At the end of this phase the site is genuinely shippable — plainer than the final, but complete.

| # | Task | Effort |
|---|---|---|
| P2.1 | `AppShell` — section composition, ordering, `<main>` landmark [A2] | S |
| P2.2 | `Header` + `Nav`, static styling only, no scroll behaviour yet [N1, N7] | M |
| P2.3 | `Hero`, text only — no artwork, no countdown, reserving full height [H1, H3, H7] | M |
| P2.4 | `FactValue` — renders a value or a visible `TBD`, one place for [E6] | S |
| P2.5 | `Events` → `EventList` → `DateGroup` → `EventCard` → `VenueLink` [E1–E11] | L |
| P2.6 | `Story` with alternating image/text beats, text-only when a beat has no image [T1–T6] | M |
| P2.7 | `Gallery` grid and thumbnails, **no lightbox**; section omits itself below six photos [G1–G4, G2] | M |
| P2.8 | `Footer` [F1–F4] | S |
| P2.9 | Responsive pass at 320/360/390/768/1024/1440/2560 [C9] | M |
| P2.10 | Document head: title, description, OG and Twitter tags, `lang`, `theme-color` [D1–D7] | S |

**Gate P2.** With an empty `gallery` and no `hero.imageId`, the page reads top to bottom as a complete invitation. No horizontal scroll at any of the seven widths. Every `TBD` is visible. Heading hierarchy has no skipped level [A1]. No empty frame or placeholder box appears anywhere [SS5]. This gate is the substance of [C29].

---

### P3 — Illustration system & artwork · **L**

**Delivers** every authored SVG. Off the critical path — can run alongside P4–P6.

| # | Task | Effort |
|---|---|---|
| P3.1 | SVG authoring conventions: 24-unit grid, `var()` colours, no hex literals, shared stroke/opacity tokens [§4.6] | S |
| P3.2 | `MotifIcon` — six motifs sharing one wrapper [E3] | M |
| P3.3 | `Ornament` — dividers, corner flourishes, jaali lattice [T5, F2] | M |
| P3.4 | `HeroComposition` — nine layers, `xMidYMid slice`, sub-640 layer hiding [HA1–HA3, HA6] | L |
| P3.5 | Hero draw-in: cord `stroke-dashoffset` plus layer fade, one pass [HA4, HA5] | M |
| P3.6 | `scripts/render-rasters.swift` — `WKWebView` → PNG [§11.4.1] | M |
| P3.7 | Generate and **commit** `og-image.png`, `favicon.png`, `apple-touch-icon.png` [R1] | S |
| P3.8 | Coherence review of the full set at equal scale [C32] | S |

**Gate P3.** The hero looks finished with no photograph [S9]. Grep across `src/assets/artwork/` finds no hex literal. Every stroke is 0.75/1.5/3 px; every opacity is 0.08/0.18/0.45/1.0. Ornament density sits in 20–35% on each panel. `npm run build` succeeds on a machine with no `swift` [R2, C30]. Two assets side by side read as one hand [C32].

> **P3.8 is a real gate, not a formality.** It is the only checkpoint where drift across a dozen hand-drawn assets is cheap to fix. Once the signatures are built on top, redrawing a motif means re-tuning the animations that frame it.

---

### P4 — Motion foundation · **M**

**Delivers** the motion primitives everything later depends on. Small phase, wide blast radius.

| # | Task | Effort |
|---|---|---|
| P4.1 | `useReducedMotion` — `matchMedia`, live-updating, the single JS source of truth [M4] | S |
| P4.2 | CSS-side reduced-motion handling so first paint is correct before JS runs | S |
| P4.3 | `useScrollReveal` — `IntersectionObserver` at 15%, fires once, staggered and capped [M1–M3] | M |
| P4.4 | `useActiveSection` — largest-viewport-share wins, exactly one active [N6] | M |
| P4.5 | Header scroll state at 64 px with a 200 ms transition [N2, N3] | S |
| P4.6 | Smooth scroll on nav activation, instant under reduced motion [N5] | S |

**Gate P4.** Sections reveal once and do not replay. Exactly one nav link is active at every scroll position, including at both extremes. Under `prefers-reduced-motion: reduce` everything renders final-state immediately and scrolling is instant. Toggling the OS setting live updates without a reload.

> **Two sources of truth for reduced motion, deliberately.** CSS covers first paint before hydration; the hook covers JS decisions such as "do not register an observer at all" [SG10]. Neither alone is sufficient.

---

### P5 — Live countdown · **M**

**Delivers** [K1–K16]. Self-contained; the only feature that reads the system clock.

| # | Task | Effort |
|---|---|---|
| P5.1 | `useCountdown` — recompute from `Date.now()` each tick, never decrement [K3] | M |
| P5.2 | Second-boundary scheduling via `1000 − (now mod 1000)` [K4] | S |
| P5.3 | `visibilitychange` resync [K5] | S |
| P5.4 | Zero-crossing → completed message, timer cleared [K9] | S |
| P5.5 | Unmount cleanup, HMR-safe [K12] | S |
| P5.6 | `Countdown` + `CountdownUnit` — four units, days never hidden [K1, K7] | M |
| P5.7 | Fixed-width digit containers, tabular figures [K15] | S |
| P5.8 | `CountdownLiveText` — hidden sentence, `aria-live="off"`, refreshed at most once a minute [K13] | S |
| P5.9 | `TBD` target → static date label, no zeros, no throw [K10] | S |
| P5.10 | Reduced-motion: digits swap with no transition, **ticking continues** [K14, M11] | S |

**Gate P5.** [C13]–[C16]: ticks 60 seconds with no skip or drift; two profiles in `Asia/Kolkata` and `America/New_York` show identical numerals; a 5-minute background returns correct on the first frame; clock advanced past the target renders the completed message and stops. VoiceOver does not announce per second [A12].

> **The bug this phase exists to prevent.** A countdown that decrements a stored value drifts by the event-loop's latency — a few seconds a day, invisible in a five-minute test and obviously wrong after a week. [K3] is the whole point; test it by leaving a tab open overnight.

---

### P5.5 — Re-shape content & sections · **M**

**Delivers** the data and section changes the brief requires, before any of the
new motion is built.

| # | Task | Effort |
|---|---|---|
| P5.5.1 | `eventPalettes.ts` — four palettes from the decks, one file, replaceable wholesale | S |
| P5.5.2 | Content contract: panel entrance ids, decor notes, story places and emblems, invitation message | S |
| P5.5.3 | Validation for the new fields — palette contrast, emblem presence, no invented years | M |
| P5.5.4 | `InvitationMessage` section between hero and story | S |
| P5.5.5 | Seven place emblems, drawn under the illustration conventions | L |
| P5.5.6 | Placeholder image treatment, so the gallery and story show their shape | M |

**Gate P5.5.** Content type-checks against the new contract; validation rejects a
palette pair below 4.5 : 1 and a beat with an invented year. The invitation
section renders. The page still passes every existing test.

---

### P6 — Panel journey engine · **L**

**Delivers** the machinery for full-page panels and the colour journey, proven
on **plain coloured panels with no artwork**.

| # | Task | Effort |
|---|---|---|
| P6.1 | `EventPanel` — full-viewport shell, labelled region, centred content | M |
| P6.2 | Panel ground driven by its palette, with the seam transition between neighbours | L |
| P6.3 | `usePanelState` — the five-state lifecycle, carried over from the signature design | M |
| P6.4 | Dual-threshold observer with hysteresis, mid-flight guard, queue depth one | M |
| P6.5 | `usePanelSlot` — concurrency cap of two, which at a seam is exactly the outgoing and incoming pair | M |
| P6.6 | Progress rail: four stops, current position, decorative only | M |
| P6.7 | Panel content layout — facts, swatches, decor note, venue link | M |
| P6.8 | Reduced-motion and no-script paths: panels settled, stacked, fully readable | M |
| P6.9 | Registry mapping entrance id to component, with a plain default | S |

**Gate P6.** With every panel on the plain default: four full-height panels in
date order, the ground travelling green → peach → night → maroon as the guest
scrolls, no scroll-jacking, no horizontal scroll, and every date, time and venue
legible with all motion disabled. Flick-scrolling end to end five times leaves
every panel correctly settled.

> **Same rule as before, and it matters more here.** The engine is proven on flat
> colour before any hand, burst or lamp goes near it. A full-page entrance that
> misbehaves at a seam is far harder to diagnose through four elaborate
> animations than through four rectangles.

---

### P7 — Panel entrances · **L**

**Delivers** the four real entrances. Ordered so each hand-over is built only
once both of its sides exist.

| # | Task | Why this position | Effort |
|---|---|---|---|
| P7.1 | `MehndiHands` — hands part on the green garden | First in the journey, and the asset with the longest lead time | L |
| P7.2 | `HaldiBurst` — colour breaks from the closing hands | Needs P7.1's exit to break out of | L |
| P7.3 | `SangeetLights` — dusk falls, lamps descend and ignite | Needs P7.2's ground to darken from | L |
| P7.4 | `MauliKnot` — ground lifts, cord draws, knot ties | Profile the stroke draw before styling | L |
| P7.5 | Seam hand-overs tuned as a continuous sequence | — | M |
| P7.6 | Contrast measured at each entrance's peak frame | — | S |

**Gate P7.** Scrolling the journey top to bottom reads as one continuous
celebration rather than four separate animations. Each hand-over is
unmistakable — the hands close *into* the colour burst, the burst darkens *into*
the evening, the evening lifts *into* the ceremony. Text meets 4.5 : 1 at every
frame. At least 55 fps on a mid-range 2021 Android device.

> **This is the phase the brief is really about.** "Like Apple showcasing
> iPhones" means the transitions carry the story, not that there are more of
> them. If a hand-over is not obvious, it has failed, however good the individual
> entrance looks.

---

### P8 — Gallery lightbox · **M**

**Delivers** [G5–G12]. Independent of P5–P7; can run in parallel.

| # | Task | Effort |
|---|---|---|
| P8.1 | `useFocusTrap` — cycle within, restore on release [G7, G11] | M |
| P8.2 | `useBodyScrollLock` — no iOS rubber-band leak [G10] | M |
| P8.3 | `Lightbox` — dialog semantics, scrim, letterboxing [G5, A7] | M |
| P8.4 | Prev/Next/Close, ≥ 44×44 px, wrapping navigation [G6, G9] | S |
| P8.5 | Keyboard contract: Escape, ←, → [G7] | S |
| P8.6 | Swipe ≥ 48 px, **in addition to** the buttons, never instead [G8, A9] | M |
| P8.7 | Caption and `3 / 12` position indicator [G12] | S |

**Gate P8.** Keyboard-only: open, traverse, wrap, close, focus lands back on the originating thumbnail [C6]. Background is inert and unscrollable while open. Screen reader announces the dialog and its name [A7]. Works on iOS Safari — the scroll-lock case that breaks most implementations.

---

### P9 — Hardening & launch · **L**

| # | Task | Effort |
|---|---|---|
| P9.1 | Full accessibility audit against A1–A13 | M |
| P9.2 | Screen-reader pass: VoiceOver iOS, NVDA Windows [C7] | M |
| P9.3 | Lighthouse mobile to targets [C3] | M |
| P9.4 | Transfer budget verification on cold load [C4] | S |
| P9.5 | Third-party origin audit — expect zero [C5, SS1, SS2] | S |
| P9.6 | No-JS pass: countdown → static date, signatures → `entered` [C10] | M |
| P9.7 | Print stylesheet [§8.4] | S |
| P9.8 | Clean-checkout build on a non-macOS machine [C30] | S |
| P9.9 | Console silence in a production build [C11] | S |
| P9.10 | Handover note listing every remaining `TBD` [C12] | S |
| P9.11 | Deploy, `VITE_SITE_URL`, `base` path, OG preview check in WhatsApp and iMessage | M |

**Gate P9.** All of [C1]–[C32] green.

---

## 4. Component catalogue

Every component, its single responsibility, what it explicitly does **not** own, and its dependencies. The "does not own" column is the important one — it is what stops responsibilities leaking.

### 4.1 Layer 1 — Data & pure logic

| Module | Responsibility | Does **not** own | Depends on | Rules |
|---|---|---|---|---|
| `data/types.ts` | The content contract. Type declarations only | Any value, any logic | — | §5.1 |
| `data/content.ts` | The single authored `InvitationContent` value | Formatting, ordering, presentation | `types` | §5.1 |
| `data/validate.ts` | Enforce V1–V14, fail the build, name the offending field | Fixing or defaulting bad data | `types`, `isTBD` | V1–V14, C2 |
| `lib/isTBD.ts` | Detect the sentinel | Deciding how `TBD` looks | — | E6, K10 |
| `lib/formatDate.ts` | `Intl` date and time strings | Locale choice beyond `en-IN`; `TBD` handling | — | E4, E5 |
| `lib/formatDuration.ts` | ms → padded, pluralised unit breakdown | Ticking, scheduling, clock reads | — | K6–K8 |
| `lib/groupEventsByDate.ts` | Sort by date+time, group by date | Rendering, signature assignment | `types` | E1, E2 |

> `formatDuration` takes a millisecond number, not a target and a clock. Keeping the clock read outside it is what makes 692 days, 0 seconds and negative inputs testable without touching global time.

### 4.2 Layer 2 — Primitives

| Component | Responsibility | Does **not** own | Depends on | Rules |
|---|---|---|---|---|
| `layout/Container` | Horizontal gutters, max-width, once | Vertical rhythm | — | §4.4 |
| `layout/Section` | `<section>` + `aria-labelledby` + vertical rhythm | Its own content | `Container` | A2, §4.4 |
| `layout/Header` | Sticky bar, scroll-state transition | Which links exist | `useActiveSection` | N1–N4 |
| `layout/Nav` | Link list, active marking, omission when a section is absent | Scroll mechanics | `useActiveSection` | N5–N8 |
| `layout/Divider` | Gold ornamental rule | Spacing around itself | `Ornament` | T5 |
| `a11y/SkipLink` | First focusable, hidden until focused | Where it points | — | A3 |
| `a11y/VisuallyHidden` | Screen-reader-only text | What the text says | — | K13, A9 |
| `a11y/FactValue` | Render a value, or a visible `TBD` | Which field it is given | `isTBD` | E6, K10 |
| `artwork/MotifIcon` | Six motifs, one wrapper, `aria-hidden` | Animation | tokens | E3, A5 |
| `artwork/Ornament` | Dividers, flourishes, jaali | Layout | tokens | §4.6 |
| `artwork/HeroComposition` | Nine-layer hero SVG + one-pass draw-in | Hero text, countdown | tokens, `useReducedMotion` | HA1–HA8 |

> **`FactValue` is small and load-bearing.** Centralising [E6] here is what prevents a stray `TBD` being hidden by a well-meaning `{value && ...}` somewhere in a card six weeks from now.

### 4.3 Layer 2 — Hooks

| Hook | Responsibility | Does **not** own | Depends on | Rules |
|---|---|---|---|---|
| `useReducedMotion` | Live `matchMedia` truth for motion preference | What each consumer does about it | — | M4 |
| `useScrollReveal` | Once-only reveal at 15%, staggered and capped | Signature lifecycle | `useReducedMotion` | M1–M3 |
| `useActiveSection` | Which section holds the most viewport | Rendering the nav | — | N6 |
| `useCountdown` | Drift-free tick, visibility resync, zero-crossing, cleanup | Formatting, markup | `formatDuration` | K2–K5, K9, K12 |
| `useSignatureState` | The five-state machine, hysteresis, mid-flight guard, queue depth one | What is drawn in each state | `useReducedMotion`, `useSignatureSlot` | SG1–SG7, SG10 |
| `useSignatureSlot` | Page-wide cap of two concurrent animations | Per-card state | — | SG12 |
| `useFocusTrap` | Cycle focus within a container, restore on release | Dialog semantics | — | G7, G11 |
| `useBodyScrollLock` | Lock background scroll, iOS included | Dialog semantics | — | G10 |

### 4.4 Layer 3 — Feature modules

**countdown/**

| Component | Responsibility | Does **not** own | Depends on | Rules |
|---|---|---|---|---|
| `Countdown` | Orchestrate units, completed state, `TBD` fallback | Clock arithmetic | `useCountdown`, `isTBD` | K1, K9, K10 |
| `CountdownUnit` | One numeral + label, fixed-width, pluralised | Which value it shows | `formatDuration` | K6–K8, K15 |
| `CountdownLiveText` | The hidden sentence, throttled to once a minute | Visual display | `VisuallyHidden` | K13, A12 |

**events/**

| Component | Responsibility | Does **not** own | Depends on | Rules |
|---|---|---|---|---|
| `EventList` | Order and group; render a `DateGroup` per date | Card internals | `groupEventsByDate` | E1, E2 |
| `DateGroup` | One date heading over its cards | Ordering | `formatDate` | E2, E4 |
| `EventCard` | One event's content; host its signature | Signature internals; ordering | `FactValue`, `VenueLink`, `SignatureStage`, `MotifIcon` | E3–E6, E10–E13 |
| `VenueLink` | Map link, or inert text when the URL is `TBD` | Card layout | `isTBD` | E7, E8, A10 |

> `EventCard` **hosts** a signature but knows nothing about any specific one. It reads `signature`, hands it to `SignatureStage`, and the registry resolves it. Adding a fifth signature never touches this file.

**signatures/**

| Component | Responsibility | Does **not** own | Depends on | Rules |
|---|---|---|---|---|
| `SignatureStage` | Lifecycle shell: aspect reservation, `will-change`, replay button, `aria-hidden`, reduced-motion and no-JS paths | Any specific animation | `useSignatureState`, `registry` | SG9, SG10, SG14–SG16 |
| `registry` | `SignatureId` → component. The one file a new signature touches | Lifecycle, rendering | the five below | V12 |
| `MehendiHands` | Hands parting and closing in CSS 3D | Trigger, concurrency, replay | artwork, tokens | MH1–MH7 |
| `HaldiSplash` | Turmeric wash and droplets, authored constants | as above | tokens | HS1–HS8 |
| `SangeetLights` | Lamp descent, bulb sequence, beam sweep | as above | artwork, tokens | SL1–SL7 |
| `MauliKnot` | Cord draw and knot tie; the `stroke-dashoffset` exception | as above | artwork, tokens | MK1–MK7 |
| `DefaultMotif` | Plain icon scale/fade fallback | as above | `MotifIcon` | DF1–DF4 |

> **The five signature components are pure presentation.** Each receives a phase and renders it. None registers an observer, reads scroll position, or knows another signature exists. That is what makes [SG12]'s concurrency cap enforceable in one place instead of five.

**gallery/**

| Component | Responsibility | Does **not** own | Depends on | Rules |
|---|---|---|---|---|
| `GalleryGrid` | Responsive masonry; omit below six | Lightbox state | — | G1, G2 |
| `Thumbnail` | One button, accessible name, lazy loading, reserved space | Opening behaviour | — | G3, G4 |
| `Lightbox` | Dialog, navigation, keyboard and swipe, focus restoration | Grid layout | `useFocusTrap`, `useBodyScrollLock` | G5–G12, A7 |

### 4.5 Layers 4–5 — Sections and shell

| Component | Responsibility | Does **not** own | Depends on | Rules |
|---|---|---|---|---|
| `sections/Hero` | Hero content order; composition or photo override | Countdown arithmetic; SVG internals | `HeroComposition`, `Countdown` | H1–H7 |
| `sections/Story` | Beats, alternating sides, omission when empty | Image delivery | `Divider` | T1–T6 |
| `sections/Events` | Section frame around `EventList` | Ordering, cards | `EventList` | §6.4 |
| `sections/Gallery` | Section frame; own the open-index state | Grid or lightbox internals | `GalleryGrid`, `Lightbox` | §6.7 |
| `sections/Footer` | Closing block | Links (there are none) | `Ornament` | F1–F4 |
| `AppShell` | Composition order, landmarks, which sections exist | Any section's internals | all sections | A2, D8 |

> `Gallery` owns the open-index because it is the one piece of state shared between the grid and the lightbox. Pushing it to `AppShell` would make the shell re-render on every thumbnail tap.

---

## 5. Dependencies

### 5.1 Build order

Topologically sorted. Nothing here has a cycle, and the layering in [§2.1] is what guarantees that.

```
tokens ─► Container ─► Section ─┬─► Header ─► Nav
                                │
types ─► content ─► validate    ├─► Hero ─────► HeroComposition ─► tokens
  │                             │      └──────► Countdown ─► useCountdown ─► formatDuration
  ├─► isTBD ─► FactValue        │
  ├─► formatDate ───────────────┼─► Events ─► EventList ─► DateGroup ─► EventCard
  ├─► formatDuration            │                                          ├─► VenueLink
  └─► groupEventsByDate ────────┘                                          ├─► MotifIcon
                                                                           └─► SignatureStage
                                                                                 ├─► useSignatureState ─► useSignatureSlot
                                                                                 └─► registry ─► the five signatures

useReducedMotion ─┬─► useScrollReveal ─► all sections
                  ├─► useSignatureState
                  └─► HeroComposition

Gallery ─► GalleryGrid ─► Thumbnail
   └────► Lightbox ─┬─► useFocusTrap
                    └─► useBodyScrollLock
```

### 5.2 Shared-dependency risk

Three modules have many dependants. Changing one late is expensive, so each is frozen at its phase gate:

| Module | Dependants | Frozen at |
|---|---|---|
| Palette and illustration tokens | Every component and every SVG | Gate P0 |
| `useReducedMotion` | Every motion consumer | Gate P4 |
| `useSignatureState` | All five signatures | Gate P6 |

### 5.3 Parallelisation

**Two people, or two agents:**

| Track | Phases | Note |
|---|---|---|
| A — structure | P0 → P1 → P2 → P4 → P6 → P7 | The critical path |
| B — illustration | P3 → assist P7 | Joins A at P7 |
| Either | P5, P8 | Independent once P4 lands |

**One person:** follow P0 → P9 in order, with one adjustment — start P3.6/P3.7 (the raster script) early and in the background. It is the only macOS-specific step, and discovering a problem with it during P9 is the worst time to find out.

### 5.4 External dependencies

| Kind | Items |
|---|---|
| Runtime | `react`, `react-dom`. Nothing else [§2.1] |
| Dev | Vite, TypeScript, Tailwind, ESLint, Prettier, a test runner |
| Build-time, one-off | `swift` from Xcode CLT — P3.6 only, output committed, never invoked by `npm run build` [R2] |
| Creative | **None.** No illustrator, no stock, no image model, no paid font [§2.2] |
| Content | The seven facts in [§12.1]. None blocks any phase |

---

## 6. Risk register

| # | Risk | Likelihood | Impact | Mitigation | Owned by |
|---|---|---|---|---|---|
| R1 | `stroke-dashoffset` blows the TBT budget [MK6] | Medium | Medium | Profile at the **start** of P7.3, before styling. Fallback to a transform-driven mask reveal is specified and pre-approved | P7.3 |
| R2 | CSS 3D hands read as a flat slide rather than depth | Medium | High — it is the signature feature | Prototype `perspective` and `transform-origin` in isolation before drawing final art. Build last, when nothing else is unsettled | P7.4 |
| R3 | Signature thrash on fast scroll | High if untested | High | Entire purpose of P6 gating on `DefaultMotif`. [C20] is the specific test | P6 |
| R4 | Font-swap CLS | Medium | Medium | P0.5 metric tuning, verified at Gate P0 rather than at P9 | P0.5 |
| R5 | Illustration coherence drift across a dozen SVGs | High without a gate | Medium | Tokens in P3.1, review gate P3.8, grep in [C32] | P3.8 |
| R6 | Facts never arrive before launch | Medium | Low **by design** | `TBD` renders visibly [E6]; handover note enumerates them [C12]. Nothing blocks | P9.10 |
| R7 | Devanagari falls back to box glyphs on some platform | Low | High — the theme title is Devanagari | Verify at Gate P0 on macOS, Windows and Android, not at P9 | P0.4 |
| R8 | iOS scroll-lock leaks background scroll | Medium | Medium | P8.2 tested on a real iOS device, not a simulator | P8.2 |
| R9 | Concurrency cap interacts badly with a 2-column grid | Medium | Medium | Cap is exactly 2 because a 2-column row enters together [SG12]; verify at 1440 px in [C22] | P6.5 |
| R10 | Photographs arrive late and destabilise a finished layout | Medium | Low | Photo paths built and tested in P2 even with none supplied; adding them is data, not code | P2.7 |

> **R2 deserves the attention it gets.** The hands are the moment the guest will remember, and CSS 3D either reads as depth or reads as a sliding door. The difference is `perspective` distance and `transform-origin` placement, both of which need iteration against real artwork — so P7.4 is scheduled last precisely so that iteration is the only thing happening at the time.

---

## 7. Definition of done

### 7.1 Per phase

A phase closes only when its gate in [§3] passes. Gates are not advisory.

### 7.2 Acceptance criteria mapped to phases

Where each of the spec's [C1]–[C32] is verified:

| Criterion | Verified in |
|---|---|
| C1 — all §6 rules | P9.1, running throughout |
| C2 — V1–V14 enforced | P1 gate |
| C3 — Lighthouse | P9.3 |
| C4 — transfer budget | P9.4 |
| C5 — zero third-party origins | P9.5 |
| C6 — keyboard traversal | P8 gate, P9.1 |
| C7 — screen reader | P9.2 |
| C8 — reduced motion | P4 gate, P6 gate |
| C9 — no horizontal scroll | P2 gate |
| C10 — no-JS | P9.6 |
| C11 — console silence | P9.9 |
| C12 — `TBD` handover note | P9.10 |
| C13–C16 — countdown | P5 gate |
| C17, C18 — distinct enters and exits | P7 gate |
| C19–C22 — lifecycle, thrash, hysteresis, concurrency | P6 gate |
| C23 — signature CLS | P6 gate, re-checked P9.3 |
| C24 — signatures non-essential | P2 gate (built before any signature exists) |
| C25 — `will-change` released | P6 gate |
| C26 — frame rate | P7 gate |
| C27 — mauli TBT | P7.3 |
| C28 — self-sufficiency | P9.5 |
| C29 — complete with zero photographs | P2 gate, re-checked P9 |
| C30 — builds without macOS | P3 gate, re-checked P9.8 |
| C31 — readable with no font files | P0 gate |
| C32 — illustration coherence | P3.8 |

> Note C24 and C29 land at the **P2** gate. Both are properties of building the static, photograph-free, signature-free page first — they are cheap to hold if the order is right, and expensive to retrofit if it is not.

### 7.3 Launch readiness

| # | Condition |
|---|---|
| 1 | All thirty-two acceptance criteria pass |
| 2 | Every fact in [§12.1] is either supplied or listed in the handover note as a visible `TBD` |
| 3 | Deployed over HTTPS with `VITE_SITE_URL` and the `base` path set |
| 4 | Link preview verified in WhatsApp and iMessage — the two channels this invitation will actually travel through |
| 5 | Opened on a real iOS device and a real Android device, not simulators |

---

## 8. Suggested first session

If you want a single concrete starting point rather than a phase:

1. **P0.1–P0.3** — scaffold plus tokens. An hour, and it unblocks everything.
2. **P1.1–P1.4** — the contract, the content file with `TBD` sentinels, and validation failing the build. This makes the data shape real before any component assumes one.
3. **P2.5** — `EventCard` and its children. The most load-bearing component in the project, and the fastest way to see whether the data contract holds up in practice.

By the end of that, the invitation shows real dates and venues, the build fails loudly on bad data, and every remaining phase has something concrete to attach to.
