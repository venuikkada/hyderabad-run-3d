/* =========================================================
   Landmarks — recognizable silhouettes built from primitives.
   Convention: centered at origin, front faces +z, base at y=0.
   ========================================================= */
const LM = {};
function disc(b, key, x, y, z, r, t, col, ry = 0) { b.add(key, 'cyl24', x, y, z, r * 2, t, r * 2, col, Math.PI / 2, ry, 0); }
function clockFace(b, x, y, z, r, ry = 0) {
  disc(b, 'lmk', x, y, z, r * 1.15, .25, '#b8a47a', ry); disc(b, 'lamp', x + Math.sin(ry) * .14, y, z + Math.cos(ry) * .14, r, .05, '#fff8e2', ry);
  const fx = Math.sin(ry) * .2, fz = Math.cos(ry) * .2;
  b.add('paint', 'box', x + fx, y + r * .25, z + fz, r * .08, r * .5, .04, '#1a1a1a', 0, ry, 0);
  b.add('paint', 'box', x + fx + Math.cos(ry) * r * .18, y, z + fz - Math.sin(ry) * r * .18, r * .38, r * .07, .04, '#1a1a1a', 0, ry, 0);
}
function arches(b, key, cx, y, cz, ry, n, span, w, h, col) {
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : (i / (n - 1) - .5) * span; b.add(key, archPanel(), cx + Math.cos(ry) * t, y, cz - Math.sin(ry) * t, w, h, 1, col, 0, ry, 0); }
}
function chhatri(b, x, y, z, s, col) {
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add('lmk', 'cyl6', x + dx * s * .4, y + s * .6, z + dz * s * .4, s * .12, s * 1.2, s * .12, col);
  b.box('lmk', x, y + s * 1.25, z, s * 1.15, s * .12, s * 1.15, col); b.add('lmk', 'onion', x, y + s * 1.3, z, s * .95, s * 1.1, s * .95, col);
  b.add('lmk', 'cyl6', x, y + s * 2.45, z, s * .06, s * .4, s * .06, '#c9a45a');
}
function minaret(b, x, z, segs, col, col2, top = 'onion') {
  let y = 0;
  for (const [r, h, ring] of segs) { b.add('lmk', 'cyl12', x, y + h / 2, z, r * 2, h, r * 2, col); y += h; if (ring) { b.add('lmk', 'cyl16', x, y + .3, z, ring * 2, .6, ring * 2, col2); y += .6; } }
  return y;
}
Batch.prototype.seg = function (key, x1, y1, z1, x2, y2, z2, t, col) {
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, L = Math.hypot(dx, dy, dz);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L));
  const m = new THREE.Matrix4().compose(new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2), q, new THREE.Vector3(t, L, t)); if (this.tx) m.premultiply(this.tx);
  this.push(key, GP.box, m, col);
};

