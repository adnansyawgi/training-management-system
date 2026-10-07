/* global accountForms */
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('systemAdminBootstrapForm');
  if (!form) return;
  const message = document.getElementById('pageMessage');
  const button = document.getElementById('submitButton');
  const key = document.getElementById('staticAdministrationKey');
  const password = document.getElementById('password');
  const show = (text, ok = false) => accountForms.showMessage(message, text, ok);
  const validatePassword = accountForms.bindPasswordPolicy(password);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    message.className = 'alert d-none';
    message.textContent = '';
    validatePassword();
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;
    const body = { staticAdministrationKey: key.value, username: document.getElementById('username').value.trim(),
      name: document.getElementById('name').value.trim(), email: document.getElementById('email').value.trim(), password: password.value };
    button.disabled = true;
    try {
      const response = await fetch('/api/v1/auth/system-admin/bootstrap', { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' }, body: JSON.stringify(body) });
      key.value = ''; password.value = ''; password.setCustomValidity('');
      if (response.status === 201) {
        form.reset(); form.classList.remove('was-validated');
        show('System Administrator created successfully.', true);
        window.location.assign(document.body.dataset.adminLoginUrl);
        return;
      }
      const messages = { 400: 'Please correct the account information and try again.',
        401: 'A valid static administration key is required.',
        409: 'Bootstrap cannot be completed because an active administrator or conflicting account information exists.' };
      show(messages[response.status] || 'Unable to create the System Administrator. Please try again.');
    } catch {
      key.value = ''; password.value = ''; password.setCustomValidity('');
      show('Unable to connect to the service. Please try again.');
    } finally { button.disabled = false; }
  });
});
