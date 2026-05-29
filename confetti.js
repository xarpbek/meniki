// Lumio Confetti & Effects
(function () {
  let canvas = null, ctx = null, particles = [];
  function init() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(loop);
  }
  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.vy += 0.18;
      p.vx *= 0.99;
      p.x += p.vx; p.y += p.vy;
      p.rot += p.vr;
      p.life--;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life / 50);
      ctx.fillStyle = p.color;
      if (p.shape === 'square') ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      else if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.size/2, 0, Math.PI*2); ctx.fill(); }
      else { ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2); }
      ctx.restore();
    });
    requestAnimationFrame(loop);
  }
  function fire(opts = {}) {
    init();
    const colors = opts.colors || ['#ff6b6b','#4ecdc4','#ffe66d','#a8e6cf','#ff8a00','#7c3aed','#0284c7','#e11d48'];
    const count = opts.count || 80;
    const x = opts.x ?? canvas.width/2;
    const y = opts.y ?? canvas.height/2;
    const spread = opts.spread || Math.PI;
    const startAngle = opts.angle ?? -Math.PI/2;
    const power = opts.power || 14;
    const shapes = ['square','circle','rect'];
    for (let i = 0; i < count; i++) {
      const a = startAngle - spread/2 + Math.random() * spread;
      const v = power * (0.5 + Math.random() * 0.7);
      particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        size: 6 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        life: 100 + Math.random() * 60,
      });
    }
  }
  function celebrate() {
    fire({ x: innerWidth*0.2, y: innerHeight*0.4, angle: -Math.PI/3, count: 60 });
    setTimeout(() => fire({ x: innerWidth*0.8, y: innerHeight*0.4, angle: -2*Math.PI/3, count: 60 }), 150);
    setTimeout(() => fire({ x: innerWidth*0.5, y: innerHeight*0.4, count: 80 }), 300);
  }
  window.confetti = { fire, celebrate };
})();

// Sound effects (Web Audio synth - no external files)
(function () {
  let ctx = null;
  function getCtx() { if (!ctx) try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} return ctx; }
  function tone(freq, dur = 0.15, vol = 0.1, type = 'sine', delay = 0) {
    const c = getCtx(); if (!c) return;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = 0;
    o.connect(g); g.connect(c.destination);
    const t = c.currentTime + delay;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur);
  }
  function play(name) {
    if (!window.lumioSettings || window.lumioSettings.sounds === false) return;
    if (name === 'click') tone(800, 0.05, 0.05);
    else if (name === 'complete') { tone(523, 0.1, 0.08); tone(659, 0.1, 0.08, 'sine', 0.08); tone(784, 0.15, 0.08, 'sine', 0.16); }
    else if (name === 'achievement') { tone(523, 0.12, 0.1); tone(659, 0.12, 0.1, 'sine', 0.1); tone(784, 0.12, 0.1, 'sine', 0.2); tone(1047, 0.25, 0.1, 'sine', 0.3); }
    else if (name === 'levelup') { tone(440, 0.08, 0.1, 'triangle'); tone(554, 0.08, 0.1, 'triangle', 0.08); tone(659, 0.08, 0.1, 'triangle', 0.16); tone(880, 0.3, 0.1, 'triangle', 0.24); }
    else if (name === 'error') { tone(200, 0.15, 0.1, 'sawtooth'); tone(150, 0.2, 0.1, 'sawtooth', 0.08); }
    else if (name === 'tick') tone(1200, 0.03, 0.04);
    else if (name === 'pop') tone(600, 0.08, 0.08, 'triangle');
  }
  function haptic(pattern = 30) {
    if (navigator.vibrate) try { navigator.vibrate(pattern); } catch {}
  }
  window.fx = { play, haptic };
})();
