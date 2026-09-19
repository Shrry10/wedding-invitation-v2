# Handover — what the site still needs

**Site:** Sreetam & Bhavna, 11–13 December 2026, Bhubaneswar
**Status:** Built and verified locally. Not yet deployed.
**Countdown:** live, counting to 13 December 2026, 10:00 IST.

Everything below is a fact or an asset only you can supply. Nothing here blocks
the site from running — each gap renders a visible *"To be confirmed"* marker
rather than disappearing, so the shape of the finished page is already there.

---

## 1. Words we still need

| Where it shows | What is missing | Field |
|---|---|---|
| Below the hero | **The invitation message** — the formal wording from the families | `invitation.message` |
| Our Story, all seven stops | **The prose for each beat.** Places and order are set; the words are not | `story.beats[].body` |
| Footer | **The closing message** and the "hosted by" family lines | `footer.message`, `footer.hostedByLines` |

The story stops, in the order they appear: Ooty · Singapore · Marina Bay ·
Covent Garden · Edinburgh · Engagement (26 January 2026) · Mauritius.
Two or three sentences each is plenty.

---

## 2. Pictures

Photographs are optional and the site is complete without them. Until they
arrive, the gallery and the story show **authored placeholders** that say
plainly what is missing.

To add them: drop files into `src/assets/images/` and list them in
`content.gallery`. Six or more switches the gallery from placeholders to real
photographs automatically.

| Want | Minimum |
|---|---|
| Gallery | 6 photographs, at least 1200px wide |
| Story stops | One per beat, optional — a stop without one shows its emblem instead |
| Hero | Not needed. The hero is drawn, not photographed |

---

## 3. Two things to check before the link goes out

**The venue map links are searches, not pins.** They resolve by name and
locality, which is usually right — but a search can land a guest at the wrong
branch. Open each one and replace it with the exact pin:

- `venues[0].mapsUrl` — Hotel Suraj Palace, Patia Road
- `venues[1].mapsUrl` — Aura Lawns, Patia
- `venues[2].mapsUrl` — Greenland Resort, Patia

**The decor decks disagree with your brief about two times.** The site uses your
brief, which you confirmed is the source of truth. Noted here only so nobody
later reads the decks and thinks the site is wrong:

| Event | On the site (your brief) | In the decks |
|---|---|---|
| Mehndi | 7:00 PM | 1:00 PM |
| Haldi | 10:00 AM | 12 – 2 PM |
| Sangeet | 7:00 PM | 7 pm — agrees |

---

## 4. Choices made for you

Each has a default in place. Say the word and any of them changes.

| Thing | Currently | Where |
|---|---|---|
| Name order | **Sreetam & Bhavna** — your brief's order, though the deck cover reads the other way | `couple.leadName` |
| Countdown copy | *"Until we say yes"* / *"Today is the day"* | `countdown.headingLabel` |
| Decor notes | One line per event conveying the *feel*, not the inventory | `events[].decorNote` |
| Haldi colour | Turmeric yellow leads, with the deck's pink, orange and purple as the other pigments — your brief's "yellow splash like holi" | `eventPalettes.ts` |
| Event palettes | Taken from the decor decks | `src/data/eventPalettes.ts` — replace the file and nothing else changes |
| Dress codes | Not shown. The field exists but was not in the brief | `events[].dressCode` |
| Add to calendar | Not built | — |

---

## 5. To deploy

```bash
cp .env.example .env.production   # set VITE_SITE_URL to the real domain
npm run build                     # outputs dist/
```

Upload `dist/` to any static host over HTTPS. There is no server, no database
and no third-party service.

**Set `VITE_SITE_URL`.** Without it the social preview tags stay relative, and a
link shared to WhatsApp shows no picture. The build warns if it is missing.

---

## 6. Still to verify on real hardware

These could not be checked from a development machine and need a person with a
device:

- Screen-reader pass — VoiceOver on iOS, NVDA on Windows
- Lighthouse run on a throttled mobile connection
- Swipe between photographs, and the scroll lock behind an open photograph, on a real iPhone
- Frame rate through the event journey on a mid-range Android handset
- Link preview in WhatsApp and iMessage once deployed
- Devanagari rendering on Windows and Android with the font files removed

---

## 7. Where things live

| File | What it holds |
|---|---|
| `src/data/content.ts` | **Every word and fact on the site.** Nothing else holds content |
| `src/data/eventPalettes.ts` | The four event colour worlds |
| `src/index.css` | The only file containing a colour value |
| `resc/docs/2-spec.md` | What the site does and why |
| `public/og-image.png` | The social preview. Regenerate with `npm run dev` + `npm run rasters` after artwork changes |

Editing `content.ts` and rebuilding is the whole workflow. The build refuses
invalid content — a countdown target without a timezone, two events claiming
one entrance, a palette whose text is unreadable on its ground — and tells you
which field is wrong.
