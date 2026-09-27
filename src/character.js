/* =========================================================
   Runner character: hierarchical primitives + procedural animation.
   Faces -z (away from the chase camera).
   ========================================================= */
class Runner {
  constructor() { this.g = new THREE.Group(); this.phase = 0; this.pose = 'idle'; this.slideT = 0; this.air = 0; this.tilt = 0; this.dupPts = null; }
  mat(c, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color: C(c), roughness: .72 }, o)); }
  mesh(geo, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, parent) { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.scale.set(sx, sy, sz); me.castShadow = true; (parent || this.g).add(me); return me; }
  build(d) {
    while (this.g.children.length) this.g.remove(this.g.children[0]);
    this.def = d; const f = d.g === 'f';
    const B = new THREE.BoxGeometry(1, 1, 1), S = new THREE.SphereGeometry(.5, 16, 12), CY = new THREE.CylinderGeometry(.5, .5, 1, 12), HEMI = new THREE.SphereGeometry(.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const skin = this.mat(d.skin, { roughness: .6 }), hair = this.mat(d.hairC, { roughness: .5 }), top = this.mat(d.top), bot = this.mat(d.bottom), shoe = this.mat(d.shoe, { roughness: .45 }), white = this.mat('#f4f4f2'), dark = this.mat('#141414'), gold = this.mat('#d9a93a', { metalness: .6, roughness: .3 });
    const o = d.outfit;
    const hips = this.hips = new THREE.Group(); hips.position.y = .96; this.g.add(hips);
    const torso = this.torso = new THREE.Group(); hips.add(torso);
    const tw = f ? .36 : .42;
    // pelvis
    this.mesh(B, o === 'sports' ? bot : bot, 0, -.02, 0, tw, .18, .22, hips);
    // chest
    const chestMat = o === 'corporate' ? top : top;
    this.mesh(B, chestMat, 0, .28, 0, tw, .5, .24, torso);
    if (f) this.mesh(S, chestMat, 0, .36, -.08, .3, .16, .14, torso);
    if (o === 'corporate') { this.mesh(B, white, 0, .38, -.121, .12, .28, .01, torso); this.mesh(B, this.mat(d.g === 'm' ? '#a4262c' : '#e9b949'), 0, .33, -.125, .05, .26, .01, torso); }
    if (o === 'traditional' && !f) { for (let i = 0; i < 4; i++) this.mesh(S, gold, 0, .46 - i * .1, -.125, .025, .025, .025, torso); this.mesh(CY, top, 0, .52, 0, .2, .06, .2, torso); }
    if (o === 'sports') { this.mesh(B, this.mat('#ffffff'), 0, .3, -.122, .16, .12, .01, torso); }
    // skirt / long coat
    this.skirt = null;
    if (o === 'traditional') { const len = f ? .72 : .6; const sk = new THREE.Mesh(new THREE.CylinderGeometry(f ? .2 : .22, f ? .42 : .3, len, 14, 1, true), f ? bot : top); sk.material.side = THREE.DoubleSide; sk.position.y = -len / 2 + .02; sk.castShadow = true; hips.add(sk); this.skirt = sk; if (f) { const bd = new THREE.Mesh(new THREE.CylinderGeometry(.425, .425, .05, 14, 1, true), gold); bd.position.y = -len / 2 + .03; sk.add(bd); } }
    if (o === 'corporate' && !f) { const coat = new THREE.Mesh(new THREE.CylinderGeometry(.23, .25, .2, 12, 1, true), top); coat.material.side = THREE.DoubleSide; coat.position.y = -.08; hips.add(coat); }
    // neck & head
    this.mesh(CY, skin, 0, .56, 0, .1, .1, .1, torso);
    const head = this.head = new THREE.Group(); head.position.y = .72; torso.add(head);
    this.mesh(S, skin, 0, 0, 0, .24, .28, .25, head);
    for (const s of [-1, 1]) { this.mesh(S, dark, s * .055, .02, -.115, .03, .035, .02, head); this.mesh(S, skin, s * .125, .0, 0, .05, .08, .05, head); }
    this.mesh(B, skin, 0, -.02, -.13, .04, .06, .03, head);
    const hs = d.hair;
    if (hs === 'buzz') this.mesh(HEMI, hair, 0, .015, .005, .255, .27, .262, head);
    else if (hs === 'curly') { this.mesh(HEMI, hair, 0, .02, .01, .26, .28, .27, head); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; this.mesh(S, hair, Math.sin(a) * .1, .09 + Math.cos(i * 2.1) * .03, Math.cos(a) * .1 + .02, .1, .1, .1, head); } }
    else { this.mesh(HEMI, hair, 0, .02, .012, .265, .3, .275, head); if (hs !== 'short') this.mesh(B, hair, 0, -.02, .1, .24, .14, .08, head); }
    this.tail = null;
    if (hs === 'long') { const t = new THREE.Group(); t.position.set(0, .02, .1); head.add(t); this.mesh(B, hair, 0, -.18, .02, .26, .38, .07, t); this.tail = t; }
    if (hs === 'ponytail') { const t = new THREE.Group(); t.position.set(0, .06, .13); head.add(t); this.mesh(CY, hair, 0, -.14, .03, .08, .3, .08, t); this.mesh(S, hair, 0, -.3, .04, .1, .12, .1, t); this.tail = t; }
    if (hs === 'bun') this.mesh(S, hair, 0, .1, .13, .14, .14, .14, head);
    const acc = d.acc;
    if (acc === 'cap') { if (o === 'traditional' && !f) { this.mesh(CY, this.mat('#1b1b1b'), 0, .12, .01, .25, .12, .25, head); } else { this.mesh(HEMI, this.mat(d.top), 0, .06, .01, .28, .2, .28, head); this.mesh(B, this.mat(d.top), 0, .07, -.16, .22, .02, .14, head); } }
    if (acc === 'headphones') { const band = new THREE.Mesh(new THREE.TorusGeometry(.14, .018, 6, 16, Math.PI), dark); band.position.y = .02; head.add(band); for (const s of [-1, 1]) this.mesh(CY, this.mat('#27d3b0'), s * .14, 0, 0, .1, .05, .1, head).rotation.z = Math.PI / 2; }
    if (acc === 'glasses') { for (const s of [-1, 1]) this.mesh(B, dark, s * .06, .025, -.13, .08, .04, .01, head); this.mesh(B, dark, 0, .03, -.13, .06, .01, .01, head); }
    if (acc === 'band') { const band = new THREE.Mesh(new THREE.TorusGeometry(.128, .02, 6, 20), this.mat('#e2231a')); band.rotation.x = Math.PI / 2; band.position.y = .07; head.add(band); }
    if (acc === 'backpack') this.mesh(B, this.mat('#2a3550'), 0, .28, .17, .3, .38, .14, torso);
    this.dup = null;
    if (acc === 'dupatta') { const dm = this.mat(f ? '#f2a900' : '#c2185b', { side: THREE.DoubleSide }); const band = this.mesh(B, dm, 0, .3, 0, .06, .62, .26, torso); band.rotation.z = .8; const tail = new THREE.Mesh(new THREE.PlaneGeometry(.22, .7, 1, 6), dm); tail.position.set(.15, .38, .14); tail.castShadow = true; torso.add(tail); this.dup = tail; this.dupBase = tail.geometry.attributes.position.array.slice(); }
    // arms
    const longSleeve = o === 'corporate' || o === 'traditional'; const sleeveless = o === 'sports';
    this.arms = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(s * (tw / 2 + .06), .48, 0); torso.add(sh);
      this.mesh(B, sleeveless ? skin : top, 0, -.15, 0, .11, .32, .12, sh);
      const el = new THREE.Group(); el.position.y = -.3; sh.add(el);
      this.mesh(B, longSleeve ? top : skin, 0, -.13, 0, .1, .28, .1, el);
      this.mesh(S, skin, 0, -.3, 0, .09, .1, .09, el);
      if (o === 'sports' && s > 0) this.mesh(CY, this.mat('#111'), 0, -.2, 0, .11, .05, .11, el);
      this.arms.push({ sh, el });
    }
    // legs
    this.legs = [];
    const shorts = o === 'sports';
    for (const s of [-1, 1]) {
      const hp = new THREE.Group(); hp.position.set(s * (f ? .09 : .1), -.06, 0); hips.add(hp);
      this.mesh(B, bot, 0, -.22, 0, .15, .44, .16, hp);
      const kn = new THREE.Group(); kn.position.y = -.44; hp.add(kn);
      this.mesh(B, shorts ? skin : (o === 'traditional' && f ? skin : bot), 0, -.21, 0, .13, .42, .14, kn);
      if (shorts) this.mesh(B, white, 0, -.3, 0, .135, .16, .145, kn);
      const ft = new THREE.Group(); ft.position.y = -.43; kn.add(ft);
      this.mesh(B, shoe, 0, -.03, -.05, .14, .08, .28, ft); this.mesh(B, white, 0, -.07, -.05, .145, .02, .285, ft);
      this.legs.push({ hp, kn, ft });
    }
    this.g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  }
  update(dt, st) {
    const d = this.def || {}; const style = d.run || 'sprint';
    const A = style === 'stride' ? 1.05 : style === 'bouncy' ? .8 : .95; const bob = style === 'bouncy' ? 1.8 : 1;
    const L = this.legs, Ar = this.arms; if (!L) return;
    const hips = this.hips, torso = this.torso;
    let tgt = { hipsY: .96, hipsRX: 0, torsoRX: -.18, torsoRY: 0 };
    if (st.pose === 'run') {
      this.phase += dt * (st.speed * .62 + 4) * (style === 'stride' ? .88 : 1);
      const p = this.phase, sp = Math.sin(p), cp = Math.cos(p);
      L[0].hp.rotation.x = sp * A; L[1].hp.rotation.x = -sp * A;
      L[0].kn.rotation.x = -(.2 + 1.35 * Math.max(0, cp)); L[1].kn.rotation.x = -(.2 + 1.35 * Math.max(0, -cp));
      L[0].ft.rotation.x = .3 * Math.max(0, cp); L[1].ft.rotation.x = .3 * Math.max(0, -cp);
      Ar[0].sh.rotation.x = -sp * A * .9; Ar[1].sh.rotation.x = sp * A * .9; Ar[0].el.rotation.x = Ar[1].el.rotation.x = 1.35;
      Ar[0].sh.rotation.z = -.12; Ar[1].sh.rotation.z = .12;
      tgt.hipsY = .96 + Math.abs(Math.cos(p)) * .06 * bob - .03; tgt.torsoRX = style === 'sprint' ? -.28 : -.18; tgt.torsoRY = sp * .12;
      if (this.skirt) this.skirt.rotation.x = sp * .08;
    } else if (st.pose === 'jump') {
      const k = st.vy > 0 ? 1 : .6;
      L[0].hp.rotation.x = 1.0 * k; L[0].kn.rotation.x = -1.5 * k; L[1].hp.rotation.x = -.35; L[1].kn.rotation.x = -.9;
      Ar[0].sh.rotation.x = -1.2; Ar[1].sh.rotation.x = .8; Ar[0].el.rotation.x = Ar[1].el.rotation.x = 1.1; Ar[0].sh.rotation.z = -.5; Ar[1].sh.rotation.z = .5;
      tgt.torsoRX = -.12;
    } else if (st.pose === 'slide') {
      L[0].hp.rotation.x = 1.35; L[0].kn.rotation.x = -.15; L[1].hp.rotation.x = 1.0; L[1].kn.rotation.x = -1.2;
      Ar[0].sh.rotation.x = -.6; Ar[1].sh.rotation.x = -.6; Ar[0].sh.rotation.z = -.9; Ar[1].sh.rotation.z = .9; Ar[0].el.rotation.x = Ar[1].el.rotation.x = .3;
      tgt.hipsY = .38; tgt.hipsRX = 1.05; tgt.torsoRX = -.1;
    } else if (st.pose === 'crash') {
      L[0].hp.rotation.x = .6; L[1].hp.rotation.x = .2; L[0].kn.rotation.x = -.4; L[1].kn.rotation.x = -.8;
      Ar[0].sh.rotation.x = -2.2; Ar[1].sh.rotation.x = -2.0; Ar[0].sh.rotation.z = -.6; Ar[1].sh.rotation.z = .6;
      tgt.hipsY = .3; tgt.hipsRX = 1.35; tgt.torsoRX = .1;
    } else { // idle
      this.phase += dt * 1.6; const b = Math.sin(this.phase);
      for (const l of L) { l.hp.rotation.x = 0; l.kn.rotation.x = -.05; l.ft.rotation.x = 0; }
      Ar[0].sh.rotation.x = b * .05; Ar[1].sh.rotation.x = -b * .05; Ar[0].el.rotation.x = Ar[1].el.rotation.x = .25; Ar[0].sh.rotation.z = -.08; Ar[1].sh.rotation.z = .08;
      tgt.hipsY = .96 + b * .008; tgt.torsoRX = .02; tgt.torsoRY = Math.sin(this.phase * .3) * .15;
      this.head.rotation.y = Math.sin(this.phase * .37) * .35;
    }
    if (st.pose !== 'idle') this.head.rotation.y = damp(this.head.rotation.y, 0, 8, dt);
    const r = st.pose === 'slide' || st.pose === 'crash' ? 18 : 12;
    hips.position.y = damp(hips.position.y, tgt.hipsY, r, dt); hips.rotation.x = damp(hips.rotation.x, tgt.hipsRX, r, dt);
    torso.rotation.x = damp(torso.rotation.x, tgt.torsoRX, 10, dt); torso.rotation.y = damp(torso.rotation.y, tgt.torsoRY, 10, dt);
    this.g.rotation.z = damp(this.g.rotation.z, st.tilt || 0, 10, dt);
    if (this.tail) this.tail.rotation.x = .5 + Math.sin(this.phase * 2) * .25 * (st.pose === 'run' ? 1 : .2) + (st.pose === 'jump' ? -.4 : 0);
    if (this.dup) { const a = this.dup.geometry.attributes.position; const base = this.dupBase; const t = performance.now() / 1000; for (let i = 0; i < a.count; i++) { const y = base[i * 3 + 1]; const k = (.35 - y) / .7; a.array[i * 3 + 2] = base[i * 3 + 2] + k * k * (.35 + Math.sin(t * 9 + k * 4) * .08) * (st.pose === 'idle' ? .2 : 1); } a.needsUpdate = true; }
  }
}
