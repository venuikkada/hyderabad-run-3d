/* =========================================================
   Gameplay: state, spawning, collisions, power-ups, camera
   ========================================================= */
const GRAV = 26;
const OBS = {
  auto: { hw: .72, len: 2.6, h: 1.85 }, car0: { hw: .9, len: 4.2, h: 1.45, big: 1 }, car1: { hw: .9, len: 4.2, h: 1.45, big: 1 }, car2: { hw: .9, len: 4.2, h: 1.45, big: 1 }, car3: { hw: .9, len: 4.2, h: 1.45, big: 1 }, car4: { hw: .9, len: 4.2, h: 1.45, big: 1 }, car5: { hw: .9, len: 4.2, h: 1.45, big: 1 },
  bus: { hw: 1.25, len: 10.4, h: 3.2, big: 1 }, truck: { hw: 1.25, len: 8.8, h: 3.2, big: 1 }, bike: { hw: .42, len: 1.9, h: 1.7 }, cycle: { hw: .4, len: 1.8, h: 1.75 }, cart: { hw: .8, len: 2.2, h: 2.2 },
  barricade: { hw: 1.15, len: .5, h: 1.05, k: 'low' }, cones: { hw: 1.1, len: .6, h: .85, k: 'low' }, crate: { hw: .72, len: 1.4, h: 1.1, k: 'low' }, trolley: { hw: .7, len: 1.4, h: 1.25, k: 'low' },
  bench: { hw: 1.1, len: .6, h: .95, k: 'low' }, log: { hw: 1.2, len: .8, h: .78, k: 'low' }, cannon: { hw: .7, len: 2.6, h: 1.0, k: 'low' }, goats: { hw: 1.1, len: 1.4, h: 1.0, k: 'low' }, hay: { hw: 1.2, len: 1.1, h: 1.05, k: 'low' }, hedge: { hw: 1.15, len: .9, h: .9, k: 'low' },
  scaffold: { hw: 1.2, len: .9, y0: 1.2, h: 3.6, k: 'high' }, boom: { hw: 1.2, len: .3, y0: 1.2, h: 1.5, k: 'high' }, branch: { hw: 1.2, len: .8, y0: 1.2, h: 2.4, k: 'high' },
  jcb: { hw: 1.15, len: 6.6, h: 3.2, big: 1 }, pillar: { hw: .95, len: 1.9, h: 10.5, big: 1 }, coach: { hw: 1.3, len: 22, h: 4, big: 1 }, loco: { hw: 1.3, len: 20, h: 4, big: 1 },
  rock: { hw: 1.15, len: 2.2, h: 2.4, big: 1 }, tractor: { hw: 1.15, len: 6.8, h: 2.6, big: 1 }, tourists: { hw: 1.1, len: 1.4, h: 1.9 }, booth: { hw: .85, len: 1.7, h: 2.9, big: 1 },
  wall: { hw: 1.15, len: 28, h: 2.4, big: 1 }, toytrain: { hw: .8, len: 10, h: 2.2, big: 1 },
  flyover: { hw: 1.3, len: 80, h: 4.2, big: 1, plat: { L: 80, H: 4.2, R: 16 } }
};
const KIND_OBS = {
  old: { full: ['auto', 'auto', 'cart', 'bike', 'car0', 'car1'], low: ['barricade', 'cones', 'crate'], high: ['scaffold'], on: ['auto', 'bike'], same: ['auto', 'bike', 'cycle'] },
  city: { full: ['car0', 'car1', 'car2', 'car3', 'car4', 'car5', 'bus', 'auto', 'bike', 'jcb'], low: ['barricade', 'cones', 'crate'], high: ['scaffold', 'boom'], on: ['car0', 'car2', 'auto', 'bike'], same: ['bus', 'auto', 'car1', 'car3', 'bike'] },
  hill: { full: ['car0', 'car3', 'auto', 'bus', 'bike'], low: ['barricade', 'cones'], high: ['boom'], on: ['car1', 'auto'], same: ['bus', 'auto'] },
  lake: { full: ['car0', 'car3', 'auto', 'cycle', 'bike', 'car4'], low: ['barricade', 'cones', 'bench'], high: ['boom'], on: ['car1', 'auto', 'cycle'], same: ['cycle', 'car0', 'auto'] },
  rail: { full: ['coach'], low: ['trolley', 'crate'], high: ['boom'], on: [], same: [] },
  railcity: { full: ['car0', 'auto', 'bus', 'bike', 'cart'], low: ['barricade', 'trolley', 'cones'], high: ['boom'], on: ['auto', 'bike'], same: ['bus', 'auto'] },
  campus: { full: ['cycle', 'cycle', 'bike', 'car0'], low: ['bench', 'cones', 'log'], high: ['branch'], on: ['cycle', 'bike'], same: ['cycle'] },
  zoo: { full: ['rock', 'toytrain'], low: ['log', 'bench', 'hedge'], high: ['branch'], on: [], same: ['toytrain'] },
  metro: { full: ['car0', 'car1', 'car4', 'auto', 'bus', 'bike'], low: ['barricade', 'cones', 'crate'], high: ['scaffold'], on: ['car0', 'auto'], same: ['bus', 'auto', 'car1'] },
  tech: { full: ['car0', 'car1', 'car4', 'car5', 'bus', 'auto'], low: ['barricade', 'cones'], high: ['scaffold', 'boom'], on: ['car0', 'car4', 'auto'], same: ['bus', 'car1', 'car5'] },
  bridge: { full: ['car0', 'car4', 'cycle', 'auto'], low: ['barricade', 'cones'], high: ['boom'], on: ['car0', 'cycle'], same: ['cycle', 'car4'] },
  fort: { full: ['rock', 'cart'], low: ['cannon', 'crate', 'log'], high: ['branch'], on: [], same: [] },
  tombs: { full: ['rock', 'tourists'], low: ['hedge', 'bench'], high: ['branch'], on: [], same: [] },
  outskirts: { full: ['tractor', 'truck', 'car0', 'car2'], low: ['goats', 'hay'], high: ['branch'], on: ['car0', 'truck'], same: ['tractor', 'truck'] }
};
const G = {
  state: 'loading', mode: 'endless', cfg: {}, dist: 0, startWz: 0, runDist: 0, speed: 0, time: 0, runTime: 0,
  lane: 1, prevLane: 1, px: 0, py: 0, vy: 0, grounded: true, coyote: 0, sliding: 0, slideQ: false, fastFall: false, jumpBuf: 0,
  score: 0, tokens: 0, powers: {}, shield: false, invuln: 0, dashT: 0, dashCD: 0, stumbleT: -99, tilt: 0,
  shake: 0, cine: 0, cineSide: 1, zoneIdx: 0, nextLm: null, revives: 0, stats: null, lmBanner: 0, slowmo: 1, dieT: 0, timeLeft: 0, ended: false
};
const OB = []; const PW = []; const COINS = []; const FX = [];
let player, coinMeshes = {}, shadowRing;
const SP = { nextRow: 0, lastRow: 0, reserved: [0, 0, 0], resKind: ['', '', ''], nextPower: 0 };

