/* global accountForms */
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('administrativeUserForm');
  if (!form) return;
  const message = document.getElementById('pageMessage');
  const button = document.getElementById('submitButton');
  const password = document.getElementById('password');
  const allowedRoles = new Set(['TRAINING_ADMINISTRATOR', 'TRAINER']);
  const show = (text, ok = false) => accountForms.showMessage(message, text, ok);
  const validatePassword = accountForms.bindPasswordPolicy(password);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    message.className = 'alert d-none'; message.textContent = '';
    validatePassword(); form.classList.add('was-validated');
    const role = document.getElementById('role').value;
    if (!form.checkValidity() || !allowedRoles.has(role)) return;
    const token = document.querySelector('meta[name="csrf-token"]')?.content;
    if (!token) { show('Your session is unavailable. Please log in again.'); return; }
    const body = { username: document.getElementById('username').value.trim(), name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(), password: password.value, role };
    button.disabled = true;
    try {
      const response = await fetch('/api/v1/admin/users', { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json', 'X-CSRF-Token': token }, body: JSON.stringify(body) });
      password.value = ''; password.setCustomValidity('');
      if (response.status === 201) {
        form.reset(); form.classList.remove('was-validated');
        show('Administrative user account created successfully.', true); return;
      }
      const messages = { 400: 'Please correct the account information and try again.',
        401: 'Your session has expired. Please log in again.', 403: 'You are not authorized to perform this action.',
        409: 'The supplied unique account information is already in use.' };
      show(messages[response.status] || 'Unable to create the administrative user account. Please try again.');
    } catch {
      password.value = ''; password.setCustomValidity(''); show('Unable to connect to the service. Please try again.');
    } finally { button.disabled = false; }
  });
});
