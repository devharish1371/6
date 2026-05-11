/**
 * Carousel Page — photo slideshow with captions
 */
const CarouselPage = (() => {
  let currentSlide = 0;
  let slides = [];
  let touchStartX = 0;

  function init() {
    document.getElementById('carousel-back').addEventListener('click', () => {
      App.navigateTo('profiles');
    });
    document.getElementById('carousel-prev').addEventListener('click', () => goTo(currentSlide - 1));
    document.getElementById('carousel-next').addEventListener('click', () => goTo(currentSlide + 1));

    // Keyboard nav
    document.addEventListener('keydown', (e) => {
      const page = document.getElementById('page-carousel');
      if (!page.classList.contains('active')) return;
      if (e.key === 'ArrowLeft') goTo(currentSlide - 1);
      if (e.key === 'ArrowRight') goTo(currentSlide + 1);
    });

    // Touch/swipe support
    const viewport = document.querySelector('.carousel-viewport');
    viewport.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    viewport.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? goTo(currentSlide + 1) : goTo(currentSlide - 1);
      }
    }, { passive: true });
  }

  function loadPeriod(periodKey) {
    const period = SITE_CONFIG.periods[periodKey];
    if (!period) return;

    currentSlide = 0;
    slides = period.slides || [];

    document.getElementById('carousel-title').textContent = period.title;
    document.getElementById('carousel-subtitle').textContent = period.subtitle;

    const track = document.getElementById('carousel-track');
    track.innerHTML = '';

    if (slides.length === 0) {
      // No images yet — show placeholder
      slides = [{ image: '', caption: 'Add your photos in js/config.js to see them here ♥' }];
    }

    slides.forEach((slide, i) => {
      const div = document.createElement('div');
      div.className = 'carousel-slide';
      if (slide.image) {
        const img = document.createElement('img');
        img.src = slide.image;
        img.alt = slide.caption || `Photo ${i + 1}`;
        img.loading = 'lazy';
        img.onerror = () => {
          div.innerHTML = `<div class="placeholder-slide">
            <span class="placeholder-icon">📷</span>
            <span>Image not found</span></div>`;
        };
        div.appendChild(img);
      } else {
        div.innerHTML = `<div class="placeholder-slide">
          <span class="placeholder-icon">📸</span>
          <span>${slide.caption || 'Add photos in config.js'}</span></div>`;
      }
      track.appendChild(div);
    });

    buildDots();
    goTo(0);
  }

  function buildDots() {
    const dotsEl = document.getElementById('carousel-dots');
    dotsEl.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    });
  }

  function goTo(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentSlide = index;

    const track = document.getElementById('carousel-track');
    track.style.transform = `translateX(-${index * 100}%)`;
    // Premium feel: update active slide class for subtle zoom/parallax.
    document.querySelectorAll('.carousel-slide').forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });

    // Update caption
    const caption = document.getElementById('carousel-caption');
    caption.style.opacity = '0';
    setTimeout(() => {
      caption.textContent = slides[index].caption || '';
      caption.style.opacity = '1';
    }, 300);

    // Update dots
    document.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });

    // Update counter
    document.getElementById('carousel-counter').textContent =
      `${index + 1} / ${slides.length}`;
  }

  return { init, loadPeriod };
})();
