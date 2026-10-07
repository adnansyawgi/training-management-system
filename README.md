# training-management-system

## First System Administrator — approved CR-001 bootstrap

CR-001 requires a controlled, non-public, one-time bootstrap for the first
System Administrator. Do not use normal registration, a manual database INSERT,
or the superseded Static Administration Key flow.

The approved bootstrap is implemented with an application-level loopback-only
TCP peer guard. Invoke it on the application host using `127.0.0.1` or `::1`;
remote callers receive 403, and forwarding headers do not grant access.

Before invoking it, apply
`db/migrations/v1.7_cr001_system_admin_bootstrap_state.sql` once to the intended
database after the existing schema migrations, configure the approved email,
and restart the application. Review migration history first; do not rerun an
already-applied migration. No application database was migrated automatically.

### 1. Configure the approved email on the server

Set the deployment-specific value in protected server configuration, such as
`src/.env`:

```dotenv
SYSTEM_ADMIN_BOOTSTRAP_APPROVED_EMAIL=admin@yourcompany.com
```

Use the actual approved address only in protected deployment configuration.
Never commit it, expose it to the browser or an API, log it, or store it in the
bootstrap-state table. The address above is illustrative; `src/.env.example`
documents the configuration name.

### 2. Invoke the controlled bootstrap

From the application host, invoke the endpoint through its loopback address:

```http
POST /api/v1/auth/system-admin/bootstrap
Content-Type: application/json
```

```json
{
  "username": "sysadmin",
  "name": "System Administrator",
  "email": "admin@yourcompany.com",
  "password": "<strong-password>"
}
```

Replace the example email and password with approved deployment inputs. Submit
only these four fields; `staticAdministrationKey` is prohibited by CR-001.
There must be no public administrator-registration button, bootstrap page or
ordinary navigation link. Email comparison alone does not establish the
required non-public access boundary.

### 3. Validate, commit and permanently close bootstrap

The backend must acquire concurrency protection, check durable completion state,
validate the existing administrative account rules and compare the normalized
submitted email internally with the protected configured email. A mismatch
must be rejected without revealing the configured value.

On success, the approved implementation hashes the password with existing
Argon2id handling and atomically creates one ACTIVE `SYSTEM_ADMINISTRATOR`,
records the mandatory audit event and persists permanent completion in MySQL.
HTTP 201 follows commit. Account, audit or completion-persistence failure must
roll back; concurrent valid attempts may produce at most one successful creation.

Every later bootstrap attempt must be rejected, even if the initial administrator
is disabled, deleted or otherwise changed. Do not manually insert the first
administrator or reset completion state to bypass this lifecycle.

After provisioning, sign in through `/login` and use the System Administrator
dashboard's existing user-management function for subsequent account creation
only where existing approved roles and permissions permit it. CR-001 does not
expand which account roles that function may create.

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
to `/programs` only after HTTP 200. WF-007 now implements this public catalogue
page; apply its v1.2 migration before opening the page.

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
approved during WF-002 implementation. WF-007 later adds the public catalogue page and API.

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
Generated/supplied usernames are not login inputs.
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

WF-003 System Administrator Bootstrap — superseded by CR-001
-----------------------------------------------------------

Use the CR-001 approved-email instructions at the top of this README. The public
bootstrap page, static administration key and old browser bootstrap form/script
have been removed. The retained API is loopback-only. The signed bootstrap-state
foreign key matches `users.user_id`; `ON DELETE SET NULL` preserves permanent
completion if the initial administrator is deleted. No public reset API exists.
The existing MySQL advisory lock serializes bootstrap attempts; account creation,
mandatory audit and completion update share one transaction. Missing/invalid
approved-email configuration fails bootstrap safely with a sanitized 500.

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
`/admin/programs`, Trainer to `/trainer/programs`. WF-011 implements the Training Administrator destination; WF-013 now implements
the Trainer assigned-program destination. WF-006 provides
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

WF-007 Browse Available Training Programs
-----------------------------------------

