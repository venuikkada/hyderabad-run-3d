/* =========================================================
   World: renderer, sky, time-of-day, weather, chunk streaming
   ========================================================= */
let renderer, scene, camera, root, hemi, sun, skyMesh, skyUni, composer = null, bloomPass = null;
let skylineA, skylineB, skyLightsA, skyLightsB, rainLines, blob;
const QUALITY = {
  low: { pr: 1, shadows: false, shadowSize: 512, draw: 170, bloom: false, chunkShadow: false },
  medium: { pr: 1.35, shadows: true, shadowSize: 1024, draw: 230, bloom: false, chunkShadow: false },
  high: { pr: 2, shadows: true, shadowSize: 2048, draw: 290, bloom: true, chunkShadow: true }
};
const IS_TOUCH = matchMedia('(pointer:coarse)').matches;
let Q = QUALITY.high;
function resolveQuality() { const q = S.settings.quality; Q = QUALITY[q === 'auto' ? (IS_TOUCH ? 'medium' : 'high') : q] || QUALITY.high; }

function initRenderer() {
  resolveQuality();
  const canvas = $('#gl');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: Q !== QUALITY.low, powerPreference: 'high-performance' });
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xcfd8e0, 60, 280);
  camera = new THREE.PerspectiveCamera(62, 1, .1, 2000);
  root = new THREE.Group(); scene.add(root);
  hemi = new THREE.HemisphereLight(0xe6f2ff, 0x6a5a48, .75); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.castShadow = true;
  const sc = sun.shadow.camera; sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 220; sun.shadow.bias = -0.0006; sun.shadow.normalBias = .02;
  scene.add(sun, sun.target);
  // sky dome
  skyUni = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, night: { value: 0 }, cloud: { value: 0 } };
  skyMesh = new THREE.Mesh(new THREE.SphereGeometry(1600, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyUni, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; uniform vec3 sunCol; uniform float night; uniform float cloud; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
      void main(){ float y = max(vD.y, 0.0); vec3 c = mix(hor, top, pow(y, 0.55)); if (vD.y < 0.0) c = hor*0.85;
        float sd = max(dot(vD, normalize(sunDir)), 0.0); c += sunCol * (pow(sd, 600.0)*2.2 + pow(sd, 12.0)*0.35) * (1.0-cloud*0.8);
        vec3 q = floor(vD*420.0); float st = step(0.9982, h(q)) * night * smoothstep(0.05, 0.3, vD.y) * (1.0-cloud); c += vec3(st)*0.9;
        c = mix(c, vec3(dot(c, vec3(0.33))), cloud*0.55);
        gl_FragColor = vec4(c, 1.0); }`
  }));
  skyMesh.renderOrder = -10; scene.add(skyMesh);
  // skylines
  const skyGeo = new THREE.CylinderGeometry(900, 900, 150, 64, 1, true); skyGeo.translate(0, 70, 0);
  const mkSky = t => { const m = new THREE.MeshBasicMaterial({ map: t.map, transparent: true, side: THREE.BackSide, fog: false, depthWrite: false, color: 0x9aa4b0 }); m.map.repeat.set(3, 1); return new THREE.Mesh(skyGeo, m); };
  const mkLights = t => { const m = new THREE.MeshBasicMaterial({ map: t.emi, transparent: true, side: THREE.BackSide, fog: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }); m.map.repeat.set(3, 1); return new THREE.Mesh(skyGeo, m); };
  skylineA = mkSky(TX.skyOld); skylineB = mkSky(TX.skyCity); skyLightsA = mkLights(TX.skyOld); skyLightsB = mkLights(TX.skyCity);
  for (const m of [skylineA, skylineB, skyLightsA, skyLightsB]) { m.renderOrder = -9; scene.add(m); }
  // rain
  const N = 2600, rp = new Float32Array(N * 6);
  for (let i = 0; i < N; i++) { const x = rr(-30, 30), y = rr(0, 30), z = rr(-70, 12); rp.set([x, y, z, x - .05, y - .9, z + .25], i * 6); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  rainLines = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xc8d6e8, transparent: true, opacity: 0, depthWrite: false })); rainLines.frustumCulled = false; scene.add(rainLines);
  blob = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: TX.radial, transparent: true, opacity: .45, depthWrite: false }));
  scene.add(blob);
  initParticles(); initEnvMap();
  setupComposer();
  applyQuality();
  onResize(); addEventListener('resize', onResize);
}
function setupComposer() {
  if (!THREE.EffectComposer || !THREE.UnrealBloomPass) return;
  try {
    composer = new THREE.EffectComposer(renderer); composer.addPass(new THREE.RenderPass(scene, camera));
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), .55, .5, .82); composer.addPass(bloomPass);
  } catch (e) { composer = null; }
}
function applyQuality() {
  resolveQuality();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, Q.pr));
  sun.castShadow = Q.shadows; sun.shadow.mapSize.set(Q.shadowSize, Q.shadowSize); if (typeof refreshEnvMap === 'function' && ENVMAP.pmrem) refreshEnvMap(true); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  scene.fog.far = Q.draw; onResize();
}
function onResize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  if (composer) { composer.setSize(w, h); composer.setPixelRatio && composer.setPixelRatio(Math.min(devicePixelRatio || 1, Q.pr)); }
  if (mapCam) { mapCam.aspect = w / h; mapCam.updateProjectionMatrix(); }
}
function renderFrame(sc, cam) {
  const useBloom = composer && Q.bloom && S.settings.bloom && sc === scene;
  if (useBloom) { composer.passes[0].scene = sc; composer.passes[0].camera = cam; composer.render(); } else renderer.render(sc, cam);
}

/* ---------- Particles ---------- */
let PART;
function initParticles() {
  const N = 400; const g = new THREE.BufferGeometry(); const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: .22, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: TX.radial, toneMapped: false });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  PART = { pts, pos, col, vel: new Float32Array(N * 3), life: new Float32Array(N), n: N, i: 0 };
}
function burst(x, y, z, color, count = 12, sp = 3, up = 2) {
  const c = new THREE.Color(color);
  for (let k = 0; k < count; k++) {
    const i = PART.i = (PART.i + 1) % PART.n; PART.pos.set([x, y, z], i * 3); PART.vel.set([rr(-sp, sp), rr(0, up) + up * .5, rr(-sp, sp)], i * 3); PART.col.set([c.r, c.g, c.b], i * 3); PART.life[i] = rr(.4, .8);
  }
}
function updateParticles(dt, worldDz) {
  const { pos, vel, life, col } = PART;
  for (let i = 0; i < PART.n; i++) {
    if (life[i] <= 0) { pos[i * 3 + 1] = -999; continue; }
    life[i] -= dt; vel[i * 3 + 1] -= 9 * dt;
    pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt + worldDz;
    const f = Math.max(0, life[i]) * 1.4; col[i * 3] *= .985; col[i * 3 + 1] *= .985; col[i * 3 + 2] *= .985;
  }
  PART.pts.geometry.attributes.position.needsUpdate = true; PART.pts.geometry.attributes.color.needsUpdate = true;
}

/* ---------- Time of day & weather ---------- */
const TOD_KEYS = [
  [0.00, '#2e3a74', '#ee9c72', '#ffae70', 1.1, '#ffd2ac', '#4a3a3a', .52, '#d99a7c', .3, .92],
  [0.10, '#4382cf', '#f4d8b8', '#ffe2b8', 1.5, '#fff1dc', '#6a5a48', .72, '#e9d7c2', 0, 1.0],
  [0.25, '#2f78d0', '#cfe2ef', '#fff6e6', 1.75, '#e6f2ff', '#6a5a48', .8, '#cddde8', 0, 1.0],
  [0.40, '#3a6fb8', '#ecd2ac', '#ffd9a0', 1.45, '#ffe8cc', '#6a5040', .72, '#e4cba9', 0, 1.0],
  [0.50, '#2e2660', '#ff8f50', '#ff9048', 1.05, '#ffc49a', '#503040', .58, '#e38e60', .4, 1.05],
  [0.58, '#1a1846', '#83446e', '#b86a8a', .4, '#8a7aa8', '#302838', .42, '#5e3d5e', .8, 1.1],
  [0.75, '#05081a', '#1b2348', '#8fa6ff', .26, '#5a6aa8', '#141824', .34, '#151b34', 1, 1.2],
  [0.92, '#0c1132', '#3b406f', '#a0b0ff', .32, '#7a82b8', '#1a1c28', .38, '#2f3459', .85, 1.15],
  [1.00, '#2e3a74', '#ee9c72', '#ffae70', 1.1, '#ffd2ac', '#4a3a3a', .52, '#d99a7c', .3, .92]
];
const ENV = { tod: .02, todTarget: null, night: 0, weather: 'clear', rain: 0, rainT: 0, fogK: 0, cloud: 0, weatherTimer: 90, lightning: 0, wet: 0 };
const _ca = new THREE.Color(), _cb = new THREE.Color();
function lerpHex(a, b, t, out) { out.set(a).lerp(_cb.set(b), t); return out; }
const TODC = { top: new THREE.Color(), hor: new THREE.Color(), sun: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(), fog: new THREE.Color() };
function applyTod(t) {
  t = ((t % 1) + 1) % 1; let i = 0; while (i < TOD_KEYS.length - 2 && TOD_KEYS[i + 1][0] <= t) i++;
  const a = TOD_KEYS[i], b = TOD_KEYS[i + 1]; const k = smooth((t - a[0]) / (b[0] - a[0]));
  lerpHex(a[1], b[1], k, TODC.top); lerpHex(a[2], b[2], k, TODC.hor); lerpHex(a[3], b[3], k, TODC.sun); lerpHex(a[5], b[5], k, TODC.hs); lerpHex(a[6], b[6], k, TODC.hg); lerpHex(a[8], b[8], k, TODC.fog);
  const sunI = lerp(a[4], b[4], k), hemiI = lerp(a[7], b[7], k); let night = lerp(a[9], b[9], k); const expo = lerp(a[10], b[10], k);
  // weather desaturation
  const wc = ENV.cloud; const grey = _ca.setRGB(.55, .58, .62);
  TODC.top.lerp(grey.clone().multiplyScalar(.6 + (1 - night) * .4), wc * .75); TODC.hor.lerp(grey.clone().multiplyScalar(.5 + (1 - night) * .5), wc * .7); TODC.fog.lerp(grey.clone().multiplyScalar(.45 + (1 - night) * .5), wc * .8);
  const th = t * Math.PI * 2; let sy = Math.sin(th), sx = Math.cos(th);
  const moon = sy < 0; if (moon) { sy = -sy; sx = -sx; }
  skyUni.top.value.copy(TODC.top); skyUni.hor.value.copy(TODC.hor); skyUni.sunCol.value.copy(TODC.sun).multiplyScalar(moon ? .25 : 1); skyUni.night.value = night; skyUni.cloud.value = wc;
  skyUni.sunDir.value.set(sx * .85, Math.max(.04, sy) * .9 + .02, -.55).normalize();
  const flash = ENV.lightning > 0 ? ENV.lightning : 0;
  sun.color.copy(TODC.sun); sun.intensity = sunI * (1 - wc * .6) + flash * 2; hemi.color.copy(TODC.hs); hemi.groundColor.copy(TODC.hg); hemi.intensity = (hemiI * (1 - wc * .2) + flash) * (scene.environment ? .6 : 1);
  scene.fog.color.copy(TODC.fog);
  renderer.toneMappingExposure = expo;
  ENV.night = night; ENV.sunDir = skyUni.sunDir.value;
  // night materials
  for (const [m, d, n] of NIGHTMATS) m.emissiveIntensity = lerp(d, n, night);
  MAT.lamp.color.setScalar(lerp(.75, 2.4, night)); MAT.neon.color.setScalar(lerp(1.0, 2.1, night)); MAT.pool.opacity = night * .55; MAT.bulbs.opacity = .45 + night * .55;
  MAT.water.emissive.copy(TODC.hor).multiplyScalar(.45); MAT.water.color.copy(TODC.top).lerp(TODC.hor, .5);
  // skyline tint
  const sk = _ca.copy(TODC.fog).lerp(_cb.set('#1c2030'), .25 + night * .45);
  skylineA.material.color.copy(sk); skylineB.material.color.copy(sk);
}
function setWeather(w, instant = false) {
  ENV.weather = w; const t = { clear: [0, 0, 0], light: [.45, .45, .15], heavy: [1, .85, .35], fog: [0, .6, 1] }[w] || [0, 0, 0];
  ENV.target = t; if (instant) { ENV.rain = t[0]; ENV.cloud = t[1]; ENV.fogK = t[2]; }
}
function updateEnv(dt, auto = true) {
  if (!ENV.target) setWeather(ENV.weather, true);
  ENV.rain = damp(ENV.rain, ENV.target[0], .4, dt); ENV.cloud = damp(ENV.cloud, ENV.target[1], .4, dt); ENV.fogK = damp(ENV.fogK, ENV.target[2], .4, dt);
  if (ENV.weather === 'heavy' && Math.random() < dt * .06) { ENV.lightning = 1; AU.thunder && AU.thunder(); }
  ENV.lightning = Math.max(0, ENV.lightning - dt * 3);
  ENV.wet = damp(ENV.wet, ENV.rain > .2 ? 1 : 0, .15, dt);
  const road = [MAT.road, MAT.oldroad, MAT.highway, MAT.bridgeRoad, MAT.stone];
  for (const m of road) { m.roughness = lerp(.92, .3, ENV.wet); m.metalness = lerp(0, .35, ENV.wet); }
  const baseNear = 70, baseFar = Q.draw;
  scene.fog.near = lerp(baseNear, 8, ENV.fogK) * (1 - ENV.rain * .3); scene.fog.far = lerp(baseFar, 120, ENV.fogK) * (1 - ENV.rain * .25);
  rainLines.material.opacity = ENV.rain * .5;
  if (ENV.rain > .01) {
    const p = rainLines.geometry.attributes.position.array; const sp = 34 * dt, dz = (G.speed || 8) * dt * .5;
    for (let i = 0; i < p.length; i += 6) { p[i + 1] -= sp; p[i + 4] -= sp; p[i + 2] += dz; p[i + 5] += dz; if (p[i + 1] < 0 || p[i + 2] > 14) { const x = rr(-30, 30), y = rr(18, 32), z = rr(-70, 0); p[i] = x; p[i + 1] = y; p[i + 2] = z; p[i + 3] = x - .05; p[i + 4] = y - .9 - ENV.rain * .6; p[i + 5] = z + .25; } }
    rainLines.geometry.attributes.position.needsUpdate = true;
  }
  rainLines.position.set(camera.position.x * .5, 0, 0);
}

/* ---------- Kind helpers ---------- */
const SKY_OF = { old: 'old', city: 'city', metro: 'city', rail: 'city', railcity: 'city', hill: 'city', lake: 'city', tech: 'tech', bridge: 'tech', campus: 'hills', zoo: 'hills', fort: 'hills', tombs: 'hills', outskirts: 'hills' };
const SKYTEX = { old: 'skyOld', city: 'skyCity', tech: 'skyTech', hills: 'skyHills' };
let skyCur = 'old', skyFade = 1;
function updateSkyline(dt, kind) {
  const want = SKY_OF[kind] || 'city';
  if (want !== skyCur && skyFade >= 1) { // start crossfade: A <- current, B <- new
    skylineA.material.map = skylineB.material.map; skyLightsA.material.map = skyLightsB.material.map;
    const t = TX[SKYTEX[want]]; skylineB.material.map = t.map; skyLightsB.material.map = t.emi; t.map.repeat.set(3, 1); t.emi.repeat.set(3, 1);
    skylineA.material.needsUpdate = skylineB.material.needsUpdate = skyLightsA.material.needsUpdate = skyLightsB.material.needsUpdate = true;
    skyCur = want; skyFade = 0;
  }
  skyFade = Math.min(1, skyFade + dt * .25);
  skylineA.material.opacity = 1 - skyFade; skylineB.material.opacity = skyFade;
  skyLightsA.material.opacity = ENV.night * (1 - skyFade) * .9; skyLightsB.material.opacity = ENV.night * skyFade * .9;
  for (const m of [skylineA, skylineB, skyLightsA, skyLightsB]) m.position.set(camera.position.x, -8, camera.position.z);
  skyMesh.position.copy(camera.position);
}
function setSkyInstant(kind) { const want = SKY_OF[kind] || 'city'; const t = TX[SKYTEX[want]]; t.map.repeat.set(3, 1); t.emi.repeat.set(3, 1); skylineB.material.map = t.map; skyLightsB.material.map = t.emi; skylineB.material.needsUpdate = skyLightsB.material.needsUpdate = true; skyCur = want; skyFade = 1; }

/* =========================================================
   Chunk builders (chunk-local: z from 0 to -30 forward)
   ========================================================= */
function bridgeAt(z, local) { if (!z.bridges) return null; for (const [a, bnd, t] of z.bridges) if (local + CHUNK > a && local < bnd) return t; return null; }
function fillWidths(total, min, max) { const out = []; let rem = total; while (rem > .5) { let w = rr(min, max); if (rem - w < min) w = rem; out.push(w); rem -= w; } return out; }

function roadBase(b, key, halfW = 4.1) { b.uv(key, 'ground', 0, 0, -CHUNK / 2, halfW * 2, 1, CHUNK, '#fff', 1, CHUNK / 10); }
function sidewalks(b, from, to, h = .18, key = 'pave') { for (const s of [-1, 1]) { slab(b, key, s * from, s * to, 0, CHUNK, h, 1); curb(b, s * (from + .1), 0, CHUNK); } }

function oldBuilding(b, side, zc, w, x0) {
  const d = rr(8, 12), floors = ri(2, 4), gh = 4, fh = 3.3, h = gh + floors * fh, col = pick(PASTELS); const cx = side * (x0 + d / 2);
  b.box('paint', side * (x0 + d / 2 + .8), gh / 2, -zc, d - 1.4, gh, w - .3, '#2c231e');
  b.box('paint', side * (x0 + .25), gh / 2, -zc - w / 2 + .3, .5, gh, .5, col); b.box('paint', side * (x0 + .25), gh / 2, -zc + w / 2 - .3, .5, gh, .5, col);
  b.box('metal', side * (x0 + .45), gh - .7, -zc, .08, 1.3, w - 1, '#8d9196');
  const shopc = pick(['#e9b949', '#12a38c', '#e0527a', '#f26b38', '#7fb3ff', '#ffffff']);
  for (let k = 0; k < 3; k++) b.box('paint', side * (x0 + 1.2), .5 + k * .45, -zc + rr(-w / 3, w / 3), .5, .35, 1.2, pick(['#c2185b', '#e9b949', '#2f7fd1', '#12a38c', '#f26b38']));
  b.box('lamp', side * (x0 + 1.4), gh - .35, -zc, .1, .1, w - 1.2, shopc === '#ffffff' ? '#fff1c9' : '#ffe0a0');
  b.add('paint', 'box', side * (x0 - .75), gh - .25, -zc, 1.8, .08, w - .4, pick(['#c62828', '#1565c0', '#2e7d32', '#f9a825', '#6a1b9a', '#00838f', '#ad1457']), 0, 0, side * .3);
  signPlane(b, side * (x0 - .03), gh + .75, -zc, Math.min(w - .6, 5), 1.25, ri(0, 11), -side * Math.PI / 2);
  b.facade('old', cx, gh, -zc, d, floors * fh, w - .1, col, 3.2, fh);
  b.box('paint', cx, h + .2, -zc, d + .3, .4, w + .1, '#e8e0d0');
  if (Math.random() < .45) for (let k = -w / 2 + .6; k < w / 2; k += 1.2) b.box('paint', side * (x0 + .15), h + .8, -zc + k, .3, .8, .5, col);
  if (Math.random() < .6) waterTank(b, cx + rr(-2, 2), h + .4, -zc + rr(-1, 1));
  for (let f = 0; f < floors; f++) if (Math.random() < .4) { const bw = w * rr(.4, .7); b.box('paint', side * (x0 - .5), gh + f * fh + .1, -zc, 1, .15, bw, '#d8d0c0'); b.add('rail', 'plane', side * (x0 - .98), gh + f * fh + .62, -zc, bw, .9, 1, '#4d4d4d', 0, Math.PI / 2, 0, { uvs: [bw / 2, 1, 0, 0] }); }
  if (Math.random() < .25) b.add('paint', 'dome', side * (x0 + d / 2), h + .4, -zc, 2.2, 1.8, 2.2, '#f4efe6');
}
function cityBuilding(b, side, zc, w, x0, tall = false) {
  const d = rr(10, 16), floors = tall ? ri(7, 15) : ri(3, 8), fh = 3.3, gh = 4.5, h = gh + floors * fh, col = pick(URBAN); const cx = side * (x0 + d / 2);
  b.box('paint', cx + side * .6, gh / 2, -zc, d - 1.2, gh, w - .2, '#34373c');
  b.facade('glass', side * (x0 + .3), 0, -zc, .3, gh - .6, w - .8, '#b9c4cf', 3, gh);
  b.box('paint', side * (x0 + .05), gh - .3, -zc, .3, .6, w - .2, pick(['#e2231a', '#1a74d1', '#2aa34a', '#e9b949', '#f4efe6', '#6d3fd6']));
  if (Math.random() < .6) signPlane(b, side * (x0 - .12), gh - .3, -zc, Math.min(w - 1, 4.6), .9, ri(2, 11), -side * Math.PI / 2);
  b.facade('facade', cx, gh, -zc, d, floors * fh, w - .2, col, 3.2, fh);
  b.box('paint', cx, h + .5, -zc, d + .2, 1, w, '#d9d3c8');
  if (Math.random() < .5) waterTank(b, cx + rr(-3, 3), h + 1, -zc + rr(-2, 2));
  if (Math.random() < .5) waterTank(b, cx + rr(-3, 3), h + 1, -zc + rr(-2, 2));
  if (!tall && Math.random() < .22) billboard(b, cx, -zc, side, ri(12, 19), h + 1, 7);
}
function techTower(b, side, zc, w, x0) {
  const d = rr(14, 24), h = rr(30, 85), col = pick(GLASSC); const cx = side * (x0 + d / 2);
  b.box('paint', cx, 2.5, -zc, d + 2, 5, w, '#d6d8dc');
  b.facade('glass', cx, 5, -zc, d, h, w - 1, col, 3.3, 3.8);
  b.box('lmk', cx, h + 5.6, -zc, d * .6, 1.2, w * .6, '#e9edf2');
  if (Math.random() < .45) signPlane(b, side * (x0 - .2), h - 2, -zc, Math.min(w - 2, 10), Math.min(w - 2, 10) * .5, ri(20, 23), -side * Math.PI / 2);
  if (Math.random() < .3) { b.add('metal', 'cyl6', cx, h + 10, -zc, .3, 8, .3, '#c9ced4'); b.box('lamp', cx, h + 14.2, -zc, .5, .5, .5, '#ff3b30'); }
}
function hut(b, x, z, ry = 0) {
  b.box('paint', x, 1.3, z, 4.5, 2.6, 3.6, pick(['#efe6d6', '#e8c9a0', '#dfe8f0', '#f1d9a6']), ry);
  b.add('paint', 'cone4', x, 3.4, z, 4.6, 1.8, 5.8, '#9a4a2a', 0, ry + Math.PI / 4, 0);
  b.box('paint', x + Math.sin(ry) * 1.81, 1, z + Math.cos(ry) * 1.81, 1, 2, .05, '#5a3d24', ry);
}
function statue(b, x, z, ry) { b.box('lmk', x, .9, z, 1.4, 1.8, 1.4, '#d9d2c4'); b.box('lmk', x, 1.95, z, 1.1, .3, 1.1, '#bdb5a6'); b.withTx(x, 2.1, z, ry, 1.35, () => { b.add('bronze', taper(.75, 8), 0, .55, 0, .55, 1.1, .4, '#7a5a38'); b.box('bronze', 0, 1.3, 0, .5, .55, .3, '#7a5a38'); b.add('bronze', 'sph', 0, 1.78, 0, .26, .3, .26, '#7a5a38'); b.box('bronze', -.3, 1.3, .05, .12, .5, .14, '#7a5a38'); b.add('bronze', 'box', .3, 1.45, .1, .12, .5, .14, '#7a5a38', -.4, 0, 0); }); }

const BUILD = {};
BUILD.old = (b, c) => {
  roadBase(b, 'oldroad'); sidewalks(b, 4.1, 6.2, .18, 'pave');
  for (const s of [-1, 1]) { let z = 0; for (const w of fillWidths(CHUNK, 4.5, 8)) { oldBuilding(b, s, z + w / 2, w, 6.2); z += w; } }
  if (c.idx % 2 === 0) b.add('bulbs', 'plane', 0, 6.6, -rr(5, 25), 12.6, .8, 1, '#fff', 0, 0, 0, { uvs: [1, 1, 0, 0] });
  if (c.idx % 3 === 0) b.add('bulbs', 'plane', 0, 7.2, -rr(5, 25), 12.6, .8, 1, '#fff', 0, 0, 0, { uvs: [1, 1, 0, 0] });
  for (let k = 0; k < 6; k++) { const s = Math.random() < .5 ? -1 : 1; person(b, s * rr(4.6, 5.8), -rr(1, 29), rr(0, 6.28), { walk: Math.random() < .5 }); }
  if (Math.random() < .5) { const s = Math.random() < .5 ? -1 : 1; const z = -rr(4, 26); b.box('paint', s * 5.2, .8, z, 1, .08, 2, '#6b4421'); for (let k = 0; k < 10; k++) b.add('paint', 'torus', s * 5.2 + rr(-.3, .3), .9, z + rr(-.8, .8), .25, .25, .25, pick(['#c2185b', '#e9b949', '#2f7fd1', '#12a38c', '#8e24aa', '#f26b38']), Math.PI / 2, 0, 0); }
  if (c.idx % 2 === 1) { streetLight(b, -5.6, -8, -1, 7, 1.6); streetLight(b, 5.6, -23, 1, 7, 1.6); }
};
BUILD.city = (b, c) => {
  roadBase(b, 'road'); for (const s of [-1, 1]) { slab(b, 'paint', s * 4.1, s * 4.6, 0, CHUNK, .35); curb(b, s * 4.12, 0, CHUNK, .1, .36); curb(b, s * 4.58, 0, CHUNK, .1, .36); }
  for (const s of [-1, 1]) b.uv('road', 'ground', s * 6.1, 0.005, -CHUNK / 2, 3, 1, CHUNK, '#fff', .366, CHUNK / 10, 0, 0);
  sidewalks(b, 7.6, 10.2, .2, 'pave');
  for (const s of [-1, 1]) for (let z = -5; z > -CHUNK; z -= 10) b.add('leaf', 'ico', s * 4.35, .6, z, .6, .5, 1.6, '#4d7a2d');
  const tall = c.zone.idx >= 2; const trees = c.zone.kind !== 'metro';
  for (const s of [-1, 1]) { let z = 0; for (const w of fillWidths(CHUNK, 9, 15)) { if (Math.random() < .12) { treeRound(b, s * 14, -(z + w / 2), 1.1); } else cityBuilding(b, s, z + w / 2, w, 10.6 + rr(0, 2), tall && Math.random() < .4); z += w; } }
  if (trees) for (const s of [-1, 1]) if (Math.random() < .7) (Math.random() < .5 ? treeGulmohar : treeRound)(b, s * 8.8, -rr(3, 27), rr(.8, 1));
  if (c.idx % 2 === 0) doubleLight(b, 4.35, -15); else doubleLight(b, -4.35, -15);
  for (let k = 0; k < 4; k++) { const s = Math.random() < .5 ? -1 : 1; person(b, s * rr(8, 9.8), -rr(1, 29), rr(0, 6.28), { walk: Math.random() < .6 }); }
  if (c.idx % 4 === 1) billboard(b, (Math.random() < .5 ? -1 : 1) * 9.4, -15, Math.random() < .5 ? -1 : 1, ri(12, 19), 5.5, 6.5);
};
BUILD.hill = (b, c) => {
  roadBase(b, 'road'); sidewalks(b, 4.1, 6.5, .2, 'pave');
  groundStrip(b, 'earth', -6.5, -80, 0, CHUNK, .01, 4);
  for (let k = 0; k < 3; k++) rockPile(b, -rr(9, 22), -rr(2, 28), rr(.7, 1.3));
  for (let k = 0; k < 2; k++) treeRound(b, -rr(8, 16), -rr(2, 28), rr(.8, 1.1));
  let z = 0; for (const w of fillWidths(CHUNK, 9, 15)) { cityBuilding(b, 1, z + w / 2, w, 7.5, Math.random() < .3); z += w; }
  if (c.idx % 2 === 0) streetLight(b, 4.4, -12, 1);
  for (let k = 0; k < 3; k++) person(b, rr(4.6, 6.2), -rr(1, 29), rr(0, 6.28), { walk: true });
};
BUILD.metro = (b, c) => {
  BUILD.city(b, c);
  b.box('lmk', 0, 10.9, -CHUNK / 2, 8.6, 1.4, CHUNK, '#c9c4ba'); b.box('lmk', 0, 10.1, -CHUNK / 2, 5, .6, CHUNK, '#b8b3aa');
  for (const s of [-1, 1]) { b.box('lmk', s * 4.2, 12.1, -CHUNK / 2, .25, 1, CHUNK, '#d6d2ca'); b.box('metal', s * 1.2, 11.7, -CHUNK / 2, .1, .15, CHUNK, '#8a8f94'); }
  for (let z = -3; z > -CHUNK; z -= 15) { b.box('metal', 3.6, 14, z, .15, 4, .15, '#8a8f94'); b.box('metal', 2.2, 15.8, z, 3, .12, .12, '#8a8f94'); }
  b.box('neon', 0, 10.25, -CHUNK / 2, 8.62, .12, CHUNK, '#e2231a');
};
BUILD.tech = (b, c) => {
  roadBase(b, 'road'); for (const s of [-1, 1]) { slab(b, 'paint', s * 4.1, s * 4.6, 0, CHUNK, .35); curb(b, s * 4.12, 0, CHUNK, .1, .36); }
  for (const s of [-1, 1]) b.uv('road', 'ground', s * 6.6, 0.005, -CHUNK / 2, 4, 1, CHUNK, '#fff', .49, CHUNK / 10);
  sidewalks(b, 8.6, 12, .2, 'pave');
  for (const s of [-1, 1]) { let z = 0; for (const w of fillWidths(CHUNK, 14, 26)) { if (Math.random() < .15) { treeRound(b, s * 18, -(z + w / 2), 1.1); treeRound(b, s * 24, -(z + w / 3), 1.2); } else techTower(b, s, z + w / 2, w, 14 + rr(0, 8)); z += w; } }
  for (const s of [-1, 1]) treePalm(b, s * 10.3, -rr(4, 26), rr(.9, 1.1));
  doubleLight(b, c.idx % 2 ? 4.35 : -4.35, -15, 10);
  if (c.idx % 5 === 2) { // cross flyover (visual)
    b.box('lmk', 0, 9.2, -15, 60, 1.4, 9, '#c9c4ba'); for (const s of [-1, 1]) b.box('lmk', 0, 10.4, -15 + s * 4.3, 60, 1, .3, '#d9d5cc');
    for (const s of [-1, 1]) b.add('lmk', 'cyl12', s * 9.5, 4.3, -15, 1.6, 8.6, 1.6, '#bdb8ae'); b.box('neon', 0, 8.45, -10.45, 60, .15, .1, '#39d0ff');
  }
  if (c.idx % 3 === 0) billboard(b, (c.idx % 2 ? -1 : 1) * 11, -12, c.idx % 2 ? -1 : 1, ri(15, 18), 6, 8);
  // side metro viaduct
  b.box('lmk', -16, 11, -CHUNK / 2, 8, 1.3, CHUNK, '#c9c4ba'); b.box('neon', -16, 10.3, -CHUNK / 2, 8.02, .12, CHUNK, '#1a74d1'); b.add('lmk', 'cyl12', -16, 5.2, -15, 1.7, 10.4, 1.7, '#bdb8ae'); b.box('lmk', -16, 10.1, -15, 5, 1, 2, '#b2ada3');
  for (let k = 0; k < 4; k++) { const s = Math.random() < .5 ? -1 : 1; person(b, s * rr(9, 11.5), -rr(1, 29), rr(0, 6.28), { walk: true, top: pick(['#f4f4f2', '#2a3550', '#9aa4b1', '#bcd3ef']), bag: Math.random() < .5 ? '#222' : null }); }
};
BUILD.lake = (b, c) => {
  roadBase(b, 'road'); sidewalks(b, 4.1, 8.2, .22, 'pave');
  b.uv('water', 'ground', 8.2 + 200, -1.1, -CHUNK / 2, 400, 1, CHUNK, '#fff', 400 / 14, CHUNK / 14);
  b.box('paint', 8.35, -.5, -CHUNK / 2, .3, 1.4, CHUNK, '#b8b0a2');
  railing(b, 8.1, 0, CHUNK, 1.1, '#e8e2d6'); for (let z = 0; z >= -CHUNK; z -= 6) b.box('paint', 8.1, .6, z, .3, 1.2, .3, '#d8d0c0');
  groundStrip(b, 'grass', -8.2, -32, 0, CHUNK, .1, 4);
  if (c.zone.statues) { statue(b, -6.8, -8, Math.PI / 2); statue(b, 6.8, -23, -Math.PI / 2); }
  else { for (let k = 0; k < 2; k++) (Math.random() < .5 ? treePalm : treeGulmohar)(b, -rr(10, 18), -rr(2, 28), rr(.9, 1.1)); }
  if (Math.random() < .6) { let z = 0; for (const w of fillWidths(CHUNK, 10, 15)) { if (Math.random() < .5) cityBuilding(b, -1, z + w / 2, w, 32 + rr(0, 10), true); z += w; } }
  streetLight(b, 7.6, -5, 1, 8, 2.4); if (c.idx % 2) streetLight(b, -7.6, -20, -1, 8, 2.4);
  for (let k = 0; k < 3; k++) person(b, rr(4.8, 7.6), -rr(1, 29), rr(0, 6.28), { walk: Math.random() < .5 });
  if (Math.random() < .5) b.box('paint', 7.2, .6, -rr(5, 25), .6, .5, 2, '#6b4421');
};
BUILD.rail = (b, c) => {
  b.uv('ballast', 'ground', 0, 0, -CHUNK / 2, 8.2, 1, CHUNK, '#fff', 1, CHUNK / 5);
  for (const lx of LANE_X) for (const s of [-1, 1]) b.box('metal', lx + s * .84, .1, -CHUNK / 2, .09, .16, CHUNK, '#9aa0a6');
  for (const s of [-1, 1]) {
    slab(b, 'pave', s * 4.25, s * 10.5, 0, CHUNK, 1.0, 1); b.box('paint', s * 4.55, 1.01, -CHUNK / 2, .35, .02, CHUNK, '#f2c21b');
    for (let z = -4; z > -CHUNK; z -= 8) { b.add('metal', 'cyl8', s * 7.2, 3.6, z, .3, 5.2, .3, '#2e5d4a'); }
    b.box('paint', s * 7.4, 6.3, -CHUNK / 2, 7.4, .25, CHUNK, '#c9ccc4'); b.box('paint', s * 7.4, 6.55, -CHUNK / 2, 7.6, .25, CHUNK, '#7a2e2a');
    b.box('lamp', s * 5.2, 6.05, -CHUNK / 2, .12, .08, CHUNK - 2, '#f4fbff');
    b.box('paint', s * 11.5, 1.8, -CHUNK / 2, 2, 3.6, CHUNK, '#d7cfbd');
    for (let k = 0; k < 5; k++) person(b, s * rr(5.2, 9.5), -rr(1, 29), rr(0, 6.28), { walk: Math.random() < .4, bag: Math.random() < .5 ? pick(['#b3261e', '#1f3a68', '#3a2a22']) : null });
    b.withTx(s * 8.8, 1, -rr(4, 26), s > 0 ? -Math.PI / 2 : Math.PI / 2, 1, () => { b.box('paint', 0, .5, 0, 2, .08, .5, '#8a5a2b'); b.box('paint', 0, .82, -.22, 2, .45, .08, '#8a5a2b'); b.box('metal', 0, .25, 0, 1.8, .5, .4, '#555'); });
  }
  b.box('metal', 0, 6.9, -CHUNK / 2, .1, .1, CHUNK, '#555'); for (const lx of LANE_X) b.box('metal', lx, 6.5, -CHUNK / 2, .04, .04, CHUNK, '#333');
  if (c.idx % 3 === 1) { const s = Math.random() < .5 ? -1 : 1; b.withTx(s * 9, 1, -15, 0, 1, () => { b.box('paint', 0, 1.3, 0, 2.4, 2.6, 3, '#1d5a3a'); signPlane(b, s > 0 ? -1.21 : 1.21, 1.9, 0, 2.6, 1.2, 2, s > 0 ? -Math.PI / 2 : Math.PI / 2); }); }
  if (c.idx % 6 === 3) { // foot overbridge
    b.box('lmk', 0, 8.2, -15, 26, .6, 3.4, '#b6b1a6'); for (const s of [-1, 1]) { b.box('lmk', 0, 9.2, -15 + s * 1.6, 26, 1.4, .15, '#d9d5cc'); b.box('lmk', s * 12, 4.6, -15, 2.6, 8, 3, '#b6b1a6'); }
    b.box('paint', 0, 9.3, -15, 26, .12, 3.5, '#2e5d4a');
  }
  for (const s of [-1, 1]) b.uv('ballast', 'ground', s * 15, 0, -CHUNK / 2, 8, 1, CHUNK, '#fff', 1, CHUNK / 5);
};
BUILD.railcity = (b, c) => {
  roadBase(b, 'road'); sidewalks(b, 4.1, 6.4, .2, 'pave');
  let z = 0; for (const w of fillWidths(CHUNK, 5, 9)) { oldBuilding(b, 1, z + w / 2, w, 6.4); z += w; }
  b.uv('ballast', 'ground', -14, .01, -CHUNK / 2, 14, 1, CHUNK, '#fff', 14 / 8.2, CHUNK / 5);
  for (const tx of [-11, -16]) for (const s of [-1, 1]) b.box('metal', tx + s * .84, .1, -CHUNK / 2, .09, .16, CHUNK, '#9aa0a6');
  fence(b, -7, 0, CHUNK, 2.2, '#5a5f64');
  if (c.idx % 2) streetLight(b, 5.8, -10, 1, 7.5, 1.8);
  for (let k = 0; k < 4; k++) person(b, rr(4.6, 6.2), -rr(1, 29), rr(0, 6.28), { walk: true });
};
BUILD.campus = (b, c) => {
  roadBase(b, 'road', 4.1); for (const s of [-1, 1]) curb(b, s * 4.15, 0, CHUNK);
  for (const s of [-1, 1]) { groundStrip(b, 'grass', s * 4.2, s * 70, 0, CHUNK, .05, 4); slab(b, 'pave', s * 5, s * 6.6, 0, CHUNK, .12, 1); }
  for (const s of [-1, 1]) { if (Math.random() < .55) treeBanyan(b, s * rr(13, 22), -rr(4, 26), rr(.8, 1.1)); else treeRound(b, s * rr(9, 16), -rr(4, 26), rr(1, 1.3)); if (Math.random() < .6) treeRound(b, s * rr(20, 34), -rr(2, 28), rr(1, 1.4)); }
  if (c.idx % 3 === 0) { const s = Math.random() < .5 ? -1 : 1; b.withTx(s * 42, 0, -15, s > 0 ? -Math.PI / 2 : Math.PI / 2, 1, () => { b.facade('old', 0, 0, 0, 26, 9, 12, '#bca592', 3.4, 4.5); b.box('lmk', 0, 9.3, 0, 27, .6, 13, '#8d776a'); arches(b, 'lmk', 0, 0, 6.05, 0, 6, 20, 2.2, 3.6, '#3b2f28'); }); }
  for (let k = 0; k < 6; k++) { const s = Math.random() < .5 ? -1 : 1; person(b, s * rr(5.2, 12), -rr(1, 29), rr(0, 6.28), { walk: Math.random() < .5, bag: pick(['#e9b949', '#2f7fd1', '#c2185b', '#222', '#12a38c']) }); }
  if (Math.random() < .5) { const s = Math.random() < .5 ? -1 : 1; const z = -rr(5, 25); for (let k = 0; k < 5; k++) b.withTx(s * 7.4, 0, z + k * .7, Math.PI / 2, 1, () => { b.add('paint', 'wheel', .5, .34, 0, .05, .68, .68, '#1a1a1a'); b.add('paint', 'wheel', -.5, .34, 0, .05, .68, .68, '#1a1a1a'); b.box('metal', 0, .6, 0, 1, .05, .05, pick(['#2f6fd1', '#b3261e', '#222'])); }); }
  if (c.idx % 2) { streetLight(b, 4.6, -8, 1, 7, 1.4); streetLight(b, -4.6, -23, -1, 7, 1.4); }
  if (Math.random() < .5) b.withTx((Math.random() < .5 ? -1 : 1) * 7.5, .12, -rr(4, 26), 0, 1, () => { b.box('paint', 0, .45, 0, .5, .08, 2, '#8a5a2b'); b.box('metal', 0, .22, 0, .4, .44, 1.8, '#555'); });
};
BUILD.zoo = (b, c) => {
  b.uv('pave', 'ground', 0, 0, -CHUNK / 2, 8.2, 1, CHUNK, '#d8b89a', 8.2, CHUNK);
  for (const s of [-1, 1]) { curb(b, s * 4.15, 0, CHUNK); groundStrip(b, 'grass', s * 4.2, s * 7, 0, CHUNK, .05, 4); fence(b, s * 7.2, 0, CHUNK, 2.4); groundStrip(b, 'earth', s * 7.2, s * 60, 0, CHUNK, .02, 4); }
  for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) (Math.random() < .4 ? treeBanyan : treeRound)(b, s * rr(16, 40), -rr(2, 28), rr(.9, 1.3)); bush(b, s * rr(7.8, 10), -rr(2, 28), rr(.8, 1.4)); bush(b, s * 5.5, -rr(2, 28), .7); }
  if (Math.random() < .5) rockPile(b, (Math.random() < .5 ? -1 : 1) * rr(12, 20), -rr(4, 26), rr(.7, 1.2));
  if (c.idx % 3 === 0) { const s = Math.random() < .5 ? -1 : 1; b.uv('water', 'ground', s * 20, .05, -15, 16, 1, 22, '#fff', 1.2, 1.6); }
  if (c.idx % 2) streetLight(b, 4.5, -12, 1, 6.5, 1.2);
  for (let k = 0; k < 3; k++) person(b, (Math.random() < .5 ? -1 : 1) * rr(4.5, 6.5), -rr(1, 29), rr(0, 6.28), { walk: true, cap: Math.random() < .3 ? '#ffffff' : null });
  if (c.idx % 4 === 2) signPlane(b, (Math.random() < .5 ? -1 : 1) * 6.6, 1.8, -10, 2.6, 1.3, 30, 0);
  c.animals = true;
};
BUILD.fort = (b, c) => {
  b.uv('stone', 'ground', 0, 0, -CHUNK / 2, 8.2, 1, CHUNK, '#fff', 8.2 / 5, CHUNK / 5);
  for (const s of [-1, 1]) {
    groundStrip(b, 'earth', s * 4.1, s * 9, 0, CHUNK, .02, 4);
    const h = rr(7, 9.5); b.box('lmk', s * 10, h / 2, -CHUNK / 2, 2.4, h, CHUNK, '#8a7f6c');
    for (let z = -.8; z > -CHUNK; z -= 1.9) b.box('lmk', s * 10, h + .7, z, 2.2, 1.4, 1.1, '#968b77');
    groundStrip(b, 'earth', s * 11, s * 80, 0, CHUNK, 0, 5);
    for (let k = 0; k < 3; k++) rockPile(b, s * rr(16, 45), -rr(2, 28), rr(.8, 1.8));
    if (Math.random() < .5) bush(b, s * rr(5, 8), -rr(2, 28), rr(.6, 1));
  }
  if (c.idx % 2 === 0) { const s = c.idx % 4 ? -1 : 1; b.add('lmk', 'cyl16', s * 11.5, 5.5, -15, 8, 11, 8, '#857a67'); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; b.box('lmk', s * 11.5 + Math.sin(a) * 3.8, 11.7, -15 + Math.cos(a) * 3.8, 1, 1.4, 1, '#968b77'); } }
  for (const s of [-1, 1]) { b.box('lamp', s * 8.75, 5, -8, .15, .35, .15, '#ffb347'); b.add('pool', 'ground', s * 6.8, .04, -8, 6, 1, 6, '#fff'); }
  for (let k = 0; k < 2; k++) person(b, (Math.random() < .5 ? -1 : 1) * rr(4.6, 7.5), -rr(1, 29), rr(0, 6.28), { walk: true, cap: Math.random() < .5 ? '#ffffff' : null });
};
BUILD.tombs = (b, c) => {
  b.uv('stone', 'ground', 0, 0, -CHUNK / 2, 8.2, 1, CHUNK, '#e8e0d0', 8.2 / 5, CHUNK / 5);
  for (const s of [-1, 1]) {
    groundStrip(b, 'grass', s * 4.1, s * 70, 0, CHUNK, .04, 4);
    for (let z = -2; z > -CHUNK; z -= 7) treeCypress(b, s * 6, z, rr(.9, 1.1));
    b.box('leaf', s * 5.0, .4, -CHUNK / 2, .8, .8, CHUNK, '#3f6f2a');
    if (Math.random() < .6) treePalm(b, s * rr(12, 26), -rr(2, 28), rr(.9, 1.1));
    if (Math.random() < .5) slab(b, 'stone', s * 14, s * 17, -rr(0, 10), 18, .2, 3);
  }
  if (c.idx % 2) { streetLight(b, 4.6, -15, 1, 5.5, .9); streetLight(b, -4.6, -15, -1, 5.5, .9); }
  for (let k = 0; k < 2; k++) person(b, (Math.random() < .5 ? -1 : 1) * rr(4.6, 9), -rr(1, 29), rr(0, 6.28), { walk: true });
};
BUILD.outskirts = (b, c) => {
  roadBase(b, 'highway'); for (const s of [-1, 1]) groundStrip(b, 'earth', s * 4.1, s * 6, 0, CHUNK, .02, 4);
  b.uv('highway', 'ground', -9, 0.005, -CHUNK / 2, 6, 1, CHUNK, '#fff', .73, CHUNK / 10); b.box('paint', -5.6, .35, -CHUNK / 2, .6, .7, CHUNK, '#d8d2c6');
  for (let z = -3; z > -CHUNK; z -= 6) b.box('paint', -5.6, .75, z, .62, .12, 3, '#f2c21b');
  const lake = c.zone.lm && Math.abs(c.local - c.zone.lm.at) < 160;
  if (lake) b.uv('water', 'ground', -240, -.4, -CHUNK / 2, 440, 1, CHUNK, '#fff', 440 / 14, CHUNK / 14);
  else groundStrip(b, 'grass', -12, -120, 0, CHUNK, .01, 4);
  groundStrip(b, 'grass', 6, 140, 0, CHUNK, .01, 4);
  const crop = pick(['#6b9a3a', '#88a84a', '#b8a44a', '#5a8a30']); b.add('paint', 'ground', 40, .05, -15, 50, 1, 26, crop);
  for (let r = 0; r < 5; r++) b.box('paint', 40, .15, -3 - r * 5.5, 50, .2, .3, '#6a5a3a');
  for (let k = 0; k < 3; k++) treePalm(b, rr(8, 60), -rr(2, 28), rr(.9, 1.2), true);
  if (!lake) for (let k = 0; k < 2; k++) treePalm(b, -rr(14, 50), -rr(2, 28), rr(.9, 1.2), true);
  if (Math.random() < .5) hut(b, rr(14, 30), -rr(5, 25), rr(0, 3));
  if (Math.random() < .4) rockPile(b, rr(20, 60), -rr(2, 28), rr(1, 2));
  if (!lake && Math.random() < .4) rockPile(b, -rr(20, 60), -rr(2, 28), rr(1, 2));
  b.add('metal', 'cyl6', 7, 4.5, -10, .2, 9, .2, '#6b6f73'); b.box('metal', 7, 8.6, -10, 2.2, .12, .12, '#6b6f73');
  for (const dx of [-1, 0, 1]) b.box('paint', 7 + dx, 8.5, -25, .02, .02, CHUNK, '#222');
};
function buildBridge(b, c, type) {
  const deck = type === 'wood' ? 'plank' : type === 'cable' ? 'bridgeRoad' : 'road';
  b.uv(deck, 'ground', 0, 0, -CHUNK / 2, 8.2, 1, CHUNK, '#fff', 1, CHUNK / (deck === 'plank' ? 2 : 10));
  b.box('paint', 0, -1, -CHUNK / 2, 12, 2, CHUNK, type === 'wood' ? '#6b4a2e' : '#bdb8ae');
  const wx = type === 'wood' ? 60 : 300;
  b.uv('water', 'ground', 0, -4, -CHUNK / 2, wx * 2, 1, CHUNK, '#fff', wx * 2 / 14, CHUNK / 14);
  for (const s of [-1, 1]) {
    slab(b, type === 'wood' ? 'plank' : 'pave', s * 4.1, s * 5.8, 0, CHUNK, .25, 1);
    if (type === 'musi') { b.box('lmk', s * 5.8, .8, -CHUNK / 2, .5, 1.1, CHUNK, '#c9b89a'); for (let z = -1; z > -CHUNK; z -= 3) b.box('lmk', s * 5.8, 1.5, z, .6, .5, .6, '#b8a684'); }
    else if (type === 'wood') { railing(b, s * 5.6, 0, CHUNK, 1.1, '#6b4a2e'); }
    else { railing(b, s * 5.6, 0, CHUNK, 1.2, '#dfe3e8'); b.box('neon', s * 5.6, 1.25, -CHUNK / 2, .08, .08, CHUNK, '#39d0ff'); }
  }
  if (type === 'musi') for (let z = -8; z > -CHUNK; z -= 15) for (const s of [-1, 1]) b.box('lmk', s * 5, -3, z, 1.6, 4, 2.4, '#b8a684');
  if (type === 'cable' && c.idx % 2) { streetLight(b, 5.4, -12, 1, 8, 2.2); streetLight(b, -5.4, -27, -1, 8, 2.2); }
  if (type !== 'wood') for (const s of [-1, 1]) for (let k = 0; k < 2; k++) rockPile(b, s * rr(30, 80), -rr(2, 28), rr(1.2, 2.4));
  if (type === 'wood') for (const s of [-1, 1]) { treeRound(b, s * rr(16, 30), -rr(3, 27), 1.1); rockPile(b, s * rr(12, 24), -rr(3, 27), .9); }
  for (let k = 0; k < 2; k++) person(b, (Math.random() < .5 ? -1 : 1) * rr(4.5, 5.5), -rr(1, 29), rr(0, 6.28), { walk: true });
}
BUILD.bridge = (b, c) => { // Durgam Cheruvu lakeside when not on the bridge
  roadBase(b, 'road'); sidewalks(b, 4.1, 7.5, .2, 'pave');
  const s = c.local < 330 ? 1 : -1;
  b.uv('water', 'ground', s * (7.5 + 150), -1.2, -CHUNK / 2, 300, 1, CHUNK, '#fff', 300 / 14, CHUNK / 14);
  railing(b, s * 7.4, 0, CHUNK, 1.1, '#dfe3e8');
  for (let k = 0; k < 2; k++) rockPile(b, s * rr(14, 40), -rr(2, 28), rr(1.2, 2.2));
  let z = 0; for (const w of fillWidths(CHUNK, 14, 24)) { techTower(b, -s, z + w / 2, w, 11 + rr(0, 6)); z += w; }
  streetLight(b, s * 7, -10, s, 8, 2.3);
  for (let k = 0; k < 3; k++) person(b, s * rr(4.6, 7), -rr(1, 29), rr(0, 6.28), { walk: true });
};

/* ---------- Chunk streaming ---------- */
const WORLD = { chunks: [], pieces: [], nextChunk: 0, idx: 0 };
function makeChunk(wz0) {
  const zi = wz0 < 0 ? 0 : zoneIndexAt(wz0); const zone = ZONES[zi]; const local = wz0 < 0 ? 0 : zoneLocal(wz0);
  const b = new Batch(); const c = { zone, local, wz0, idx: Math.floor(wz0 / CHUNK), extras: [] };
  const br = bridgeAt(zone, local);
  try { if (br) buildBridge(b, c, br); else (BUILD[zone.kind] || BUILD.city)(b, c); } catch (e) { console.error('chunk', zone.kind, e); }
  const group = b.build(Q.chunkShadow, true); group.position.z = -wz0;
  // station boards on platforms
  if (zone.kind === 'rail' && zone.station && c.idx % 3 === 0) for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), signTexture([zone.station.te, zone.station.en], 'station')); m.position.set(s * 6.2, 4.4, -12); m.rotation.y = 0; group.add(m); const m2 = m.clone(); m2.rotation.y = Math.PI; m2.position.z -= .02; group.add(m2); }
  root.add(group);
  const ch = { wz0, group, zone };
  // zone pieces & signs inside this chunk
  for (const p of zone.pieces) { if (p.at >= local && p.at < local + CHUNK) spawnPiece(p, wz0 - local + p.at, zone); }
  if (wz0 >= 0) { const zs = wz0 - local; if (local === 0 && wz0 > 0) spawnWelcome(wz0 + 6, zi); const nb = zs + zone.len; if (nb > wz0 && nb < wz0 + CHUNK) spawnWelcome(nb + 6, (zi + 1) % ZONES.length); }
  const signAt = [150, 420]; for (const sa of signAt) if (sa >= local && sa < local + CHUNK && sa < zone.len - 40 && (!zone.lm || Math.abs(sa - zone.lm.at) > 70)) spawnDirSign(wz0 - local + sa, zi);
  if (c.animals) spawnAnimals(ch);
  spawnAmbient(ch);
  return ch;
}
function updateChunks(dist, force = false) {
  const ahead = dist + Q.draw + 40;
  while (WORLD.nextChunk < ahead) { WORLD.chunks.push(makeChunk(WORLD.nextChunk)); WORLD.nextChunk += CHUNK; if (!force) break; }
  while (WORLD.chunks.length && WORLD.chunks[0].wz0 + CHUNK < dist - 40) { const c = WORLD.chunks.shift(); disposeGroup(c.group); root.remove(c.group); }
  for (let i = WORLD.pieces.length - 1; i >= 0; i--) { const p = WORLD.pieces[i]; if (p.wz + p.ext < dist - 50) { root.remove(p.obj); disposeGroup(p.obj, true); WORLD.pieces.splice(i, 1); } }
}
function disposeGroup(g, keepShared = false) {
  g.traverse(o => { if (o.isMesh && o.geometry && !o.geometry.userData.shared && !o.userData.sharedGeo) { if (!keepShared || !o.userData.cached) o.geometry.dispose(); } });
}
function resetWorld(startWz) {
  for (const c of WORLD.chunks) { disposeGroup(c.group); root.remove(c.group); } WORLD.chunks = [];
  for (const p of WORLD.pieces) root.remove(p.obj); WORLD.pieces = [];
  WORLD.nextChunk = Math.floor(startWz / CHUNK) * CHUNK - CHUNK * 2;
  updateChunks(startWz, true);
}
/* Landmark set pieces (geometry cached per landmark) */
const LMGEO = {};
function lmGroup(name) {
  if (!LMGEO[name]) { const b = new Batch(); LM[name](b); LMGEO[name] = b.geometries(); for (const k in LMGEO[name]) LMGEO[name][k].userData.shared = true; }
  const g = new THREE.Group(); for (const k in LMGEO[name]) { const m = new THREE.Mesh(LMGEO[name][k], MAT[k]); m.castShadow = Q.shadows && !NOSHADOW.has(k); m.receiveShadow = !NOSHADOW.has(k); g.add(m); } return g;
}
const PIECE_X = { charminar: 0, kaman: 0, mecca: 34, chowmahalla: 30, highcourt: 30, salarjung: 34, clocktower: 14, secretariat: 40, ambedkar: 44, buddha: 120, birla: 90, secstation: 26, osmania: 60, kachiguda: 26, zoogate: 0, metrostation: 0, cybertowers: 60, fdtowers: 80, cablebridge: 0, fateh: 0, innergate: 0, balahissar: 100, tomb: 45, tombSmall: 34 };
const PIECE_EXT = { secretariat: 70, salarjung: 40, highcourt: 30, mecca: 30, cybertowers: 50, fdtowers: 80, birla: 60, balahissar: 70, cablebridge: 70, metrostation: 45, secstation: 45, kachiguda: 40, osmania: 50, chowmahalla: 35, buddha: 20, ambedkar: 20, tomb: 25, tombSmall: 20 };
function spawnPiece(p, wz, zone) {
  if (!LM[p.t]) return;
  const g = lmGroup(p.t); const side = p.side || 0; const x = side * (PIECE_X[p.t] || 30);
  g.position.set(x, 0, -wz); if (side) g.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  if (p.t === 'buddha') { g.rotation.y = -Math.PI * .35; g.position.y = -1; }
  if (p.t === 'ambedkar') g.rotation.y = -Math.PI * .3;
  // plaques / signs
  if (p.t === 'salarjung') { const m = plaque(['సాలార్ జంగ్ మ్యూజియం', 'SALAR JUNG MUSEUM'], 10, 2.5); m.position.set(0, 12, 15.2); g.add(m); }
  if (p.t === 'zoogate') { const m = plaque(['నెహ్రూ జూలాజికల్ పార్క్', 'NEHRU ZOOLOGICAL PARK'], 11, 2.4); m.position.set(0, 9.6, .92); g.add(m); }
  if (p.t === 'metrostation') { const m = plaque(['కేపీహెచ్‌బీ కాలనీ', 'KPHB COLONY'], 9, 2.2); m.position.set(0, 14, 40.2); g.add(m); }
  if (p.t === 'secstation' || p.t === 'kachiguda') { const st = zone.station; const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), signTexture([st.te, st.en], 'station')); m.position.set(0, p.t === 'secstation' ? 12.4 : 13.8, p.t === 'secstation' ? 9.1 : 9.4); g.add(m); }
  if (p.t === 'osmania') { const m = plaque(['ఉస్మానియా విశ్వవిద్యాలయం', 'OSMANIA UNIVERSITY'], 12, 2.6); m.position.set(0, 20.5, 9.6); g.add(m); }
  if (p.t === 'secretariat') { const m = plaque(['తెలంగాణ సచివాలయం', 'TELANGANA SECRETARIAT'], 16, 3.4); m.position.set(0, 26, 15.1); g.add(m); }
  if (p.t === 'fateh') { const m = plaque(['గోల్కొండ కోట', 'GOLCONDA FORT'], 9, 2.2); m.position.set(0, 16.4, 3.55); g.add(m); }
  root.add(g); WORLD.pieces.push({ obj: g, wz, ext: PIECE_EXT[p.t] || 20, t: p.t });
}
function spawnWelcome(wz, zi) {
  const z = ZONES[zi]; const tex = signTexture(['Welcome to', z.te, z.name], 'welcome');
  const g = gantry(tex, 9.6, 3.0, 7.4, 13.4); g.position.z = -wz; root.add(g); WORLD.pieces.push({ obj: g, wz, ext: 5 });
}
function spawnDirSign(wz, zi) {
  const lines = []; const here = ZONES[zi];
  for (let k = 1; k <= 2; k++) { const n = (zi + k) % ZONES.length; const d = zoneStartWz(n, wz) + (n <= zi ? LAP : 0) - wz; lines.push({ en: ZONES[n].name, te: ZONES[n].te, km: (d / 1000).toFixed(1) + ' km', arrow: '↑' }); }
  const area = pick(here.areas); lines.push({ en: area, te: AREA_TE[area], km: (Math.random() * 1.5 + .3).toFixed(1) + ' km', arrow: Math.random() < .5 ? '←' : '→' });
  const g = gantry(signTexture(lines, 'green'), 9.4, 3.1, 7.2, 13.2); g.position.z = -wz; root.add(g); WORLD.pieces.push({ obj: g, wz, ext: 5 });
}
function spawnAnimals(ch) {
  const types = ['giraffe', 'elephant', 'deer', 'lion', 'flamingo']; const t = pick(types); const s = Math.random() < .5 ? -1 : 1;
  const g = new THREE.Group(); const n = t === 'deer' || t === 'flamingo' ? 4 : t === 'lion' ? 1 : 2;
  for (let i = 0; i < n; i++) { const m = inst(t); m.position.set(s * rr(11, 22), 0, -rr(4, 26)); m.rotation.y = rr(0, 6.28); g.add(m); }
  if (t === 'lion') { const r = new Batch(); rockPile(r, s * 16, -15, 1.2); g.add(r.build()); }
  ch.group.add(g);
}

/* ---------- Ambient life: boats, side traffic, metro trains ---------- */
const AMB = [];
function spawnAmbient(ch) {
  const k = ch.zone.kind;
  if ((k === 'lake' || (k === 'bridge')) && Math.random() < .45) { const big = Math.random() < .2; const m = inst(big ? 'boatBig' : 'boat'); const x = (k === 'bridge' ? (Math.random() < .5 ? -1 : 1) : 1) * rr(22, 120); m.position.set(x, -1.2, 0); m.rotation.y = rr(0, 6.28); root.add(m); AMB.push({ m, wz: ch.wz0 + rr(0, 30), v: rr(-1.5, 1.5), bob: rr(0, 6), type: 'boat', y: -1.1 }); }
  if ((k === 'city' || k === 'metro' || k === 'tech' || k === 'hill') && Math.random() < .55) { const s = Math.random() < .5 ? -1 : 1; const m = inst(pick(['streetcar', 'auto', 'car2', 'car3', 'bus'])); m.children.forEach(c => c.castShadow = false); const x = s * (k === 'tech' ? 6.6 : 6.1); m.position.x = x; m.rotation.y = s < 0 ? Math.PI : 0; root.add(m); AMB.push({ m, wz: ch.wz0 + rr(0, 30), v: s < 0 ? rr(10, 16) : -rr(8, 14), type: 'car' }); }
  if (k === 'outskirts' && Math.random() < .4) { const m = inst(pick(['truck', 'car0', 'car3', 'bus'])); m.position.x = -9; m.rotation.y = Math.PI; root.add(m); AMB.push({ m, wz: ch.wz0 + rr(0, 30), v: rr(12, 18), type: 'car' }); }
  if ((k === 'metro' || k === 'tech') && Math.random() < .08) { const m = inst('metrotrain'); m.position.set(k === 'metro' ? 0 : -16, 11.6, 0); root.add(m); AMB.push({ m, wz: ch.wz0 + 120, v: -rr(14, 18), type: 'metro', len: 63 }); AU.metroChime && AU.metroChime(); }
}
function updateAmbient(dt, dist, t) {
  for (let i = AMB.length - 1; i >= 0; i--) {
    const a = AMB[i]; a.wz += a.v * dt;
    a.m.position.z = -a.wz;
    if (a.type === 'boat') { a.m.position.y = a.y + Math.sin(t * 1.3 + a.bob) * .12; a.m.rotation.z = Math.sin(t * .9 + a.bob) * .03; }
    if (a.wz < dist - 60 || a.wz > dist + Q.draw + 200) { root.remove(a.m); AMB.splice(i, 1); }
  }
}
function clearAmbient() { for (const a of AMB) root.remove(a.m); AMB.length = 0; }
