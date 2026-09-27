/* =========================================================
   Props: people, trees, street furniture, vehicles, obstacles
   ========================================================= */
const SKINS = ['#e2b594', '#c9966f', '#b07a55', '#9c6b4b', '#7e5236', '#5e3b26'];
const CLOTHES = ['#2f7fd1', '#e0527a', '#12a38c', '#6d3fd6', '#e9b949', '#f26b38', '#c2185b', '#efe3c5', '#2a3550', '#f4efe6', '#3b8f3a', '#8a2a12', '#1d1d1d', '#9aa4b1'];
const PASTELS = ['#f1d9a6', '#e8b8b0', '#a9d8cf', '#f3e7c9', '#cfe0a8', '#e6c3e0', '#f6f0e4', '#bcd3ef', '#f0c890', '#d9d0c4', '#f5b99a', '#c7e3c0'];
const URBAN = ['#ebe6dc', '#d9d2c5', '#c9c3b8', '#efe9d8', '#d6cfc0', '#e7dcc9', '#bfc5c9', '#dcd8cf', '#f2eadb', '#cdb9a3'];
const GLASSC = ['#9fc3e6', '#7fa7c9', '#a6d4d2', '#b9c4cf', '#86b7a8', '#c9d7e6', '#8fa0c9'];

function person(b, x, z, ry = 0, o = {}) {
  const r = Math.random; const f = o.g ? o.g === 'f' : r() < .45;
  const skin = o.skin || pick(SKINS); const top = o.top || pick(CLOTHES); const bot = o.bot || pick(['#2b3552', '#1d1d1d', '#5a4a3a', '#efe3c5', '#3a3f58', '#2a2a2a']);
  const hair = o.hair || (r() < .85 ? '#15100d' : '#6b6b6b'); const h = o.h || rr(.93, 1.07);
  const walk = o.walk ? .35 : 0; const long = f && (o.saree !== undefined ? o.saree : r() < .55);
  b.withTx(x, 0, z, ry, h, () => {
    if (long) { b.add('paint', taper(.62, 8), 0, .5, 0, .56, 1.0, .46, top); b.box('paint', 0, 1.0, .03, .06, .5, .02, pick(['#e9b949', '#c2185b', '#12a38c'])); }
    else { b.add('paint', 'box', -.1, .43, 0, .15, .86, .17, bot, walk, 0, 0); b.add('paint', 'box', .1, .43, 0, .15, .86, .17, bot, -walk, 0, 0); }
    b.box('paint', -.1, .04, .04, .15, .08, .26, '#1b1b1b'); b.box('paint', .1, .04, .04, .15, .08, .26, '#1b1b1b');
    b.box('paint', 0, 1.1, 0, .4, .56, .22, top);
    b.add('paint', 'box', -.26, 1.07, 0, .1, .56, .12, o.sleeve || top, -walk, 0, .08); b.add('paint', 'box', .26, 1.07, 0, .1, .56, .12, o.sleeve || top, walk, 0, -.08);
    b.box('paint', 0, 1.43, 0, .1, .1, .1, skin);
    b.add('paint', 'sph', 0, 1.56, 0, .23, .26, .23, skin);
    if (o.helmet) b.add('shiny', 'hemi', 0, 1.6, 0, .3, .3, .3, o.helmet);
    else if (o.cap) b.add('paint', 'cyl12', 0, 1.7, 0, .24, .1, .24, o.cap);
    else { b.add('paint', 'hemi', 0, 1.58, -.01, .25, .22, .25, hair); if (f) b.box('paint', 0, 1.4, -.1, .22, .36, .06, hair); }
    if (o.bag) b.box('paint', 0, 1.12, -.17, .3, .4, .14, o.bag);
    if (o.dupatta) b.add('paint', 'box', .02, 1.15, .05, .5, .06, .3, o.dupatta, 0, 0, .7);
  });
}
function crowd(b, x0, z0, n, spread, opts = {}) { for (let i = 0; i < n; i++) person(b, x0 + rr(-spread, spread), z0 + rr(-spread, spread), rr(0, 6.28), opts); }

