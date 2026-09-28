import './style.css';
import { Film } from './film.js';
import { CinematicAudio } from './audio.js';

const intro = document.getElementById('intro');
const soundBtn = document.getElementById('soundBtn');
const replayBtn = document.getElementById('replayBtn');
const stage = document.getElementById('stage');

const audio = new CinematicAudio();
const film = new Film(audio);
film.mount();

let entered = false;

async function enter() {
  if (entered) return;
  entered = true;
  intro.classList.add('gone');
  intro.setAttribute('aria-hidden', 'true');
  film.start();
  const ok = await audio.init();
  if (!ok) showSoundPill();
  soundBtn.focus({ preventScroll: true });
}

function showSoundPill() {
  if (document.getElementById('sound-pill')) return;
  const b = document.createElement('button');
  b.id = 'sound-pill';
  b.textContent = 'tap for sound';
  b.setAttribute('aria-label', 'Enable sound');
  b.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (await audio.init()) b.remove();
  });
  stage.appendChild(b);
  setTimeout(() => { if (b.isConnected) b.remove(); }, 9000);
}

intro.addEventListener('click', enter);
intro.addEventListener('touchend', (e) => { e.preventDefault(); enter(); }, { passive: false });
intro.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); }
});
stage.addEventListener('click', () => { if (!entered) enter(); });

window.addEventListener('keydown', (e) => {
  if (!entered && (e.key === 'Enter' || e.key === ' ')) enter();
  if (e.key.toLowerCase() === 'm') toggleMute();
  if (e.key.toLowerCase() === 'r' && !replayBtn.hidden) doReplay();
});

function toggleMute() {
  const m = !audio.muted;
  audio.setMuted(m);
  soundBtn.classList.toggle('off', m);
  soundBtn.setAttribute('aria-label', m ? 'Unmute sound' : 'Mute sound');
}
soundBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMute(); });

async function doReplay() {
  film.start(); // reset() + play from 0
  await audio.init(); // restarts song/ambience/sobs from top
  if (audio.muted) audio.setMuted(true);
  replayBtn.hidden = true;
}
replayBtn.addEventListener('click', (e) => { e.stopPropagation(); doReplay(); });

window.addEventListener('unhandledrejection', (e) => {
  console.warn('suppressed rejection', e.reason);
});
