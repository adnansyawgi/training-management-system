# training-management-system

WF-001 provides participant account creation at `/register` in the existing
Express application. Run `npm.cmd install` and `npm.cmd start` from `src`, then
open `http://localhost:3000/register` (or the configured `PORT`). The existing API
requires its configured database for successful account creation.

The page uses EJS, `/css/app.css`, `/js/participant-register.js`, and Bootstrap
5.3.8 CSS from the CDN documented at https://getbootstrap.com/docs/5.3/.
Routes, navigation, CDN URL and integrity hash are centralized in
`src/config/ui.js`. Both login links target `/login`; WF-002 is not implemented,
so that target currently returns 404. Registration never redirects or logs in.

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
of the reserved actor binding and canonical audit conventions, and the existing
WF-002 login navigation gap remain integration/release evidence requirements.
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
