'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const page = document.querySelector('[data-workflow="WF-006"]');
  const form = document.getElementById('loginForm');
  if (!page || !form) return;
  const message = document.getElementById('pageMessage');
  const button = document.getElementById('loginButton');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const show = text => { message.className = 'alert alert-danger'; message.textContent = text; };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    message.className = 'alert d-none';
    message.textContent = '';
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;
    button.disabled = true;
    button.textContent = 'Logging in...';
    try {
      const response = await fetch('/api/v1/auth/staff/login', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), password: password.value })
      });
      password.value = '';
      if (response.status === 200) {
        const payload = await response.json();
        const target = { TRAINING_ADMINISTRATOR: page.dataset.trainingAdministratorUrl,
          TRAINER: page.dataset.trainerUrl }[payload.role];
        if (payload.status !== 'ACTIVE' || typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) {
          show('Unable to authenticate. Please try again.');
          return;
        }
        window.location.assign(target);
        return;
      }
      const messages = { 400: 'Please correct the login information and try again.',
        401: 'Invalid email or password.', 423: 'The account is locked or disabled.' };
      show(messages[response.status] || 'Unable to authenticate. Please try again.');
    } catch {
      password.value = '';
      show('Unable to connect to the service. Please try again.');
    } finally {
      button.disabled = false;
      button.textContent = 'Login';
    }
  });
});
