// Footage-based cinematic engine: cross-dissolved shots, Ken Burns moves,
// electrical light-flicker exposure, grain, captions, ending.

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// [elementId, in, out, scaleFrom, scaleTo, clipOffset]
const SEGMENTS = [
  ['sh-road', 0, 10, 1.02, 1.10, 2],
  ['sh-walkfog', 8, 22, 1.04, 1.12, 1],
  ['sh-walk2', 20, 30, 1.06, 1.16, 0],
  ['sh-tree', 28, 40, 1.06, 1.16, 0],
  ['sh-sit', 38, 62, 1.03, 1.10, 0],
  ['sh-cry', 60, 70, 1.05, 1.14, 0],
  ['sh-sit', 68, 80, 1.10, 1.03, 4],
  ['sh-tree', 78, 88, 1.16, 1.04, 0],
];
const DISSOLVE = 2.2;
const END_T = 88;

export class Film {
  constructor(audio) {
    this.audio = audio;
    this.t = 0;
    this.playing = false;
    this.raf = 0;
    this.last = 0;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ended = false;
    this.failed = new Set();
    this.grainTick = 0;
    this.flick = { v: 0, target: 0, timer: 0, glow: 0 };
  }

  mount() {
    this.els = {};
    for (const [id] of SEGMENTS) {
      if (!this.els[id]) {
        const el = document.getElementById(id);
        this.els[id] = el;
        if (el && el.tagName === 'VIDEO') {
          el.addEventListener('error', () => this.failed.add(id), true);
          const src = el.querySelector('source');
          if (src) src.addEventListener('error', () => this.failed.add(id));
        }
      }
    }
    this.exposure = document.getElementById('exposure');
    this.afterglow = document.getElementById('afterglow');
    this.caption = document.getElementById('caption');
    this.endcard = document.getElementById('endcard');
    this.fadeblack = document.getElementById('fadeblack');
    this.grainC = document.getElementById('grain');
    this.grainX = this.grainC.getContext('2d');
    this.grainC.width = 160; this.grainC.height = 90;
    this._cap = '';
    document.addEventListener('visibilitychange', () => {
      this.last = performance.now();
    });
  }

  start() {
    this.reset();
    this.playing = true;
    document.body.classList.add('playing');
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame((ts) => this.tick(ts));
  }

  reset() {
    this.t = 0;
    this.ended = false;
    this._fadeStarted = false;
    this._cap = '';
    this.flick = { v: 0, target: 0, timer: 0, glow: 0 };
    this.endcard.classList.remove('show');
    this.endcard.setAttribute('aria-hidden', 'true');
    this.fadeblack.classList.remove('show');
    document.getElementById('replayBtn').hidden = true;
    for (const id in this.els) {
      const el = this.els[id];
      el.style.opacity = '0';
      if (el.tagName === 'VIDEO') { try { el.pause(); el.currentTime = 0; } catch {} }
    }
    if (this.audio) this.audio.reset();
  }

  stop() { this.playing = false; cancelAnimationFrame(this.raf); }

  segWeight(s, t) {
    const [, inn, out] = s;
    if (t < inn || t > out) return 0;
    const fadeIn = clamp01((t - inn) / DISSOLVE);
    const fadeOut = clamp01((out - t) / DISSOLVE);
    return smooth(Math.min(fadeIn, fadeOut));
  }

  tick(now) {
    if (!this.playing) return;
    let dt = Math.min((now - this.last) / 1000, 0.1);
    this.last = now;
    if (!document.hidden) {
      this.t += dt;
      this.update(dt);
    }
    this.raf = requestAnimationFrame((ts) => this.tick(ts));
  }

