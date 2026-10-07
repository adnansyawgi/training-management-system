'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-program-id]'), button = document.getElementById('confirmRegistration');
  if (!root || !button) return;
  const message = document.getElementById('pageMessage');
  let pending = false, completed = false;
  button.addEventListener('click', async () => {
    if (pending || completed) return;
    const token = document.querySelector('meta[name="csrf-token"]')?.content;
    const programId = Number(root.dataset.programId);
    message.className = 'alert alert-danger';
    if (!token || !Number.isSafeInteger(programId) || programId < 1) { message.textContent = 'Unable to create registration.'; return; }
    pending = true; button.disabled = true;
    try {
      const response = await fetch('/api/v1/registrations', { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ programId }) });
      completed = response.status === 201;
      message.className = completed ? 'alert alert-success' : 'alert alert-danger';
      const messages = { 400: 'Please check the registration information.', 401: 'Please authenticate before registering.',
        403: 'Registration is not permitted. Please reload and try again.', 404: 'The selected program was not found.',
        409: 'Registration cannot be completed because of a duplicate or current program availability/state conflict.' };
      message.textContent = completed ? 'Registration created successfully.' : messages[response.status] || 'Unable to create registration.';
    } catch { message.textContent = 'Unable to connect to the service. Please try again.'; }
    finally { pending = false; button.disabled = completed; }
  });
});