Implemented from the WF-007 backend v1.2 and UI v1.4 documents. The public
catalogue is available at `/programs`, including the destination after Participant
login. `GET /api/v1/programs` requires no session and performs no mutation.

### WF-007 database setup

Apply `db/migrations/v1.2_program-catalogue-schema.sql` once after v1.0 and v1.1
in the intended deployment database. It adds the SDD v1.16 `program_categories`,
`training_programs` and `registrations` tables with their foreign keys, unique
constraints, checks and indexes. The registrations table supports the derived
seat count; this feature does not add registration or program-management APIs.
The migration provisions no sample records. Existing database configuration is
reused; no new environment settings are required. Restart the server after code
updates. Missing tables return a sanitized 500 until the migration is applied.

### WF-007 catalogue rules and API

The approved public predicate includes OPEN and CLOSED programs belonging to
ACTIVE categories. Full programs remain visible. `availableSeats` is capacity
minus the number of REGISTERED registrations; CANCELLED history is excluded.
No separate seat-count column is maintained. Categories for the filter are loaded
from ACTIVE category records when the page renders.

The API accepts exactly these query parameters:

- `page`: positive integer, default 1.
- `pageSize`: integer 1 through 100, default 20.
- `categoryId`: positive safe JSON-compatible ID.
- `availability`: `AVAILABLE` (remaining seats greater than zero) or `FULL`
  (remaining seats zero or less). Omit it to include both.
- `sort`: `DATE_ASC` (default), `DATE_DESC`, `NAME_ASC` or `NAME_DESC`; ties always
  use ascending `program_id`.

Count and rows use the same read-only REPEATABLE READ snapshot. Filter values,
limits and offsets are parameterized, and sort expressions come from a static
allow-list. Invalid, duplicate or unknown filters return 400. No matches and
pages beyond the last match return 200 with empty items and the matching total.
Database or invalid response-data failures use the common sanitized 500 contract.

Success is exactly `{ items, page, pageSize, total }`. Each item contains only
`programId`, `code`, `name`, `categoryId`, `categoryName`, `trainingDate`,
`startTime`, `endTime`, `venue`, `deliveryMode`, `capacity`, `availableSeats`,
`status`, `registrationOpenAt` and `registrationCloseAt`. Date-only values are
`YYYY-MM-DD`, times are `HH:mm:ss`, and registration timestamps are ISO UTC.
Unsafe response IDs fail closed rather than being rounded. Trainer identity and
private program fields are excluded.

The browser uses bounded pages of 20, resets to page 1 when filters change,
prevents overlapping requests and displays fixed safe error/empty messages.
Program text uses DOM textContent and category names use escaped EJS.
View Details links target `/programs/:programId`, now implemented by WF-008.
The catalogue rules, schema and
UI bindings were approved during implementation. No catalogue audit event or
notification is introduced by this read-only workflow.

### WF-007 verification

Run `npm.cmd test` from `src`. Live verification uses `WF007_TEST_DB_HOST`,
`WF007_TEST_DB_PORT`, `WF007_TEST_DB_USER`, `WF007_TEST_DB_PASSWORD` and a fresh
`WF007_TEST_DB_NAME` matching `tms_wf007_<unique-name>_test`. Use a disposable
MySQL instance; the suite refuses existing schemas and applies v1.0 through v1.2
only in the new test database. It tests migration constraints, visibility,
REGISTERED/CANCELLED seat calculations, filters, sorting, pagination, public
page rendering and count/data consistency during a concurrent committed change.

Verification on 7 October 2026: **44 suites and 445 tests passed**, including
live isolated MySQL WF-002 through WF-007 suites. The application database was
inspected read-only and was not modified. The disposable test container was
removed. `git diff --check` passed. This is implementation evidence, not formal
production/release approval.

WF-008 View Training Program Details
------------------------------------

Implemented from the WF-008 backend v1.2 and UI v1.4 documents. Open
`/programs/:programId` from the catalogue's View Details link. The page is public
and loads `GET /api/v1/programs/:programId`. No new migration or environment
setting is required; the WF-007 v1.2 schema must already be applied.