  update(dt) {
    const t = this.t;
    // per-element: max weight across its segments + Ken Burns scale
    const vis = {};
    for (const s of SEGMENTS) {
      const [id, inn, out, s0, s1, off] = s;
      if (this.failed.has(id)) continue;
      const w = this.segWeight(s, t);
      if (w <= 0) continue;
      const k = this.reduced ? 0.5 : smooth(clamp01((t - inn) / Math.max(0.01, out - inn)));
      const scale = this.reduced ? 1.03 : lerp(s0, s1, k);
      if (!vis[id] || w > vis[id].w) vis[id] = { w, scale };
      const el = this.els[id];
      if (el.tagName === 'VIDEO') {
        if (el.paused) {
          try {
            if (Math.abs(el.currentTime - off) > 0.6 && el.readyState > 0) el.currentTime = off;
            el.play().catch(() => {});
          } catch {}
        }
      }
    }
    for (const id in this.els) {
      const el = this.els[id];
      const v = vis[id];
      el.style.opacity = v ? v.w.toFixed(3) : '0';
      if (v) el.style.transform = `scale(${v.scale.toFixed(4)})`;
      if (!v && el.tagName === 'VIDEO' && !el.paused) { try { el.pause(); } catch {} }
    }

    this.updateExposure(t, dt);
    this.updateAudio(t);
    this.updateCaption(t);
    this.drawGrain();

    if (t >= 82 && !this._fadeStarted) {
      this._fadeStarted = true;
      this.fadeblack.classList.add('show');
    }
    if (t >= 85.5 && !this.ended) {
      this.ended = true;
      this.endcard.classList.add('show');
      this.endcard.setAttribute('aria-hidden', 'false');
      document.getElementById('replayBtn').hidden = false;
      if (this.audio) this.audio.finish();
    }
    if (t >= END_T + 2) this.stop();
  }

  updateExposure(t, dt) {
    const F0 = 45, F1 = 68;
    let target = 0, glow = 0;
    if (!this.reduced && t >= F0 && t <= F1) {
      const f = this.flick;
      f.timer -= dt;
      if (f.timer <= 0) {
        const r = Math.random();
        if (r < 0.14) { f.target = 0.30 + Math.random() * 0.25; f.timer = 0.08 + Math.random() * 0.14; }
        else if (r < 0.34) { f.target = 0.10 + Math.random() * 0.12; f.timer = 0.2 + Math.random() * 0.5; }
        else { f.target = Math.random() * 0.05; f.timer = 0.5 + Math.random() * 1.4; }
        if (f.v > 0.25 && f.target < 0.08) glow = 0.5; // recovery breath
      }
      target = f.target;
      glow = Math.max(glow, (f.glow || 0) - dt * 1.2);
      f.glow = glow;
    } else {
      this.flick.target = 0;
    }
    this.flick.v = lerp(this.flick.v, target, Math.min(1, dt * 16));
    this.exposure.style.opacity = this.flick.v.toFixed(3);
    this.afterglow.style.opacity = ((this.flick.glow || 0) * 0.12).toFixed(3);
  }

  updateAudio(t) {
    if (!this.audio) return;
    this.audio.setSob(t >= 40 && t <= 72 ? clamp01((t - 40) / 8) : 0);
  }

  updateCaption(t) {
    let s = 'Empty road at night.';
    if (t >= 8 && t < 20) s = 'A boy appears in the distance.';
    else if (t >= 20 && t < 30) s = 'He walks slowly toward the banyan tree.';
    else if (t >= 30 && t < 40) s = 'The old banyan tree.';
    else if (t >= 40 && t < 46) s = 'He sits down beneath the tree.';
    else if (t >= 46 && t < 60) s = 'He covers his face and cries softly.';
    else if (t >= 60) s = 'Street lights flicker around him.';
    if (s !== this._cap) { this._cap = s; this.caption.textContent = s; }
  }

  drawGrain() {
    if (document.hidden) return;
    const now = performance.now();
    if (now - this.grainTick < (this.reduced ? 2000 : 120)) return;
    this.grainTick = now;
    const ctx = this.grainX, W = 160, H = 90;
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
}
