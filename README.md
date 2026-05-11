# 💐 D ♥ V — 6 Month Anniversary

A handcrafted love story website.

## Quick Setup

### 1. Add Your Photos

| Folder | What goes here |
|--------|---------------|
| `assets/images/flower/` | The first flower photo (name it `flower.jpg`) |
| `assets/images/1_month/` | Photos from month 1 |
| `assets/images/3_month/` | Photos from month 3 |
| `assets/images/6_month/` | Photos from month 6 |
| `assets/images/faces/` | `dev.png` and `kanmani.png` (face crops for the game) |
| `assets/audio/` | Background music as `song.mp3` |

### 2. Add Captions

Edit `js/config.js` and add entries to each period's `slides` array:

```js
slides: [
  { image: 'assets/images/1_month/photo1.jpg', caption: 'Our first date ♥' },
  { image: 'assets/images/1_month/photo2.jpg', caption: 'That sunset walk' },
]
```

### 3. Run Locally

```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

### 4. Deploy to GitHub Pages

1. Push to a GitHub repository
2. Go to Settings → Pages → Source: main branch
3. Share the link with her 💌

## Easter Egg 🥚

Type **pompom** anywhere on the site to reveal a hidden love letter!

## Features

- 🌸 **Landing Page** — First flower with cinematic glow
- 🎬 **Netflix-style** profile select with loading animation
- 📸 **Photo Carousels** — Swipe through memories with captions
- 🎮 **Run To Forever** — Dino-style runner game (reach 25 pts to get married!)
- 💌 **Hidden Love Letter** — Secret word easter egg
- 🎵 **Background Music** — Toggle your song
- ⏰ **Love Timer** — Counting up since Nov 12, 2025
- ✨ **Floating Particles** — Gold dust atmosphere
