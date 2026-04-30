(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.prepend(progress);

  const header = document.querySelector('.site-header');

  function updateScrollUI() {
    const doc = document.documentElement;
    const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
    const ratio = Math.min(window.scrollY / max, 1);
    progress.style.transform = `scaleX(${ratio})`;
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  window.addEventListener('resize', updateScrollUI, { passive: true });

  if (prefersReducedMotion) return;

  const interactiveCards = document.querySelectorAll(
    '.glass-card, .impact-card, .challenge-card, .results-hero, .podium-card, .filters-panel, .table-card, .partners-hero, .partners-toolbar, .partner-card, .contact-hero, .contact-card, .challenge-hero, .challenge-info-card, .poster-section'
  );

  interactiveCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (window.innerWidth < 900) return;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rx = ((y / rect.height) - 0.5) * -4;
      const ry = ((x / rect.width) - 0.5) * 4;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  const magnetic = document.querySelectorAll('.primary-button, .secondary-button, .share-btn');
  magnetic.forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      if (window.innerWidth < 900) return;
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.22;
      button.style.transform = `translate(${x}px, ${y}px) translateY(-2px)`;
    });

    button.addEventListener('pointerleave', () => {
      button.style.transform = '';
    });
  });
})();
