'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-program-details-base-url]');
  const form = document.getElementById('filterForm');
  if (!root || !form) return;
  const field = id => document.getElementById(id);
  const rows = field('programRows'), empty = field('emptyState'), message = field('pageMessage');
  const previous = field('previousPage'), next = field('nextPage'), filter = field('filterButton');
  const pageInfo = field('pageInfo');
  const detailsBase = root.dataset.programDetailsBaseUrl.replace(/\/$/, '');
  let page = 1, total = 0, pending = false;
  const pageSize = 20;
  function showError(text) { message.className = 'alert alert-danger'; message.textContent = text; }
  async function load() {
    if (pending) return;
    pending = true; previous.disabled = next.disabled = filter.disabled = true;
    rows.replaceChildren(); empty.classList.add('d-none'); pageInfo.textContent = 'Loading programs...';
    message.className = 'alert d-none'; message.textContent = '';
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (field('categoryId').value) query.set('categoryId', field('categoryId').value);
    if (field('availability').value) query.set('availability', field('availability').value);
    let succeeded = false;
    try {
      const response = await fetch('/api/v1/programs?' + query, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (response.status !== 200) {
        showError(response.status === 400 ? 'Invalid filter values.' : 'Unable to load programs. Please try again.');
        return;
      }
      const data = await response.json();
      if (!Array.isArray(data.items) || data.items.length > pageSize || data.page !== page || data.pageSize !== pageSize ||
          !Number.isSafeInteger(data.total) || data.total < 0 || data.items.some(item => !item || !Number.isSafeInteger(item.programId) || item.programId < 1) ||
          !detailsBase.startsWith('/') || detailsBase.startsWith('//')) { showError('Unable to connect to the service. Please try again.'); return; }
      const fragment = document.createDocumentFragment();
      data.items.forEach(program => {
        const tr = document.createElement('tr');
        [program.code, program.name, program.categoryName, program.trainingDate, `${program.availableSeats} / ${program.capacity}`].forEach(value => {
          const td = document.createElement('td'); td.textContent = value ?? ''; tr.appendChild(td);
        });
        const td = document.createElement('td'), link = document.createElement('a');
        link.className = 'btn btn-sm btn-outline-primary'; link.textContent = 'View Details';
        link.setAttribute('aria-label', 'View details for ' + program.name);
        link.href = detailsBase + '/' + encodeURIComponent(program.programId);
        td.appendChild(link); tr.appendChild(td); fragment.appendChild(tr);
      });
      rows.replaceChildren(fragment); total = data.total;
      empty.classList.toggle('d-none', data.items.length !== 0);
      pageInfo.textContent = `Page ${data.page}`;
      succeeded = true;
    } catch {
      showError('Unable to connect to the service. Please try again.');
    } finally {
      pending = false; filter.disabled = false;
      previous.disabled = !succeeded || page <= 1;
      next.disabled = !succeeded || page * pageSize >= total;
      if (!succeeded) pageInfo.textContent = '';
    }
  }
  form.addEventListener('submit', event => { event.preventDefault(); if (!pending) { page = 1; void load(); } });
  previous.addEventListener('click', () => { if (!pending && !previous.disabled && page > 1) { page -= 1; void load(); } });
  next.addEventListener('click', () => { if (!pending && !next.disabled && page * pageSize < total) { page += 1; void load(); } });
  void load();
});
