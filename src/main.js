/* =========================================================
   Boot
   ========================================================= */
async function boot() {
  const bar = $('#ldbar'), msg = $('#ldmsg');
  const step = async (p, m) => { bar.style.width = p + '%'; msg.textContent = m; await new Promise(r => setTimeout(r, 20)); };
  loadSave();
  await step(6, 'Loading fonts');
  try { await Promise.race([Promise.all(['700 40px "Noto Sans Telugu"', '600 40px "Hind"', '800 40px "Barlow Condensed"', '40px "Tiro Telugu"', '40px "Rozha One"'].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 2500))]); } catch (e) { }
  if (!window.THREE) { msg.textContent = 'The 3D engine did not load. Check your connection and reload the page.'; return; }
  try {
    await step(22, 'Painting the old city'); buildTextures(); buildMaterials(); buildPrims();
    await step(38, 'Suiting up the runner'); await loadRealRunner();
    await step(52, 'Raising Charminar'); initRenderer(); tuneMaterialsForIBL(); initGame();
    await step(72, 'Laying the roads'); ENV.tod = .03; setWeather('clear', true); resetWorld(0); setSkyInstant('old'); applyTod(ENV.tod); refreshEnvMap(true);
    await step(92, 'Waking the city'); initInput(); refreshMenu(); $('#fps').hidden = !S.settings.fps;
  } catch (e) { console.error(e); msg.textContent = 'This device could not start WebGL. Try another browser or turn on hardware acceleration.'; return; }
  G.state = 'menu'; only('menu'); camera.position.set(-2.4, 1.9, 6.8); camLook.set(2.2, 13, -52);
  requestAnimationFrame(loop); await step(100, 'Ready');
  setTimeout(() => $('#loading').classList.add('done'), 200);
}
boot();
