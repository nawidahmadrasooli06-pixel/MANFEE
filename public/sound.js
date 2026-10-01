const SND = (() => {
  let c, muted = localStorage.mute == '1';
  const ctx = () => { if (!c) { const A = window.AudioContext || window.webkitAudioContext; if (A) c = new A(); } if (c && c.state == 'suspended') c.resume(); return c; };
  const noise = (d, f, g) => {
    const a = muted ? null : ctx(); if (!a) return;
    const n = a.createBuffer(1, a.sampleRate * d, a.sampleRate), x = n.getChannelData(0);
    for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / x.length, 2);
    const s = a.createBufferSource(); s.buffer = n;
    const b = a.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f;
    const v = a.createGain(); v.gain.value = g;
    s.connect(b); b.connect(v); v.connect(a.destination); s.start();
  };
  const tone = (f, d, g, t = 0) => {
    const a = muted ? null : ctx(); if (!a) return;
    const o = a.createOscillator(), v = a.createGain(), T = a.currentTime + t;
    o.frequency.value = f; v.gain.setValueAtTime(g, T); v.gain.exponentialRampToValueAtTime(.001, T + d);
    o.connect(v); v.connect(a.destination); o.start(T); o.stop(T + d);
  };
  return {
    card: () => noise(.1, 1700, 1.1), deal: () => noise(.07, 2600, .6),
    win: () => { tone(660, .18, .18); tone(880, .3, .18, .12); },
    swap: () => { tone(300, .2, .2); tone(450, .25, .2, .12); },
    ping: () => tone(1000, .08, .1), unlock: ctx, muted: () => muted,
    toggle: () => { muted = !muted; localStorage.mute = muted ? '1' : '0'; return muted; }
  };
})();
