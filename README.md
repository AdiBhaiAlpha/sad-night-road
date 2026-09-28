# Sad Night Road — a photorealistic cinematic short film

> "A lonely person walking down an empty road at midnight, sitting beneath an
> enormous banyan tree, covering his face and quietly crying while the street
> lights flicker around him."

A fullscreen ~90-second film built with Vite + vanilla JS. **All visuals are
real photographic footage and photographs** (no SVG/CSS-drawn humans, trees, or
roads), unified by a cold night grade, film grain, vignette, and letterbox.
**All audio is licensed royalty-free recordings** downloaded locally — no
synthesized music or voices.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview  # preview production build
```

Deploy `dist/` to any static host. Media lives in `public/` (16 MB total:
5 clips + 1 photo + 5 posters + 3 audio files) and is copied to `dist/`
verbatim.

## The film (shot list)

| Time | Shot | Source |
|------|------|--------|
| 0–10s | Empty night road, streetlights, slow push-in | Pexels video 30275280 |
| 8–22s | Distant figure walking foggy lamp-lit street | Pexels video 11792112 |
| 20–30s | Back-view silhouette follow in lamp haze | Pexels video 12096160 |
| 28–40s | The old banyan tree at night (slow zoom) | Unsplash photo, Fairy Trees |
| 38–62s | Man sits alone at night, head bowed | Pexels video 34660194 |
| 60–70s | Crying close-up insert, graded dark | Pexels video 4588487 |
| 68–80s | Sitting shot holds, slow pull-back | (same sitting clip) |
| 78–88s | Banyan wide, pull away, fade to black | (same tree photo) |
| 45–68s | Street-light flicker: full-frame electrical exposure simulation (instability → dimming → partial blackout → recovery glow) — the whole environment reacts | procedural overlay |
| end | "Some roads are walked alone." → "—" → Replay + `@the.dev.adi` | — |

Shots cross-dissolve (2.2s), each with slow Ken Burns movement. Faces stay
hidden in darkness except the brief crying insert.

Audio: "For When It Rains" (Juan Sánchez — sad piano + soprano vocal),
real male sobbing looped quietly beneath (Ribhav Agrawal), countryside night
ambience loop (Alex Jauk). Fades in on entry, out at the end. `M` mutes,
`R` replays, `Enter`/`Space`/tap enters. Minimal `♪` toggle; `↺ Replay`
appears only after the ending.

## Tech

- `src/main.js` — intro gate (autoplay policy), HUD, replay, error handling
- `src/film.js` — shot timeline, dissolves, Ken Burns, exposure-flicker
  engine, grain, captions, ending; failed videos are skipped automatically
- `src/audio.js` — HTMLAudio mixer (song / ambience loop / sob loop)
- `src/style.css` — unifying cold grade, vignette, grain, letterbox, mobile framing
- No frameworks. Videos are H.264 720p `faststart`; audio MP3. Grain canvas
  is 160×90 @ ~8fps; `rAF` idles when tab hidden; `prefers-reduced-motion`
  disables camera moves and flicker.

## Asset licenses & attribution

All external assets were downloaded into `public/` — nothing is hotlinked.
Do not redistribute the raw files standalone; they are used as incorporated
into this film per their licenses.

Video (Pexels License — free to use, no attribution required):
- Empty road at night with streetlights — Pexels video 30275280
- Man walking on foggy night street — Pexels video 11792112
- Back view of walking man — Pexels video 12096160
- Lonely man sitting alone at night — Pexels video 34660194
- Close-up of a man crying — Pexels video 4588487
- https://www.pexels.com/license/

Photo (Unsplash License — free to use, no permission needed):
- "A large tree is lit up at night" (banyan, Brisbane) by Fairy Trees —
  https://unsplash.com/photos/a-large-tree-is-lit-up-at-night-mrklEtyhjqU
- https://unsplash.com/license

Audio (Pixabay Content License — free to use):
- "For When It Rains" by Juan Sánchez (sad piano + soprano vocal) —
  https://pixabay.com/music/modern-classical-for-when-it-rains-112785/
- "A Man Sobbing Type 1" (recorded by Ribhav Agrawal) —
  https://pixabay.com/sound-effects/people-a-man-sobbing-type-1-265495/
- "Countryside Night Ambience" (recorded by Alex Jauk) —
  https://pixabay.com/sound-effects/nature-countryside-night-ambience-234022/
- https://pixabay.com/service/license-summary/

Film grain is generated procedurally at runtime (no asset).

Credit shown discreetly at the end: `@the.dev.adi`.
