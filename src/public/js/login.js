(function () {
  'use strict';
  const endpoints = { participant: '/api/v1/auth/participants/login', staff: '/api/v1/auth/staff/login', 'system-admin': '/api/v1/auth/system-admin/login' };
  const destinations = { PARTICIPANT: '/participant/dashboard', TRAINER: '/staff/dashboard', TRAINING_ADMINISTRATOR: '/staff/dashboard', SYSTEM_ADMINISTRATOR: '/system-admin/dashboard' };
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    if (!form) return;
    const button = document.getElementById('loginButton'), password = document.getElementById('password'), message = document.getElementById('pageMessage');
    function show(text) { message.className = 'alert alert-danger'; message.textContent = text; message.focus(); }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled) return;
      form.classList.add('was-validated');
      if (!form.checkValidity()) { show('Check the email and password fields.'); form.querySelector(':invalid')?.focus(); return; }
      const accountType = document.getElementById('accountType').value;
      const endpoint = Object.hasOwn(endpoints, accountType) ? endpoints[accountType] : null;
      if (!endpoint) { show('Select a valid Account Type.'); return; }
      button.disabled = true;
      try {
        const response = await fetch(endpoint, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email: document.getElementById('email').value.trim(), password: password.value }) });
        password.value = '';
        if (response.status === 200) {
          const data = await response.json();
          const destination = Object.hasOwn(destinations, data?.role) ? destinations[data.role] : null;
          if (!destination || data.status !== 'ACTIVE') { show('Unable to authenticate. Please try again.'); return; }
          window.location.assign(destination);
          return;
        }
        show(({400:'Check the email and password fields.',401:'Invalid email or password.',423:'The account is locked or disabled.'})[response.status] || 'Unable to authenticate. Please try again.');
      } catch { password.value = ''; show('Unable to connect to the service. Please try again.'); }
      finally { button.disabled = false; }
    });
  });
})();
