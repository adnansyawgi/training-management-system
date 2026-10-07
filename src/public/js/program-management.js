(function () {
  'use strict';

  /** @type {typeof import('./business-time')} */
  const businessClock = window.businessTime;
  function prepareProgramBody(body, id, timezone) {
    if (id) {
      delete body.code;
    }
    for (const key of ['categoryId', 'trainerUserId', 'capacity']) {
      body[key] = Number(body[key]);
    }
    for (const key of ['startTime', 'endTime']) {
      if (typeof body[key] !== 'string') {
        throw new TypeError('Time must be text.');
      }
      if (body[key].length === 5) {
        body[key] += ':00';
      }
    }
    for (const key of ['registrationOpenAt', 'registrationCloseAt']) {
      if (typeof body[key] !== 'string') {
        throw new TypeError('Timestamp must be text.');
      }
      const [day, rawTime] = body[key].split('T');
      const time = rawTime.length === 5 ? rawTime + ':00' : rawTime;
      body[key] = businessClock.scheduledStart(day, time, timezone).toISOString();
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('management-form');
    if (!form) {
      return;
    }
    const message = document.getElementById('management-message'),
      button = form.querySelector('button[type="submit"]');
    let pending = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending || !form.reportValidity()) {
        return;
      }
      pending = true;
      button.disabled = true;
      message.textContent = 'Saving…';
      try {
        const body = Object.fromEntries(new FormData(form)),
          id = body.recordId;
        delete body.recordId;
        if (form.dataset.kind === 'programs') {
          prepareProgramBody(body, id, form.dataset.timezone);
        }
        const response = await fetch('/api/v1/admin/' + form.dataset.kind + (id ? '/' + encodeURIComponent(id) : ''), {
          method: id ? 'PUT' : 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
          },
          body: JSON.stringify(body)
        });
        if (!response.ok) {
          message.textContent = {
            400: 'Check the fields, schedule, capacity and status transition.',
            401: 'Your session expired. Sign in again.',
            403: 'You do not have access or the security token expired. Reload and try again.',
            404: 'The record no longer exists.',
            409: 'This code or category name already exists.'
          }[response.status] || 'The change could not be saved. Try again.';
          return;
        }
        const result = await response.json(),
          record = form.dataset.kind === 'programs' ? result.program : result,
          recordId = record?.[form.dataset.kind === 'programs' ? 'programId' : 'categoryId'];
        if (!Number.isSafeInteger(recordId) || recordId < 1) {
          message.textContent = 'The change could not be confirmed. Reload the page before trying again.';
          return;
        }
        message.textContent = 'Saved successfully. Opening the updated record…';
        window.location.assign(window.location.pathname + '?edit=' + recordId);
      } catch {
        message.textContent = 'The change could not be confirmed. Reload the page before trying again.';
      } finally {
        pending = false;
        button.disabled = false;
      }
    });
  });
})();