function newStats(startZone) { return { runDist: 0, tokens: 0, pearls: 0, stars: 0, jumps: 0, slides: 0, dashes: 0, powerups: 0, metros: 0, clean: 0, bestClean: 0, score: 0, lms: 0, lmPassed: new Set(), zonesReached: new Set([startZone]), startZone, nightDist: 0, rainDist: 0, hits: 0, startTime: 0 }; }

function initGame() {
  defineModels(); buildCollectibles();
  defModel('flyover', b => {
    const L = 80, H = 4.2, R = 16; const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(R, H); s.lineTo(L - R, H); s.lineTo(L, 0); s.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 2.6, bevelEnabled: false }); geo.rotateY(Math.PI / 2); geo.translate(-1.3, 0, 0);
    b.add('paint', prep(geo), 0, 0, 0, 1, 1, 1, '#cbc4b6');
    const a = Math.atan2(H, R), rl = Math.hypot(H, R);
    b.add('paint', 'box', 0, H / 2 + .04, -R / 2, 2.62, .1, rl, '#4a4a4e', a, 0, 0); b.box('paint', 0, H + .05, -L / 2, 2.62, .1, L - 2 * R, '#4a4a4e'); b.add('paint', 'box', 0, H / 2 + .04, -L + R / 2, 2.62, .1, rl, '#4a4a4e', -a, 0, 0);
    for (const s2 of [-1, 1]) { b.box('paint', s2 * 1.32, H + .4, -L / 2, .12, .7, L - 2 * R, '#d9d5cc'); b.box('neon', s2 * 1.33, H + .72, -L / 2, .05, .06, L - 2 * R, '#f2c21b'); }
    for (let z = -4; z > -L; z -= 3.2) for (const s2 of [-1, 1]) b.box('paint', s2 * 1.31, Math.min(H, Math.min(-z / R, (L + z) / R) * H) / 2, z, .02, Math.min(H, Math.min(-z / R, (L + z) / R) * H) * .9, 2.6, '#b8b1a3');
  });
  const tokenMesh = new THREE.InstancedMesh(COINGEO.token, [MAT.gold, MAT.coinFace, MAT.coinFace], 260);
  const pearlMesh = new THREE.InstancedMesh(COINGEO.pearl, MAT.pearl, 80);
  const starMesh = new THREE.InstancedMesh(COINGEO.star, MAT.star, 20);
  for (const m of [tokenMesh, pearlMesh, starMesh]) { m.count = 0; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); }
  coinMeshes = { token: tokenMesh, pearl: pearlMesh, star: starMesh };
  player = new PlayerAvatar(); player.build(charDef()); scene.add(player.g);
  shadowRing = new THREE.Mesh(new THREE.RingGeometry(.5, 1.1, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: .6, depthWrite: false })); shadowRing.visible = false; scene.add(shadowRing);
}

/* ---------- obstacles ---------- */
function spawnOb(type, lane, wz, opt = {}) {
  const d = OBS[type]; const m = inst(type.startsWith('car') ? type : type);
  const o = { type, d, lane, x: LANE_X[lane], wz, len: d.len, hw: d.hw, y0: d.y0 || 0, y1: d.h, kind: d.k || 'full', big: !!d.big, v: opt.v || 0, mesh: m, yOff: opt.yOff || 0, falls: !!opt.falls, plat: d.plat || null, pxo: false, pzo: false, dead: false, horn: false };
  if (opt.flip) m.rotation.y = Math.PI;
  if (o.plat) m.position.set(o.x, 0, -wz); else m.position.set(o.x, o.yOff, -(wz + o.len / 2));
  root.add(m); OB.push(o); return o;
}
function platHeight(o, wzP) { const p = o.plat, dz = wzP - o.wz; if (dz < 0 || dz > p.L) return 0; return Math.max(0, Math.min(dz / p.R, 1, (p.L - dz) / p.R)) * p.H; }
function laneBusy(lane, z0, z1) { for (const o of OB) if (!o.dead && o.lane === lane && o.wz < z1 && o.wz + o.len > z0 && o.kind === 'full') return true; return false; }
function laneHasAny(lane, z0, z1) { for (const o of OB) if (!o.dead && o.lane === lane && o.wz < z1 && o.wz + o.len > z0) return o; return null; }

