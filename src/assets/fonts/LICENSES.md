# Vendored typefaces

All three faces are licensed under the **SIL Open Font License, Version 1.1**.
The full licence text is in `OFL.txt` in this directory and applies to all three.

| File | Family | Copyright |
|---|---|---|
| `marcellus-400-latin.woff2` | Marcellus | Copyright (c) Brian J. Bonislawski |
| `cormorant-garamond-variable-latin.woff2` | Cormorant Garamond | Copyright (c) The Cormorant Project Authors |
| `tiro-devanagari-hindi-400-latin-subset.woff2` | Tiro Devanagari Hindi | Copyright (c) The Tiro Devanagari Project Authors |

## Notes

- The Cormorant Garamond file is a **variable** font. Google Fonts serves one
  identical file for weights 400, 500 and 600, so a single file is vendored and
  declared with a weight range rather than three duplicate copies.
- The Tiro Devanagari Hindi file is **subset** to the Devanagari glyphs this
  site actually renders (the theme title and the function names). Regenerate it
  with `pyftsubset` if new Devanagari copy is added; otherwise the system
  Devanagari fallback will render the additions instead.

## Pinyon Script

- File: `pinyon-script-400-latin.woff2` (latin subset, 28 KB)
- Designer: Nicole Fally
- Licence: SIL Open Font License 1.1 (see `OFL.txt`)
- Source: Google Fonts, `fonts.gstatic.com`, subset to latin
- Used for: script headings ("Date and Location", "Our Story", "Countdown")

## Cinzel

- File: `cinzel-variable-latin.woff2` (variable, weights 400–900, latin subset, 26 KB)
- Designer: Natanael Gama
- Licence: SIL Open Font License 1.1 (see `OFL.txt`)
- Source: Google Fonts, `fonts.gstatic.com`, latin subset
- Used for: digits only, everywhere. The `@font-face` is limited by
  `unicode-range` to 0–9, so Cormorant Garamond still sets every other
  character; Cinzel replaces Cormorant's old-style figures with even-height
  engraved ones.
