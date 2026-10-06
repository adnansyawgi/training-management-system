'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('participantRegisterForm');
  if (!form) {
    return;
  }
  const nricPassportNo = document.getElementById('nricPassportNo');
  const name = document.getElementById('name');
  const email = document.getElementById('email');
  const mobileNo = document.getElementById('mobileNo');
  const password = document.getElementById('password');
  const message = document.getElementById('formMessage');
  const successActions = document.getElementById('successActions');
  const submitButton = document.getElementById('createAccountButton');
  const submitButtonText = document.getElementById('createAccountButtonText');
  const submitSpinner = document.getElementById('createAccountSpinner');
  const passwordFeedback = document.getElementById('passwordFeedback');
  const passwordPattern = {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    digit: /[0-9]/,
    nonAlphanumeric: /[^A-Za-z0-9]/
  };
  function setLoading(loading) {
    submitButton.disabled = loading;
    submitSpinner.classList.toggle('d-none', !loading);
    submitButtonText.textContent = loading ? 'Creating Account...' : 'Create Account';
  }
  function hideOutcome() {
    message.classList.add('d-none');
    message.classList.remove('alert-success', 'alert-danger');
    message.textContent = '';
    successActions.classList.add('d-none');
  }
  function showMessage(type, text) {
    message.classList.remove('d-none', 'alert-success', 'alert-danger');
    message.classList.add(type === 'success' ? 'alert-success' : 'alert-danger');
    message.textContent = text;
  }
  function validatePassword() {
    const value = password.value;
    let error = '';
    if (!value) {
      error = 'Password is required.';
    } else if (value.length < 12) {
      error = 'Password must contain at least 12 characters.';
    } else if (!passwordPattern.uppercase.test(value)) {
      error = 'Password must contain at least one uppercase letter.';
    } else if (!passwordPattern.lowercase.test(value)) {
      error = 'Password must contain at least one lowercase letter.';
    } else if (!passwordPattern.digit.test(value)) {
      error = 'Password must contain at least one number.';
    } else if (!passwordPattern.nonAlphanumeric.test(value)) {
      error = 'Password must contain at least one special character.';
    }
    password.setCustomValidity(error);
    passwordFeedback.textContent = error || 'Password does not meet the required policy.';
    return !error;
  }
  function validateForm() {
    validatePassword();
    form.classList.add('was-validated');
    return form.checkValidity();
  }
  function clearPassword() {
    password.value = '';
    password.setCustomValidity('');
  }
  function getControlledErrorMessage(response, data) {
    if (response.status === 400) {
      return data && typeof data.message === 'string' && data.message.trim() ? data.message : 'Please correct the information entered and try again.';
    }
    if (response.status === 409) {
      return data && typeof data.message === 'string' && data.message.trim() ? data.message : 'An account already exists with the supplied unique information.';
    } /* Never render server text for unexpected failures or unapproved statuses. */
    return 'Unable to create the account. Please try again.';
  }
  password.addEventListener('input', () => {
    validatePassword();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    // Also guard programmatic or repeated submissions while a request is pending.
    if (submitButton.disabled) return;
    hideOutcome();
    if (!validateForm()) {
      return;
    }
    const requestBody = {
      nricPassportNo: nricPassportNo.value.trim(),
      name: name.value.trim(),
      email: email.value.trim(),
      mobileNo: mobileNo.value.trim(),
      password: password.value
    };
    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (response.status === 201) {
        clearPassword();
        form.reset();
        form.classList.remove('was-validated');
        showMessage('success', 'Account created successfully. You may now continue to login.');
        successActions.classList.remove('d-none');
        return;
      }
      clearPassword();
      showMessage('error', getControlledErrorMessage(response, data));
    } catch {
      clearPassword();
      showMessage('error', 'Unable to connect to the service. Please try again.');
    } finally {
      setLoading(false);
    }
  });
});
