# training-management-system

WF-001 provides participant account creation at `/register` in the existing
Express application. Run `npm.cmd install` and `npm.cmd start` from `src`, then
open `http://localhost:3000/register` (or the configured `PORT`). The existing API
requires its configured database for successful account creation.

The page uses EJS, `/css/app.css`, `/js/participant-register.js`, and Bootstrap
5.3.8 CSS from the CDN documented at https://getbootstrap.com/docs/5.3/.
Routes, navigation, CDN URL and integrity hash are centralized in
`src/config/ui.js`. Both registration login links target `/login`, which now
serves WF-002 Participant Login. Registration never redirects or logs in.

Run `npm.cmd test` from `src`. Browser DOM checks use jsdom inside the existing
Jest framework; HTTP integration checks use the existing Supertest dependency.
These tests do not require a database and do not verify database transactions.

WF-001 verification evidence recorded on 7 October 2026: **4 suites and 33 tests
passed**, including the existing validator and account-identifier tests.

| Acceptance cases | Implemented coverage |
| --- | --- |
| UI-T01, UI-T02 | Five required inputs, masking, password clearing |
| UI-T03 | Field limits, required/email checks, password policy, inline feedback |
| UI-T04, UI-T05 | Exact request properties, success reset, explicit login, no navigation/session storage |
| UI-T06, UI-T07 | Controlled 400/409 messages, fallbacks, text-only rendering |
| UI-T08, UI-T09 | Sanitized unexpected/network failures, malformed JSON, retry |
| UI-T10 | Rendered route, configured Bootstrap link/integrity, local assets, login targets |
| UI-T11 | Associated labels, live outcome, help text, native focusable controls |
| UI-T12 | Existing API validation/correlation, unknown routes, no login implementation |

Tests are in `tests/unit/ui/participant-register.test.js` and
`tests/integration/ui/participant-register.test.js`. CDN availability, visual
browser rendering, screen-reader behavior, and database-backed end-to-end
registration were not tested. Formal review and release approvals remain
separate from this implementation evidence.

Participant role configuration
------------------------------

The initial participant role identifiers were defined on 7 October 2026 with
user authorization from the documented SDD capabilities. The canonical initial
values are recorded in `src/.env.example`; copy those three entries to
`src/.env` and restart the server after changing them.

| Permission | Meaning |
| --- | --- |
| `PROGRAM_READ` | Read published training programs and program details |
| `REGISTRATION_CREATE_OWN` | Create registrations for the authenticated participant |
| `REGISTRATION_READ_OWN` | Read the authenticated participant's registrations |
| `REGISTRATION_CANCEL_OWN` | Cancel the authenticated participant's registrations subject to the approved cancellation rules |

`OWN_PARTICIPANT_RESOURCES` limits participant resources to the authenticated
participant. Program browsing uses `PROGRAM_READ`; program records do not need
to be owned by that participant. Responsibilities are `VIEW_PROGRAMS`,
`CREATE_OWN_REGISTRATIONS`, `VIEW_OWN_REGISTRATIONS`, and
`CANCEL_OWN_REGISTRATIONS`. No administrative access is granted.

WF-001 stores this role metadata at account creation. Future protected endpoints
must enforce permissions, ownership and business rules on the server; defining
these values does not implement those endpoints. Previously created accounts
are not updated by changing the environment variables. Start the application
from `src` using `npm.cmd start` so dotenv loads `src/.env`.

WF-001 implementation document alignment (7 October 2026)
--------------------------------------------------------

Reviewed the backend v1.3 and UI v1.4 documents in `docs/implementation-code`.
The existing route, five-field validation, Argon2id hashing, role configuration,
transaction service and registration UI are retained. The success controller
now explicitly returns only the three approved response fields. Duplicate-key
classification matches only the exact unique index names declared by the v1.0
migration, including MySQL table-qualified names; unknown keys remain sanitized
500 failures. Malformed JSON returns a fixed 400 message with correlation.