/* ---- trees ---- */
function treeRound(b, x, z, s = 1, leaf) {
  const L = leaf || pick(['#4f7d2e', '#3f6f2a', '#5c8a34', '#466b28']);
  b.add('paint', taper(.7, 7), x, 1.6 * s, z, .42 * s, 3.2 * s, .42 * s, '#5a4330');
  b.add('leaf', 'ico1', x, 4.0 * s, z, 3.6 * s, 3.0 * s, 3.6 * s, L);
  b.add('leaf', 'ico1', x + .9 * s, 4.8 * s, z + .4 * s, 2.6 * s, 2.2 * s, 2.6 * s, L);
  b.add('leaf', 'ico1', x - .8 * s, 4.6 * s, z - .5 * s, 2.4 * s, 2.0 * s, 2.4 * s, L);
}
function treeGulmohar(b, x, z, s = 1) {
  b.add('paint', taper(.6, 7), x, 1.5 * s, z, .45 * s, 3 * s, .45 * s, '#5b4632');
  b.add('leaf', 'ico1', x, 3.6 * s, z, 6.2 * s, 2.0 * s, 6.2 * s, '#3f6f2a');
  b.add('leaf', 'ico1', x + .6 * s, 4.1 * s, z - .4 * s, 4.6 * s, 1.6 * s, 4.6 * s, '#e0472a');
  b.add('leaf', 'ico', x - 1.3 * s, 3.9 * s, z + .8 * s, 2.4 * s, 1.1 * s, 2.4 * s, '#f06a2a');
}
function treePalm(b, x, z, s = 1, tall = false) {
  const H = (tall ? 10 : 6.5) * s; const segs = 5; let px = x, pz = z; const lean = rr(-.25, .25), lz = rr(-.25, .25);
  for (let i = 0; i < segs; i++) { const y0 = i * H / segs; b.add('paint', 'cyl6', px + lean * i * .3, y0 + H / segs / 2, pz + lz * i * .3, .34 * s, H / segs + .05, .34 * s, i % 2 ? '#6b5a44' : '#7a674e'); }
  const cx = px + lean * segs * .3, cz = pz + lz * segs * .3;
  if (tall) { // toddy palm: dense fan crown
    b.add('leaf', 'ico', cx, H + .3, cz, 1.8 * s, 1.4 * s, 1.8 * s, '#2f5a26');
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; b.add('leaf', 'box', cx + Math.sin(a) * 1.1 * s, H + .4 + Math.cos(i * 1.7) * .4, cz + Math.cos(a) * 1.1 * s, .9 * s, .9 * s, .06, '#3a6a2c', rr(-.4, .4), a, 0); }
  } else {
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + rr(-.2, .2); b.add('leaf', 'box', cx + Math.sin(a) * 1.35 * s, H - .25, cz + Math.cos(a) * 1.35 * s, .5 * s, .06, 3 * s, '#4c7d2c', .45, a, 0); }
    b.add('paint', 'sph', cx, H, cz, .55 * s, .45 * s, .55 * s, '#6b5a36');
  }
}
function treeBanyan(b, x, z, s = 1) {
  b.add('paint', taper(.7, 8), x, 2 * s, z, 1.4 * s, 4 * s, 1.4 * s, '#5d4c3b');
  b.add('leaf', 'ico1', x, 6 * s, z, 11 * s, 4.4 * s, 11 * s, '#3c6526'); b.add('leaf', 'ico1', x + 2.5 * s, 7 * s, z - 1 * s, 7 * s, 3.4 * s, 7 * s, '#46712c');
  for (let i = 0; i < 7; i++) { const a = rr(0, 6.28), d = rr(1.5, 4.5) * s; b.add('paint', 'cyl6', x + Math.sin(a) * d, 2.2 * s, z + Math.cos(a) * d, .1 * s, 4.4 * s, .1 * s, '#6d5b48'); }
}
function treeCypress(b, x, z, s = 1) { b.box('paint', x, .6 * s, z, .25 * s, 1.2 * s, .25 * s, '#5a4330'); b.add('leaf', 'cone8', x, 4 * s, z, 1.8 * s, 7 * s, 1.8 * s, '#2f5724'); }
function bush(b, x, z, s = 1, c) { b.add('leaf', 'ico', x, .45 * s, z, 1.6 * s, 1.0 * s, 1.4 * s, c || pick(['#4d7a2d', '#5b8a33', '#3f6a27'])); }
function rockPile(b, x, z, s = 1) {
  const c = pick(['#8d8378', '#9a8f82', '#7f776d', '#a39889']);
  b.add('rock', 'dodeca', x, 1.2 * s, z, 3.2 * s, 2.6 * s, 3 * s, c, rr(0, 3), rr(0, 3), 0);
  if (Math.random() < .7) b.add('rock', 'dodeca', x + rr(-1, 1) * s, 3.1 * s, z + rr(-.6, .6) * s, 2.2 * s, 1.8 * s, 2 * s, c, rr(0, 3), rr(0, 3), 0);
  if (Math.random() < .5) b.add('rock', 'dodeca', x + 2.2 * s, .8 * s, z + 1 * s, 1.8 * s, 1.6 * s, 1.6 * s, c, rr(0, 3), rr(0, 3), 0);
}

/* ---- street furniture ---- */
function streetLight(b, x, z, side, h = 8.5, arm = 2.2) {
  b.add('metal', 'cyl8', x, h / 2, z, .16, h, .16, '#6f7479');
  b.box('metal', x - side * arm / 2, h - .1, z, arm, .1, .12, '#6f7479');
  b.box('lamp', x - side * arm, h - .22, z, .6, .14, .32, '#fff1c9');
  b.add('pool', 'ground', x - side * (arm + .2), .04, z, 9, 1, 9, '#ffffff');
}
function doubleLight(b, x, z, h = 9) {
  b.add('metal', 'cyl8', x, h / 2, z, .18, h, .18, '#6f7479');
  for (const s of [-1, 1]) { b.box('metal', x + s * 1.1, h - .1, z, 2.2, .1, .12, '#6f7479'); b.box('lamp', x + s * 2.2, h - .22, z, .6, .14, .32, '#fff1c9'); b.add('pool', 'ground', x + s * 2.4, .04, z, 9, 1, 9, '#fff'); }
}
function billboard(b, x, z, side, cell, h = 6, w = 7) {
  const ry = -side * .5;
  b.add('metal', 'cyl8', x - Math.cos(ry) * w * .3, h / 2, z + Math.sin(ry) * w * .3, .25, h, .25, '#555a60');
  b.add('metal', 'cyl8', x + Math.cos(ry) * w * .3, h / 2, z - Math.sin(ry) * w * .3, .25, h, .25, '#555a60');
  b.add('paint', 'box', x, h + w * .25, z, w + .3, w * .5 + .3, .2, '#2a2a2e', 0, ry, 0);
  const [su, sv, uo, vo] = atlasUV(cell);
  b.add('signs', 'plane', x + Math.sin(ry) * .12, h + w * .25, z + Math.cos(ry) * .12, w, w * .5, 1, '#fff', 0, ry, 0, { uvs: [su, sv, uo, vo] });
}
function signPlane(b, x, y, z, w, h, cell, ry) { const [su, sv, uo, vo] = atlasUV(cell); b.add('signs', 'plane', x, y, z, w, h, 1, '#fff', 0, ry, 0, { uvs: [su, sv, uo, vo] }); }
function waterTank(b, x, y, z) { b.add('paint', 'cyl12', x, y + .6, z, 1.1, 1.2, 1.1, '#1d1d1d'); b.add('paint', 'cyl12', x, y + 1.25, z, .5, .1, .5, '#2a2a2a'); }
function railing(b, x, z0, len, h = 1.1, col = '#6b6f73') { b.add('rail', 'plane', x, h / 2, z0 - len / 2, len, h, 1, col, 0, Math.PI / 2, 0, { uvs: [len / 2, 1, 0, 0] }); }
function fence(b, x, z0, len, h = 2.4, col = '#39523a') { b.add('fence', 'plane', x, h / 2, z0 - len / 2, len, h, 1, col, 0, Math.PI / 2, 0, { uvs: [len / 1.5, h / 1.5, 0, 0] }); for (let k = 0; k <= len; k += 5) b.box('paint', x, h / 2, z0 - k, .12, h, .12, '#2e3d2e'); }
function curb(b, x, z0, len, w = .22, h = .25) { b.uv('curb', 'box', x, h / 2, z0 - len / 2, w, h, len, '#fff', 1, 1, 0, 0); }
function groundStrip(b, key, x0, x1, z0, len, y = 0, scaleM = 1, col = '#fff') {
  const w = Math.abs(x1 - x0); b.uv(key, 'ground', (x0 + x1) / 2, y, z0 - len / 2, w, 1, len, col, w / scaleM, len / scaleM);
}
function slab(b, key, x0, x1, z0, len, h, scaleM = 1) { const w = Math.abs(x1 - x0); b.uv(key, 'box', (x0 + x1) / 2, h / 2, z0 - len / 2, w, h, len, '#fff', w / scaleM, len / scaleM); }

