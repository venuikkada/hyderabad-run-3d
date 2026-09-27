'use strict';
/* =========================================================
   HYDERABAD RUN 3D — core utilities, data, persistence
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rr = (a, b, r = Math.random) => a + (b - a) * r();
const ri = (a, b, r = Math.random) => Math.floor(a + (b - a + 1) * r());
const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
const chance = (p, r = Math.random) => r() < p;
const fmtIN = n => Math.round(n).toLocaleString('en-IN');
const fmtKm = m => m >= 1000 ? (m / 1000).toFixed(m >= 10000 ? 1 : 2) + ' km' : Math.round(m) + ' m';
const fmtTime = s => { s = Math.max(0, s); const m = Math.floor(s / 60); const r = Math.floor(s % 60); return m + ':' + String(r).padStart(2, '0'); };
const LANE_X = [-2.3, 0, 2.3];
const CHUNK = 30;

/* ---------------- Zones: one continuous route ---------------- */
const ZONES = [
  { id: 'charminar', name: 'Charminar', full: 'Charminar & Laad Bazaar', te: 'చార్మినార్', len: 650, kind: 'old',
    lm: { at: 52, name: 'Charminar', te: 'చార్మినార్', side: 0, fact: 'Built in 1591 by Muhammad Quli Qutb Shah. Its four clocks were added in 1889.' },
    pieces: [{ t: 'charminar', at: 52 }, { t: 'kaman', at: 200 }, { t: 'mecca', at: 330, side: -1 }, { t: 'kaman', at: 440 }, { t: 'chowmahalla', at: 540, side: 1 }],
    areas: ['Laad Bazaar', 'Mecca Masjid', 'Chowmahalla Palace'], geo: [17.3616, 78.4747], amb: 'bazaar' },
  { id: 'salarjung', name: 'Salar Jung Museum', te: 'సాలార్ జంగ్ మ్యూజియం', len: 560, kind: 'city',
    lm: { at: 280, name: 'Salar Jung Museum', te: 'సాలార్ జంగ్ మ్యూజియం', side: -1, fact: 'Opened to the public in 1951, it holds one of the largest one-man art collections in the world.' },
    pieces: [{ t: 'highcourt', at: 110, side: 1 }, { t: 'salarjung', at: 280, side: -1 }],
    bridges: [[30, 90, 'musi']], areas: ['Nayapul', 'Afzal Gunj', 'High Court'], geo: [17.3713, 78.4804], amb: 'city' },
  { id: 'abids', name: 'Abids & Koti', te: 'అబిడ్స్', len: 500, kind: 'city', lm: null,
    pieces: [{ t: 'clocktower', at: 250, side: 1 }], flyover: true,
    areas: ['Abids', 'Koti', 'Begum Bazaar', 'Public Garden'], geo: [17.3900, 78.4760], amb: 'city' },
  { id: 'secretariat', name: 'Telangana Secretariat', te: 'తెలంగాణ సచివాలయం', len: 560, kind: 'city', security: true,
    lm: { at: 270, name: 'Telangana Secretariat', te: 'తెలంగాణ సచివాలయం', side: -1, fact: 'Opened in 2023 beside Hussain Sagar. Its domed design draws on Deccan and Kakatiya styles.' },
    pieces: [{ t: 'secretariat', at: 270, side: -1 }], flyover: true,
    areas: ['Nampally', 'Lakdikapul', 'Khairatabad'], geo: [17.4078, 78.4718], amb: 'city' },
  { id: 'ambedkar', name: 'Ambedkar Statue', te: 'అంబేద్కర్ విగ్రహం', len: 460, kind: 'lake',
    lm: { at: 230, name: 'Dr. B. R. Ambedkar Statue', te: 'అంబేద్కర్ విగ్రహం', side: 1, fact: 'Unveiled in April 2023, the 125-foot statue stands on the banks of Hussain Sagar.' },
    pieces: [{ t: 'ambedkar', at: 230, side: 1 }], areas: ['Hussain Sagar', 'NTR Gardens'], geo: [17.4105, 78.4745], amb: 'lake' },
  { id: 'hussainsagar', name: 'Hussain Sagar', full: 'Hussain Sagar & Necklace Road', te: 'హుస్సేన్ సాగర్', len: 700, kind: 'lake',
    lm: { at: 340, name: 'Hussain Sagar', te: 'హుస్సేన్ సాగర్', side: 1, fact: 'The lake dates to 1563. The 18 m monolithic Buddha stands on the Rock of Gibraltar in its middle.' },
    pieces: [{ t: 'buddha', at: 340, side: 1 }], areas: ['Necklace Road', 'Lumbini Park', 'NTR Gardens', 'Birla Science Centre'], geo: [17.4239, 78.4738], amb: 'lake' },
  { id: 'tankbund', name: 'Tank Bund', te: 'ట్యాంక్ బండ్', len: 600, kind: 'lake', statues: true,
    lm: { at: 300, name: 'Tank Bund', te: 'ట్యాంక్ బండ్', side: 1, fact: 'The bund road along Hussain Sagar links Hyderabad and Secunderabad, lined with statues of Telugu icons.' },
    pieces: [], areas: ['Secunderabad', 'Himayatnagar', 'Lower Tank Bund'], geo: [17.4230, 78.4815], amb: 'lake' },
  { id: 'birla', name: 'Birla Mandir', te: 'బిర్లా మందిర్', len: 460, kind: 'hill',
    lm: { at: 230, name: 'Birla Mandir', te: 'బిర్లా మందిర్', side: -1, fact: 'Completed in 1976 on Naubath Pahad, the temple is built from white Rajasthani marble.' },
    pieces: [{ t: 'birla', at: 230, side: -1 }], areas: ['Naubath Pahad', 'Lakdikapul'], geo: [17.4062, 78.4691], amb: 'city' },
  { id: 'secunderabad', name: 'Secunderabad Station', te: 'సికింద్రాబాద్', len: 700, kind: 'rail',
    lm: { at: 120, name: 'Secunderabad Junction', te: 'సికింద్రాబాద్', side: -1, fact: 'Opened in 1874, it is the headquarters of the South Central Railway.' },
    pieces: [{ t: 'secstation', at: 120, side: -1 }], areas: ['Paradise', 'Begumpet', 'Tarnaka'], geo: [17.4337, 78.5016], amb: 'rail', station: { en: 'SECUNDERABAD JN.', te: 'సికింద్రాబాద్ జం.' } },
  { id: 'osmania', name: 'Osmania University', te: 'ఉస్మానియా విశ్వవిద్యాలయం', len: 600, kind: 'campus',
    lm: { at: 290, name: 'Osmania University', te: 'ఉస్మానియా విశ్వవిద్యాలయం', side: 1, fact: 'Founded in 1918. The Arts College, completed in 1939, is the icon of the campus.' },
    pieces: [{ t: 'osmania', at: 290, side: 1 }], areas: ['Tarnaka', 'Vidyanagar'], geo: [17.4137, 78.5288], amb: 'nature' },
  { id: 'kachiguda', name: 'Kachiguda Station', te: 'కాచిగూడ', len: 560, kind: 'railcity',
    lm: { at: 230, name: 'Kachiguda Station', te: 'కాచిగూడ', side: -1, fact: 'Built in 1916 by the Nizam’s Guaranteed State Railway, in a Gothic style with onion domes.' },
    pieces: [{ t: 'kachiguda', at: 230, side: -1 }], areas: ['Barkatpura', 'Koti', 'Himayatnagar'], geo: [17.3895, 78.4995], amb: 'rail', station: { en: 'KACHEGUDA', te: 'కాచిగూడ' } },
  { id: 'zoo', name: 'Nehru Zoological Park', te: 'నెహ్రూ జూ పార్క్', len: 650, kind: 'zoo',
    lm: { at: 40, name: 'Nehru Zoological Park', te: 'నెహ్రూ జూ పార్క్', side: 0, fact: 'Opened in 1963 beside Mir Alam Tank, the park spreads across 380 acres.' },
    pieces: [{ t: 'zoogate', at: 40 }], bridges: [[270, 310, 'wood'], [480, 510, 'wood']], areas: ['Bahadurpura', 'Mir Alam Tank'], geo: [17.3500, 78.4510], amb: 'nature' },
  { id: 'kphb', name: 'KPHB Metro', te: 'కేపీహెచ్‌బీ మెట్రో', len: 700, kind: 'metro',
    lm: { at: 320, name: 'KPHB Colony Station', te: 'కేపీహెచ్‌బీ కాలనీ', side: 0, fact: 'KPHB Colony sits on the Red Line between Miyapur and LB Nagar. Hyderabad Metro opened in 2017.' },
    pieces: [{ t: 'metrostation', at: 320 }], areas: ['Kukatpally', 'Miyapur', 'Ameerpet', 'Punjagutta'], geo: [17.4930, 78.3990], amb: 'metro' },
  { id: 'durgam', name: 'Durgam Cheruvu', te: 'దుర్గం చెరువు', len: 650, kind: 'bridge',
    lm: { at: 330, name: 'Durgam Cheruvu Cable Bridge', te: 'దుర్గం చెరువు', side: 0, fact: 'A lake ringed by granite boulders. Its cable-stayed bridge opened in 2020.' },
    pieces: [{ t: 'cablebridge', at: 330 }], bridges: [[190, 470, 'cable']], areas: ['Madhapur', 'Jubilee Hills', 'Banjara Hills'], geo: [17.4300, 78.3880], amb: 'lake' },
  { id: 'hitech', name: 'HITEC City', full: 'HITEC City & Cyber Towers', te: 'హైటెక్ సిటీ', len: 760, kind: 'tech',
    lm: { at: 330, name: 'Cyber Towers', te: 'సైబర్ టవర్స్', side: 1, fact: 'Opened in 1998, Cyber Towers launched HITEC City and the city’s tech boom.' },
    pieces: [{ t: 'cybertowers', at: 330, side: 1 }], flyover: true, areas: ['Madhapur', 'Kondapur', 'Raidurg'], geo: [17.4504, 78.3810], amb: 'metro' },
  { id: 'gachibowli', name: 'Financial District', full: 'Gachibowli & Financial District', te: 'గచ్చిబౌలి', len: 700, kind: 'tech',
    lm: { at: 380, name: 'Financial District', te: 'ఫైనాన్షియల్ డిస్ట్రిక్ట్', side: 1, fact: 'Gachibowli and the Financial District hold some of the tallest glass towers in the city.' },
    pieces: [{ t: 'fdtowers', at: 380, side: 1 }], flyover: true, areas: ['Gachibowli', 'Nanakramguda', 'RGI Airport'], geo: [17.4200, 78.3450], amb: 'metro' },
  { id: 'golconda', name: 'Golconda Fort', te: 'గోల్కొండ కోట', len: 760, kind: 'fort',
    lm: { at: 470, name: 'Golconda Fort', te: 'గోల్కొండ కోట', side: -1, fact: 'Capital of the Qutb Shahi kings from 1518 to 1687. A clap at Fateh Darwaza carries up to the Bala Hissar.' },
    pieces: [{ t: 'fateh', at: 90 }, { t: 'innergate', at: 330 }, { t: 'balahissar', at: 470, side: -1 }, { t: 'innergate', at: 620 }], areas: ['Fateh Darwaza', 'Bala Hissar'], geo: [17.3833, 78.4011], amb: 'fort' },
  { id: 'qutub', name: 'Qutub Shahi Tombs', te: 'కుతుబ్ షాహీ సమాధులు', len: 560, kind: 'tombs',
    lm: { at: 260, name: 'Qutub Shahi Tombs', te: 'కుతుబ్ షాహీ సమాధులు', side: -1, fact: 'The garden tombs of the Qutb Shahi dynasty stand in the Ibrahim Bagh.' },
    pieces: [{ t: 'tombSmall', at: 110, side: 1 }, { t: 'tomb', at: 260, side: -1 }, { t: 'tombSmall', at: 430, side: 1 }], areas: ['Ibrahim Bagh', 'Shaikpet'], geo: [17.3946, 78.3947], amb: 'nature' },
  { id: 'shamirpet', name: 'Shamirpet', full: 'Shamirpet Outskirts', te: 'శామీర్‌పేట్', len: 820, kind: 'outskirts',
    lm: { at: 420, name: 'Shamirpet Lake', te: 'శామీర్‌పేట్ చెరువు', side: -1, fact: 'A Nizam-era lake on the northern edge of the city, beside the Jawahar Deer Park.' },
    pieces: [], areas: ['ORR', 'Medchal', 'Uppal', 'LB Nagar'], geo: [17.5960, 78.5770], amb: 'nature' }
];
const AREA_TE = { 'Laad Bazaar': 'లాడ్ బజార్', 'Mecca Masjid': 'మక్కా మసీదు', 'Chowmahalla Palace': 'చౌమహల్లా ప్యాలెస్', 'High Court': 'హైకోర్టు', 'Abids': 'అబిడ్స్', 'Koti': 'కోఠి', 'Begum Bazaar': 'బేగం బజార్', 'Public Garden': 'పబ్లిక్ గార్డెన్', 'Nampally': 'నాంపల్లి', 'Khairatabad': 'ఖైరతాబాద్', 'Necklace Road': 'నెక్లెస్ రోడ్', 'Lumbini Park': 'లుంబిని పార్క్', 'NTR Gardens': 'ఎన్టీఆర్ గార్డెన్స్', 'Secunderabad': 'సికింద్రాబాద్', 'Himayatnagar': 'హిమాయత్‌నగర్', 'Tarnaka': 'తార్నాక', 'Kukatpally': 'కూకట్‌పల్లి', 'Miyapur': 'మియాపూర్', 'Ameerpet': 'అమీర్‌పేట్', 'Punjagutta': 'పంజాగుట్ట', 'Madhapur': 'మాదాపూర్', 'Jubilee Hills': 'జూబ్లీ హిల్స్', 'Banjara Hills': 'బంజారా హిల్స్', 'Kondapur': 'కొండాపూర్', 'Gachibowli': 'గచ్చిబౌలి', 'RGI Airport': 'విమానాశ్రయం', 'Uppal': 'ఉప్పల్', 'LB Nagar': 'ఎల్.బి.నగర్', 'Hussain Sagar': 'హుస్సేన్ సాగర్', 'Paradise': 'ప్యారడైజ్', 'Begumpet': 'బేగంపేట్', 'Koti ': 'కోఠి', 'Mehdipatnam': 'మెహదీపట్నం' };
const LINE_COLORS = ['#e2231a', '#1a74d1', '#2aa34a'];
let ZSTART = []; let LAP = 0;
(function () { let s = 0; ZONES.forEach((z, i) => { z.idx = i; ZSTART.push(s); s += z.len; z.line = LINE_COLORS[i % 3]; }); LAP = s; })();
function zoneIndexAt(wz) { const w = ((wz % LAP) + LAP) % LAP; for (let i = ZONES.length - 1; i >= 0; i--) if (w >= ZSTART[i]) return i; return 0; }
function zoneAt(wz) { return ZONES[zoneIndexAt(wz)]; }
function lapOf(wz) { return Math.floor(wz / LAP); }
function zoneLocal(wz) { const w = ((wz % LAP) + LAP) % LAP; return w - ZSTART[zoneIndexAt(wz)]; }
function zoneStartWz(idx, nearWz = 0) { const lap = Math.floor(nearWz / LAP); return lap * LAP + ZSTART[idx]; }
function nextLandmark(wz) {
  for (let k = 0; k < ZONES.length + 1; k++) {
    const lap = lapOf(wz); const zi = (zoneIndexAt(wz) + k) % ZONES.length; const add = zoneIndexAt(wz) + k >= ZONES.length ? LAP : 0;
    const z = ZONES[zi]; if (!z.lm) continue; const p = lap * LAP + add + ZSTART[zi] + z.lm.at; if (p > wz) return { z, wz: p };
  }
  return null;
}

