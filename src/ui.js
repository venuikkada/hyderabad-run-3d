/* =========================================================
   UI: screens, HUD, map diorama, intro flight, input, loop
   ========================================================= */
const SCREENS = ['menu', 'modes', 'missions', 'board', 'settings', 'chars', 'map', 'intro', 'hud', 'pause', 'results', 'revive'];
function show(id, on = true) { const el = $('#' + id); if (el) el.hidden = !on; }
function only(...ids) { for (const s of SCREENS) show(s, ids.includes(s)); }
function showHUD(on) { show('hud', on); $('#dashBtn').hidden = !IS_TOUCH && !navigator.getGamepads; }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function toast(html) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 2900); while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove(); }
function flashHit() { const v = $('#vignette'); v.classList.add('hit'); setTimeout(() => v.classList.remove('hit'), 260); }
let bannerTimer = 0;
function showBanner(z) { $('#bEye').textContent = 'Now passing · ' + (z.full || z.name); $('#bTe').textContent = z.lm.te; $('#bName').textContent = z.lm.name; $('#bFact').textContent = z.lm.fact; $('#banner').classList.add('show'); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => $('#banner').classList.remove('show'), 4600); }

/* ---------- HUD ---------- */
const HUDC = {}; let routeZone = -1;
function setText(id, v) { if (HUDC[id] !== v) { HUDC[id] = v; $('#' + id).textContent = v; } }
function buildRoute(zi) {
  routeZone = zi; const rl = $('#hRl'); rl.innerHTML = ''; const z = ZONES[zi];
  const line = document.createElement('div'); line.className = 'rline'; line.style.background = z.line; rl.appendChild(line);
  const pos = [6, 36, 66, 94]; [-1, 0, 1, 2].forEach((k, i) => { const zz = ZONES[(zi + k + ZONES.length) % ZONES.length]; const st = document.createElement('div'); st.className = 'st' + (k === 0 ? ' cur' : ''); st.style.left = pos[i] + '%'; st.innerHTML = '<i style="border-color:' + (k === 0 ? 'var(--gold)' : z.line) + '"></i><span></span>'; st.querySelector('span').textContent = zz.name; rl.appendChild(st); });
  const me = document.createElement('div'); me.className = 'me'; me.id = 'hMe'; rl.appendChild(me);
}
function updateHudStatic() { routeZone = -1; HUDC.x = 0; for (const k in HUDC) delete HUDC[k]; $('#timer').hidden = G.mode !== 'ta'; const ob = $('#objective'); ob.hidden = !G.cfg.objective; if (G.cfg.objective) ob.textContent = G.cfg.objective; }
function updateHud() {
  setText('hScore', fmtIN(G.score)); setText('hDist', fmtKm(G.runDist)); setText('hTok', fmtIN(G.tokens)); setText('hMult', '×' + (G.mult || 1 + S.multLevel)); setText('hSpd', String(Math.round(G.speed * 3.6)));
  const zi = G.zoneIdx; if (zi !== routeZone) buildRoute(zi);
  const z = ZONES[zi]; const loc = zoneLocal(G.dist); const me = $('#hMe'); if (me) me.style.left = (36 + clamp(loc / z.len, 0, 1) * 30) + '%';
  setText('hCur', z.full || z.name);
  const nl = nextLandmark(G.dist); if (nl) { setText('hNext', nl.z.lm.name + ' · ' + fmtKm(nl.wz - G.dist)); }
  if (G.mode === 'ta') { const tl = $('#timer'); setText('timer', fmtTime(G.timeLeft)); tl.classList.toggle('low', G.timeLeft < 10); }
  // powers
  const keys = Object.keys(G.powers).sort().join(','); if (HUDC.pk !== keys) { HUDC.pk = keys; $('#hPowers').innerHTML = Object.keys(G.powers).map(k => `<div class="pw" data-p="${k}"><i style="background:${POWERS[k].color}"></i><span class="pn">${POWERS[k].name}</span><span class="pb"><u></u></span></div>`).join(''); }
  for (const el of $('#hPowers').children) { const k = el.dataset.p; if (G.powers[k] != null) el.querySelector('u').style.width = clamp(G.powers[k] / POWERS[k].dur * 100, 0, 100) + '%'; }
  const cd = clamp(1 - G.dashCD / 7, 0, 1); $('#dashRing').style.strokeDashoffset = String(213.6 * (1 - cd)); $('#dashBtn').classList.toggle('ready', cd >= 1);
}

