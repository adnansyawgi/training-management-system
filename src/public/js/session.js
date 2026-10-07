(function () {
  'use strict';
  const fetchOriginal = window.fetch.bind(window);
  let expired = false, loggingOut = false;
  function showExpired() {
    if (expired) return;
    expired = true;
    const modal = document.getElementById('sessionExpiredModal');
    if (!modal) { window.location.assign('/'); return; }
    for (const child of document.body.children) { if (child !== modal && child.tagName !== 'SCRIPT') child.inert = true; }
    modal.hidden = false; modal.classList.add('show'); modal.style.display = 'block';
    document.body.classList.add('modal-open');
    const backdrop = document.createElement('div'); backdrop.className = 'modal-backdrop show'; document.body.append(backdrop);
    document.getElementById('expiredSessionLogout').focus();
  }
  window.fetch = async function (resource, options) {
    const url = new URL(typeof resource === 'string' ? resource : resource.url, window.location.href);
    if (expired && url.pathname !== '/api/v1/auth/logout' && url.origin === window.location.origin) throw new Error('Session expired.');
    const response = await fetchOriginal(resource, options);
    if (response.status === 401 && url.origin === window.location.origin && url.pathname.startsWith('/api/v1/')) showExpired();
    return response;
  };
  async function logout(button) {
    if (loggingOut) return;
    loggingOut = true; button.disabled = true;
    try {
      const response = await fetchOriginal('/api/v1/auth/logout', { method:'POST', credentials:'same-origin', headers:{Accept:'application/json','X-CSRF-Token':document.querySelector('meta[name="csrf-token"]')?.content || ''} });
      if (response.status === 204 || response.status === 401) { window.location.assign('/'); return; }
      throw new Error('Logout failed.');
    } catch {
      const message = expired ? document.getElementById('sessionRecoveryMessage') : document.getElementById('sessionMessage');
      if (message) { message.classList.remove('d-none'); message.textContent = 'Unable to log out. Please try again.'; message.focus(); }
    } finally { loggingOut = false; button.disabled = false; }
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-logout]').forEach(button => button.addEventListener('click', () => logout(button)));
    document.addEventListener('keydown', event => {
      if (!expired) return;
      if (event.key === 'Tab' || event.key === 'Escape') { event.preventDefault(); document.getElementById('expiredSessionLogout').focus(); }
    });
    document.addEventListener('focusin', event => {
      if (expired && !document.getElementById('sessionExpiredModal').contains(event.target)) document.getElementById('expiredSessionLogout').focus();
    });
    if (document.querySelector('[data-session-expired]')) showExpired();
  });
})();
