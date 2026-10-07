(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profileForm');
    if (!form) return;
    const button = document.getElementById('saveProfile'), message = document.getElementById('profileMessage');
    function show(text, success = false) { message.className = 'alert ' + (success ? 'alert-success' : 'alert-danger'); message.textContent = text; message.focus(); }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled) return;
      form.classList.add('was-validated');
      if (!form.checkValidity()) { show('Check the highlighted profile fields.'); form.querySelector(':invalid')?.focus(); return; }
      button.disabled = true;
      try {
        // Controls are rendered from the server's editableFields, never a browser role policy.
        const body = Object.fromEntries(new FormData(form));
        const response = await fetch('/api/v1/profile', { method:'PUT', credentials:'same-origin', headers:{'Content-Type':'application/json',Accept:'application/json','X-CSRF-Token':document.querySelector('meta[name="csrf-token"]').content}, body:JSON.stringify(body) });
        if (response.status === 401) return;
        if (!response.ok) { show(({400:'Check the profile fields.',403:'The security token expired. Reload the page and try again.',409:'The email address cannot be used.'})[response.status] || 'Unable to save the profile. Please try again.'); return; }
        const data = await response.json();
        for (const key of data.editableFields) { const input = form.elements.namedItem(key); if (input) input.value = data.profile[key]; }
        show('Profile saved successfully.', true);
      } catch { show('Unable to save the profile. Please try again.'); }
      finally { button.disabled = false; }
    });
  });
})();
