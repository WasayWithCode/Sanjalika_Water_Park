/**
 * Sanjalika Water Park — Local Asset Registry
 * Maps project images/videos to page sections (no external placeholders).
 * Downloads registry updated July 2026 — 10 real PDF documents.
 */
'use strict';

const SANJALIKA_ASSETS = {
  base: 'assets/images/',
  videos: {
    primary: 'assets/videos/hero_background.mp4',
    fallback: 'assets/videos/hero_background2.mp4'
  },
  heroPoster: 'assets/images/Rides_&_Slides.jpg',
  images: {
    rides: [
      'Rides.jpg',
      'Rides_&_Slides.jpg',
      'Rides_&_Slides2.jpg',
      'Rides_&_Slides3.jpg',
      'Rides_&_Slides4.jpg'
    ],
    slides: ['Slides.jpg', 'Slides (2).jpg', 'Slides3.jpg'],
    gallery: [
      'Rides_&_Slides.jpg',
      'Rides_&_Slides2.jpg',
      'Rides_&_Slides3.jpg',
      'Rides_&_Slides4.jpg',
      'Slides.jpg',
      'Slides (2).jpg',
      'Slides3.jpg',
      'Rides.jpg'
    ],
    about:    'Rides_&_Slides.jpg',
    booking:  'Rides_&_Slides3.jpg',
    food:     'Rides_&_Slides2.jpg',
    facilities: 'Rides_&_Slides4.jpg',
    contact:  'Slides3.jpg',
    cta:      'Rides_&_Slides.jpg'
  },

  /* ── Downloads registry ──────────────────────────────────────────────────
     Each entry maps directly to a real PDF in assets/documents/.
     Fields:
       id          — unique key used by JS
       title       — display title on the card
       category    — used by the filter buttons
       file        — path to the actual file (download attribute target)
       type        — badge label (PDF / DOC)
       size        — human-readable file size
       pages       — page count label shown in metadata
       updated     — last-updated label shown in metadata
       description — one-sentence summary shown on the card
       icon        — Font Awesome icon class for the preview overlay
       preview     — image filename (resolved via assetUrl())
       downloads   — initial download count displayed on card
  ── */
  downloads: [
    {
      id:          'visitor-guide',
      title:       'Visitor Guide 2026',
      category:    'Visitor Guide',
      file:        'assets/documents/visitor-guide.pdf',
      type:        'PDF',
      size:        '20 KB',
      pages:       '4 pages',
      updated:     'Jul 2026',
      description: 'Complete pre-arrival guide: welcome message, park intro, timings, entry rules, safety, facilities, and full contact details.',
      icon:        'fa-book-open',
      preview:     'Rides_&_Slides3.jpg',
      downloads:   3102
    },
    {
      id:          'park-brochure',
      title:       'Park Brochure 2026',
      category:    'Brochure',
      file:        'assets/documents/park-brochure.pdf',
      type:        'PDF',
      size:        '20 KB',
      pages:       '4 pages',
      updated:     'Jul 2026',
      description: 'Full park overview: attractions, water rides, family activities, Food Zone, ticket prices, opening hours, and directions.',
      icon:        'fa-file-pdf',
      preview:     'Rides_&_Slides.jpg',
      downloads:   2847
    },
    {
      id:          'park-map',
      title:       'Park Map Guide 2026',
      category:    'Park Map',
      file:        'assets/documents/park-map.pdf',
      type:        'PDF',
      size:        '17 KB',
      pages:       '3 pages',
      updated:     'Jul 2026',
      description: 'Detailed zone layout with ride locations, food court, prayer areas, parking, lockers, first aid posts, and emergency exits.',
      icon:        'fa-map',
      preview:     'Slides.jpg',
      downloads:   4521
    },
    {
      id:          'ticket-information',
      title:       'Ticket Information 2026',
      category:    'Visitor Guide',
      file:        'assets/documents/ticket-information.pdf',
      type:        'PDF',
      size:        '12 KB',
      pages:       '2 pages',
      updated:     'Jul 2026',
      description: 'Full pricing for adult, child, family, and VIP passes, group discounts, payment methods, and refund policy.',
      icon:        'fa-ticket',
      preview:     'Rides.jpg',
      downloads:   1876
    },
    {
      id:          'safety-guide',
      title:       'Ride Safety Guide 2026',
      category:    'Safety Guide',
      file:        'assets/documents/safety-guide.pdf',
      type:        'PDF',
      size:        '17 KB',
      pages:       '3 pages',
      updated:     'Jul 2026',
      description: 'Safety rules, height and age requirements for every ride, health precautions, lifejacket policy, and emergency procedures.',
      icon:        'fa-shield-halved',
      preview:     'Slides3.jpg',
      downloads:   1934
    },
    {
      id:          'park-rules',
      title:       'Park Rules & Policies',
      category:    'Policies',
      file:        'assets/documents/park-rules.pdf',
      type:        'PDF',
      size:        '16 KB',
      pages:       '3 pages',
      updated:     'Jul 2026',
      description: 'General rules, dress code, food policy, photography policy, prohibited items, and lost & found procedures.',
      icon:        'fa-scale-balanced',
      preview:     'Slides (2).jpg',
      downloads:   1203
    },
    {
      id:          'privacy-policy',
      title:       'Privacy Policy',
      category:    'Policies',
      file:        'assets/documents/privacy-policy.pdf',
      type:        'PDF',
      size:        '9 KB',
      pages:       '2 pages',
      updated:     'Jul 2026',
      description: 'How we collect, use, store, and protect your personal data, your rights under Sri Lanka\'s Data Protection Act, and our cookie policy.',
      icon:        'fa-file-contract',
      preview:     'Rides_&_Slides4.jpg',
      downloads:   876
    },
    {
      id:          'terms-conditions',
      title:       'Terms & Conditions',
      category:    'Policies',
      file:        'assets/documents/terms-conditions.pdf',
      type:        'PDF',
      size:        '8 KB',
      pages:       '2 pages',
      updated:     'Jul 2026',
      description: 'Ticket purchase terms, liability limitations, intellectual property, photography consent, force majeure, and governing law.',
      icon:        'fa-file-lines',
      preview:     'Rides_&_Slides2.jpg',
      downloads:   654
    },
    {
      id:          'emergency-information',
      title:       'Emergency Information',
      category:    'Safety Guide',
      file:        'assets/documents/emergency-information.pdf',
      type:        'PDF',
      size:        '12 KB',
      pages:       '2 pages',
      updated:     'Jul 2026',
      description: 'All emergency contact numbers, in-water and on-land emergency procedures, AED locations, severe weather protocol, and missing child procedure.',
      icon:        'fa-triangle-exclamation',
      preview:     'Rides_&_Slides5.jpg',
      downloads:   742
    },
    {
      id:          'food-menu',
      title:       'Food Zone Menu 2026',
      category:    'Visitor Guide',
      file:        'assets/documents/food-menu.pdf',
      type:        'PDF',
      size:        '14 KB',
      pages:       '3 pages',
      updated:     'Jul 2026',
      description: 'Full menu for all 6 dining venues: Ocean Grill, AquaBites, Pizza Presto, Ice Cream Paradise, Sip & Splash, and Kids Corner Diner.',
      icon:        'fa-utensils',
      preview:     'Rides_&_Slides6.jpg',
      downloads:   1450
    }
  ]
};

function assetUrl(filename) {
  return SANJALIKA_ASSETS.base + filename;
}

if (typeof window !== 'undefined') {
  window.SANJALIKA_ASSETS = SANJALIKA_ASSETS;
  window.assetUrl = assetUrl;
}