Set `SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER` in deployment configuration to the
exact `account_identifier` of the reserved actor already provisioned by the
initial migration. The audit repository checks that identity and its
SYSTEM_ADMINISTRATOR/DISABLED/SYSTEM characteristics. An absent or invalid
binding fails registration and rolls back its transaction. No actor is selected
solely by role/status, and no applied migration was edited.

Added Jest service, API, duplicate-classification and audit-binding tests.
Verification: `npm.cmd test` from `src` passed **8 suites and 63 tests** on
7 October 2026; `git diff --check` passed.
Service tests use mocks to verify transaction ownership, rollback calls,
duplicate handling and bounded identifier regeneration. These are not evidence
of actual MySQL rollback or concurrency. Live schema/index verification,
isolated MySQL repository/rollback/concurrent registration tests, confirmation
of the reserved actor binding and canonical audit conventions remain
integration/release evidence requirements for WF-001.
The DOCX approval/test-status records have not been promoted to PASS.

Reserved technical audit actor configuration
--------------------------------------------

WF-001 requires a reserved technical actor for its mandatory account-creation
audit record. `AUDIT_ACTOR_CONFIGURATION_ERROR` means the actor identifier is
missing/empty in the running configuration or does not match exactly one user
with the required SYSTEM_ADMINISTRATOR/DISABLED/SYSTEM characteristics.
Registration rolls back when this audit prerequisite fails.

The initial migration, `db/migrations/v1.0_participant-account-schema.sql`,
inserts a user named `System Audit Actor`. Its `account_identifier` is generated
when the INSERT executes using:

```sql
CONCAT('A-', REPLACE(UUID(), '-', ''))
```

The actual identifier is therefore stored in the database; it is not a fixed
value in the migration file. Run this read-only query in the application's
configured database:

```sql
SELECT user_id, account_identifier, name
FROM users
WHERE role_id = 'SYSTEM_ADMINISTRATOR'
  AND account_status = 'DISABLED'
  AND authentication_method = 'SYSTEM';
```

Verify the reserved `System Audit Actor` row, then copy its exact
`account_identifier` into `src/.env`:

```dotenv
SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER=A-<actual-database-value>
```

Replace the placeholder with the returned identifier. Restart the server from
`src` using `npm.cmd start`, then retry registration. `.env.example` documents
the setting; the running application needs it in `.env` or its deployment
environment.

If the query returns no rows, provision the reserved actor through the
controlled bootstrap process. If it returns several rows, verify the intended
reserved identity rather than choosing an arbitrary administrator. Do not rerun
the entire schema migration against an initialized database.

For a deployment where the actor has not yet been provisioned, the following
opaque identifier was proposed as an explicit provisioning value:

```dotenv
SYSTEM_AUDIT_ACTOR_ACCOUNT_IDENTIFIER=A-7b8f24c6d9314ea2a056cf193e82bd47
```

This is a proposal, not evidence of an existing database row. Provisioning must
use that same value for `users.account_identifier`, ensure it is unique, and
preserve the reserved actor's non-interactive configuration. Setting the
environment variable alone does not create the actor. When the initial
migration has already provisioned an actor, use its existing generated value
instead; do not edit an applied migration or replace its identity.

WF-002 Participant Authentication / Login
----------------------------------------

Implemented from the WF-002 backend v1.2 and UI v1.4 documents in
`docs/implementation-code`. The login page is `/login`; its public API is
`POST /api/v1/auth/participants/login`. Send only `email` and `password`.
Email is normalized; passwords are preserved exactly and are verified with
Argon2id without reapplying account-creation complexity rules.

Successful login returns only `{ userId, participantId, role, status, expiresAt }`
and sets a signed HttpOnly, SameSite=Lax session cookie. The session identifier
is never returned in JSON. Login requires an ACTIVE account, consistent canonical
PARTICIPANT role and exactly one linked participant profile. The browser redirects
to `/programs` only after HTTP 200. `/programs` is the approved future WF-007
target; that page remains unimplemented and currently returns 404.

### Database and configuration setup

1. Inspect the target database/migration history, then apply the new
   `db/migrations/v1.1_participant-authentication-schema.sql` once after v1.0.
   It adds `sessions` and `authentication_failures`; it does not modify v1.0.
   Do not apply it blindly if these tables already exist.
