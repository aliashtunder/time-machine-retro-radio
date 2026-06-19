# 📻 Retro Radio Time Machine

**Tune the dial. Travel through time. Feel the bass.**

A fully immersive single-page website that looks and feels like a physical 1990s boombox — built with 2026 web technology.

![Retro Radio Time Machine](public/favicon.svg)

## Concept: 1999 Radio vs 2026 Web Tech

| 1999 Reality | 2026 Implementation |
|---|---|
| Analog tuning dial | Pointer/touch drag + keyboard on CSS-transform knobs |
| Orange LED frequency display | CSS `text-shadow` glow + `aria-live` regions |
| Cassette reels spinning | CSS `@keyframes` synced to power state |
| Static between stations | Web Audio API white noise with bandpass filter |
| Speaker bass thump | `AnalyserNode` driving CSS `scale()` transforms |
| Preset buttons | Instant frequency jump with click SFX |
| Voice memo on cassette | `MediaRecorder` API + playback |
| Battery slowly dying | Easter-egg CSS meter drain |
| Hidden "Future FM" station | Modal AI music recommender at 107.3 MHz |

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview production build
```

Deploy `dist/` to **Vercel** or **Netlify** — zero config needed.

## Folder Structure

```
retro-radio-time-machine/
├── index.html              # Semantic boombox markup + ARIA
├── vite.config.js          # Vite + Tailwind v4 plugin
├── vercel.json             # Deploy config
├── public/
│   └── favicon.svg
├── src/
│   ├── main.js             # Entry point, audio unlock
│   ├── style.css           # Tailwind + retro custom CSS
│   └── js/
│       ├── stations.js     # Station data, signal math
│       ├── knobs.js        # Drag/keyboard knob controller
│       ├── audio-engine.js # Web Audio API procedural stations
│       └── radio.js        # Main UI controller
└── README.md
```

## Features

- **Interactive tuning dial** — drag, scroll, or arrow keys (88.0–108.5 FM)
- **6 preset buttons** — jump to Pop, Rock, Hip-Hop, Talk, News, Future FM
- **Volume knob** — real gain control via Web Audio API
- **Power button** — click sound + visual on/off state
- **LED display** — frequency + station name with glow effects
- **Signal strength meter** — reacts to tuning accuracy
- **Static noise** — increases between stations
- **Cassette deck** — spinning reels when powered on
- **Record button** — capture a voice memo, click cassette to replay
- **Speaker vibration** — bass-synced grill animation
- **Extendable antenna** — click to extend (pure flair)
- **Battery easter egg** — slowly drains while powered
- **Future FM 2026** — secret AI recommender at 107.3 MHz
- **Accessibility** — ARIA sliders, keyboard control, reduced motion support

## Tailwind Config Notes

This project uses **Tailwind CSS v4** with the Vite plugin — no separate `tailwind.config.js` required. Design tokens live in `@theme` inside `src/style.css`:

```css
@theme {
  --color-retro-black: #1a1410;
  --color-retro-orange: #ff6b2b;
  --color-retro-amber: #ff9f1c;
  --color-led-glow: #ff4500;
  --font-display: "Courier New", Courier, monospace;
}
```

Key custom CSS (not Tailwind utilities) handles the 3D boombox look:

- Multi-layer `box-shadow` bevels on knobs and buttons
- `linear-gradient` + `radial-gradient` for metal/wood/chrome
- `@keyframes reel-spin` for cassette animation
- `repeating-radial-gradient` for speaker grill texture
- Custom retro cursor via inline SVG data URI

## JavaScript Architecture

```
main.js
  └── RetroRadio (radio.js)
        ├── Knob × 2 (knobs.js) — tuning + volume
        ├── AudioEngine (audio-engine.js)
        │     ├── Static noise (BufferSource loop)
        │     ├── Procedural station profiles (oscillators)
        │     ├── AnalyserNode → speaker vibration
        │     └── MediaRecorder → voice memo playback
        └── STATIONS (stations.js) — frequency map + signal math
```

### Station Frequencies

| Preset | Freq | Station | Audio Profile |
|--------|------|---------|---------------|
| — | 88.3 | Static | White noise |
| 1 | 91.7 | 90s Pop Hits | Square-wave arpeggios |
| 2 | 95.1 | Classic Rock | Distorted sawtooth riff |
| 3 | 98.7 | Hip-Hop / Rap | Kick + hi-hat pattern |
| 4 | 101.5 | Talk Radio | Filtered wobble |
| 5 | 104.9 | Weather / News | Sine beeps + ticker quotes |
| 6 | 107.3 | Future FM 2026 | Ambient delay + AI modal |

## Recommended Free Audio Assets

Replace procedural audio with real clips for production polish:

### Music & Loops
- [Free Music Archive](https://freemusicarchive.org/) — CC-licensed 90s-style tracks
- [Incompetech (Kevin MacLeod)](https://incompetech.com/) — Royalty-free genre packs
- [Pixabay Music](https://pixabay.com/music/) — Free loops, no attribution required
- [OpenGameArt.org](https://opengameart.org/) — Retro/chiptune loops

### SFX
- [Freesound.org](https://freesound.org/) — Search: "radio static", "button click", "tape hiss"
- [Mixkit.co/free-sound-effects](https://mixkit.co/free-sound-effects/) — UI clicks, static

### Textures & Images
- [Transparent Textures](https://www.transparenttextures.com/) — Wood, metal, fabric
- [Unsplash](https://unsplash.com/s/photos/boombox) — Reference photography
- [Poly Haven](https://polyhaven.com/textures) — PBR wood/metal (for future 3D upgrades)

### Sample Search Terms
- `"90s pop loop royalty free"`
- `"boombox radio static noise"`
- `"cassette tape button click"`
- `"vinyl crackle loop"`

Place optimized `.mp3`/`.ogg` files in `public/audio/` and update `audio-engine.js` to load them via `fetch` + `decodeAudioData`.

## Browser Support

- Chrome 90+, Firefox 88+, Safari 15+, Edge 90+
- Requires user gesture to start `AudioContext` (handled automatically)
- Microphone recording requires HTTPS (or localhost)

## License

MIT — go wild with the nostalgia.

---

*Built with maximum 1990s boombox energy. Powered by 2026 web skills.*
