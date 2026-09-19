import { describe, expect, it } from 'vitest'
import { validateContent } from './validate'
import { PENDING, type InvitationContent } from './types'

/** A minimal, valid content object. Each test bends exactly one thing. */
function baseContent(): InvitationContent {
  return {
    couple: {
      brideName: 'Bhavna',
      groomName: 'Sreetam',
      leadName: 'groom',
      hashtag: '#SreekomilaBhav',
    },
    invitation: { heading: 'Together with our families', message: PENDING },
    theme: { title: 'Mangal Sutra', titleDevanagari: 'मंगल सूत्र', tagline: 'Bound by rituals.' },
    hero: { dateLabel: '11 December 2026', cityLabel: PENDING },
    countdown: {
      targetInstant: PENDING,
      headingLabel: 'Until we say yes',
      completedMessage: 'Today is the day',
    },
    playlist: { heading: 'Playlist', cue: 'Click here', url: PENDING },
    venues: [
      {
        id: 'suraj-palace',
        name: 'Suraj Palace',
        addressLines: PENDING,
        city: PENDING,
        mapsUrl: PENDING,
      },
    ],
    events: [
      {
        id: 'mehendi',
        name: 'Mehendi',
        title: 'Mehendi',
        date: '2026-12-11',
        startTime: PENDING,
        venueId: 'suraj-palace',
        motif: 'lotus',
        palette: 'plain',
        signature: 'none',
      },
    ],
    story: { heading: 'Our Story', beats: [], closingMessage: PENDING },
    gallery: [],
    homePhotos: {},
    footer: { message: PENDING, hostedByLines: PENDING },
  }
}

function fieldsFailing(content: InvitationContent): string[] {
  return validateContent(content).map((failure) => failure.field)
}

describe('content validation', () => {
  it('accepts the baseline content with no failures', () => {
    expect(validateContent(baseContent())).toEqual([])
  })

  it('accepts an empty gallery as a supported configuration', () => {
    const content = baseContent()
    content.gallery = []
    expect(validateContent(content)).toEqual([])
  })
})

describe('referential integrity', () => {
  it('rejects an event pointing at a venue that does not exist', () => {
    const content = baseContent()
    content.events[0]!.venueId = 'nowhere'
    expect(fieldsFailing(content)).toContain('events[0].venueId')
  })

  it('rejects a story beat pointing at an image that does not exist', () => {
    const content = baseContent()
    content.story.beats = [
      { id: 'beat', label: 'Stop', heading: 'Beat', body: 'Text', emblem: 'hills', imageId: 'ghost' },
    ]
    expect(fieldsFailing(content)).toContain('story.beats[0].imageId')
  })

  it('rejects a home photograph pointing at an image that does not exist', () => {
    const content = baseContent()
    content.homePhotos = { 'story-2': 'ghost' }
    expect(fieldsFailing(content)).toContain('homePhotos.story-2')
  })

  it('rejects a hero image that does not exist', () => {
    const content = baseContent()
    content.hero.imageId = 'ghost'
    expect(fieldsFailing(content)).toContain('hero.imageId')
  })
})

describe('gallery files', () => {
  const photo = {
    id: 'shore',
    src: 'src/assets/images/photos/shore.jpg',
    width: 720,
    height: 733,
    alt: 'Two hands held at the shore',
  }

  it('accepts a photograph that is in the photo folder and on disk', () => {
    const content = baseContent()
    content.gallery = [photo]
    expect(validateContent(content, { assetExists: () => true })).toEqual([])
  })

  it('rejects a photograph that is not on disk', () => {
    const content = baseContent()
    content.gallery = [photo]
    const fields = validateContent(content, { assetExists: () => false }).map((f) => f.field)
    expect(fields).toContain('gallery[0].src')
  })

  it('rejects a photograph outside the photo folder, which would never be bundled', () => {
    const content = baseContent()
    content.gallery = [{ ...photo, src: 'public/shore.jpg' }]
    expect(fieldsFailing(content)).toContain('gallery[0].src')
  })
})

