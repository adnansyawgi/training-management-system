'use strict';
const accountForms = (() => {
  function showMessage(message, text, ok = false) {
    message.textContent = text;
    message.className = `alert ${ok ? 'alert-success' : 'alert-danger'}`;
  }
  function bindPasswordPolicy(password) {
    const validate = () => {
      const value = password.value;
      const valid = value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z\d]/.test(value);
      password.setCustomValidity(valid ? '' : 'Password does not meet the required policy.');
    };
    password.addEventListener('input', validate);
    return validate;
  }
  function bindLogin({ selector, endpoint, destination }) {
    const page = document.querySelector(selector), form = document.getElementById('loginForm');
    if (!page || !form) { return; }
    const message = document.getElementById('pageMessage'), button = document.getElementById('loginButton');
    const email = document.getElementById('email'), password = document.getElementById('password');
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled) { return; }
      message.className = 'alert d-none'; message.textContent = '';
      form.classList.add('was-validated');
      if (!form.checkValidity()) { return; }
      button.disabled = true; button.textContent = 'Logging in...';
      try {
        const response = await fetch(endpoint, {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
          body: JSON.stringify({ email: email.value.trim(), password: password.value })
        });
        password.value = '';
        if (response.status === 200) {
          const target = await destination(page, response);
          if (target === null) { showMessage(message, 'Unable to authenticate. Please try again.'); return; }
          window.location.assign(target);
          return;
        }
        const messages = { 400: 'Please correct the login information and try again.',
          401: 'Invalid email or password.', 423: 'The account is locked or disabled.' };
        showMessage(message, messages[response.status] || 'Unable to authenticate. Please try again.');
      } catch {
        password.value = '';
        showMessage(message, 'Unable to connect to the service. Please try again.');
      } finally { button.disabled = false; button.textContent = 'Login'; }
    });
  }
  return { showMessage, bindPasswordPolicy, bindLogin };
})();