2. Configure the reserved audit actor identifier as documented above.
3. Set a unique `SESSION_SECRET` of at least 32 bytes in `src/.env` or the
   deployment secret store. Generate a secret locally, for example:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

   Keep the generated secret out of source control and shared logs.
4. Cookies default to Secure. For local development using plain HTTP only, set
   `SESSION_COOKIE_SECURE=false`; HTTPS deployments should use `true`.
   Production startup rejects an insecure cookie configuration.
5. Restart from `src` using `npm.cmd start`. Startup validates configuration,
   the reserved actor, failure-history table and session-store availability.

### Troubleshooting SESSION_CONFIGURATION_ERROR

If startup reports:

```text
Application startup failed { code: 'SESSION_CONFIGURATION_ERROR' }
```

Check `src/.env`. The configuration validator rejects a missing, empty or
shorter-than-32-byte `SESSION_SECRET`. It also rejects
`SESSION_COOKIE_SECURE=false` when `NODE_ENV=production`.
The observed development startup failure was caused by a missing secret.

Generate a unique secret using the command in the setup section, then add it
to `src/.env`. For local development over HTTP:

```dotenv
SESSION_SECRET=<paste-generated-value>
SESSION_COOKIE_SECURE=false
```

Replace the placeholder with the generated value; do not use it literally.
Use `SESSION_COOKIE_SECURE=true` for HTTPS production. Keep the secret out of
source control and shared logs; `.env.example` should contain only an empty
secret setting, not an actual secret.

Restart the application from `src`:

```powershell
npm.cmd start
```

The server loads `.env` from its working directory. Values already set in the
process environment take precedence, so check deployment/environment overrides
if editing `src/.env` does not resolve the error. A valid configuration fixes
this error without changing application code.

### Authentication and session behavior

The user row is locked while each attempt is coordinated. Failed credentials
persist timestamped history; five failures within a rolling 15-minute window
set a 15-minute temporary lockout. The fifth failed credential response is 401;
subsequent attempts during the lockout return 423. Successful login clears the
failure history/counters, clears temporary lockout and updates `last_login_at`.
INACTIVE returns generic 401; LOCKED/DISABLED and active temporary lockout
return sanitized 423. Unknown email and wrong credentials share a generic 401.

The shared MySQL coordinator commits session creation, successful-login state
and mandatory audit together. Rejected outcomes commit their counters/audit;
infrastructure errors roll back. Cookie emission happens only after commit and
successful response serialization. Unpublished sessions are invalidated on
commit/response failures. Each successful login generates a fresh session ID
and replaces the previous signed browser session within the transaction.

Session data stores the authenticated user/participant identity, role, a random
server-issued CSRF token and an 8-hour absolute deadline. The shared session
store's `load(req)` checks current account/profile eligibility, enforces the
30-minute idle timeout and refreshes idle expiry without extending the absolute
deadline. Future protected routes must call this shared session mechanism and
enforce the server-issued CSRF token on authenticated state-changing requests.
Login itself does not require a pre-existing authenticated CSRF token.
`invalidate(sessionId)` provides session invalidation for future logout wiring;
no new logout endpoint is introduced by this login feature. Expired sessions
are purged at startup and every minute while the server is running.

Authentication audit events use `AUTHENTICATION_SUCCEEDED` / `SUCCESS` and
`AUTHENTICATION_FAILED` / `FAILURE`, entity type `USER_AUTHENTICATION`, scope
`PARTICIPANT`, and classification `PERSONAL_DATA`. Success is attributed to the
authenticated user; rejected unauthenticated attempts use the configured
reserved technical actor. Unknown attempts use entity reference `ANONYMOUS`.
Credentials, password hashes, supplied email and session IDs are excluded from
these audit rows.

The shared transaction, timestamp history, reserved anonymous audit actor,
INACTIVE-to-401 mapping and `/programs` navigation binding were explicitly
approved during WF-002 implementation. No WF-007 page or API is included.

### WF-002 verification

