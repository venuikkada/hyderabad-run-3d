/* =========================================================
   Textures (all procedural), materials, geometry batching
   ========================================================= */
const COLC = new Map();
function C(hex) { let c = COLC.get(hex); if (!c) { c = new THREE.Color(hex).convertSRGBToLinear(); COLC.set(hex, c); } return c; }
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function mkTex(c, rep = true, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
function speckle(x, w, h, n, dark = .08, light = .05, sz = 2) {
  for (let i = 0; i < n; i++) { const d = Math.random() < .5; x.fillStyle = d ? `rgba(0,0,0,${Math.random() * dark})` : `rgba(255,255,255,${Math.random() * light})`; x.fillRect(Math.random() * w, Math.random() * h, sz * (1 + Math.random()), sz * (1 + Math.random())); }
}
const FONT_LAT = '"Hind","Segoe UI",Arial,sans-serif';
const FONT_TE = '"Noto Sans Telugu","Tiro Telugu","Nirmala UI","Gautami",sans-serif';
const FONT_NUM = '"Barlow Condensed","Arial Narrow",Arial,sans-serif';
const TX = {};

function buildTextures() {
  // ---- city facade (4x4 bays) ----
  function facade(style) {
    const S = 512, B = 128; const [c, x] = mkCanvas(S, S); const [e, y] = mkCanvas(S, S);
    x.fillStyle = '#eeeae2'; x.fillRect(0, 0, S, S); y.fillStyle = '#000'; y.fillRect(0, 0, S, S);
    speckle(x, S, S, 3000, .07, .05);
    for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
      const bx = q * B, by = r * B;
      x.fillStyle = 'rgba(0,0,0,.10)'; x.fillRect(bx, by + 2, B, 5);
      if (style === 'city') {
        const ww = 72, wh = 62, wx = bx + 28, wy = by + 24;
        x.fillStyle = '#cfcac0'; x.fillRect(wx - 6, wy - 6, ww + 12, wh + 12);
        const g = x.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#5a6b7c'); g.addColorStop(1, '#27313c'); x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
        x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.moveTo(wx, wy + wh); x.lineTo(wx + 26, wy); x.lineTo(wx + 40, wy); x.lineTo(wx + 14, wy + wh); x.fill();
        x.fillStyle = '#cfcac0'; x.fillRect(wx + ww / 2 - 2, wy, 4, wh);
        const lit = Math.random() < .5;
        if (lit) { y.fillStyle = Math.random() < .72 ? '#ffc76b' : '#d8ecff'; y.fillRect(wx, wy, ww, wh); y.fillStyle = '#000'; y.fillRect(wx + ww / 2 - 2, wy, 4, wh); if (Math.random() < .5) { y.fillStyle = 'rgba(0,0,0,.6)'; y.fillRect(wx, wy, ww / 2, wh * .6); } }
        if (Math.random() < .35) { x.fillStyle = '#b3aea4'; x.fillRect(bx + 12, wy + wh + 6, B - 24, 10); x.fillStyle = 'rgba(0,0,0,.35)'; for (let k = 0; k < 9; k++) x.fillRect(bx + 14 + k * 11, wy + wh - 12, 2, 18); x.fillRect(bx + 12, wy + wh - 14, B - 24, 3); }
        if (Math.random() < .3) { x.fillStyle = '#f7f7f3'; x.fillRect(wx + ww + 2, wy + 20, 20, 16); x.fillStyle = '#999'; x.fillRect(wx + ww + 5, wy + 23, 12, 10); }
      } else {
        const ww = 56, wh = 70, wx = bx + 36, wy = by + 22;
        x.fillStyle = '#d6d0c4'; x.beginPath(); x.moveTo(wx - 6, wy + wh + 6); x.lineTo(wx - 6, wy + 22); x.quadraticCurveTo(wx - 6, wy - 8, wx + ww / 2, wy - 16); x.quadraticCurveTo(wx + ww + 6, wy - 8, wx + ww + 6, wy + 22); x.lineTo(wx + ww + 6, wy + wh + 6); x.fill();
        x.fillStyle = '#2b2622'; x.beginPath(); x.moveTo(wx, wy + wh); x.lineTo(wx, wy + 22); x.quadraticCurveTo(wx, wy - 2, wx + ww / 2, wy - 8); x.quadraticCurveTo(wx + ww, wy - 2, wx + ww, wy + 22); x.lineTo(wx + ww, wy + wh); x.fill();
        const open = Math.random();
        x.fillStyle = '#7f8a74'; if (open < .4) { x.fillRect(wx, wy + 24, ww / 2 - 2, wh - 24); x.fillRect(wx + ww / 2 + 2, wy + 24, ww / 2 - 2, wh - 24); x.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 6; k++) x.fillRect(wx, wy + 28 + k * 7, ww, 2); }
        if (open >= .4 && Math.random() < .6) { y.fillStyle = Math.random() < .8 ? '#ffbf5e' : '#ffe1a8'; y.beginPath(); y.moveTo(wx, wy + wh); y.lineTo(wx, wy + 22); y.quadraticCurveTo(wx, wy - 2, wx + ww / 2, wy - 8); y.quadraticCurveTo(wx + ww, wy - 2, wx + ww, wy + 22); y.lineTo(wx + ww, wy + wh); y.fill(); }
        if (Math.random() < .45) { x.fillStyle = '#bdb6a8'; x.fillRect(bx + 20, wy + wh + 4, B - 40, 8); x.fillStyle = 'rgba(0,0,0,.35)'; for (let k = 0; k < 8; k++) x.fillRect(bx + 22 + k * 11, wy + wh - 10, 2, 14); }
      }
    }
    return { map: mkTex(c), emi: mkTex(e) };
  }
  TX.city = facade('city'); TX.old = facade('old');
  // ---- glass curtain wall ----
  {
    const S = 512; const [c, x] = mkCanvas(S, S); const [e, y] = mkCanvas(S, S);
    y.fillStyle = '#000'; y.fillRect(0, 0, S, S);
    for (let r = 0; r < 4; r++) {
      const by = r * 128;
      const g = x.createLinearGradient(0, by, 0, by + 104); g.addColorStop(0, '#e2edf5'); g.addColorStop(.5, '#9fb2c3'); g.addColorStop(1, '#6d8094'); x.fillStyle = g; x.fillRect(0, by, S, 104);
      x.fillStyle = '#d7dadf'; x.fillRect(0, by + 104, S, 24); x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(0, by + 104, S, 3);
      let run = Math.random() < .6;
      for (let q = 0; q < 8; q++) { if (Math.random() < .3) run = !run; if (run) { y.fillStyle = Math.random() < .8 ? '#dff0ff' : '#ffe2a8'; y.fillRect(q * 64, by + 4, 64, 96); } }
    }
    x.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 6; i++) { const s = Math.random() * S; x.beginPath(); x.moveTo(s, 0); x.lineTo(s + 60, 0); x.lineTo(s - 200, S); x.lineTo(s - 260, S); x.fill(); }
    x.fillStyle = '#c9ced4'; y.fillStyle = '#000'; for (let q = 0; q <= 8; q++) { x.fillRect(q * 64 - 2, 0, 4, S); y.fillRect(q * 64 - 2, 0, 4, S); }
    for (let r = 0; r < 4; r++) y.fillRect(0, r * 128 + 100, S, 28);
    TX.glass = { map: mkTex(c), emi: mkTex(e) };
  }
  // ---- asphalt road with lane markings: 8.2m x 10m ----
  function road(kind) {
    const [c, x] = mkCanvas(256, 1024);
    x.fillStyle = kind === 'old' ? '#5a5652' : kind === 'bridge' ? '#8c8a86' : kind === 'highway' ? '#3d3d40' : '#424246'; x.fillRect(0, 0, 256, 1024);
    speckle(x, 256, 1024, 9000, .22, .12, 1.4);
    for (let i = 0; i < 10; i++) { x.fillStyle = `rgba(0,0,0,${.05 + Math.random() * .08})`; x.fillRect(Math.random() * 230, Math.random() * 1000, 20 + Math.random() * 60, 40 + Math.random() * 140); }
    x.fillStyle = 'rgba(0,0,0,.14)'; for (const lx of [56, 128, 200]) x.fillRect(lx - 14, 0, 28, 1024);
    const paint = kind === 'old' ? 'rgba(240,236,220,.35)' : 'rgba(245,242,232,.92)';
    x.fillStyle = paint;
    if (kind !== 'old') { for (const lx of [92, 164]) for (let k = 0; k < 2; k++) x.fillRect(lx - 3, k * 512 + 40, 6, 256); }
    x.fillStyle = kind === 'highway' ? 'rgba(242,200,60,.9)' : paint; x.fillRect(14, 0, 5, 1024); x.fillRect(237, 0, 5, 1024);
    if (kind === 'old') { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.arc(128, 700, 22, 0, 7); x.fill(); x.strokeStyle = 'rgba(255,255,255,.1)'; x.lineWidth = 3; x.stroke(); }
    return mkTex(c);
  }
  TX.road = road('city'); TX.oldroad = road('old'); TX.bridgeRoad = road('bridge'); TX.highway = road('highway');
  // ---- stone paving 5m ----
  {
    const [c, x] = mkCanvas(256, 256); x.fillStyle = '#8b8174'; x.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 8; r++) { let px = -Math.random() * 40; while (px < 256) { const w = 30 + Math.random() * 40; const sh = 150 + Math.random() * 40 | 0; x.fillStyle = `rgb(${sh},${sh - 10},${sh - 24})`; x.fillRect(px + 2, r * 32 + 2, w - 3, 28); px += w; } }
    speckle(x, 256, 256, 3000, .15, .08, 1.5); TX.stone = mkTex(c);
  }
  // ---- ballast + sleepers: 8.2 x 5m ----
  {
    const [c, x] = mkCanvas(256, 512); x.fillStyle = '#6e6760'; x.fillRect(0, 0, 256, 512); speckle(x, 256, 512, 14000, .3, .18, 2);
    for (let k = 0; k < 8; k++) { const yy = k * 64 + 26; for (const cx of [56, 128, 200]) { x.fillStyle = '#a7a39b'; x.fillRect(cx - 41, yy, 82, 12); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(cx - 41, yy + 10, 82, 2); } }
    TX.ballast = mkTex(c);
  }
  // ---- interlocking pavers: 1m ----
  {
    const [c, x] = mkCanvas(128, 128); x.fillStyle = '#9a8f86'; x.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) { const red = (r + q) % 3 === 0; x.fillStyle = red ? '#a8665a' : '#b9b1a6'; x.fillRect(q * 32 + (r % 2) * 16 + 1, r * 32 + 1, 30, 30); }
    speckle(x, 128, 128, 800, .12, .08, 1.5); TX.pave = mkTex(c);
  }
  // ---- grass 4m ----
  {
    const [c, x] = mkCanvas(256, 256); x.fillStyle = '#5f8a3a'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) { const g = 90 + Math.random() * 70 | 0; x.fillStyle = `rgba(${g - 40},${g + 30},${g - 60},.5)`; x.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 3); }
    for (let i = 0; i < 20; i++) { x.fillStyle = 'rgba(140,110,60,.18)'; x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 18, 0, 7); x.fill(); }
    TX.grass = mkTex(c);
  }
  // ---- dry earth / rock ground ----
  {
    const [c, x] = mkCanvas(256, 256); x.fillStyle = '#9b8566'; x.fillRect(0, 0, 256, 256); speckle(x, 256, 256, 8000, .25, .15, 2);
    for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(80,110,50,.25)'; x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 14, 0, 7); x.fill(); }
    TX.earth = mkTex(c);
  }
  // ---- planks 2m ----
  {
    const [c, x] = mkCanvas(256, 256); for (let k = 0; k < 16; k++) { const s = 120 + Math.random() * 40 | 0; x.fillStyle = `rgb(${s},${s * .72 | 0},${s * .45 | 0})`; x.fillRect(0, k * 16, 256, 15); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, k * 16 + 15, 256, 1); }
    speckle(x, 256, 256, 2000, .2, .05, 1.5); TX.plank = mkTex(c);
  }
  // ---- curb stripes (black/yellow, 1m cycle) ----
  { const [c, x] = mkCanvas(64, 8); x.fillStyle = '#f0c419'; x.fillRect(0, 0, 32, 8); x.fillStyle = '#1b1b1b'; x.fillRect(32, 0, 32, 8); TX.curb = mkTex(c); }
  // ---- water ----
  {
    const [c, x] = mkCanvas(256, 256); x.fillStyle = '#7d8f9c'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i++) { x.strokeStyle = `rgba(255,255,255,${.08 + Math.random() * .18})`; x.lineWidth = 1 + Math.random() * 1.5; const px = Math.random() * 256, py = Math.random() * 256, l = 8 + Math.random() * 26; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + l / 2, py - 2, px + l, py); x.stroke(); }
    for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(20,40,60,${.1 + Math.random() * .15})`; x.lineWidth = 1.5; const px = Math.random() * 256, py = Math.random() * 256, l = 10 + Math.random() * 20; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + l / 2, py + 2, px + l, py); x.stroke(); }
    TX.water = mkTex(c);
  }
  // ---- radial light pool ----
  { const [c, x] = mkCanvas(128, 128); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); TX.radial = mkTex(c, false); }
  // ---- string bulbs ----
  {
    const [c, x] = mkCanvas(512, 32); const cols = ['#ffd27a', '#ff7a7a', '#7ad0ff', '#9dff8a', '#ffb3f0', '#ffe9a8'];
    x.strokeStyle = 'rgba(40,30,20,.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 8); x.quadraticCurveTo(256, 22, 512, 8); x.stroke();
    for (let i = 0; i < 32; i++) { const px = i * 16 + 8; const py = 8 + Math.sin(i / 31 * Math.PI) * 7 + 4; const g = x.createRadialGradient(px, py, 0, px, py, 7); g.addColorStop(0, '#fff'); g.addColorStop(.3, cols[i % cols.length]); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - 8, py - 8, 16, 16); }
    TX.bulbs = mkTex(c, false);
  }
  // ---- sky star noise not needed (shader) ----
  // ---- jaali / railing alpha ----
  {
    const [c, x] = mkCanvas(128, 64); x.clearRect(0, 0, 128, 64); x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 5); x.fillRect(0, 59, 128, 5);
    for (let i = 0; i < 8; i++) { x.fillRect(i * 16 + 6, 0, 4, 64); } for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(i * 16 + 16, 32, 6, 0, 7); x.lineWidth = 3; x.strokeStyle = '#fff'; x.stroke(); }
    TX.rail = mkTex(c, true, false);
  }
  // ---- fence mesh alpha ----
  { const [c, x] = mkCanvas(64, 64); x.strokeStyle = '#fff'; x.lineWidth = 2; for (let i = -64; i < 128; i += 12) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 64, 64); x.stroke(); x.beginPath(); x.moveTo(i + 64, 0); x.lineTo(i, 64); x.stroke(); } x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 3); TX.fence = mkTex(c, true, false); }
  buildAtlas();
  buildSkylines();
}

/* ---------- Sign atlas: 4 cols x 8 rows of 512x256 ---------- */
const ATLAS = {};
function buildAtlas() {
  const [c, x] = mkCanvas(2048, 2048);
  const cells = [];
  function cell(i, draw) { const col = i % 4, row = Math.floor(i / 4); x.save(); x.translate(col * 512, row * 256); x.beginPath(); x.rect(0, 0, 512, 256); x.clip(); draw(x); x.restore(); }
  function shop(i, en, te, bg, fg, sub) {
    cell(i, x => {
      x.fillStyle = bg; x.fillRect(0, 0, 512, 256); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(0, 0, 512, 16); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 240, 512, 16);
      x.strokeStyle = fg; x.lineWidth = 6; x.strokeRect(14, 14, 484, 228);
      x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
      if (te) { x.font = `700 58px ${FONT_TE}`; x.fillText(te, 256, 88); x.font = `700 64px ${FONT_LAT}`; x.fillText(en, 256, 176); }
      else { x.font = `700 76px ${FONT_LAT}`; x.fillText(en, 256, sub ? 104 : 132); if (sub) { x.font = `500 38px ${FONT_LAT}`; x.fillText(sub, 256, 186); } }
    });
  }
  shop(0, 'BANGLES', 'గాజులు', '#7a1f4a', '#ffd966');
  shop(1, 'PEARLS', 'ముత్యాలు', '#0f3b5f', '#f4efe6');
  shop(2, 'IRANI CHAI', 'ఇరానీ చాయ్', '#1d5a3a', '#ffe9a8');
  shop(3, 'BIRYANI', 'బిర్యానీ', '#8a2a12', '#ffd27a');
  shop(4, 'SWEETS', 'మిఠాయిలు', '#c2185b', '#fff4c2');
  shop(5, 'ATTAR', null, '#3b2466', '#f7d98f', 'Perfumes since 1938');
  shop(6, 'TAILOR', null, '#274060', '#ffffff', 'Sherwani · Kurta');
  shop(7, 'MOBILE', null, '#e9b949', '#1b1206', 'Repairs & Recharge');
  shop(8, 'CLOTH', null, '#6b2d2d', '#ffe3b3', 'Emporium');
  shop(9, 'HOTEL', null, '#12354a', '#9ff0ff', 'Deccan Darbar');
  shop(10, 'HALEEM', 'హలీం', '#5b1c0c', '#ffcc66');
  shop(11, 'BOOK HOUSE', null, '#2c4a2a', '#f4efe6', 'Abids Sunday Market');
  const ad = (i, a, b, bg, fg, acc) => cell(i, x => {
    const g = x.createLinearGradient(0, 0, 512, 256); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    x.fillStyle = acc; x.beginPath(); x.arc(440, 60, 120, 0, 7); x.globalAlpha = .25; x.fill(); x.globalAlpha = 1;
    x.fillStyle = fg; x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.font = `800 70px ${FONT_NUM}`; x.fillText(a, 32, 118); x.font = `600 34px ${FONT_LAT}`; x.fillStyle = acc; x.fillText(b, 34, 180);
    x.fillStyle = fg; x.fillRect(34, 206, 90, 6);
  });
  ad(12, "NAWAB'S KITCHEN", 'Dum biryani · open till 2 AM', ['#3a0f0a', '#8a2a12'], '#fff4e0', '#ffc15e');
  ad(13, 'DECCAN PEARLS', 'Jewellers · Pathergatti', ['#0b2240', '#1f4d7a'], '#f4efe6', '#f7d98f');
  ad(14, 'IRANI CHAI', '& Osmania biscuits · ₹20', ['#1d3a2a', '#3f6b3a'], '#fff8e6', '#ffe08a');
  ad(15, 'CODEBAY PARK', 'Now hiring 2,000 engineers', ['#0b1030', '#2c2f7a'], '#e8f1ff', '#39d0ff');
  ad(16, 'LAKEVIEW HOMES', '2 & 3 BHK · Kokapet', ['#10323a', '#1d6b73'], '#eafcff', '#ffd27a');
  ad(17, 'MONSOON SALE', 'Begum Bazaar · 40% off', ['#401040', '#8a1f6b'], '#fff0fa', '#ffd966');
  ad(18, 'TAP & RIDE', 'Metro smart card top-up', ['#2a0b0b', '#b21d17'], '#ffffff', '#ffd1cc');
  ad(19, 'BANGLE FEST', 'Laad Bazaar · this weekend', ['#3a0b2a', '#a3185e'], '#fff', '#ffd966');
  const neon = (i, t, col) => cell(i, x => { x.fillStyle = '#07080f'; x.fillRect(0, 0, 512, 256); x.shadowColor = col; x.shadowBlur = 26; x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 92px ${FONT_NUM}`; x.fillText(t, 256, 128); x.shadowBlur = 0; x.fillStyle = '#fff'; x.globalAlpha = .7; x.font = `800 92px ${FONT_NUM}`; x.fillText(t, 256, 128); x.globalAlpha = 1; });
  neon(20, 'NIMBUSSOFT', '#39d0ff'); neon(21, 'QUANTA LABS', '#ff4fd8'); neon(22, 'DECCAN DATA', '#4fff9a'); neon(23, 'PIXELFORGE', '#ffb13b');
  const led = (i, a, b) => cell(i, x => { x.fillStyle = '#0a0a0a'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#ff9a1f'; x.textBaseline = 'middle'; x.font = `800 120px ${FONT_NUM}`; x.textAlign = 'left'; x.fillText(a, 24, 132); x.font = `700 70px ${FONT_NUM}`; x.fillText(b, 190, 132); x.fillStyle = 'rgba(0,0,0,.35)'; for (let k = 0; k < 256; k += 6) x.fillRect(0, k, 512, 2); for (let k = 0; k < 512; k += 6) x.fillRect(k, 0, 2, 256); });
  led(24, '5K', 'SECUNDERABAD'); led(25, '10H', 'KONDAPUR');
  cell(26, x => { x.fillStyle = '#f2c230'; x.fillRect(0, 0, 512, 256); const cs = ['#e2231a', '#1a74d1', '#2aa34a', '#6d3fd6']; for (let k = 0; k < 16; k++) { x.fillStyle = cs[k % 4]; x.beginPath(); x.moveTo(k * 32, 0); x.lineTo(k * 32 + 16, 26); x.lineTo(k * 32 + 32, 0); x.fill(); x.beginPath(); x.moveTo(k * 32, 256); x.lineTo(k * 32 + 16, 230); x.lineTo(k * 32 + 32, 256); x.fill(); } x.fillStyle = '#b3160f'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 74px ${FONT_NUM}`; x.fillText('HORN OK', 256, 100); x.fillStyle = '#1a3f8a'; x.fillText('PLEASE', 256, 172); });
  cell(27, x => { x.fillStyle = '#10204a'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 150px ${FONT_NUM}`; x.fillText('PF 1', 256, 132); });
  cell(28, x => { x.fillStyle = '#b3160f'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 76px ${FONT_NUM}`; x.fillText('SECURITY CHECK', 256, 100); x.font = `600 44px ${FONT_LAT}`; x.fillText('Slow down · తగ్గించండి', 256, 180); });
  cell(29, x => { x.fillStyle = '#f2c230'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#111'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 84px ${FONT_NUM}`; x.fillText('MEN AT WORK', 256, 104); x.font = `600 44px ${FONT_LAT}`; x.fillText('Metro works ahead', 256, 184); });
  cell(30, x => { x.fillStyle = '#1f4a22'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#ffe9a8'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 80px ${FONT_NUM}`; x.fillText('LION SAFARI →', 256, 100); x.font = `600 40px ${FONT_LAT}`; x.fillText('Please stay behind the fence', 256, 182); });
  cell(31, x => { x.fillStyle = '#0b1030'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#39d0ff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 72px ${FONT_NUM}`; x.fillText('HITEC CITY', 256, 96); x.fillStyle = '#e8f1ff'; x.font = `600 44px ${FONT_TE}`; x.fillText('హైటెక్ సిటీ', 256, 180); });
  TX.atlas = mkTex(c, false);
}
function atlasUV(i) { const col = i % 4, row = Math.floor(i / 4); return [0.25, 0.125, col * 0.25, 1 - (row + 1) * 0.125]; }

/* ---------- Road signs (green gantries), station boards ---------- */
const SIGNCACHE = new Map();
function signTexture(lines, style = 'green') {
  const key = style + '|' + JSON.stringify(lines); if (SIGNCACHE.has(key)) return SIGNCACHE.get(key);
  const W = 1024, H = style === 'station' ? 256 : 320; const [c, x] = mkCanvas(W, H);
  if (style === 'station') {
    x.fillStyle = '#f7d117'; x.fillRect(0, 0, W, H); x.strokeStyle = '#111'; x.lineWidth = 12; x.strokeRect(10, 10, W - 20, H - 20);
    x.fillStyle = '#111'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 74px ${FONT_TE}`; x.fillText(lines[0], W / 2, 86); x.font = `800 84px ${FONT_NUM}`; x.fillText(lines[1], W / 2, 184);
  } else if (style === 'welcome') {
    x.fillStyle = '#0b5d34'; x.fillRect(0, 0, W, H); x.strokeStyle = '#fff'; x.lineWidth = 8; x.strokeRect(14, 14, W - 28, H - 28);
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `600 40px ${FONT_LAT}`; x.fillText(lines[0], W / 2, 62);
    x.font = `700 64px ${FONT_TE}`; x.fillText(lines[1], W / 2, 142); x.font = `800 80px ${FONT_NUM}`; x.fillText(lines[2].toUpperCase(), W / 2, 238);
  } else {
    x.fillStyle = '#0b5d34'; x.fillRect(0, 0, W, H); x.strokeStyle = '#fff'; x.lineWidth = 8; x.strokeRect(14, 14, W - 28, H - 28);
    const n = lines.length; const rowH = (H - 40) / n;
    lines.forEach((l, i) => {
      const cy = 20 + rowH * i + rowH / 2; x.fillStyle = '#fff'; x.textBaseline = 'middle';
      x.font = `800 ${Math.min(60, rowH * .6)}px ${FONT_NUM}`; x.textAlign = 'left'; x.fillText(l.arrow || '↑', 40, cy);
      x.font = `700 ${Math.min(50, rowH * .5)}px ${FONT_LAT}`; x.fillText(l.en, 110, cy - (l.te ? rowH * .16 : 0));
      if (l.te) { x.font = `500 ${Math.min(34, rowH * .34)}px ${FONT_TE}`; x.fillStyle = '#d9f5e5'; x.fillText(l.te, 110, cy + rowH * .26); }
      x.fillStyle = '#fff'; x.textAlign = 'right'; x.font = `700 ${Math.min(52, rowH * .5)}px ${FONT_NUM}`; x.fillText(l.km, W - 40, cy);
      if (i < n - 1) { x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(30, 20 + rowH * (i + 1) - 1, W - 60, 2); }
    });
  }
  const t = mkTex(c, false); t.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.05, roughness: .6 });
  NIGHTMATS.push([m, .05, .7]);
  SIGNCACHE.set(key, m); return m;
}

/* ---------- Skyline backdrops ---------- */
function buildSkylines() {
  function sky(kind) {
    const W = 2048, H = 256; const [c, x] = mkCanvas(W, H); const [e, y] = mkCanvas(W, H);
    x.fillStyle = '#fff'; y.fillStyle = '#000'; y.fillRect(0, 0, W, H);
    let px = 0; const r = Math.random;
    if (kind === 'hills') {
      x.beginPath(); x.moveTo(0, H); for (let i = 0; i <= 64; i++) { const t = i / 64; x.lineTo(t * W, H - 60 - 50 * Math.sin(t * 9.4 + 1) - 30 * Math.sin(t * 23) - 20 * r()); } x.lineTo(W, H); x.fill();
      for (let i = 0; i < 40; i++) { const bx = r() * W, bs = 8 + r() * 22; x.beginPath(); x.ellipse(bx, H - 110 - r() * 40, bs * 1.3, bs, 0, 0, 7); x.fill(); }
      for (let i = 0; i < 60; i++) { y.fillStyle = 'rgba(255,200,120,.7)'; y.fillRect(r() * W, H - 20 - r() * 30, 2, 2); }
    } else {
      while (px < W) {
        const tech = kind === 'tech'; const w = tech ? 30 + r() * 60 : 18 + r() * 50; const h = tech ? 60 + r() * 170 : 25 + r() * (kind === 'old' ? 60 : 110);
        x.fillRect(px, H - h, w, h);
        if (kind === 'old' && r() < .12) { x.beginPath(); x.arc(px + w / 2, H - h, w * .4, Math.PI, 0); x.fill(); }
        if (kind === 'old' && r() < .08) { x.fillRect(px + w / 2 - 3, H - h - 60, 6, 60); x.beginPath(); x.arc(px + w / 2, H - h - 60, 7, 0, 7); x.fill(); }
        if (!tech && r() < .3) { x.fillRect(px + 4, H - h - 8, 10, 8); }
        if (tech && r() < .25) { x.fillRect(px + w / 2 - 1, H - h - 30, 2, 30); }
        for (let yy = H - h + 6; yy < H - 4; yy += 7) for (let xx = px + 3; xx < px + w - 3; xx += 6) if (r() < (tech ? .35 : .22)) { y.fillStyle = r() < .7 ? '#ffd28a' : '#d8ecff'; y.fillRect(xx, yy, 3, 3); }
        px += w + (r() < .3 ? r() * 20 : 0);
      }
      if (kind === 'tech') { for (let i = 0; i < 3; i++) { const cx = r() * W; x.fillRect(cx, H - 200, 4, 200); x.fillRect(cx - 60, H - 196, 110, 4); } }
    }
    return { map: mkTex(c, true, true), emi: mkTex(e, true, true) };
  }
  TX.skyCity = sky('city'); TX.skyOld = sky('old'); TX.skyTech = sky('tech'); TX.skyHills = sky('hills');
}

/* ---------- Materials ---------- */
const MAT = {}; const NIGHTMATS = []; // [material, dayEmissive, nightEmissive]
function buildMaterials() {
  const std = o => new THREE.MeshStandardMaterial(o);
  MAT.paint = std({ vertexColors: true, roughness: .85, metalness: 0 });
  MAT.shiny = std({ vertexColors: true, roughness: .32, metalness: .35 });
  MAT.metal = std({ vertexColors: true, roughness: .4, metalness: .7 });
  MAT.lmk = std({ vertexColors: true, roughness: .8, metalness: 0, emissive: new THREE.Color(0xffb85c), emissiveIntensity: 0 });
  NIGHTMATS.push([MAT.lmk, 0, .32]);
  MAT.bronze = std({ vertexColors: true, roughness: .45, metalness: .6, emissive: new THREE.Color(0xffa040), emissiveIntensity: 0 });
  NIGHTMATS.push([MAT.bronze, 0, .18]);
  MAT.facade = std({ vertexColors: true, map: TX.city.map, emissiveMap: TX.city.emi, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0, roughness: .85 });
  MAT.old = std({ vertexColors: true, map: TX.old.map, emissiveMap: TX.old.emi, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0, roughness: .9 });
  MAT.glass = std({ vertexColors: true, map: TX.glass.map, emissiveMap: TX.glass.emi, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0, roughness: .28, metalness: .25 });
  NIGHTMATS.push([MAT.facade, 0, 1.2], [MAT.old, 0, 1.3], [MAT.glass, 0.02, 1.4]);
  MAT.lamp = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  MAT.neon = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  MAT.cable = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const flat = (t, rep, rough = .9, extra = {}) => { const m = std(Object.assign({ map: t, roughness: rough }, extra)); return m; };
  MAT.road = flat(TX.road); MAT.oldroad = flat(TX.oldroad); MAT.bridgeRoad = flat(TX.bridgeRoad); MAT.highway = flat(TX.highway);
  MAT.stone = flat(TX.stone); MAT.ballast = flat(TX.ballast); MAT.pave = flat(TX.pave); MAT.grass = flat(TX.grass, null, 1);
  MAT.earth = flat(TX.earth, null, 1); MAT.plank = flat(TX.plank); MAT.curb = flat(TX.curb, null, .7);
  MAT.water = std({ map: TX.water, color: 0x7d93a3, roughness: .12, metalness: .2, emissive: new THREE.Color(0x335577), emissiveIntensity: .6, transparent: true, opacity: .96 });
  MAT.pool = new THREE.MeshBasicMaterial({ map: TX.radial, color: 0xffc070, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  MAT.bulbs = new THREE.MeshBasicMaterial({ map: TX.bulbs, transparent: true, opacity: .8, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  MAT.signs = std({ map: TX.atlas, emissiveMap: TX.atlas, emissive: new THREE.Color(0xffffff), emissiveIntensity: .1, roughness: .6 });
  NIGHTMATS.push([MAT.signs, .12, .85]);
  MAT.rail = std({ vertexColors: true, alphaMap: TX.rail, transparent: true, alphaTest: .5, side: THREE.DoubleSide, roughness: .6, metalness: .3 });
  MAT.fence = std({ vertexColors: true, alphaMap: TX.fence, transparent: true, alphaTest: .4, side: THREE.DoubleSide, roughness: .7 });
  MAT.leaf = std({ vertexColors: true, roughness: .95, flatShading: true });
  MAT.rock = std({ vertexColors: true, roughness: 1, flatShading: true });
}

/* ---------- Geometry primitives (non-indexed, unit sized) ---------- */
const GP = {};
function prep(g) { const n = g.index ? g.toNonIndexed() : g; if (!n.attributes.uv) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); if (!n.attributes.normal) n.computeVertexNormals(); return n; }
function buildPrims() {
  GP.box = prep(new THREE.BoxGeometry(1, 1, 1));
  GP.cyl6 = prep(new THREE.CylinderGeometry(.5, .5, 1, 6)); GP.cyl8 = prep(new THREE.CylinderGeometry(.5, .5, 1, 8));
  GP.cyl12 = prep(new THREE.CylinderGeometry(.5, .5, 1, 12)); GP.cyl16 = prep(new THREE.CylinderGeometry(.5, .5, 1, 16)); GP.cyl24 = prep(new THREE.CylinderGeometry(.5, .5, 1, 24));
  GP.cone4 = prep(new THREE.ConeGeometry(.5, 1, 4)); GP.cone6 = prep(new THREE.ConeGeometry(.5, 1, 6)); GP.cone8 = prep(new THREE.ConeGeometry(.5, 1, 8)); GP.cone12 = prep(new THREE.ConeGeometry(.5, 1, 12));
  GP.sph = prep(new THREE.SphereGeometry(.5, 12, 8)); GP.sphLo = prep(new THREE.SphereGeometry(.5, 8, 5));
  GP.hemi = prep(new THREE.SphereGeometry(.5, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2));
  GP.plane = prep(new THREE.PlaneGeometry(1, 1));
  GP.ground = prep(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  GP.ico = prep(new THREE.IcosahedronGeometry(.5, 0)); GP.ico1 = prep(new THREE.IcosahedronGeometry(.5, 1)); GP.dodeca = prep(new THREE.DodecahedronGeometry(.5, 0));
  GP.torus = prep(new THREE.TorusGeometry(.5, .1, 6, 16)); GP.wheel = prep(new THREE.CylinderGeometry(.5, .5, 1, 12).rotateZ(Math.PI / 2));
  GP.circle = prep(new THREE.CircleGeometry(.5, 20));
  // onion dome (Qutb Shahi / Charminar style)
  const onion = []; for (let i = 0; i <= 16; i++) { const t = i / 16; let r; if (t < .4) r = .36 + .14 * Math.sin(t / .4 * Math.PI / 2); else { const u = (t - .4) / .6; r = .5 * Math.pow(Math.cos(u * Math.PI / 2), 1.6); } onion.push(new THREE.Vector2(Math.max(.001, r), t)); }
  GP.onion = prep(new THREE.LatheGeometry(onion, 16));
  const bulb = []; for (let i = 0; i <= 12; i++) { const t = i / 12; const r = t < .15 ? .5 : .5 * Math.pow(Math.cos((t - .15) / .85 * Math.PI / 2), .9); bulb.push(new THREE.Vector2(Math.max(.001, r), t)); }
  GP.dome = prep(new THREE.LatheGeometry(bulb, 18));
  // shikhara (temple tower)
  const sh = []; for (let i = 0; i <= 12; i++) { const t = i / 12; sh.push(new THREE.Vector2(Math.max(.02, .5 * Math.cos(t * Math.PI / 2 * .95) * (1 - t * .15)), t)); }
  GP.shikhara = prep(new THREE.LatheGeometry(sh, 12));
}
const TAPER = new Map();
function taper(ratio, seg = 12) { const k = ratio.toFixed(2) + '|' + seg; let g = TAPER.get(k); if (!g) { g = prep(new THREE.CylinderGeometry(.5 * ratio, .5, 1, seg)); TAPER.set(k, g); } return g; }
const SHAPEC = new Map();
function archWall(w, h, aw, ah, depth, key) {
  const k = key || [w, h, aw, ah, depth].join(','); let g = SHAPEC.get(k); if (g) return g;
  const s = new THREE.Shape(); const sh = Math.max(0.1, ah - aw * .62);
  s.moveTo(-w / 2, 0); s.lineTo(-aw / 2, 0); s.lineTo(-aw / 2, sh);
  s.quadraticCurveTo(-aw / 2, sh + (ah - sh) * .78, 0, ah); s.quadraticCurveTo(aw / 2, sh + (ah - sh) * .78, aw / 2, sh);
  s.lineTo(aw / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 }); geo.translate(0, 0, -depth / 2);
  g = prep(geo); SHAPEC.set(k, g); return g;
}
function archPanel() { // pointed arch shape (unit: width 1, height 1)
  let g = SHAPEC.get('archPanel'); if (g) return g;
  const s = new THREE.Shape(); s.moveTo(-.5, 0); s.lineTo(-.5, .55); s.quadraticCurveTo(-.5, .88, 0, 1); s.quadraticCurveTo(.5, .88, .5, .55); s.lineTo(.5, 0); s.lineTo(-.5, 0);
  g = prep(new THREE.ShapeGeometry(s, 8)); SHAPEC.set('archPanel', g); return g;
}
function starGeo() {
  let g = SHAPEC.get('star'); if (g) return g; const s = new THREE.Shape();
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + Math.PI / 2; const r = i % 2 ? .22 : .5; const px = Math.cos(a) * r, py = Math.sin(a) * r; i ? s.lineTo(px, py) : s.moveTo(px, py); }
  const geo = new THREE.ExtrudeGeometry(s, { depth: .12, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 1 }); geo.translate(0, 0, -.06);
  g = prep(geo); SHAPEC.set('star', g); return g;
}

/* ---------- Batch: collect parts and merge per material ---------- */
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _vp = new THREE.Vector3(), _vs = new THREE.Vector3(), _nm3 = new THREE.Matrix3();
class Batch {
  constructor() { this.g = {}; this.tx = null; }
  push(key, geo, m, col, extra) { (this.g[key] || (this.g[key] = [])).push({ g: geo, m, c: typeof col === 'string' ? C(col) : col, x: extra }); }
  add(key, geo, x, y, z, sx, sy, sz, col, rx = 0, ry = 0, rz = 0, extra) {
    if (typeof geo === 'string') geo = GP[geo];
    _m4.compose(_vp.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _vs.set(sx, sy, sz));
    const m = _m4.clone(); if (this.tx) m.premultiply(this.tx);
    this.push(key, geo, m, col, extra);
  }
  box(key, x, y, z, sx, sy, sz, col, ry = 0, extra) { this.add(key, 'box', x, y, z, sx, sy, sz, col, 0, ry, 0, extra); }
  facade(key, x, y, z, w, h, d, col, bay = 3.2, floor = 3.3, ry = 0) {
    const uo = Math.floor(Math.random() * 4) * .25;
    this.add(key, 'box', x, y + h / 2, z, w, h, d, col, 0, ry, 0, { fac: { w, h, d, bw: bay * 4, fh: floor * 4, uo, vo: 0 } });
  }
  uv(key, geo, x, y, z, sx, sy, sz, col, su, sv, uo = 0, vo = 0, rx = 0, ry = 0, rz = 0) { this.add(key, geo, x, y, z, sx, sy, sz, col, rx, ry, rz, { uvs: [su, sv, uo, vo] }); }
  // push a transform so builders can work in local space
  withTx(x, y, z, ry, s, fn) { const prev = this.tx; const t = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s)); this.tx = prev ? prev.clone().multiply(t) : t; fn(); this.tx = prev; }
  geometries() { const out = {}; for (const k in this.g) out[k] = mergeParts(this.g[k]); return out; }
  build(shadow = false, recv = true) { const grp = new THREE.Group(); const geos = this.geometries(); for (const k in geos) { const mesh = new THREE.Mesh(geos[k], MAT[k]); mesh.matrixAutoUpdate = false; mesh.updateMatrix(); if (shadow && !NOSHADOW.has(k)) mesh.castShadow = true; if (recv && !NOSHADOW.has(k)) mesh.receiveShadow = true; grp.add(mesh); } return grp; }
}
const NOSHADOW = new Set(['lamp', 'neon', 'pool', 'bulbs', 'water', 'cable', 'signs']);
function mergeParts(parts) {
  let n = 0; for (const p of parts) n += p.g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
  let o = 0;
  for (const p of parts) {
    const g = p.g, P = g.attributes.position.array, N = g.attributes.normal.array, U = g.attributes.uv ? g.attributes.uv.array : null, cnt = g.attributes.position.count, m = p.m.elements;
    _nm3.getNormalMatrix(p.m); const q = _nm3.elements; const cr = p.c.r, cg = p.c.g, cb = p.c.b; const x = p.x;
    const fac = x && x.fac, uvs = x && x.uvs;
    for (let i = 0; i < cnt; i++) {
      const i3 = i * 3, j = (o + i) * 3, px = P[i3], py = P[i3 + 1], pz = P[i3 + 2];
      pos[j] = m[0] * px + m[4] * py + m[8] * pz + m[12]; pos[j + 1] = m[1] * px + m[5] * py + m[9] * pz + m[13]; pos[j + 2] = m[2] * px + m[6] * py + m[10] * pz + m[14];
      const nx = N[i3], ny = N[i3 + 1], nz = N[i3 + 2];
      const a = q[0] * nx + q[3] * ny + q[6] * nz, b = q[1] * nx + q[4] * ny + q[7] * nz, c = q[2] * nx + q[5] * ny + q[8] * nz; const l = Math.sqrt(a * a + b * b + c * c) || 1;
      nor[j] = a / l; nor[j + 1] = b / l; nor[j + 2] = c / l;
      col[j] = cr; col[j + 1] = cg; col[j + 2] = cb;
      let u = U ? U[i * 2] : 0, v = U ? U[i * 2 + 1] : 0;
      if (fac) { const f = (i / 6) | 0; if (f === 2 || f === 3) { u = .02; v = .02; } else { const fw = f < 2 ? fac.d : fac.w; u = u * fw / fac.bw + fac.uo; v = v * fac.h / fac.fh + fac.vo; } }
      else if (uvs) { u = u * uvs[0] + uvs[2]; v = v * uvs[1] + uvs[3]; }
      const k = (o + i) * 2; uv[k] = u; uv[k + 1] = v;
    }
    o += cnt;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeBoundingSphere(); return geo;
}
/* Cached model: build once, instance many times */
const MODELS = {};
function defModel(name, fn, shadow = true) { MODELS[name] = { fn, shadow, geos: null }; }
function inst(name) {
  const M = MODELS[name]; if (!M.geos) { const b = new Batch(); M.fn(b); M.geos = b.geometries(); for (const k in M.geos) M.geos[k].userData.shared = true; }
  const g = new THREE.Group(); for (const k in M.geos) { const mesh = new THREE.Mesh(M.geos[k], MAT[k]); if (M.shadow && !NOSHADOW.has(k)) mesh.castShadow = true; g.add(mesh); } return g;
}
