// Real-asset audio mixer: licensed song + real sobbing + night ambience.
// Mix ≈ song forward, ambience low, sobs quietly beneath.

export class CinematicAudio {
  constructor() {
    this.muted = false;
    this.ok = false;
    this.sobLevel = 0;
  }

  async init() {
    if (this.ok) {
      try { await this.unlock(); } catch {}
      return true;
    }
    try {
      const mk = (src, loop, vol) => {
        const a = new Audio(src);
        a.loop = loop;
        a.preload = 'auto';
        a.volume = 0;
        a._target = vol;
        return a;
      };
      this.song = mk('./audio/song.mp3', false, 0.8);
      this.night = mk('./audio/night.mp3', true, 0.22);
      this.sob = mk('./audio/sob.mp3', true, 0.0);
      this.song.addEventListener('error', () => { this.song = null; });
      this.night.addEventListener('error', () => { this.night = null; });
      this.sob.addEventListener('error', () => { this.sob = null; });
      await this.unlock();
      // gentle fade-in
      this.fadeTo(this.song, 0.8, 5);
      this.fadeTo(this.night, 0.22, 6);
      this.ok = true;
      return true;
    } catch (e) {
      console.warn('audio unavailable, continuing silent', e);
      return false;
    }
  }

  async unlock() {
    const ps = [];
    for (const a of [this.song, this.night, this.sob]) {
      if (a) ps.push(a.play().catch(() => {}));
    }
    await Promise.all(ps);
  }

  fadeTo(el, vol, sec) {
    if (!el) return;
    el._target = vol;
    const step = () => {
      if (!el) return;
      const d = vol - el.volume;
      if (Math.abs(d) < 0.01) { el.volume = vol; return; }
      el.volume = Math.max(0, Math.min(1, el.volume + (d * 0.08)));
      setTimeout(step, (sec * 1000) / 60);
    };
    step();
  }

  setSob(level) {
    this.sobLevel = level;
    if (!this.sob || !this.ok) return;
    // sobs sit quietly beneath the music
    const target = level * 0.5;
    if (Math.abs(this.sob.volume - target) > 0.02) this.fadeTo(this.sob, target, 1.5);
  }

  finish() {
    this.fadeTo(this.song, 0.0, 6);
    this.fadeTo(this.sob, 0.0, 4);
    this.fadeTo(this.night, 0.05, 8);
  }

  reset() {
    for (const a of [this.song, this.night, this.sob]) {
      if (a) { try { a.pause(); a.currentTime = 0; a.volume = 0; } catch {} }
    }
    this.ok = false;
    this.sobLevel = 0;
  }

  setMuted(m) {
    this.muted = m;
    for (const a of [this.song, this.night, this.sob]) {
      if (a) a.muted = m;
    }
  }
}