function spawnAhead() {
  const ahead = G.dist + clamp(G.speed * 7.5, 110, 200);
  let guard = 0;
  while (SP.nextRow < ahead && guard++ < 6) spawnRow(SP.nextRow);
}
function trafficMul() { return (G.cfg.traffic || 1) * S.settings.traffic; }
function spawnRow(wz) {
  const zi = zoneIndexAt(wz), z = ZONES[zi], loc = zoneLocal(wz), kind = z.kind;
  const spd = Math.max(12, G.speed); const d = clamp(G.runDist / 7000, 0, 1);
  const tm = trafficMul();
  let gap = clamp(spd * lerp(1.6, .95, d) / Math.sqrt(tm), 14, 44);
  const nearLm = z.lm && Math.abs(loc - z.lm.at) < 45;
  const nearGate = z.pieces.some(p => ['charminar', 'kaman', 'fateh', 'innergate', 'zoogate', 'metrostation'].includes(p.t) && loc > p.at - 26 && loc < p.at + 30);
  const zoneEdge = loc < 12 || loc > z.len - 6;
  const prev = SP.lastRow; SP.lastRow = wz; SP.nextRow = wz + gap;
  if (G.mode === 'free' || G.cfg.noObstacles || wz < G.startWz + 55 || nearLm || nearGate || zoneEdge) { if (wz > G.startWz + 20) coinTrail(ri(0, 2), prev + 4, wz - 2, 'free'); return; }
  const K = KIND_OBS[kind] || KIND_OBS.city; const free = [0, 1, 2].filter(l => SP.reserved[l] < wz);
  const bridge = bridgeAt(z, loc);
  const rowT = []; // per lane: 'free' | 'low' | 'high' | 'full' | 'route'
  for (let l = 0; l < 3; l++) rowT[l] = SP.reserved[l] >= wz ? (SP.resKind[l] === 'route' ? 'route' : 'full') : 'free';
  // specials
  const r = Math.random();
  if (free.length === 3) {
    if (kind === 'rail' && r < .14) { for (let l = 0; l < 3; l++) spawnOb('boom', l, wz); coinTrail(1, prev + 4, wz + 6, 'high'); powerMaybe(wz); return; }
    if (z.security && r < .22) { const bl = ri(0, 2); for (let l = 0; l < 3; l++) spawnOb(l === bl ? 'booth' : 'boom', l, wz); coinTrail((bl + 1) % 3, prev + 4, wz - 2, 'high'); SP.nextRow += 6; return; }
    if ((bridge === 'cable' || bridge === 'musi') && r < .3) { spawnOb('wall', 0, wz); spawnOb('wall', 2, wz); SP.reserved[0] = SP.reserved[2] = wz + 30; SP.resKind[0] = SP.resKind[2] = 'full'; coinTrail(1, wz + 2, wz + 26, 'free'); SP.nextRow = wz + 34; return; }
    if (z.flyover && r < .1) { const l = pick([0, 2]); spawnOb('flyover', l, wz); SP.reserved[l] = wz + 82; SP.resKind[l] = 'route'; coinTrail(l, wz + 18, wz + 62, 'deck'); }
    if (kind === 'rail' && r > .75) { // oncoming train in a track
      const l = ri(0, 2); const v = -rr(8, 11); const meet = G.dist + (wz - G.dist) * spd / (spd + (-v));
      if (!laneHasAny(l, meet - 10, wz + 50)) { spawnOb('loco', l, wz, { v }); spawnOb('coach', l, wz + 21, { v }); if (G.cfg.trains === 2) spawnOb('coach', l, wz + 44, { v }); SP.reserved[l] = wz + 70; SP.resKind[l] = 'full'; }
    }
  }
  const nFree = [0, 1, 2].filter(l => SP.reserved[l] < wz);
  if (!nFree.length) { SP.nextRow = wz + 8; return; }
  // choose how many lanes to block
  let k = Math.random() < lerp(.55, .3, d) / tm ? 1 : Math.random() < .75 ? 2 : 3; k = Math.min(k, nFree.length);
  const lanes = nFree.slice().sort(() => Math.random() - .5); const blocked = lanes.slice(0, k);
  if (kind === 'metro' && SP.reserved[1] < wz && Math.random() < .75 && !blocked.includes(1)) { blocked.pop(); blocked.push(1); }
  for (const l of blocked) {
    let t, cat;
    if (kind === 'metro' && l === 1) { t = 'pillar'; cat = 'full'; }
    else {
      const pr = Math.random(); cat = pr < .5 ? 'full' : pr < .78 ? 'low' : 'high';
      if (kind === 'rail' && cat === 'full' && G.cfg.trains !== 2 && Math.random() < .5) cat = 'low';
      t = pick(K[cat] && K[cat].length ? K[cat] : K.full);
      if (z.idx === 1 && cat === 'full' && Math.random() < .3) t = 'tourists';
    }
    rowT[l] = OBS[t].k || 'full';
    // moving?
    let v = 0, flip = Math.random() < .5;
    if (cat === 'full' && K.on.includes(t) && Math.random() < lerp(.15, .45, d) * tm) { v = -rr(5, 9); flip = false; }
    else if (cat === 'full' && K.same.includes(t) && Math.random() < .5) { v = rr(2, 5); flip = true; }
    if (t === 'toytrain') { v = 3.5; flip = true; }
    if (v < 0) { const meet = G.dist + (wz - G.dist) * spd / (spd - v); if (laneHasAny(l, meet - 6, wz)) v = 0; }
    const falls = t === 'crate' && (kind === 'city' || kind === 'tech' || kind === 'old' || kind === 'metro') && Math.random() < .5;
    const o = spawnOb(t, l, wz, { v, flip: v > 0 ? true : (v < 0 ? false : flip), falls, yOff: falls ? 16 : 0 });
    if (t === 'coach' && Math.random() < .5) { spawnOb('coach', l, wz + 23); SP.reserved[l] = wz + 46; SP.resKind[l] = 'full'; }
    const len = o.len; if (len > 3) { SP.reserved[l] = Math.max(SP.reserved[l], wz + len + 2); SP.resKind[l] = 'full'; }
    if (v > 0) { const tt = (wz - G.dist) / Math.max(1, spd - v); SP.reserved[l] = Math.max(SP.reserved[l], wz + v * tt + len + 6); SP.resKind[l] = 'full'; }
  }
  // guarantee a passable lane
  if (!rowT.some(x => x !== 'full')) { const o = OB[OB.length - 1]; if (o && o.wz === wz) { o.dead = true; root.remove(o.mesh); rowT[o.lane] = 'free'; } }
  // coins
  if (Math.random() < .68) {
    const opts = [0, 1, 2].filter(l => rowT[l] !== 'full'); const l = pick(opts);
    coinTrail(l, prev + 4, wz + (rowT[l] === 'free' ? -2 : 1.5), rowT[l]);
  }
  powerMaybe(wz, rowT);
}
function powerMaybe(wz, rowT) {
  if (wz < SP.nextPower || G.mode === 'free') return; SP.nextPower = wz + rr(300, 520);
  const lanes = [0, 1, 2].filter(l => !rowT || rowT[l] === 'free'); if (!lanes.length) return; const l = pick(lanes);
  const types = [['magnet', .22], ['shield', .18], ['dash', .14], ['cyber', .17], ['metro', .12], ['lake', .17]]; let r = Math.random(), t = 'magnet'; for (const [n, w] of types) { if ((r -= w) < 0) { t = n; break; } }
  const m = powerMesh(t); m.position.set(LANE_X[l], 1.25, -(wz - 12)); root.add(m); PW.push({ t, lane: l, x: LANE_X[l], wz: wz - 12, mesh: m, dead: false });
}
function coinTrail(lane, z0, z1, mode) {
  if (z1 - z0 < 5) return; const r = Math.random(); const type = r < .1 ? 'pearl' : 'token';
  const step = type === 'pearl' ? 4 : 2.4; const n = Math.min(14, Math.floor((z1 - z0) / step));
  let starAt = Math.random() < .03 ? ri(2, Math.max(2, n - 2)) : -1;
  for (let i = 0; i < n; i++) {
    const wz = z1 - i * step; let y = 1.0;
    if (mode === 'deck') { const o = OB[OB.length - 1]; y = (o && o.plat ? platHeight(o, wz) : 4.2) + 1.0; }
    else { const ob = laneHasAny(lane, wz - 1.2, wz + 1.2); if (ob) { if (ob.kind === 'full' || ob.plat) continue; if (ob.kind === 'high') y = .55; else { y = 1.0; } } }
    if (mode === 'low') { const ob = z1 - 1.5; y = 1 + 1.5 * Math.max(0, 1 - Math.abs(wz - ob) / 5.5); }
    COINS.push({ type: i === starAt ? 'star' : type, x: LANE_X[lane], y, wz, dead: false, mag: false, spin: Math.random() * 6 });
  }
}
function airCoins(fromWz, len) { for (let l = 0; l < 3; l++) if (Math.random() < .7) for (let z = fromWz; z < fromWz + len; z += 3) COINS.push({ type: 'token', x: LANE_X[l], y: 8.6, wz: z, dead: false, mag: false, spin: 0 }); }
function clearRun() {
  for (const o of OB) root.remove(o.mesh); OB.length = 0; for (const p of PW) root.remove(p.mesh); PW.length = 0; COINS.length = 0;
  for (const f of FX) root.remove(f.m); FX.length = 0; shadowRing.visible = false;
}
function clearAhead(z0, z1) { for (const o of OB) if (!o.dead && o.wz < z1 && o.wz + o.len > z0 && !o.plat) { o.dead = true; root.remove(o.mesh); } }

