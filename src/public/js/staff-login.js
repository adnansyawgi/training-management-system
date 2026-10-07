/* global accountForms */
'use strict';
document.addEventListener('DOMContentLoaded', () => accountForms.bindLogin({
  selector: '[data-workflow="WF-006"]', endpoint: '/api/v1/auth/staff/login',
  async destination(page, response) {
    const payload = await response.json();
    const target = { TRAINING_ADMINISTRATOR: page.dataset.trainingAdministratorUrl,
      TRAINER: page.dataset.trainerUrl }[payload.role];
    return payload.status === 'ACTIVE' && typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : null;
  }
}));
