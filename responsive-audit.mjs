import http from 'node:http';
import net from 'node:net';
import crypto from 'node:crypto';

const root = 'file:///C:/Users/DELL/Desktop/Sanjalika_Water_Park/';
const pages = [
  'index.html',
  'about.html',
  'park-info.html',
  'rides.html',
  'gallery.html',
  'food-zone.html',
  'facilities.html',
  'booking.html',
  'downloads.html',
  'contact.html'
];
const widths = [320, 375, 425, 576, 768, 992, 1200, 1400];
const height = 1200;

function getJson(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

function encodeFrame(data) {
  const payload = Buffer.from(data);
  const len = payload.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = 0x80 | len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 0x80 | 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }

  header[0] = 0x81;
  const mask = crypto.randomBytes(4);
  const masked = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
  return Buffer.concat([header, mask, masked]);
}

function decodeFrames(buffer) {
  const messages = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const first = buffer[offset];
    const second = buffer[offset + 1];
    let len = second & 0x7f;
    let cursor = offset + 2;

    if (len === 126) {
      if (cursor + 2 > buffer.length) break;
      len = buffer.readUInt16BE(cursor);
      cursor += 2;
    } else if (len === 127) {
      if (cursor + 8 > buffer.length) break;
      len = Number(buffer.readBigUInt64BE(cursor));
      cursor += 8;
    }

    const masked = Boolean(second & 0x80);
    let mask;
    if (masked) {
      if (cursor + 4 > buffer.length) break;
      mask = buffer.subarray(cursor, cursor + 4);
      cursor += 4;
    }

    if (cursor + len > buffer.length) break;
    const payload = Buffer.from(buffer.subarray(cursor, cursor + len));
    if (masked) {
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
    }

    const opcode = first & 0x0f;
    if (opcode === 1) messages.push(payload.toString('utf8'));
    offset = cursor + len;
  }

  return { messages, rest: buffer.subarray(offset) };
}

class Cdp {
  constructor(wsUrl) {
    this.url = new URL(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);
  }

  connect() {
    return new Promise((resolve, reject) => {
      const key = crypto.randomBytes(16).toString('base64');
      this.socket = net.createConnection(Number(this.url.port), this.url.hostname, () => {
        this.socket.write([
          `GET ${this.url.pathname}${this.url.search} HTTP/1.1`,
          `Host: ${this.url.host}`,
          'Upgrade: websocket',
          'Connection: Upgrade',
          `Sec-WebSocket-Key: ${key}`,
          'Sec-WebSocket-Version: 13',
          '\r\n'
        ].join('\r\n'));
      });

      let handshake = '';
      this.socket.on('data', chunk => {
        if (handshake !== null) {
          handshake += chunk.toString('binary');
          const end = handshake.indexOf('\r\n\r\n');
          if (end === -1) return;
          this.buffer = Buffer.from(handshake.slice(end + 4), 'binary');
          handshake = null;
          resolve();
          this.flush();
          return;
        }
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.flush();
      });

      this.socket.on('error', reject);
    });
  }

  flush() {
    const decoded = decodeFrames(this.buffer);
    this.buffer = decoded.rest;
    for (const message of decoded.messages) {
      const data = JSON.parse(message);
      if (data.id && this.pending.has(data.id)) {
        this.pending.get(data.id)(data);
        this.pending.delete(data.id);
      }
    }
  }

  send(method, params = {}) {
    const id = ++this.id;
    const payload = JSON.stringify({ id, method, params });
    this.socket.write(encodeFrame(payload));
    return new Promise(resolve => this.pending.set(id, resolve));
  }

  close() {
    this.socket.end();
  }
}

const expression = `(() => {
  const doc = document;
  doc.querySelectorAll('.aqua-preloader, .page-loader, .page-transition, .mobile-nav-backdrop, .lightbox, .confirmation-modal').forEach(el => el.remove());
  const de = doc.documentElement;
  const body = doc.body;
  body?.classList.remove('is-loading', 'nav-overlay-active', 'is-transitioning');
  const viewWidth = window.innerWidth;
  const scrollWidth = Math.max(de.scrollWidth, body ? body.scrollWidth : 0);
  const offenders = [];
  const ignore = '.page-transition, .aqua-preloader, .mobile-nav-backdrop, .lightbox, .confirmation-modal';
  const isInsideHorizontalScroller = (el) => {
    let node = el.parentElement;
    while (node && node !== body) {
      const style = getComputedStyle(node);
      if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && node.scrollWidth > node.clientWidth) return true;
      node = node.parentElement;
    }
    return false;
  };
  doc.querySelectorAll('body *').forEach(el => {
    if (offenders.length >= 10 || el.closest(ignore) || isInsideHorizontalScroller(el)) return;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const visible = style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) !== 0 &&
      rect.width > 1 &&
      rect.height > 1 &&
      rect.right > 0 &&
      rect.left < viewWidth;
    if (!visible) return;
    if (rect.left < -2 || rect.right > viewWidth + 2) {
      offenders.push({
        selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().replace(/\\s+/g, '.') : ''),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width)
      });
    }
  });
  return { viewWidth, scrollWidth, overflow: Math.max(0, Math.round(scrollWidth - viewWidth)), offenders };
})()`;

async function waitForChrome() {
  for (let i = 0; i < 40; i++) {
    try {
      return await getJson('http://127.0.0.1:9222/json/version');
    } catch {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  throw new Error('Chrome debugging endpoint did not start.');
}

await waitForChrome();

for (const width of widths) {
  console.log(`=== ${width}px ===`);
  for (const page of pages) {
    const target = await getJson('http://127.0.0.1:9222/json/new?' + encodeURIComponent(root + page), 'PUT');
    const cdp = new Cdp(target.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768
    });
    await cdp.send('Page.navigate', { url: root + page + '?audit=' + Date.now() });
    await new Promise(resolve => setTimeout(resolve, 1700));
    const evaluated = await cdp.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    const value = evaluated.result?.result?.value;
    const offenders = value.offenders.map(o => `${o.selector} L${o.left} R${o.right} W${o.width}`).join(' | ');
    console.log(`${page}: overflow=${value.overflow} offenders=${offenders || 'none'}`);
    await cdp.send('Page.close').catch(() => {});
    cdp.close();
  }
}