On 7 October 2026, **18 suites and 148 tests passed**, including the existing
WF-001 tests and an isolated MySQL 8.4 integration suite. Coverage includes
request validation, response identities, generic failures, role/status/profile
checks, cookie attributes and delivery order, rollback/cleanup, idle/absolute
expiry, browser outcomes, concurrent failed attempts and the rolling window.
Live MySQL tests verified that session/audit insert failures leave no session
or successful-login timestamp. Tests did not apply migrations to the application
database or provide production/release approval.

Run `npm.cmd test` from `src` for the normal suite; MySQL integration is skipped
unless explicitly enabled against a disposable MySQL instance. To enable it,
set `WF002_TEST_DB_HOST`, `WF002_TEST_DB_PORT`, `WF002_TEST_DB_USER`,
`WF002_TEST_DB_PASSWORD`, and `WF002_TEST_DB_NAME` before running Jest.
The test database name must match `tms_wf002_<unique-name>_test` and must not
already exist. The suite creates a fresh schema, runs both migrations and uses
failure-injection triggers. Use a disposable instance with permissions to create
the schema and triggers; remove that instance after testing. These test settings
are separate from the application's `DB_*` configuration.

WF-004 System Administrator Authentication
------------------------------------------

Implemented from the WF-004 backend v1.2 and UI v1.4 documents in
`docs/implementation-code`. Open `/admin/login`; the public API is
`POST /api/v1/auth/system-admin/login`. Submit only `email` and `password`.
Generated/supplied usernames and the bootstrap static key are not login inputs.
Email is normalized; the password is preserved and verified against Argon2id
without applying account-creation complexity rules.

Success returns exactly `{ userId, role, status, expiresAt }` with canonical role
`SYSTEM_ADMINISTRATOR`, ACTIVE status and UTC expiry. The browser receives a
signed HttpOnly, SameSite=Lax cookie; Secure behavior follows existing deployment
configuration. Session identifiers, hashes and secrets are excluded from JSON.

Both login endpoints now use one shared authentication composition, coordinator,
credential verifier, database pool/session store and error handler. The
administrator endpoint applies its own role policy and response projection;
participant login still requires its linked participant profile and returns
`participantId`. The common session loader supports the implemented PARTICIPANT
and SYSTEM_ADMINISTRATOR roles, checks current role/status, rejects SYSTEM
technical actors, and requires no participant profile/identity on an administrator
session. It retains 30-minute idle and 8-hour absolute expiry, cookie rotation and
unpublished-session cleanup.

Shared login behavior remains: only ACTIVE may authenticate; INACTIVE returns
401; LOCKED/DISABLED and current temporary lockout return 423; unknown email and
wrong credentials share generic 401. Five failures in a rolling 15-minute window
trigger 15-minute lockout. Session, successful-login state and authentication
audit commit together before cookie delivery. Session/audit persistence failures
return sanitized 500 without a cookie. Login does not require a pre-existing
authenticated CSRF token; WF-005 account creation uses the stored server-issued
token through the `X-CSRF-Token` header.

Administrator login reuses `AUTHENTICATION_SUCCEEDED`/`AUTHENTICATION_FAILED`
audit events with scope `ALL_ADMINISTRATIVE_USERS` and administrator-specific
summary text. Successful events reference the authenticated administrator;
unauthenticated failures use the configured reserved technical actor. Participant
authentication audit scope/text remains unchanged.

No new migration, role defaults, deployment secrets, logout endpoint or
user-management page is introduced. The existing WF-002 session schema,
`SESSION_SECRET`, cookie configuration and reserved actor are prerequisites;
the administrator account may be provisioned by WF-003. After HTTP 200 the
browser navigates to `/admin/users`, the user-management destination in
`src/config/ui.js`. WF-005 now implements its protected account-creation page.

Run `npm.cmd test` from `src` for unit/API/DOM tests. Isolated MySQL tests use
`WF004_TEST_DB_HOST`, `WF004_TEST_DB_PORT`, `WF004_TEST_DB_USER`,
`WF004_TEST_DB_PASSWORD`, and a fresh `WF004_TEST_DB_NAME` matching
`tms_wf004_<unique-name>_test`. They create a fresh schema in a disposable instance,
bootstrap an administrator, and verify login, role/status rejection, concurrent
lockout, session/audit rollback, rotation, live session eligibility and timeouts.