/* ---- vehicle & obstacle models (front faces +z) ---- */
function wheels4(b, hw, zf, zr, r = .34, c = '#151515') { for (const sx of [-1, 1]) for (const zz of [zf, zr]) b.add('paint', 'wheel', sx * hw, r, zz, .26, r * 2, r * 2, c); }
function defineModels() {
  defModel('auto', b => {
    const Y = '#f2c21b';
    b.box('shiny', 0, .62, -.15, 1.3, .6, 2.0, Y); b.box('shiny', 0, .7, .95, .92, .8, .55, Y);
    b.box('paint', 0, .38, -.1, 1.32, .12, 2.3, '#1f7a3a');
    b.box('paint', 0, 1.8, -.15, 1.44, .12, 2.0, '#151515');
    for (const s of [-1, 1]) { b.box('paint', s * .7, 1.45, -.55, .04, .62, 1.2, '#151515'); b.box('metal', s * .62, 1.4, .9, .05, .8, .05, '#1c1c1c'); }
    b.add('paint', 'box', 0, 1.38, .92, 1.1, .62, .05, '#2d3d4a', -.25, 0, 0);
    b.box('paint', 0, 1.02, -.62, 1.14, .36, .5, '#3b2a22');
    b.add('paint', 'wheel', 0, .27, 1.05, .16, .54, .54, '#141414'); b.add('paint', 'wheel', -.62, .27, -.75, .18, .54, .54, '#141414'); b.add('paint', 'wheel', .62, .27, -.75, .18, .54, .54, '#141414');
    b.add('lamp', 'cyl8', 0, .98, 1.24, .2, .06, .2, '#fff4c8', Math.PI / 2, 0, 0);
    b.box('neon', 0, .75, -1.16, .9, .08, .04, '#ff3322');
  });
  const carCols = ['#f4f4f2', '#b9bdc2', '#b3261e', '#1f3a68', '#2d2d30', '#f4f4f2'];
  carCols.forEach((col, i) => defModel('car' + i, b => {
    b.box('shiny', 0, .62, 0, 1.76, .62, 4.1, col); b.box('shiny', 0, 1.14, -.25, 1.56, .5, 2.2, col);
    b.box('paint', 0, 1.15, -.25, 1.6, .38, 2.0, '#26313b'); b.add('paint', 'box', 0, 1.12, .92, 1.5, .44, .1, '#26313b', -.55, 0, 0);
    wheels4(b, .82, 1.3, -1.3);
    b.box('lamp', -.6, .72, 2.06, .34, .14, .04, '#fff6d8'); b.box('lamp', .6, .72, 2.06, .34, .14, .04, '#fff6d8');
    b.box('neon', -.62, .78, -2.06, .34, .14, .04, '#ff2a1a'); b.box('neon', .62, .78, -2.06, .34, .14, .04, '#ff2a1a');
    b.box('paint', 0, .45, 2.07, 1.6, .2, .05, '#222'); b.box('paint', 0, .45, 2.1, .5, .14, .02, i === 5 ? '#f2c21b' : '#ffffff');
  }));
  defModel('bus', b => {
    b.box('shiny', 0, 1.0, 0, 2.5, 1.3, 10.4, '#c8281f'); b.box('shiny', 0, 2.35, 0, 2.5, 1.4, 10.4, '#efe4c8');
    b.box('paint', 0, 3.1, 0, 2.3, .15, 10, '#d9cfb4');
    for (const s of [-1, 1]) b.box('paint', s * 1.26, 2.3, -.3, .03, .9, 9.2, '#28323c');
    b.box('paint', 0, 2.1, 5.21, 2.3, 1.5, .04, '#28323c'); b.box('paint', 0, 2.2, -5.21, 2.2, 1.0, .04, '#28323c');
    const [su, sv, uo, vo] = atlasUV(24); b.add('signs', 'plane', 0, 3.02, 5.23, 1.9, .45, 1, '#fff', 0, 0, 0, { uvs: [su, sv, uo, vo] });
    wheels4(b, 1.1, 3.4, -3.4, .5);
    b.box('lamp', -.9, .8, 5.22, .36, .22, .04, '#fff6d8'); b.box('lamp', .9, .8, 5.22, .36, .22, .04, '#fff6d8');
    b.box('neon', -.95, .9, -5.22, .3, .3, .04, '#ff2a1a'); b.box('neon', .95, .9, -5.22, .3, .3, .04, '#ff2a1a');
  });
  defModel('truck', b => {
    b.box('shiny', 0, 1.35, 3.2, 2.4, 1.9, 2.0, '#1f5fb8'); b.box('paint', 0, 1.9, 4.21, 2.1, .8, .04, '#28323c');
    b.box('paint', 0, 1.6, -1.1, 2.5, 2.5, 6.6, '#e9a21b'); b.box('paint', 0, 3.0, -1.1, 2.55, .3, 6.7, '#c0392b');
    const [su, sv, uo, vo] = atlasUV(26); b.add('signs', 'plane', 0, 1.7, -4.42, 2.3, 1.15, 1, '#fff', 0, Math.PI, 0, { uvs: [su, sv, uo, vo] });
    wheels4(b, 1.1, 3.1, -2.8, .52); b.box('lamp', -.9, 1, 4.22, .3, .2, .04, '#fff6d8'); b.box('lamp', .9, 1, 4.22, .3, .2, .04, '#fff6d8');
  });
  defModel('bike', b => {
    b.add('paint', 'wheel', 0, .32, .62, .1, .64, .64, '#151515'); b.add('paint', 'wheel', 0, .32, -.62, .1, .64, .64, '#151515');
    b.box('shiny', 0, .72, 0, .34, .36, 1.2, pick(['#b3261e', '#1f3a68', '#222'])); b.box('lamp', 0, .95, .72, .16, .12, .04, '#fff6d8');
    person(b, 0, -.15, 0, { helmet: pick(['#e9b949', '#ffffff', '#222222', '#b3261e']), h: .95 });
  });
  defModel('cycle', b => {
    b.add('paint', 'wheel', 0, .34, .55, .05, .68, .68, '#1a1a1a'); b.add('paint', 'wheel', 0, .34, -.55, .05, .68, .68, '#1a1a1a');
    b.box('metal', 0, .6, 0, .05, .05, 1.1, '#2f6fd1'); b.box('metal', 0, .75, .5, .5, .04, .04, '#333');
    person(b, 0, -.1, 0, { bag: pick(['#e9b949', '#2f7fd1', '#c2185b', '#222']), h: .95 });
  });
  defModel('cart', b => {
    b.box('paint', 0, .95, 0, 1.4, .25, 2.0, '#8a5a2b'); b.box('paint', 0, .6, 0, 1.3, .5, 1.9, '#6b4421');
    b.add('paint', 'wheel', -.75, .45, 0, .08, .9, .9, '#2a2a2a'); b.add('paint', 'wheel', .75, .45, 0, .08, .9, .9, '#2a2a2a');
    const fr = ['#f28c28', '#e53935', '#8bc34a', '#ffd54f', '#8e24aa'];
    for (let i = 0; i < 14; i++) b.add('paint', 'sphLo', rr(-.5, .5), 1.2 + rr(0, .25), rr(-.8, .8), .28, .28, .28, pick(fr));
    b.box('metal', 0, 1.8, -.8, .06, 1.6, .06, '#444'); b.add('paint', 'cone8', 0, 2.55, -.8, 2.2, .7, 2.2, pick(['#e53935', '#1e88e5', '#fdd835']));
    person(b, .9, -.4, -1.2, {});
  });
  defModel('barricade', b => {
    for (let i = 0; i < 6; i++) b.box('paint', -1.0 + i * .4 + .2, .72, 0, .4, .42, .06, i % 2 ? '#1b1b1b' : '#f2c21b');
    b.box('metal', 0, .98, 0, 2.3, .08, .08, '#8a8f94'); b.box('metal', 0, .48, 0, 2.3, .06, .06, '#8a8f94');
    for (const s of [-1, 1]) { b.box('metal', s * 1.1, .5, 0, .08, 1.0, .08, '#8a8f94'); b.box('metal', s * 1.1, .03, 0, .1, .06, .9, '#8a8f94'); }
    b.box('neon', 0, 1.06, 0, .12, .08, .12, '#ff5a1f');
  });
  defModel('cones', b => { for (const x of [-.8, 0, .8]) { b.add('paint', 'cone8', x, .42, 0, .5, .8, .5, '#ff6a1a'); b.add('paint', 'cyl8', x, .5, 0, .33, .12, .33, '#ffffff'); b.box('paint', x, .03, 0, .7, .06, .7, '#1b1b1b'); } });
  defModel('boom', b => {
    for (const s of [-1, 1]) { b.box('paint', s * 1.2, .8, 0, .22, 1.6, .22, '#e8e8e8'); b.box('paint', s * 1.2, 1.35, 0, .24, .3, .24, '#c62828'); }
    for (let i = 0; i < 8; i++) b.box('paint', -1.2 + i * .3 + .15, 1.32, 0, .3, .16, .12, i % 2 ? '#ffffff' : '#d32f2f');
    b.box('neon', 0, 1.48, 0, .12, .1, .12, '#ff2222');
  });
  defModel('scaffold', b => {
    for (const s of [-1, 1]) { b.box('metal', s * 1.15, 1.8, 0, .1, 3.6, .1, '#7a7f84'); b.box('metal', s * 1.15, 1.8, -.8, .1, 3.6, .1, '#7a7f84'); }
    b.box('metal', 0, 1.35, 0, 2.4, .16, .16, '#e0a21b'); b.box('metal', 0, 1.35, -.8, 2.4, .12, .12, '#7a7f84'); b.box('metal', 0, 3.55, -.4, 2.4, .12, .9, '#7a7f84');
    b.add('fence', 'plane', 0, 2.5, .02, 2.3, 1.9, 1, '#2e7d32', 0, 0, 0, { uvs: [1.5, 1.2, 0, 0] });
    b.box('paint', 0, 1.62, .06, 1.6, .38, .03, '#f2c21b');
  });
  defModel('jcb', b => {
    b.box('paint', 0, 1.1, -.5, 2.2, 1.2, 3.4, '#f2b01b'); b.box('paint', 0, 2.3, -1.1, 1.6, 1.3, 1.6, '#f2b01b'); b.box('paint', 0, 2.4, -1.1, 1.5, 1.0, 1.5, '#26313b');
    b.add('paint', 'wheel', -1.05, .6, .6, .5, 1.2, 1.2, '#141414'); b.add('paint', 'wheel', 1.05, .6, .6, .5, 1.2, 1.2, '#141414');
    b.add('paint', 'wheel', -1.05, .7, -1.6, .5, 1.4, 1.4, '#141414'); b.add('paint', 'wheel', 1.05, .7, -1.6, .5, 1.4, 1.4, '#141414');
    b.add('paint', 'box', 0, 2.2, 1.6, .35, .35, 2.6, '#f2b01b', -.6, 0, 0); b.add('paint', 'box', 0, 1.6, 2.9, .3, .3, 1.8, '#f2b01b', .7, 0, 0); b.box('metal', 0, .75, 3.3, 1.8, .7, .6, '#555');
    b.box('lamp', 0, 3.05, -1.1, .3, .15, .3, '#ffa726');
  });
  defModel('pillar', b => {
    b.add('paint', 'cyl16', 0, 5.2, 0, 1.8, 10.4, 1.8, '#bdb8ae'); b.box('paint', 0, 10.2, 0, 4.4, 1.2, 2.2, '#b2ada3'); b.box('paint', 0, .15, 0, 2.2, .3, 2.2, '#9c978d');
    b.box('paint', 0, 2.2, .91, 1.2, .5, .02, '#f2c21b'); b.box('paint', 0, 2.2, -.91, 1.2, .5, .02, '#f2c21b');
  }, true);
  defModel('coach', b => {
    b.box('shiny', 0, 2.05, 0, 2.7, 2.9, 22, '#1d4f91'); b.box('paint', 0, 2.4, 0, 2.74, .5, 21.4, '#e9dfc7');
    b.add('paint', 'cyl16', 0, 3.5, 0, 2.7, 22, 1.0, '#7d8288', Math.PI / 2, 0, 0);
    for (let k = -9; k <= 9; k += 1.5) for (const s of [-1, 1]) b.box('paint', s * 1.36, 2.35, k, .02, .55, .9, '#1b242e');
    for (const s of [-1, 1]) for (const zz of [8, -8]) { b.box('paint', 0, .6, zz, 2.2, .5, 2.6, '#1f1f1f'); b.add('paint', 'wheel', s * .84, .45, zz + .8, .12, .9, .9, '#2b2b2b'); b.add('paint', 'wheel', s * .84, .45, zz - .8, .12, .9, .9, '#2b2b2b'); }
  });
  defModel('loco', b => {
    b.box('shiny', 0, 2.1, 0, 2.8, 3.1, 20, '#b52a1d'); b.box('paint', 0, 1.2, 0, 2.84, .35, 20, '#f4efe6'); b.box('paint', 0, 3.1, 9.9, 2.4, 1.0, .1, '#1b242e');
    b.box('lamp', 0, 3.8, 10.02, .5, .3, .06, '#fffbe6'); b.box('lamp', -.9, 1.6, 10.02, .3, .2, .06, '#fffbe6'); b.box('lamp', .9, 1.6, 10.02, .3, .2, .06, '#fffbe6');
    b.box('metal', 0, 4.1, -2, 1.4, .5, 4, '#555'); b.box('metal', 0, 4.8, 0, .1, 1.2, .1, '#333');
    for (const zz of [7, -7]) { b.box('paint', 0, .6, zz, 2.2, .5, 3.4, '#1f1f1f'); for (const s of [-1, 1]) for (const dz of [-1, 0, 1]) b.add('paint', 'wheel', s * .84, .5, zz + dz * 1.05, .12, 1, 1, '#2b2b2b'); }
  });
  defModel('trolley', b => {
    b.box('metal', 0, .45, 0, 1.3, .08, 1.3, '#6f7479'); b.box('metal', 0, .9, -.62, 1.3, .9, .06, '#6f7479');
    b.box('paint', -.2, .75, .1, .7, .55, .5, '#b3261e'); b.box('paint', .3, .65, -.2, .5, .38, .6, '#1f3a68'); b.box('paint', 0, 1.1, .05, .6, .3, .45, '#3a2a22');
    b.add('paint', 'wheel', -.5, .15, .45, .08, .3, .3, '#111'); b.add('paint', 'wheel', .5, .15, .45, .08, .3, .3, '#111'); b.add('paint', 'wheel', -.5, .15, -.45, .08, .3, .3, '#111'); b.add('paint', 'wheel', .5, .15, -.45, .08, .3, .3, '#111');
  });
  defModel('crate', b => { b.box('paint', 0, .55, 0, 1.4, 1.1, 1.4, '#a8793e'); b.box('paint', 0, .55, .71, 1.3, .12, .02, '#7a5528'); b.box('paint', 0, .55, -.71, 1.3, .12, .02, '#7a5528'); b.box('paint', .71, .55, 0, .02, .12, 1.3, '#7a5528'); b.box('paint', -.71, .55, 0, .02, .12, 1.3, '#7a5528'); });
  defModel('bench', b => { b.box('paint', 0, .5, 0, 2.2, .1, .5, '#8a5a2b'); b.box('paint', 0, .82, -.22, 2.2, .45, .08, '#8a5a2b'); for (const s of [-1, 1]) b.box('metal', s * .95, .25, 0, .1, .5, .5, '#333'); });
  defModel('log', b => { b.add('paint', 'cyl12', 0, .38, 0, .76, 2.4, .76, '#6b4f36', 0, 0, Math.PI / 2); b.add('paint', 'cyl12', 1.2, .38, 0, .6, .05, .6, '#c9a36b', 0, 0, Math.PI / 2); b.add('paint', 'cyl12', -1.2, .38, 0, .6, .05, .6, '#c9a36b', 0, 0, Math.PI / 2); });
  defModel('branch', b => {
    b.add('paint', 'cyl8', 0, 1.42, 0, .32, 2.8, .32, '#5d4632', 0, 0, Math.PI / 2 + .06);
    b.add('leaf', 'ico', -.5, 1.9, 0, 1.8, .9, 1.2, '#4d7a2d'); b.add('leaf', 'ico', .7, 1.8, .1, 1.5, .8, 1.1, '#5b8a33');
    for (const s of [-1, 1]) b.box('paint', s * 1.25, .7, 0, .18, 1.4, .18, '#5d4632');
  });
  defModel('rock', b => { b.add('rock', 'dodeca', 0, 1.0, 0, 2.3, 2.0, 2.0, '#8d8378', .3, .5, 0); b.add('rock', 'dodeca', .3, 1.9, -.2, 1.3, 1.1, 1.2, '#9a8f82', 1, 2, 0); });
  defModel('cannon', b => { b.box('paint', 0, .35, -.2, 1.1, .5, 1.6, '#6b4a2e'); b.add('paint', 'wheel', -.6, .4, -.2, .12, .8, .8, '#4a3522'); b.add('paint', 'wheel', .6, .4, -.2, .12, .8, .8, '#4a3522'); b.add('metal', taper(.7, 12), 0, .72, .3, .42, 2.6, .42, '#2a2a2a', Math.PI / 2 - .12, 0, 0); b.add('metal', 'torus', 0, .82, 1.55, .5, .5, .5, '#2a2a2a'); });
  defModel('goats', b => {
    for (const [x, z, c] of [[-.7, 0, '#f2f0ea'], [.2, .4, '#2b2522'], [.8, -.2, '#8a6a4a']]) {
      b.box('paint', x, .55, z, .35, .35, .8, c); b.box('paint', x, .75, z + .45, .2, .26, .28, c);
      for (const [dx, dz] of [[-.12, .3], [.12, .3], [-.12, -.3], [.12, -.3]]) b.box('paint', x + dx, .2, z + dz, .07, .4, .07, c);
      b.add('paint', 'cone4', x - .07, .95, z + .5, .05, .2, .05, '#555', -.5, 0, 0); b.add('paint', 'cone4', x + .07, .95, z + .5, .05, .2, .05, '#555', -.5, 0, 0);
    }
  });
  defModel('hay', b => { for (const x of [-.7, .7]) { b.add('paint', 'cyl12', x, .5, 0, 1, 1.1, 1, '#d9b45a', 0, 0, Math.PI / 2); }  });
  defModel('tractor', b => { b.withTx(0, 0, 1.3, 0, 1, () => {
    b.box('paint', 0, 1.1, .8, 1.2, .9, 2.0, '#c62828'); b.box('paint', 0, 1.9, -.3, 1.3, .12, 1.4, '#222'); b.box('metal', 0, 1.6, .1, .05, .9, .05, '#333');
    b.add('paint', 'wheel', -.9, .8, -.4, .45, 1.6, 1.6, '#1a1a1a'); b.add('paint', 'wheel', .9, .8, -.4, .45, 1.6, 1.6, '#1a1a1a');
    b.add('paint', 'wheel', -.6, .45, 1.6, .3, .9, .9, '#1a1a1a'); b.add('paint', 'wheel', .6, .45, 1.6, .3, .9, .9, '#1a1a1a');
    b.box('paint', 0, 1.1, -3.0, 2.2, 1.0, 3.2, '#2e7d32'); b.add('paint', 'wheel', -1.1, .5, -3, .3, 1, 1, '#1a1a1a'); b.add('paint', 'wheel', 1.1, .5, -3, .3, 1, 1, '#1a1a1a');
    b.box('paint', 0, 1.8, -3.0, 2, .5, 3, '#d9b45a');
    person(b, 0, -.2, 0, { h: .9 });
  }); });
  defModel('tourists', b => { person(b, -.6, .2, 0, { g: 'f', bag: '#e9b949' }); person(b, .5, -.2, 0, { g: 'm', cap: '#ffffff' }); person(b, 0, .6, 0, { g: 'f' }); b.box('metal', .9, 1.4, 0, .04, 2.8, .04, '#444'); b.box('neon', 1.05, 2.6, 0, .35, .25, .02, '#ffb13b'); });
  defModel('booth', b => { b.box('paint', 0, 1.25, 0, 1.6, 2.5, 1.6, '#e9e4d8'); b.box('paint', 0, 1.6, .81, 1.2, .8, .02, '#28323c'); for (let i = 0; i < 6; i++) b.box('paint', -.75 + i * .3, 2.6, 0, .3, .2, 1.8, i % 2 ? '#fff' : '#d32f2f'); b.box('lamp', 0, 2.8, 0, .2, .2, .2, '#ff4040'); });
  defModel('wall', b => {
    b.add('paint', taper(.55, 4), 0, .55, 0, 1.0, 1.1, 28, '#cfc8bb', 0, Math.PI / 4, 0);
    b.box('paint', 0, .6, 0, .7, 1.2, 28, '#d8d2c6'); b.add('fence', 'plane', 0, 1.8, 0, 28, 1.2, 1, '#6f7479', 0, Math.PI / 2, 0, { uvs: [18, 1, 0, 0] });
    for (let k = -13; k <= 13; k += 2) { b.box('paint', .36, .7, k, .02, .5, .8, k % 4 === 1 ? '#f2c21b' : '#1b1b1b'); b.box('paint', -.36, .7, k, .02, .5, .8, k % 4 === 1 ? '#f2c21b' : '#1b1b1b'); }
    b.box('neon', 0, 1.25, 13.9, .5, .2, .1, '#ff5a1f');
  });
  defModel('hedge', b => { b.box('leaf', 0, .45, 0, 2.3, .9, .9, '#3f6f2a'); b.box('paint', 0, .05, 0, 2.4, .1, 1.0, '#7d6a52'); });
  defModel('toytrain', b => {
    b.box('shiny', 0, .9, 3.5, 1.5, 1.2, 2.5, '#d32f2f'); b.add('paint', 'cyl8', 0, 1.9, 4.1, .35, .9, .35, '#222'); b.box('paint', 0, 1.9, 2.8, 1.5, .9, 1.1, '#fdd835');
    for (let i = 0; i < 2; i++) { const z = -i * 3.1; b.box('shiny', 0, .85, z, 1.5, .9, 2.8, i ? '#1e88e5' : '#43a047'); b.box('paint', 0, 1.9, z, 1.6, .1, 2.9, '#fdd835'); for (const s of [-1, 1]) b.box('metal', s * .7, 1.45, z, .05, 1, .05, '#333'); }
    for (const z of [4.3, 2.7, .9, -.9, -2.2, -4]) for (const s of [-1, 1]) b.add('paint', 'wheel', s * .72, .3, z, .1, .6, .6, '#222');
    b.box('lamp', 0, 1.2, 4.77, .3, .3, .05, '#fff6d8');
  });
  defModel('metrotrain', b => {
    for (let i = 0; i < 3; i++) {
      const z = (i - 1) * 21; b.box('shiny', 0, 1.9, z, 2.9, 3.2, 20.6, '#eef1f4'); b.box('paint', 0, 1.3, z, 2.94, .35, 20.6, '#e2231a');
      for (const s of [-1, 1]) b.box('paint', s * 1.46, 2.3, z, .02, 1.0, 18, '#253241');
      b.box('paint', 0, 3.6, z, 2.4, .25, 20, '#c9ced4');
    }
    b.box('paint', 0, 2.4, 31.4, 2.4, 1.3, .06, '#253241'); b.box('lamp', -.9, 1.2, 31.42, .3, .15, .04, '#fffbe6'); b.box('lamp', .9, 1.2, 31.42, .3, .15, .04, '#fffbe6');
  }, false);
  defModel('boat', b => {
    b.add('shiny', taper(.8, 8), 0, .35, 0, 1.8, .7, 5.5, '#f4f4f2', 0, 0, 0); b.box('paint', 0, .72, 0, 1.9, .1, 5.6, '#1a74d1');
    b.box('paint', 0, 1.5, -.5, 1.7, .08, 2.8, pick(['#e9b949', '#e2231a', '#12a38c'])); for (const s of [-1, 1]) for (const zz of [.8, -1.8]) b.box('metal', s * .8, 1.1, zz, .05, .8, .05, '#ddd');
    person(b, .3, -.3, 0, { h: .9 }); person(b, -.3, .6, 0, { h: .9, g: 'f' });
  }, false);
  defModel('boatBig', b => { // tourist launch
    b.box('shiny', 0, .7, 0, 4.5, 1.4, 16, '#f4f4f2'); b.box('paint', 0, 1.45, 0, 4.6, .15, 16.2, '#e2231a'); b.box('paint', 0, 2.7, -1, 4, 2.2, 10, '#f7f1e4'); for (const s of [-1, 1]) b.box('paint', s * 2.01, 2.7, -1, .02, 1, 9, '#28323c');
    b.box('paint', 0, 3.9, -1, 4.3, .2, 10.5, '#1a74d1'); b.box('lamp', 0, 4.2, 4, .2, .2, .2, '#fff');
  }, false);
  defModel('streetcar', b => { // ambient traffic (no collision)
    b.box('shiny', 0, .62, 0, 1.76, .62, 4.1, '#d7d9dc'); b.box('shiny', 0, 1.14, -.25, 1.56, .5, 2.2, '#d7d9dc'); b.box('paint', 0, 1.15, -.25, 1.6, .38, 2.0, '#26313b'); wheels4(b, .82, 1.3, -1.3);
    b.box('lamp', -.6, .72, 2.06, .34, .14, .04, '#fff6d8'); b.box('lamp', .6, .72, 2.06, .34, .14, .04, '#fff6d8'); b.box('neon', -.62, .78, -2.06, .34, .14, .04, '#ff2a1a'); b.box('neon', .62, .78, -2.06, .34, .14, .04, '#ff2a1a');
  }, false);
  // animals (zoo, behind fences)
  defModel('giraffe', b => {
    const Y = '#d9a441', S = '#8a5a2b'; b.box('paint', 0, 2.3, 0, .9, 1.0, 2.0, Y);
    for (const [x, z] of [[-.3, .7], [.3, .7], [-.3, -.7], [.3, -.7]]) b.box('paint', x, 1.0, z, .16, 2.0, .16, Y);
    b.add('paint', 'box', 0, 3.8, .95, .32, 2.8, .32, Y, .35, 0, 0); b.box('paint', 0, 5.1, 1.55, .35, .35, .8, Y);
    for (let i = 0; i < 12; i++) b.box('paint', rr(-.46, .46), 2.3 + rr(-.3, .4), rr(-.9, .9), .02, .2, .2, S);
    b.box('paint', -.1, 5.4, 1.4, .06, .3, .06, S); b.box('paint', .1, 5.4, 1.4, .06, .3, .06, S);
  }, false);
  defModel('elephant', b => {
    const G = '#7d7a78'; b.add('paint', 'sph', 0, 2.1, 0, 2.0, 1.8, 3.2, G);
    for (const [x, z] of [[-.55, .9], [.55, .9], [-.55, -.9], [.55, -.9]]) b.add('paint', 'cyl8', x, .75, z, .6, 1.5, .6, G);
    b.add('paint', 'sph', 0, 2.6, 1.8, 1.3, 1.3, 1.2, G); b.add('paint', 'cone8', 0, 1.6, 2.25, .45, 1.8, .45, G, .25, 0, 0);
    b.add('paint', 'box', -.7, 2.6, 1.7, .1, 1.1, .9, G, 0, .5, 0); b.add('paint', 'box', .7, 2.6, 1.7, .1, 1.1, .9, G, 0, -.5, 0);
    b.add('paint', 'cone4', -.25, 2.0, 2.25, .1, .6, .1, '#f4efe6', 1.9, 0, 0); b.add('paint', 'cone4', .25, 2.0, 2.25, .1, .6, .1, '#f4efe6', 1.9, 0, 0);
  }, false);
  defModel('deer', b => {
    const D = '#b07a45'; b.box('paint', 0, 1.0, 0, .45, .5, 1.1, D); for (const [x, z] of [[-.15, .4], [.15, .4], [-.15, -.4], [.15, -.4]]) b.box('paint', x, .45, z, .08, .9, .08, D);
    b.add('paint', 'box', 0, 1.45, .55, .18, .6, .18, D, .4, 0, 0); b.box('paint', 0, 1.75, .75, .2, .22, .35, D);
    for (let i = 0; i < 6; i++) b.box('paint', rr(-.2, .2), 1.05 + rr(0, .2), rr(-.4, .4), .02, .08, .08, '#f4efe6');
    b.add('paint', 'box', -.12, 2.05, .7, .04, .5, .04, '#5a4330', 0, 0, .4); b.add('paint', 'box', .12, 2.05, .7, .04, .5, .04, '#5a4330', 0, 0, -.4);
  }, false);
  defModel('lion', b => {
    const L = '#c9954a'; b.box('paint', 0, .9, 0, .7, .7, 1.6, L); for (const [x, z] of [[-.22, .6], [.22, .6], [-.22, -.6], [.22, -.6]]) b.box('paint', x, .35, z, .18, .7, .18, L);
    b.add('paint', 'sph', 0, 1.35, .85, 1.1, 1.1, .9, '#7a4a1e'); b.add('paint', 'sph', 0, 1.3, 1.1, .6, .6, .6, L); b.add('paint', 'cyl6', 0, .9, -1, .08, .9, .08, L, .8, 0, 0);
  }, false);
  defModel('flamingo', b => { b.add('paint', 'sph', 0, 1.1, 0, .45, .4, .7, '#f48fb1'); b.box('paint', 0, .5, 0, .04, 1, .04, '#f06292'); b.add('paint', 'box', 0, 1.55, .25, .06, .8, .06, '#f48fb1', .3, 0, 0); b.box('paint', 0, 1.95, .38, .12, .12, .25, '#f48fb1'); }, false);
}

