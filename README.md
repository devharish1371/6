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

Repository: [github.com/devharish1371/6](https://github.com/devharish1371/6)

1. In the repo on GitHub: **Settings** → **Pages**
2. **Build and deployment** → **Source**: *Deploy from a branch*
3. **Branch**: `main`, folder **`/ (root)`** → Save
4. After a minute or two, the site is live at  
   **https://devharish1371.github.io/6/**

If Pages does not appear, confirm the repo is **public** (or GitHub Pro for private Pages).

A `.nojekyll` file is included so GitHub does not run Jekyll on your static files.

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