/* ---------- player actions ---------- */
function act(a) {
  if (G.state !== 'playing') return;
  if (a === 'left' && G.lane > 0) { G.prevLane = G.lane; G.lane--; AU.lane(); G.tilt = .18; }
  else if (a === 'right' && G.lane < 2) { G.prevLane = G.lane; G.lane++; AU.lane(); G.tilt = -.18; }
  else if (a === 'jump') { if (G.grounded || G.coyote > 0) doJump(); else G.jumpBuf = .16; }
  else if (a === 'slide') { if (G.powers.metro) return; if (G.grounded) doSlide(); else { G.fastFall = true; G.slideQ = true; } }
  else if (a === 'dash') { if (G.dashCD <= 0) { G.dashT = .75; G.dashCD = 7; G.stats.dashes++; AU.dash(); G.shake = Math.max(G.shake, .25); burst(G.px, .6, 0, '#f7d98f', 16, 3, 1.5); } }
}
function doJump() { if (G.powers.metro) return; G.vy = G.powers.lake ? 13.2 : 9.3; G.grounded = false; G.coyote = 0; G.sliding = 0; G.stats.jumps++; AU.jump(); }
function doSlide() { G.sliding = .78; G.stats.slides++; AU.slide(); }

/* ---------- power-ups ---------- */
function givePower(t) {
  const P = POWERS[t]; G.stats.powerups++; AU.power();
  if (t === 'shield') { G.shield = true; G.powers.shield = P.dur; }
  else G.powers[t] = P.dur;
  if (t === 'metro') { G.stats.metros++; G.grounded = false; G.vy = 7; airCoins(G.dist + 20, G.speed * 1.9 * P.dur); AU.metroChime(); }
  toast('<b>' + P.name + '</b> · ' + P.desc);
}
function updatePowers(dt) {
  for (const k in G.powers) { G.powers[k] -= dt; if (G.powers[k] <= 0) { delete G.powers[k]; if (k === 'shield') G.shield = false; if (k === 'metro') { G.invuln = Math.max(G.invuln, 1.4); clearAhead(G.dist - 2, G.dist + 40); } } }
}

