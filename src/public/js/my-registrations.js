'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-workflow="WF-010"]');
  if (!root) return;
  const field = id => document.getElementById(id);
  const rows = field('registrationRows'), message = field('pageMessage'), panel = field('cancelPanel');
  const previous = field('previousPage'), next = field('nextPage'), apply = field('applyFilter');
  const confirm = field('confirmCancellation'), back = field('closeCancellation'), reason = field('cancellationReason');
  let page = 1, total = 0, selected = null, pending = false;
  const pageSize = 20;
  const show = (text, success = false) => { message.className = 'alert ' + (success ? 'alert-success' : 'alert-danger'); message.textContent = text; };
  const close = () => { selected = null; reason.value = ''; panel.classList.add('d-none'); };
  function eligible(item) {
    try { return item.status === 'REGISTERED' && businessTime.beforeProgramStart(item.trainingDate, item.startTime, new Date(), root.dataset.businessTimezone); }
    catch { return false; }
  }
  async function load(keepMessage = false) {
    if (pending) return;
    pending = true; close(); apply.disabled = previous.disabled = next.disabled = true;
    rows.replaceChildren(); field('emptyState').classList.add('d-none'); field('pageInfo').textContent = 'Loading registrations...';
    if (!keepMessage) { message.className = 'alert d-none'; message.textContent = ''; }
    let success = false;
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort: field('sortFilter').value });
    if (field('statusFilter').value) query.set('status', field('statusFilter').value);
    try {
      const response = await fetch('/api/v1/registrations?' + query, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (response.status !== 200) {
        show(response.status === 401 ? 'Please authenticate to view registrations.' : response.status === 400 ? 'Invalid registration filters.' : 'Unable to load registrations.'); return;
      }
      const data = await response.json();
      const detailsBase = root.dataset.programDetailsBaseUrl;
      if (!Array.isArray(data.items) || data.items.length > pageSize || data.page !== page || data.pageSize !== pageSize ||
          !Number.isSafeInteger(data.total) || data.total < 0 || typeof detailsBase !== 'string' || !detailsBase.startsWith('/') || detailsBase.startsWith('//') ||
          data.items.some(item => !item || !Number.isSafeInteger(item.registrationId) || item.registrationId < 1 || !Number.isSafeInteger(item.programId) || item.programId < 1)) throw new Error('Invalid list.');
      const fragment = document.createDocumentFragment();
      data.items.forEach(item => {
        const tr = document.createElement('tr');
        [item.referenceNo, item.programName, item.trainingDate, item.status].forEach(value => { const td = document.createElement('td'); td.textContent = value ?? ''; tr.appendChild(td); });
        const actions = document.createElement('td'), view = document.createElement('a');
        view.textContent = 'View'; view.className = 'btn btn-sm btn-outline-primary'; view.href = detailsBase.replace(/\/$/, '') + '/' + encodeURIComponent(item.programId); actions.appendChild(view);
        if (eligible(item)) {
          const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'btn btn-sm btn-outline-danger'; cancel.textContent = 'Cancel Registration';
          cancel.addEventListener('click', () => { if (pending) return; selected = item; reason.value = ''; field('selectedRegistration').textContent = item.referenceNo; panel.classList.remove('d-none'); reason.focus(); });
          actions.appendChild(cancel);
        }
        tr.appendChild(actions); fragment.appendChild(tr);
      });
      rows.replaceChildren(fragment); total = data.total; success = true;
      field('emptyState').classList.toggle('d-none', data.items.length !== 0); field('pageInfo').textContent = `Page ${page}`;
    } catch { show('Unable to connect to the service. Please try again.'); }
    finally { pending = false; apply.disabled = false; previous.disabled = !success || page <= 1; next.disabled = !success || page * pageSize >= total; if (!success) field('pageInfo').textContent = ''; }
  }
  field('registrationFilter').addEventListener('submit', event => { event.preventDefault(); if (!pending) { page = 1; load(); } });
  previous.addEventListener('click', () => { if (!pending && !previous.disabled && page > 1) { page--; load(); } });
  next.addEventListener('click', () => { if (!pending && !next.disabled && page * pageSize < total) { page++; load(); } });
  back.addEventListener('click', () => { if (!pending) close(); });
  confirm.addEventListener('click', async () => {
    if (pending || !selected) return;
    const token = document.querySelector('meta[name="csrf-token"]')?.content;
    if (!token || Array.from(reason.value.trim()).length > 500) { show('Please check the cancellation information.'); return; }
    if (!eligible(selected)) { show('Registration cannot be cancelled.'); close(); return; }
    pending = true; confirm.disabled = back.disabled = apply.disabled = true; previous.disabled = next.disabled = true;
    let success = false;
    try {
      const response = await fetch('/api/v1/registrations/' + encodeURIComponent(selected.registrationId) + '/cancel', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ cancellationReason: reason.value.trim() }) });
      success = response.status === 200;
      const errors = { 400: 'Registration cannot be cancelled.', 401: 'Please authenticate before cancelling.',
        403: 'Cancellation is not permitted.', 404: 'The registration was not found.' };
      show(success ? 'Registration cancelled successfully.' : errors[response.status] || 'Unable to cancel registration.', success);
    } catch { show('Unable to connect to the service. Please try again.'); }
    finally {
      pending = false; confirm.disabled = back.disabled = apply.disabled = false;
      previous.disabled = page <= 1; next.disabled = page * pageSize >= total;
      if (success) { close(); await load(true); }
    }
  });
  load();
});