/* ---------------- Characters ---------------- */
const CHARS = [
  { id: 'm_casual', name: 'Ravi', g: 'm', outfit: 'casual', cost: 0, top: '#2f7fd1', bottom: '#2b3552', shoe: '#f2f2f2', hair: 'short', hairC: '#1b1512', skin: '#a5714f', acc: 'none' },
  { id: 'f_casual', name: 'Sravya', g: 'f', outfit: 'casual', cost: 0, top: '#e0527a', bottom: '#2f3f6a', shoe: '#ffffff', hair: 'ponytail', hairC: '#140f0d', skin: '#b98260', acc: 'none' },
  { id: 'm_sports', name: 'Imran', g: 'm', outfit: 'sports', cost: 300, top: '#12a38c', bottom: '#15192b', shoe: '#ff6a2a', hair: 'curly', hairC: '#161010', skin: '#8f5d3f', acc: 'band' },
  { id: 'f_sports', name: 'Ayesha', g: 'f', outfit: 'sports', cost: 300, top: '#6d3fd6', bottom: '#15192b', shoe: '#27d3b0', hair: 'bun', hairC: '#1a1210', skin: '#c28d69', acc: 'headphones' },
  { id: 'm_trad', name: 'Farhan', g: 'm', outfit: 'traditional', cost: 700, top: '#efe3c5', bottom: '#f6f1e6', shoe: '#6b3f1f', hair: 'short', hairC: '#120e0c', skin: '#9c6b4b', acc: 'cap' },
  { id: 'f_trad', name: 'Lakshmi', g: 'f', outfit: 'traditional', cost: 700, top: '#c2185b', bottom: '#f2a900', shoe: '#b8860b', hair: 'long', hairC: '#0f0b0a', skin: '#a8734f', acc: 'dupatta' },
  { id: 'm_corp', name: 'Arjun', g: 'm', outfit: 'corporate', cost: 1200, top: '#2a3550', bottom: '#2a3550', shoe: '#1a1a1a', hair: 'short', hairC: '#1b1512', skin: '#b07a55', acc: 'glasses' },
  { id: 'f_corp', name: 'Meher', g: 'f', outfit: 'corporate', cost: 1200, top: '#3a3f58', bottom: '#3a3f58', shoe: '#7a1e2c', hair: 'long', hairC: '#20160f', skin: '#c9966f', acc: 'backpack' }
];
const OUTFIT_NAMES = { casual: 'Casual', sports: 'Sports', traditional: 'Traditional', corporate: 'Corporate' };
const HAIR_STYLES = ['short', 'curly', 'long', 'ponytail', 'bun', 'buzz'];
const HAIR_COLORS = ['#0f0b0a', '#2a1b12', '#4a2c1a', '#7a4a26', '#9aa0a8'];
const SKIN_TONES = ['#e2b594', '#c9966f', '#b07a55', '#9c6b4b', '#7e5236', '#5e3b26'];
const CLOTH_COLORS = ['#2f7fd1', '#e0527a', '#12a38c', '#6d3fd6', '#e9b949', '#f26b38', '#c2185b', '#efe3c5', '#2a3550', '#15192b', '#f4efe6', '#3b8f3a'];
const SHOE_COLORS = ['#f2f2f2', '#1a1a1a', '#ff6a2a', '#27d3b0', '#6b3f1f', '#e9b949'];
const ACCESSORIES = [['none', 'None'], ['cap', 'Cap'], ['headphones', 'Headphones'], ['glasses', 'Sunglasses'], ['backpack', 'Backpack'], ['band', 'Headband'], ['dupatta', 'Dupatta / scarf']];
const RUN_STYLES = [['sprint', 'Sprint'], ['stride', 'Long stride'], ['bouncy', 'Bouncy']];

