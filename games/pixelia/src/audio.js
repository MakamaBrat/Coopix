'use strict';
/* ПИКСЕЛИЯ — звук: без постоянного фона (он давал шипение). Только короткие эффекты: нажатия, появление, взрыв, гром, всплеск, треск дерева и редкий треск большого огня */
const Snd = (function () {
  let ctx = null, master = null, nb = null; const ch = {}; let on = true, ready = false;
  function init() {
    if (ctx || !on) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = .42; master.connect(ctx.destination);
      nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      ready = true;
    } catch (e) { ctx = null; }
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
  let lastCrackle = 0, lastSplash = 0;
  function update(a, weather) {   /* большой огонь изредка потрескивает; остального фона нет */
    if (!ready || !on) return;
    const now = performance.now();
    if (a.f > 14 && now - lastCrackle > 420 && Math.random() < .5) { lastCrackle = now; burst(1800 + Math.random() * 1400, 'bandpass', .05, .05 + Math.min(.07, a.f / 600), 900); }
  }
  function burst(freq, type, dur, vol, sweepTo) {
    if (!ready || !on) return;
    const s = ctx.createBufferSource(); s.buffer = nb; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, ctx.currentTime + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(ctx.currentTime, Math.random()); s.stop(ctx.currentTime + dur + .05);
  }
  function tone(freq, dur, vol, type, to) {
    if (!ready || !on) return;
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq; if (to) o.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + dur);
    o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + dur + .05);
  }
  let lastBoom = 0;
  function sfx(name, v) {
    if (!ready || !on) return; v = v == null ? 1 : v;
    const now = performance.now();
    switch (name) {
      case 'boom': if (now - lastBoom < 90) return; lastBoom = now; burst(380, 'lowpass', .9, .7 * v, 60); tone(90, .6, .6 * v, 'sine', 38); break;
      case 'zap': burst(5000, 'highpass', .18, .5, 1200); burst(260, 'lowpass', 1.3, .5, 70); break;
      case 'hiss': if (now - lastSplash < 350) return; lastSplash = now; burst(1500, 'lowpass', .3, .14 * v, 500); break;   /* всплеск и пар: мягкий, не чаще раза в треть секунды */
      case 'crack': burst(6000, 'highpass', .08, .3); tone(2400, .06, .12, 'square', 900); break;
      case 'whoosh': burst(300, 'bandpass', 1.1, .28, 1800); break;
      case 'tap': tone(660, .05, .06, 'square', 880); break;
      case 'ok': tone(660, .08, .08, 'square'); setTimeout(() => tone(990, .12, .08, 'square'), 80); break;
      case 'nope': tone(180, .14, .08, 'square', 120); break;
      case 'pop': tone(520, .07, .07, 'triangle', 780); break;
    }
  }
  return { init, resume, update, sfx, set on(v) { on = !!v; }, get on() { return on; } };
})();
