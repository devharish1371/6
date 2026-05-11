/**
 * Landing Page — flower animation + enter button
 */
const LandingPage = (() => {
  function init() {
    const btn = document.getElementById('btn-enter');
    const img = document.getElementById('flower-img');

    // Graceful fallback if no flower image yet
    img.onerror = () => {
      img.style.display = 'none';
      const frame = document.querySelector('.flower-frame');
      frame.innerHTML = `
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
          background:linear-gradient(135deg,#3D2545,#2D1B33);border-radius:20px;
          border:2px solid rgba(212,163,115,0.15);font-size:5rem;">🌸</div>
        <div class="flower-glow"></div>`;
    };

    btn.addEventListener('click', handleEnter);
  }

  function handleEnter() {
    const btn = document.getElementById('btn-enter');
    // Pop animation
    btn.style.transform = 'scale(1.3)';
    btn.style.opacity = '0.6';
    setTimeout(() => {
      App.navigateTo('loading');
      // After loading animation, go to profiles
      setTimeout(() => {
        App.navigateTo('profiles');
      }, 2800);
    }, 300);
  }

  return { init };
})();
