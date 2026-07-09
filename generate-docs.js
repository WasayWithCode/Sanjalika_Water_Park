/**
 * Sanjalika Water Park — Dependency-free PDF Generator
 * Uses raw PDF 1.4 syntax, no npm packages required.
 * Run: node generate-docs.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const OUT  = path.join(__dirname, 'assets', 'documents');

/* ─── Low-level PDF builder ─────────────────────────────────────────────── */
function buildPDF(pages) {
  // Each page is an array of drawing commands:
  //   { type:'text', x, y, size, bold, text }
  //   { type:'line', x1,y1,x2,y2 }
  //   { type:'rect', x,y,w,h, fill }  (fill = true for filled rect)

  const W = 595.28, H = 841.89; // A4 points
  const objs = [];   // raw PDF objects
  let oid = 0;

  const obj = (content) => { oid++; objs.push({ id: oid, content }); return oid; };

  // Font objects
  const fontRegId = obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fontBldId = obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  // Page content streams + page objects
  const pageIds = [];
  for (const cmds of pages) {
    const lines = [`BT`];
    for (const c of cmds) {
      if (c.type === 'text') {
        const safe = String(c.text)
          .replace(/\\/g, '\\\\')
          .replace(/\(/g, '\\(')
          .replace(/\)/g, '\\)')
          .replace(/[^\x20-\x7E]/g, '?');
        lines.push(`/${c.bold ? 'F2' : 'F1'} ${c.size} Tf`);
        lines.push(`${c.x} ${H - c.y} Td`);
        lines.push(`(${safe}) Tj`);
        lines.push(`-${c.x} -${H - c.y} Td`);
      }
    }
    lines.push('ET');
    // Draw lines/rects after text
    for (const c of cmds) {
      if (c.type === 'line') {
        lines.push(`${c.x1} ${H - c.y1} m ${c.x2} ${H - c.y2} l S`);
      }
      if (c.type === 'rect') {
        if (c.fill) {
          lines.push(`0.18 0.56 0.75 rg`);
          lines.push(`${c.x} ${H - c.y - c.h} ${c.w} ${c.h} re f`);
          lines.push(`0 0 0 rg`);
        } else {
          lines.push(`${c.x} ${H - c.y - c.h} ${c.w} ${c.h} re S`);
        }
      }
    }
    const stream = lines.join('\n');
    const streamId = obj(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageId   = obj(
      `<< /Type /Page /Parent 3 0 R /MediaBox [0 0 ${W} ${H}] ` +
      `/Contents ${streamId} 0 R ` +
      `/Resources << /Font << /F1 ${fontRegId} 0 R /F2 ${fontBldId} 0 R >> >> >>`
    );
    pageIds.push(pageId);
  }

  // Pages dictionary — obj 3
  const pagesContent =
    `<< /Type /Pages /Kids [${pageIds.map(i => `${i} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  // We need this as object 3 — insert at position after catalog
  // Catalog = obj 4 (we'll build in order)
  const catalogId = obj(`<< /Type /Catalog /Pages 3 0 R >>`);

  // Now assemble the file — we need obj 3 for Pages but oid is already past it.
  // Strategy: write all objects sorted, inserting Pages as id=3.
  // Rebuild with explicit IDs:
  const allObjs = [
    { id: 1, content: objs.find(o => o.id === fontRegId).content },
    { id: 2, content: objs.find(o => o.id === fontBldId).content },
    { id: 3, content: pagesContent },
  ];
  // Remap stream/page objects with sequential IDs starting at 4
  let nextId = 4;
  const remap = {};  // old id -> new id
  remap[fontRegId] = 1; remap[fontBldId] = 2;
  for (const o of objs) {
    if (o.id === fontRegId || o.id === fontBldId) continue;
    if (o.id === catalogId) { remap[o.id] = nextId; allObjs.push({ id: nextId, content: o.content.replace(/3 0 R/, '3 0 R') }); nextId++; continue; }
    remap[o.id] = nextId;
    allObjs.push({ id: nextId, content: o.content });
    nextId++;
  }
  // Fix page->content and page->parent refs (they already use correct IDs via the remap)
  // Re-render page objects with remapped content/stream IDs
  const fixedObjs = allObjs.map(o => {
    let c = o.content;
    // replace all "N 0 R" references using remap
    c = c.replace(/(\d+) 0 R/g, (_, n) => `${remap[+n] || +n} 0 R`);
    return { id: o.id, content: c };
  });

  // Build body
  const header = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const parts  = [header];
  const xref   = {};
  let   offset = Buffer.byteLength(header, 'binary');

  for (const o of fixedObjs) {
    const line = `${o.id} 0 obj\n${o.content}\nendobj\n`;
    xref[o.id] = offset;
    parts.push(line);
    offset += Buffer.byteLength(line, 'binary');
  }

  const xrefOffset = offset;
  const maxId = Math.max(...Object.keys(xref).map(Number));
  const xrefLines = [`xref\n0 ${maxId + 1}`];
  xrefLines.push('0000000000 65535 f ');
  for (let i = 1; i <= maxId; i++) {
    xrefLines.push(String(xref[i] || 0).padStart(10, '0') + ' 00000 n ');
  }
  parts.push(xrefLines.join('\n'));
  // Catalog is the last non-xref object
  const catNewId = remap[catalogId];
  parts.push(`\ntrailer\n<< /Size ${maxId + 1} /Root ${catNewId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return parts.join('');
}

/* ─── Layout helpers ────────────────────────────────────────────────────── */
const BRAND  = '#2196b0';   // aqua-navy for visual reference only (PDF is b/w text)
const ML = 60, MR = 535;   // left / right margins (x coords)
const PW = MR - ML;        // printable width

function header(cmds, title, subtitle) {
  // Dark header bar
  cmds.push({ type:'rect', x:0, y:0, w:595, h:72, fill:true });
  cmds.push({ type:'text', x:ML, y:22, size:11, bold:true,
    text:'SANJALIKA WATER PARK  ·  Panadura, Sri Lanka  ·  +94 38 223 4567  ·  info@sanjalika.lk' });
  cmds.push({ type:'text', x:ML, y:44, size:20, bold:true, text: title });
  if (subtitle) cmds.push({ type:'text', x:ML, y:62, size:10, text: subtitle });
  return 82; // next y
}

function hRule(cmds, y) {
  cmds.push({ type:'line', x1:ML, y1:y, x2:MR, y2:y });
  return y + 8;
}

function h1(cmds, y, text) {
  cmds.push({ type:'text', x:ML, y, size:15, bold:true, text });
  return hRule(cmds, y + 18);
}

function h2(cmds, y, text) {
  cmds.push({ type:'text', x:ML, y, size:12, bold:true, text });
  return y + 18;
}

function para(cmds, y, text, size=10) {
  // Word-wrap at ~95 chars
  const words = text.split(' ');
  let line = '', lineY = y;
  const flush = () => {
    if (line.trim()) { cmds.push({ type:'text', x:ML, y:lineY, size, text:line.trim() }); lineY += size + 4; }
    line = '';
  };
  for (const w of words) {
    if ((line + ' ' + w).length > 94) flush();
    line += (line ? ' ' : '') + w;
  }
  flush();
  return lineY + 4;
}

function bullet(cmds, y, text, indent=ML+12) {
  cmds.push({ type:'text', x:ML+2, y, size:10, text:'•' });
  // Wrap bullet text
  const words = text.split(' ');
  let line = '', lineY = y;
  const bw = 88;
  const flush = () => {
    if (line.trim()) { cmds.push({ type:'text', x:indent, y:lineY, size:10, text:line.trim() }); lineY += 14; }
    line = '';
  };
  for (const w of words) {
    if ((line + ' ' + w).length > bw) flush();
    line += (line ? ' ' : '') + w;
  }
  flush();
  return lineY;
}

function tableRow(cmds, y, cols, widths, bold=false) {
  let x = ML;
  for (let i=0; i<cols.length; i++) {
    cmds.push({ type:'text', x, y, size:9, bold, text: String(cols[i]) });
    x += widths[i];
  }
  cmds.push({ type:'line', x1:ML, y1:y+12, x2:MR, y2:y+12 });
  return y + 16;
}

function footer(cmds, pageNum, total) {
  cmds.push({ type:'line', x1:ML, y1:808, x2:MR, y2:808 });
  cmds.push({ type:'text', x:ML, y:820, size:8,
    text:`Sanjalika Water Park — Confidential Document — Page ${pageNum} of ${total}` });
  cmds.push({ type:'text', x:420, y:820, size:8, text:'www.sanjalika.lk' });
}

function newPage(allPages, cmds) { allPages.push(cmds); return []; }

function save(filename, pages) {
  const pdf = buildPDF(pages);
  fs.writeFileSync(path.join(OUT, filename), pdf, 'binary');
  const kb = Math.round(Buffer.byteLength(pdf,'binary') / 1024);
  console.log(`  ✓  ${filename}  (${kb} KB,  ${pages.length} pages)`);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOC 1 — Visitor Guide
═══════════════════════════════════════════════════════════════════════════ */
function genVisitorGuide() {
  const pages = [];

  // Page 1
  let c = [], y;
  y = header(c, 'Visitor Guide 2026', 'Everything you need to know before your visit');
  y += 10;
  y = h1(c, y, '1. Welcome to Sanjalika Water Park');
  y = para(c, y, 'Welcome to Sanjalika Water Park — Sri Lanka\'s premier aquatic destination located on the scenic Coastal Road in Panadura, Western Province. We are delighted you have chosen to spend your day with us. This guide contains all the essential information to help you plan your visit and make the most of your time at the park.');
  y = para(c, y, 'Spread across 12 acres of prime coastal land, Sanjalika Water Park features over 25 world-class water rides, a dedicated children\'s play zone, multiple dining venues, and a full suite of guest facilities. Whether you are visiting with family, friends, or a corporate group, we have designed an experience that caters to all ages and preferences.');
  y += 6;
  y = h1(c, y, '2. Park Introduction');
  y = para(c, y, 'Established in 2010 and significantly upgraded in 2024, Sanjalika Water Park has welcomed over 2 million guests from across Sri Lanka and the world. Our facility holds the national record for the longest water slide in South Asia and is the only park in the country to offer a wave pool exceeding 1.5 acres in size.');
  y = h2(c, y, 'Key Highlights');
  y = bullet(c, y, '25+ water rides across three thrill levels (Family, Intermediate, Extreme)');
  y = bullet(c, y, 'AquaKids Zone — dedicated splash area for children under 12');
  y = bullet(c, y, 'Wave Pool — 1.5-acre artificial ocean with 1.2 m peak waves');
  y = bullet(c, y, 'Lazy River — 420-metre relaxation circuit');
  y = bullet(c, y, 'Cabana Village — 30 private poolside cabanas available for hire');
  y = bullet(c, y, 'SpaAqua — hydrotherapy and relaxation centre');
  y = bullet(c, y, 'Food Zone — 6 dining outlets serving local and international cuisine');
  y += 6;
  y = h1(c, y, '3. Park Timings');
  y = tableRow(c, y, ['Day', 'Park Opens', 'Park Closes', 'Last Entry', 'Office Hours'], [110,90,90,90,110], true);
  y = tableRow(c, y, ['Monday – Friday', '10:00 AM', '6:00 PM', '5:00 PM', '8:00 AM – 5:00 PM'], [110,90,90,90,110]);
  y = tableRow(c, y, ['Saturday', '9:00 AM', '8:00 PM', '7:00 PM', '8:00 AM – 5:00 PM'], [110,90,90,90,110]);
  y = tableRow(c, y, ['Sunday & Holidays', '9:00 AM', '8:00 PM', '7:00 PM', '9:00 AM – 4:00 PM'], [110,90,90,90,110]);
  y = tableRow(c, y, ['School Holidays', '8:30 AM', '8:30 PM', '7:30 PM', '8:00 AM – 5:00 PM'], [110,90,90,90,110]);
  y += 4;
  y = para(c, y, 'Note: Park hours may vary on public holidays and special event days. Check our website or call ahead for updated schedules. We reserve the right to close rides temporarily due to weather, maintenance, or safety requirements.');
  footer(c, 1, 4); pages.push(c);

  // Page 2
  c = []; y = 50;
  y = h1(c, y, '4. Entry Rules');
  y = h2(c, y, 'Admission Requirements');
  y = bullet(c, y, 'All guests must purchase a valid ticket before entering the park.');
  y = bullet(c, y, 'Children under 5 years of age receive free admission when accompanied by a paying adult.');
  y = bullet(c, y, 'Senior citizens (65+) receive a 15% discount with valid ID.');
  y = bullet(c, y, 'Group rates are available for parties of 20 or more — contact bookings@sanjalika.lk.');
  y = bullet(c, y, 'Season passes are available at the main ticketing counter and online.');
  y = bullet(c, y, 'Re-entry is permitted on the same day with a valid hand stamp.');
  y += 6;
  y = h2(c, y, 'What to Bring');
  y = bullet(c, y, 'Swimming attire (see Dress Code in Park Rules & Policies)');
  y = bullet(c, y, 'Sunscreen (SPF 30+ recommended; reef-safe preferred)');
  y = bullet(c, y, 'Towel and change of clothing');
  y = bullet(c, y, 'Valid photo ID for group and senior discounts');
  y = bullet(c, y, 'Waterproof bag for personal belongings');
  y += 6;
  y = h2(c, y, 'What NOT to Bring');
  y = bullet(c, y, 'Glass containers or bottles of any kind');
  y = bullet(c, y, 'Outside food and beverages (exceptions for infant formula and medical dietary needs)');
  y = bullet(c, y, 'Drones or professional camera equipment without prior written approval');
  y = bullet(c, y, 'Inflatable toys, rings, or personal flotation devices (park-issued lifejackets available)');
  y = bullet(c, y, 'Pets (registered assistance animals permitted with documentation)');
  y += 6;
  y = h1(c, y, '5. Safety Instructions');
  y = para(c, y, 'The safety of our guests is our highest priority. All rides at Sanjalika Water Park are designed, built, and maintained to the highest international standards. Please read and observe all posted safety signs at each ride entrance.');
  y = h2(c, y, 'General Water Safety');
  y = bullet(c, y, 'Non-swimmers and young children must wear a Coast Guard-approved lifejacket at all times in the wave pool and lazy river.');
  y = bullet(c, y, 'Trained lifeguards are stationed at all attractions. Follow their instructions at all times.');
  y = bullet(c, y, 'Do not run on pool decks, slide paths, or any wet surface.');
  y = bullet(c, y, 'Swim within designated zones only — do not cross safety barriers.');
  y = bullet(c, y, 'Alcohol consumption before or during rides is strictly prohibited.');
  y += 6;
  y = h2(c, y, 'Health Precautions');
  y = bullet(c, y, 'Guests with heart conditions, high blood pressure, neck or back injuries, or who are pregnant should not ride thrill attractions. Consult your physician before your visit.');
  y = bullet(c, y, 'Do not enter the water if you have open wounds, skin infections, or communicable conditions.');
  y = bullet(c, y, 'Shower before entering all pools and the wave pool area.');
  y = bullet(c, y, 'Stay hydrated — free drinking water stations are located throughout the park.');
  footer(c, 2, 4); pages.push(c);

  // Page 3
  c = []; y = 50;
  y = h1(c, y, '6. Facilities');
  y = h2(c, y, 'Locker Rooms & Changing Facilities');
  y = para(c, y, 'Spacious, gender-separated changing rooms are located near the main entrance and the AquaKids Zone. Clean towels (LKR 200 per use) and locker rental (LKR 300/day) are available at the facility desk. All lockers are key-operated and CCTV-monitored.');
  y = h2(c, y, 'Accessibility');
  y = para(c, y, 'Sanjalika Water Park is committed to inclusivity. Wheelchair-accessible pathways connect all major zones. Accessible restrooms are provided at three locations. Dedicated entry lanes at all attractions accommodate guests with mobility aids. Our Guest Services team can arrange personalised assistance — speak to any team member in teal uniform or visit the Guest Services desk near the main entrance.');
  y = h2(c, y, 'First Aid & Medical Services');
  y = para(c, y, 'A fully staffed First Aid Centre operates daily from 9:00 AM to 8:30 PM, located adjacent to the AquaKids Zone near Gate B. Our medical team includes qualified first-aiders and a visiting nurse every weekend. An AED (Automated External Defibrillator) is installed at the First Aid Centre and near the Wave Pool entrance.');
  y = h2(c, y, 'Parking');
  y = para(c, y, 'Free parking is available for 500 vehicles in our main surface lot, accessed from the Coastal Road entrance. Overflow parking on weekends and holidays is available 200 metres south of the main gate, with a free shuttle service running every 15 minutes. Motorcycle and bicycle parking is provided near the main entrance at no charge.');
  y = h2(c, y, 'Wi-Fi & Connectivity');
  y = para(c, y, 'Complimentary Wi-Fi (SanjalikaGuest) is available throughout the park. Connect and enter your mobile number to authenticate. Session duration is 4 hours; guests may reconnect after expiry. Our Wi-Fi Lounge near the Food Zone offers charging stations and comfortable seating.');
  y = h2(c, y, 'Gift Shop');
  y = para(c, y, 'The Sanjalika Gift Shop is located at the main exit and offers branded merchandise, swimwear, sunscreen, floatation accessories, and souvenirs. Open 10:00 AM to closing time daily.');
  y = h2(c, y, 'SpaAqua');
  y = para(c, y, 'Treat yourself to a relaxing experience at SpaAqua. Services include hot-stone therapy, deep-tissue massage, hydrotherapy jets, and facial treatments. Open 10:30 AM – 7:00 PM daily. Advance booking recommended: +94 38 223 4570.');
  footer(c, 3, 4); pages.push(c);

  // Page 4
  c = []; y = 50;
  y = h1(c, y, '7. Contact Information');
  y = h2(c, y, 'General Enquiries');
  y = tableRow(c, y, ['Channel', 'Detail', 'Hours'], [120,260,95], true);
  y = tableRow(c, y, ['Main Phone', '+94 38 223 4567', 'Daily 8 AM – 8 PM'], [120,260,95]);
  y = tableRow(c, y, ['WhatsApp', '+94 77 123 4567', 'Daily 9 AM – 6 PM'], [120,260,95]);
  y = tableRow(c, y, ['Email', 'info@sanjalika.lk', '24 hrs (reply within 24h)'], [120,260,95]);
  y = tableRow(c, y, ['Bookings', 'bookings@sanjalika.lk', 'Mon–Fri 8 AM – 5 PM'], [120,260,95]);
  y = tableRow(c, y, ['Corporate Events', 'events@sanjalika.lk', 'Mon–Fri 8 AM – 5 PM'], [120,260,95]);
  y = tableRow(c, y, ['Emergency (in-park)', 'Extension 0 (any park phone)', 'During park hours'], [120,260,95]);
  y += 8;
  y = h2(c, y, 'Physical Address');
  y = para(c, y, '123 Coastal Road, Panadura, Western Province 12500, Sri Lanka. The park is situated 25 km south of Colombo city centre, accessible via the Galle Road (A2). Bus routes 400 and 402 stop directly at the main entrance. Nearest railway station: Panadura (2 km).');
  y += 6;
  y = h2(c, y, 'Social Media');
  y = bullet(c, y, 'Facebook: facebook.com/SanjalikaWaterPark');
  y = bullet(c, y, 'Instagram: @sanjalika_wp');
  y = bullet(c, y, 'YouTube: youtube.com/@SanjalikaWaterPark');
  y = bullet(c, y, 'TripAdvisor: search "Sanjalika Water Park"');
  y += 10;
  y = h1(c, y, 'Important Notices');
  y = bullet(c, y, 'Sanjalika Water Park reserves the right to refuse entry or remove guests who violate park rules or engage in unsafe behaviour.');
  y = bullet(c, y, 'Management is not responsible for loss of personal belongings. Use the secure locker facilities provided.');
  y = bullet(c, y, 'In the event of severe weather, management may temporarily suspend outdoor operations for guest safety.');
  y = bullet(c, y, 'All ticket sales are subject to our Refund & Cancellation Policy — available at the ticketing counter or on our website.');
  y += 10;
  y = para(c, y, 'We hope you enjoy every moment at Sanjalika Water Park. Our team of 350+ staff are here to ensure your visit is safe, comfortable, and unforgettable. Thank you for choosing us!', 11);
  footer(c, 4, 4); pages.push(c);

  save('visitor-guide.pdf', pages);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOC 2 — Park Brochure
═══════════════════════════════════════════════════════════════════════════ */
function genParkBrochure() {
  const pages = [];

  // Page 1
  let c = [], y;
  y = header(c, 'Park Brochure 2026', 'Sri Lanka\'s Premier Water Park Experience');
  y += 10;
  y = h1(c, y, 'About Sanjalika Water Park');
  y = para(c, y, 'Nestled on Sri Lanka\'s stunning western coastline, Sanjalika Water Park is an award-winning aquatic destination that has set the standard for water-based family entertainment since 2010. Covering 12 acres of beautifully landscaped grounds in Panadura, our park combines thrilling rides, serene relaxation zones, world-class dining, and unmatched guest services.');
  y = para(c, y, 'Named after the ancient Sinhala word for "water vessel," Sanjalika embodies the spirit of the ocean. Every corner of the park reflects our commitment to delivering authentic Sri Lankan hospitality alongside internationally benchmarked safety and quality standards.');
  y = h2(c, y, 'Awards & Recognition');
  y = bullet(c, y, 'Best Water Park in South Asia — Leisure Asia Awards 2024 & 2025');
  y = bullet(c, y, 'TripAdvisor Certificate of Excellence — 7 consecutive years');
  y = bullet(c, y, 'ISO 9001:2015 Certified for Guest Service & Safety Management');
  y = bullet(c, y, 'Green Tourism Gold Award — Sri Lanka Tourism Development Authority 2023');
  y += 6;
  y = h1(c, y, 'Main Attractions Overview');
  y = tableRow(c, y, ['Attraction', 'Zone', 'Thrill Level', 'Min. Height'], [160,110,110,95], true);
  y = tableRow(c, y, ['AquaCoaster — The Dragon', 'Extreme Zone', 'Extreme', '140 cm'], [160,110,110,95]);
  y = tableRow(c, y, ['Twin Turbo Slides', 'Extreme Zone', 'High', '130 cm'], [160,110,110,95]);
  y = tableRow(c, y, ['Family Wave Pool', 'Family Zone', 'Relaxed', 'None'], [160,110,110,95]);
  y = tableRow(c, y, ['Lazy River Circuit', 'Family Zone', 'Relaxed', 'None'], [160,110,110,95]);
  y = tableRow(c, y, ['AquaKids Splash Pad', 'Kids Zone', 'Kids', 'Under 140cm'], [160,110,110,95]);
  y = tableRow(c, y, ['Tornado Funnel Ride', 'Extreme Zone', 'High', '135 cm'], [160,110,110,95]);
  y = tableRow(c, y, ['Ocean Falls Body Slide', 'Family Zone', 'Moderate', '120 cm'], [160,110,110,95]);
  y = tableRow(c, y, ['Surf Simulator', 'Sports Zone', 'Moderate', '125 cm'], [160,110,110,95]);
  y = tableRow(c, y, ['Raceway Slides (x6)', 'Family Zone', 'Moderate', '110 cm'], [160,110,110,95]);
  footer(c, 1, 4); pages.push(c);

  // Page 2
  c = []; y = 50;
  y = h1(c, y, 'Water Rides — Full Listing');
  y = h2(c, y, 'Extreme Zone');
  y = bullet(c, y, 'AquaCoaster (The Dragon): Our signature ride. 280 m of enclosed tube with uphill sections powered by water jets. Duration: 90 seconds. Minimum height: 140 cm.');
  y = bullet(c, y, 'Tornado: 4-person raft ride through a giant funnel with 360° rotation. Minimum height: 135 cm.');
  y = bullet(c, y, 'Free Fall Plunge: Near-vertical 18 m drop slide. Not for the faint-hearted. Minimum height: 140 cm.');
  y = bullet(c, y, 'Twin Turbo: Side-by-side racing slides over 120 m. Minimum height: 130 cm.');
  y = h2(c, y, 'Family Zone');
  y = bullet(c, y, 'Wave Pool: Artificial ocean generating waves up to 1.2 m. Sessions of 15 minutes on, 5 minutes off. All ages welcome.');
  y = bullet(c, y, 'Lazy River: 420 m circular river for tubes and swimming. Gentle 0.5 m/s current. All ages welcome.');
  y = bullet(c, y, 'Ocean Falls: Multi-lane body slide with gentle curves. Suitable from 120 cm height.');
  y = bullet(c, y, 'Raceway Slides: Six side-by-side mat slides for friendly family races. Height: 110 cm minimum.');
  y = bullet(c, y, 'Bucket Bash: Interactive water structure for the whole family. Giant tipping bucket drops 500 litres every 90 seconds.');
  y = h2(c, y, 'Kids Zone');
  y = bullet(c, y, 'AquaKids Splash Pad: Shallow-water play zone with ground jets, mini slides, and spray features. Depth max 30 cm. Children under 12 accompanied by adult.');
  y = bullet(c, y, 'Mini Racers: Child-sized slides (height: up to 140 cm).');
  y = bullet(c, y, 'Pirate Ship Play Frame: Dry play structure with ropes, ladders, and water cannons.');
  y += 6;
  y = h1(c, y, 'Family Activities');
  y = bullet(c, y, 'Poolside Cabana Hire: 30 private, shaded cabanas with sun loungers, lock box, and priority food delivery service. Book in advance — cabanas sell out on weekends.');
  y = bullet(c, y, 'AquaFit Classes: Daily water aerobics at 9:30 AM in the Wave Pool (calm-water period). Included with entry.');
  y = bullet(c, y, 'Birthday Packages: Private cabana + cake + 10 guest passes + special theming from LKR 15,000. Pre-booking required.');
  y = bullet(c, y, 'Photography Station: Professional waterproof camera service. Purchase photos at the Gift Shop kiosk.');
  y = bullet(c, y, 'Treasure Hunt Trail: Guided interactive trail for children aged 5–12. Collect stamps at each zone for a prize at the end. Ask at Guest Services.');
  footer(c, 2, 4); pages.push(c);

  // Page 3
  c = []; y = 50;
  y = h1(c, y, 'Food Zone — Dining at Sanjalika');
  y = para(c, y, 'The Sanjalika Food Zone features six unique dining venues, from quick poolside bites to sit-down restaurant experiences. All our kitchens operate to the highest food safety standards (ISO 22000 certified) and offer vegetarian, vegan, halal-certified, and allergen-aware options.');
  y = tableRow(c, y, ['Venue', 'Cuisine', 'Seating', 'Hours'], [140,130,100,105], true);
  y = tableRow(c, y, ['Ocean Grill', 'BBQ & Seafood', '80 indoor', '11 AM – 7 PM'], [140,130,100,105]);
  y = tableRow(c, y, ['AquaBites Cafe', 'Snacks & Fast Food', '40 outdoor', '9 AM – closing'], [140,130,100,105]);
  y = tableRow(c, y, ['Pizza Presto', 'Italian / Pizza', '30 indoor', '11 AM – 7 PM'], [140,130,100,105]);
  y = tableRow(c, y, ['Ice Cream Paradise', 'Desserts & Gelato', 'Counter service', '9 AM – closing'], [140,130,100,105]);
  y = tableRow(c, y, ['Sip & Splash Bar', 'Juices & Beverages', 'Poolside service', '9 AM – closing'], [140,130,100,105]);
  y = tableRow(c, y, ['Kids Corner Diner', 'Kids Meals & Snacks', '25 indoor', '10 AM – 6 PM'], [140,130,100,105]);
  y += 8;
  y = para(c, y, 'Poolside food delivery is available from AquaBites Cafe and Sip & Splash Bar. Order at any poolside kiosk or via our park app. Cashless payment accepted at all venues. Outside food and beverages are not permitted except infant formula and medically prescribed items.');
  y += 6;
  y = h1(c, y, 'Ticket Prices 2026');
  y = tableRow(c, y, ['Category', 'Weekday', 'Weekend / Holiday', 'Includes'], [130,80,120,145], true);
  y = tableRow(c, y, ['Adult (13–64)', 'LKR 2,800', 'LKR 3,200', 'Full park access'], [130,80,120,145]);
  y = tableRow(c, y, ['Child (5–12)', 'LKR 1,800', 'LKR 2,200', 'Full park access'], [130,80,120,145]);
  y = tableRow(c, y, ['Senior (65+)', 'LKR 2,000', 'LKR 2,400', 'Full park + priority'], [130,80,120,145]);
  y = tableRow(c, y, ['Under 5', 'FREE', 'FREE', 'With paying adult'], [130,80,120,145]);
  y = tableRow(c, y, ['Family Pack (2+2)', 'LKR 8,500', 'LKR 10,000', 'Full park + LKR500 F&B'], [130,80,120,145]);
  y = tableRow(c, y, ['VIP All-Day Pass', 'LKR 6,500', 'LKR 7,500', 'Park + Cabana + Lunch'], [130,80,120,145]);
  y = tableRow(c, y, ['Season Pass', 'LKR 18,000 / year', '(all days incl.)', 'Unlimited entry'], [130,80,120,145]);
  y += 4;
  y = para(c, y, 'All prices are inclusive of VAT. Prices subject to change without prior notice. Group discounts (20+ guests): 20% off regular price. School groups: 25% off with advance booking. Corporate packages available on request.');
  footer(c, 3, 4); pages.push(c);

  // Page 4
  c = []; y = 50;
  y = h1(c, y, 'Opening Hours');
  y = tableRow(c, y, ['Day', 'Park Hours', 'Last Entry', 'Food Zone'], [120,110,110,135], true);
  y = tableRow(c, y, ['Monday – Friday', '10:00 – 18:00', '17:00', '10:30 – 17:30'], [120,110,110,135]);
  y = tableRow(c, y, ['Saturday', '09:00 – 20:00', '19:00', '09:30 – 19:30'], [120,110,110,135]);
  y = tableRow(c, y, ['Sunday', '09:00 – 20:00', '19:00', '09:30 – 19:30'], [120,110,110,135]);
  y = tableRow(c, y, ['Public Holidays', '08:30 – 20:30', '19:30', '09:00 – 20:00'], [120,110,110,135]);
  y = tableRow(c, y, ['School Holidays', '08:30 – 20:30', '19:30', '09:00 – 20:00'], [120,110,110,135]);
  y += 8;
  y = h1(c, y, 'Getting Here');
  y = h2(c, y, 'By Road');
  y = para(c, y, 'From Colombo: Take the Galle Road (A2) south for 25 km. The park entrance is signposted on the left after Panadura Town. Travel time approximately 35–50 minutes depending on traffic.');
  y = h2(c, y, 'By Bus');
  y = para(c, y, 'Routes 400 and 402 operate from Colombo Fort and Pettah Bus Stand to Panadura, stopping directly at the park main entrance.');
  y = h2(c, y, 'By Train');
  y = para(c, y, 'Panadura Railway Station is 2 km from the park. Tuk-tuks and taxis available at the station. Trains run every 30 minutes from Colombo Fort.');
  y = h2(c, y, 'By Car / Taxi');
  y = para(c, y, 'Free parking for 500 vehicles. Overflow parking available on weekends with free shuttle. Drop-off and pick-up lane at main entrance for taxis and ride-share vehicles.');
  y += 10;
  y = h1(c, y, 'Contact & Reservations');
  y = bullet(c, y, 'General: +94 38 223 4567  |  info@sanjalika.lk');
  y = bullet(c, y, 'Online Booking: www.sanjalika.lk/booking');
  y = bullet(c, y, 'Group Reservations: bookings@sanjalika.lk');
  y = bullet(c, y, 'Events & Corporate: events@sanjalika.lk');
  footer(c, 4, 4); pages.push(c);

  save('park-brochure.pdf', pages);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOC 3 — Park Map Guide
═══════════════════════════════════════════════════════════════════════════ */
function genParkMap() {
  const pages = [];

  // Page 1
  let c = [], y;
  y = header(c, 'Park Map Guide 2026', 'Your complete navigation guide to Sanjalika Water Park');
  y += 10;
  y = h1(c, y, '1. Park Layout Overview');
  y = para(c, y, 'Sanjalika Water Park is divided into seven clearly marked zones, each with distinct signage using our teal-and-white colour scheme. The park operates a one-way guest flow system to reduce congestion. Main pathways are 4 metres wide and fully paved. All zones are accessible from the Central Plaza, located at the heart of the park.');
  y = tableRow(c, y, ['Zone', 'Colour Code', 'Location', 'Key Features'], [110,90,140,135], true);
  y = tableRow(c, y, ['Central Plaza', 'White', 'Park centre', 'Info desk, seating, stage'], [110,90,140,135]);
  y = tableRow(c, y, ['Extreme Zone', 'Red', 'North-east', 'AquaCoaster, Free Fall, Tornado'], [110,90,140,135]);
  y = tableRow(c, y, ['Family Zone', 'Blue', 'East & South', 'Wave Pool, Lazy River, Raceway'], [110,90,140,135]);
  y = tableRow(c, y, ['Kids Zone', 'Yellow', 'South-west', 'AquaKids, Mini Racers, Pirate Ship'], [110,90,140,135]);
  y = tableRow(c, y, ['Food Zone', 'Orange', 'West', '6 dining venues, Food Hall'], [110,90,140,135]);
  y = tableRow(c, y, ['Facilities Belt', 'Green', 'Perimeter', 'Lockers, Changing, Parking'], [110,90,140,135]);
  y = tableRow(c, y, ['SpaAqua & Cabanas', 'Purple', 'North-west', 'Spa, 30 Cabanas, Relaxation'], [110,90,140,135]);
  y += 8;
  y = h1(c, y, '2. Ride Locations');
  y = h2(c, y, 'Extreme Zone (North-East)');
  y = bullet(c, y, 'E1 — AquaCoaster (The Dragon): Start tower at Grid NE-1. Queue lane entrance from Central Plaza, north pathway.');
  y = bullet(c, y, 'E2 — Free Fall Plunge: Grid NE-2. Adjacent to AquaCoaster tower. Viewing platform accessible from NE pathway.');
  y = bullet(c, y, 'E3 — Twin Turbo Slides: Grid NE-3. Side-by-side start platforms, shared splash pool at base.');
  y = bullet(c, y, 'E4 — Tornado Funnel: Grid NE-4. Raft boarding dock. Minimum 4 persons per raft required.');
  y = h2(c, y, 'Family Zone (East & South)');
  y = bullet(c, y, 'F1 — Wave Pool: Grid FZ-1. Main entrance from Central Plaza east path. Wave schedule board at entrance.');
  y = bullet(c, y, 'F2 — Lazy River: Grid FZ-2. Circumnavigates the Family Zone. Multiple entry/exit points at FZ-2A through FZ-2D.');
  y = bullet(c, y, 'F3 — Ocean Falls (6 lanes): Grid FZ-3. Mat rental at entrance LKR 100.');
  y = bullet(c, y, 'F4 — Raceway Slides (6 lanes): Grid FZ-4. Escalator access to start platforms.');
  y = bullet(c, y, 'F5 — Bucket Bash: Grid FZ-5. Central Family Zone plaza feature.');
  footer(c, 1, 3); pages.push(c);

  // Page 2
  c = []; y = 50;
  y = h1(c, y, '3. Essential Facilities Locations');
  y = h2(c, y, 'Food Court & Dining (West Zone)');
  y = bullet(c, y, 'Food Hall Building: Grid WZ-1. Central food court with Ocean Grill, AquaBites, Pizza Presto under one roof.');
  y = bullet(c, y, 'Ice Cream Paradise: Grid WZ-2. Standalone kiosk between Food Hall and Kids Zone.');
  y = bullet(c, y, 'Sip & Splash Bar: Grid WZ-3 and WZ-3B (Wave Pool satellite bar).');
  y = bullet(c, y, 'Kids Corner Diner: Grid KZ-2. Inside the Kids Zone near the Mini Racers exit.');
  y += 6;
  y = h2(c, y, 'Prayer Areas');
  y = bullet(c, y, 'Prayer Room A (Male): Grid FB-5, Facilities Belt near main entrance. Capacity 20. Prayer times posted at the door.');
  y = bullet(c, y, 'Prayer Room B (Female): Grid FB-6, adjacent to Prayer Room A. Separate entrance from north side.');
  y = bullet(c, y, 'Wudu (ablution) facilities are provided at both prayer rooms. Facilities open during all park hours.');
  y += 6;
  y = h2(c, y, 'Parking');
  y = bullet(c, y, 'Main Car Park (Lot A): 350 spaces. Access from Coastal Road, Gate 1. Free of charge. Grid PK-1.');
  y = bullet(c, y, 'Car Park Lot B: 150 spaces. Access from Gate 1, turn left. Free of charge. Grid PK-2.');
  y = bullet(c, y, 'Overflow Lot C: 200 spaces (weekends and holidays). 200 m south on Coastal Road. Free shuttle every 15 minutes. Grid PK-3.');
  y = bullet(c, y, 'Motorcycle / Bicycle Parking: Adjacent to Gate 1 main entrance, Grid PK-M. No charge.');
  y = bullet(c, y, 'Bus / Coach Drop-off Bay: Gate 2 (south entrance), Grid PK-B. Coaches park in Lot B.');
  y += 6;
  y = h2(c, y, 'Lockers');
  y = bullet(c, y, 'Locker Bank A: Near Main Entrance Gate 1 (Grid FB-1). 120 standard lockers (LKR 300/day).');
  y = bullet(c, y, 'Locker Bank B: Near Wave Pool entrance (Grid FZ-1B). 80 lockers. Preferred for Family Zone guests.');
  y = bullet(c, y, 'Locker Bank C: Near Extreme Zone entrance (Grid NE-0). 60 lockers.');
  y = bullet(c, y, 'Locker Bank D: Kids Zone (Grid KZ-1). 40 family-size lockers. Wider and taller for pushchairs/bags.');
  y = bullet(c, y, 'Locker sizes: Standard (30x30x40 cm) and Large (40x40x60 cm, LKR 400/day).');
  y += 6;
  y = h2(c, y, 'Changing Rooms');
  y = bullet(c, y, 'Main Changing Block (Grid FB-2): Near Gate 1. Male / Female / Family / Accessible. Showers x20, Toilets x16.');
  y = bullet(c, y, 'Family Zone Changing (Grid FZ-6): Near Lazy River. Smaller block with showers x8, toilets x8.');
  y = bullet(c, y, 'Kids Zone Changing (Grid KZ-3): Family-oriented. Baby-changing stations x4.');
  footer(c, 2, 3); pages.push(c);

  // Page 3
  c = []; y = 50;
  y = h1(c, y, '4. First Aid Stations');
  y = bullet(c, y, 'First Aid Centre (MAIN): Grid FA-1. Located adjacent to Gate B / AquaKids Zone. Staffed nurse and first-aiders. AED on site. Open 09:00 – 20:30 daily.');
  y = bullet(c, y, 'First Aid Post 2: Grid FA-2. Wave Pool deck, south side. Lifeguard station with first-aid kit and oxygen.');
  y = bullet(c, y, 'First Aid Post 3: Grid FA-3. Extreme Zone at base of AquaCoaster. Stretcher, AED, first-aid kit.');
  y = bullet(c, y, 'Lifeguard Towers: 12 stations distributed around all water features. Each tower equipped with rescue tube and first-aid kit.');
  y += 6;
  y = h1(c, y, '5. Emergency Exits');
  y = para(c, y, 'In the event of a park emergency, follow the green EXIT signs to the nearest assembly point. Do not re-enter the park until authorised by staff. Emergency announcements are made over the park-wide PA system in Sinhala, Tamil, and English.');
  y = tableRow(c, y, ['Exit', 'Location', 'Assembly Point', 'Capacity'], [80,170,180,45], true);
  y = tableRow(c, y, ['Exit 1 (Main)', 'Gate 1 — North, Coastal Road', 'Lot A Car Park (PK-1)', '2,000'], [80,170,180,45]);
  y = tableRow(c, y, ['Exit 2', 'Gate 2 — South entrance', 'Lot B Car Park (PK-2)', '800'], [80,170,180,45]);
  y = tableRow(c, y, ['Exit 3', 'East perimeter wall, Family Zone', 'East service road', '600'], [80,170,180,45]);
  y = tableRow(c, y, ['Exit 4', 'West perimeter, Food Zone rear', 'Food Zone external plaza', '500'], [80,170,180,45]);
  y = tableRow(c, y, ['Exit 5 (Emergency)', 'North-east, Extreme Zone', 'North service lane', '400'], [80,170,180,45]);
  y += 8;
  y = h1(c, y, '6. Guest Services Desk Locations');
  y = bullet(c, y, 'Main Guest Services: Grid GS-1. Inside Gate 1, immediately right of the turnstiles. Open during all park hours.');
  y = bullet(c, y, 'Information Kiosk A: Central Plaza (Grid CP-1). Staffed 10 AM – 5 PM daily.');
  y = bullet(c, y, 'Lost & Found: Main Guest Services desk (GS-1). Report lost items in person or call extension 101.');
  y = bullet(c, y, 'Ticketing Counter: Gate 1 exterior, 6 windows. Online booking collection at Window 6.');
  y += 8;
  y = h1(c, y, '7. Accessibility Route Map');
  y = para(c, y, 'The entire perimeter pathway and all main zone connections are wheelchair-accessible with a paved, flat surface. Gradient ramps replace steps at all level changes. Accessible toilets are available at the Main Changing Block (FB-2), Family Zone Changing (FZ-6), and dedicated accessible cubicles at both prayer rooms.');
  y = bullet(c, y, 'Wheelchair hire: available at Main Guest Services (GS-1) — free of charge, subject to availability.');
  y = bullet(c, y, 'Priority boarding lanes: available at Wave Pool (FZ-1), Lazy River (FZ-2), AquaKids (KZ-1), and Ocean Falls (FZ-3).');
  y = bullet(c, y, 'Accessible parking bays: 12 bays near Gate 1 in Lot A (PK-1), clearly marked.');
  footer(c, 3, 3); pages.push(c);

  save('park-map.pdf', pages);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOC 4 — Ticket Information
═══════════════════════════════════════════════════════════════════════════ */
function genTicketInfo() {
  const pages = [];

  // Page 1
  let c = [], y;
  y = header(c, 'Ticket Information 2026', 'Pricing, packages, payment & refund policy');
  y += 10;
  y = h1(c, y, '1. Ticket Categories & Pricing');
  y = tableRow(c, y, ['Ticket Type', 'Age / Criteria', 'Weekday', 'Weekend / Holiday'], [145,120,100,110], true);
  y = tableRow(c, y, ['Adult', '13 – 64 years', 'LKR 2,800', 'LKR 3,200'], [145,120,100,110]);
  y = tableRow(c, y, ['Child', '5 – 12 years', 'LKR 1,800', 'LKR 2,200'], [145,120,100,110]);
  y = tableRow(c, y, ['Infant', 'Under 5 years', 'FREE', 'FREE'], [145,120,100,110]);
  y = tableRow(c, y, ['Senior', '65+ with valid ID', 'LKR 2,000', 'LKR 2,400'], [145,120,100,110]);
  y = tableRow(c, y, ['Person with Disability', 'With disability card', 'LKR 1,500', 'LKR 1,800'], [145,120,100,110]);
  y += 6;
  y = h1(c, y, '2. Package Tickets');
  y = h2(c, y, 'Family Package (2 Adults + 2 Children)');
  y = bullet(c, y, 'Weekday: LKR 8,500  |  Weekend / Holiday: LKR 10,000');
  y = bullet(c, y, 'Includes: Full park access for all 4 guests + LKR 500 Food & Beverage voucher redeemable at any Food Zone outlet.');
  y = bullet(c, y, 'Upgradeable: Add a 3rd child for LKR 1,400 (weekday) / LKR 1,700 (weekend).');
  y += 6;
  y = h2(c, y, 'VIP All-Day Pass (Per Person)');
  y = bullet(c, y, 'Weekday: LKR 6,500  |  Weekend / Holiday: LKR 7,500');
  y = bullet(c, y, 'Includes: Full park access + Private cabana reservation (2-hour block, bookable on arrival) + Set lunch at Ocean Grill or AquaBites + Priority boarding at all attractions + Complimentary locker (standard size, full day).');
  y = bullet(c, y, 'VIP guests receive a VIP wristband at the main counter. Show wristband at each attraction for priority access.');
  y += 6;
  y = h2(c, y, 'Season Pass (Annual)');
  y = bullet(c, y, 'Individual: LKR 18,000 / year (unlimited visits, all days)');
  y = bullet(c, y, 'Family Season Pass (4 members): LKR 55,000 / year');
  y = bullet(c, y, 'Includes: Free parking for every visit, 10% discount at all Food Zone outlets, early entry (30 minutes before public opening).');
  y = bullet(c, y, 'Season pass holders receive a personalised photo ID card. Replacement card: LKR 500.');
  footer(c, 1, 2); pages.push(c);

  // Page 2
  c = []; y = 50;
  y = h1(c, y, '3. Group Bookings & Discounts');
  y = tableRow(c, y, ['Group Size', 'Discount', 'Contact', 'Advance Notice'], [110,80,175,110], true);
  y = tableRow(c, y, ['20 – 49 guests', '20% off', 'bookings@sanjalika.lk', '48 hours'], [110,80,175,110]);
  y = tableRow(c, y, ['50 – 99 guests', '25% off', 'bookings@sanjalika.lk', '5 days'], [110,80,175,110]);
  y = tableRow(c, y, ['100+ guests', '30% off', 'bookings@sanjalika.lk', '7 days'], [110,80,175,110]);
  y = tableRow(c, y, ['School Groups', '25% + teacher free', 'schools@sanjalika.lk', '7 days'], [110,80,175,110]);
  y = tableRow(c, y, ['Corporate Events', 'Custom quote', 'events@sanjalika.lk', '14 days'], [110,80,175,110]);
  y += 6;
  y = h1(c, y, '4. Payment Methods');
  y = h2(c, y, 'At the Counter (Gate 1 Ticketing)');
  y = bullet(c, y, 'Sri Lankan Rupees (LKR) — cash accepted at all windows');
  y = bullet(c, y, 'Visa / Mastercard / American Express — credit and debit cards');
  y = bullet(c, y, 'Sampath Bank, Commercial Bank, HNB, BOC tap-to-pay');
  y = bullet(c, y, 'LankaQR (scan-to-pay) — all major Sri Lankan bank apps supported');
  y = bullet(c, y, 'USD, EUR, GBP accepted at Window 1 (exchange rate applied on the day)');
  y = h2(c, y, 'Online (www.sanjalika.lk/booking)');
  y = bullet(c, y, 'Visa / Mastercard (3D Secure)');
  y = bullet(c, y, 'PayHere — Sri Lanka\'s leading payment gateway');
  y = bullet(c, y, 'Online tickets are sent to your email as a QR code. Present at Gate 1 for scanning. No printing required.');
  y = bullet(c, y, 'Online booking available up to 7 days in advance. Same-day tickets available online until 11:00 AM.');
  y += 6;
  y = h1(c, y, '5. Refund & Cancellation Policy');
  y = tableRow(c, y, ['Notice Given', 'Refund Amount', 'Processing Time'], [160,160,155], true);
  y = tableRow(c, y, ['7+ days before visit', 'Full refund (100%)', '5–7 business days'], [160,160,155]);
  y = tableRow(c, y, ['3–6 days before visit', '75% refund', '5–7 business days'], [160,160,155]);
  y = tableRow(c, y, ['1–2 days before visit', '50% refund', '7–10 business days'], [160,160,155]);
  y = tableRow(c, y, ['Same day / No-show', 'No refund', 'N/A'], [160,160,155]);
  y = tableRow(c, y, ['Park closure (weather)', 'Full refund or reschedule', '5–7 business days'], [160,160,155]);
  y += 4;
  y = para(c, y, 'To request a refund, email bookings@sanjalika.lk with your booking reference number and reason. Refunds are processed to the original payment method. Online tickets only — counter purchases are non-refundable once entry has been used. Unused counter tickets may be rescheduled once within 30 days of original purchase date.');
  y += 6;
  y = h1(c, y, '6. Ticket Collection & Entry');
  y = bullet(c, y, 'Online tickets: Scan QR code at Gate 1 turnstile. No printing needed.');
  y = bullet(c, y, 'Counter tickets: Wristband issued on purchase. Do not remove wristband until exit.');
  y = bullet(c, y, 'Re-entry: Permitted same day. Collect a hand-stamp at the exit desk before leaving.');
  y = bullet(c, y, 'Lost wristband: Report to Guest Services (GS-1). Replacement wristband issued with valid ID.');
  footer(c, 2, 2); pages.push(c);

  save('ticket-information.pdf', pages);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOC 5 — Ride Safety Guide
═══════════════════════════════════════════════════════════════════════════ */
function genSafetyGuide() {
  const pages = [];

  // Page 1
  let c = [], y;
  y = header(c, 'Ride Safety Guide 2026', 'Read this guide carefully before enjoying any attraction');
  y += 10;
  y = h1(c, y, '1. General Safety Rules');
  y = para(c, y, 'ALL guests must read and comply with posted safety rules at each ride. Failure to follow safety guidelines may result in removal from the attraction or the park without refund. Our lifeguards and ride operators have full authority to enforce safety procedures.');
  y = bullet(c, y, 'Follow all verbal and visual instructions from ride operators and lifeguards at all times.');
  y = bullet(c, y, 'Do not enter a ride queue or boarding area until instructed by staff.');
  y = bullet(c, y, 'Maintain appropriate behaviour in queues — no pushing, no climbing on barriers.');
  y = bullet(c, y, 'Do not use rides under the influence of alcohol or any substance that impairs judgement.');
  y = bullet(c, y, 'Secure all loose items (glasses, jewellery, footwear) before boarding any ride. Cubbies are provided at each ride entrance. Management is not liable for lost items.');
  y = bullet(c, y, 'Pregnant women must not use any rides. Dedicated relaxation areas are available.');
  y = bullet(c, y, 'Single-rider lanes are available at select attractions for guests visiting without a companion.');
  y += 6;
  y = h1(c, y, '2. Height Requirements');
  y = tableRow(c, y, ['Ride Name', 'Minimum Height', 'Maximum Height', 'Category'], [150,95,95,135], true);
  y = tableRow(c, y, ['AquaCoaster (The Dragon)', '140 cm', 'None', 'Extreme'], [150,95,95,135]);
  y = tableRow(c, y, ['Free Fall Plunge', '140 cm', 'None', 'Extreme'], [150,95,95,135]);
  y = tableRow(c, y, ['Tornado Funnel Ride', '135 cm', 'None', 'Extreme'], [150,95,95,135]);
  y = tableRow(c, y, ['Twin Turbo Slides', '130 cm', 'None', 'High'], [150,95,95,135]);
  y = tableRow(c, y, ['Surf Simulator', '125 cm', 'None', 'Moderate'], [150,95,95,135]);
  y = tableRow(c, y, ['Ocean Falls Body Slide', '120 cm', 'None', 'Moderate'], [150,95,95,135]);
  y = tableRow(c, y, ['Raceway Slides', '110 cm', 'None', 'Family'], [150,95,95,135]);
  y = tableRow(c, y, ['Wave Pool', 'None (lifejacket <140cm)', 'None', 'Family'], [150,95,95,135]);
  y = tableRow(c, y, ['Lazy River', 'None (lifejacket <120cm)', 'None', 'Family'], [150,95,95,135]);
  y = tableRow(c, y, ['AquaKids Splash Pad', 'Under 140 cm only', '140 cm max', 'Kids'], [150,95,95,135]);
  y = tableRow(c, y, ['Mini Racers (Kids)', 'Under 140 cm only', '140 cm max', 'Kids'], [150,95,95,135]);
  y += 4;
  y = para(c, y, 'Height is measured without footwear. A height check station is located at the main entrance to each zone. Children close to the threshold are measured by staff before boarding.');
  footer(c, 1, 3); pages.push(c);

  // Page 2
  c = []; y = 50;
  y = h1(c, y, '3. Age Restrictions');
  y = tableRow(c, y, ['Category', 'Age', 'Supervision', 'Note'], [120,80,140,135], true);
  y = tableRow(c, y, ['AquaKids Zone', 'Under 12', 'Adult must be present', 'Adult need not ride'], [120,80,140,135]);
  y = tableRow(c, y, ['Extreme rides', '12+ years', 'None required', 'Height rule applies'], [120,80,140,135]);
  y = tableRow(c, y, ['Wave Pool', 'All ages', 'Under 8 needs adult', 'Lifejacket under 140cm'], [120,80,140,135]);
  y = tableRow(c, y, ['Lazy River', 'All ages', 'Under 8 needs adult', 'Lifejacket under 120cm'], [120,80,140,135]);
  y = tableRow(c, y, ['Surf Simulator', '12+ years', 'None required', 'Height 125cm min'], [120,80,140,135]);
  y += 6;
  y = h1(c, y, '4. Health Precautions');
  y = para(c, y, 'Certain medical conditions may be aggravated by water park activities. Please consult your doctor before visiting if you have any of the following conditions. This list is not exhaustive — when in doubt, consult your physician.');
  y = h2(c, y, 'DO NOT USE RIDES if you have:');
  y = bullet(c, y, 'Heart conditions, cardiovascular disease, or history of cardiac events');
  y = bullet(c, y, 'High or uncontrolled blood pressure');
  y = bullet(c, y, 'Epilepsy or seizure disorders');
  y = bullet(c, y, 'Recent surgery, open wounds, or orthopaedic injuries');
  y = bullet(c, y, 'Cervical (neck) or lumbar (lower back) spine conditions');
  y = bullet(c, y, 'Pregnancy (any stage)');
  y = bullet(c, y, 'Acute ear infections, perforated eardrums, or recent ear surgery');
  y = bullet(c, y, 'Skin conditions that may be adversely affected by chlorinated water');
  y = bullet(c, y, 'Fear of enclosed spaces (certain enclosed tube rides may trigger claustrophobia)');
  y += 6;
  y = h2(c, y, 'Precautions for All Guests');
  y = bullet(c, y, 'Shower before entering any pool area — this helps maintain water quality for everyone.');
  y = bullet(c, y, 'Do not swallow pool or wave pool water. Our water is treated but consumption is not recommended.');
  y = bullet(c, y, 'Stay hydrated. Drink water regularly, especially on hot days. Free water stations are at every zone.');
  y = bullet(c, y, 'Apply waterproof sunscreen before entry and reapply every 2 hours. SPF 30+ recommended. Reef-safe sunscreens preferred.');
  y = bullet(c, y, 'If you feel unwell at any point, exit the attraction immediately and visit the First Aid Centre (Grid FA-1).');
  y = bullet(c, y, 'Guests with diabetes should inform a family member or staff member before riding. Carry snacks.');
  footer(c, 2, 3); pages.push(c);

  // Page 3
  c = []; y = 50;
  y = h1(c, y, '5. Lifejacket & Flotation Policy');
  y = bullet(c, y, 'Complimentary lifejackets (Coast Guard-approved) are provided at the Wave Pool and Lazy River entrances. Mandatory for all guests under 140 cm at the Wave Pool and under 120 cm at the Lazy River.');
  y = bullet(c, y, 'Personal inflatable armbands, rings, or floaties are NOT permitted on any attraction. Park-issued lifejackets are the only approved personal flotation device.');
  y = bullet(c, y, 'Lifejackets must be correctly fitted and fastened. Staff will check fitting before entry. Incorrectly worn lifejackets will be readjusted or the guest will be denied entry until correctly fitted.');
  y = bullet(c, y, 'Do not remove your lifejacket while in the water. Return the lifejacket to the designated rack upon exiting the attraction.');
  y += 6;
  y = h1(c, y, '6. Emergency Procedures');
  y = para(c, y, 'In the event of an emergency, Sanjalika Water Park has comprehensive response protocols. All ride operators and lifeguards are trained in water rescue, CPR, and AED operation. Response time from any point in the park to the First Aid Centre is under 3 minutes.');
  y = h2(c, y, 'If You Witness an Emergency');
  y = bullet(c, y, 'Shout for the nearest lifeguard or staff member immediately.');
  y = bullet(c, y, 'Call the emergency line: any park telephone, dial Extension 0. From outside: +94 38 223 4568.');
  y = bullet(c, y, 'Do NOT enter the water to rescue someone unless you are a trained swimmer and a lifeguard is not present — wait for lifeguard response.');
  y = bullet(c, y, 'Clear the area around the casualty to allow lifeguard and first-aid access.');
  y = h2(c, y, 'Ride Malfunction / Stuck on Ride');
  y = bullet(c, y, 'Remain calm. Do not attempt to exit the ride or slide independently until a staff member arrives.');
  y = bullet(c, y, 'All rides are equipped with communication systems. Press the emergency button (red button on raft/tube) or shout to the operator.');
  y = bullet(c, y, 'Rides are designed to stop safely within 20 seconds of an emergency stop command. Staff response time at any ride is under 5 minutes.');
  y = h2(c, y, 'General Park Emergency (Evacuation)');
  y = bullet(c, y, 'Follow the PA announcement instructions. Evacuate calmly using the nearest marked EXIT (green signage).');
  y = bullet(c, y, 'Proceed to your designated assembly point. Do not return to any ride area until cleared by management.');
  y = bullet(c, y, 'Assist elderly guests, children, and guests with disabilities to the nearest exit.');
  y += 6;
  y = h1(c, y, '7. Water Quality Standards');
  y = para(c, y, 'All pool water at Sanjalika Water Park is continuously monitored and treated using automated chlorination and filtration systems. Water quality tests are conducted every 2 hours by our qualified pool technicians. Results are logged and available to guests on request at Guest Services. We comply with all Sri Lanka Standards Institution (SLSI) requirements for recreational water quality and adhere to WHO guidelines for swimming pool water.');
  footer(c, 3, 3); pages.push(c);

  save('safety-guide.pdf', pages);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOC 6 — Park Rules & Policies
═══════════════════════════════════════════════════════════════════════════ */
function genParkRules() {
  const pages = [];

  // Page 1
  let c = [], y;
  y = header(c, 'Park Rules & Policies', 'Please read carefully — these rules protect everyone\'s enjoyment');
  y += 10;
  y = h1(c, y, '1. General Rules');
  y = para(c, y, 'Sanjalika Water Park is a family-friendly destination. All guests are expected to behave in a manner that is respectful, safe, and considerate of other guests and staff. Management reserves the right to remove any guest who violates these rules without refund.');
  y = bullet(c, y, 'Comply with all instructions from park staff, lifeguards, and posted signage at all times.');
  y = bullet(c, y, 'Do not run in any area of the park. Walking paths and pool decks are slip-hazard zones.');
  y = bullet(c, y, 'No rough play, fighting, or aggressive behaviour of any kind.');
  y = bullet(c, y, 'Loud music, abusive language, or offensive behaviour will result in immediate removal.');
  y = bullet(c, y, 'Smoking and vaping are only permitted in the designated Smoking Zone (Grid SZ-1, near Car Park Lot A). Smoking elsewhere is strictly prohibited.');
  y = bullet(c, y, 'Littering is not tolerated. Use the bins provided throughout the park. Hazardous littering (broken glass, needles) is a criminal offence.');
  y = bullet(c, y, 'All guests are responsible for the behaviour of children in their care.');
  y = bullet(c, y, 'Do not bring or consume alcohol inside the park. Alcohol is not sold on the premises.');
  y = bullet(c, y, 'Gambling, soliciting, and unauthorised commercial activities are strictly prohibited.');
  y += 6;
  y = h1(c, y, '2. Dress Code');
  y = para(c, y, 'Sanjalika Water Park enforces a dress code to ensure hygiene, safety, and the comfort of all guests.');
  y = h2(c, y, 'Required Swimwear');
  y = bullet(c, y, 'Guests must wear proper swimwear to use all water attractions (pools, slides, wave pool, lazy river).');
  y = bullet(c, y, 'Accepted: Swimming costumes, bikinis, board shorts, rashguards, burkinis, swim leggings, wetsuits.');
  y = bullet(c, y, 'Not accepted: Denim (jeans, shorts), underwear, cotton t-shirts and shorts as primary swimwear.');
  y = bullet(c, y, 'Burkinis, full-coverage swim suits, and modest swimwear are fully welcome and respected.');
  y = bullet(c, y, 'Children in the AquaKids area must wear swim nappies if not yet toilet trained.');
  y = h2(c, y, 'General Dress');
  y = bullet(c, y, 'Footwear is recommended in all dry zones and on all pathways. Pool sandals or flip-flops are ideal.');
  y = bullet(c, y, 'Footwear must be removed before entering all pool areas, slides, and the wave pool deck.');
  y = bullet(c, y, 'Revealing clothing beyond swimwear zones (e.g., in the Food Zone) should be covered with a towel or wrap. Cover-ups are available for purchase at the Gift Shop.');
  footer(c, 1, 3); pages.push(c);

  // Page 2
  c = []; y = 50;
  y = h1(c, y, '3. Food & Beverage Policy');
  y = bullet(c, y, 'Outside food and beverages are not permitted inside the park. This policy supports food safety, the cleanliness of the park, and the viability of our dining operations.');
  y = bullet(c, y, 'Exceptions: Infant formula (powdered and pre-mixed), baby food, and medically necessary dietary items are permitted. Please declare these at the entrance desk.');
  y = bullet(c, y, 'Guests may not bring alcohol into the park. Alcohol is not available for purchase on site.');
  y = bullet(c, y, 'No glass containers of any kind — all beverages must be in plastic, aluminium, or paper containers.');
  y = bullet(c, y, 'Eating and drinking are not permitted on rides, in pools, or on pool decks. Use designated dining areas.');
  y = bullet(c, y, 'Our Food Zone caters to a wide range of dietary requirements. Vegetarian, vegan, halal, and gluten-free options are available. Speak to Food Zone staff for allergen information.');
  y += 6;
  y = h1(c, y, '4. Photography & Video Policy');
  y = bullet(c, y, 'Personal photography (smartphones and compact cameras) is permitted throughout the park in public areas.');
  y = bullet(c, y, 'Photography is NOT permitted in changing rooms, locker rooms, restrooms, or prayer rooms. CCTV monitors these restrictions.');
  y = bullet(c, y, 'Drones and UAVs are strictly prohibited without prior written permission from park management.');
  y = bullet(c, y, 'Professional photography and filming equipment (DSLRs, video rigs, boom arms) require advance approval. Contact media@sanjalika.lk.');
  y = bullet(c, y, 'Selfie sticks and handheld gimbals are not permitted on rides — these are a safety hazard. Secure all devices before boarding.');
  y = bullet(c, y, 'The park operates a professional in-house photography service at select ride exits. Packages start from LKR 800 for a digital set.');
  y = bullet(c, y, 'By entering the park, guests consent to the possibility of appearing in official Sanjalika marketing photographs or videos taken in public areas. If you prefer to opt out, notify Guest Services and a special "no-photograph" wristband will be issued.');
  y += 6;
  y = h1(c, y, '5. Lost & Found');
  y = bullet(c, y, 'All found items are handed to the Lost & Found desk at Main Guest Services (GS-1) immediately upon discovery.');
  y = bullet(c, y, 'Lost & Found items are held for 30 days, after which unclaimed items are donated to a registered charity.');
  y = bullet(c, y, 'To report a lost item during your visit: Go to Guest Services (GS-1) or call Extension 101.');
  y = bullet(c, y, 'To enquire about an item after your visit: Email lostandfound@sanjalika.lk with a description and your visit date. Include your contact number for prompt follow-up.');
  y = bullet(c, y, 'Valuables (phones, wallets, keys): The park strongly recommends using our secure lockers. Management is not responsible for items lost or stolen outside of our locker facilities.');
  footer(c, 2, 3); pages.push(c);

  // Page 3
  c = []; y = 50;
  y = h1(c, y, '6. Prohibited Items');
  y = para(c, y, 'The following items are not permitted inside Sanjalika Water Park. Items may be confiscated at the entrance gate and will be held at Lost & Found for collection upon exit. Non-compliance may result in denial of entry.');
  y = h2(c, y, 'Absolutely Prohibited (no exceptions)');
  y = bullet(c, y, 'Weapons of any kind (knives, firearms, blunt instruments)');
  y = bullet(c, y, 'Illegal drugs or controlled substances');
  y = bullet(c, y, 'Alcohol (all forms)');
  y = bullet(c, y, 'Glass containers or glassware');
  y = bullet(c, y, 'Drones / UAVs (without prior written approval)');
  y = bullet(c, y, 'Fireworks, flares, or pyrotechnics');
  y = bullet(c, y, 'Hoverboards, electric scooters, and skateboards');
  y = h2(c, y, 'Not Permitted in Water Zones');
  y = bullet(c, y, 'Personal inflatable devices (armbands, rings, floaties) — park-issue lifejackets only');
  y = bullet(c, y, 'Fins or scuba equipment');
  y = bullet(c, y, 'Goggles with hard frames in the wave pool');
  y = bullet(c, y, 'Body paint or temporary tattoos that may bleed colour into the water');
  y = h2(c, y, 'Managed Items (declare at gate)');
  y = bullet(c, y, 'Infant formula and baby food — permitted, must be declared');
  y = bullet(c, y, 'Prescription medicine — permitted with packaging label');
  y = bullet(c, y, 'EpiPens and medical devices — permitted, notify First Aid Centre (FA-1)');
  y = bullet(c, y, 'Registered assistance animals — permitted with documentation');
  y += 6;
  y = h1(c, y, '7. Right of Admission & Guest Removal');
  y = para(c, y, 'Sanjalika Water Park Management reserves the right to refuse admission to, or remove from the park, any guest who: violates any of the park rules set out in this document; behaves in a manner that threatens the safety or enjoyment of other guests or staff; is found to be intoxicated; or misrepresents their age or eligibility for a ticket category. Removed guests will not receive a refund. Serious rule violations may be referred to law enforcement.');
  y += 6;
  y = h1(c, y, '8. Privacy & Data');
  y = para(c, y, 'Guest personal data collected during ticketing, online booking, and Wi-Fi registration is handled in accordance with our Privacy Policy, available separately. CCTV operates in all public areas of the park for safety purposes. Footage is retained for 30 days.');
  footer(c, 3, 3); pages.push(c);

  save('park-rules.pdf', pages);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOC 7 — Privacy Policy
═══════════════════════════════════════════════════════════════════════════ */
function genPrivacyPolicy() {
  const pages = [];

  let c = [], y;
  y = header(c, 'Privacy Policy', 'Effective Date: 1 January 2026  |  Last Updated: 15 March 2026');
  y += 10;
  y = h1(c, y, '1. Introduction');
  y = para(c, y, 'Sanjalika Water Park (Pvt) Ltd ("we", "us", "our") is committed to protecting the personal information of our guests, website visitors, and ticket purchasers. This Privacy Policy explains how we collect, use, store, and protect your personal data in accordance with the Sri Lanka Personal Data Protection Act No. 9 of 2022 and other applicable privacy laws.');
  y += 6;
  y = h1(c, y, '2. Information We Collect');
  y = h2(c, y, 'Information You Provide');
  y = bullet(c, y, 'Full name, email address, and phone number when booking tickets online or registering for a Season Pass.');
  y = bullet(c, y, 'Payment card details (processed securely via PayHere — we do not store card numbers).');
  y = bullet(c, y, 'Booking preferences, group size, and special requirements (accessibility, dietary) when provided.');
  y = bullet(c, y, 'Enquiry details submitted via our Contact Us form or email.');
  y = h2(c, y, 'Information Collected Automatically');
  y = bullet(c, y, 'IP address, browser type, and device type when you visit www.sanjalika.lk.');
  y = bullet(c, y, 'Mobile number provided during in-park Wi-Fi registration.');
  y = bullet(c, y, 'CCTV footage collected in all public areas of the park (retained 30 days).');
  y += 6;
  y = h1(c, y, '3. How We Use Your Information');
  y = bullet(c, y, 'Process and confirm ticket bookings and send booking confirmation emails.');
  y = bullet(c, y, 'Provide customer service and respond to enquiries.');
  y = bullet(c, y, 'Send promotional newsletters and special offers (only if you have opted in).');
  y = bullet(c, y, 'Improve our website, services, and guest experience using aggregated analytics.');
  y = bullet(c, y, 'Comply with legal obligations including tax records and safety incident reporting.');
  y = bullet(c, y, 'Investigate and resolve disputes, complaints, or safety incidents.');
  footer(c, 1, 2); pages.push(c);

  c = []; y = 50;
  y = h1(c, y, '4. Data Sharing & Third Parties');
  y = para(c, y, 'We do not sell your personal data to any third party. We may share data with:');
  y = bullet(c, y, 'PayHere (payment processing) — solely for transaction processing, subject to their privacy policy.');
  y = bullet(c, y, 'Email service providers — for sending booking confirmations and newsletters.');
  y = bullet(c, y, 'Law enforcement authorities — if required by court order or law.');
  y += 6;
  y = h1(c, y, '5. Data Retention');
  y = bullet(c, y, 'Booking records: retained for 5 years for accounting and legal purposes.');
  y = bullet(c, y, 'CCTV footage: retained for 30 days, then automatically overwritten.');
  y = bullet(c, y, 'Marketing opt-in data: retained until you unsubscribe.');
  y = bullet(c, y, 'Wi-Fi session logs: retained for 90 days.');
  y += 6;
  y = h1(c, y, '6. Your Rights');
  y = para(c, y, 'Under the Sri Lanka Personal Data Protection Act 2022, you have the right to:');
  y = bullet(c, y, 'Access the personal data we hold about you — submit a written request to privacy@sanjalika.lk.');
  y = bullet(c, y, 'Request correction of inaccurate data.');
  y = bullet(c, y, 'Request deletion of your data (subject to legal retention requirements).');
  y = bullet(c, y, 'Withdraw marketing consent at any time by clicking "Unsubscribe" in any email or writing to us.');
  y = bullet(c, y, 'Lodge a complaint with the Sri Lanka Personal Data Protection Authority.');
  y += 6;
  y = h1(c, y, '7. Security');
  y = para(c, y, 'We use industry-standard security measures including TLS encryption for data in transit, secure hosting on servers located within Sri Lanka, and access controls limiting staff access to personal data. No system is completely secure; we encourage guests not to share sensitive information unnecessarily.');
  y += 6;
  y = h1(c, y, '8. Cookies (Website)');
  y = para(c, y, 'Our website (sanjalika.lk) uses essential cookies to maintain session state during booking. We use Google Analytics (anonymised) to understand website traffic patterns. You may disable non-essential cookies via your browser settings. Essential cookies cannot be disabled as they are required for the booking system to function.');
  y += 6;
  y = h1(c, y, '9. Contact Us on Privacy');
  y = para(c, y, 'Data Controller: Sanjalika Water Park (Pvt) Ltd, 123 Coastal Road, Panadura, Sri Lanka. Email: privacy@sanjalika.lk  |  Phone: +94 38 223 4567. We aim to respond to all privacy enquiries within 10 business days.');
  footer(c, 2, 2); pages.push(c);

  save('privacy-policy.pdf', pages);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOC 8 — Terms & Conditions
═══════════════════════════════════════════════════════════════════════════ */
function genTermsConditions() {
  const pages = [];

  let c = [], y;
  y = header(c, 'Terms & Conditions', 'By purchasing a ticket or entering the park, you agree to these terms');
  y += 10;
  y = h1(c, y, '1. Agreement to Terms');
  y = para(c, y, 'These Terms & Conditions govern the purchase of tickets to, and use of, Sanjalika Water Park (the "Park"), operated by Sanjalika Water Park (Pvt) Ltd ("Company"). Purchasing a ticket or entering the Park constitutes full acceptance of these terms by the guest and all members of their party.');
  y += 4;
  y = h1(c, y, '2. Ticket Purchase & Entry');
  y = bullet(c, y, 'All tickets are personal and non-transferable once used. Season Passes are non-transferable at all times.');
  y = bullet(c, y, 'The Company reserves the right to refuse admission or remove guests for rule violations without refund.');
  y = bullet(c, y, 'Tickets may be purchased online (www.sanjalika.lk) or at the Gate 1 ticketing counter on the day.');
  y = bullet(c, y, 'Children under 5 receive free entry. Age may be verified by requesting a birth certificate or school ID.');
  y = bullet(c, y, 'The Company reserves the right to alter prices with 30 days\' notice on its website.');
  y += 4;
  y = h1(c, y, '3. Limitation of Liability');
  y = para(c, y, 'The Company takes every reasonable precaution to ensure guest safety. However, guests use all attractions at their own risk. The Company shall not be liable for: personal injury caused by a guest\'s failure to follow safety guidelines; loss or damage to personal property not stored in our secure lockers; indirect or consequential losses arising from park closures due to weather or unforeseen events.');
  y += 4;
  y = h1(c, y, '4. Health & Medical');
  y = para(c, y, 'Guests with pre-existing medical conditions are advised to consult their physician before visiting. By using rides, guests declare they have no medical condition that would make use of that ride unsafe. The Company is not liable for adverse health events arising from undisclosed medical conditions.');
  footer(c, 1, 2); pages.push(c);

  c = []; y = 50;
  y = h1(c, y, '5. Intellectual Property');
  y = para(c, y, 'All branding, trade marks, photographs, videos, and content on the Sanjalika website, in documents, and within the park are the property of Sanjalika Water Park (Pvt) Ltd. Guests may not reproduce, distribute, or commercially exploit any such material without prior written consent.');
  y += 4;
  y = h1(c, y, '6. Photography Consent');
  y = para(c, y, 'By entering the Park, guests consent to potentially appearing in official Sanjalika marketing photographs or videos taken in public areas. Guests wishing to opt out must notify Guest Services at the main entrance. The Company will not use photographs of identifiable individuals in marketing without explicit consent.');
  y += 4;
  y = h1(c, y, '7. Force Majeure');
  y = para(c, y, 'The Company is not liable for failure to deliver services due to events outside its reasonable control including but not limited to: natural disasters, flooding, severe weather, government orders, pandemics, or acts of terrorism. In such cases, the Company will offer guests a reschedule or credit note, but is not obligated to provide full cash refunds.');
  y += 4;
  y = h1(c, y, '8. Governing Law & Disputes');
  y = para(c, y, 'These Terms & Conditions are governed by the laws of the Democratic Socialist Republic of Sri Lanka. Any disputes arising from these terms shall first be attempted to be resolved through mediation. Unresolved disputes shall be referred to the jurisdiction of the Panadura Magistrate\'s Court or the Commercial High Court of Sri Lanka, as applicable.');
  y += 4;
  y = h1(c, y, '9. Changes to Terms');
  y = para(c, y, 'The Company reserves the right to update these Terms & Conditions at any time. The current version is always available at www.sanjalika.lk/terms and at the Guest Services desk. Continued use of the Park after changes constitutes acceptance of the updated terms.');
  y += 4;
  y = h1(c, y, '10. Contact');
  y = para(c, y, 'For any questions about these Terms & Conditions: legal@sanjalika.lk  |  +94 38 223 4567  |  123 Coastal Road, Panadura, Sri Lanka.');
  footer(c, 2, 2); pages.push(c);

  save('terms-conditions.pdf', pages);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOC 9 — Emergency Information
═══════════════════════════════════════════════════════════════════════════ */
function genEmergencyInfo() {
  const pages = [];

  let c = [], y;
  y = header(c, 'Emergency Information', 'Keep this guide accessible during your visit');
  y += 10;
  y = h1(c, y, '1. Emergency Contact Numbers');
  y = tableRow(c, y, ['Service', 'Number', 'Available'], [170,160,145], true);
  y = tableRow(c, y, ['Park Emergency Line (in-park phone)', 'Extension 0', 'During park hours'], [170,160,145]);
  y = tableRow(c, y, ['Park Security Control Room', '+94 38 223 4568', '24 hours'], [170,160,145]);
  y = tableRow(c, y, ['First Aid Centre (direct)', '+94 38 223 4569', 'During park hours'], [170,160,145]);
  y = tableRow(c, y, ['Sri Lanka Police', '119', '24 hours'], [170,160,145]);
  y = tableRow(c, y, ['Ambulance / Fire / Rescue', '110', '24 hours'], [170,160,145]);
  y = tableRow(c, y, ['Panadura Base Hospital', '+94 38 223 2221', '24 hours'], [170,160,145]);
  y = tableRow(c, y, ['Nearest Private Hospital (Asiri)', '+94 38 223 5000', '24 hours'], [170,160,145]);
  y += 6;
  y = h1(c, y, '2. Emergency Procedures — Summary');
  y = h2(c, y, 'If Someone is in Distress in the Water');
  y = bullet(c, y, 'Shout "LIFEGUARD!" immediately and point to the person.');
  y = bullet(c, y, 'DO NOT enter the water unless you are a trained swimmer and no lifeguard is available.');
  y = bullet(c, y, 'Throw the nearest life ring (located every 20 m around all pool perimeters).');
  y = bullet(c, y, 'Call Extension 0 from any park phone.');
  y = h2(c, y, 'If Someone Collapses on Dry Ground');
  y = bullet(c, y, 'Call for staff assistance immediately or use any park phone (Extension 0).');
  y = bullet(c, y, 'If trained, begin CPR if the person is unresponsive and not breathing.');
  y = bullet(c, y, 'An AED is available at the First Aid Centre (FA-1) and near the Wave Pool entrance. Follow voice instructions.');
  y = bullet(c, y, 'Keep bystanders back to allow space for the first-aid team.');
  y = h2(c, y, 'Fire or Smoke');
  y = bullet(c, y, 'Activate the nearest red fire alarm pull station.');
  y = bullet(c, y, 'Exit via the nearest green EXIT sign to the designated assembly point.');
  y = bullet(c, y, 'Do NOT use lifts (none are operational during a fire alarm).');
  y = bullet(c, y, 'Do NOT re-enter until the all-clear is announced over the PA system.');
  footer(c, 1, 2); pages.push(c);

  c = []; y = 50;
  y = h1(c, y, '3. Assembly Points');
  y = tableRow(c, y, ['Assembly Point', 'Location', 'Capacity', 'From'], [110,195,70,100], true);
  y = tableRow(c, y, ['AP-1 (Primary)', 'Car Park Lot A (Gate 1)', '2,000 guests', 'All zones'], [110,195,70,100]);
  y = tableRow(c, y, ['AP-2', 'Car Park Lot B (Gate 2)', '800 guests', 'South zones'], [110,195,70,100]);
  y = tableRow(c, y, ['AP-3', 'East service road', '600 guests', 'Family Zone east'], [110,195,70,100]);
  y = tableRow(c, y, ['AP-4', 'Food Zone external plaza', '500 guests', 'Food Zone / West'], [110,195,70,100]);
  y += 6;
  y = h1(c, y, '4. AED Locations (Automated External Defibrillator)');
  y = bullet(c, y, 'AED-1: First Aid Centre (FA-1), Gate B entrance. Green AED cabinet on exterior wall.');
  y = bullet(c, y, 'AED-2: Wave Pool entrance, north side (FZ-1A). Yellow AED cabinet mounted on pillar.');
  y = bullet(c, y, 'AED-3: Food Zone exterior wall, facing Central Plaza (WZ-1). Green AED cabinet.');
  y = para(c, y, 'All AEDs emit an audible alert when opened and provide step-by-step voice instructions. No training is needed to use them. Staff at every zone are trained in AED operation.');
  y += 6;
  y = h1(c, y, '5. First Aid Centre Capabilities');
  y = bullet(c, y, 'Staffed by qualified first-aiders and a visiting registered nurse (weekends and holidays).');
  y = bullet(c, y, 'Equipped with: AED, oxygen, stretcher, cervical collars, wound care, oral rehydration, antihistamines.');
  y = bullet(c, y, 'Can stabilise guests while awaiting ambulance transport to Panadura Base Hospital (3 km away).');
  y = bullet(c, y, 'Guest relatives may wait in the First Aid Centre waiting area during treatment.');
  y += 6;
  y = h1(c, y, '6. Severe Weather Protocol');
  y = bullet(c, y, 'Lightning / Thunder: All outdoor attractions and pools are immediately suspended. Guests are directed to covered areas including the Food Hall, Main Changing Block, and Central Plaza covered walkways.');
  y = bullet(c, y, 'Heavy Rain: Operations continue unless lightning is detected within 10 km (monitored by weather station). Guests may remain in covered zones.');
  y = bullet(c, y, 'High Winds: Elevated rides (AquaCoaster launch tower, Free Fall) may be suspended at management\'s discretion. Other rides continue unless wind speed exceeds 60 km/h.');
  y = bullet(c, y, 'Flooding: In the unlikely event of coastal flooding, all gates are opened immediately for evacuation. Follow PA instructions and proceed to the elevated Extreme Zone (highest ground in the park).');
  y += 6;
  y = h1(c, y, '7. Missing Child Procedure');
  y = bullet(c, y, 'If your child is missing, go immediately to the Main Guest Services desk (GS-1) or tell the nearest staff member in a teal uniform.');
  y = bullet(c, y, 'The park will immediately initiate "Code Adam" — a park-wide search protocol with all staff alerted.');
  y = bullet(c, y, 'All park exits will be monitored. A description broadcast will go over the internal staff radio network.');
  y = bullet(c, y, 'Children found alone are taken to the First Aid Centre (FA-1) and kept with a staff member of the same gender.');
  footer(c, 2, 2); pages.push(c);

  save('emergency-information.pdf', pages);
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOC 10 — Food Menu
═══════════════════════════════════════════════════════════════════════════ */
function genFoodMenu() {
  const pages = [];

  // Page 1
  let c = [], y;
  y = header(c, 'Food Zone Menu 2026', 'Ocean Grill  ·  AquaBites  ·  Pizza Presto  ·  Ice Cream Paradise  ·  Sip & Splash  ·  Kids Corner');
  y += 10;
  y = h1(c, y, 'Ocean Grill — BBQ & Seafood Restaurant');
  y = para(c, y, 'Open: 11:00 AM – 7:00 PM  |  Seating: 80 indoor  |  Halal Certified  |  Reservation recommended on weekends');
  y = h2(c, y, 'Starters');
  y = tableRow(c, y, ['Item', 'Description', 'Price (LKR)'], [160,245,70], true);
  y = tableRow(c, y, ['Prawn Cocktail', 'Chilled prawns, cocktail sauce, lemon wedge', '950'], [160,245,70]);
  y = tableRow(c, y, ['Calamari Rings', 'Lightly battered, served with aioli dip', '850'], [160,245,70]);
  y = tableRow(c, y, ['Garlic Bread (4 pc)', 'Toasted ciabatta with herb butter', '450'], [160,245,70]);
  y = tableRow(c, y, ['Fish Fingers (5 pc)', 'Crispy battered fish, tartar sauce', '750'], [160,245,70]);
  y = h2(c, y, 'Main Courses');
  y = tableRow(c, y, ['Item', 'Description', 'Price (LKR)'], [160,245,70], true);
  y = tableRow(c, y, ['Grilled Sea Bass', 'Whole sea bass, herb oil, seasonal vegetables', '2,800'], [160,245,70]);
  y = tableRow(c, y, ['BBQ Chicken Platter', 'Half chicken, corn, fries, coleslaw', '1,950'], [160,245,70]);
  y = tableRow(c, y, ['Prawn Skewers', '6 tiger prawns, garlic butter, jasmine rice', '2,200'], [160,245,70]);
  y = tableRow(c, y, ['Grilled Salmon', 'Norwegian salmon fillet, lemon cream sauce, mash', '2,600'], [160,245,70]);
  y = tableRow(c, y, ['Veg Mixed Grill (V)', 'Halloumi, portobello, zucchini, pepper, pitta', '1,600'], [160,245,70]);
  y = tableRow(c, y, ['Kids Fish & Chips', 'Battered fish fillet, fries, juice box', '950'], [160,245,70]);
  footer(c, 1, 3); pages.push(c);

  // Page 2
  c = []; y = 50;
  y = h1(c, y, 'AquaBites Cafe — Poolside Snacks & Fast Food');
  y = para(c, y, 'Open: 9:00 AM – closing  |  Outdoor seating 40  |  Poolside delivery available');
  y = tableRow(c, y, ['Item', 'Price (LKR)'], [320,155], true);
  y = tableRow(c, y, ['Cheeseburger + Fries', '1,200'], [320,155]);
  y = tableRow(c, y, ['Chicken Wrap + Salad', '1,050'], [320,155]);
  y = tableRow(c, y, ['Veggie Burger (V)', '950'], [320,155]);
  y = tableRow(c, y, ['Hot Dog', '700'], [320,155]);
  y = tableRow(c, y, ['Masala Fries (V)', '550'], [320,155]);
  y = tableRow(c, y, ['Cheese Fries', '600'], [320,155]);
  y = tableRow(c, y, ['Egg & Cheese Sandwich', '650'], [320,155]);
  y = tableRow(c, y, ['Club Sandwich', '900'], [320,155]);
  y += 6;
  y = h1(c, y, 'Pizza Presto — Italian & Pizza');
  y = para(c, y, 'Open: 11:00 AM – 7:00 PM  |  30 indoor seats  |  Dine-in and takeaway');
  y = tableRow(c, y, ['Pizza (10 inch)', 'Toppings', 'Price (LKR)'], [150,210,115], true);
  y = tableRow(c, y, ['Margherita (V)', 'Tomato, mozzarella, basil', '1,400'], [150,210,115]);
  y = tableRow(c, y, ['Pepperoni', 'Pepperoni, mozzarella, tomato', '1,700'], [150,210,115]);
  y = tableRow(c, y, ['BBQ Chicken', 'Chicken, BBQ sauce, onion, mozzarella', '1,800'], [150,210,115]);
  y = tableRow(c, y, ['Seafood Supreme', 'Prawns, squid, mozzarella, garlic', '2,000'], [150,210,115]);
  y = tableRow(c, y, ['Veggie Fiesta (V)', 'Capsicum, mushroom, olives, feta', '1,600'], [150,210,115]);
  y += 4;
  y = tableRow(c, y, ['Pasta Dish', 'Sauce', 'Price (LKR)'], [150,210,115], true);
  y = tableRow(c, y, ['Spaghetti Bolognese', 'Beef mince, tomato, herbs', '1,500'], [150,210,115]);
  y = tableRow(c, y, ['Penne Arrabiata (V)', 'Tomato, chilli, garlic', '1,200'], [150,210,115]);
  y = tableRow(c, y, ['Fettuccine Alfredo (V)', 'Cream, parmesan, mushroom', '1,400'], [150,210,115]);
  footer(c, 2, 3); pages.push(c);

  // Page 3
  c = []; y = 50;
  y = h1(c, y, 'Ice Cream Paradise — Desserts & Gelato');
  y = para(c, y, 'Open: 9:00 AM – closing  |  Counter service  |  Vegan options available');
  y = tableRow(c, y, ['Item', 'Description', 'Price (LKR)'], [150,245,80], true);
  y = tableRow(c, y, ['Single Scoop Gelato', '25+ flavours rotating daily', '350'], [150,245,80]);
  y = tableRow(c, y, ['Double Scoop', '2 flavours of your choice', '600'], [150,245,80]);
  y = tableRow(c, y, ['Waffle Cone (1 scoop)', 'Premium waffle cone', '450'], [150,245,80]);
  y = tableRow(c, y, ['Sundae', 'Ice cream, hot fudge, nuts, cream', '950'], [150,245,80]);
  y = tableRow(c, y, ['Mango Sorbet (V/GF)', 'Vegan, gluten-free, mango', '400'], [150,245,80]);
  y = tableRow(c, y, ['Ice Cream Sandwich', 'Soft cookie + vanilla ice cream', '700'], [150,245,80]);
  y = tableRow(c, y, ['Frozen Yoghurt Cup', 'Plain or fruit-flavoured', '500'], [150,245,80]);
  y += 6;
  y = h1(c, y, 'Sip & Splash Bar — Juices & Beverages');
  y = para(c, y, 'Open: 9:00 AM – closing  |  Two locations: Food Zone (WZ-3) and Wave Pool side (WZ-3B)');
  y = tableRow(c, y, ['Item', 'Size', 'Price (LKR)'], [220,130,125], true);
  y = tableRow(c, y, ['Fresh Coconut Water', 'Whole coconut', '350'], [220,130,125]);
  y = tableRow(c, y, ['Fresh Fruit Juice', '350ml (mango / passion / guava)', '450'], [220,130,125]);
  y = tableRow(c, y, ['Smoothie', '400ml (berry / tropical / green)', '650'], [220,130,125]);
  y = tableRow(c, y, ['Cold Brew Coffee', '300ml', '550'], [220,130,125]);
  y = tableRow(c, y, ['Lemonade (homemade)', '400ml', '400'], [220,130,125]);
  y = tableRow(c, y, ['Soft Drinks', '330ml can', '250'], [220,130,125]);
  y = tableRow(c, y, ['Mineral Water', '500ml / 1L', '150 / 250'], [220,130,125]);
  y += 6;
  y = h1(c, y, 'Kids Corner Diner');
  y = para(c, y, 'Open: 10:00 AM – 6:00 PM  |  25 indoor seats  |  All items sized for little appetites');
  y = tableRow(c, y, ['Item', 'Price (LKR)'], [320,155], true);
  y = tableRow(c, y, ['Kids Nuggets + Fries + Juice', '900'], [320,155]);
  y = tableRow(c, y, ['Mini Burger + Fries', '850'], [320,155]);
  y = tableRow(c, y, ['Mac & Cheese', '750'], [320,155]);
  y = tableRow(c, y, ['Mini Pancakes (3 pc) + Syrup', '600'], [320,155]);
  y = tableRow(c, y, ['Fruit Platter (seasonal)', '500'], [320,155]);
  y += 8;
  y = para(c, y, 'Key: (V) = Vegetarian  |  (VE) = Vegan  |  (GF) = Gluten-Free  |  All prices include VAT. Menu subject to seasonal changes. Please inform staff of any allergies before ordering. Full allergen information available at each venue on request.');
  footer(c, 3, 3); pages.push(c);

  save('food-menu.pdf', pages);
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN — Run all generators
═══════════════════════════════════════════════════════════════════════════ */
console.log('\nSanjalika Water Park — Generating documents...\n');

try { genVisitorGuide();    } catch(e) { console.error('visitor-guide:', e.message); }
try { genParkBrochure();    } catch(e) { console.error('park-brochure:', e.message); }
try { genParkMap();         } catch(e) { console.error('park-map:', e.message); }
try { genTicketInfo();      } catch(e) { console.error('ticket-information:', e.message); }
try { genSafetyGuide();     } catch(e) { console.error('safety-guide:', e.message); }
try { genParkRules();       } catch(e) { console.error('park-rules:', e.message); }
try { genPrivacyPolicy();   } catch(e) { console.error('privacy-policy:', e.message); }
try { genTermsConditions(); } catch(e) { console.error('terms-conditions:', e.message); }
try { genEmergencyInfo();   } catch(e) { console.error('emergency-information:', e.message); }
try { genFoodMenu();        } catch(e) { console.error('food-menu:', e.message); }

console.log('\nDone.\n');