/* ---------- collisions ---------- */
function collide() {
  const pz0 = G.dist - .35, pz1 = G.dist + .35; const ph = G.sliding > 0 ? .85 : 1.72; let ground = 0;
  for (const o of OB) {
    if (o.dead) continue; if (o.wz > pz1 + 2 || o.wz + o.len < pz0 - 2) { o.pzo = false; continue; }
    const xo = Math.abs(G.px - o.x) < o.hw + .3; const zo = o.wz <= pz1 && o.wz + o.len >= pz0;
    if (o.plat) {
      if (Math.abs(LANE_X[G.lane] - o.x) < .1 || xo) { const h = platHeight(o, G.dist); if (xo && zo) { if (G.py >= h - .7) ground = Math.max(ground, h); else if (!o.pxo && o.pzo) hitOb(o, true); } }
      o.pxo = xo; o.pzo = zo; continue;
    }
    if (xo && zo) {
      const y0 = o.y0 + o.yOff, y1 = o.y1 + o.yOff;
      if (!(G.py + ph < y0 || G.py > y1 - .05)) hitOb(o, o.pzo && !o.pxo);
    }
    o.pxo = xo; o.pzo = zo;
  }
  return ground;
}
function hitOb(o, side) {
  if (o.dead || G.state !== 'playing') return;
  if (G.invuln > 0 || G.powers.metro) { if (G.powers.dash || G.powers.metro || G.dashT > 0) knock(o); return; }
  if (G.powers.dash || (G.dashT > 0 && !o.big)) { knock(o); G.shake = Math.max(G.shake, .35); AU.crash(); return; }
  if (side) { stumble(o); return; }
  if (G.shield) { G.shield = false; delete G.powers.shield; G.invuln = 1; knock(o); AU.shieldBreak(); G.shake = .6; G.stats.hits++; burst(G.px, 1.2, 0, '#22b3a6', 30, 5, 3); toast('Charminar Shield absorbed the hit'); return; }
  crash(o);
}
function knock(o) { o.dead = true; o.fly = { vx: (o.x - G.px || rr(-1, 1)) * 4 + rr(-3, 3), vy: rr(6, 10), rs: rr(-6, 6), t: 1.6 }; FX.push({ m: o.mesh, o }); burst(o.x, 1, -(o.wz - G.dist), '#ffd27a', 20, 5, 4); }
function stumble(o) {
  G.stats.hits++; G.stats.bestClean = Math.max(G.stats.bestClean, G.stats.clean); G.stats.clean = 0;
  if (G.cfg.noHit) { failRun('You collided. This challenge needs a clean run.'); return; }
  const lane = G.prevLane; G.prevLane = G.lane; G.lane = lane; G.shake = .5; AU.stumble(); flashHit();
  if (G.time - G.stumbleT < 6) { crash(o); return; }
  G.stumbleT = G.time; G.speed *= .75; toast('Careful! Another stumble ends the run');
}
function crash(o) {
  if (G.cfg.noHit && G.state === 'playing') { G.stats.hits++; }
  G.state = 'dying'; G.dieT = 0; G.slowmo = .35; G.shake = 1.1; AU.crash(); flashHit(); G.stats.hits++;
  G.stats.bestClean = Math.max(G.stats.bestClean, G.stats.clean);
}