Verification on 7 October 2026: **30 suites and 263 tests passed**, including
isolated MySQL WF-002, WF-003 and WF-004 suites. The application database was
not modified; disposable test infrastructure was removed after verification.
`git diff --check` passed. These checks are implementation evidence, not formal
production/release approval.

WF-003 System Administrator Bootstrap
-------------------------------------

Implemented from the WF-003 backend v1.2 and UI v1.4 implementation documents
and WF-003 implementation specification v1.3. Open `/admin/bootstrap` to create
the initial eligible System Administrator. The public API is
`POST /api/v1/auth/system-admin/bootstrap` and accepts only:

```json
{
  "staticAdministrationKey": "<deployment-key>",
  "username": "administrator-entered-username",
  "name": "Administrator Name",
  "email": "administrator@example.test",
  "password": "<password-meeting-creation-policy>"
}
```

Username is required, administrator-entered and unique; it is not derived from
email or name. The server generates `A-<ULID>`, assigns canonical
`SYSTEM_ADMINISTRATOR` role and ACTIVE status, and hashes the password with
Argon2id. Username/name/email limits are 100/200/254 characters. Password uses
the existing creation policy: at least 12 characters with uppercase, lowercase,
digit and non-alphanumeric character.

### WF-003 configuration

Set `STATIC_ADMINISTRATION_KEY` to a unique deployment-secret value in `src/.env`
or the deployment secret store. Use the random generation command in the session
setup section to generate a separate key; do not reuse `SESSION_SECRET`.
Missing deployment configuration fails closed with sanitized 500. When a key
is configured, missing/invalid submitted keys return generic 401.

Copy these approved initial role defaults from `.env.example` to `src/.env`:

```dotenv
SYSTEM_ADMINISTRATOR_PERMISSIONS_JSON='["ADMIN_USER_CREATE","ADMIN_USER_READ","ADMIN_USER_UPDATE"]'
SYSTEM_ADMINISTRATOR_ACCESS_SCOPE_JSON='["ALL_ADMINISTRATIVE_USERS"]'
SYSTEM_ADMINISTRATOR_RESPONSIBILITIES_JSON='["MANAGE_ADMINISTRATIVE_USERS"]'
```

The configured reserved audit actor must already exist. Restart the application
after configuration changes. No WF-003 migration is required: the existing
`users` and `audit_records` schema supports bootstrap, and the concurrency gate
uses MySQL advisory locks. Existing WF-002 startup/session prerequisites still
apply. Static administration keys and actual session secrets must remain out of
source control; the example configuration contains empty secret placeholders.

### WF-003 consistency, audit and navigation

A database-scoped MySQL advisory lock covers the eligibility check and the
account/audit transaction, including the case where no active administrator
row exists. Bootstrap is allowed only when no ACTIVE SYSTEM_ADMINISTRATOR
exists. The reserved DISABLED/SYSTEM actor does not block bootstrap. A lock
acquisition failure returns sanitized 500; a connection whose lock cannot be
released is discarded rather than returned to the pool.

Duplicate username/email and an existing active administrator return sanitized
409. Exact unique-index names from v1.0 are used; arbitrary duplicate values are
never treated as constraint names. Generated account-identifier collisions retry
at most three times. All successful account/audit writes use one connection and
transaction; failures roll back. Unsafe numeric response IDs fail before commit.

The reserved technical actor attributes the successful `ACCOUNT_CREATED` event
for entity `SYSTEM_ADMINISTRATOR_ACCOUNT`; scope is `ALL_ADMINISTRATIVE_USERS`
and classification is `PERSONAL_DATA`. Rejected 401/409 outcomes produce a
separate `BOOTSTRAP_REJECTED` / `FAILURE` event with reference `ANONYMOUS` after
any bootstrap transaction is rolled back. No submitted key, password or hash
is stored in audit rows or returned/logged. Failed rejection-audit persistence
returns sanitized 500 rather than claiming a fully audited rejection.