Details share the WF-007 public predicate: OPEN/CLOSED programs in ACTIVE
categories. Missing and non-visible records return the same 404. Positive safe
integer IDs are required; malformed/unsafe IDs and unknown query fields return
400. Unexpected database/response failures return sanitized 500. The HTML page
is a public shell; its API request determines whether the program is visible.

Success contains exactly 25 fields: `programId`, `code`, `name`, `description`,
`objectives`, `targetAudience`, `prerequisites`, `categoryId`, `categoryName`,
`trainerName`, `trainingDate`, `startTime`, `endTime`, `venue`, `deliveryMode`,
`capacity`, `availableSeats`, `status`, `registrationOpenAt`,
`registrationCloseAt`, `cancellationPolicyReference`,
`certificateEligibilityCriteria`, `certificateType`, `createdAt` and `updatedAt`.
Only the trainer display name is public; trainer ID, email, credentials and
account controls are excluded. Dates, times and UTC timestamps use the existing
response codecs. Nullable optional values remain null in the API.

A single parameterized SELECT reads detail and derives available seats from
capacity minus current REGISTERED registrations. CANCELLED history is excluded.
The page renders values using textContent. Back returns to `/programs`.
Register is shown only for OPEN programs with seats remaining, and navigates to
`/programs/:programId/register`, now implemented by WF-009. Browser visibility does not establish registration
eligibility: WF-009 must authenticate and revalidate role, window and capacity
before creating any registration. This workflow adds no writes, session, audit
or notification events.

Run `npm.cmd test` from `src`. Live verification uses `WF008_TEST_DB_HOST`,
`WF008_TEST_DB_PORT`, `WF008_TEST_DB_USER`, `WF008_TEST_DB_PASSWORD` and a fresh
`WF008_TEST_DB_NAME` matching `tms_wf008_<unique-name>_test`. The suite creates a
fresh disposable schema using existing migrations, checks public visibility,
current seat counts, nullable detail data, trainer privacy and the absence of
registration/session/audit writes. Existing application data is not modified.

Verification on 7 October 2026: **48 suites and 484 tests passed**, including
live isolated MySQL WF-002 through WF-008 suites. The disposable test container
was removed; the application database was not modified. `git diff --check` passed.

WF-009 Participant Program Registration
---------------------------------------

Implemented from the WF-009 backend v1.2 and UI v1.4 documents. Participants
open `/programs/:programId/register` using the Register link from Program Details.
The protected confirmation page shows the selected program and session-linked
participant name/email; NRIC/Passport is masked except for its last four
characters (short values are fully masked). Cancel returns to Program Details.
Confirm Registration submits only a numeric `programId` and the existing
`X-CSRF-Token`. Success stays on the page with a confirmation message and disables
repeat submission.

`POST /api/v1/registrations` requires an ACTIVE PARTICIPANT session and valid
CSRF token. Participant identity is derived exclusively from the session; identity,
status and other extra body fields are rejected. Success returns exactly
`{ registrationId, referenceNo, programId, status, registeredAt }` with HTTP 201,
status REGISTERED and a server-generated `R-<ULID>` reference. Reference collisions
retry at most three times. Unsafe response IDs fail before transaction commit.

The transaction locks the participant first, rechecks live account/session state,
then locks the visible program. It validates existing mandatory participant data,
OPEN status, the UTC registration window (opening inclusive, closing exclusive),
active duplicate, remaining capacity and schedule overlap. Same-date schedules
use strict interval intersection; adjacent schedules are allowed. DATE/TIME
schedule fields share the configured business timezone, while persisted
registration-window DATETIME values represent UTC. CANCELLED registration history
does not block re-registration. Concurrent requests cannot exceed capacity or
bypass the same-participant overlap check. No administrator approval or waiting
list is introduced.

The registration, `REGISTRATION_CREATED` audit (participant actor and PARTICIPANT
scope) and notification outbox entry commit together. Failure rolls back all three.
Malformed requests return 400; missing/expired authentication returns 401;
disallowed roles/CSRF return 403; unknown/non-visible program returns 404;
duplicate/full/window/overlap returns 409; infrastructure errors return sanitized
500. CSRF rejections are audited without creating a registration. No raw identity,
credential, CSRF token or SMTP error text is stored in audit/failure output.

