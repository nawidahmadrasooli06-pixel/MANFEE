// Voice chat between players (WebRTC mesh, signaling through the game server)
const V = (() => {
  let sk, me = -1, ms = null, live = false; const pcs = {};
  const cfg = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
  const box = document.createElement('div'); box.style.display = 'none'; document.body.appendChild(box);
  function mk(j, offer) {
    const pc = new RTCPeerConnection(cfg); pc.q = []; pcs[j] = pc;
    const tr = pc.addTransceiver('audio', { direction: 'sendrecv' });
    if (ms && live) tr.sender.replaceTrack(ms.getAudioTracks()[0]);
    pc.onicecandidate = e => e.candidate && sk.emit('sig', { to: j, d: { c: e.candidate } });
    pc.ontrack = e => {
      let a = document.getElementById('au' + j);
      if (!a) { a = document.createElement('audio'); a.id = 'au' + j; a.autoplay = true; a.playsInline = true; box.appendChild(a); }
      a.srcObject = e.streams[0] || new MediaStream([e.track]); a.play().catch(() => { });
    };
    if (offer) pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => sk.emit('sig', { to: j, d: { s: pc.localDescription } }));
    return pc;
  }
  async function sig({ from, d }) {
    const pc = pcs[from] || mk(from, false);
    try {
      if (d.s) {
        await pc.setRemoteDescription(d.s);
        pc.q.splice(0).forEach(c => pc.addIceCandidate(c).catch(() => { }));
        if (d.s.type == 'offer') { await pc.setLocalDescription(await pc.createAnswer()); sk.emit('sig', { to: from, d: { s: pc.localDescription } }); }
      } else if (d.c) pc.remoteDescription ? pc.addIceCandidate(d.c).catch(() => { }) : pc.q.push(d.c);
    } catch (e) { }
  }
  function sync(s) {
    me = s.me; const want = new Set();
    s.seats.forEach((x, j) => { if (x && x.on && j != me) want.add(j); });
    want.forEach(j => { if (!pcs[j] && me < j) mk(j, true); });
    for (const j in pcs) if (!want.has(+j)) { pcs[j].close(); delete pcs[j]; const a = document.getElementById('au' + j); a && a.remove(); }
  }
  async function toggle() {
    if (!live) {
      if (!ms) {
        try { ms = await navigator.mediaDevices.getUserMedia({ audio: true }); }
        catch (e) { alert('میکروفون اجازه نگرفت. از تنظیمات گوشی/تلگرام اجازه‌ی میکروفون را روشن کن.'); return; }
      }
      live = true; const t = ms.getAudioTracks()[0]; t.enabled = true;
      for (const j in pcs) pcs[j].getSenders().forEach(s => s.replaceTrack(t));
    } else { live = false; ms.getAudioTracks()[0].enabled = false; }
    T.mic();
  }
  return { init: s => { sk = s; }, sync, sig, toggle, live: () => live };
})();
