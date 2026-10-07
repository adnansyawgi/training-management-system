'use strict';
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.querySelector('[data-program-id]');
  if (!root) return;
  const field = id => document.getElementById(id);
  const message = field('pageMessage'), article = field('programArticle'), register = field('registerLink');
  const programId = root.dataset.programId;
  const show = text => { message.className = 'alert alert-danger'; message.textContent = text; };
  try {
    const response = await fetch('/api/v1/programs/' + encodeURIComponent(programId), {
      credentials: 'same-origin', headers: { Accept: 'application/json' }
    });
    if (response.status !== 200) {
      show(response.status === 404 ? 'Training program was not found.' : response.status === 400
        ? 'Invalid training program identifier.' : 'Unable to load program details.');
      return;
    }
    const program = await response.json();
    if (!program || !Number.isSafeInteger(program.programId) || String(program.programId) !== programId ||
        !['OPEN', 'CLOSED'].includes(program.status) || !Number.isInteger(program.capacity) || program.capacity < 1 ||
        !Number.isInteger(program.availableSeats)) throw new Error('Invalid public detail.');
    field('programName').textContent = program.name;
    field('programDescription').textContent = program.description;
    const details = [
      ['Code', program.code], ['Objectives', program.objectives], ['Target Audience', program.targetAudience],
      ['Prerequisites', program.prerequisites], ['Category', program.categoryName], ['Trainer', program.trainerName],
      ['Date', program.trainingDate], ['Time', `${program.startTime} - ${program.endTime}`],
      ['Venue', program.venue], ['Delivery Mode', program.deliveryMode], ['Capacity', program.capacity],
      ['Available Seats', program.availableSeats], ['Status', program.status],
      ['Registration Opens', program.registrationOpenAt], ['Registration Closes', program.registrationCloseAt],
      ['Cancellation Policy Reference', program.cancellationPolicyReference],
      ['Certificate Eligibility Criteria', program.certificateEligibilityCriteria], ['Certificate Type', program.certificateType],
      ['Created At', program.createdAt], ['Updated At', program.updatedAt]
    ];
    const fragment = document.createDocumentFragment();
    details.forEach(([label, value]) => {
      const term = document.createElement('dt'), description = document.createElement('dd');
      term.className = 'col-sm-4'; description.className = 'col-sm-8';
      term.textContent = label; description.textContent = value ?? '';
      fragment.append(term, description);
    });
    field('programDetail').replaceChildren(fragment);
    const template = root.dataset.registrationUrlTemplate;
    if (program.status === 'OPEN' && program.availableSeats > 0 && typeof template === 'string' &&
        template.startsWith('/') && !template.startsWith('//') && template.includes(':programId')) {
      register.href = template.replace(':programId', encodeURIComponent(programId));
      register.classList.remove('d-none');
    }
  } catch { show('Unable to connect to the service. Please try again.'); }
  finally { article.setAttribute('aria-busy', 'false'); }
});