/* ---------- Menus ---------- */
function refreshMenu() {
  setMenuText('stBest', fmtIN(S.best.score)); setMenuText('stDist', fmtKm(S.best.dist)); setMenuText('stTok', fmtIN(S.tokens)); setMenuText('stLm', S.unlocked.length + '/' + ZONES.length);
  setMenuText('mmMap', S.unlocked.length + ' of ' + ZONES.length + ' unlocked'); const cd = charDef(); setMenuText('mmChar', cd.name + ' · ' + OUTFIT_NAMES[cd.outfit]); setMenuText('mmMis', 'Set ' + (S.mis.tier + 1) + ' of ' + MIS_TOTAL / 3);
  const mm = $('#menuMissions'); mm.innerHTML = '<h4>Current missions · multiplier ×' + (1 + S.multLevel) + '</h4>' + [0, 1, 2].map(s => { const m = missionAt(S.mis.tier, s); return `<div class="mrow${S.mis.done[s] ? ' done' : ''}"><i></i><span>${esc(missionText(m))}</span></div>`; }).join('');
}
function setMenuText(id, v) { const e = $('#' + id); if (e) e.textContent = v; }
function openSheet(id) {
  AU.init();
  if (id === 'map') { openMap(); return; }
  if (id === 'chars') { openChars(); return; }
  only('menu', id); $('#menu').hidden = true;
  if (id === 'modes') renderModes(); if (id === 'missions') renderMissions(); if (id === 'board') renderBoard(); if (id === 'settings') renderSettings();
}
function closeSheets() { if (G.state === 'map') closeMap(); if (G.state === 'chars') closeChars(); if (G.state === 'paused') return; only('menu'); refreshMenu(); G.state = 'menu'; }
function goMenu() {
  clearRun(); G.state = 'menu'; showHUD(false); only('menu'); AU.intensity = 0; G.slowmo = 1; G.cine = 0;
  G.startWz = 0; G.dist = 0; G.px = 0; G.py = 0; G.lane = 1; G.speed = 0; resetWorld(0); ENV.tod = .03; setWeather('clear', true); setSkyInstant('old'); player.build(charDef());
  refreshMenu();
}
function renderModes() {
  const b = $('#modesBody'); const u = new Set(S.unlocked);
  let h = `<div class="card"><div class="grow"><h3>Endless Hyderabad Run</h3><p>Start at Charminar and run the whole city, lap after lap. Speed keeps rising.</p></div><button class="btn primary" data-go="endless">Run</button></div>`;
  h += `<p class="sec-title">Landmark Tour · three stars per landmark</p><div class="list">` + ZONES.map((z, i) => { const on = u.has(i); const st = S.tour[i] || 0; return `<div class="card${on ? '' : ' locked'}"><div class="grow"><h3>${esc(z.full || z.name)}</h3><p>Cross it · collect ${Math.round(z.len / 14)} tokens · no stumbles</p><div class="stars">${[1, 2, 3].map(k => `<span class="${k <= st ? '' : 'off'}">★</span>`).join('')}</div></div>${on ? `<button class="btn" data-tour="${i}">Start</button>` : '<span class="pill lock">Reach it first</span>'}</div>`; }).join('') + `</div>`;
  h += `<p class="sec-title">Time Attack</p><div class="list">` + TA_ROUTES.map(r => { const on = u.has(r.from); const best = S.ta[r.id]; return `<div class="card${on ? '' : ' locked'}"><div class="grow"><h3>${esc(r.name)}</h3><p>${esc(ZONES[r.from].name)} → ${esc(ZONES[r.to].name)} · ${fmtKm(ZSTART[r.to] - ZSTART[r.from])} in ${fmtTime(taAllowed(r))}${best ? ' · best ' + fmtTime(best) : ''}</p></div>${on ? `<button class="btn" data-ta="${r.id}">Race</button>` : '<span class="pill lock">Locked</span>'}</div>`; }).join('') + `</div>`;
  h += `<p class="sec-title">Challenges</p><div class="list">` + CHALLENGES.map(c => { const on = u.has(c.start) || c.start === 0; const done = S.chal[c.id]; return `<div class="card${on ? '' : ' locked'}"><div class="grow"><h3>${esc(c.name)} ${done ? '<span class="pill ok">Done</span>' : `<span class="pill">+${c.reward}</span>`}</h3><p>${esc(c.desc)}</p></div>${on ? `<button class="btn" data-chal="${c.id}">Try</button>` : `<span class="pill lock">Reach ${esc(ZONES[c.start].name)}</span>`}</div>`; }).join('') + `</div>`;
  h += `<p class="sec-title">Free Run · explore without traffic</p><div class="card" style="flex-direction:column;align-items:stretch;gap:12px">
    <div class="field"><label for="frZone">Start at</label><select id="frZone" style="padding:10px;border-radius:10px;background:#1a1440;color:var(--pearl);border:1px solid var(--line2);font:inherit">${ZONES.map((z, i) => u.has(i) ? `<option value="${i}">${esc(z.full || z.name)}</option>` : '').join('')}</select></div>
    <div class="field"><span class="flabel">Time of day</span><div class="seg" id="frTod">${['dawn', 'day', 'sunset', 'night'].map((t, i) => `<button data-v="${t}" class="${i === 1 ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div></div>
    <div class="field"><span class="flabel">Weather</span><div class="seg" id="frW">${[['clear', 'Clear'], ['light', 'Light rain'], ['heavy', 'Heavy rain'], ['fog', 'Fog']].map((t, i) => `<button data-v="${t[0]}" class="${i === 0 ? 'on' : ''}">${t[1]}</button>`).join('')}</div></div>
    <button class="btn primary" data-go="free">Start free run</button></div>`;
  b.innerHTML = h;
  for (const segId of ['#frTod', '#frW']) $(segId, b).addEventListener('click', e => { const bt = e.target.closest('button'); if (!bt) return; $$('button', $(segId, b)).forEach(x => x.classList.toggle('on', x === bt)); });
  b.onclick = e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.go === 'endless') launch({ mode: 'endless', zone: 0 }, true);
    else if (t.dataset.go === 'free') { const tod = $('#frTod .on', b).dataset.v, w = $('#frW .on', b).dataset.v; launch({ mode: 'free', zone: +$('#frZone', b).value, tod: { dawn: .02, day: .25, sunset: .5, night: .75 }[tod], weather: w, cruise: 11, objective: 'Free run · no traffic · press Esc to finish' }); }
    else if (t.dataset.tour) { const i = +t.dataset.tour; launch({ mode: 'tour', zone: i, tourTok: Math.round(ZONES[i].len / 14), objective: 'Landmark Tour · cross ' + (ZONES[i].full || ZONES[i].name) }); }
    else if (t.dataset.ta) { const r = TA_ROUTES.find(x => x.id === t.dataset.ta); launch({ mode: 'ta', zone: r.from, route: r, timeLimit: taAllowed(r), objective: 'Reach ' + ZONES[r.to].name + ' before time runs out' }); }
    else if (t.dataset.chal) { const c = CHALLENGES.find(x => x.id === t.dataset.chal); launch({ mode: 'challenge', zone: c.start, chal: c, noHit: !!c.noHit, tod: c.tod, weather: c.weather, traffic: c.traffic, trains: c.trains, objective: c.name + ' · ' + c.desc }); }
  };
}
function renderMissions() {
  const b = $('#missionsBody'); const tier = S.mis.tier;
  let h = `<div class="row" style="justify-content:space-between"><div><div class="flabel">Mission set</div><div class="num" style="font-size:30px;font-weight:800">${tier + 1} <span style="font-size:18px;color:var(--dim)">of ${MIS_TOTAL / 3}</span></div></div><div style="text-align:right"><div class="flabel">Score multiplier</div><div class="num" style="font-size:30px;font-weight:800;color:var(--gold2)">×${1 + S.multLevel}</div></div></div>`;
  h += `<p class="note" style="margin:0">Finish all three in the current set to raise your score multiplier. Progress counts within a single run.</p><div class="list">` + [0, 1, 2].map(s => { const m = missionAt(tier, s); const d = S.mis.done[s]; return `<div class="card"><div class="grow"><h3>${esc(missionText(m))}</h3><p>Reward ${25 + tier * 5} tokens</p></div>${d ? '<span class="pill ok">Done</span>' : '<span class="pill">Active</span>'}</div>`; }).join('') + `</div>`;
  h += `<p class="sec-title">Coming up</p><div class="list">`; for (let t = tier + 1; t < Math.min(MIS_TOTAL / 3, tier + 6); t++) h += `<div class="card locked"><div class="grow"><h3>Set ${t + 1}</h3><p>${[0, 1, 2].map(s => esc(missionText(missionAt(t, s)))).join(' · ')}</p></div></div>`; h += `</div>`;
  h += `<p class="sec-title">Landmark stars</p><div class="list">` + ZONES.filter(z => z.lm).map(z => `<div class="card"><div class="grow"><h3>${esc(z.lm.name)}</h3></div><div class="stars">${[1, 2, 3].map(k => `<span class="${k <= (S.tour[z.idx] || 0) ? '' : 'off'}">★</span>`).join('')}</div></div>`).join('') + `</div>`;
  b.innerHTML = h;
}
let boardTab = 'global';
function renderBoard() {
  const b = $('#boardBody'); const me = S.name || 'Runner';
  let rows = S.board.slice(); if (boardTab === 'hyd') rows = rows.filter(r => r.home); if (boardTab === 'friends') { const f = new Set([me, ...S.friends]); rows = rows.filter(r => f.has(r.name)); }
  const best = new Map(); for (const r of rows) { const k = r.name; if (!best.has(k) || best.get(k).score < r.score) best.set(k, r); }
  const list = boardTab === 'global' || boardTab === 'hyd' ? rows.slice(0, 25) : [...best.values()].sort((a, c) => c.score - a.score);
  let h = `<div class="tabs">${[['global', 'Global'], ['hyd', 'Hyderabad'], ['friends', 'Friends']].map(([k, n]) => `<button class="tab${boardTab === k ? ' on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>`;
  h += `<p class="note" style="margin:0">${boardTab === 'global' ? 'Every run recorded on this device, best first.' : boardTab === 'hyd' ? 'Runs by players who set Hyderabad as their home city.' : 'Your best and the best of the friends you follow on this device.'} Scores are stored in this browser only.</p>`;
  if (!list.length) h += `<div class="card"><div class="grow"><h3>No runs yet</h3><p>Finish a run and it will appear here.</p></div></div>`;
  else h += `<div class="lbwrap"><table class="lb"><thead><tr><th>#</th><th>Player</th><th class="n">Distance</th><th class="n">Score</th><th class="n">Landmarks</th><th class="n">Date</th></tr></thead><tbody>${list.map((r, i) => `<tr class="${r.name === me ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.name)}${r.home ? ' <span class="pill" style="font-size:9px">HYD</span>' : ''}</td><td class="n">${fmtKm(r.dist)}</td><td class="n">${fmtIN(r.score)}</td><td class="n">${r.lms}</td><td class="n">${new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td></tr>`).join('')}</tbody></table></div>`;
  if (boardTab === 'friends') h += `<div class="field"><label for="fName">Follow a friend by player name</label><div class="row"><input type="text" id="fName" maxlength="20" placeholder="Friend's player name" style="flex:1"><button class="btn" id="fAdd">Follow</button></div>${S.friends.length ? `<div class="row">${S.friends.map(f => `<span class="pill">${esc(f)} <button data-unf="${esc(f)}" aria-label="Unfollow" style="padding:0 2px">×</button></span>`).join('')}</div>` : ''}</div>`;
  b.innerHTML = h;
  b.onclick = e => { const t = e.target.closest('button'); if (!t) return; if (t.dataset.tab) { boardTab = t.dataset.tab; renderBoard(); } if (t.id === 'fAdd') { const v = $('#fName').value.trim(); if (v && !S.friends.includes(v)) { S.friends.push(v); save(); } renderBoard(); } if (t.dataset.unf) { S.friends = S.friends.filter(f => f !== t.dataset.unf); save(); renderBoard(); } };
}
function renderSettings() {
  const s = S.settings, b = $('#settingsBody');
  const seg = (id, opts, cur) => `<div class="seg" data-set="${id}">${opts.map(([v, n]) => `<button data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  b.innerHTML = `
    <div class="field"><label for="sName">Player name</label><input type="text" id="sName" maxlength="20" value="${esc(S.name)}" placeholder="Runner"></div>
    <label class="toggle"><span>Hyderabad is my home city (for the Hyderabad leaderboard)</span><input type="checkbox" id="sHome" ${S.home ? 'checked' : ''}></label>
    <p class="sec-title">Graphics</p>
    <div class="field"><span class="flabel">Quality</span>${seg('quality', [['auto', 'Auto'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], s.quality)}</div>
    <label class="toggle"><span>Glow on night lights (high quality)</span><input type="checkbox" id="sBloom" ${s.bloom ? 'checked' : ''}></label>
    <label class="toggle"><span>Camera shake</span><input type="checkbox" id="sShake" ${s.shake ? 'checked' : ''}></label>
    <label class="toggle"><span>Show frame rate</span><input type="checkbox" id="sFps" ${s.fps ? 'checked' : ''}></label>
    <p class="sec-title">World</p>
    <div class="field"><span class="flabel">Time of day</span>${seg('tod', [['auto', 'Cycle'], ['dawn', 'Dawn'], ['day', 'Day'], ['sunset', 'Sunset'], ['night', 'Night']], s.tod)}</div>
    <div class="field"><span class="flabel">Weather</span>${seg('weather', [['auto', 'Changing'], ['clear', 'Clear'], ['light', 'Light rain'], ['heavy', 'Heavy rain'], ['fog', 'Fog']], s.weather)}</div>
    <div class="field"><span class="flabel">Traffic density</span>${seg('traffic', [[.7, 'Light'], [1, 'Normal'], [1.35, 'Heavy']], s.traffic)}</div>
    <p class="sec-title">Sound</p>
    <div class="field"><label for="sMusic">Music</label><input type="range" id="sMusic" min="0" max="1" step=".05" value="${s.music}"></div>
    <div class="field"><label for="sSfx">Sound effects</label><input type="range" id="sSfx" min="0" max="1" step=".05" value="${s.sfx}"></div>
    <div class="field"><label for="sAmb">City ambience</label><input type="range" id="sAmb" min="0" max="1" step=".05" value="${s.amb}"></div>
    <p class="sec-title">Controls</p>
    <p class="note" style="margin:0"><span class="kbd">A</span>/<span class="kbd">←</span> left · <span class="kbd">D</span>/<span class="kbd">→</span> right · <span class="kbd">W</span>/<span class="kbd">↑</span>/<span class="kbd">Space</span> jump · <span class="kbd">S</span>/<span class="kbd">↓</span> slide (in the air it drops you fast) · <span class="kbd">Shift</span>/<span class="kbd">E</span> dash · <span class="kbd">Esc</span>/<span class="kbd">P</span> pause.<br>Phones: swipe left, right, up or down; double-tap or the Dash button to dash.<br>Gamepad: stick or d-pad to steer, A jump, B slide, X or RB dash, Start pause.</p>
    <div class="btnrow"><button class="btn" id="sIntro">Watch the intro</button><button class="btn danger" id="sReset">Reset progress</button></div>
    <div id="resetConfirm" hidden class="card"><div class="grow"><h3>Erase all progress?</h3><p>Tokens, unlocks, characters, missions and scores on this device will be cleared.</p></div><button class="btn danger" id="sResetYes">Erase</button></div>`;
  b.onclick = e => {
    const t = e.target.closest('button'); if (!t) return; const sg = t.closest('[data-set]');
    if (sg) { let v = t.dataset.v; if (sg.dataset.set === 'traffic') v = +v; s[sg.dataset.set] = v; $$('button', sg).forEach(x => x.classList.toggle('on', x === t)); if (sg.dataset.set === 'quality') applyQuality(); if (sg.dataset.set === 'tod' && v !== 'auto') ENV.tod = { dawn: .02, day: .25, sunset: .5, night: .75 }[v]; if (sg.dataset.set === 'weather') setWeather(v === 'auto' ? 'clear' : v); save(); }
    if (t.id === 'sIntro') { S.seenIntro = false; launch({ mode: 'endless', zone: 0 }, true, true); }
    if (t.id === 'sReset') $('#resetConfirm').hidden = false;
    if (t.id === 'sResetYes') { const keep = S.settings; S = DEFAULT_SAVE(); S.settings = keep; save(); toast('Progress erased'); renderSettings(); refreshMenu(); }
  };
  b.onchange = e => { const t = e.target; if (t.id === 'sName') { S.name = t.value.trim().slice(0, 20); } if (t.id === 'sHome') S.home = t.checked; if (t.id === 'sBloom') s.bloom = t.checked; if (t.id === 'sShake') s.shake = t.checked; if (t.id === 'sFps') { s.fps = t.checked; $('#fps').hidden = !s.fps; } save(); };
  b.oninput = e => { const t = e.target; if (t.id === 'sMusic') s.music = +t.value; if (t.id === 'sSfx') s.sfx = +t.value; if (t.id === 'sAmb') s.amb = +t.value; AU.setVolumes(); save(); };
}

/* ---------- Characters ---------- */
let charYaw = Math.PI, charDrag = null;
function openChars() { G.state = 'chars'; only('chars'); renderChars(); player.build(charDef()); }
function closeChars() { player.g.rotation.y = 0; G.state = 'menu'; }
function renderChars() {
  const b = $('#charsBody'); const sel = S.chars.sel; const d = charDef(); const owned = S.chars.owned.includes(sel);
  const cust = (key, list, cls) => `<div class="swatches" data-cust="${key}">${list.map(c => `<button class="sw${d[key] === c ? ' on' : ''}" data-v="${c}" style="background:${c}" aria-label="${key} ${c}"></button>`).join('')}</div>`;
  const opt = (key, list) => `<div class="seg" data-cust="${key}">${list.map(([v, n]) => `<button data-v="${v}" class="${d[key] === v ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  let h = `<div class="row" style="justify-content:space-between"><div><div class="flabel">Tokens</div><div class="num" style="font-size:26px;font-weight:800">${fmtIN(S.tokens)}</div></div><p class="note" style="margin:0;max-width:24ch;text-align:right">Drag the runner to turn them around.</p></div>`;
  h += `<div class="char-grid">${CHARS.map(c => { const own = S.chars.owned.includes(c.id); return `<button class="cchip${c.id === sel ? ' on' : ''}" data-char="${c.id}">${own ? '' : `<span class="cost">${c.cost}</span>`}<span class="face" style="background:linear-gradient(${c.top} 50%, ${c.skin} 50%)"></span><b>${c.name}</b><small>${c.real ? 'Realistic' : (c.g === 'm' ? 'M' : 'F') + ' · ' + OUTFIT_NAMES[c.outfit]}</small></button>`; }).join('')}</div>`;
  if (d.real && !REAL.gltf) h += `<p class="note" style="margin:0">The realistic model could not load on this connection, so this runner is shown in the stylized look.</p>`;
  if (!owned) { const c = CHARS.find(x => x.id === sel); h += `<div class="card"><div class="grow"><h3>${c.name} · ${OUTFIT_NAMES[c.outfit]}</h3><p>Unlock for ${c.cost} tokens.</p></div><button class="btn primary" id="buyChar" ${S.tokens < c.cost ? 'disabled' : ''}>Unlock</button></div>`; }
  else if (d.real) h += `<div class="field"><span class="flabel">Outfit tint</span>${cust('top', ['#ffffff', '#6f8fb8', '#d9b27a', '#3a3f58', '#7a8a5a', '#8a2a12', '#e9b949', '#12a38c'])}</div><p class="note" style="margin:0">Realistic motion-captured runner. Realistic women runners are not available yet; Sravya, Ayesha, Lakshmi and Meher use the stylized look.</p><button class="btn primary" data-close>Use this runner</button>`;
  else h += `<div class="field"><span class="flabel">Hair</span>${opt('hair', HAIR_STYLES.map(x => [x, x[0].toUpperCase() + x.slice(1)]))}</div>
    <div class="field"><span class="flabel">Hair colour</span>${cust('hairC', HAIR_COLORS)}</div>
    <div class="field"><span class="flabel">Skin tone</span>${cust('skin', SKIN_TONES)}</div>
    <div class="field"><span class="flabel">Top</span>${cust('top', CLOTH_COLORS)}</div>
    <div class="field"><span class="flabel">${d.outfit === 'traditional' && d.g === 'f' ? 'Skirt' : 'Bottoms'}</span>${cust('bottom', CLOTH_COLORS)}</div>
    <div class="field"><span class="flabel">Shoes</span>${cust('shoe', SHOE_COLORS)}</div>
    <div class="field"><span class="flabel">Accessory</span>${opt('acc', ACCESSORIES)}</div>
    <div class="field"><span class="flabel">Running style</span>${opt('run', RUN_STYLES)}</div>
    <button class="btn primary" data-close>Use this runner</button>`;
  b.innerHTML = h;
  b.onclick = e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.char) { S.chars.sel = t.dataset.char; save(); player.build(charDef()); renderChars(); return; }
    if (t.id === 'buyChar') { const c = CHARS.find(x => x.id === sel); if (S.tokens >= c.cost) { S.tokens -= c.cost; S.chars.owned.push(c.id); save(); AU.power(); toast('<b>' + c.name + '</b> joined your crew'); renderChars(); } return; }
    const cg = t.closest('[data-cust]'); if (cg && owned) { const key = cg.dataset.cust; S.chars.custom[sel] = Object.assign({}, S.chars.custom[sel] || {}, { [key]: t.dataset.v }); save(); player.build(charDef()); renderChars(); }
  };
}

