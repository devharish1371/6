/**
 * App Controller — routing, transitions, particles, music, secret word
 */
const App = (() => {
  let currentPage = 'landing';
  let typedBuffer = '';
  let audio = null;
  let particlesCtx = null;
  let particles = [];

  function init() {
    initParticles();
    initMusic();
    initSecretWord();
    initLoveTimer();
    LandingPage.init();
    ProfilesPage.init();
    CarouselPage.init();
    GameEngine.init();
  }

  /* ── Page Navigation ── */
  function navigateTo(pageId, opts = {}) {
    if (pageId === currentPage) return;
    const from = document.getElementById('page-' + currentPage);
    const to = document.getElementById('page-' + pageId);
    if (!from || !to) return;

    if (opts.showQuote && SITE_CONFIG.quotes.length) {
      showQuote(() => { doTransition(from, to, pageId); });
    } else {
      doTransition(from, to, pageId);
    }
  }

  function doTransition(from, to, pageId) {
    from.classList.remove('active');
    setTimeout(() => {
      to.classList.add('active');
      currentPage = pageId;
    }, 400);
  }

  function showQuote(cb) {
    const overlay = document.getElementById('quote-overlay');
    const text = document.getElementById('quote-text');
    const q = SITE_CONFIG.quotes[Math.floor(Math.random() * SITE_CONFIG.quotes.length)];
    text.textContent = `"${q}"`;
    overlay.classList.remove('hidden');
    overlay.style.opacity = '1';
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.classList.add('hidden'); cb(); }, 600);
    }, 1800);
  }

  /* ── Particles ── */
  function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    particlesCtx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 40; i++) {
      particles.push(createParticle(canvas.width, canvas.height));
    }
    animateParticles();
  }

  function resize() {
    const c = document.getElementById('particles-canvas');
    c.width = window.innerWidth;
    c.height = window.innerHeight;
  }

  function createParticle(w, h) {
    return {
      x: Math.random() * w, y: Math.random() * h,
      size: Math.random() * 2.5 + 0.5,
      speedY: -(Math.random() * 0.3 + 0.1),
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.4 + 0.1,
      hue: Math.random() > 0.5 ? '42, 72%' : '24, 56%'
    };
  }

  function animateParticles() {
    const c = document.getElementById('particles-canvas');
    particlesCtx.clearRect(0, 0, c.width, c.height);
    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      if (p.y < -10) { p.y = c.height + 10; p.x = Math.random() * c.width; }
      particlesCtx.beginPath();
      particlesCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      particlesCtx.fillStyle = `hsla(${p.hue}, ${p.opacity * 100}%)`;
      particlesCtx.fill();
    });
    requestAnimationFrame(animateParticles);
  }

  /* ── Music ── */
  function initMusic() {
    audio = new Audio(SITE_CONFIG.musicFile);
    audio.loop = true;
    audio.volume = 0.3;
    const btn = document.getElementById('music-toggle');
    const status = btn.querySelector('.music-status');
    btn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().then(() => {
          btn.classList.add('playing');
          status.textContent = 'ON';
        }).catch(() => {});
      } else {
        audio.pause();
        btn.classList.remove('playing');
        status.textContent = 'OFF';
      }
    });
  }

  /* ── Secret Word ── */
  function initSecretWord() {
    const word = SITE_CONFIG.secretWord.toLowerCase().replace(/\s/g, '');
    document.addEventListener('keypress', (e) => {
      typedBuffer += e.key.toLowerCase();
      if (typedBuffer.length > word.length * 2) {
        typedBuffer = typedBuffer.slice(-word.length * 2);
      }
      if (typedBuffer.includes(word)) {
        typedBuffer = '';
        showLoveLetter();
      }
    });
  }

  function showLoveLetter() {
    const overlay = document.getElementById('love-letter-overlay');
    const body = document.getElementById('letter-body');
    body.textContent = SITE_CONFIG.loveLetter;
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.style.opacity = '1', 10);
    document.getElementById('btn-letter-close').onclick = () => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.classList.add('hidden'), 500);
    };
  }

  /* ── Love Timer ── */
  function initLoveTimer() {
    const el = document.getElementById('love-timer');
    const start = new Date(SITE_CONFIG.startDate + 'T00:00:00');
    function update() {
      const now = new Date();
      let diff = now - start;
      const days = Math.floor(diff / 86400000);
      diff %= 86400000;
      const hrs = Math.floor(diff / 3600000);
      diff %= 3600000;
      const mins = Math.floor(diff / 60000);
      const months = Math.floor(days / 30);
      const remDays = days % 30;
      el.textContent = `${months} months, ${remDays} days, ${hrs} hrs, ${mins} mins of us ♥`;
    }
    update();
    setInterval(update, 60000);
  }

  return { init, navigateTo };
})();

document.addEventListener('DOMContentLoaded', App.init);