Success returns exactly
`{ userId, accountIdentifier, username, role, accountStatus, createdAt }`
with HTTP 201. No participant profile, session cookie or notification is
created. The browser clears both secrets and navigates to `/admin/login`.
That destination now serves WF-004 System Administrator Login. Bootstrap itself
does not authenticate the newly created administrator.

The advisory-lock gate, duplicate username/email mapping, technical audit actor,
ACTIVE role defaults and UI URLs were explicitly approved during implementation.

### WF-003 tests

Verification on 7 October 2026: **26 suites and 216 tests passed**, including
both WF-002 and WF-003 isolated MySQL suites. Concurrent bootstrap returned one
201 and one 409 with one committed active administrator; injected user/audit
failures left no partial account. The application database was not modified.
`git diff --check` passed.

Run `npm.cmd test` from `src` for unit/API/DOM tests. Isolated MySQL verification
is enabled with `WF003_TEST_DB_HOST`, `WF003_TEST_DB_PORT`,
`WF003_TEST_DB_USER`, `WF003_TEST_DB_PASSWORD`, and `WF003_TEST_DB_NAME`.
Use a disposable instance and a fresh database named
`tms_wf003_<unique-name>_test`; the suite refuses an existing database. It applies
the existing migrations only in the fresh test schema, injects account/audit
failures, and checks concurrent bootstrap, duplicates, credential hashing,
rejection audit and the absence of participant profiles and sessions.

WF-005 Administrative User Creation
----------------------------------

Implemented from the WF-005 backend v1.2 and UI v1.4 implementation documents.
Sign in through `/admin/login`, then open `/admin/users`. Both the page and
`POST /api/v1/admin/users` require an ACTIVE SYSTEM_ADMINISTRATOR session.
The page supplies the session's CSRF token to the API as `X-CSRF-Token`.
Missing or invalid tokens return 403 and create a `CSRF_REJECTED` audit event.

The API accepts exactly `username`, `name`, `email`, `password` and `role`.
Allowed roles are TRAINING_ADMINISTRATOR and TRAINER. Username/name/email limits
are 100/200/254 characters. Passwords require at least 12 characters including
uppercase, lowercase, digit and non-alphanumeric character, and use Argon2id.
The server generates `A-<ULID>`, assigns ACTIVE status, and derives role controls
from the approved deployment defaults below. Copy these values from
`src/.env.example` into `src/.env` or deployment configuration and restart:

```dotenv
TRAINING_ADMINISTRATOR_PERMISSIONS_JSON='["PROGRAM_MANAGE","CATEGORY_MANAGE","REGISTRATION_READ","REPORT_GENERATE"]'
TRAINING_ADMINISTRATOR_ACCESS_SCOPE_JSON='["ALL_TRAINING_OPERATIONS"]'
TRAINING_ADMINISTRATOR_RESPONSIBILITIES_JSON='["MANAGE_PROGRAMS","MANAGE_CATEGORIES","VIEW_REGISTRATIONS","GENERATE_REPORTS"]'
TRAINER_PERMISSIONS_JSON='["ASSIGNED_PROGRAM_READ","ASSIGNED_REGISTRATION_READ","ATTENDANCE_RECORD","CERTIFICATE_ISSUE"]'
TRAINER_ACCESS_SCOPE_JSON='["ASSIGNED_PROGRAMS"]'
TRAINER_RESPONSIBILITIES_JSON='["VIEW_ASSIGNED_PROGRAMS","VIEW_ASSIGNED_REGISTRATIONS","RECORD_ATTENDANCE","ISSUE_CERTIFICATES"]'
```

Missing or malformed role configuration fails closed with sanitized 500.
Existing session and audit configuration remains required; no new migration is
needed. Success returns HTTP 201 with exactly `userId`, `accountIdentifier`,
`username`, `name`, `email`, `role`, `accountStatus` and `createdAt`. The form
clears after success and remains on `/admin/users`.