/* ---------------- Power-ups ---------------- */
const POWERS = {
  dash: { name: 'Hyderabad Dash', color: '#f26b38', dur: 6, desc: 'Burst of speed. Smash through anything.' },
  shield: { name: 'Charminar Shield', color: '#22b3a6', dur: 30, desc: 'Absorbs one collision.' },
  cyber: { name: 'Cyber Boost', color: '#39d0ff', dur: 12, desc: 'Double score. Pulls in nearby tokens.' },
  metro: { name: 'Metro Boost', color: '#e2231a', dur: 5, desc: 'Ride above the traffic at high speed.' },
  magnet: { name: 'Nizami Magnet', color: '#e9b949', dur: 12, desc: 'Draws in tokens from every lane.' },
  lake: { name: 'Lake Jump', color: '#4a8dff', dur: 12, desc: 'Super-high jumps.' }
};

/* ---------------- Missions (300, in sets of 3) ---------------- */
const MIS_FIXED = [
  [['through', 0], ['tokens', 30], ['jumps', 8]],
  [['reach', 2, 'Cross Salar Jung Museum'], ['slides', 6], ['powerups', 1]],
  [['reach', 6, 'Cross Hussain Sagar'], ['dist', 1500], ['pearls', 3]],
  [['reach', 9, 'Survive Secunderabad Railway Station'], ['tokens', 120], ['dashes', 3]],
  [['landmarks', 3, 'Cross three landmarks in one run'], ['clean', 1200], ['score', 15000]],
  [['reach', 13, 'Run through KPHB Metro'], ['night', 500], ['metro', 1]],
  [['lm', 14, 'Reach Cyber Towers'], ['tokens', 250], ['rain', 400]],
  [['reach', 17, 'Complete the Golconda Fort Run'], ['dist', 5000], ['clean', 2500]],
  [['lm', 14, 'Travel from Charminar to HITEC City', 0], ['jumps', 40], ['powerups', 4]]
];
const MIS_POOL = [
  ['dist', 2200, .16], ['tokens', 180, .14], ['jumps', 26, .1], ['slides', 20, .1], ['powerups', 3, .08], ['pearls', 8, .1], ['dashes', 5, .08],
  ['clean', 1500, .14], ['score', 30000, .22], ['landmarks', 4, .05], ['night', 900, .12], ['rain', 700, .12], ['metro', 2, .05], ['reach', 0, 0], ['lm', 0, 0]
];
function missionAt(tier, slot) {
  let def;
  if (tier < MIS_FIXED.length) def = MIS_FIXED[tier][slot];
  else {
    const r = mulberry32(tier * 7919 + 13); const used = new Set(); let picks = [];
    while (picks.length < 3) { const p = MIS_POOL[Math.floor(r() * MIS_POOL.length)]; if (used.has(p[0])) continue; used.add(p[0]); picks.push(p); }
    const p = picks[slot]; const t = tier - MIS_FIXED.length;
    if (p[0] === 'reach' || p[0] === 'lm') {
      const cands = p[0] === 'lm' ? ZONES.map((z, i) => z.lm ? i : -1).filter(i => i > 2) : ZONES.map((z, i) => i).filter(i => i > 2);
      const zi = cands[(t * 5 + slot * 3) % cands.length];
      def = [p[0], zi];
    } else {
      let n = p[1] * (1 + t * p[2]);
      if (p[0] === 'landmarks') n = Math.min(18, Math.round(n));
      else if (n > 100) n = Math.round(n / 50) * 50; else n = Math.round(n);
      def = [p[0], n];
    }
  }
  return { type: def[0], n: def[1], label: def[2] || null, from: def[3], tier, slot };
}
function missionText(m) {
  if (m.label) return m.label;
  const n = m.n;
  switch (m.type) {
    case 'through': return 'Run through ' + ZONES[n].lm.name;
    case 'reach': return 'Reach ' + ZONES[n].name + ' in one run';
    case 'lm': return 'Pass ' + ZONES[n].lm.name + ' in one run';
    case 'dist': return 'Run ' + fmtKm(n) + ' in one run';
    case 'tokens': return 'Collect ' + fmtIN(n) + ' tokens in one run';
    case 'jumps': return 'Jump ' + n + ' times in one run';
    case 'slides': return 'Slide ' + n + ' times in one run';
    case 'powerups': return 'Pick up ' + n + ' power-up' + (n > 1 ? 's' : '') + ' in one run';
    case 'pearls': return 'Collect ' + n + ' pearls in one run';
    case 'dashes': return 'Dash ' + n + ' times in one run';
    case 'clean': return 'Run ' + fmtKm(n) + ' without stumbling';
    case 'score': return 'Score ' + fmtIN(n) + ' in one run';
    case 'landmarks': return 'Cross ' + n + ' landmarks in one run';
    case 'night': return 'Run ' + fmtKm(n) + ' at night';
    case 'rain': return 'Run ' + fmtKm(n) + ' in the rain';
    case 'metro': return 'Ride Metro Boost ' + n + ' time' + (n > 1 ? 's' : '') + ' in one run';
  }
  return '';
}
function missionProgress(m, st) {
  if (!st) return 0;
  switch (m.type) {
    case 'through': return st.lmPassed.has(m.n) ? 1 : 0;
    case 'reach': return st.zonesReached.has(m.n) && st.runDist > 5 ? 1 : 0;
    case 'lm': if (m.from !== undefined && st.startZone !== m.from) return 0; return st.lmPassed.has(m.n) ? 1 : 0;
    case 'dist': return st.runDist / m.n; case 'tokens': return st.tokens / m.n; case 'jumps': return st.jumps / m.n;
    case 'slides': return st.slides / m.n; case 'powerups': return st.powerups / m.n; case 'pearls': return st.pearls / m.n;
    case 'dashes': return st.dashes / m.n; case 'clean': return Math.max(st.bestClean, st.clean) / m.n; case 'score': return st.score / m.n;
    case 'landmarks': return st.lms / m.n; case 'night': return st.nightDist / m.n; case 'rain': return st.rainDist / m.n; case 'metro': return st.metros / m.n;
  }
  return 0;
}
const MIS_TOTAL = 300;

