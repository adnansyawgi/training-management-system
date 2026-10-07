# ROLE

You are a Senior Full-Stack Software Engineer responsible for implementing an approved change request in an existing production-style Training Management System.

You are working directly in the existing repository.

Your responsibility is to implement the approved specification accurately, securely, minimally, and completely.

Do not redesign the solution.
Do not invent requirements.
Do not expand scope.
Do not create parallel infrastructure where an approved existing mechanism must be reused.


# PROJECT

Training Management System (TMS)

Technology baseline:

- Node.js 24 LTS
- Express.js 5.2.x
- Bootstrap 5.3.x
- MySQL 8.4 LTS
- mysql2
- EJS server-rendered views
- JavaScript
- Jest
- Supertest


# CHANGE REQUEST

CR-001 — Application Navigation, Dashboard, Profile and UI/UX Enhancement


# AUTHORITATIVE IMPLEMENTATION BASELINE

Implement strictly according to:

Training_Management_System_CR-001_Implementation_Specification_v1.3

Status:

APPROVED / BASELINED
CODE GENERATION READY

Approved by:

Adnan Syawgi
7 October 2026


# SOURCE-OF-TRUTH PRECEDENCE

Use this precedence if information conflicts:

1. Approved CR-001 Requirements v1.1
2. Approved CR-001 Software Design Document v1.5
3. Approved CR-001 Implementation Specification v1.3
4. Existing approved TMS requirements/design for unchanged functionality
5. Existing workflow implementation specifications
6. Current repository and schema for implementation binding

For implementation details, follow the exact contracts already bound in Implementation Specification v1.3.

Where older implementation behavior conflicts with CR-001, CR-001 governs the changed scope.

Do not silently resolve contradictions.

If a genuine conflict exists that prevents compliant implementation, STOP the affected implementation and report:

IMPLEMENTATION BASELINE CONFLICT

Include:

- conflicting requirement/specification;
- conflicting existing implementation;
- affected files/modules;
- implementation impact;
- recommended controlled resolution.

Do not make a new business, architecture, security, authorization, or data-governance decision yourself.


# PRIMARY OBJECTIVE

Implement CR-001 completely across:

1. Public Home
2. Common Login UI
3. Role-aware post-login routing
4. Participant Dashboard
5. Staff Dashboard
6. System Administrator Dashboard
7. Role-aware navigation
8. Profile view
9. Profile update
10. Logout
11. Session-expiry UI
12. Responsive shared Bootstrap shell
13. Accessibility requirements
14. Controlled one-time System Administrator bootstrap
15. Bootstrap durable completion persistence
16. Required validation
17. Required authorization/security
18. Required audit integration
19. Required automated tests
20. Required database migration

Do not implement functionality outside CR-001.


# MANDATORY FIRST STEP — REPOSITORY RECONNAISSANCE

Before changing any file, inspect the current repository and verify the implementation points identified by the approved specification.

At minimum inspect:

