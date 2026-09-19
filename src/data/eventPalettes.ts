import type { EventPalette, PaletteId } from './types'

/**
 * One colour world per function.
 *
 * Every value here is a custom-property reference, never a literal, so the
 * palette is defined once in the stylesheet and a client-supplied palette
 * replaces it in one place.
 *
 * Sources: the marriage deck prints its palette, named and with hex values,
 * and those are used verbatim. The other three decks are photographs, so their
 * hues were measured off the pages — see the token block in the stylesheet
 * for which page each came from. The brief names the ground of each: the
 * Mehndi green, the Haldi yellow splash, the Sangeet night.
 *
 * The swatches are the exception: they are the dress code the couple chose,
 * not colours measured off the decor, so they point at their own tokens.
 * Their names are the thing each colour is, not the colour word: a flower,
 * a stone, a fruit — Juniper, not green. Each function keeps to a world of
 * its own: garden, blooms, gemstones, pastels.
 */
export const eventPalettes: Record<Exclude<PaletteId, 'plain'>, EventPalette> = {
  mehndi: {
    ground: 'var(--color-mehndi-canopy)',
    text: 'var(--color-mehndi-cream)',
    accents: [
      'var(--color-mehndi-foliage)',
      'var(--color-mehndi-marigold)',
      'var(--color-mehndi-rose)',
    ],
    swatches: [
      { label: 'Juniper', token: 'var(--color-dress-mehndi-green)' },
      { label: 'Pistachio', token: 'var(--color-dress-mehndi-sage)' },
      { label: 'Peony', token: 'var(--color-dress-mehndi-pink)' },
      { label: 'Poppy', token: 'var(--color-dress-mehndi-red)' },
      { label: 'Peacock', token: 'var(--color-dress-mehndi-blue)' },
    ],
  },

  haldi: {
    ground: 'var(--color-haldi-turmeric)',
    text: 'var(--color-haldi-ink)',
    accents: [
      'var(--color-haldi-sunflower)',
      'var(--color-haldi-marigold)',
      'var(--color-haldi-rouge)',
      'var(--color-haldi-orchid)',
    ],
    swatches: [
      { label: 'Daffodil', token: 'var(--color-dress-haldi-yellow)' },
      { label: 'Ochre', token: 'var(--color-dress-haldi-mustard)' },
      { label: 'Marigold', token: 'var(--color-dress-haldi-orange)' },
      { label: 'Bluebell', token: 'var(--color-dress-haldi-sky)' },
      { label: 'Azure', token: 'var(--color-dress-haldi-cerulean)' },
    ],
  },

  sangeet: {
    ground: 'var(--color-sangeet-night)',
    text: 'var(--color-sangeet-cream)',
    accents: [
      'var(--color-sangeet-forest)',
      'var(--color-sangeet-rose-gold)',
      'var(--color-sangeet-bulb)',
    ],
    swatches: [
      { label: 'Topaz', token: 'var(--color-dress-sangeet-champagne)' },
      { label: 'Platinum', token: 'var(--color-dress-sangeet-silver)' },
      { label: 'Amethyst', token: 'var(--color-dress-sangeet-purple)' },
      { label: 'Garnet', token: 'var(--color-dress-sangeet-red)' },
      { label: 'Emerald', token: 'var(--color-dress-sangeet-emerald)' },
    ],
  },

  marriage: {
    ground: 'var(--color-ivory)',
    // The deck's maroon, not the site's: the envelopes were measured off the
    // reference website and are a different, bluer red.
    text: 'var(--color-marriage-maroon)',
    accents: [
      'var(--color-deep-red)',
      'var(--color-mauli-orange)',
      'var(--color-antique-gold)',
    ],
    swatches: [
      { label: 'Pearl', token: 'var(--color-dress-marriage-off-white)' },
      { label: 'Buttercup', token: 'var(--color-dress-marriage-yellow)' },
      { label: 'Chambray', token: 'var(--color-dress-marriage-blue)' },
      { label: 'Wisteria', token: 'var(--color-dress-marriage-lilac)' },
      { label: 'Celadon', token: 'var(--color-dress-marriage-green)' },
    ],
  },
}

/** The plain treatment, for an event that declares no entrance of its own. */
export const defaultPalette: EventPalette = {
  ground: 'var(--color-sand-beige)',
  text: 'var(--color-maroon)',
  accents: ['var(--color-antique-gold)'],
  swatches: [],
}

export function paletteFor(palette: PaletteId): EventPalette {
  return palette === 'plain' ? defaultPalette : eventPalettes[palette]
}