/* ---------------- Challenges & time attack ---------------- */
const CHALLENGES = [
  { id: 'clean5k', name: 'Clean 5K', desc: 'Run 5 km without a single collision.', start: 0, goal: { type: 'dist', n: 5000 }, noHit: true, reward: 400 },
  { id: 'hoard', name: 'Token Hoarder', desc: 'Collect 500 tokens in one run.', start: 0, goal: { type: 'tokens', n: 500 }, reward: 350 },
  { id: 'hattrick', name: 'Landmark Hat-trick', desc: 'Cross three landmarks in one run.', start: 3, goal: { type: 'landmarks', n: 3 }, reward: 250 },
  { id: 'night', name: 'Night Owl', desc: 'Run 2 km through the city at night.', start: 12, goal: { type: 'dist', n: 2000 }, tod: .75, reward: 300 },
  { id: 'chase', name: 'Traffic Chase', desc: 'Survive 90 seconds of rush-hour traffic in Abids.', start: 2, goal: { type: 'time', n: 90 }, traffic: 1.8, reward: 350 },
  { id: 'monsoon', name: 'Monsoon Run', desc: 'Run 2.5 km through heavy rain.', start: 4, goal: { type: 'dist', n: 2500 }, weather: 'heavy', reward: 300 },
  { id: 'fort', name: 'Fort Escape', desc: 'Get through Golconda Fort without stumbling.', start: 16, goal: { type: 'zone', n: 17 }, noHit: true, reward: 300 },
  { id: 'rail', name: 'Rail Rush', desc: 'Survive Secunderabad Station at double train traffic.', start: 8, goal: { type: 'zone', n: 9 }, trains: 2, reward: 300 }
];
const TA_ROUTES = [
  { id: 'old', name: 'Old City Dash', from: 0, to: 3 },
  { id: 'lake', name: 'Lakeside Sprint', from: 3, to: 8 },
  { id: 'stations', name: 'Twin Stations', from: 8, to: 11 },
  { id: 'tech', name: 'Tech Corridor', from: 12, to: 16 },
  { id: 'fort', name: 'Fort & Tombs', from: 16, to: 18 },
  { id: 'grand', name: 'Charminar to HITEC City', from: 0, to: 14 }
];
function speedAt(runDist) { return Math.min(32, 12.5 + runDist * 0.0015); }
function taAllowed(r) {
  const d = ZSTART[r.to] - ZSTART[r.from]; let t = 0; for (let x = 0; x < d; x += 10) t += 10 / speedAt(x); return Math.ceil(t * 1.14 + 4);
}

