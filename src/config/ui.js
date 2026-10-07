// Initial UI conventions approved for WF-001. Bootstrap is centralized here
// so a later asset pipeline can replace the CDN without changing the feature.
module.exports = Object.freeze({
  participantRegistrationUrl: '/register',
  participantLoginUrl: '/login',
  bootstrapCssUrl: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css',
  bootstrapCssIntegrity: 'sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB',
  appCssUrl: '/css/app.css',
  participantRegisterJsUrl: '/js/participant-register.js',
  participantLoginJsUrl: '/js/participant-login.js',
  programListUrl: '/programs',
  systemAdministratorBootstrapUrl: '/admin/bootstrap',
  administrativeLoginUrl: '/admin/login',
  systemAdministratorBootstrapJsUrl: '/js/system-administrator-bootstrap.js',
  systemAdministratorLoginJsUrl: '/js/system-admin-login.js',
  adminLandingUrl: '/admin/users',
  administrativeUserCreateJsUrl: '/js/administrative-user-create.js'
});
