import { PENDING, type InvitationContent } from './types'

/**
 * The single source of truth for everything the invitation renders.
 *
 * Facts confirmed from the planner's decks are written out. Everything still
 * unknown carries the pending sentinel, which renders visibly on the page and
 * is listed in the handover note — it is never hidden and never guessed.
 *
 * Changing the invitation means editing this file and rebuilding. No other
 * file holds content.
 *
 * Signatures: every event opts out with `none`. The panel entrances belonged
 * to a design that was scrapped, and the build checks that a claimed
 * signature's artwork exists — so an event claims one only once it is drawn.
 */
export const content: InvitationContent = {
  couple: {
    brideName: 'Bhavna',
    groomName: 'Sreetam',
    leadName: 'groom',
    hashtag: '#SreekomilaBhav',
  },

  invitation: {
    heading: 'Together with our families',
    message: 'Unfolding the celebrations',
  },

  theme: {
    title: 'Mangal Sutra',
    titleDevanagari: 'मंगल सूत्र',
    tagline: 'Bound by rituals, crafted by devotion, celebrated forever.',
  },

  hero: {
    // No imageId: the authored composition is the intended hero treatment.
    dateLabel: '11 – 13 December 2026',
    cityLabel: 'Bhubaneswar',
  },

  countdown: {
    // The marriage ceremony, in India Standard Time. The offset is explicit so
    // every guest sees the same remaining time wherever they are.
    targetInstant: '2026-12-13T10:00:00+05:30',
    headingLabel: 'Until we say yes',
    headingEmphasis: 'yes',
    completedMessage: 'Today is the day',
  },

  playlist: {
    heading: 'Playlist',
    cue: 'Click here',
    // Add the link here when the songs are chosen — Spotify, YouTube Music,
    // anything with a public URL. Nothing else needs to change.
    url: PENDING,
  },

  // Map links are Google Maps *searches* by name and locality, not pinned
  // coordinates. They resolve correctly, but replace them with exact pins once
  // you have them — a search can land a guest at the wrong branch.
  venues: [
    {
      id: 'suraj-palace',
      name: 'Hotel Suraj Palace',
      addressLines: ['Patia Road'],
      city: 'Bhubaneswar',
      mapsUrl:
        'https://www.google.com/maps/search/?api=1&query=Hotel%20Suraj%20Palace%2C%20Patia%20Road%2C%20Bhubaneswar',
    },
    {
      id: 'aura-lawns',
      name: 'Aura Lawns',
      addressLines: ['Patia'],
      city: 'Bhubaneswar',
      mapsUrl:
        'https://www.google.com/maps/search/?api=1&query=Aura%20Lawns%2C%20Patia%2C%20Bhubaneswar',
    },
    {
      id: 'greenland-resort',
      name: 'Greenland Resort',
      addressLines: ['Patia'],
      city: 'Bhubaneswar',
      mapsUrl:
        'https://www.google.com/maps/search/?api=1&query=Greenland%20Resort%2C%20Patia%2C%20Bhubaneswar',
    },
  ],

  events: [
    {
      id: 'mehndi',
      name: 'Mehndi',
      title: 'The Henna Garden',
      nameDevanagari: 'मेहंदी',
      date: '2026-12-11',
      startTime: '19:00',
      venueId: 'suraj-palace',
      dressCode: PENDING,
      motif: 'lotus',
      palette: 'mehndi',
      signature: 'none',
      decorNote: 'A green garden after dark, hung with marigold and lit from below.',
    },
    {
      id: 'haldi',
      name: 'Haldi',
      title: 'Touched by Turmeric',
      nameDevanagari: 'हल्दी',
      date: '2026-12-12',
      startTime: '10:00',
      venueId: 'aura-lawns',
      dressCode: PENDING,
      motif: 'kalash',
      palette: 'haldi',
      signature: 'none',
      decorNote: 'Open lawn, colour in the air, and nobody leaving clean.',
    },
    {
      id: 'sangeet',
      name: 'Sangeet',
      title: 'Strings & Songs',
      nameDevanagari: 'संगीत',
      date: '2026-12-12',
      startTime: '19:00',
      venueId: 'aura-lawns',
      dressCode: PENDING,
      motif: 'bell',
      palette: 'sangeet',
      signature: 'none',
      decorNote: 'Velvet green under a canopy of warm bulbs. Dancing until late.',
    },
    {
      id: 'marriage',
      name: 'Marriage',
      // Hatha Ganthi — the hands bound together with thread — is the Odia
      // wedding's own rite, and the thread is the deck's motif throughout.
      title: 'Bound by Thread',
      nameDevanagari: 'विवाह',
      date: '2026-12-13',
      startTime: '10:00',
      venueId: 'greenland-resort',
      dressCode: PENDING,
      motif: 'knot',
      palette: 'marriage',
      signature: 'none',
      decorNote: 'Morning light, temple arches, and the thread that ties it all.',
    },
  ],

  story: {
    heading: 'Our Story',
    closingMessage: PENDING,
    // The story, in the order it happened — and it is a story, not an
    // itinerary. Two people who knew each other and were not friends, six years
    // of nothing, one reply to an Instagram story, and everything after. The
    // places are where the chapters were, not the chapters themselves.
    //
    // `label` is the line in caps, `place` or `year` the line under it, and
    // `body` the sentence under the photograph. `heading` is the beat's title
    // for anywhere that lists them.
    //
    // The sentences tease rather than explain. A guest who was there will
    // recognise the moment; one who wasn't should want to ask about it at the
    // wedding — which is the point of putting them on an invitation. So the
    // four words on the story are not printed, the proposal is a boat booked
    // for the view, and "lights out" is left for the people who know.
    //
    // The wedding is not a beat. The route already ends on a heart in the slot
    // where the next photograph would go: that slot is the wedding, and the
    // rest of this site is its invitation.
    beats: [
      {
        id: 'college',
        label: 'Before',
        heading: 'Same college',
        place: 'Same college',
        emblem: 'college',
        body: 'Four years on the same campus. We nodded. Occasionally. (wink)',
      },
      {
        id: 'reply',
        label: 'A story, a reply',
        heading: 'An Instagram story, and a reply',
        year: 'Six years later',
        emblem: 'story',
        body: 'Six years of silence, four words on an Instagram story, one reply. Ask her which four.',
      },
      {
        id: 'common-ground',
        label: 'Common ground',
        heading: 'Travel, and Formula 1',
        place: 'Travel & F1',
        emblem: 'flag',
        body: 'Boarding passes and lights out. If you know, you know.',
      },
      {
        id: 'proposal',
        label: 'The question',
        heading: 'The proposal, at Marina Bay',
        place: 'Marina Bay',
        emblem: 'yacht',
        body: 'He booked a boat for the view. The view was not the point.',
      },
      {
        id: 'london',
        label: 'Christmas',
        heading: 'Christmas in Covent Garden',
        place: 'Covent Garden',
        emblem: 'market',
        body: 'Our first Christmas, mostly spent pointing at lights.',
      },
      {
        id: 'edinburgh',
        label: 'New Year',
        heading: 'Hogmanay in Edinburgh',
        place: 'Edinburgh',
        emblem: 'castle',
        body: 'A castle, a countdown, and no feeling left in our fingers.',
      },
      {
        id: 'engagement',
        label: 'Engaged',
        heading: 'Engaged',
        year: '26 January 2026',
        emblem: 'ring',
        body: 'Two rings, two families, one date. You\u2019re looking at the consequences.',
      },
    ],
  },

  // Empty by default. The gallery removes itself entirely below six images.
  gallery: [],

  footer: {
    message: 'Can\u2019t wait to celebrate with you',
    hostedByLines: PENDING,
  },
}
