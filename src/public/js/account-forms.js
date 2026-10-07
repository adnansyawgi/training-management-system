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
  return { showMessage, bindPasswordPolicy };
})();
