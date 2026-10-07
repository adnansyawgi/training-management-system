/* global accountForms */
'use strict';
document.addEventListener('DOMContentLoaded', () => accountForms.bindLogin({
  selector: '[data-success-url]', endpoint: '/api/v1/auth/system-admin/login',
  destination: page => page.dataset.successUrl
}));
