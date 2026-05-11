/**
 * Profiles Page — Netflix-style chapter select
 */
const ProfilesPage = (() => {
  function init() {
    const cards = document.querySelectorAll('.profile-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const profile = card.getAttribute('data-profile');
        handleProfileClick(card, profile);
      });
    });
  }

  function handleProfileClick(card, profile) {
    // Zoom-in effect on the clicked card
    const avatar = card.querySelector('.profile-avatar');
    avatar.style.transform = 'scale(1.2)';
    avatar.style.boxShadow = '0 0 40px rgba(212,163,115,0.4)';

    setTimeout(() => {
      avatar.style.transform = '';
      avatar.style.boxShadow = '';

      if (profile === 'game') {
        App.navigateTo('game', { showQuote: true });
      } else {
        CarouselPage.loadPeriod(profile);
        App.navigateTo('carousel', { showQuote: true });
      }
    }, 400);
  }

  return { init };
})();