/* ---------- run lifecycle ---------- */
function startRun(cfg) {
  AU.init(); clearRun(); clearAmbient();
  G.cfg = cfg; G.mode = cfg.mode; const zi = cfg.zone || 0;
  G.startWz = ZSTART[zi]; G.dist = G.startWz; G.runDist = 0; G.runTime = 0; G.speed = 0; G.score = 0; G.tokens = 0; G.powers = {}; G.shield = false; G.invuln = 0; G.dashT = 0; G.dashCD = 0;
  G.lane = 1; G.prevLane = 1; G.px = 0; G.py = 0; G.vy = 0; G.grounded = true; G.sliding = 0; G.slideQ = false; G.fastFall = false; G.stumbleT = -99; G.revives = 0; G.ended = false;
  G.zoneIdx = zi; G.stats = newStats(zi); G.lmNext = null; G.cine = 0; G.slowmo = 1; G.timeLeft = cfg.timeLimit || 0;
  SP.nextRow = G.startWz + 30; SP.lastRow = G.startWz; SP.reserved = [0, 0, 0]; SP.resKind = ['', '', '']; SP.nextPower = G.startWz + rr(200, 300);
  player.build(charDef()); player.g.rotation.set(0, 0, 0);
  resetWorld(G.startWz);
  const s = S.settings;
  ENV.tod = cfg.tod != null ? cfg.tod : s.tod !== 'auto' ? { dawn: .02, day: .25, sunset: .5, night: .75 }[s.tod] : (zi === 0 ? .02 : rr(.05, .6));
  setWeather(cfg.weather || (s.weather !== 'auto' ? s.weather : 'clear'), true); ENV.weatherTimer = rr(80, 140);
  setSkyInstant(ZONES[zi].kind);
  unlockZone(zi);
  updateHudStatic();
}
function beginPlaying() { G.state = 'playing'; showHUD(true); AU.intensity = 1; G.stats.startTime = G.time; }
function failRun(msg) { G.failMsg = msg; crash(null); }
function endRun(completed) {
  if (G.ended) return; G.ended = true;
  const st = G.stats; st.score = G.score; st.bestClean = Math.max(st.bestClean, st.clean);
  const res = { mode: G.mode, dist: G.runDist, score: Math.round(G.score), tokens: G.tokens, lms: st.lms, zone: G.zoneIdx, completed, newBest: false, reward: 0 };
  if (G.mode !== 'free') {
    S.runs++; S.totalDist += G.runDist; S.tokens += G.tokens; S.totalTokens += G.tokens; S.lastZone = G.zoneIdx; S.lastDist = G.runDist;
    if (res.score > S.best.score) { S.best.score = res.score; res.newBest = true; } if (G.runDist > S.best.dist) S.best.dist = G.runDist;
    S.board.push({ name: S.name || 'Runner', home: S.home, dist: Math.round(G.runDist), score: res.score, lms: st.lms, date: Date.now(), mode: G.mode, char: S.chars.sel });
    S.board.sort((a, b) => b.score - a.score); S.board = S.board.slice(0, 60);
  }
  // mode results
  if (G.mode === 'tour' && completed) { const z = G.cfg.zone; const stars = 1 + (G.cfg.tourTok <= st.tokens ? 1 : 0) + (st.hits === 0 ? 1 : 0); res.stars = stars; S.tour[z] = Math.max(S.tour[z] || 0, stars); res.reward = 60 * stars; }
  if (G.mode === 'ta' && completed) { const id = G.cfg.route.id; const t = G.runTime; res.time = t; if (!S.ta[id] || t < S.ta[id]) { S.ta[id] = t; res.newBestTime = true; } res.reward = 150; }
  if (G.mode === 'challenge' && completed) { const id = G.cfg.chal.id; if (!S.chal[id]) { res.reward = G.cfg.chal.reward; } S.chal[id] = true; }
  S.tokens += res.reward; save();
  G.state = 'results'; showHUD(false); AU.intensity = 0; showResults(res);
}
function checkGoal() {
  const c = G.cfg; const st = G.stats;
  if (G.mode === 'tour') { if (G.zoneIdx !== c.zone && st.zonesReached.has((c.zone + 1) % ZONES.length)) endRun(true); }
  else if (G.mode === 'ta') { if (st.zonesReached.has(c.route.to)) endRun(true); else if (G.timeLeft <= 0) { G.failMsg = 'Out of time. The clock beat you to ' + ZONES[c.route.to].name + '.'; endRun(false); } }
  else if (G.mode === 'challenge') {
    const g = c.chal.goal; let done = false;
    if (g.type === 'dist') done = st.runDist >= g.n; else if (g.type === 'tokens') done = st.tokens >= g.n; else if (g.type === 'landmarks') done = st.lms >= g.n; else if (g.type === 'time') done = G.runTime >= g.n; else if (g.type === 'zone') done = st.zonesReached.has(g.n);
    if (done) endRun(true);
  }
}

