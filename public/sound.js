const SND = (() => {
  let c, muted = localStorage.mute == '1';
  const ctx = () => { if (!c) { const A = window.AudioContext || window.webkitAudioContext; if (A) c = new A(); } if (c && c.state == 'suspended') c.resume(); return c; };
  const noise = (d, f, g, t = 0) => {
    const a = muted ? null : ctx(); if (!a) return;
    const n = a.createBuffer(1, Math.max(1, Math.floor(a.sampleRate * d)), a.sampleRate), x = n.getChannelData(0);
    for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / x.length, 1.7);
    const s = a.createBufferSource(); s.buffer = n;
    const b = a.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f;
    const v = a.createGain(); v.gain.value = 0;
    s.connect(b); b.connect(v); v.connect(a.destination);
    const T = a.currentTime + t; v.gain.setValueAtTime(.001, T); v.gain.exponentialRampToValueAtTime(g, T + .012); v.gain.exponentialRampToValueAtTime(.001, T + d); s.start(T); s.stop(T + d + .02);
  };
  const tone = (f, d, g, t = 0) => {
    const a = muted ? null : ctx(); if (!a) return;
    const o = a.createOscillator(), v = a.createGain(), T = a.currentTime + t;
    o.frequency.value = f; v.gain.setValueAtTime(g, T); v.gain.exponentialRampToValueAtTime(.001, T + d);
    o.connect(v); v.connect(a.destination); o.start(T); o.stop(T + d);
  };
  const shuffle = () => { noise(.095, 1450, .38, 0); noise(.095, 1750, .36, .075); noise(.10, 2050, .32, .15); noise(.10, 1650, .28, .225); noise(.11, 1350, .22, .30); };
  return {
    card: shuffle,
    deal: () => { noise(.075, 2100, .28, 0); noise(.08, 1750, .24, .075); noise(.085, 1450, .18, .15); },
    win: () => { tone(660, .18, .18); tone(880, .3, .18, .12); },
    swap: () => { tone(300, .2, .2); tone(450, .25, .2, .12); },
    ping: () => tone(1000, .08, .1), count: n => tone(n === 0 ? 880 : 520 + n * 70, .18, .14), unlock: ctx, muted: () => muted,
    toggle: () => { muted = !muted; localStorage.mute = muted ? '1' : '0'; return muted; }
  };
})();
