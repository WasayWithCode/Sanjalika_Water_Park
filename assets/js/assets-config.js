/**
 * Sanjalika Water Park — Local Asset Registry
 * Maps project images/videos to page sections (no external placeholders).
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
    about: 'Rides_&_Slides.jpg',
    booking: 'Rides_&_Slides3.jpg',
    food: 'Rides_&_Slides2.jpg',
    facilities: 'Rides_&_Slides4.jpg',
    contact: 'Slides3.jpg',
    cta: 'Rides_&_Slides.jpg'
  },
  downloads: [
    {
      id: 'brochure',
      title: 'Park Brochure 2026',
      category: 'Brochure',
      file: 'assets/documents/park-brochure.pdf',
      type: 'PDF',
      size: '4.2 MB',
      icon: 'fa-file-pdf',
      preview: 'Rides_&_Slides.jpg',
      downloads: 2847
    },
    {
      id: 'map',
      title: 'Park Map',
      category: 'Park Map',
      file: 'assets/documents/park-map.pdf',
      type: 'PDF',
      size: '2.8 MB',
      icon: 'fa-map',
      preview: 'Slides.jpg',
      downloads: 4521
    },
    {
      id: 'safety',
      title: 'Safety Guide',
      category: 'Safety Guide',
      file: 'assets/documents/safety-guide.pdf',
      type: 'PDF',
      size: '1.5 MB',
      icon: 'fa-shield-halved',
      preview: 'Slides3.jpg',
      downloads: 1934
    },
    {
      id: 'visitor',
      title: 'Visitor Guide',
      category: 'Visitor Guide',
      file: 'assets/documents/safety-guide.pdf',
      type: 'PDF',
      size: '1.5 MB',
      icon: 'fa-book-open',
      preview: 'Rides_&_Slides3.jpg',
      downloads: 3102
    },
    {
      id: 'tickets',
      title: 'Group Booking Form',
      category: 'Ticket Information',
      file: 'assets/documents/group-booking-form.doc',
      type: 'DOC',
      size: '256 KB',
      icon: 'fa-ticket',
      preview: 'Rides.jpg',
      downloads: 876
    },
    {
      id: 'rules',
      title: 'Event Inquiry Form',
      category: 'Rules & Regulations',
      file: 'assets/documents/event-inquiry.doc',
      type: 'DOC',
      size: '180 KB',
      icon: 'fa-scale-balanced',
      preview: 'Slides (2).jpg',
      downloads: 654
    },
    {
      id: 'policy',
      title: 'Privacy Policy',
      category: 'Policies',
      file: 'assets/documents/privacy-policy.pdf',
      type: 'PDF',
      size: '890 KB',
      icon: 'fa-file-contract',
      preview: 'Rides_&_Slides4.jpg',
      downloads: 1203
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
