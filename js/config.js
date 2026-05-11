/**
 * ♥ D & V — Anniversary Site Configuration ♥
 *
 * HOW TO ADD PHOTOS:
 * 1. Place photos in the matching folder (assets/images/1_month/, etc.)
 * 2. Add entries to the 'slides' array below
 * 3. Each slide: { image: 'assets/images/1_month/photo1.jpg', caption: 'Your caption' }
 */

const SITE_CONFIG = {
  // ── Names ──────────────────────────────────────
  names: {
    him: 'Dev',
    her: 'Kanmani',
    initials: { him: 'D', her: 'V' }
  },

  // ── Important Dates ────────────────────────────
  startDate: '2025-11-12',

  // ── Secret Word (type anywhere to reveal love letter) ──
  secretWord: 'pompom',

  // ── Love Letter ────────────────────────────────
  loveLetter: `Dear Kanmani,

Every moment with you feels like a beautiful dream I never want to wake up from.

From the very first flower to this very second, you've painted my world in colors I didn't know existed. Six months ago, I found not just love — I found home.

Thank you for being my calm in every storm, my smile in every silence, and my favorite hello.

Here's to six months of us, and to a lifetime of forevers.

With all my love,
Dev ♥`,

  // ── Background Music ──────────────────────────
  // Place your MP3 as: assets/audio/song.mp3
  musicFile: 'assets/audio/game_music.mp3',

  // ── Photo Carousels ───────────────────────────
  periods: {
    '1_month': {
      title: '1 Month',
      subtitle: 'The Beginning of Us',
      icon: '🌙',
      slides: [
        { image: 'assets/images/1_month/Photo Nov 9 2025.jpg', caption: 'The day i laid my eyes on the most beautiful woman ever' },
        { image: 'assets/images/1_month/Photo Nov 14 2025.jpg', caption: 'The day i found more beauty in her smile' },
        { image: 'assets/images/1_month/Photo Nov 23 2025.jpg', caption: 'First selfie together' },
        { image: 'assets/images/1_month/Photo Nov 24 2025.jpg', caption: 'The day the batman in me finally slept' },
        { image: 'assets/images/1_month/Photo Dec 6 2025.jpg', caption: 'Hardest and most reassuring day' },
        { image: 'assets/images/1_month/IMG_20251223_203135019.jpg', caption: 'A Date to cherish' },
        { image: 'assets/images/1_month/JPEG image.jpeg', caption: 'And love was that easy' },
        { image: 'assets/images/1_month/Photo Jan 7 2026.jpg', caption: 'Love when she drives' },
      ]
    },
    '3_month': {
      title: '3 Months',
      subtitle: 'Growing Stronger Together',
      icon: '🌿',
      slides: [
        { image: 'assets/images/3_month/Photo Jan 12 2026.jpg', caption: 'Me and her core' },
        { image: 'assets/images/3_month/IMG Jan 18 2026.jpg', caption: 'Whos cuter? ofc u baby' },
        { image: 'assets/images/3_month/Photo Jan 18 2026.jpg', caption: 'Story of my life before her' },
        { image: 'assets/images/3_month/Photo Jan 30 2026.jpg', caption: 'Then she came' },
        { image: 'assets/images/3_month/Photo Jan 30 2026 copy.jpg', caption: 'And it was beautiful' },
        { image: 'assets/images/3_month/IMG_20260207_152015881.jpg', caption: 'Look at this cutie' },
        { image: 'assets/images/3_month/Photo Feb 08 2026.jpg', caption: 'Look at us' },
        { image: 'assets/images/3_month/Photo Feb 23 2026.jpg', caption: 'How can i not fall?' },
      ]
    },
    '6_month': {
      title: '6 Months',
      subtitle: 'Half a Year of Love',
      icon: '💎',
      slides: [
        { image: 'assets/images/6_month/IMG Mar 21 2026.jpg', caption: 'My trying my best to pull her' },
        { image: 'assets/images/6_month/Photo Mar 22 2026.jpg', caption: 'She tried to pull me' },
        { image: 'assets/images/6_month/Photo Mar 29 2026.jpg', caption: 'Well the day she got me flowers!' },
        { image: 'assets/images/6_month/Photo Apr 13 2026.jpg', caption: 'She fkn got me my action figure' },
        { image: 'assets/images/6_month/Photo Apr 14 2026 (1).jpg', caption: 'Life is beautiful in every moment with her' },
        { image: 'assets/images/6_month/Photo Apr 14 2026 (1) copy.jpg', caption: 'My life was never the same' },
        { image: 'assets/images/6_month/Photo Apr 14 2026 (1) copy 2.jpg', caption: 'And we ll never be alone' },
        { image: 'assets/images/6_month/IMG 2026 Apr 18 5 45 PM.jpg', caption: 'Happily ever after' },
      ]
    }
  },

  // ── Love Quotes (shown during page transitions) ──
  quotes: [
    "In all the world, there is no heart for me like yours.",
    "I love you not because of who you are, but because of who I am when I'm with you.",
    "You are my today and all of my tomorrows.",
    "Every love story is beautiful, but ours is my favorite.",
    "I found my home in you.",
    "You're the reason I believe in love.",
    "Together is a wonderful place to be.",
    "My heart is, and always will be, yours.",
    "You're my favorite notification.",
    "I choose you. And I'll choose you over and over."
  ]
};
