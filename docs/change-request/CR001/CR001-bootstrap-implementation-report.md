# CR-001 bootstrap completion report — 8 October 2026

## 1. Implementation Status

**COMPLETED — approved bootstrap implementation and automated verification.**

The user explicitly approved the signed BIGINT foreign key and application-level loopback-only boundary. The previous two implementation conflicts are resolved. This report completes the bootstrap portion of CR-001; unaffected navigation/profile/session implementation and browser evidence are recorded in the earlier historical report.

## 2. Summary

Replaced the legacy static-key bootstrap with protected approved-email verification and durable singleton completion. Only the actual TCP peer 127.0.0.1 or ::1 is permitted; IPv4-mapped ::ffff:127.0.0.1 represents the same approved IPv4 loopback. The guard does not trust req.ip, Express trust-proxy settings or forwarding headers. POST retains the approved URL; the public bootstrap page remains absent.

Existing account validation, Argon2id, canonical role defaults, account identifier retries, uniqueness handling, error envelope, pool, mandatory audit and advisory-lock transaction conventions are reused. No new authentication framework, external email service or bootstrap key was introduced.

## 3. Files Changed

This manifest covers the bootstrap completion and README changes currently in the workspace, not previously committed CR-001 files. No commit was created.

| File | Operation | Reason |
| --- | --- | --- |
| `README.md` | MODIFY | Document migration, approved-email configuration, loopback invocation and permanent completion; remove obsolete provisioning instructions. |
| `docs/change-request/CR001/CR001-implementation-report.md` | MODIFY | Identify the earlier blocked report as a historical snapshot superseded by this completion report. |
| `src/.env.example` | MODIFY | Remove obsolete key and document deployment-only approved-email configuration with an empty placeholder. |
| `src/auth/static-administration-key.js` | DELETE | Remove superseded static-key bootstrap runtime, public UI or tests. |
| `src/bindings/system-administrator-bootstrap.bindings.js` | MODIFY | Implement the named approved bootstrap dependency, guard, validation, service, audit or repository integration. |
| `src/composition/system-administrator-bootstrap.composition.js` | MODIFY | Implement the named approved bootstrap dependency, guard, validation, service, audit or repository integration. |
| `src/config/ui.js` | MODIFY | Implement the named approved bootstrap dependency, guard, validation, service, audit or repository integration. |
| `src/public/js/system-administrator-bootstrap.js` | DELETE | Remove superseded static-key bootstrap runtime, public UI or tests. |
| `src/repositories/audit.repository.js` | MODIFY | Implement the named approved bootstrap dependency, guard, validation, service, audit or repository integration. |
| `src/repositories/system-administrator-bootstrap.repository.js` | MODIFY | Implement the named approved bootstrap dependency, guard, validation, service, audit or repository integration. |
| `src/routes/system-administrator-bootstrap.routes.js` | MODIFY | Implement the named approved bootstrap dependency, guard, validation, service, audit or repository integration. |
| `src/services/system-administrator-bootstrap.service.js` | MODIFY | Implement the named approved bootstrap dependency, guard, validation, service, audit or repository integration. |
| `src/validators/system-administrator-bootstrap.validator.js` | MODIFY | Implement the named approved bootstrap dependency, guard, validation, service, audit or repository integration. |
| `src/views/auth/system-administrator-bootstrap.ejs` | DELETE | Remove superseded static-key bootstrap runtime, public UI or tests. |
| `tests/api/system-administrator-bootstrap.api.test.js` | MODIFY | Verify approved-email/loopback/durable bootstrap contract or update existing bootstrap-dependent fixtures. |
| `tests/integration/administrative-user-creation.mysql.test.js` | MODIFY | Verify approved-email/loopback/durable bootstrap contract or update existing bootstrap-dependent fixtures. |
| `tests/integration/staff-authentication.mysql.test.js` | MODIFY | Verify approved-email/loopback/durable bootstrap contract or update existing bootstrap-dependent fixtures. |
| `tests/integration/system-administrator-authentication.mysql.test.js` | MODIFY | Verify approved-email/loopback/durable bootstrap contract or update existing bootstrap-dependent fixtures. |
| `tests/integration/system-administrator-bootstrap.mysql.test.js` | MODIFY | Verify approved-email/loopback/durable bootstrap contract or update existing bootstrap-dependent fixtures. |
| `tests/unit/auth/static-administration-key.test.js` | DELETE | Remove superseded static-key bootstrap runtime, public UI or tests. |
| `tests/unit/services/system-administrator-bootstrap.service.test.js` | MODIFY | Verify approved-email/loopback/durable bootstrap contract or update existing bootstrap-dependent fixtures. |
| `tests/unit/ui/system-administrator-bootstrap.test.js` | DELETE | Remove superseded static-key bootstrap runtime, public UI or tests. |
| `tests/unit/validators/system-administrator-bootstrap.validator.test.js` | MODIFY | Verify approved-email/loopback/durable bootstrap contract or update existing bootstrap-dependent fixtures. |
| `db/migrations/v1.7_cr001_system_admin_bootstrap_state.sql` | CREATE | Create durable singleton state with compatible signed FK and deletion-safe completion. |
| `src/auth/bootstrap-approved-email.js` | CREATE | Implement the named approved bootstrap dependency, guard, validation, service, audit or repository integration. |
| `src/middleware/bootstrap-loopback.js` | CREATE | Implement the named approved bootstrap dependency, guard, validation, service, audit or repository integration. |
| `tests/unit/auth/bootstrap-approved-email.test.js` | CREATE | Verify approved-email/loopback/durable bootstrap contract or update existing bootstrap-dependent fixtures. |
| `docs/change-request/CR001/CR001-bootstrap-implementation-report.md` | CREATE | Record completion, approved decisions, file manifest, verification and deployment steps. |
| `src/.env` (ignored local file) | MODIFY | Remove the obsolete static-key entry; preserve other settings including the configured approved email. No values are included in this report. |

