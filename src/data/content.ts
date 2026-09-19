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
    targetInstant: '2026-12-13T11:00:00+05:30',
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
      startTime: '18:00',
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
      startTime: '10:30',
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
      startTime: '11:00',
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
    closingMessage:
      'As our beautiful journey turns the page to forever, we couldn\u2019t imagine taking this next big step without you. Please gather with us to celebrate this new beginning and shower our day with your love, blessings, and positivity.',
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
        imageId: 'ourstory-1',
        label: 'Before',
        heading: 'Same college',
        place: 'Same college',
        emblem: 'college',
        body: 'Four years on the same campus. We nodded. Occasionally. (wink)',
      },
      {
        id: 'reply',
        imageId: 'ourstory-2',
        label: 'A story, a reply',
        heading: 'An Instagram story, and a reply',
        year: 'Six years later',
        emblem: 'story',
        body: 'Six years of silence, four words on an Instagram story, one reply. Ask her which four.',
      },
      {
        id: 'common-ground',
        imageId: 'ourstory-3',
        label: 'Common ground',
        heading: 'Travel, and Formula 1',
        place: 'Travel & F1',
        emblem: 'flag',
        body: 'Boarding passes and lights out. If you know, you know.',
      },
      {
        id: 'proposal',
        imageId: 'ourstory-4',
        label: 'The question',
        heading: 'The proposal, at Marina Bay',
        place: 'Marina Bay',
        emblem: 'yacht',
        body: 'He booked a boat for the view. The view was not the point.',
      },
      {
        id: 'london',
        imageId: 'ourstory-5',
        label: 'Christmas',
        heading: 'Christmas in Covent Garden',
        place: 'Covent Garden',
        emblem: 'market',
        body: 'Our first Christmas, mostly spent pointing at lights.',
      },
      {
        id: 'edinburgh',
        imageId: 'ourstory-6',
        label: 'New Year',
        heading: 'Hogmanay in Edinburgh',
        place: 'Edinburgh',
        emblem: 'castle',
        body: 'A castle, a countdown, and no feeling left in our fingers.',
      },
      {
        id: 'engagement',
        imageId: 'ourstory-7',
        label: 'Engaged',
        heading: 'Engaged',
        year: '26 January 2026',
        emblem: 'ring',
        body: 'Two rings, two families, one date. You\u2019re looking at the consequences.',
      },
    ],
  },

  // Every photograph on the site. Each file is cropped to the polaroid well
  // (492 : 501) at 720 px wide before it is added, so what shows is the crop
  // that was chosen rather than whatever `object-fit` leaves. The story beats
  // name theirs above; the home page's are placed by `homePhotos` below.
  gallery: [
    {
      id: 'home-invitation',
      src: 'src/assets/images/photos/home-invitation.jpg',
      width: 720,
      height: 733,
      alt: 'A heart-shaped cake iced with \u201cSave the date 13.12.26\u201d',
    },
    {
      id: 'home-details-1',
      src: 'src/assets/images/photos/home-details-1.jpg',
      width: 720,
      height: 733,
      alt: 'Hands dipping into bowls of turmeric paste',
    },
    {
      id: 'home-details-2',
      src: 'src/assets/images/photos/home-details-2.jpg',
      width: 720,
      height: 733,
      alt: 'A brass tray of henna cones wrapped in coral, pink, gold and mint, beside bowls of rose petals',
    },
    {
      id: 'home-details-3',
      src: 'src/assets/images/photos/home-details-3.jpg',
      width: 720,
      height: 733,
      alt: 'A crowd dancing under a neon #SreeKoMilaBhav sign',
    },
    {
      id: 'home-ourstory-1',
      src: 'src/assets/images/photos/home-ourstory-1.jpg',
      width: 720,
      height: 733,
      alt: 'The two of them walking down a leafy lane under a rainbow umbrella',
    },
    {
      id: 'home-ourstory-2',
      src: 'src/assets/images/photos/home-ourstory-2.jpg',
      width: 720,
      height: 733,
      alt: 'Two selfies taken on the same train, one of each of them',
    },
    {
      id: 'home-ourstory-3',
      src: 'src/assets/images/photos/home-ourstory-3.jpg',
      width: 720,
      height: 733,
      alt: 'Him on one knee before her at the edge of a lake',
    },
    {
      id: 'home-below-savethedate',
      src: 'src/assets/images/photos/home-below-savethedate.jpg',
      width: 720,
      height: 733,
      alt: 'The two of them by a pond, she in a silk sari',
    },
    {
      id: 'ourstory-1',
      src: 'src/assets/images/photos/ourstory-1.jpg',
      width: 720,
      height: 733,
      alt: 'Two hands held at the water\u2019s edge',
    },
    {
      id: 'ourstory-2',
      src: 'src/assets/images/photos/ourstory-2.jpg',
      width: 720,
      height: 733,
      alt: 'The two of them at a picnic on the grass',
    },
    {
      id: 'ourstory-3',
      src: 'src/assets/images/photos/ourstory-3.jpg',
      width: 720,
      height: 733,
      alt: 'A mirror selfie in a lift, in Ferrari and Mercedes team shirts',
    },
    {
      id: 'ourstory-4',
      src: 'src/assets/images/photos/ourstory-4.jpg',
      width: 720,
      height: 733,
      alt: 'The two of them on a boat at night, fireworks over the water',
    },
    {
      id: 'ourstory-5',
      src: 'src/assets/images/photos/ourstory-5.jpg',
      width: 720,
      height: 733,
      alt: 'The two of them under the Christmas tree in Covent Garden',
    },
    {
      id: 'ourstory-6',
      src: 'src/assets/images/photos/ourstory-6.jpg',
      width: 720,
      height: 733,
      alt: 'A New Year selfie under the fireworks in Edinburgh',
    },
    {
      id: 'ourstory-7',
      src: 'src/assets/images/photos/ourstory-7.jpg',
      width: 720,
      height: 733,
      alt: 'Her hennaed hands on his face, both of them laughing',
    },
  ],

  // The polaroids on the home page, top to bottom. A slot left out keeps its
  // drawn stand-in.
  homePhotos: {
    invitation: 'home-invitation',
    'details-1': 'home-details-1',
    'details-2': 'home-details-2',
    'details-3': 'home-details-3',
    'story-1': 'home-ourstory-1',
    'story-2': 'home-ourstory-2',
    'story-3': 'home-ourstory-3',
    'save-the-date': 'home-below-savethedate',
  },

  footer: {
    message: 'Can\u2019t wait to celebrate with you',
    hostedByLines: PENDING,
  },
}