/* ---------- Pause / results / revive ---------- */
function pause() { if (G.state !== 'playing') return; G.state = 'paused'; show('pause', true); $('#pMusic').value = S.settings.music; $('#pSfx').value = S.settings.sfx; $('#pauseInfo').textContent = (G.cfg.objective ? G.cfg.objective + ' · ' : '') + fmtKm(G.runDist) + ' · ' + fmtIN(G.score) + ' points'; $('#pauseMissions').innerHTML = [0, 1, 2].map(s => { const m = missionAt(S.mis.tier, s); const p = S.mis.done[s] ? 1 : clamp(missionProgress(m, G.stats), 0, 1); return `<div class="card"><div class="grow"><h3 style="font-size:14px">${esc(missionText(m))}</h3><div class="prog"><i style="width:${p * 100}%"></i></div></div></div>`; }).join(''); AU.intensity = 0; }
function resume() { if (G.state !== 'paused') return; show('pause', false); countdown(1.2); }
let cdT = 0, cdLast = -1;
function countdown(t = 2) { G.state = 'countdown'; cdT = t; cdLast = -1; $('#countdown').hidden = false; showHUD(true); }
function showResults(r) {
  only('results'); const b = $('#resultsBody');
  const title = r.completed ? (G.mode === 'ta' ? 'Made it in time' : G.mode === 'tour' ? 'Landmark cleared' : G.mode === 'challenge' ? 'Challenge complete' : 'Run complete') : (G.failMsg ? 'So close' : 'Run over');
  $('#resTitle').innerHTML = '<span class="te">' + (r.completed ? 'అద్భుతం!' : 'పరుగు ముగిసింది') + '</span>' + esc(title);
  let h = `<div class="res-hero">${r.newBest ? '<span class="newbest">New best score</span>' : ''}<div class="big">${fmtIN(r.score)}</div><span class="note">points · ended near ${esc(ZONES[r.zone].name)}</span></div>`;
  if (G.failMsg) h += `<p class="note" style="margin:0">${esc(G.failMsg)}</p>`;
  h += `<div class="res-grid"><div><small>Distance</small><b>${fmtKm(r.dist)}</b></div><div><small>Tokens</small><b>${fmtIN(r.tokens)}</b></div><div><small>Landmarks</small><b>${r.lms}</b></div>${r.time ? `<div><small>Time</small><b>${fmtTime(r.time)}</b></div>` : ''}${r.stars ? `<div><small>Stars</small><b class="stars">${'★'.repeat(r.stars)}</b></div>` : ''}${r.reward ? `<div><small>Bonus</small><b>+${r.reward}</b></div>` : ''}</div>`;
  h += `<div class="list">${[0, 1, 2].map(s => { const m = missionAt(S.mis.tier, s); return `<div class="card"><div class="grow"><h3 style="font-size:14px">${esc(missionText(m))}</h3></div>${S.mis.done[s] ? '<span class="pill ok">Done</span>' : '<span class="pill">Active</span>'}</div>`; }).join('')}</div>`;
  if (!S.name && G.mode !== 'free') h += `<div class="field"><label for="rName">Name for the leaderboard</label><div class="row"><input type="text" id="rName" maxlength="20" placeholder="Runner" style="flex:1"><button class="btn" id="rSave">Save</button></div></div>`;
  h += `<div class="btnrow"><button class="btn primary" id="rAgain">Run again</button><button class="btn" id="rMenu">Main menu</button></div>`;
  b.innerHTML = h; G.failMsg = null;
  b.onclick = e => { const t = e.target.closest('button'); if (!t) return; if (t.id === 'rAgain') launch(Object.assign({}, G.cfg)); if (t.id === 'rMenu') goMenu(); if (t.id === 'rSave') { const v = $('#rName').value.trim().slice(0, 20); if (v) { S.name = v; for (const x of S.board) if (x.name === 'Runner') x.name = v; save(); toast('Saved as <b>' + esc(v) + '</b>'); t.closest('.field').remove(); } } };
}
let reviveT = 0;
function reviveCost() { return 150 * (G.revives + 1); }
function offerRevive() {
  const cost = reviveCost(); const have = S.tokens + G.tokens;
  if (G.mode === 'free' || G.cfg.noHit || G.revives >= 2 || have < cost || G.failMsg) { endRun(G.mode === 'free'); return; }
  G.state = 'revive'; reviveT = 5; show('revive', true); $('#reviveTxt').textContent = 'Spend ' + cost + ' tokens to keep running from here. You have ' + fmtIN(have) + '.';
}
function doRevive() {
  const cost = reviveCost(); const fromBank = Math.min(S.tokens, cost); S.tokens -= fromBank; G.tokens -= (cost - fromBank); G.revives++;
  show('revive', false); clearAhead(G.dist - 5, G.dist + 50); G.invuln = 2.5; G.slowmo = 1; G.py = 0; G.vy = 0; G.grounded = true; G.stumbleT = -99; G.speed *= .6; countdown(1.2);
}