describe('identifier uniqueness', () => {
  it('rejects two venues sharing an identifier', () => {
    const content = baseContent()
    content.venues.push({ ...content.venues[0]! })
    expect(fieldsFailing(content)).toContain('venues')
  })
})

describe('collections and alt text', () => {
  it('rejects an empty event list', () => {
    const content = baseContent()
    content.events = []
    expect(fieldsFailing(content)).toContain('events')
  })

  it('rejects a gallery image with blank alt text', () => {
    const content = baseContent()
    content.gallery = [{ id: 'one', src: '/a.jpg', width: 1200, height: 800, alt: '  ' }]
    expect(fieldsFailing(content)).toContain('gallery[0].alt')
  })
})

describe('date and time formats', () => {
  it('rejects a date that does not exist in the calendar', () => {
    const content = baseContent()
    content.events[0]!.date = '2026-02-31'
    expect(fieldsFailing(content)).toContain('events[0].date')
  })

  it('rejects a start time outside 24-hour form', () => {
    const content = baseContent()
    content.events[0]!.startTime = '6:30 PM'
    expect(fieldsFailing(content)).toContain('events[0].startTime')
  })

  it('accepts a valid leap day', () => {
    const content = baseContent()
    content.events[0]!.date = '2028-02-29'
    expect(validateContent(content)).toEqual([])
  })
})

describe('end time ordering', () => {
  it('rejects an end time that precedes its start', () => {
    const content = baseContent()
    content.events[0]!.startTime = '19:00'
    content.events[0]!.endTime = '18:00'
    expect(fieldsFailing(content)).toContain('events[0].endTime')
  })

  it('accepts an end time after its start', () => {
    const content = baseContent()
    content.events[0]!.startTime = '18:00'
    content.events[0]!.endTime = '22:00'
    expect(validateContent(content)).toEqual([])
  })
})

describe('venue map urls', () => {
  it('rejects a relative map url', () => {
    const content = baseContent()
    content.venues[0]!.mapsUrl = '/maps/suraj-palace'
    expect(fieldsFailing(content)).toContain('venues[0].mapsUrl')
  })

  it('rejects an insecure map url', () => {
    const content = baseContent()
    content.venues[0]!.mapsUrl = 'http://maps.google.com/?q=suraj'
    expect(fieldsFailing(content)).toContain('venues[0].mapsUrl')
  })

  it('accepts an absolute secure map url', () => {
    const content = baseContent()
    content.venues[0]!.mapsUrl = 'https://maps.google.com/?q=suraj'
    expect(validateContent(content)).toEqual([])
  })
})

describe('countdown target offset', () => {
  it('rejects a floating local time with no offset', () => {
    const content = baseContent()
    content.countdown.targetInstant = '2026-12-13T19:30:00'
    expect(fieldsFailing(content)).toContain('countdown.targetInstant')
  })

  it('accepts an instant with a numeric offset', () => {
    const content = baseContent()
    content.countdown.targetInstant = '2026-12-13T19:30:00+05:30'
    expect(validateContent(content)).toEqual([])
  })

  it('accepts an instant in UTC', () => {
    const content = baseContent()
    content.countdown.targetInstant = '2026-12-13T14:00:00Z'
    expect(validateContent(content)).toEqual([])
  })
})

describe('signature assignment', () => {
  it('rejects two events claiming the same signature', () => {
    const content = baseContent()
    content.events[0]!.signature = 'haldi-burst'
    content.events.push({
      ...content.events[0]!,
      id: 'sangeet',
      date: '2026-12-12',
      signature: 'haldi-burst',
    })
    const failure = validateContent(content).find((f) => f.field === 'events[].signature')
    expect(failure?.message).toContain('mehendi')
    expect(failure?.message).toContain('sangeet')
  })

  it('allows more than one event to opt out with none', () => {
    const content = baseContent()
    content.events.push({ ...content.events[0]!, id: 'haldi', date: '2026-12-12' })
    expect(validateContent(content)).toEqual([])
  })
})