/* ---------- main update ---------- */
const _v = new THREE.Vector3(), _look = new THREE.Vector3(), camLook = new THREE.Vector3(0, 2, -10);
function updateRun(dt) {
  const st = G.stats;
  // speed
  let target = speedAt(G.runDist) * (G.cfg.speedMul || 1);
  if (G.mode === 'free') target = G.cfg.cruise || 11;
  if (G.dashT > 0) target *= 1.55; if (G.powers.dash) target *= 1.35; if (G.powers.metro) target *= 1.9;
  G.speed = damp(G.speed, target, G.speed < target ? 1.6 : 3, dt);
  const dz = G.speed * dt; G.dist += dz; G.runDist += dz; G.runTime += dt;
  G.dashT -= dt; G.dashCD -= dt; G.invuln -= dt; G.coyote -= dt; G.jumpBuf -= dt;
  updatePowers(dt);
  // lane movement
  const tx = LANE_X[G.lane]; const dx = tx - G.px; const mv = 15 * dt; G.px = Math.abs(dx) < mv ? tx : G.px + Math.sign(dx) * mv;
  G.tilt = damp(G.tilt, 0, 6, dt);
  // vertical
  const ground = collide();
  if (G.state !== 'playing') return;
  if (G.powers.metro) { G.py = damp(G.py, 7.6, 3, dt); G.vy = 0; G.grounded = false; }
  else if (!G.grounded) {
    G.vy -= GRAV * dt * (G.fastFall ? 3 : 1); G.py += G.vy * dt;
    if (G.py <= ground) { G.py = ground; G.vy = 0; G.grounded = true; G.fastFall = false; AU.land(); burst(G.px, .1, 0, '#d8cbb0', 8, 2, 1); if (G.slideQ) { G.slideQ = false; doSlide(); } else if (G.jumpBuf > 0) doJump(); }
  } else {
    if (ground < G.py - .08) { G.grounded = false; G.vy = 0; G.coyote = .1; } else G.py = ground;
  }
  if (G.sliding > 0) G.sliding -= dt;
  // stats
  st.runDist = G.runDist; st.clean += dz; st.bestClean = Math.max(st.bestClean, st.clean);
  if (ENV.night > .6) st.nightDist += dz; if (ENV.rain > .3) st.rainDist += dz;
  const mult = (1 + S.multLevel) * (G.powers.cyber ? 2 : 1); G.mult = mult;
  G.score += dz * mult; st.score = G.score;
  // zone & landmarks
  const zi = zoneIndexAt(G.dist);
  if (zi !== G.zoneIdx) { G.zoneIdx = zi; st.zonesReached.add(zi); if (unlockZone(zi)) { toast('Unlocked on the map: <b>' + ZONES[zi].name + '</b>'); save(); } if (G.mode === 'ta') { G.timeLeft += 0; toast('Checkpoint · ' + ZONES[zi].name); } }
  const nl = nextLandmark(G.dist - 1);
  if (nl) {
    const togo = nl.wz - G.dist;
    if (togo < 30 && G.lmShown !== nl.wz) { G.lmShown = nl.wz; showBanner(nl.z); G.cine = 3.4; G.cineSide = nl.z.lm.side || (Math.random() < .5 ? -1 : 1); G.cineZone = nl.z; AU.landmark(); }
    if (togo <= 0 && G.lmPassed !== nl.wz) { G.lmPassed = nl.wz; }
  }
  if (G.lmPassed && G.lmPassed <= G.dist && G.lmCounted !== G.lmPassed) { G.lmCounted = G.lmPassed; const z = zoneAt(G.lmPassed - 1); st.lms++; st.lmPassed.add(z.idx); G.score += 500 * mult; toast('Landmark crossed · <b>+' + fmtIN(500 * mult) + '</b>'); }
  // spawns & moving obstacles
  spawnAhead();
  for (let i = OB.length - 1; i >= 0; i--) {
    const o = OB[i];
    if (!o.dead) {
      if (o.v) { o.wz += o.v * dt; o.mesh.position.z = -(o.wz + o.len / 2); if (o.v < 0 && !o.horn && o.wz - G.dist < 45) { o.horn = true; o.type === 'loco' ? AU.trainHorn() : AU.horn(.08, o.type === 'bus' || o.type === 'truck'); } }
      if (o.falls) { const trig = o.wz - G.dist < 36; if (trig) { o.fv = (o.fv || 0) + GRAV * dt; o.yOff = Math.max(0, o.yOff - o.fv * dt); o.mesh.position.y = o.yOff; o.mesh.rotation.z += dt * 2 * (o.yOff > 0 ? 1 : 0); if (o.yOff === 0 && !o.landed) { o.landed = true; G.shake = Math.max(G.shake, .2); burst(o.x, .3, -(o.wz - G.dist), '#c9b08a', 14, 4, 2); } } }
    }
    if (o.wz + o.len < G.dist - 20 || o.wz > G.dist + 400) { root.remove(o.mesh); OB.splice(i, 1); }
  }
  // falling-object warning ring
  let ring = null; for (const o of OB) if (o.falls && !o.landed && !o.dead && o.wz - G.dist < 60 && o.wz > G.dist) { ring = o; break; }
  if (ring) { shadowRing.visible = true; shadowRing.position.set(ring.x, .06, -(ring.wz + .7 - G.dist)); const s = 1 - ring.yOff / 16 * .6; shadowRing.scale.set(s, 1, s); shadowRing.material.opacity = .35 + Math.sin(G.time * 14) * .25; } else shadowRing.visible = false;
  // knocked obstacles
  for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i]; const fl = f.o.fly; fl.t -= dt; fl.vy -= GRAV * dt; f.m.position.x += fl.vx * dt; f.m.position.y += fl.vy * dt; f.m.rotation.x += fl.rs * dt; f.m.rotation.z += fl.rs * .6 * dt; if (fl.t <= 0) { root.remove(f.m); FX.splice(i, 1); } }
  // power pickups
  for (let i = PW.length - 1; i >= 0; i--) {
    const p = PW[i]; p.mesh.rotation.y += dt * 2; p.mesh.position.y = 1.25 + Math.sin(G.time * 3 + i) * .15; if (p.mesh.userData.inner) p.mesh.userData.inner.rotation.y += dt * 3;
    if (!p.dead && Math.abs(p.wz - G.dist) < 1 && Math.abs(p.x - G.px) < 1 && G.py < 3) { p.dead = true; givePower(p.t); burst(p.x, 1.3, 0, POWERS[p.t].color, 30, 4, 3); root.remove(p.mesh); PW.splice(i, 1); continue; }
    if (p.wz < G.dist - 10) { root.remove(p.mesh); PW.splice(i, 1); }
  }
  updateCoins(dt);
  // missions
  checkMissions();
  if (G.mode === 'ta') { G.timeLeft -= dt; }
  checkGoal();
  // weather & time drift
  if (S.settings.tod === 'auto' && G.cfg.tod == null) ENV.tod = (ENV.tod + dt / 480) % 1;
  if (S.settings.weather === 'auto' && !G.cfg.weather) { ENV.weatherTimer -= dt; if (ENV.weatherTimer <= 0) { ENV.weatherTimer = rr(70, 150); const r = Math.random(); setWeather(r < .55 ? 'clear' : r < .75 ? 'light' : r < .87 ? 'heavy' : 'fog'); } }
}
const _m = new THREE.Matrix4(), _qq = new THREE.Quaternion(), _pp = new THREE.Vector3(), _ss = new THREE.Vector3(1, 1, 1), _eu = new THREE.Euler();
function updateCoins(dt) {
  const counts = { token: 0, pearl: 0, star: 0 }; const mag = G.powers.magnet ? 30 : G.powers.cyber ? 8 : G.powers.metro ? 6 : 0;
  const py = G.py + .9;
  for (let i = COINS.length - 1; i >= 0; i--) {
    const c = COINS[i];
    if (c.wz < G.dist - 6) { COINS.splice(i, 1); continue; }
    const dzc = c.wz - G.dist;
    if (mag && dzc < mag && dzc > -2 && (G.powers.magnet || Math.abs(c.x - G.px) < 3)) c.mag = true;
    if (c.mag) { const k = 1 - Math.exp(-10 * dt); c.x = lerp(c.x, G.px, k); c.y = lerp(c.y, py, k); c.wz = lerp(c.wz, G.dist + .2, k); }
    if (Math.abs(c.wz - G.dist) < .9 && Math.abs(c.x - G.px) < .8 && Math.abs(c.y - py) < 1.3) { collect(c); COINS.splice(i, 1); continue; }
    if (dzc > Q.draw) continue;
    const m = coinMeshes[c.type]; const n = counts[c.type]; if (n >= m.instanceMatrix.count) continue;
    c.spin += dt * 4; _eu.set(0, c.spin, 0); _qq.setFromEuler(_eu); _pp.set(c.x, c.y + Math.sin(c.spin * .7) * .08, -(dzc)); m.setMatrixAt(n, _m.compose(_pp, _qq, _ss)); counts[c.type]++;
  }
  for (const k in coinMeshes) { coinMeshes[k].count = counts[k]; coinMeshes[k].instanceMatrix.needsUpdate = true; }
}
function collect(c) {
  const mult = G.mult || 1; const st = G.stats;
  if (c.type === 'token') { G.tokens += G.powers.cyber ? 2 : 1; st.tokens = G.tokens; G.score += 10 * mult; AU.coin(); burst(c.x, c.y, 0, '#ffd27a', 5, 1.5, 1.5); }
  else if (c.type === 'pearl') { G.tokens += 5; st.tokens = G.tokens; st.pearls++; G.score += 50 * mult; AU.pearl(); burst(c.x, c.y, 0, '#ffffff', 10, 2, 2); }
  else { G.tokens += 25; st.tokens = G.tokens; st.stars++; G.score += 250 * mult; AU.star(); burst(c.x, c.y, 0, '#ffb13b', 24, 3, 3); toast('<b>Hyderabad Star</b> · +25 tokens'); }
}
function checkMissions() {
  if (G.mode === 'free') return; const m = S.mis; let changed = false;
  for (let s = 0; s < 3; s++) { if (m.done[s]) continue; const mi = missionAt(m.tier, s); if (missionProgress(mi, G.stats) >= 1) { m.done[s] = true; changed = true; const rw = 25 + m.tier * 5; S.tokens += rw; toast('Mission complete · ' + missionText(mi) + ' · <b>+' + rw + '</b>'); AU.mission(); } }
  if (m.done.every(Boolean)) { m.tier = Math.min(MIS_TOTAL / 3 - 1, m.tier + 1); m.done = [false, false, false]; S.multLevel = Math.min(99, S.multLevel + 1); toast('Mission set complete · score multiplier now <b>×' + (1 + S.multLevel) + '</b>'); changed = true; }
  if (changed) save();
}