LM.charminar = b => {
  const S = 24, half = S / 2, c = '#d9c4a0', c2 = '#ead9b6', dk = '#4a3b2e', rec = '#5f4d3c';
  const fw = archWall(S - 3.2, 22, 10.6, 17.2, 3, 'charminarFace');
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; b.add('lmk', fw, Math.sin(a) * (half - 1.5), 0, Math.cos(a) * (half - 1.5), 1, 1, 1, c, 0, a, 0); }
  const trim = archWall(12.6, 18.6, 10.6, 17.2, .4, 'charminarTrim');
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; b.add('lmk', trim, Math.sin(a) * (half + .02), 0, Math.cos(a) * (half + .02), 1, 1, 1, c2, 0, a, 0); clockFace(b, Math.sin(a) * (half + .1), 19.7, Math.cos(a) * (half + .1), 1.25, a); }
  b.box('lmk', 0, 21.4, 0, S - 3, .8, S - 3, dk);
  b.box('lmk', 0, 22.3, 0, S + 1.4, .7, S + 1.4, c2);
  b.box('lmk', 0, 24.4, 0, S - 1.6, 3.6, S - 1.6, c);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; arches(b, 'lmk', Math.sin(a) * (half - .75), 22.7, Math.cos(a) * (half - .75), a, 7, S - 7, 1.6, 2.9, rec); }
  b.box('lmk', 0, 26.5, 0, S + .4, .5, S + .4, c2);
  b.box('lmk', 0, 28.5, 0, S - 3, 3.4, S - 3, c);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; arches(b, 'lmk', Math.sin(a) * (half - 1.45), 26.9, Math.cos(a) * (half - 1.45), a, 11, S - 7, 1.05, 2.5, rec); }
  b.box('lmk', 0, 30.5, 0, S - 2.4, .6, S - 2.4, c2);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; for (let k = -8; k <= 8; k += 1.6) b.box('lmk', Math.sin(a) * (half - 1.3) + Math.cos(a) * k, 31.2, Math.cos(a) * (half - 1.3) - Math.sin(a) * k, .7, .9, .7, c2); }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = sx * half, z = sz * half;
    const y = minaret(b, x, z, [[2.45, 23.6, 3.2], [2.1, 7.6, 2.8], [1.85, 6.8, 2.5], [1.6, 4.6, 2.2]], c, c2);
    b.add('lmk', 'cyl12', x, y + 1.5, z, 2.4, 3, 2.4, dk);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; b.add('lmk', 'cyl6', x + Math.sin(a) * 1.35, y + 1.5, z + Math.cos(a) * 1.35, .28, 3, .28, c2); }
    b.add('lmk', 'cyl12', x, y + 3.2, z, 3.2, .4, 3.2, c2);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; b.add('lmk', 'cone4', x + Math.sin(a) * 1.5, y + 3.7, z + Math.cos(a) * 1.5, .5, .8, .3, c2, 0, a, 0); }
    b.add('lmk', 'onion', x, y + 3.4, z, 3.6, 4.8, 3.6, c2);
    b.add('lmk', 'cyl6', x, y + 8.8, z, .16, 1.8, .16, '#b89a5a'); b.add('lmk', 'sph', x, y + 8.4, z, .4, .4, .4, '#b89a5a');
  }
};
LM.kaman = b => {
  const c = '#d6c4a2', c2 = '#e7d7b5';
  b.add('lmk', archWall(18, 14.5, 9.2, 11.6, 3.2, 'kaman'), 0, 0, 0, 1, 1, 1, c);
  b.box('lmk', 0, 14.8, 0, 18.8, .6, 3.8, c2);
  for (let x = -8.5; x <= 8.5; x += 1.4) b.box('lmk', x, 15.5, 0, .7, .9, 3.4, c2);
  arches(b, 'lmk', -6.8, 12.2, 1.62, 0, 2, 2, .9, 1.8, '#5f4d3c'); arches(b, 'lmk', 6.8, 12.2, 1.62, 0, 2, 2, .9, 1.8, '#5f4d3c');
  for (const s of [-1, 1]) { const y = minaret(b, s * 9.4, 0, [[1, 16, 1.4], [.8, 3, 0]], c, c2); b.add('lmk', 'onion', s * 9.4, y, 0, 1.8, 2.4, 1.8, c2); }
};
LM.mecca = b => {
  const c = '#908a80', c2 = '#a39d93', d = '#3a3632';
  b.box('lmk', 0, 8.5, 0, 36, 17, 16, c); b.box('lmk', 0, 17.4, 0, 37, .9, 16.6, c2);
  arches(b, 'lmk', 0, 1.3, 8.03, 0, 5, 25, 4.8, 11, d);
  for (let x = -16; x <= 16; x += 2) b.box('lmk', x, 18.3, 7.6, .9, 1.1, .6, c2);
  for (const s of [-1, 1]) {
    const x = s * 19.5, z = 5;
    b.add('lmk', 'cyl8', x, 11.5, z, 3.4, 23, 3.4, c); b.add('lmk', 'cyl8', x, 23.3, z, 4.8, .8, 4.8, c2);
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; b.add('lmk', 'cyl6', x + Math.sin(a) * 1.9, 25, z + Math.cos(a) * 1.9, .3, 2.6, .3, c2); }
    b.add('lmk', 'cyl8', x, 26.5, z, 4.4, .5, 4.4, c2); b.add('lmk', 'dome', x, 26.7, z, 3.4, 3.2, 3.4, c2); b.add('lmk', 'cyl6', x, 30.5, z, .15, 1.6, .15, '#b89a5a');
  }
  b.box('lmk', 0, 1.6, 17, 46, 3.2, 1, c2); b.add('lmk', archWall(8, 6, 4, 5, 1.4, 'meccagate'), 0, 0, 17, 1, 1, 1, c2);
};
LM.chowmahalla = b => {
  const w = '#f2ede3', t = '#d9c79c';
  b.facade('old', 0, 0, 0, 42, 12, 14, w, 3.5, 4.0);
  b.box('lmk', 0, 12.4, 0, 43, .8, 15, t); for (let x = -20; x <= 20; x += 1.2) b.box('lmk', x, 13.3, 7.2, .3, 1, .3, w);
  for (let x = -12; x <= 12; x += 4) b.add('lmk', 'cyl12', x, 5, 8, .9, 10, .9, w); b.box('lmk', 0, 10.4, 8, 26, .8, 2, t);
  const tx = -27; b.facade('old', tx, 0, 0, 6.5, 22, 6.5, w, 3.2, 4.4); b.box('lmk', tx, 22.3, 0, 7.2, .6, 7.2, t);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; clockFace(b, tx + Math.sin(a) * 3.35, 18.5, Math.cos(a) * 3.35, 1.4, a); }
  b.add('lmk', 'dome', tx, 22.6, 0, 5, 4, 5, w); b.add('lmk', 'cyl6', tx, 27.3, 0, .15, 1.4, .15, '#c9a45a');
};
LM.salarjung = b => {
  const y = '#e4ca90', t = '#f4e8c8';
  b.facade('old', 0, 0, 0, 72, 14, 18, y, 3.6, 4.6); b.box('lmk', 0, 14.5, 0, 73, 1, 19, t);
  b.add('lmk', 'cyl24', 0, 8, 9, 20, 16, 12, y); b.add('lmk', 'cyl24', 0, 16.4, 9, 21, .8, 12.6, t);
  for (let k = 0; k < 10; k++) { const a = -1.3 + k * .29; b.add('lmk', 'cyl8', Math.sin(a) * 10.4, 7, 9 + Math.cos(a) * 6.3, .9, 14, .9, t); }
  b.add('lmk', 'cyl24', 0, 19.3, 4, 14, 5, 14, y); b.add('lmk', 'dome', 0, 21.8, 4, 13, 8.5, 13, t); b.add('lmk', 'cyl6', 0, 31, 4, .3, 2.4, .3, '#c9a45a');
  for (const [x, z] of [[-34, 8], [34, 8], [-34, -8], [34, -8]]) chhatri(b, x, 15, z, 2.4, t);
};
LM.highcourt = b => {
  const r = '#b5563a', w = '#efe6d6';
  for (let i = 0; i < 8; i++) b.box('lmk', 0, i * 1.6 + .8, 0, 46, 1.6, 16, i % 2 ? w : r);
  b.box('lmk', 0, 13.2, 0, 47, .8, 17, w);
  for (let i = 0; i < 12; i++) b.box('lmk', 0, i * 1.6 + .8, 2, 14, 1.6, 15, i % 2 ? w : r);
  arches(b, 'lmk', 0, 1, 9.55, 0, 3, 8, 3, 6, '#3d2a22'); arches(b, 'lmk', -15, 7, 8.05, 0, 4, 12, 1.6, 3, '#3d2a22'); arches(b, 'lmk', 15, 7, 8.05, 0, 4, 12, 1.6, 3, '#3d2a22');
  b.add('lmk', 'cyl16', 0, 20.5, 2, 8, 2.2, 8, w); b.add('lmk', 'onion', 0, 21.5, 2, 8.4, 9, 8.4, r);
  for (const [x, z] of [[-22, 7.5], [22, 7.5], [-7, 9], [7, 9]]) { b.add('lmk', 'cyl8', x, 10.5, z, 1.5, 21, 1.5, w); b.add('lmk', 'onion', x, 21, z, 2, 2.8, 2, r); }
};
LM.clocktower = b => {
  const w = '#efe3c8', t = '#b5563a';
  b.box('lmk', 0, 1, 0, 8, 2, 8, t); b.facade('old', 0, 2, 0, 5.4, 18, 5.4, w, 2.6, 4.5); b.box('lmk', 0, 20.3, 0, 6.4, .6, 6.4, t);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; clockFace(b, Math.sin(a) * 2.8, 17, Math.cos(a) * 2.8, 1.3, a); }
  chhatri(b, 0, 20.6, 0, 3.4, w);
};
LM.secretariat = b => {
  const w = '#f4f1ea', s = '#d8b98a';
  b.facade('facade', 0, 0, 0, 112, 22, 26, w, 3.4, 3.7); b.box('lmk', 0, 22.4, 0, 113, .8, 27, s);
  b.box('lmk', 0, 3.4, 13.1, 112, .5, .4, s);
  arches(b, 'lmk', 0, 0, 13.1, 0, 15, 98, 4.4, 6.2, '#6d6a64');
  b.facade('facade', 0, 0, 5, 34, 36, 20, w, 3.4, 3.7); b.box('lmk', 0, 36.4, 5, 35, .8, 21, s);
  arches(b, 'lmk', 0, 1, 15.05, 0, 3, 14, 5, 12, '#5d5a54');
  for (const x of [-8.5, 8.5]) { b.add('lmk', 'cyl16', x, 38.8, 5, 10, 4, 10, w); b.box('lmk', x, 40.9, 5, 10.6, .4, 10.6, s); b.add('lmk', 'onion', x, 41, 5, 10.5, 12, 10.5, '#efe8da'); b.add('lmk', 'cyl6', x, 53.8, 5, .3, 2.6, .3, '#c9a45a'); }
  chhatri(b, 0, 36.8, 12, 3, w);
  for (let i = -4; i <= 4; i++) if (Math.abs(i) > 1) chhatri(b, i * 12, 22.8, 11, 2.4, w);
  for (const [x, z] of [[-54, 11], [54, 11], [-54, -11], [54, -11]]) chhatri(b, x, 22.8, z, 3.4, w);
};
LM.ambedkar = b => {
  const st = '#dcd5c7';
  b.add('lmk', 'cyl24', 0, 5, 0, 30, 10, 30, st); b.add('lmk', 'cyl24', 0, 10.3, 0, 33, .6, 33, '#ebe5da');
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; b.add('lmk', 'cyl8', Math.sin(a) * 15.8, 5, Math.cos(a) * 15.8, .8, 10, .8, '#f3eee4'); }
  b.add('lmk', 'cyl24', 0, 11.2, 0, 21, 1.2, 21, st); b.box('lmk', 0, 13.8, 0, 6.5, 4, 6.5, '#8a8378');
  b.withTx(0, 15.8, 0, 0, 18, () => {
    const br = '#7a5a38';
    b.box('bronze', -.1, .04, .04, .14, .08, .3, br); b.box('bronze', .1, .04, .04, .14, .08, .3, br);
    b.add('bronze', 'cyl8', -.1, .5, 0, .17, .9, .17, br); b.add('bronze', 'cyl8', .1, .5, 0, .17, .9, .17, br);
    b.add('bronze', taper(.82, 8), 0, 1.02, 0, .54, .42, .34, br); b.box('bronze', 0, 1.36, 0, .5, .56, .3, br);
    b.add('bronze', 'box', 0, 1.33, .155, .1, .4, .02, '#6a4c2e', 0, 0, 0);
    b.add('bronze', 'cyl8', 0, 1.68, 0, .12, .1, .12, br); b.add('bronze', 'sph', 0, 1.82, .01, .25, .29, .27, br); b.box('bronze', 0, 1.84, .13, .22, .04, .03, '#4a3620');
    b.add('bronze', 'box', -.31, 1.42, 0, .13, .36, .15, br, 0, 0, -.08); b.add('bronze', 'box', -.33, 1.18, .08, .12, .3, .13, br, -.7, 0, 0); b.add('bronze', 'box', -.34, 1.13, .2, .07, .28, .22, '#5d4128', -.2, 0, 0);
    b.add('bronze', 'box', .31, 1.64, .12, .13, .36, .15, br, 1.05, 0, 0); b.add('bronze', 'box', .31, 1.82, .43, .12, .34, .13, br, 1.05, 0, 0);
    b.add('bronze', 'sph', .31, 1.94, .6, .1, .1, .1, br); b.add('bronze', 'box', .31, 2.0, .68, .03, .14, .03, br, 1.05, 0, 0);
  });
};
LM.buddha = b => {
  b.add('rock', 'dodeca', 0, 1.2, 0, 16, 7, 13, '#7f776d', .2, .3, 0); b.add('rock', 'dodeca', 5, .5, 3, 8, 4, 7, '#8d8378', 1, .4, 0);
  b.add('lmk', 'cyl16', 0, 4.6, 0, 8, 1.6, 8, '#d8d2c6'); b.add('lmk', 'cyl16', 0, 5.6, 0, 5.6, .6, 5.6, '#e8e2d6');
  for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; b.add('lmk', 'cone4', Math.sin(a) * 2.6, 6.2, Math.cos(a) * 2.6, .9, 1, .4, '#efe9df', 0, a, 0); }
  b.withTx(0, 5.9, 0, 0, 9.2, () => {
    const W = '#f3efe6';
    b.add('lmk', taper(.66, 16), 0, .78, 0, .86, 1.56, .64, W); b.add('lmk', taper(.78, 12), 0, 1.66, 0, .6, .4, .4, W);
    b.add('lmk', 'sph', 0, 2.02, 0, .3, .34, .3, W); b.add('lmk', 'sph', 0, 2.22, 0, .15, .14, .15, W);
    b.box('lmk', -.155, 2.0, 0, .04, .16, .07, W); b.box('lmk', .155, 2.0, 0, .04, .16, .07, W);
    b.add('lmk', 'box', .3, 1.55, .12, .1, .34, .1, W, .15, 0, 0); b.add('lmk', 'box', .3, 1.78, .18, .1, .18, .04, W);
    b.add('lmk', 'box', -.28, 1.3, .1, .1, .4, .1, W, -.3, 0, .1);
    b.add('lmk', 'box', 0, 1.3, .2, .02, .9, .02, '#e6e0d4', 0, 0, .35);
  });
};
LM.birla = b => {
  const m = '#f6f3ec', a = '#eadfc6';
  b.add('rock', 'cone12', 0, 14, 0, 120, 28, 96, '#7c7650');
  for (let i = 0; i < 22; i++) { const ang = rr(0, 6.28), d = rr(14, 50); b.add('rock', 'dodeca', Math.sin(ang) * d, 28 - d * .52, Math.cos(ang) * d * .8, rr(3, 7), rr(2, 5), rr(3, 6), pick(['#8d8378', '#9a8f82', '#7f776d']), rr(0, 3), rr(0, 3), 0); }
  for (let i = 0; i < 14; i++) { const ang = rr(-1.2, 1.2) + (i % 2 ? Math.PI : 0), d = rr(18, 44); treeRound(b, Math.sin(ang) * d, Math.cos(ang) * d * .8, .9); }
  b.withTx(0, 27.5, 0, 0, 1, () => {
    b.box('lmk', 0, 1.5, 0, 28, 3, 22, a); for (let i = 0; i < 6; i++) b.box('lmk', 0, i * .5 + .25, 11.5 + i * .6, 10, .5, 1.2, m);
    b.box('lmk', 0, 6, 4, 16, 6, 12, m); arches(b, 'lmk', 0, 3.2, 10.05, 0, 5, 12, 1.8, 3.6, '#bfb3a0');
    for (const x of [-5, 0, 5]) chhatri(b, x, 9, 6, 2.2, m);
    b.box('lmk', 0, 6, -5, 11, 9, 11, m);
    b.add('lmk', 'shikhara', 0, 10.5, -5, 10, 22, 10, m);
    for (let k = 0; k < 8; k++) { const ang = k / 8 * 6.283; b.add('lmk', 'shikhara', Math.sin(ang) * 3.6, 10.5, -5 + Math.cos(ang) * 3.6, 3.6, 12, 3.6, m); }
    b.add('lmk', 'cyl16', 0, 32.2, -5, 3.4, .9, 3.4, a); b.add('lmk', 'torus', 0, 32.2, -5, 3.3, 3.3, 2.2, a, Math.PI / 2, 0, 0);
    b.add('lmk', 'sph', 0, 33.3, -5, 1.1, 1.3, 1.1, '#e0b54a'); b.add('lmk', 'cyl6', 0, 34.4, -5, .12, 1.4, .12, '#e0b54a');
    for (const x of [-8.5, 8.5]) { b.box('lmk', x, 5, 2, 5, 4, 5, m); b.add('lmk', 'shikhara', x, 7, 2, 5, 11, 5, m); b.add('lmk', 'sph', x, 18.2, 2, .8, .9, .8, '#e0b54a'); }
  });
};
LM.secstation = b => {
  const cr = '#ede1c5', mr = '#7a2e2a';
  b.facade('old', 0, 0, 0, 84, 11, 16, cr, 3.6, 5.5); b.box('lmk', 0, 11.3, 0, 85, .6, 17, mr); b.box('lmk', 0, 4.2, 8.05, 84, .4, .2, mr);
  b.facade('old', 0, 0, 2, 24, 16.5, 14, cr, 3.6, 5.5); b.box('lmk', 0, 16.8, 2, 25, .6, 15, mr);
  b.add('lmk', archWall(18, 9.5, 8.5, 7.8, 4.5, 'secporch'), 0, 0, 11.5, 1, 1, 1, cr); b.box('lmk', 0, 9.8, 11.5, 18.6, .6, 5, mr);
  for (const x of [-8, 8]) chhatri(b, x, 17.1, 8, 3, cr);
  clockFace(b, 0, 14, 9.1, 1.4, 0);
  for (let x = -38; x <= 38; x += 8) if (Math.abs(x) > 14) b.box('lmk', x, 11.8, 7.5, 2, .8, .8, mr);
};
LM.kachiguda = b => {
  const y = '#ebd08e', w = '#f6efe0';
  b.facade('old', 0, 0, 0, 74, 12, 16, y, 3.4, 6); b.box('lmk', 0, 12.3, 0, 75, .6, 17, w);
  b.facade('old', 0, 0, 2, 22, 17, 14, y, 3.4, 6); b.box('lmk', 0, 17.3, 2, 23, .6, 15, w);
  b.add('lmk', 'cyl16', 0, 19.2, 2, 10, 3.2, 10, y); b.add('lmk', 'onion', 0, 20.8, 2, 10.5, 11.5, 10.5, w); b.add('lmk', 'cyl6', 0, 33, 2, .25, 2, .25, '#c9a45a');
  for (const x of [-36, -26, -16, 16, 26, 36]) { b.add('lmk', 'cyl8', x, 8.5, 8.3, 2.4, 17, 2.4, y); b.add('lmk', 'cyl8', x, 17.2, 8.3, 3, .5, 3, w); b.add('lmk', 'onion', x, 17.4, 8.3, 2.8, 3.8, 2.8, w); b.add('lmk', 'cyl6', x, 21.8, 8.3, .12, 1, .12, '#c9a45a'); }
  for (const x of [-11, 11]) { b.add('lmk', 'cyl8', x, 11, 9.2, 2.6, 22, 2.6, y); b.add('lmk', 'onion', x, 22, 9.2, 3.2, 4.5, 3.2, w); }
  b.add('lmk', archWall(12, 8.5, 6, 7.5, 3, 'kachiP'), 0, 0, 10.5, 1, 1, 1, w);
};
LM.osmania = b => {
  const g = '#b9a090', d = '#8d776a';
  b.facade('old', -28, 0, 0, 34, 14, 18, g, 3.4, 4.6); b.facade('old', 28, 0, 0, 34, 14, 18, g, 3.4, 4.6);
  b.box('lmk', -28, 14.4, 0, 35, .8, 19, d); b.box('lmk', 28, 14.4, 0, 35, .8, 19, d);
  b.add('lmk', archWall(22, 25, 10, 18, 3, 'osmP'), 0, 0, 8, 1, 1, 1, g); b.facade('old', 0, 0, -3, 22, 25, 18, g, 3.4, 4.6);
  b.add('lmk', archPanel(), 0, 0, 6.4, 9.6, 17.6, 1, '#3b2f28');
  b.box('lmk', 0, 25.4, 2, 23, .8, 21, d);
  for (const [x, z] of [[-10, 8], [10, 8], [-10, -10], [10, -10]]) chhatri(b, x, 25.8, z, 3, g);
  for (const [x, z] of [[-44, 8], [-12, 8], [12, 8], [44, 8]]) chhatri(b, x, 14.8, z, 2.2, g);
  for (let x = -44; x <= 44; x += 4) if (Math.abs(x) > 12) b.add('lmk', 'cyl8', x, 3.5, 9.4, .8, 7, .8, d);
};
LM.zoogate = b => {
  for (const s of [-1, 1]) { b.add('rock', 'dodeca', s * 7.4, 3, 0, 4.2, 7, 4, '#8a7e6c', .2, .5, 0); b.add('rock', 'dodeca', s * 7.2, 7.4, 0, 3.4, 3.4, 3.4, '#9a8e7a', 1, 1, 0); }
  b.box('lmk', 0, 9.6, 0, 18, 1.6, 1.8, '#6b4a2e'); b.box('lmk', 0, 10.6, 0, 18.4, .4, 2.2, '#4a3522');
  for (const s of [-1, 1]) b.withTx(s * 7.2, 9.3, 0, s * -.4, .9, () => { const G = '#7d7a78'; b.add('paint', 'sph', 0, 2.1, 0, 2.0, 1.8, 3.2, G); for (const [x, z] of [[-.55, .9], [.55, .9], [-.55, -.9], [.55, -.9]]) b.add('paint', 'cyl8', x, .75, z, .6, 1.5, .6, G); b.add('paint', 'sph', 0, 2.6, 1.8, 1.3, 1.3, 1.2, G); b.add('paint', 'cone8', 0, 1.6, 2.25, .45, 1.8, .45, G, .25, 0, 0); });
  treeRound(b, -12, -3, 1.2); treeRound(b, 12, -4, 1.1);
};
LM.metrostation = b => {
  const c = '#d6d2ca', w = '#f2f2f0';
  for (const z of [-36, -18, 0, 18, 36]) for (const s of [-1, 1]) b.add('lmk', 'cyl12', s * 6.4, 5.6, z, 1.5, 11.2, 1.5, c);
  b.box('lmk', 0, 11.2, 0, 17, 2, 86, c); b.box('neon', 0, 12.3, 0, 17.1, .3, 86.1, '#e2231a');
  b.facade('glass', 0, 12.4, 0, 15, 5.2, 80, '#c9d7e6', 4, 5.2);
  b.add('lmk', 'cyl24', 0, 17.4, 0, 18, 82, 7, '#eef1f4', Math.PI / 2, 0, 0);
  for (const s of [-1, 1]) { b.facade('glass', s * 11, 0, 30, 3.4, 12, 7, '#b9c4cf', 3.4, 4); b.box('lmk', s * 9, 11.5, 30, 4.5, 1.2, 4, c); b.facade('glass', s * 11, 0, -30, 3.4, 12, 7, '#b9c4cf', 3.4, 4); b.box('lmk', s * 9, 11.5, -30, 4.5, 1.2, 4, c); }
};
LM.cybertowers = b => {
  const R = 34, L = Math.PI * .92;
  let g = SHAPEC.get('cyberArc'); if (!g) { g = prep(new THREE.CylinderGeometry(R, R, 1, 44, 1, true, -L / 2, L)); SHAPEC.set('cyberArc', g); }
  let g2 = SHAPEC.get('cyberArc2'); if (!g2) { g2 = prep(new THREE.CylinderGeometry(R + .4, R + .4, 1, 44, 1, true, -L / 2, L)); SHAPEC.set('cyberArc2', g2); }
  b.add('glass', g, 0, 21.5, -R, 1, 39, 1, '#8fb4d9', 0, 0, 0, { uvs: [R * L / (4 * 3.4), 39 / (4 * 3.9), 0, 0] });
  b.add('lmk', g2, 0, 41.8, -R, 1, 1.6, 1, '#f1f1ee'); b.add('lmk', g2, 0, 1.2, -R, 1, 2.4, 1, '#dcd8cf');
  let g3 = SHAPEC.get('cyberArc3'); if (!g3) { g3 = prep(new THREE.CylinderGeometry(R - 14, R - 14, 1, 30, 1, true, -L / 2, L)); SHAPEC.set('cyberArc3', g3); }
  b.add('glass', g3, 0, 21.5, -R, 1, 39, 1, '#7f9fc2', 0, 0, 0, { uvs: [(R - 14) * L / (4 * 3.4), 39 / (4 * 3.9), 0, 0] });
  for (const s of [-1, 1]) { const a = s * L / 2; b.add('lmk', 'box', Math.sin(a) * (R - 7), 21.5, -R + Math.cos(a) * (R - 7), 14.5, 43, 1.2, '#e7e6e1', 0, a + Math.PI / 2, 0); }
  b.facade('glass', 0, 0, -3, 12, 48, 9, '#6f8fb8', 3.4, 3.9); b.box('lmk', 0, 48.4, -3, 12.6, .8, 9.6, '#f1f1ee');
  const [su, sv, uo, vo] = atlasUV(31); b.add('signs', 'plane', 0, 44, 1.52, 9, 4.5, 1, '#fff', 0, 0, 0, { uvs: [su, sv, uo, vo] });
  b.box('lmk', 0, .15, 8, 60, .3, 16, '#cfc9bd');
};
LM.fdtowers = b => {
  const specs = [[-30, -20, 22, 110, 22, '#7fa7c9'], [0, 10, 26, 92, 26, '#a6d4d2'], [34, -30, 20, 124, 20, '#86b7a8'], [60, 12, 24, 78, 30, '#9fc3e6'], [-60, 5, 20, 66, 24, '#b9c4cf']];
  for (const [x, z, w, h, d, c] of specs) {
    b.facade('glass', x, 0, z, w, h, d, c, 3.3, 3.8); b.facade('glass', x, h, z, w * .7, h * .12, d * .7, c, 3.3, 3.8);
    b.box('lmk', x, h * 1.12 + .5, z, w * .5, 1, d * .5, '#e9edf2'); b.add('metal', 'cyl6', x, h * 1.12 + 6, z, .4, 10, .4, '#c9ced4'); b.box('lamp', x, h * 1.12 + 11.2, z, .6, .6, .6, '#ff3b30');
  }
};
LM.cablebridge = b => {
  for (const pz of [-62, 62]) {
    b.seg('lmk', -7.2, 0, pz, -.8, 50, pz, 1.6, '#e8e6e0'); b.seg('lmk', 7.2, 0, pz, .8, 50, pz, 1.6, '#e8e6e0');
    b.box('lmk', 0, 51, pz, 3.4, 3, 2.2, '#e8e6e0'); b.box('lmk', 0, 13, pz, 13, 1, 1.4, '#e8e6e0'); b.box('lamp', 0, 52.8, pz, .6, .6, .6, '#ff3b30');
    for (let k = 1; k <= 7; k++) for (const dz of [-1, 1]) for (const s of [-1, 1]) b.seg('cable', 0, 49 - k * 1.2, pz, s * 5.6, .9, pz + dz * k * 7.2, .09, '#ffffff');
  }
};
LM.fateh = b => {
  const st = '#8c8170', dk = '#5d5448';
  b.add('lmk', archWall(46, 19, 9.6, 13.5, 7, 'fateh'), 0, 0, 0, 1, 1, 1, st);
  for (let x = -22; x <= 22; x += 2.2) b.box('lmk', x, 19.9, 0, 1.3, 1.8, 7.4, st);
  b.add('lmk', archWall(12.4, 15.8, 11, 15, .6, 'fatehTrim'), 0, 0, 3.7, 1, 1, 1, '#9d927f');
  for (const s of [-1, 1]) {
    b.add('lmk', 'cyl16', s * 25, 11, 0, 11, 22, 11, st);
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; b.box('lmk', s * 25 + Math.sin(a) * 5.1, 22.8, Math.cos(a) * 5.1, 1.4, 1.6, 1.4, st); }
    b.withTx(s * 4.8, 0, 3.6, s * (Math.PI / 2 - .12), 1, () => {
      b.box('paint', -s * 2.3, 6, 0, 4.6, 12, .5, '#5a3d24');
      for (let yy = 2; yy < 12; yy += 2) for (let xx = .5; xx < 4.4; xx += 1.2) b.add('metal', 'cone4', -s * xx, yy, .45, .3, .7, .3, '#3a3a3a', Math.PI / 2, 0, 0);
    });
  }
};
LM.innergate = b => {
  const st = '#857a69';
  b.add('lmk', archWall(26, 13, 9, 11, 4, 'innergate'), 0, 0, 0, 1, 1, 1, st);
  for (let x = -12; x <= 12; x += 2) b.box('lmk', x, 13.8, 0, 1.2, 1.6, 4.4, st);
  arches(b, 'lmk', -9, 7, 2.05, 0, 2, 3, 1.4, 2.6, '#4d463c'); arches(b, 'lmk', 9, 7, 2.05, 0, 2, 3, 1.4, 2.6, '#4d463c');
};
LM.balahissar = b => {
  b.add('rock', 'cone12', 0, 23, 0, 130, 46, 110, '#7d7560');
  for (let i = 0; i < 30; i++) { const ang = rr(0, 6.28), d = rr(10, 58); b.add('rock', 'dodeca', Math.sin(ang) * d, Math.max(1, 46 - d * .8), Math.cos(ang) * d * .8, rr(4, 9), rr(3, 7), rr(4, 8), pick(['#8d8378', '#9a8f82', '#7f776d', '#a39889']), rr(0, 3), rr(0, 3), 0); }
  b.withTx(0, 45, 0, 0, 1, () => { const st = '#9a8e7a'; b.box('lmk', 0, 4, 0, 18, 8, 11, st); arches(b, 'lmk', 0, 1, 5.55, 0, 5, 13, 2, 4.8, '#4d463c'); b.box('lmk', 0, 8.4, 0, 19, .8, 12, '#a99d88'); for (const x of [-6, 0, 6]) chhatri(b, x, 8.8, 0, 2, st); });
  for (let i = 0; i < 6; i++) { const z = 30 - i * 12, x = -40 + i * 7; b.box('lmk', x, 6 + i * 5.5, z, 12, 5, 2, '#857a69', .4 + i * .2); }
};
LM.tomb = b => {
  const g = '#77706a', st = '#aea596', dk = '#3f3a35';
  b.box('lmk', 0, 2, 0, 34, 4, 34, g);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; arches(b, 'lmk', Math.sin(a) * 17.05, .3, Math.cos(a) * 17.05, a, 7, 28, 3, 3.2, dk); }
  b.box('lmk', 0, 11, 0, 20, 14, 20, g);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; arches(b, 'lmk', Math.sin(a) * 10.05, 4.5, Math.cos(a) * 10.05, a, 3, 12, 4, 7.5, dk); arches(b, 'lmk', Math.sin(a) * 10.05, 13.3, Math.cos(a) * 10.05, a, 5, 14, 1.6, 2.6, dk); }
  b.box('lmk', 0, 18.6, 0, 21, 1.2, 21, st);
  for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) { b.add('lmk', 'cyl8', x, 21.5, z, 1.4, 5, 1.4, g); b.add('lmk', 'onion', x, 24, z, 1.8, 2.6, 1.8, st); }
  b.add('lmk', 'cyl24', 0, 21.7, 0, 15, 5, 15, g);
  for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283; b.add('lmk', 'cone4', Math.sin(a) * 7.4, 24.6, Math.cos(a) * 7.4, 1.4, 1.6, .6, st, 0, a, 0); }
  b.add('lmk', 'onion', 0, 24.2, 0, 16.5, 15, 16.5, '#8d857c'); b.add('lmk', 'cyl6', 0, 39.8, 0, .3, 2.6, .3, '#b89a5a'); b.add('lmk', 'sph', 0, 39.4, 0, .9, .9, .9, '#b89a5a');
};
LM.tombSmall = b => { b.withTx(0, 0, 0, 0, .62, () => LM.tomb(b)); };