/* ---------------- Persistence ---------------- */
const SAVE_KEY = 'hydrun3d.v1';
const DEFAULT_SETTINGS = () => ({ quality: 'auto', music: .55, sfx: .8, amb: .6, shake: true, tod: 'auto', weather: 'auto', traffic: 1, fps: false, bloom: true });
const DEFAULT_SAVE = () => ({ tokens: 0, best: { score: 0, dist: 0 }, totalDist: 0, totalTokens: 0, runs: 0, unlocked: [0], lastZone: 0, lastDist: 0, chars: { owned: ['m_casual', 'f_casual'], sel: 'm_casual', custom: {} }, mis: { tier: 0, done: [false, false, false] }, multLevel: 0, tour: {}, chal: {}, ta: {}, board: [], friends: [], name: '', home: true, seenIntro: false });
let S = DEFAULT_SAVE();
function loadSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const o = JSON.parse(raw); S = Object.assign(DEFAULT_SAVE(), o); } } catch (e) { S = DEFAULT_SAVE(); }
  S.settings = Object.assign(DEFAULT_SETTINGS(), S.settings || {});
  S.chars = Object.assign({ owned: ['m_casual', 'f_casual'], sel: 'm_casual', custom: {} }, S.chars || {});
  if (!Array.isArray(S.unlocked) || !S.unlocked.length) S.unlocked = [0];
}
let saveTimer = 0;
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function unlockZone(i) { if (!S.unlocked.includes(i)) { S.unlocked.push(i); S.unlocked.sort((a, b) => a - b); return true; } return false; }
function charDef() {
  const base = CHARS.find(c => c.id === S.chars.sel) || CHARS[0];
  return Object.assign({ run: 'sprint' }, base, S.chars.custom[base.id] || {});
}
