# Sanjalika Water Park

A premium, responsive static website for Sanjalika Water Park.

## Highlights

- Fullscreen autoplay video hero using local files from `assets/videos/`
- Responsive pages for home, about, park info, rides, gallery, food zone, facilities, booking, downloads, and contact
- Local image usage across the site, including a dedicated `assets/images/facilities/` set
- AOS, GSAP, CSS transitions, animated counters, filters, lightbox, and page transitions
- Multi-step booking form with live summary, date validation, real-time field feedback, and confirmation modal
- Professional downloads page rendered from `assets/js/assets-config.js`
- Shared footer, reusable card styles, and production-oriented asset organization

## Run Locally

Open `index.html` directly in a browser.

For the most reliable local testing, serve the folder with any static server, for example:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Structure

```text
assets/
  css/main.css
  documents/
  images/
    facilities/
    food_zone/
  js/
    assets-config.js
    main.js
  videos/
*.html
```
