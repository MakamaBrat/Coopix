'use strict';
/* ПИКСЕЛИЯ — звук: фон собирается из самой симуляции (шорох песка, плеск воды, треск огня) + удары, гром, шипение */
const Snd = (function () {
  let ctx = null, master = null, nb = null; const ch = {}; let on = true, ready = false;
  function init() {
    if (ctx || !on) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination);
      nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const mk = (type, f, q) => { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(master); s.start(); return g; };
      ch.sand = mk('bandpass', 3200, .8); ch.water = mk('bandpass', 1100, 1.4); ch.fire = mk('highpass', 2400, .4); ch.rain = mk('highpass', 5200, .3);
      ready = true;
    } catch (e) { ctx = null; }
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function set(g, v) { if (g && ctx) g.gain.setTargetAtTime(on ? v : 0, ctx.currentTime, .08); }
  function update(a, weather) {
    if (!ready) return;
    set(ch.sand, Math.min(1, a.p / 45) * .09);
    set(ch.water, Math.min(1, a.l / 70) * .11);
    set(ch.fire, Math.min(1, a.f / 28) * (.05 + Math.random() * .05));
    set(ch.rain, weather === 1 || weather === 3 ? .035 : weather === 2 ? .008 : 0);
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
      case 'hiss': burst(4200, 'highpass', .35, .22 * v); break;
      case 'crack': burst(6000, 'highpass', .08, .3); tone(2400, .06, .12, 'square', 900); break;
      case 'whoosh': burst(300, 'bandpass', 1.1, .35, 1800); break;
      case 'tap': tone(660, .05, .06, 'square', 880); break;
      case 'ok': tone(660, .08, .08, 'square'); setTimeout(() => tone(990, .12, .08, 'square'), 80); break;
      case 'nope': tone(180, .14, .08, 'square', 120); break;
      case 'pop': tone(520, .07, .07, 'triangle', 780); break;
    }
  }
  return { init, resume, update, sfx, set on(v) { on = !!v; if (!v && ctx) for (const k in ch) ch[k].gain.value = 0; }, get on() { return on; } };
})();