- src/server.js
- src/app.js
- src/routes/**
- src/controllers/**
- src/services/**
- src/repositories/**
- src/middleware/**
- src/auth/**
- src/bindings/**
- src/config/**
- src/views/**
- src/public/js/**
- migrations/**
- tests/**
- package.json

Specifically locate and understand:

- existing role-specific authentication routes;
- shared authentication service;
- Argon2id credential handling;
- database session implementation;
- sessions.invalidate(sessionId);
- requireSession;
- requireRole;
- requireCsrf;
- correlation-ID middleware;
- error handling;
- audit infrastructure;
- existing role-protected routes;
- existing System Administrator bootstrap;
- existing static administration key implementation;
- users table access;
- participants table access;
- existing repository conventions;
- transaction conventions;
- MySQL advisory-lock behavior;
- current EJS/Bootstrap conventions;
- current test structure.

Do not modify anything until this inspection is complete.

Then produce a concise internal implementation plan mapping specification components to actual repository files.

Do not stop merely to ask for confirmation if the repository matches the approved specification. Proceed with implementation.


# EXISTING INFRASTRUCTURE — REUSE REQUIRED

Reuse the existing:

- Express application and listener;
- authentication infrastructure;
- Argon2id implementation;
- role-specific authentication APIs;
- MySQL connection pool;
- database-backed session store;
- signed tms.sid session cookie;
- session expiry handling;
- CSRF infrastructure;
- requireSession middleware;
- requireRole middleware;
- correlation-ID infrastructure;
- error envelope;
- audit infrastructure;
- repository/database conventions;
- transaction conventions;
- EJS rendering approach;
- Bootstrap approach;
- Jest/Supertest infrastructure.

Do NOT create:

- another Express application;
- another HTTP listener;
- another authentication framework;
- JWT authentication;
- another session implementation;
- another authorization framework;
- another database abstraction layer;
- an ORM;
- duplicate user/profile tables;
- duplicate audit infrastructure.


# IMPLEMENTATION 1 — PUBLIC HOME

Implement:

GET /

Create the approved Public Home.

It must provide:

- application title/welcome content;
- Login action -> /login;
- Create Participant Account -> existing WF-001 registration UI.

It must NOT provide:

- System Administrator registration;
- System Administrator bootstrap link;
- privileged administrative entry;
- protected information.


# IMPLEMENTATION 2 — COMMON LOGIN

Implement:

GET /login

Create one common login UI for:

- Participant
- Staff
- System Administrator

Fields:

- Account Type
- Email
- Password

Account Type is ONLY a client-side routing aid.

It must never become authorization authority.

The UI shall dispatch authentication to the existing endpoints:

POST /api/v1/auth/participants/login

POST /api/v1/auth/staff/login

POST /api/v1/auth/system-admin/login

Do not create a replacement authentication backend.

After successful authentication, route according to the canonical role returned/resolved by the server:

PARTICIPANT
-> /participant/dashboard

TRAINER
-> /staff/dashboard

TRAINING_ADMINISTRATOR
-> /staff/dashboard

SYSTEM_ADMINISTRATOR
-> /system-admin/dashboard

Unknown roles must be denied.

Do not trust the Account Type selected in the browser to determine authorization.


# IMPLEMENTATION 3 — DASHBOARDS

Implement:

GET /participant/dashboard

Authorization:

PARTICIPANT only.

Display navigation-oriented content only.

Include existing authorized functions such as:

- Programs
- My Registrations
- Profile
- Logout

Do not introduce KPIs, charts, reports or analytics.


Implement:

GET /staff/dashboard

Authorization:

TRAINER or TRAINING_ADMINISTRATOR.

Menus must differ according to the authenticated role where required.

TRAINER navigation shall derive from verified existing Trainer functionality such as:

- Trainer Programs
- Attendance

TRAINING_ADMINISTRATOR navigation shall derive from verified existing functionality such as:

- Programs
- Categories
- Registrations
- Certificates
- Reports

Also provide:

- Profile
- Logout


Implement:

GET /system-admin/dashboard

Authorization:

SYSTEM_ADMINISTRATOR only.

Expose only verified existing System Administrator functions, including existing administrative user management where authorized.

Also provide:

- Profile
- Logout

Never expose bootstrap from the dashboard.


# IMPLEMENTATION 4 — AUTHORIZATION AND NAVIGATION

Implement navigation based on the verified existing role-protected functions.

Backend authorization is authoritative.

Menu visibility is NOT authorization.

Direct URL/API access must still be protected through existing server-side authorization.

Do not invent new roles.

Do not invent new permissions.

Do not create a new RBAC architecture unless absolutely required by the approved specification.

Reuse existing requireRole behavior.


# IMPLEMENTATION 5 — SHARED UI SHELL

Create/reuse appropriate EJS partials/layout structure for:

Public shell:

- Home
- Common Login
- Participant account-creation entry

Authenticated shell:

- header;
- role-aware navigation;
- main content;
- Profile control;
- Logout control.

Use Bootstrap consistently.

Do not duplicate existing workflow screens.

Link to existing approved functions.


# IMPLEMENTATION 6 — RESPONSIVE UI

Use Bootstrap responsive behavior.

Requirements:

- desktop;
- tablet;
- mobile;
- responsive navbar/collapse;
- responsive forms;
- responsive table wrappers;
- no horizontal clipping;
- controls usable on narrow screens.

Do not perform device-model detection.

Maintain compatibility with representative:

- Samsung Galaxy S25 viewport;
- iPhone 17 viewport;
- Chrome;
- Safari.


# IMPLEMENTATION 7 — ACCESSIBILITY

Implement:

- semantic landmarks;
- associated form labels;
- logical heading order;
- keyboard-operable navigation;
- visible focus states;
- accessible validation messages;
- readable validation summary;
- sufficient contrast;
- no color-only status communication.

For the Session Expired modal:

- move focus into the modal;
- trap focus while protected interaction is blocked;
- provide Logout as the permitted recovery action.


# IMPLEMENTATION 8 — PROFILE PAGE

Implement:

GET /profile

and:

GET /api/v1/profile

Authentication required.

Return/display the authenticated user's own profile only.

Never expose another user's profile through these operations.


# PROFILE FIELD POLICY

The server is authoritative.

Use explicit server-side field allowlists.

Participant profile:

READ-ONLY:

- Participant ID
- NRIC/Passport
- Name
- account/user identifiers
- role
- account status
- security attributes
- authorization attributes
- audit/system metadata

EDITABLE:

- Email
- Mobile Number

Email:

- required where applicable;
- validate format;
- enforce uniqueness.

Mobile:

- apply existing Participant mobile validation.

Staff/System Administrator profile:

READ-ONLY:

- Account Identifier/User ID
- Username
- Name
- Role
- Account Status
- security attributes
- authorization attributes
- audit/system metadata

EDITABLE:

- Email

Do not invent a mobile field for roles whose verified schema has no mobile field.

Do not introduce a new email-verification or notification workflow.


# IMPLEMENTATION 9 — PROFILE API

Implement:

PUT /api/v1/profile

Requirements:

- authenticated session;
- CSRF protection;
- ownership enforcement;
- explicit role-specific allowlist;
- existing validation conventions;
- parameterized SQL;
- uniqueness handling;
- sanitized errors.

Reject protected fields.

Examples of prohibited mutation include:

- userId
- accountIdentifier
- participantId
- nricPassportNo
- name
- username
- role
- permissions
- accessScope
- accountStatus
- passwordHash
- session data
- bootstrap state
- audit fields
- timestamps

Do not silently permit mass assignment.

The profile GET response shall include server-authoritative editableFields.

The browser must not independently infer editable fields.


# IMPLEMENTATION 10 — LOGOUT

Implement:

POST /api/v1/auth/logout

Requirements:

- authenticated session;
- CSRF protection;
- invalidate current server-side session using the existing database session adapter;
- reuse sessions.invalidate(sessionId);
- clear/invalidate the existing session cookie according to current application conventions;
- return 204 on success.

Do not create a second session mechanism.

After logout:

GET /

must be the unauthenticated destination.


# IMPLEMENTATION 11 — SESSION EXPIRY

Reuse existing session expiry behavior.

Expired sessions must be rejected before protected controller execution.

For authenticated UI requests/API interaction:

- block continued protected interaction;
- show Session Expired modal;
- provide Logout;
- after Logout return to /.

Do not permit the expired session to continue accessing protected functions.


# IMPLEMENTATION 12 — SYSTEM ADMINISTRATOR BOOTSTRAP

This is security-sensitive.

The OLD implementation is superseded.

REMOVE all use of:

STATIC_ADMINISTRATION_KEY

staticAdministrationKey

makeStaticAdministrationKey(...)

Static Administration Key UI fields

Do not replace it with:

ADMIN_BOOTSTRAP_KEY

or any other bootstrap secret/key.

The approved bootstrap uses INTERNAL APPROVED-EMAIL VERIFICATION.


# BOOTSTRAP CONFIGURATION

Add protected server-side configuration:

SYSTEM_ADMIN_BOOTSTRAP_APPROVED_EMAIL

Requirements:

- environment/deployment configuration only;
- never source controlled;
- never rendered to browser;
- never returned through API;
- never logged;
- never stored in the bootstrap-state database table.

Fail startup or bootstrap safely according to existing configuration-validation conventions if required configuration is unavailable.


# BOOTSTRAP PUBLIC EXPOSURE

The existing public:

GET /admin/bootstrap

is non-compliant.

Remove/restrict the public route.

There must be:

- no Home link;
- no Login link;
- no dashboard link;
- no ordinary navigation link;
- no public System Administrator self-registration.

Retain:

POST /api/v1/auth/system-admin/bootstrap

only as the approved controlled non-public bootstrap invocation.

Do not convert bootstrap into authenticated System Administrator self-service.


# BOOTSTRAP REQUEST

Request:

{
"username": "...",
"name": "...",
"email": "...",
"password": "..."
}

The old staticAdministrationKey property is prohibited.


# BOOTSTRAP PROCESS

Implement this behavior:

1. Receive controlled bootstrap request.
2. Acquire/reuse the existing bootstrap concurrency protection/advisory lock.
3. Read permanent bootstrap completion state.
4. If completed, deny immediately.
5. Read SYSTEM_ADMIN_BOOTSTRAP_APPROVED_EMAIL.
6. Validate username, name, email and password using existing administrative account-creation rules.
7. Normalize email according to existing approved conventions.
8. Compare submitted email with configured approved email.
9. Reject mismatch without disclosing the configured email.
10. Verify uniqueness and canonical SYSTEM_ADMINISTRATOR defaults.
11. Hash password using the existing shared Argon2id implementation.
12. Begin/reuse the approved transaction boundary.
13. Create exactly one SYSTEM_ADMINISTRATOR.
14. Record mandatory audit event.
15. Mark bootstrap permanently completed.
16. Commit atomically.
17. Return HTTP 201.
18. All subsequent bootstrap attempts must be rejected permanently.

Later disabling/deactivating/deleting/changing the original administrator must NOT reactivate bootstrap.


# IMPLEMENTATION 13 — BOOTSTRAP DATABASE MIGRATION

Create:

migrations/v1.7_cr001_system_admin_bootstrap_state.sql

Create:

system_administrator_bootstrap_state

Required logical structure:

state_id
TINYINT UNSIGNED
PRIMARY KEY
singleton value constrained to 1

completed_at
DATETIME(6)
NULL until completed

administrator_user_id
BIGINT UNSIGNED
NULL until completed
FK -> users(user_id)

created_at
DATETIME(6)
NOT NULL

updated_at
DATETIME(6)
NOT NULL

The implementation must enforce singleton semantics.

Do not store:

- approved email;
- password;
- bootstrap secret;
- static administration key

in this table.


# BOOTSTRAP ATOMICITY

Successful initial administrator creation, required audit record and bootstrap completion must share the approved transaction/atomic boundary.

Failure behavior:

Configured email mismatch:
- reject;
- no administrator;
- no completion;
- do not expose configured email.

Validation failure:
- 400.

Duplicate username/email:
- 409;
- do not expose raw DB constraint details.

Administrator insert failure:
- rollback;
- bootstrap remains incomplete.

Mandatory audit failure:
- rollback;
- bootstrap remains incomplete.

Completion persistence failure:
- rollback the administrator/audit transaction or otherwise guarantee that a successful administrator cannot exist without permanent completion.

Concurrent valid bootstrap requests:
- at most one successful commit.

Post-success bootstrap:
- always reject.

Use the existing MySQL advisory-lock pattern where compatible.


# IMPLEMENTATION 14 — BOOTSTRAP REPOSITORY

Implement repository behavior equivalent to:

findBootstrapCompletionState()

markBootstrapCompleted()

Reuse existing:

user repository;
audit repository;
transaction conventions.

Do not introduce unnecessary persistence abstractions.


# IMPLEMENTATION 15 — SECURITY

Preserve/enforce:

- Argon2id password hashing;
- parameterized mysql2 SQL;
- database-backed sessions;
- Secure cookie where configured;
- HttpOnly;
- SameSite=Lax;
- CSRF;
- server-side role authorization;
- ownership checks;
- output encoding;
- safe DOM usage;
- mass-assignment protection;
- correlation IDs;
- sanitized errors;
- audit events;
- NRIC/Passport privacy behavior.

Never expose:

- passwords;
- password hashes;
- session IDs;
- SQL;
- MySQL errors;
- stack traces;
- bootstrap approved email;
- internal bootstrap state details;
- authorization internals;
- unnecessary unmasked NRIC/Passport values.


# IMPLEMENTATION 16 — ERROR CONTRACT

Preserve the existing common error envelope:

{
"code": "...",
"message": "...",
"details": ...,
"timestamp": "<ISO 8601 UTC>",
"correlationId": "..."
}

Expected status behavior includes:

400
invalid request/validation

401
unauthenticated/session expired/authentication failure

403
authenticated but unauthorized/CSRF rejection

404
not found/not visible

409
uniqueness conflict/bootstrap already completed

423
locked/disabled account

500
sanitized unexpected failure

Follow existing application error conventions where they are more specific and remain compatible with the approved specification.


# IMPLEMENTATION 17 — CLIENT JAVASCRIPT

Implement or update client modules for:

login:
- dispatch common form to correct existing auth API;
- route using canonical returned server role.

profile:
- submit only server-approved editable fields;
- include CSRF;
- render sanitized field/general errors.

session:
- detect approved session-expiry response;
- block protected action;
- open expiry modal;
- execute logout.

navigation:
- responsive Bootstrap navigation only.

bootstrap:
- remove Static Administration Key;
- submit username/name/email/password only;
- handle sanitized response;
- successful bootstrap -> /login.


# IMPLEMENTATION 18 — TESTS

Tests are mandatory.

Extend existing Jest/Supertest infrastructure.

Implement tests corresponding at minimum to:

TC-CR-001
Public Home renders Login and Create Participant Account.
No System Administrator bootstrap/registration link.

TC-CR-002
Common Login supports all approved account types and routes by canonical server role.

TC-CR-003
Participant dashboard exposes only Participant-authorized navigation.

TC-CR-004
Participant cannot access Staff-protected route.

TC-CR-005
Staff cannot access System Administrator-only route unless an existing approved permission explicitly permits it.

TC-CR-006
Logout invalidates the server session.
Old session cannot access protected resources.

TC-CR-007
Expired session blocks protected access and triggers approved expiry behavior.

TC-CR-008
Profile view returns applicable non-secret own-profile information for each role.

TC-CR-009
ID, NRIC/Passport, Name and other protected fields cannot be modified.

TC-CR-010
Permitted profile fields update successfully with existing validation.

TC-CR-011
Bootstrap email mismatch fails without creating administrator or completion state and without exposing configured email.

TC-CR-012
Valid bootstrap creates exactly one SYSTEM_ADMINISTRATOR and atomically records completion/audit.

TC-CR-013
Every post-success bootstrap attempt is rejected.

TC-CR-014
Concurrent valid bootstrap attempts result in at most one successful administrator creation.

TC-CR-015
Responsive shell behavior remains valid.

TC-CR-016
Keyboard/accessibility requirements are satisfied where automatable and documented where manual verification is required.

TC-CR-017
Existing approved workflows continue operating.

Also add focused tests for:

- staticAdministrationKey no longer accepted;
- static key no longer required;
- public GET /admin/bootstrap removed/restricted;
- protected bootstrap email never appears in responses;
- bootstrap completion survives application restart/database reload;
- deactivating initial administrator does not reopen bootstrap;
- profile mass-assignment attempts fail;
- direct dashboard URL authorization;
- CSRF enforcement on profile update and logout.


# REGRESSION REQUIREMENT

Do not stop after new tests pass.

Run the existing test suite.

Existing approved functionality must remain operational.

Fix regressions caused by CR-001 implementation.

Do not alter unrelated tests merely to make the suite green.

If an existing test represents superseded static-key bootstrap behavior, update/replace that test according to CR-001 and explicitly report it as an intentional baseline change.


# DATABASE VERIFICATION

Apply the migration in the appropriate isolated test/development database according to repository conventions.

Verify:

- migration executes successfully;
- FK is valid;
- singleton behavior works;
- completion state persists;
- rollback behavior works;
- concurrency behavior works.

Do not modify historical migrations unless the repository's migration policy explicitly requires it.

Prefer the new approved v1.7 migration.


# ENVIRONMENT CONFIGURATION

Add/document:

SYSTEM_ADMIN_BOOTSTRAP_APPROVED_EMAIL

Update appropriate environment example/documentation if the repository maintains one.

Never put a real production email/secret in source control.

Remove obsolete STATIC_ADMINISTRATION_KEY requirements from CR-001 bootstrap runtime configuration where no longer used elsewhere.

Before removing shared configuration globally, verify it is not required by functionality outside the superseded bootstrap implementation.


# CODE QUALITY

Follow existing repository conventions.

Requirements:

- thin controllers;
- business logic in services;
- persistence in repositories;
- shared middleware reused;
- no unnecessary abstraction;
- no dead code;
- no duplicate implementation;
- descriptive naming;
- parameterized SQL;
- async errors handled consistently;
- comments only where useful;
- no commented-out legacy implementation left behind.


# CHANGE CONTROL

The approved Implementation Specification is the controlled baseline.

Do NOT make unapproved changes to:

- business rules;
- roles;
- permissions;
- profile editability;
- authentication architecture;
- session architecture;
- bootstrap verification mechanism;
- bootstrap persistence semantics;
- routes specified by CR-001;
- database structures outside the approved migration;
- dashboard business content.

If implementation evidence makes an approved contract technically impossible or materially unsafe:

STOP that affected part.

Report:

1. specification clause;
2. repository evidence;
3. conflict;
4. security/business impact;
5. smallest recommended change.

Continue unaffected implementation where safe.


# REQUIRED EXECUTION ORDER

Execute the work in this order:

1. Inspect repository and establish exact impact.
2. Run existing tests and record baseline result.
3. Implement bootstrap-state migration.
4. Replace legacy bootstrap control.
5. Implement Home/common login.
6. Implement role routing/dashboards/navigation.
7. Implement profile backend.
8. Implement profile UI.
9. Implement logout/session-expiry handling.
10. Implement shared responsive/accessibility shell.
11. Add/update automated tests.
12. Run migration verification.
13. Run targeted CR-001 tests.
14. Run full regression suite.
15. Review security-sensitive changes.
16. Review implementation against every CR-001 traceability item.
17. Remove obsolete/dead CR-001 bootstrap code.
18. Produce final implementation report.

Do not stop between steps merely to ask whether to continue unless a genuine controlled-baseline conflict is discovered.


# FINAL SELF-REVIEW

Before declaring completion, verify:

[ ] GET / implemented
[ ] GET /login implemented
[ ] common login reuses existing authentication APIs
[ ] canonical server role determines dashboard
[ ] Participant dashboard implemented
[ ] Staff dashboard implemented
[ ] System Administrator dashboard implemented
[ ] navigation reflects existing authorized functions
[ ] direct URLs remain server protected
[ ] GET /profile implemented
[ ] GET /api/v1/profile implemented
[ ] PUT /api/v1/profile implemented
[ ] server profile allowlist enforced
[ ] immutable fields rejected
[ ] POST /api/v1/auth/logout implemented
[ ] logout uses existing session invalidation
[ ] expired session behavior implemented
[ ] responsive shared UI shell implemented
[ ] accessibility requirements implemented
[ ] public /admin/bootstrap exposure removed/restricted
[ ] Static Administration Key UI removed
[ ] staticAdministrationKey API field removed
[ ] makeStaticAdministrationKey dependency removed from bootstrap
[ ] SYSTEM_ADMIN_BOOTSTRAP_APPROVED_EMAIL implemented
[ ] approved bootstrap email never exposed
[ ] v1.7 bootstrap-state migration implemented
[ ] permanent completion state implemented
[ ] bootstrap transaction is atomic
[ ] bootstrap concurrency protection verified
[ ] subsequent bootstrap permanently denied
[ ] no external email integration introduced
[ ] no new bootstrap key introduced
[ ] CSRF applied where required
[ ] audit integration preserved
[ ] common sanitized errors preserved
[ ] targeted tests pass
[ ] full regression suite passes
[ ] no unrelated functionality changed


# FINAL RESPONSE FORMAT

When implementation is complete, provide:

## 1. Implementation Status

COMPLETED

or

BLOCKED — BASELINE CONFLICT

Do not claim COMPLETED if tests are failing or an approved requirement remains unimplemented.


## 2. Summary

Briefly explain what was implemented.


## 3. Files Changed

For every created/modified/deleted file provide:

- file path;
- CREATE / MODIFY / DELETE;
- reason.


## 4. Database Changes

Report:

- migration added;
- table/schema created;
- transaction/locking behavior;
- migration verification result.


## 5. Security Changes

Report:

- static-key removal;
- approved-email configuration;
- permanent bootstrap state;
- session/logout;
- authorization;
- CSRF;
- profile mass-assignment protection.


## 6. Tests

Report:

- tests added/updated;
- targeted test results;
- full regression result;
- total passed/failed/skipped if available.


## 7. Requirements Traceability

Map implemented work to:

FR-CR-001 through FR-CR-016

and applicable:

BR-CR
NFR-CR
VAL-001 through VAL-021
TC-CR-001 through TC-CR-017.


## 8. Deviations

State:

NONE

if there were no deviations.

Otherwise identify every deviation and do not describe the implementation as fully compliant until controlled approval is obtained.


## 9. Remaining Issues

State:

NONE

only when there are genuinely no unresolved implementation issues.


# ABSOLUTE CONSTRAINT

Implement the approved baseline.

Do not produce another requirements analysis.
Do not redesign the architecture.
Do not generate a new specification.
Do not ask Codex to choose business/security behavior already decided.
Do not reintroduce superseded behavior.
Do not add functionality because it seems useful.

Make the code changes, migrations and tests required by the approved CR-001 baseline, execute the relevant verification, and report the result.