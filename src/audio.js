/* =========================================================
   Audio — everything synthesized with Web Audio (original).
   Soundtrack: electronic pulse + teenmaar-style dappu rhythm +
   a pluck lead in a Hijaz-flavoured scale.
   ========================================================= */
const AU = {
  ctx: null, on: false, intensity: 0, step: 0, nextT: 0, bar: 0, amb: {}, zoneAmb: 'bazaar',
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(c.destination);
    this.music = c.createGain(); this.sfx = c.createGain(); this.ambBus = c.createGain();
    this.music.connect(this.master); this.sfx.connect(this.master); this.ambBus.connect(this.master);
    const len = c.sampleRate * 2; this.noiseBuf = c.createBuffer(1, len, c.sampleRate); const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const bl = c.createBuffer(1, len, c.sampleRate); const bd = bl.getChannelData(0); let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = last * 3.5; } this.brownBuf = bl;
    this.setVolumes(); this.startAmbient(); this.nextT = c.currentTime + .1; this.on = true;
    setInterval(() => this.schedule(), 25);
  },
  setVolumes() { if (!this.ctx) return; const s = S.settings; this.music.gain.value = s.music * .5; this.sfx.gain.value = s.sfx * .8; this.ambBus.gain.value = s.amb * .55; },
  noise(t, dur, type, freq, q, gain, dest, attack = .002) {
    const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.sfx); src.start(t, Math.random()); src.stop(t + dur + .05); return f;
  },
  tone(t, freq, dur, type = 'sine', gain = .2, slide = null, dest, attack = .005) {
    const c = this.ctx, o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + .05); return o;
  },
  // ---------- music ----------
  SCALE: [261.63, 277.18, 329.63, 349.23, 392.0, 415.3, 466.16, 523.25, 554.37, 659.26],
  ROOTS: [65.41, 65.41, 69.3, 58.27],
  motif: null,
  newMotif() { const r = Math.random; const m = []; for (let i = 0; i < 16; i++) m.push(r() < .42 ? (r() < .5 ? Math.floor(r() * 5) : Math.floor(2 + r() * 6)) : -1); m[0] = 0; m[8] = m[8] < 0 ? 4 : m[8]; return m; },
  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx, spb = 60 / 118 / 4;
    while (this.nextT < c.currentTime + .12) { this.playStep(this.nextT, this.step); this.nextT += spb; this.step = (this.step + 1) % 16; if (this.step === 0) { this.bar = (this.bar + 1) % 8; if (this.bar % 4 === 0 || !this.motif) this.motif = this.bar === 0 || !this.motif ? this.newMotif() : this.motif; } }
  },
  playStep(t, s) {
    const I = this.intensity, M = this.music, root = this.ROOTS[this.bar % 4];
    if (!this.motif) this.motif = this.newMotif();
    // pad
    if (s === 0) { for (const mul of [4, 5, 6]) { const o = this.tone(t, root * mul * (mul === 5 ? (this.bar % 4 === 3 ? 1.189 / 1.26 : 1) : 1), 1.9, 'triangle', I ? .018 : .03, null, M, .4); } }
    // kick
    if (I >= 1 && s % 4 === 0) this.tone(t, 140, .28, 'sine', .55, 42, M);
    // dappu (teenmaar-style frame drum): 3-3-2 feel + fills
    const dap = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1];
    if (dap[s] && (I >= 1 || s % 8 === 0)) { const acc = s === 0 || s === 8 ? 1 : .7; this.noise(t, .09, 'bandpass', 900 + Math.random() * 300, 1.4, .32 * acc * (I ? 1 : .5), M); this.tone(t, 190, .1, 'sine', .22 * acc * (I ? 1 : .4), 95, M); }
    if (I >= 2 && (s === 13 || s === 15)) this.noise(t, .05, 'bandpass', 1600, 2, .18, M);
    // hats
    if (I >= 1 && s % 2 === 1) this.noise(t, .03, 'highpass', 7500, .7, .08, M);
    if (I >= 2 && s % 2 === 0) this.noise(t, .02, 'highpass', 9000, .7, .045, M);
    // bass
    const bp = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0];
    if (I >= 1 && bp[s]) { const f = root * (s === 10 ? 2 : 1); const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const flt = this.ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.setValueAtTime(600, t); flt.frequency.exponentialRampToValueAtTime(120, t + .2); const g = this.ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.22, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .24); o.connect(flt); flt.connect(g); g.connect(M); o.start(t); o.stop(t + .3); }
    // pluck lead
    const n = this.motif[s];
    if (n >= 0 && (I >= 1 || s % 2 === 0)) {
      const f = this.SCALE[n % this.SCALE.length] * (this.bar % 2 && s > 8 ? 1 : 1); const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.02, t); o.frequency.exponentialRampToValueAtTime(f, t + .04);
      const o2 = this.ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = f * 2.003;
      const flt = this.ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.setValueAtTime(3200, t); flt.frequency.exponentialRampToValueAtTime(500, t + .3); flt.Q.value = 3;
      const g = this.ctx.createGain(); const v = I ? .07 : .045; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + .45);
      const g2 = this.ctx.createGain(); g2.gain.value = .25; o2.connect(g2); g2.connect(flt);
      o.connect(flt); flt.connect(g); g.connect(M); o.start(t); o2.start(t); o.stop(t + .5); o2.stop(t + .5);
    }
  },
  // ---------- sfx ----------
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  coin() { if (!this.on) return; const t = this.now(); const p = 1 + Math.random() * .06; this.tone(t, 1318 * p, .08, 'square', .05); this.tone(t + .05, 1975 * p, .16, 'square', .045); },
  pearl() { if (!this.on) return; const t = this.now(); this.tone(t, 1568, .5, 'sine', .15); this.tone(t, 3136, .3, 'sine', .05); this.tone(t + .06, 2093, .4, 'triangle', .08); },
  star() { if (!this.on) return; const t = this.now(); [784, 988, 1175, 1568, 1976].forEach((f, i) => this.tone(t + i * .05, f, .25, 'square', .05)); },
  jump() { if (!this.on) return; const t = this.now(); this.tone(t, 300, .18, 'sine', .12, 620); this.noise(t, .12, 'bandpass', 1400, 1, .06); },
  land() { if (!this.on) return; const t = this.now(); this.tone(t, 120, .1, 'sine', .15, 60); this.noise(t, .06, 'lowpass', 600, 1, .08); },
  slide() { if (!this.on) return; const t = this.now(); const f = this.noise(t, .4, 'bandpass', 2400, 1.2, .1); f.frequency.exponentialRampToValueAtTime(500, t + .4); },
  lane() { if (!this.on) return; const t = this.now(); const f = this.noise(t, .12, 'bandpass', 900, 2, .06); f.frequency.exponentialRampToValueAtTime(2200, t + .12); },
  dash() { if (!this.on) return; const t = this.now(); const f = this.noise(t, .5, 'bandpass', 400, 1.5, .18); f.frequency.exponentialRampToValueAtTime(3000, t + .45); this.tone(t, 180, .4, 'sawtooth', .06, 520); },
  stumble() { if (!this.on) return; const t = this.now(); this.tone(t, 160, .2, 'square', .12, 80); this.noise(t, .15, 'lowpass', 900, 1, .2); this.horn(.08); },
  crash() { if (!this.on) return; const t = this.now(); this.noise(t, .9, 'lowpass', 1400, .7, .5); this.tone(t, 90, .7, 'sine', .45, 35); this.noise(t + .05, .5, 'bandpass', 3000, 1, .15); },
  power() { if (!this.on) return; const t = this.now(); [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(t + i * .06, f, .3, 'triangle', .09)); },
  shieldBreak() { if (!this.on) return; const t = this.now(); this.noise(t, .5, 'highpass', 4000, .8, .25); this.tone(t, 1760, .6, 'sine', .08, 880); },
  mission() { if (!this.on) return; const t = this.now(); [659, 784, 1046].forEach((f, i) => this.tone(t + i * .09, f, .35, 'triangle', .1)); },
  landmark() { if (!this.on) return; const t = this.now(); [392, 523, 659, 784].forEach((f, i) => { this.tone(t + i * .12, f, 1.2, 'triangle', .07, null, this.sfx, .02); }); this.tone(t, 98, 1.6, 'sine', .15); },
  horn(g = .07, low = false) { if (!this.on) return; const t = this.now(); const f = low ? 280 : 480; this.tone(t, f, .16, 'square', g); this.tone(t, f * 1.26, .16, 'square', g * .8); this.tone(t + .2, f, .22, 'square', g); this.tone(t + .2, f * 1.26, .22, 'square', g * .8); },
  trainHorn() { if (!this.on) return; const t = this.now(); for (const f of [311, 370, 466]) { this.tone(t, f, 1.4, 'sawtooth', .035, null, this.sfx, .08); } },
  metroChime() { if (!this.on) return; const t = this.now(); [880, 698, 587].forEach((f, i) => this.tone(t + i * .35, f, .9, 'sine', .06, null, this.ambBus, .01)); },
  stationChime() { if (!this.on) return; const t = this.now(); [659, 784, 988, 784].forEach((f, i) => this.tone(t + i * .28, f, .9, 'sine', .05, null, this.ambBus, .01)); },
  bird() { if (!this.on) return; const t = this.now(); const f = 2200 + Math.random() * 1600; for (let i = 0; i < 3; i++) this.tone(t + i * .09, f, .07, 'sine', .025, f * 1.4, this.ambBus); },
  bell() { if (!this.on) return; const t = this.now(); this.tone(t, 1244, 2.2, 'sine', .05, null, this.ambBus); this.tone(t, 2093, 1.5, 'sine', .02, null, this.ambBus); },
  echoClap() { if (!this.on) return; const t = this.now(); for (let i = 0; i < 4; i++) this.noise(t + i * .32, .06, 'bandpass', 1800, 1.5, .12 / (i + 1), this.ambBus); },
  thunder() { if (!this.on) return; const t = this.now() + .3 + Math.random(); this.noise(t, 2.5, 'lowpass', 180, .5, .5, this.ambBus, .1); },
  countdown(hi) { if (!this.on) return; const t = this.now(); this.tone(t, hi ? 1046 : 523, .18, 'square', .08); },
  // ---------- ambience beds ----------
  startAmbient() {
    const c = this.ctx; const mk = (buf, type, f, q) => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(this.ambBus); s.start(0, Math.random()); return { g, fl }; };
    this.amb.traffic = mk(this.brownBuf, 'lowpass', 380, .7); this.amb.crowd = mk(this.noiseBuf, 'bandpass', 900, .8); this.amb.rain = mk(this.noiseBuf, 'highpass', 2500, .5);
    this.amb.water = mk(this.brownBuf, 'lowpass', 700, .5); this.amb.wind = mk(this.noiseBuf, 'bandpass', 500, 2);
  },
  evTimer: 0,
  update(dt, kind, speed, playing) {
    if (!this.ctx || !this.on) return;
    const k = kind; const t = this.ctx.currentTime;
    const set = (n, v) => this.amb[n] && this.amb[n].g.gain.setTargetAtTime(v, t, .8);
    const busy = { old: 1, city: .9, metro: .9, tech: .8, hill: .6, railcity: .8, rail: .5, lake: .4, bridge: .4, campus: .15, zoo: .05, fort: 0, tombs: .05, outskirts: .3 }[k] || .5;
    set('traffic', busy * .5); set('crowd', ({ old: .35, rail: .4, railcity: .2, city: .12, campus: .12, metro: .15 }[k] || .03) * (1 + Math.sin(t * .7) * .3));
    set('rain', ENV.rain * .6); set('water', ({ lake: .45, bridge: .5, zoo: .1 }[k] || 0) * (1 + Math.sin(t * .4) * .3));
    set('wind', .06 + Math.min(.3, speed / 100) + ({ fort: .15, outskirts: .12, tombs: .08 }[k] || 0));
    this.amb.wind.fl.frequency.setTargetAtTime(400 + Math.sin(t * .3) * 200 + speed * 10, t, .5);
    this.evTimer -= dt; if (this.evTimer > 0) return; this.evTimer = 1.2 + Math.random() * 2.5;
    const r = Math.random();
    if ((k === 'old' || k === 'city' || k === 'metro' || k === 'tech' || k === 'railcity') && r < .5) this.horn(.02 + Math.random() * .025, Math.random() < .3);
    else if ((k === 'zoo' || k === 'campus' || k === 'tombs' || k === 'outskirts' || k === 'lake') && r < .6) this.bird();
    else if (k === 'rail' && r < .25) this.trainHorn(); else if (k === 'rail' && r < .45) this.stationChime();
    else if (k === 'hill' && r < .25) this.bell();
    else if (k === 'fort' && r < .2) this.echoClap();
  }
};
