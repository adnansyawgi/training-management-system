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