/* ---------- Launching runs & intro ---------- */
function launch(cfg, allowIntro = false, forceIntro = false) {
  AU.init(); only(); startRun(cfg);
  if (allowIntro && cfg.zone === 0 && (forceIntro || !S.seenIntro)) { startIntro(); return; }
  swoopT = 0; countdown(1.8);
}
let introT = 0, swoopT = 0; const INTRO_LEN = 10;
const INTRO_PATH = { pos: [[40, 46, 150], [38, 20, 108], [36, 26, 44], [14, 17, 16], [-58, 30, -6], [-30, 95, 70]], look: [[32, 5, 89], [32, 7, 89], [30, 2, 8], [26, 3, 0], [-92, 8, -28], [-10, 0, 10]], names: [['Sunrise over', 'Charminar'], ['Sunrise over', 'Charminar'], ['Crossing', 'Hussain Sagar'], ['Along', 'Necklace Road'], ['Towards', 'Cyber Towers'], ['This is', 'Hyderabad']] };
let introCurves = null;
function startIntro() {
  buildMap(); G.state = 'intro'; introT = 0; only('intro'); $('#intro').classList.remove('show'); setMapMood('intro');
  if (!introCurves) introCurves = { p: new THREE.CatmullRomCurve3(INTRO_PATH.pos.map(a => new THREE.Vector3(...a))), l: new THREE.CatmullRomCurve3(INTRO_PATH.look.map(a => new THREE.Vector3(...a))) };
  AU.intensity = 0;
}
function endIntro() { S.seenIntro = true; save(); setMapMood(null); only(); $('#flash').style.transition = 'none'; $('#flash').style.opacity = 1; requestAnimationFrame(() => { $('#flash').style.transition = 'opacity .9s'; $('#flash').style.opacity = 0; }); swoopT = 2.6; camera.position.set(0, 70, 30); camLook.set(0, 22, -52); beginPlaying(); updateHudStatic(); }
function introUpdate(dt) {
  introT += dt; const t = clamp(introT / INTRO_LEN, 0, 1); const e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  mapCam.position.copy(introCurves.p.getPoint(e)); mapCam.lookAt(introCurves.l.getPoint(e));
  const ni = Math.min(INTRO_PATH.names.length - 1, Math.round(e * (INTRO_PATH.names.length - 1))); $('#introEye').textContent = INTRO_PATH.names[ni][0]; $('#introWhere').textContent = INTRO_PATH.names[ni][1];
  if (introT > 4.5) $('#intro').classList.add('show');
  applyTod(.02 + t * .04);
  if (introT >= INTRO_LEN) endIntro();
}