/* ---------- camera ---------- */
function updateCamera(dt) {
  const metro = !!G.powers.metro; const cine = G.cine > 0 ? smooth(Math.min(1, G.cine / .8)) * smooth(Math.min(1, (3.4 - G.cine) / .8)) : 0;
  const side = G.cineSide || 1;
  const por = camera.aspect < .9;
  _v.set(G.px * (por ? .35 : .55) + cine * side * -3.5, (por ? 4.1 : 3.3) + G.py * .55 + (metro ? 2.5 : 0) + cine * 2.2, (por ? 7.4 : 6.2) + (metro ? 2.5 : 0) + cine * 1.5);
  _look.set(G.px * .75 + cine * side * 6, 1.4 + G.py * .6 + cine * 5, -9 - cine * 8);
  if (G.state === 'dying') { _v.set(G.px + 2.5, 2.4 + G.py, 4.5); _look.set(G.px, .8 + G.py, 0); }
  const k = 1 - Math.exp(-(G.state === 'dying' ? 3 : 7) * dt);
  camera.position.lerp(_v, k); camLook.lerp(_look, 1 - Math.exp(-6 * dt));
  const sh = S.settings.shake ? G.shake : G.shake * .2; const t = G.time * 40;
  camera.position.x += Math.sin(t * 1.3) * sh * .18; camera.position.y += Math.sin(t * 1.7 + 1) * sh * .14;
  camera.lookAt(camLook);
  const fov = clamp((por ? 70 : 60) + (G.speed - 12) * .5, por ? 70 : 60, por ? 86 : 80) + cine * 4 + (G.dashT > 0 ? 5 : 0);
  camera.fov = damp(camera.fov, fov, 4, dt); camera.updateProjectionMatrix();
  G.shake *= Math.exp(-5 * dt); G.cine -= dt;
}
