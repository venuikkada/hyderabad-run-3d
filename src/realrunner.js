/* =========================================================
   Realistic runner: motion-captured skinned model (glTF),
   with a wrapper that falls back to the stylized runner.
   ========================================================= */
const REAL = { gltf: null };
function loadRealRunner(url = 'Soldier.glb') {
  return new Promise(res => {
    if (!THREE.GLTFLoader) return res(null);
    const timer = setTimeout(() => res(null), 25000);
    try { if (window.RUNNER_B64) { const bin = atob(window.RUNNER_B64); const buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i); new THREE.GLTFLoader().parse(buf.buffer, '', g => { clearTimeout(timer); REAL.gltf = g; res(g); }, e => { clearTimeout(timer); console.warn('Runner model did not load', e); res(null); }); return; }
      new THREE.GLTFLoader().load(url, g => { clearTimeout(timer); REAL.gltf = g; res(g); }, undefined, e => { clearTimeout(timer); console.warn('Runner model did not load', e); res(null); }); }
    catch (e) { clearTimeout(timer); res(null); }
  });
}
class RealRunner {
  constructor(gltf) {
    this.g = new THREE.Group(); this.body = new THREE.Group(); this.g.add(this.body);
    const m = gltf.scene; this.model = m; this.body.add(m); this.mats = [];
    m.traverse(o => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; o.material = o.material.clone(); o.material.envMapIntensity = .9; if (o.material.map) o.material.map.anisotropy = 8; this.mats.push(o.material); }
    });
    this.mixer = new THREE.AnimationMixer(m); this.act = {}; this.w = {};
    for (const clip of gltf.animations) { if (clip.name === 'TPose') continue; const a = this.mixer.clipAction(clip); a.play(); a.setEffectiveWeight(clip.name === 'Idle' ? 1 : 0); this.act[clip.name] = a; this.w[clip.name] = clip.name === 'Idle' ? 1 : 0; }
  }
  build(d) {
    this.def = d; const k = d.tintK != null ? d.tintK : .45;
    for (const mt of this.mats) { if (/visor/i.test(mt.name)) continue; mt.color.setRGB(1, 1, 1).lerp(C(d.top || '#ffffff'), d.top && d.top !== '#ffffff' ? k : 0); }
  }
  update(dt, st) {
    const tgt = { Idle: 0, Run: 0, Walk: 0 }; let ts = 1, rx = 0, y = 0, rate = 10;
    switch (st.pose) {
      case 'run': tgt.Run = 1; ts = clamp(st.speed / 10, .95, 2.1); rx = -.07; break;
      case 'jump': tgt.Run = 1; ts = .3; rx = -.16; break;
      case 'slide': tgt.Idle = 1; rx = 1.22; y = .3; rate = 16; break;
      case 'crash': tgt.Idle = 1; rx = 1.45; y = .12; rate = 7; break;
      default: tgt.Idle = 1;
    }
    for (const n in this.act) { const w = damp(this.w[n], tgt[n] || 0, 12, dt); this.w[n] = w; this.act[n].setEffectiveWeight(w); }
    if (this.act.Run) this.act.Run.timeScale = ts;
    this.mixer.update(dt);
    this.body.rotation.x = damp(this.body.rotation.x, rx, rate, dt); this.body.position.y = damp(this.body.position.y, y, 14, dt);
    this.g.rotation.z = damp(this.g.rotation.z, st.tilt || 0, 10, dt);
  }
}
class PlayerAvatar {
  constructor() { this.g = new THREE.Group(); this.proc = new Runner(); this.real = null; this.cur = null; }
  build(d) {
    const next = d.real && REAL.gltf ? (this.real || (this.real = new RealRunner(REAL.gltf))) : this.proc;
    if (this.cur && this.cur !== next) this.g.remove(this.cur.g);
    this.cur = next; if (next.g.parent !== this.g) this.g.add(next.g); next.build(d);
  }
  update(dt, st) { if (this.cur) this.cur.update(dt, st); }
}

/* ---------- Image-based lighting from the live sky ---------- */
const ENVMAP = { pmrem: null, scene: null, rt: null, t: -99, tod: -1, cl: -1 };
function initEnvMap() {
  try { ENVMAP.pmrem = new THREE.PMREMGenerator(renderer); ENVMAP.scene = new THREE.Scene(); const sm = skyMesh.material; const fs = sm.fragmentShader.replace('gl_FragColor = vec4(c, 1.0);', 'gl_FragColor = linearToOutputTexel(vec4(pow(max(c, vec3(0.0)), vec3(2.2)), 1.0));'); if (fs === sm.fragmentShader) throw new Error('sky shader'); ENVMAP.scene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({ uniforms: sm.uniforms, vertexShader: sm.vertexShader, fragmentShader: fs, side: THREE.BackSide, depthWrite: false }))); } catch (e) { ENVMAP.pmrem = null; }
}
function refreshEnvMap(force = false) {
  if (!ENVMAP.pmrem) return;
  const low = Q === QUALITY.low;
  if (!force && (low || G.time - ENVMAP.t < 1.5 || (Math.abs(ENV.tod - ENVMAP.tod) < .005 && Math.abs(ENV.cloud - ENVMAP.cl) < .03))) return;
  ENVMAP.t = G.time; ENVMAP.tod = ENV.tod; ENVMAP.cl = ENV.cloud;
  const rt = ENVMAP.pmrem.fromScene(ENVMAP.scene, 0); if (ENVMAP.rt) ENVMAP.rt.dispose(); ENVMAP.rt = rt; scene.environment = rt.texture;
}
function tuneMaterialsForIBL() {
  const soft = ['paint', 'facade', 'old', 'lmk', 'leaf', 'rock', 'road', 'oldroad', 'highway', 'bridgeRoad', 'grass', 'earth', 'pave', 'stone', 'curb', 'signs', 'plank', 'ballast', 'rail', 'fence'];
  for (const k of soft) if (MAT[k]) MAT[k].envMapIntensity = .4;
  MAT.glass.metalness = .7; MAT.glass.roughness = .1; MAT.glass.envMapIntensity = 1.3;
  MAT.shiny.metalness = .5; MAT.shiny.roughness = .22; MAT.shiny.envMapIntensity = 1.1;
  MAT.metal.envMapIntensity = 1; MAT.bronze.envMapIntensity = 1;
  MAT.water.metalness = .75; MAT.water.roughness = .06; MAT.water.envMapIntensity = 1.2; MAT.water.emissiveIntensity = .2;
  // surface relief from the same procedural textures
  const bump = [[MAT.road, TX.road, .02], [MAT.oldroad, TX.oldroad, .025], [MAT.highway, TX.highway, .02], [MAT.stone, TX.stone, .06], [MAT.pave, TX.pave, .04], [MAT.facade, TX.city.map, .035], [MAT.old, TX.old.map, .045], [MAT.ballast, TX.ballast, .06], [MAT.plank, TX.plank, .04], [MAT.earth, TX.earth, .05], [MAT.grass, TX.grass, .03]];
  for (const [m, t, s] of bump) { m.bumpMap = t; m.bumpScale = s; m.needsUpdate = true; }
}