### WF-009 database and email setup

Apply `db/migrations/v1.3_registration-notification-outbox.sql` once after v1.2.
It adds the SDD notification_outbox table and a unique business-event key. The
application database is not automatically migrated. Until this table exists,
registration fails closed and rolls back rather than claiming success.

Copy the new deployment settings from `src/.env.example` into `src/.env` or the
secret store:

```dotenv
BUSINESS_TIMEZONE=Asia/Kuala_Lumpur
SMTP_HOST=<your SMTP host>
SMTP_PORT=587
SMTP_FROM=<sender email address>
SMTP_USER=<SMTP username, if required>
SMTP_PASSWORD=<SMTP password, if required>
```

Restart the web server and run the separate worker from the project root:

```powershell
npm.cmd run notifications --prefix src
```

The worker uses the approved Nodemailer dependency with verified TLS (implicit
TLS on port 465, required STARTTLS on other configured ports) and a 10-second
whole-delivery deadline. Transport behavior follows the
[Nodemailer SMTP documentation](https://nodemailer.com/smtp).
It processes only committed REGISTRATION_CONFIRMED outbox entries with subject
'Training registration confirmed'. The recipient is the linked user email; the
payload contains only reference, program name and schedule. No NRIC/Passport or
credential is included. Email failure leaves registration committed and records
safe retry state. Initial delivery plus three retries use 1/2/4-minute backoff,
then FAILED. Missing SMTP configuration stops only the worker; registration can
continue queuing committed notifications.

Workers claim rows using FOR UPDATE SKIP LOCKED, recover PROCESSING leases older
than 60 seconds and fence completion by attempt count. A stable message ID helps
identify retries. SMTP delivery is at least once: a crash after provider acceptance
and before recording SENT can lead to a repeated email; registration remains
unique and committed. SMTP secrets are never included in logs or source control.

### WF-009 tests

Run `npm.cmd test` from `src`. Isolated MySQL verification uses
`WF009_TEST_DB_HOST`, `WF009_TEST_DB_PORT`, `WF009_TEST_DB_USER`,
`WF009_TEST_DB_PASSWORD` and a fresh `WF009_TEST_DB_NAME` matching
`tms_wf009_<unique-name>_test`. It refuses an existing schema and applies v1.0
through v1.3 in a disposable database. Tests cover last-seat contention, concurrent
duplicates and overlaps, adjacent schedules, cancelled history, window/state
rejection, mandatory-write rollback, masking, session/CSRF rechecks and concurrent
outbox claims/retry recovery. SMTP uses a mock transport; no real email is sent.

Verification on 7 October 2026: **53 suites and 548 tests passed**, including
live isolated MySQL WF-002 through WF-009 suites. Application schema inspection
was read-only; application data was not modified. The disposable test container
was removed and no real email was sent. `git diff --check` passed.

WF-010 Participant Registration Cancellation
--------------------------------------------

Implemented from the WF-010 backend v1.2 and UI v1.4 documents. Sign in as a
Participant and open `/registrations` for My Registrations. The page and APIs
reuse the existing session and CSRF controls. No new migration, dependency or
environment setting is needed; existing registration/session/audit tables and
`BUSINESS_TIMEZONE` (default Asia/Kuala_Lumpur) are reused.

`GET /api/v1/registrations` accepts exactly `page`, `pageSize`, `status` and
`sort`. Pagination defaults to page 1 and 20 records; maximum page size is 100.
Status is REGISTERED or CANCELLED; omit it to include both. Approved sort values
are REGISTERED_AT_DESC (default), REGISTERED_AT_ASC, DATE_ASC and DATE_DESC;
registration_id ascending breaks ties. Filters are parameterized and count/data
use one read-only consistent snapshot. Ownership is bound to the signed-in user,
never a client query field. Invalid, duplicate or unknown filters return 400;
empty results and pages beyond the last match return 200 with empty items.

The response is `{ items, page, pageSize, total }`. Each item has exactly 12
fields: `registrationId`, `referenceNo`, `programId`, `programCode`, `programName`,
`trainingDate`, `startTime`, `endTime`, `registeredAt`, `status`, `cancelledAt`
and `cancellationReason`. No participant identity or cancellationEligible flag
is returned. Date-only/time-only and UTC timestamp formatting reuse the shared
response codecs. My Registrations derives browser Cancel visibility from status
and schedule, with server eligibility remaining authoritative. The UI uses the
500-character backend reason limit, correcting the UI document's stale 1,000
character example and extra cancellationEligible assumption without changing
the approved API projection.

`POST /api/v1/registrations/:registrationId/cancel` accepts only optional
`cancellationReason` (maximum 500 characters). Omitted, null or empty reason is
stored as null. The API requires an ACTIVE PARTICIPANT session and a valid
`X-CSRF-Token`. Existing foreign-owned registrations return 403; unknown records
return 404; inactive registrations and attempts at/after scheduled start return
400. Missing/expired sessions return 401; CSRF rejection returns audited 403;
SQL/audit/configuration failures return sanitized 500.

Cancellation locks participant, then program, then registration, sharing WF-009's
lock order. Live account/session state and ownership are rechecked before any
write. It changes only status to CANCELLED, cancellation timestamp/reason and
updated timestamp; it retains history and releases the generated active key.
The successful response is exactly
`{ registrationId, referenceNo, status, cancelledAt }`. Registration update and
REGISTRATION_CANCELLED audit commit together using the participant user actor
and PARTICIPANT scope. Audit failure rolls back the change. No cancellation
notification or outbox record is created. Subsequent WF-009 re-registration
remains subject to current window, capacity and overlap rules.

Program DATE/TIME schedule values are interpreted in configured BUSINESS_TIMEZONE
and compared with the current instant using strict `now < scheduled start`.
The shared server/browser helper avoids host-local timezone assumptions, rejects
invalid schedules and chooses the earlier occurrence of an ambiguous DST time
conservatively. The Malaysia deployment uses Asia/Kuala_Lumpur.

The page provides status/sort filters, bounded Previous/Next, View links and a
separate confirmation panel with an optional reason. Back closes that panel
without submitting. Successful cancellation closes it and refreshes the list.
Pending requests prevent repeat submissions; errors use fixed safe text and
leave retry available. API errors use the approved 400 outcome for an ineligible
cancellation, correcting the UI example's stale 409 mapping. These page, sorting
and audit bindings were approved during implementation.

Run `npm.cmd test` from `src`. Isolated MySQL verification uses
`WF010_TEST_DB_HOST`, `WF010_TEST_DB_PORT`, `WF010_TEST_DB_USER`,
`WF010_TEST_DB_PASSWORD` and a fresh `WF010_TEST_DB_NAME` matching
`tms_wf010_<unique-name>_test`. Tests cover ownership, exact list projection,
filter/pagination boundaries, cancellation eligibility, reason length,
concurrent cancellation and re-registration, key/seat release, history retention,
audit rollback and browser/timezone behavior. Test schemas are disposable;
application data is not modified.

Verification on 7 October 2026: **57 suites and 605 tests passed**, including
live isolated MySQL WF-002 through WF-010 suites. The application database was
not modified and no real email was sent. The disposable test container was
removed. `git diff --check` passed.


WF-011 Training Program & Category Management
--------------------------------------------

Sign in as a **Training Administrator** at `/staff/login`, then open
`/admin/programs` or `/admin/categories`. System Administrators, Trainers and
Participants cannot use these pages or their write APIs.

Implemented from the WF-011 backend v1.2 and UI v1.4 documents with the approved
bindings. No additional migration is required: apply existing migrations v1.0
through v1.3. The management pages render server-paginated tables (20 records by
default; maximum 100), category selectors and ACTIVE Trainer selectors (100 per
lookup page). No new list or lookup APIs were introduced.

- `POST /api/v1/admin/programs` creates a program; omitted capacity defaults to 20.
- `PUT /api/v1/admin/programs/:programId` requires every non-optional mutable
  field. Code and creation timestamp are immutable. Both responses contain
  `{program}` with the 25 public detail fields plus `trainerUserId`.
- `POST /api/v1/admin/categories` defaults omitted status to ACTIVE and returns
  the six category fields, including creation timestamp.
- `PUT /api/v1/admin/categories/:categoryId` requires name and status and returns
  the five category fields without creation timestamp. Duplicate category names
  and program codes return HTTP 409.

All writes require a valid session and `X-CSRF-Token`; authorization and session
validity are rechecked inside the transaction. Each write and its
PROGRAM_CREATED/UPDATED or CATEGORY_CREATED/UPDATED audit commit together with
ALL_TRAINING_OPERATIONS scope. Audit failure rolls back the business change.
There is no hard delete or program-change notification.

Allowed transitions are DRAFT ? OPEN/CANCELLED, OPEN ? CLOSED/CANCELLED and
CLOSED ? COMPLETED/CANCELLED. Terminal statuses cannot reopen. Saving the same
status is allowed. Capacity must be positive and cannot fall below active
registrations. Categories must exist; assigned Trainers must be ACTIVE.
Registration opening precedes closing, and closing cannot follow program start.

Forms display schedule/window inputs in `BUSINESS_TIMEZONE` (default
`Asia/Kuala_Lumpur`) and convert registration windows to explicit UTC timestamps
before sending them. The API validates trainer/venue overlaps and checks enrolled
participants' other active registrations when rescheduling. Management writes
use a database-scoped MySQL advisory lock; updates lock participants before the
program to coordinate with registration/cancellation and retry changed participant
sets or database deadlocks up to three attempts. MySQL deployments must permit
`GET_LOCK` and `RELEASE_LOCK`.

Verification on 7 October 2026: **59 suites and 627 tests passed**, including
live isolated MySQL WF-002 through WF-011 suites. WF-011 checks cover access
control, CSRF, DTOs, defaults, duplicate handling, lifecycle and capacity rules,
trainer/participant conflicts, concurrent creation, escaped management pages,
business-time conversion and rollback on audit failure. Tests use disposable
databases and do not send real email.


WF-012 Registration Management View
------------------------------------

Sign in as a **Training Administrator** at `/staff/login`, then open
`/admin/registrations` or follow Registrations from the program/category
management pages. Implemented from WF-012 backend v1.2 and UI v1.4 with approved
repository bindings. No migration or new environment setting is required.

- `GET /api/v1/admin/registrations` returns `{items,page,pageSize,total}`. Each
  item contains exactly registrationId, referenceNo, participantId, programId,
  registeredAt, status, cancelledAt and cancellationReason.
- `GET /api/v1/admin/registrations/:registrationId` returns those eight fields
  plus registrationRemarks. Missing records return 404.

Both APIs and the page require a live Training Administrator session, the
stored `REGISTRATION_READ` permission and `ALL_TRAINING_OPERATIONS` access scope.
Other roles receive 403; unauthenticated requests receive 401. Scope/permission
revocation takes effect on subsequent reads. Scope predicates apply consistently
to list rows, totals and details; count and rows use one read-only repeatable-read
snapshot. Operational registrations include cancelled history and records in
inactive categories or unpublished programs.

Optional filters are periodFrom, periodTo, programId, categoryId, participantId
and REGISTERED/CANCELLED status. Periods filter **registeredAt**, including
periodFrom and excluding periodTo, and accept ISO timestamps with explicit
zones. Forms convert `BUSINESS_TIMEZONE` inputs to UTC. Program, category and
student filters use positive numeric IDs; no lookup API or participant PII is
added. Unsafe IDs, duplicate query keys, unknown fields and invalid periods are
rejected with 400.

Pagination defaults to page 1 and 20 rows, capped at 100. Allowed sorts are
REGISTERED_AT_DESC (default), REGISTERED_AT_ASC, DATE_ASC and DATE_DESC, with
registrationId ascending as the deterministic tie-breaker. DATE sorts use the
program training date.

The page supports Search, Clear, View and Back. View fetches the detail endpoint
rather than reusing a list item. Values render through escaped EJS/textContent;
errors use fixed messages and stale responses cannot replace newer results.
This feature provides no administrative cancellation, approval, rejection,
editing, registration writes, read audits or notifications.

Verification on 7 October 2026: **62 suites and 674 tests passed**, including
live isolated MySQL WF-002 through WF-012 suites. WF-012 coverage includes exact
DTOs, filtering and UTC boundaries, deterministic pagination, all role exclusions,
permission/scope revocation, concurrent snapshot consistency, read-only behavior,
safe detail rendering, browser errors, pagination and stale-response handling.
The disposable test container was removed; the application database was unchanged.


WF-013 Attendance Management
------------------------------

Implemented from WF-013 backend v1.2, UI v1.4 and SDD v1.16 with approved page,
roster, schema and audit bindings. **Apply
`db/migrations/v1.4_attendance-management-schema.sql` once after v1.0 through
v1.3**, then restart the application. No new environment variable is required.

Sign in as a **Trainer** at `/staff/login`. The landing page `/trainer/programs`
shows assigned programs (100 per page). Open
`/trainer/programs/:programId/attendance` to record attendance for the selected
program. Its server-rendered roster includes only REGISTERED participants, 100
per page, and restores existing attendance values. Program selection opens that
program's own roster page; no new read API is introduced. Saving applies the
chosen attendance date and per-row values to the current page's records.

`POST /api/v1/trainer/programs/:programId/attendance` accepts exactly:

```json
{
  "attendanceDate": "2026-10-07",
  "records": [
    { "registrationId": 1, "status": "PRESENT" }
  ]
}
```

Optional per-record fields are checkInAt, checkOutAt (ISO timestamps with explicit
zones or null), verificationMethod (50 characters), evidenceReference (255) and
remarks (500). The browser converts BUSINESS_TIMEZONE optional time inputs to
UTC. Status is PRESENT or ABSENT. Duplicate targets and client-supplied
participantId, programId, recordedBy or percentage are rejected. Positive safe
numeric body IDs and the shared 100 KB JSON request limit are retained; no new
minimum or maximum batch size is added. An empty authorized batch returns
`{items:[]}`. No additional program lifecycle, attendance date window or
check-in/out ordering rule is introduced.

HTTP 200 returns `{items}`; each item has exactly attendanceId, registrationId,
participantId, programId, attendanceDate, status, percentage and recordedBy.
Participant/program relationships derive from registration; recordedBy derives
from the authenticated ACTIVE Trainer; PRESENT derives to 100 and ABSENT to 0.
The unique registration_id constraint maintains one attendance row per
registration. Updates preserve attendance ID, relationship fields and createdAt;
omitted optional fields become null.

Shared session/RBAC/CSRF middleware protects writes. Trainer and session validity
are rechecked inside the transaction; program assignment is locked and verified.
Registrations and existing attendance rows are locked in ID order. Only
REGISTERED targets belonging to the selected program may be maintained.
Attendance writes reuse WF-011's database advisory lock and bounded transaction
retry coordinator to serialize with program assignment/schedule changes.
Every row and its ATTENDANCE_CREATED/UPDATED audit (ASSIGNED_PROGRAMS scope)
commit together. Any record, DTO or mandatory audit failure rolls back the
complete batch. Audit values include status, percentage, date, optional evidence
metadata and recorder; free-text remarks and participant identifiers are not
copied into audit snapshots. No notification is generated.

Unauthenticated requests return 401; other roles or unassigned programs return
403; invalid/cancelled/foreign-program targets return 400; missing programs or
registrations return 404. Unexpected failures use the common sanitized 500
contract. Attendance history remains attached to its registration if a later
permitted cancellation occurs.

Verification on 7 October 2026: **65 suites and 715 tests passed**, including
live isolated MySQL WF-002 through WF-013 suites. WF-013 covers migration/DTO
contracts, create/maintenance identity preservation, server-derived values,
late-audit batch rollback, concurrent maintenance, cancellation races,
authorization and session changes inside the transaction, CSRF, scoped escaped
rosters, browser request authority and safe success/error handling. The final
pending-form adjustment also passed all eight attendance browser tests. The
disposable test container was removed; no application database migration was
applied by this implementation run.


WF-014 Certificate Eligibility & Issuance
------------------------------------------

Implemented from WF-014 backend v1.2, UI v1.4 and SDD v1.16 with the approved
eligibility, reference, audit and page bindings. **Apply
`db/migrations/v1.5_certificate-issuance-schema.sql` once after v1.0 through
v1.4**, then restart. No additional environment setting is required.

Sign in as a **Training Administrator** at `/staff/login`, then open
`/admin/certificates` or follow Certificates from the management navigation.
Program and eligible-registration selectors read directly from the database in
bounded pages of 100; no new read APIs are introduced. The selected program's
eligible registrations exclude already-issued records. Completion date displays
read-only from the selected attendance record. Changing program opens its own
eligibility page; Cancel returns to `/admin/programs`.

`POST /api/v1/admin/certificates` accepts exactly registrationId (positive safe
numeric ID), certificateType (100 characters) and certificateTitle (255), plus
optional issuingAuthority (255), verificationReference (255) and documentReference
(500). Unknown or server-derived fields are rejected. For example:

```json
{
  "registrationId": 1,
  "certificateType": "COMPLETION",
  "certificateTitle": "Training completion"
}
```

Eligibility requires a REGISTERED registration with matching PRESENT attendance
at exactly 100%. Completion date derives from attendanceDate; eligibilityStatus
is ELIGIBLE and eligibilityResult is `100% attendance achieved`. Issue date is
computed in BUSINESS_TIMEZONE (default Asia/Kuala_Lumpur). Participant/program
relationships, percentage, issuedBy, status and reference are server-controlled.
No extra program lifecycle, type enum or date-window restriction is added.

HTTP 201 returns exactly the 17 SDD fields: certificateId, certificateNumber,
participantId, registrationId, programId, certificateType, certificateTitle,
eligibilityStatus, eligibilityResult, attendancePercentage, completionDate,
issueDate, certificateStatus, documentReference, verificationReference,
issuingAuthority and issuedBy. Certificate status is ISSUED. The opaque technical
reference is `C-<ULID>`; generated-reference collisions retry up to three attempts.
Registration uniqueness returns 409; exhausted reference collisions fail closed
with sanitized 500.

Shared session/RBAC/CSRF infrastructure protects issuance, with live administrator
and session checks inside the transaction. The existing program mutation
coordinator serializes issuance with attendance/program updates. Source locks
follow participant -> program -> registration -> attendance order, coordinating
with registration and cancellation (including the certificate participant FK).
Issuance and its mandatory CERTIFICATE_ISSUED audit with ALL_TRAINING_OPERATIONS
scope commit together; audit or DTO failure rolls back the certificate.

Missing registration/attendance, cancelled registrations and ineligible attendance
return 400 rather than adding a new 404 contract. Anonymous requests return 401;
other roles return 403. Certificates retain their immutable issuance snapshot if
attendance is later changed or a permitted registration cancellation occurs; no
automatic revocation or certificate update is introduced.

This release records issuance only. References in the optional document and
verification fields are stored metadata; no file is generated or fetched. PDF
creation, templates, signatory details, business-facing numbering, revocation and
notifications remain deferred. Revocation columns exist solely as the SDD schema
requires them.

Verification on 7 October 2026: **68 suites and 765 tests passed**, including
live isolated MySQL WF-002 through WF-014 suites. WF-014 verifies exact DTOs,
server authority, eligibility, business-date derivation, real reference collisions
and exhaustion, duplicate issuance, mandatory audit rollback, source integrity,
live account/session checks, role/CSRF controls, program-scoped escaped selectors,
browser error handling and races against attendance changes and cancellation.
The disposable MySQL container was removed. No application database migration
was applied during implementation.