## 4. Database Changes

Added `db/migrations/v1.7_cr001_system_admin_bootstrap_state.sql`, following the repository's actual migration directory convention. The table contains only state_id, completed_at, administrator_user_id, created_at and updated_at. The state_id primary key plus CHECK(state_id=1) enforces singleton semantics; the migration inserts the initial incomplete row.

The approved signed BIGINT FK references users.user_id. ON DELETE SET NULL permits deletion of the initial administrator while preserving completed_at, so deletion cannot reopen bootstrap. Neither email nor credentials nor secrets are stored in the state table.

Bootstrap obtains the existing database-scoped MySQL advisory lock, starts the existing transaction, locks/reads permanent state, rejects completion immediately, verifies approved email, creates the account, writes mandatory audit and updates completion, then commits. Missing state/table/configuration fails closed. The state write condition includes completed_at IS NULL and checks affectedRows. Existing advisory-lock release/destroy behavior is retained.

Migration verified on disposable MySQL 8.4 against the existing signed users schema. Tests verify FK integrity, singleton enforcement, successful completion reference, account/audit/completion rollback, at-most-one concurrent success, new-process persistence and deletion/disable permanence. Historical migrations are unchanged. **The application/development database was not migrated or provisioned.**

## 5. Security Changes

- Removed staticAdministrationKey from request allowlist, service and dependency injection. Removed static-key module and unreachable legacy bootstrap form/script/config URLs. Removed STATIC_ADMINISTRATION_KEY from example and ignored local deployment configuration.
- SYSTEM_ADMIN_BOOTSTRAP_APPROVED_EMAIL is read only from protected server-side configuration at bootstrap verification. Existing email normalization/validation is applied to both configured and submitted values. Unavailable configuration returns sanitized 500; mismatch returns generic 401. Configured email is never included in response, audit or logging.
- Non-loopback access returns existing sanitized 403 before validation/account processing. Forwarding headers cannot bypass the guard.
- Permanent state is checked before email verification or password hashing. Account/audit/state commit atomically. No public completion-reset operation exists.
- Existing Argon2id, role defaults, uniqueness sanitization, correlation/error infrastructure are preserved. No sessions or login cookies are created by bootstrap.
- Existing profile allowlist, CSRF, logout and role authorization remain verified through full regression.

