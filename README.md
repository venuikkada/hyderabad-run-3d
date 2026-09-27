# Hyderabad Run 3D — The City Chase

A 3D endless runner through Hyderabad, built with three.js. Plays on phones (portrait or landscape) and PCs. Run from Charminar through Salar Jung Museum, Hussain Sagar, Secunderabad Station, KPHB Metro, HITEC City, Golconda Fort and on to Shamirpet.

**Play:** https://venuikkada.github.io/hyderabad-run-3d/

## Controls
- **Keyboard:** A/D or ←/→ switch lanes · W/↑/Space jump · S/↓ slide · Shift/E dash · Esc/P pause
- **Phone:** swipe left, right, up or down · double-tap or the Dash button to dash
- **Gamepad:** stick or d-pad to steer · A jump · B slide · X/RB dash · Start pause

## Modes
Endless run, Landmark Tour, Time Attack, Challenges and Free Run, plus 300 missions, 8 characters and a 3D city map.

## Project layout
- `index.html` — the playable game (single file; loads three.js r128 from public CDNs)
- `src/` — source: `core.js` (zones, missions, saves), `gfx.js` (textures, materials), `props.js`, `landmarks.js`, `world.js`, `character.js`, `audio.js`, `game.js`, `ui.js`, `main.js`, `shell.html` (styles and markup)
- `Soldier.glb` — realistic motion-captured runner model (from the three.js examples, originally from Adobe Mixamo; keep it next to `index.html`)
- `build.py` — rebuilds `index.html` from `src/` (`python3 build.py`)

Scores and progress are saved in each player's browser.