/* ---- Collectible meshes ---- */
const COINGEO = {};
function buildCollectibles() {
  // Charminar token emblem
  const [c, x] = mkCanvas(128, 128);
  const g = x.createRadialGradient(50, 44, 4, 64, 64, 64); g.addColorStop(0, '#fff3c0'); g.addColorStop(.5, '#f0c14b'); g.addColorStop(1, '#a9761c'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = '#8a5a12'; x.lineWidth = 6; x.beginPath(); x.arc(64, 64, 56, 0, 7); x.stroke();
  x.fillStyle = '#8a5a12';
  x.fillRect(42, 58, 44, 36); x.fillStyle = '#f0c14b'; x.beginPath(); x.moveTo(56, 94); x.lineTo(56, 76); x.quadraticCurveTo(56, 66, 64, 62); x.quadraticCurveTo(72, 66, 72, 76); x.lineTo(72, 94); x.fill();
  x.fillStyle = '#8a5a12'; for (const px of [38, 84]) { x.fillRect(px, 34, 6, 60); x.beginPath(); x.arc(px + 3, 32, 6, 0, 7); x.fill(); x.fillRect(px + 2, 20, 2, 8); }
  x.fillRect(40, 52, 48, 5);
  const t = mkTex(c, false);
  MAT.gold = new THREE.MeshStandardMaterial({ color: 0xf0c14b, metalness: .85, roughness: .25, emissive: 0x6a4a10, emissiveIntensity: .5 });
  MAT.coinFace = new THREE.MeshStandardMaterial({ map: t, metalness: .6, roughness: .35, emissive: 0xffc860, emissiveMap: t, emissiveIntensity: .35 });
  COINGEO.token = new THREE.CylinderGeometry(.42, .42, .09, 20).rotateX(Math.PI / 2);
  MAT.pearl = new THREE.MeshStandardMaterial({ color: 0xfff8f0, metalness: .25, roughness: .12, emissive: 0xffe6f0, emissiveIntensity: .25 });
  COINGEO.pearl = new THREE.SphereGeometry(.36, 16, 12);
  MAT.star = new THREE.MeshStandardMaterial({ color: 0xffb13b, metalness: .7, roughness: .3, emissive: 0xff8a00, emissiveIntensity: .8 });
  COINGEO.star = starGeo().clone().scale(1.4, 1.4, 1.4);
}
function powerMesh(type) {
  const g = new THREE.Group(); const col = new THREE.Color(POWERS[type].color);
  const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .7, metalness: .3, roughness: .3 });
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(.72, 20, 14), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: .22, roughness: .05, metalness: .2, emissive: col, emissiveIntensity: .25, depthWrite: false }));
  g.add(bubble);
  let inner;
  if (type === 'shield') { const s = new THREE.Shape(); s.moveTo(0, .45); s.quadraticCurveTo(.4, .4, .4, .15); s.quadraticCurveTo(.35, -.3, 0, -.45); s.quadraticCurveTo(-.35, -.3, -.4, .15); s.quadraticCurveTo(-.4, .4, 0, .45); inner = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .12, bevelEnabled: false }), m); inner.position.z = -.06; }
  else if (type === 'magnet') { inner = new THREE.Mesh(new THREE.TorusGeometry(.3, .11, 8, 16, Math.PI), m); inner.rotation.z = Math.PI; }
  else if (type === 'dash') { inner = new THREE.Group(); for (let i = 0; i < 2; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(.28, .35, 3), m); c.rotation.z = -Math.PI / 2; c.position.x = -.12 + i * .26; inner.add(c); } }
  else if (type === 'cyber') { inner = new THREE.Mesh(new THREE.OctahedronGeometry(.36, 0), m); }
  else if (type === 'metro') { inner = new THREE.Group(); const bdy = new THREE.Mesh(new THREE.BoxGeometry(.7, .32, .3), new THREE.MeshStandardMaterial({ color: 0xf4f4f2, emissive: 0x444444 })); inner.add(bdy); const st = new THREE.Mesh(new THREE.BoxGeometry(.72, .08, .32), m); st.position.y = -.06; inner.add(st); }
  else { inner = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 10), m); inner.scale.set(.8, 1.1, .8); const tip = new THREE.Mesh(new THREE.ConeGeometry(.22, .35, 12), m); tip.position.y = .36; inner.add(tip); }
  g.add(inner); g.userData.inner = inner; return g;
}