Duplicate username/email returns 409; invalid input returns 400; missing or
expired authentication returns 401; disallowed creator/target role returns 403.
Account insertion and the `ACCOUNT_CREATED` audit commit in one transaction,
attributed to the authenticated administrator. The creator and session are
rechecked and locked inside that transaction. User or audit failures roll back
both writes. Passwords, hashes and CSRF tokens are excluded from audit output.
Creation does not provision a participant profile or authenticate the new user.

Run `npm.cmd test` from `src`. Live MySQL tests use `WF005_TEST_DB_HOST`,
`WF005_TEST_DB_PORT`, `WF005_TEST_DB_USER`, `WF005_TEST_DB_PASSWORD` and a fresh
`WF005_TEST_DB_NAME` matching `tms_wf005_<unique-name>_test`. Use a disposable
instance: the suite refuses existing schemas and applies migrations only to its
fresh test database. Coverage includes the bootstrap/login/page/create flow,
both staff roles, CSRF auditing, concurrent duplicates, creator/session rechecks,
and rollback after injected account/audit failures.

Verification on 7 October 2026: **35 suites and 330 tests passed**, including
live isolated MySQL WF-002 through WF-005 suites. The application database was
not modified. `git diff --check` passed.

WF-006 Staff Authentication
---------------------------

Implemented from the WF-006 backend v1.2 and UI v1.4 documents. Open
`http://localhost:3000/staff/login` for Training Administrator or Trainer login.
System Administrator login remains at `/admin/login`.

`POST /api/v1/auth/staff/login` accepts only `email` and `password`. Only ACTIVE
TRAINING_ADMINISTRATOR and TRAINER accounts can authenticate. Success returns
exactly `{ userId, role, status, expiresAt }` with HTTP 200 and a signed HttpOnly,
SameSite=Lax cookie (Secure according to existing deployment configuration).
The browser redirects by the canonical response role: Training Administrator to
`/admin/programs`, Trainer to `/trainer/programs`. These destination pages are
reserved for their separate workflows and currently return 404. WF-006 provides
login and authentication, without implementing those pages.

The shared authentication transaction commits successful-login state, session
and audit together. Five credential failures within 15 minutes trigger a
15-minute lockout. Unknown email, invalid credentials, INACTIVE and disallowed
roles return generic 401; LOCKED, DISABLED and temporary lockout return 423.
Validation returns 400 and infrastructure errors return sanitized 500 without
issuing a cookie. Login accepts existing passwords without reapplying creation
complexity rules. Staff sessions recheck live role/status and use the existing
30-minute idle and 8-hour absolute timeouts and shared invalidation adapter.
No new logout endpoint is introduced.

Authentication audit events reuse `AUTHENTICATION_SUCCEEDED` and
`AUTHENTICATION_FAILED`. Successful events use the staff user as actor and scope
`ALL_TRAINING_OPERATIONS` for Training Administrator or `ASSIGNED_PROGRAMS` for
Trainer. Rejected attempts use scope `STAFF` and the configured reserved technical
actor. Credentials, hashes and session identifiers are excluded. These navigation
and audit bindings were approved during implementation.

No new migration or environment variable is required. Existing session, database
and reserved audit actor configuration applies. Staff accounts are provisioned
through WF-005. Restart the Node server after updating code; `npm start` does not
reload route changes automatically.

Run `npm.cmd test` from `src`. Isolated live verification uses
`WF006_TEST_DB_HOST`, `WF006_TEST_DB_PORT`, `WF006_TEST_DB_USER`,
`WF006_TEST_DB_PASSWORD` and a fresh `WF006_TEST_DB_NAME` matching
`tms_wf006_<unique-name>_test`. Use a disposable MySQL instance; existing schemas
are refused. Tests cover both staff roles, WF-005-created accounts, forbidden
roles, credential failures, concurrent lockout, audit/session rollback, cookie
rotation, expiry, invalidation, browser safety and route delivery.

Verification on 7 October 2026: **39 suites and 390 tests passed**, including live
isolated MySQL WF-002 through WF-006 suites. The disposable test container was
removed; the application database was not modified. `git diff --check` passed.