/* Gates & signs (unique textured meshes) */
function gantry(tex, w = 10, h = 3.1, y = 7.2, span = 13) {
  const g = new THREE.Group(); const b = new Batch();
  for (const s of [-1, 1]) b.add('metal', 'cyl8', s * span / 2, y / 2 + 1, 0, .3, y + 2, .3, '#8a8f94');
  b.box('metal', 0, y + h / 2 + .6, -.2, span, .25, .25, '#8a8f94'); b.box('metal', 0, y - .1, -.2, span, .25, .25, '#8a8f94');
  g.add(b.build(true));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(w, h), tex); sign.position.set(0, y + h / 2 - .1, 0); g.add(sign);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), MAT.paint); back.rotation.y = Math.PI; back.position.set(0, y + h / 2 - .1, -.02); g.add(back);
  return g;
}
function plaque(lines, w = 8, h = 2) {
  const key = 'plaque|' + lines.join('|'); let m = SIGNCACHE.get(key);
  if (!m) {
    const [c, x] = mkCanvas(1024, 256); x.fillStyle = '#1b1410'; x.fillRect(0, 0, 1024, 256); x.strokeStyle = '#c9a45a'; x.lineWidth = 8; x.strokeRect(12, 12, 1000, 232);
    x.fillStyle = '#f0cf7a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 62px ${FONT_TE}`; x.fillText(lines[0], 512, 88); x.font = `800 76px ${FONT_NUM}`; x.fillText(lines[1], 512, 180);
    const t = mkTex(c, false); m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: new THREE.Color(0xffffff), emissiveIntensity: .15, roughness: .5 }); NIGHTMATS.push([m, .15, .9]); SIGNCACHE.set(key, m);
  }
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}