describe('signature artwork presence', () => {
  it('rejects the hand signature when its artwork is missing', () => {
    const content = baseContent()
    content.events[0]!.signature = 'mehndi-hands'
    const failures = validateContent(content, { assetExists: () => false })
    expect(failures).toHaveLength(3)
    expect(failures[0]!.message).toContain('artwork is missing')
  })

  it('accepts the hand signature when its artwork is present', () => {
    const content = baseContent()
    content.events[0]!.signature = 'mehndi-hands'
    expect(validateContent(content, { assetExists: () => true })).toEqual([])
  })

  it('does not require hand artwork when no event uses that signature', () => {
    expect(validateContent(baseContent(), { assetExists: () => false })).toEqual([])
  })
})

describe('story beats', () => {
  it('rejects a beat whose year was left blank rather than omitted', () => {
    const content = baseContent()
    content.story.beats = [{ id: 'beat', label: 'Stop', heading: 'Beat', body: 'Text', emblem: 'ring', year: ' ' }]
    expect(fieldsFailing(content)).toContain('story.beats[0].year')
  })

  it('accepts a beat with a place and no date', () => {
    const content = baseContent()
    content.story.beats = [
      { id: 'beat', label: 'Stop', heading: 'Beat', body: 'Text', place: 'Ooty', emblem: 'hills' },
    ]
    expect(validateContent(content)).toEqual([])
  })
})

describe('panel palette contrast', () => {
  it('rejects a palette whose text is unreadable on its ground', () => {
    const content = baseContent()
    content.events[0]!.palette = 'mehndi'
    const failures = validateContent(content, {
      assetExists: () => true,
      // Both tokens resolve to near-identical greys.
      resolveToken: () => '#808080',
    })
    expect(failures.map((failure) => failure.field)).toContain('events[0].palette')
    expect(failures[0]!.message).toContain('4.5:1')
  })

  it('accepts a palette that meets the contrast floor', () => {
    const content = baseContent()
    content.events[0]!.palette = 'mehndi'
    const tokens: Record<string, string> = {
      'var(--color-mehndi-canopy)': '#1f3b2c',
      'var(--color-mehndi-cream)': '#f2e8d5',
    }
    const failures = validateContent(content, {
      assetExists: () => true,
      resolveToken: (token) => tokens[token],
    })
    expect(failures).toEqual([])
  })
})

describe('countdown and wedding event agreement', () => {
  it('rejects a countdown target that disagrees with the wedding card', () => {
    const content = baseContent()
    content.events[0]!.signature = 'mauli-knot'
    content.events[0]!.date = '2026-12-13'
    content.events[0]!.startTime = '19:30'
    content.countdown.targetInstant = '2026-12-13T20:30:00+05:30'
    expect(fieldsFailing(content)).toContain('countdown.targetInstant')
  })

  it('accepts a countdown target that matches the wedding card', () => {
    const content = baseContent()
    content.events[0]!.signature = 'mauli-knot'
    content.events[0]!.date = '2026-12-13'
    content.events[0]!.startTime = '19:30'
    content.countdown.targetInstant = '2026-12-13T19:30:00+05:30'
    expect(validateContent(content, { assetExists: () => true })).toEqual([])
  })
})

describe('failure collection', () => {
  it('reports every fault rather than stopping at the first', () => {
    const content = baseContent()
    content.events[0]!.venueId = 'nowhere'
    content.events[0]!.date = '2026-13-45'
    content.countdown.targetInstant = '2026-12-13T19:30:00'
    const fields = fieldsFailing(content)
    expect(fields).toContain('events[0].venueId')
    expect(fields).toContain('events[0].date')
    expect(fields).toContain('countdown.targetInstant')
  })
})