/* ---------- Map diorama ---------- */
let mapScene = null, mapCam = null; const MAPPOS = [[32, 89], [44, 76], [30, 56], [20, 33], [38, 24], [30, 6], [46, 2], [8, 42], [67, -12], [100, 20], [72, 52], [0, 104], [-66, -80], [-78, 0], [-92, -28], [-130, 8], [-60, 62], [-74, 44], [120, -150]];
const MAPLM = [['charminar', .16, 0], ['salarjung', .08, .3], [null], ['secretariat', .07, 0], ['ambedkar', .1, 2.5], ['buddha', .13, 1.5], [null], ['birla', .07, 0], ['secstation', .08, 0], ['osmania', .07, 0], ['kachiguda', .08, .4], ['zoogate', .15, 0], ['metrostation', .07, 1.2], ['cablebridge', .08, 1.3], ['cybertowers', .09, .6], ['fdtowers', .06, 0], ['balahissar', .07, 0], ['tomb', .12, 0], [null]];
const MAP = { theta: .35, phi: .95, dist: 330, target: new THREE.Vector3(-10, 0, 10), labels: [], sel: -1, lit: [] };
function buildMap() {
  if (mapScene) return;
  mapScene = new THREE.Scene(); mapCam = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 4000);
  mapScene.fog = new THREE.Fog(0x2a2050, 300, 900);
  MAP.hemi = new THREE.HemisphereLight(0xffe2c4, 0x3a2a40, .8); MAP.dir = new THREE.DirectionalLight(0xffd0a0, 1.2); MAP.dir.position.set(200, 120, 60); mapScene.add(MAP.hemi, MAP.dir);
  // ground texture
  const N = 2048, W = 560, [c, x] = mkCanvas(N, N); const P = (px, pz) => [(px + W / 2) / W * N, (pz + W / 2) / W * N];
  x.fillStyle = '#b89f78'; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '90,120,60' : '120,90,60'},${Math.random() * .12})`; const [a, b2] = [Math.random() * N, Math.random() * N]; x.beginPath(); x.arc(a, b2, 4 + Math.random() * 30, 0, 7); x.fill(); }
  const blob = (px, pz, r, col) => { const [a, b2] = P(px, pz); x.fillStyle = col; x.beginPath(); x.arc(a, b2, r / W * N, 0, 7); x.fill(); };
  // urban fabric
  for (const [cx, cz, r] of [[30, 60, 70], [60, 0, 55], [-40, -30, 70], [-90, -10, 55], [0, 20, 60], [-60, -80, 45], [100, 60, 50]]) { const [a, b2] = P(cx, cz); const g = x.createRadialGradient(a, b2, 0, a, b2, r / W * N); g.addColorStop(0, 'rgba(210,200,185,.85)'); g.addColorStop(1, 'rgba(210,200,185,0)'); x.fillStyle = g; x.beginPath(); x.arc(a, b2, r / W * N, 0, 7); x.fill(); }
  for (const [px, pz, r] of [[-45, -10, 11], [100, 20, 13], [-60, 62, 14], [0, 104, 12], [22, 12, 5], [-100, 30, 18], [120, -150, 20], [150, 60, 25]]) blob(px, pz, r, 'rgba(92,130,64,.8)');
  // Musi river
  x.strokeStyle = '#5d86a8'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); [[-270, 74], [-150, 80], [-60, 84], [0, 84], [28, 80], [46, 79], [80, 72], [150, 76], [270, 84]].forEach((p, i) => { const [a, b2] = P(...p); i ? x.lineTo(a, b2) : x.moveTo(a, b2); }); x.stroke();
  // lakes
  const lake = (px, pz, rx, rz, rot = 0) => { const [a, b2] = P(px, pz); x.fillStyle = '#4f7fa6'; x.beginPath(); x.ellipse(a, b2, rx / W * N, rz / W * N, rot, 0, 7); x.fill(); x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = 3; x.stroke(); };
  lake(30, 8, 11, 19, .2); lake(-78, 2, 3.5, 9, -.3); lake(114, -152, 11, 6, .4); lake(-4, 112, 9, 4); lake(-200, 64, 26, 18, .3); lake(-150, 120, 16, 10);
  // ORR
  x.strokeStyle = 'rgba(70,60,50,.55)'; x.lineWidth = 6; x.beginPath(); { const [a, b2] = P(-5, -20); x.ellipse(a, b2, 190 / W * N, 170 / W * N, 0, 0, 7); } x.stroke();
  // roads between landmarks
  x.strokeStyle = 'rgba(80,70,60,.6)'; x.lineWidth = 5; x.beginPath(); MAPPOS.forEach((p, i) => { const [a, b2] = P(...p); i ? x.lineTo(a, b2) : x.moveTo(a, b2); }); x.stroke();
  // metro lines
  const line = (pts, col) => { x.strokeStyle = col; x.lineWidth = 6; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => { const [a, b2] = P(...p); i ? x.lineTo(a, b2) : x.moveTo(a, b2); }); x.stroke(); x.fillStyle = '#fff'; for (const p of pts) { const [a, b2] = P(...p); x.beginPath(); x.arc(a, b2, 5, 0, 7); x.fill(); } };
  line([[-120, -86], [-66, -80], [-52, -70], [-3, -8], [0, 5], [18, 30], [26, 38], [24, 46], [32, 52], [44, 68], [60, 78], [90, 88], [132, 110]], '#e2231a');
  line([[-94, -2], [-92, -28], [-80, -22], [-50, -15], [-3, -8], [24, -22], [50, -24], [67, -12], [100, -2], [140, -10], [148, 8]], '#1a74d1');
  line([[62, -30], [60, -14], [52, 22], [48, 38], [46, 60], [44, 68]], '#2aa34a');
  const gt = mkTex(c, false); gt.anisotropy = 8;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(W, W).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 })); mapScene.add(ground);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x9c8664, roughness: 1 })); outer.position.y = -.3; mapScene.add(outer);
  // buildings
  const NB = 3200; const bm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), new THREE.MeshStandardMaterial({ roughness: .85, emissive: 0xffc070, emissiveIntensity: 0 }), NB);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(); let n = 0;
  const inLake = (px, pz) => [[30, 8, 12, 20], [-78, 2, 4.5, 10], [114, -152, 12, 7], [-200, 64, 27, 19], [-4, 112, 10, 5], [-150, 120, 17, 11]].some(([a, b2, rx, rz]) => ((px - a) / rx) ** 2 + ((pz - b2) / rz) ** 2 < 1);
  const centers = [[30, 70, 60, 1], [60, 0, 45, 1], [-40, -30, 60, 1.2], [-100, -10, 45, 3], [-130, 10, 35, 3.5], [0, 20, 50, 1.4], [-60, -80, 40, 1.5], [100, 60, 45, .8]];
  for (let i = 0; i < NB * 3 && n < NB; i++) {
    const cc = pick(centers); const a = Math.random() * 6.28, r = Math.pow(Math.random(), .7) * cc[2]; const px = cc[0] + Math.cos(a) * r, pz = cc[1] + Math.sin(a) * r;
    if (Math.abs(px) > W / 2 - 4 || Math.abs(pz) > W / 2 - 4 || inLake(px, pz) || MAPPOS.some(p => Math.hypot(p[0] - px, p[1] - pz) < 7)) continue;
    const h = (1 + Math.random() * 3) * cc[3] * (1 - r / cc[2] * .6) + .6; const s = 1 + Math.random() * 1.6;
    m4.makeScale(s, h, s).setPosition(px, 0, pz); bm.setMatrixAt(n, m4); col.set(pick(['#efe9dc', '#e6dccb', '#d9d2c4', '#f4f0e6', '#cfd7de', '#e8d6c0'])); bm.setColorAt(n, col); n++;
  }
  bm.count = n; mapScene.add(bm); MAP.bmat = bm.material;
  // trees & rocks
  const tm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x4e7a34, flatShading: true }), 1200); let tn = 0;
  for (let i = 0; i < 1200; i++) { const p = pick([[-45, -10, 11], [100, 20, 13], [0, 104, 12], [-100, 30, 18], [150, 60, 25], [-60, 62, 16]]); const a = Math.random() * 6.28, r = Math.random() * p[2]; const px = p[0] + Math.cos(a) * r, pz = p[1] + Math.sin(a) * r; if (inLake(px, pz)) continue; const s = .8 + Math.random() * 1.2; m4.makeScale(s, s * 1.2, s).setPosition(px, s * .8, pz); tm.setMatrixAt(tn++, m4); }
  tm.count = tn; mapScene.add(tm);
  const rk = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x8d8378, flatShading: true }), 500); let rn = 0;
  for (let i = 0; i < 500; i++) { const p = pick([[-60, 62, 18], [-78, 2, 16], [-100, 40, 30], [120, -150, 30], [-160, -40, 40]]); const a = Math.random() * 6.28, r = 5 + Math.random() * p[2]; const px = p[0] + Math.cos(a) * r, pz = p[1] + Math.sin(a) * r; if (inLake(px, pz)) continue; const s = .6 + Math.random() * 2; m4.makeScale(s, s * .8, s).setPosition(px, s * .4, pz); rk.setMatrixAt(rn++, m4); }
  rk.count = rn; mapScene.add(rk);
  // water planes (shiny) over the painted lakes
  const wmat = new THREE.MeshStandardMaterial({ color: 0x5b8fbc, roughness: .15, metalness: .3, transparent: true, opacity: .85 });
  for (const [a, b2, rx, rz, rot] of [[30, 8, 11, 19, .2], [-78, 2, 3.5, 9, -.3], [114, -152, 11, 6, .4], [-4, 112, 9, 4, 0], [-200, 64, 26, 18, .3]]) { const w = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), wmat); w.scale.set(rx, 1, rz); w.rotation.y = -rot; w.position.set(a, .15, b2); mapScene.add(w); }
  // hill for Golconda
  const hill = new THREE.Mesh(new THREE.ConeGeometry(12, 7, 10), new THREE.MeshStandardMaterial({ color: 0x7d7560, flatShading: true })); hill.position.set(-60, 3.5, 62); mapScene.add(hill);
  // landmark minis
  MAP.minis = [];
  MAPLM.forEach(([name, s, ry], i) => { if (!name) return; const g = lmGroup(name); g.scale.setScalar(s); g.rotation.y = ry; g.position.set(MAPPOS[i][0], name === 'balahissar' ? -1.5 : 0, MAPPOS[i][1]); if (name === 'buddha') g.position.y = -.3; mapScene.add(g); MAP.minis.push(g); });
  // route tubes
  MAP.routeGroup = new THREE.Group(); mapScene.add(MAP.routeGroup); rebuildRoute();
  // labels
  const lab = $('#mapLabels'); lab.innerHTML = '';
  MAP.labels = ZONES.map((z, i) => { const el = document.createElement('div'); el.className = 'mlabel'; el.innerHTML = `<div class="tag"><small></small><span></span></div><div class="pin"></div>`; el.querySelector('small').textContent = z.te; el.querySelector('span').textContent = z.name; el.addEventListener('click', () => selectMapZone(i)); lab.appendChild(el); return el; });
  // map interactions
  const cv = $('#gl'); let drag = null;
  cv.addEventListener('pointerdown', e => { if (G.state === 'map') { drag = { x: e.clientX, y: e.clientY, th: MAP.theta, ph: MAP.phi }; } if (G.state === 'chars') charDrag = { x: e.clientX, yaw: charYaw }; });
  addEventListener('pointermove', e => { if (drag && G.state === 'map') { MAP.theta = drag.th - (e.clientX - drag.x) * .006; MAP.phi = clamp(drag.ph - (e.clientY - drag.y) * .004, .35, 1.35); } if (charDrag && G.state === 'chars') charYaw = charDrag.yaw + (e.clientX - charDrag.x) * .012; });
  addEventListener('pointerup', () => { drag = null; charDrag = null; });
  cv.addEventListener('wheel', e => { if (G.state === 'map') { MAP.dist = clamp(MAP.dist * (1 + Math.sign(e.deltaY) * .1), 70, 520); e.preventDefault(); } }, { passive: false });
  let pinch = null; cv.addEventListener('touchmove', e => { if (G.state !== 'map' || e.touches.length !== 2) return; const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch) MAP.dist = clamp(MAP.dist * pinch / d, 70, 520); pinch = d; }, { passive: true }); cv.addEventListener('touchend', () => pinch = null);
  $('#mapReset').onclick = () => { MAP.theta = .35; MAP.phi = .95; MAP.dist = 330; MAP.target.set(-10, 0, 10); selectMapZone(-1); };
}
function rebuildRoute() {
  const g = MAP.routeGroup; while (g.children.length) { const c = g.children.pop(); c.geometry.dispose(); }
  const u = new Set(S.unlocked); const lit = new THREE.MeshBasicMaterial({ color: 0xf2c75b, toneMapped: false }), dim = new THREE.MeshBasicMaterial({ color: 0x6b6388 });
  for (let i = 0; i < ZONES.length - 1; i++) {
    const a = MAPPOS[i], b = MAPPOS[i + 1]; const mid = new THREE.Vector3((a[0] + b[0]) / 2, 6 + Math.hypot(a[0] - b[0], a[1] - b[1]) * .06, (a[1] + b[1]) / 2);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(a[0], 1.5, a[1]), mid, new THREE.Vector3(b[0], 1.5, b[1]));
    const on = u.has(i) && u.has(i + 1); g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, on ? .7 : .45, 6, false), on ? lit : dim));
  }
}
function setMapMood(m) {
  if (m) { mapScene.add(skyMesh); MAP.routeGroup.visible = m !== 'intro'; applyTod(m === 'intro' ? .02 : .54); mapScene.fog.color.copy(scene.fog.color); mapScene.fog.near = m === 'intro' ? 250 : 350; mapScene.fog.far = 1200; MAP.hemi.color.copy(hemi.color); MAP.hemi.intensity = hemi.intensity + .15; MAP.dir.color.copy(sun.color); MAP.dir.intensity = sun.intensity; MAP.dir.position.copy(skyUni.sunDir.value).multiplyScalar(300); MAP.bmat.emissiveIntensity = m === 'intro' ? 0 : .12; }
  else { scene.add(skyMesh); }
}
function openMap() { buildMap(); rebuildRoute(); G.state = 'map'; only('map'); setMapMood('map'); selectMapZone(-1); }
function closeMap() { setMapMood(null); G.state = 'menu'; }
function selectMapZone(i) {
  MAP.sel = i; const u = new Set(S.unlocked); MAP.labels.forEach((el, k) => { el.classList.toggle('on', u.has(k)); el.classList.toggle('sel', k === i); });
  const b = $('#mapBody');
  if (i < 0) {
    const cur = ZONES[S.lastZone] || ZONES[0]; const nxt = ZONES.find((z, k) => !u.has(k));
    $('#mapTitle').textContent = 'City map';
    b.innerHTML = `<div class="mapstats"><div><small>Current location</small><b>${esc(cur.name)}</b></div><div><small>Next landmark</small><b>${nxt ? esc(nxt.lm ? nxt.lm.name : nxt.name) : 'All unlocked'}</b></div><div><small>Last run</small><b>${fmtKm(S.lastDist)}</b></div><div><small>Total distance</small><b>${fmtKm(S.totalDist)}</b></div><div><small>High score</small><b>${fmtIN(S.best.score)}</b></div><div><small>Unlocked</small><b>${S.unlocked.length} / ${ZONES.length}</b></div></div><p class="note" style="margin:0">Drag to turn the city, scroll or pinch to zoom. Tap a place for details. Gold routes are ones you have run.</p>`;
    MAP.target.set(-10, 0, 10); return;
  }
  const z = ZONES[i]; const on = u.has(i); $('#mapTitle').textContent = z.full || z.name;
  MAP.target.set(MAPPOS[i][0], 0, MAPPOS[i][1]); MAP.dist = Math.min(MAP.dist, 160);
  b.innerHTML = `<p style="margin:0;font-size:14px;line-height:1.5">${esc(z.lm ? z.lm.fact : 'A stretch of the route through ' + z.areas.join(', ') + '.')}</p><div class="mapstats"><div><small>Route distance</small><b>${fmtKm(ZSTART[i])}</b></div><div><small>Stretch length</small><b>${fmtKm(z.len)}</b></div></div><div class="row">${on ? `<button class="btn primary" id="mRun">Run from here</button>` : '<span class="pill lock">Reach it in a run to unlock</span>'}<button class="btn" id="mBack">All places</button></div>`;
  b.onclick = e => { const t = e.target.closest('button'); if (!t) return; if (t.id === 'mRun') { closeMap(); launch({ mode: 'tour', zone: i, tourTok: Math.round(z.len / 14), objective: 'Landmark Tour · cross ' + (z.full || z.name) }); } if (t.id === 'mBack') selectMapZone(-1); };
}
const _mt = new THREE.Vector3();
function mapUpdate(dt) {
  MAP.theta += dt * .02; MAP.curT = MAP.curT || MAP.target.clone(); MAP.curT.lerp(MAP.target, 1 - Math.exp(-3 * dt));
  const r = MAP.dist; mapCam.position.set(MAP.curT.x + Math.sin(MAP.theta) * Math.sin(MAP.phi) * r, Math.cos(MAP.phi) * r, MAP.curT.z + Math.cos(MAP.theta) * Math.sin(MAP.phi) * r); mapCam.lookAt(MAP.curT);
  skyMesh.position.copy(mapCam.position);
  const w = innerWidth, h = innerHeight; $('#mapLabels').classList.toggle('far', MAP.dist > 230 && MAP.sel < 0);
  MAP.labels.forEach((el, i) => { _mt.set(MAPPOS[i][0], (MAPLM[i][0] ? 10 : 4), MAPPOS[i][1]).project(mapCam); const vis = _mt.z < 1 && Math.abs(_mt.x) < 1.1 && Math.abs(_mt.y) < 1.1; el.style.display = vis ? '' : 'none'; if (vis) { el.style.left = ((_mt.x + 1) / 2 * w) + 'px'; el.style.top = ((1 - _mt.y) / 2 * h) + 'px'; el.style.zIndex = String(1000 - Math.round(_mt.z * 1000)); } });
}

/* ---------- Input ---------- */
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', ArrowDown: 'slide', KeyS: 'slide', ShiftLeft: 'dash', ShiftRight: 'dash', KeyE: 'dash' };
function initInput() {
  addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    if (G.state === 'intro') { e.preventDefault(); endIntro(); return; }
    const a = KEYMAP[e.code];
    if (G.state === 'playing') { if (a) { e.preventDefault(); if (!e.repeat) act(a); } if (e.code === 'Escape' || e.code === 'KeyP') { if (G.mode === 'free' && e.code === 'Escape') endRun(true); else pause(); } return; }
    if (G.state === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) { resume(); return; }
    if (G.state === 'revive') { if (e.code === 'Enter') doRevive(); if (e.code === 'Escape') { show('revive', false); endRun(false); } return; }
    if (e.code === 'Escape') { if (G.state === 'menu' || G.state === 'map' || G.state === 'chars') { const open = SCREENS.find(s => s !== 'menu' && !$('#' + s).hidden); if (open) closeSheets(); } }
    if (G.state === 'menu' && $('#menu') && !$('#menu').hidden && (e.code === 'Enter')) launch({ mode: 'endless', zone: 0 }, true);
  });
  const app = $('#app'); let sw = null, lastTap = 0;
  app.addEventListener('pointerdown', e => {
    if (G.state === 'intro') { if (e.target.closest('#intro')) endIntro(); return; }
    if (G.state !== 'playing' || e.target.closest('button')) return;
    sw = { x: e.clientX, y: e.clientY, t: performance.now(), done: false };
    const now = performance.now(); if (now - lastTap < 280 && e.pointerType === 'touch') { act('dash'); lastTap = 0; } else lastTap = now;
  });
  app.addEventListener('pointermove', e => {
    if (!sw || sw.done || G.state !== 'playing') return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; const th = 26;
    if (Math.abs(dx) > th || Math.abs(dy) > th) { sw.done = true; if (Math.abs(dx) > Math.abs(dy)) act(dx > 0 ? 'right' : 'left'); else act(dy > 0 ? 'slide' : 'jump'); }
  });
  addEventListener('pointerup', () => { sw = null; });
  $('#dashBtn').addEventListener('click', () => act('dash'));
  $('#btnPause').addEventListener('click', pause);
  $('#btnResume').addEventListener('click', resume);
  $('#btnRestart').addEventListener('click', () => { show('pause', false); launch(Object.assign({}, G.cfg)); });
  $('#btnQuit').addEventListener('click', () => { show('pause', false); if (G.mode !== 'free' && G.runDist > 50) { G.state = 'playing'; endRun(false); } else goMenu(); });
  $('#pMusic').addEventListener('input', e => { S.settings.music = +e.target.value; AU.setVolumes(); save(); });
  $('#pSfx').addEventListener('input', e => { S.settings.sfx = +e.target.value; AU.setVolumes(); save(); });
  $('#btnRevive').addEventListener('click', doRevive); $('#btnNoRevive').addEventListener('click', () => { show('revive', false); endRun(false); });
  $('#btnPlay').addEventListener('click', () => launch({ mode: 'endless', zone: 0 }, true));
  $('#introSkip').addEventListener('click', endIntro);
  const fsOk = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  $$('.btnFull').forEach(bt => { bt.hidden = !fsOk; bt.addEventListener('click', toggleFull); });
  $$('[data-open]').forEach(b => b.addEventListener('click', () => openSheet(b.dataset.open)));
  document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheets(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  addEventListener('pointerdown', () => AU.init(), { once: true }); addEventListener('keydown', () => AU.init(), { once: true });
}
function toggleFull() {
  const d = document, el = d.documentElement;
  try { if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else { const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (p && p.catch) p.catch(() => toast('Full screen is not available here')); } } catch (e) { toast('Full screen is not available here'); }
}
const PAD = { prev: {} };
function pollPad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : []; const p = pads && [...pads].find(x => x); if (!p) return;
  const ax = p.axes[0] || 0, ay = p.axes[1] || 0; const b = i => p.buttons[i] && p.buttons[i].pressed;
  const st = { left: ax < -.5 || b(14), right: ax > .5 || b(15), jump: b(0) || ay < -.6 || b(12), slide: b(1) || ay > .6 || b(13), dash: b(2) || b(5), start: b(9) };
  for (const k in st) if (st[k] && !PAD.prev[k]) {
    if (k === 'start') { if (G.state === 'playing') pause(); else if (G.state === 'paused') resume(); else if (G.state === 'menu') launch({ mode: 'endless', zone: 0 }, true); else if (G.state === 'intro') endIntro(); }
    else if (G.state === 'playing') act(k); else if (G.state === 'intro' && k === 'jump') endIntro(); else if (G.state === 'results' && k === 'jump') launch(Object.assign({}, G.cfg));
  }
  PAD.prev = st;
}

/* ---------- Main loop ---------- */
let lastT = performance.now(), fpsAcc = 0, fpsN = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(.05, (now - lastT) / 1000); lastT = now; if (dt <= 0) return;
  G.time += dt; pollPad();
  if (S.settings.fps) { fpsAcc += dt; fpsN++; if (fpsAcc > .5) { $('#fps').textContent = Math.round(fpsN / fpsAcc) + ' fps'; fpsAcc = 0; fpsN = 0; } }
  const st = G.state;
  if (st === 'intro') { introUpdate(dt); renderFrame(mapScene, mapCam); return; }
  if (st === 'map') { mapUpdate(dt); renderFrame(mapScene, mapCam); return; }
  let worldDz = 0; const d0 = G.dist;
  if (st === 'playing') { updateRun(dt * G.slowmo); if (swoopT > 0) swoopUpdate(dt); else updateCamera(dt); updateHud(); }
  else if (st === 'dying') { G.dieT += dt; G.slowmo = damp(G.slowmo, 1, 2, dt); G.speed = damp(G.speed, 0, 4, dt); updateCamera(dt); if (G.dieT > 1.3) offerRevive(); }
  else if (st === 'revive') { reviveT -= dt; $('#reviveBar').style.width = clamp(reviveT / 5 * 100, 0, 100) + '%'; if (reviveT <= 0) { show('revive', false); endRun(false); } }
  else if (st === 'countdown') { updateHud(); cdT -= dt; const n = Math.ceil(cdT / .6); if (n !== cdLast && n > 0) { cdLast = n; $('#countdown').textContent = n; AU.countdown(false); } updateCamera(dt); if (cdT <= 0) { $('#countdown').hidden = true; AU.countdown(true); beginPlaying(); } }
  else if (st === 'menu' || st === 'chars') menuCam(dt);
  worldDz = G.dist - d0;
  // world
  root.position.z = G.dist; updateChunks(G.dist);
  const zk = zoneAt(G.dist).kind; updateEnv(dt); if (st === 'menu' || st === 'chars') { if (S.settings.tod !== 'auto') ENV.tod = { dawn: .02, day: .25, sunset: .5, night: .75 }[S.settings.tod]; }
  applyTod(ENV.tod); refreshEnvMap(); updateSkyline(dt, zk); updateAmbient(dt, G.dist, G.time); updateParticles(dt, worldDz);
  MAT.water.map.offset.x += dt * .01; MAT.water.map.offset.y += dt * .006;
  if (ENV.night > .3) MAT.cable.color.setHSL((G.time * .08) % 1, .85, .6).multiplyScalar(1.6); else MAT.cable.color.setRGB(1, 1, 1);
  // player
  const pose = st === 'dying' || st === 'revive' || (st === 'results' && G.dieT > 0) ? 'crash' : (st === 'playing' || st === 'countdown') ? (st === 'countdown' ? 'idle' : G.powers.metro ? 'jump' : G.sliding > 0 ? 'slide' : !G.grounded ? 'jump' : 'run') : 'idle';
  player.g.position.set(G.px, G.py, 0); if (st === 'chars') player.g.rotation.y = damp(player.g.rotation.y, charYaw, 10, dt); else if (st !== 'menu') player.g.rotation.y = 0;
  player.update(dt * (st === 'dying' ? G.slowmo : 1), { pose, speed: G.speed, vy: G.vy, tilt: G.tilt });
  blob.position.set(G.px, .04, 0); const bs = clamp(1 - G.py * .12, .35, 1) * .8; blob.scale.set(bs, 1, bs); blob.material.opacity = .26 * bs;
  const sd = ENV.sunDir || skyUni.sunDir.value; sun.target.position.set(G.px, 0, -14); sun.position.set(G.px + sd.x * 90, Math.max(20, sd.y * 90), -14 + sd.z * 90);
  AU.intensity = st === 'playing' ? (G.speed > 20 || G.powers.metro || G.powers.dash ? 2 : 1) : 0;
  AU.update(dt, zk, st === 'playing' ? G.speed : 0, st === 'playing');
  if (bloomPass) bloomPass.strength = .35 + ENV.night * .55;
  renderFrame(scene, camera);
}
function isPortrait() { return camera.aspect < .9; }
function swoopUpdate(dt) {
  swoopT -= dt; const k = 1 - clamp(swoopT / 2.6, 0, 1); const e = 1 - Math.pow(1 - k, 3);
  const chase = new THREE.Vector3(G.px * .55, (isPortrait() ? 4.1 : 3.3) + G.py * .55, isPortrait() ? 7.4 : 6.2), high = new THREE.Vector3(0, 70, 30);
  camera.position.lerpVectors(high, chase, e); camLook.lerpVectors(new THREE.Vector3(0, 22, -52), new THREE.Vector3(G.px * .75, 1.4, -9), e); camera.lookAt(camLook); camera.fov = isPortrait() ? 72 : 60; camera.updateProjectionMatrix();
}
function menuCam(dt) {
  if (G.state === 'chars') { const tgt = new THREE.Vector3(innerWidth > 720 ? 1.1 : 0, 1.45, -3.4); camera.position.lerp(tgt, 1 - Math.exp(-4 * dt)); camLook.lerp(new THREE.Vector3(innerWidth > 720 ? 1.1 : 0, innerWidth > 720 ? 1.05 : 1.35, 0), 1 - Math.exp(-4 * dt)); camera.lookAt(camLook); camera.fov = damp(camera.fov, 42, 4, dt); camera.updateProjectionMatrix(); return; }
  const t = G.time * .06; const narrow = innerWidth < 720;
  const tgt = new THREE.Vector3(-2.4 + Math.sin(t) * .8, narrow ? 2.2 : 1.9, 6.8 + Math.cos(t) * .8);
  camera.position.lerp(tgt, 1 - Math.exp(-2 * dt)); camLook.lerp(new THREE.Vector3(narrow ? 0 : 2.2, narrow ? 16 : 13, -52), 1 - Math.exp(-2 * dt)); camera.lookAt(camLook);
  camera.fov = damp(camera.fov, narrow ? 70 : 58, 3, dt); camera.updateProjectionMatrix();
  player.g.rotation.y = damp(player.g.rotation.y, 0, 4, dt);
}
