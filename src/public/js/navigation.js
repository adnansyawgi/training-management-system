(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    // Bootstrap owns collapse when loaded; retain keyboard access if CDN loading fails.
    if (window.bootstrap?.Collapse) return;
    const toggle = document.querySelector('[data-bs-target="#applicationNavigation"]');
    const panel = document.getElementById('applicationNavigation');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(expanded)); panel.classList.toggle('show', expanded);
    });
  });
})();