## 6. Tests

Pre-change default baseline: 637 passed, 218 skipped. Final all-live regression: **855 passed, 0 failed, 0 skipped; 70 suites passed**.

Updated legacy validator, service and API tests to require the approved four-field key-free contract and reject staticAdministrationKey. Replaced obsolete static-key tests with approved-email/loopback checks and deleted obsolete bootstrap browser-form tests because that public UI is prohibited. Bootstrap-dependent authentication/staff/user-management integration fixtures apply v1.7 and configure approved email. Other workflow assertions remain intact.

Coverage includes key-free success, normalized email, mismatch/non-disclosure, absent/invalid configuration, non-loopback denial, forwarded-header bypass denial, canonical account/Argon2id/audit/completion, repeated attempts, concurrency, account/audit/completion failure rollback, uniqueness before completion, singleton/FK checks, adapter reload, a new Node process and disabled/deleted original administrator.

All live database groups ran on a disposable MySQL 8.4 container. No tests altered an application database. An initial migration verification identified a MySQL restriction on combining an optional extra CHECK with FK SET NULL; that unnecessary check was removed while retaining required singleton enforcement. A new-process test fixture initially omitted its required audit adapter; the fixture was corrected, then the full suite passed. No runtime requirement was weakened to make tests pass.

IDE build succeeded with limited build diagnostics; git diff --check passed. Prior Chromium/WebKit responsive/keyboard verification remains recorded in the historical CR-001 report; no browser bootstrap UI exists now.

## 7. Requirements Traceability

| Items | Evidence/status |
| --- | --- |
| FR-CR-005, BR-CR-005 | Approved-email controlled bootstrap; no public page; durable permanent completion — implemented |
| VAL-017 | Public UI removed; TCP loopback guard independently protects retained POST — verified |
| VAL-019 | Normalized protected approved-email comparison and generic mismatch rejection — verified |
| VAL-020 | Durable singleton completion; repeated/concurrent/disabled/deleted/restarted cases — verified |
| VAL-021 | Environment-only configuration; no public configuration/state mutation API — implemented |
| TC-CR-011 | Incorrect email creates no administrator/completion and discloses no configured email — passed |
| TC-CR-012 | One canonical ACTIVE administrator + Argon2id + audit + referenced completion — passed |
| TC-CR-013 | Permanent denial after success, including later disable/delete and new process — passed |
| TC-CR-014 | Concurrent valid attempts produce exactly one successful commit — passed |
| TC-CR-017 | All existing workflow regression including live MySQL groups — passed |
| NFR-CR-004 | Guard, fail-closed configuration/state, atomic audit/persistence, sanitized errors — verified |
| FR-CR-001–004,006–016; other BR-CR/NFR-CR; VAL-001–016,018; TC-CR-001–010,015–016 | Previously implemented scope unchanged; full regression passed. Prior report supplies component mapping and responsive/accessibility evidence. Manual screen-reader/physical-device release checks remain as previously documented. |

## 8. Deviations

The signed BIGINT FK and loopback-only application guard are explicit approved resolutions, not unapproved deviations. Migration uses the existing db/migrations directory. ON DELETE SET NULL preserves the requested permanent completion after deletion. No unapproved business, role, permission or authentication change was introduced.

## 9. Remaining Issues / Deployment

No unresolved bootstrap implementation conflict or failing automated test remains. Deployment steps are still required:

1. Apply the new v1.7 migration once to the intended application database using the existing migration process. Review migration history first; do not rerun historical migrations.
2. Configure protected SYSTEM_ADMIN_BOOTSTRAP_APPROVED_EMAIL and existing canonical role/audit settings; restart the existing application.
3. On the application host, invoke POST http://127.0.0.1:3000/api/v1/auth/system-admin/bootstrap (or configured port / IPv6 loopback) with username, name, email and password only. Do not send the removed static field.
4. HTTP 201 follows successful commit. Later valid bootstrap attempts return 409 permanently. Login remains through /login.

The local approved-email setting was checked without displaying its value and matches the user's reported request. No administrator was created in the application database during verification. Manual screen-reader and physical-device release checks remain outside this bootstrap automation.
