> Historical snapshot: the two bootstrap conflicts below were resolved by explicit user approval on 8 October 2026. The approved signed FK and application loopback-only guard are implemented and verified; see [the bootstrap completion report](CR001-bootstrap-implementation-report.md). The blocked status below describes the earlier implementation stage.

# CR-001 implementation report — 7 October 2026

## 1. Implementation Status

**BLOCKED — BASELINE CONFLICT**

The unaffected navigation, dashboard, profile and session scope is implemented and verified. CR-001 is not complete and this change set is not ready for deployment as the completed CR-001 baseline.

## 2. Summary

Implemented public Home, common login using the three existing authentication APIs, canonical role routing, role-protected dashboards, verified existing workflow navigation, shared Bootstrap shell, own-profile GET/PUT, server-owned editable field policy, current-session logout and blocking accessible session-expiry UI. Existing workflow screens reuse shared partials rather than being duplicated. Public GET `/admin/bootstrap` now returns 404; old staff/admin login bookmarks redirect to `/login`.

No second application, authentication/session framework, ORM, external email provider, bootstrap key or database abstraction was introduced.

## 3. Files Changed

The pre-existing user change to `prompts/14-cr001-code-generation.md` is excluded. No commit was created.

| File | Operation | Reason |
| --- | --- | --- |
| `src/app.js` | MODIFY | Mount CR-001 routes, reuse existing application and render blocked session-expiry UI. |
| `src/auth/database-sessions.js` | MODIFY | Clear the existing signed session cookie through the existing adapter. |
| `src/config/ui.js` | MODIFY | Configure common UI URLs and Bootstrap bundle with integrity metadata. |
| `src/middleware/session-security.js` | MODIFY | Reuse session/CSRF infrastructure; support staff role union, optional public-page session and expired logout cookie clearing. |
| `src/public/css/app.css` | MODIFY | Add focus, skip-link, responsive wrapping and modal styles. |
| `src/public/js/account-forms.js` | MODIFY | Remove obsolete role-specific login binding while retaining existing account helpers. |
| `src/public/js/participant-login.js` | DELETE | Remove superseded role-specific login UI/script/test; common login owns the contract. |
| `src/public/js/staff-login.js` | DELETE | Remove superseded role-specific login UI/script/test; common login owns the contract. |
| `src/public/js/system-admin-login.js` | DELETE | Remove superseded role-specific login UI/script/test; common login owns the contract. |
| `src/repositories/audit.repository.js` | MODIFY | Append mandatory profile-update audit through the existing audit infrastructure. |
| `src/repositories/participant.repository.js` | MODIFY | Add own-profile reads and allowlisted mobile updates with existing lock conventions. |
| `src/repositories/user.repository.js` | MODIFY | Add non-secret own-user reads and parameterized email updates with uniqueness handling. |
| `src/routes/public-ui.routes.js` | MODIFY | Remove public bootstrap rendering; redirect legacy login bookmarks to common login. |
| `src/views/admin/category-management.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/admin/certificate-management.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/admin/program-management.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/admin/registration-management.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/admin/reports.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/admin/user-account-management.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/auth/admin-login.ejs` | DELETE | Remove superseded role-specific login UI/script/test; common login owns the contract. |
| `src/views/auth/participant-login.ejs` | DELETE | Remove superseded role-specific login UI/script/test; common login owns the contract. |
| `src/views/auth/participant-register.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/programs/program-detail.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/programs/program-list.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/registrations/my-registrations.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/registrations/registration-confirmation.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/trainer/attendance-management.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `src/views/trainer/programs.ejs` | MODIFY | Render shared responsive, accessible shell with role-aware navigation and session controls. |
| `tests/attendance-management-browser.test.js` | MODIFY | Retain existing workflow assertions while rendering shared partials and updated navigation. |
| `tests/certificate-management-browser.test.js` | MODIFY | Retain existing workflow assertions while rendering shared partials and updated navigation. |
| `tests/integration/ui/participant-login.test.js` | MODIFY | Verify common login or legacy bookmark redirect under the new baseline. |
| `tests/integration/ui/participant-register.test.js` | MODIFY | Retain existing workflow assertions while rendering shared partials and updated navigation. |
| `tests/integration/ui/staff-login.test.js` | MODIFY | Verify common login or legacy bookmark redirect under the new baseline. |
| `tests/integration/ui/system-admin-login.test.js` | MODIFY | Verify common login or legacy bookmark redirect under the new baseline. |
| `tests/integration/ui/system-administrator-bootstrap.test.js` | MODIFY | Replace public bootstrap-page expectation with 404 and no navigation exposure. |
| `tests/registration-management-browser.test.js` | MODIFY | Retain existing workflow assertions while rendering shared partials and updated navigation. |
| `tests/unit/ui/administrative-user-create.test.js` | MODIFY | Retain existing workflow assertions while rendering shared partials and updated navigation. |
| `tests/unit/ui/my-registrations.test.js` | MODIFY | Retain existing workflow assertions while rendering shared partials and updated navigation. |
| `tests/unit/ui/participant-login.test.js` | DELETE | Remove superseded role-specific login UI/script/test; common login owns the contract. |
| `tests/unit/ui/participant-register.test.js` | MODIFY | Retain existing workflow assertions while rendering shared partials and updated navigation. |
| `tests/unit/ui/participant-registration.test.js` | MODIFY | Retain existing workflow assertions while rendering shared partials and updated navigation. |
| `tests/unit/ui/program-detail.test.js` | MODIFY | Retain existing workflow assertions while rendering shared partials and updated navigation. |
| `tests/unit/ui/program-list.test.js` | MODIFY | Retain existing workflow assertions while rendering shared partials and updated navigation. |
| `tests/unit/ui/staff-login.test.js` | DELETE | Remove superseded role-specific login UI/script/test; common login owns the contract. |
| `tests/unit/ui/system-admin-login.test.js` | DELETE | Remove superseded role-specific login UI/script/test; common login owns the contract. |
| `src/bindings/application-ui.bindings.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/controllers/dashboard.controller.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/controllers/logout.controller.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/controllers/profile.controller.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/public/js/login.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/public/js/navigation.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/public/js/profile.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/public/js/session.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/routes/dashboard.routes.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/routes/home.routes.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/routes/login.routes.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/routes/logout.routes.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/routes/profile.routes.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/services/navigation.service.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/services/profile.service.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/validators/profile.validator.js` | CREATE | Implement the named CR-001 controller, route, service, validator, binding or client module using existing infrastructure. |
| `src/views/auth/login.ejs` | CREATE | Provide CR-001 page or reusable shell/expiry partial. |
| `src/views/dashboard/participant.ejs` | CREATE | Provide CR-001 page or reusable shell/expiry partial. |
| `src/views/dashboard/staff.ejs` | CREATE | Provide CR-001 page or reusable shell/expiry partial. |
| `src/views/dashboard/system-admin.ejs` | CREATE | Provide CR-001 page or reusable shell/expiry partial. |
| `src/views/home.ejs` | CREATE | Provide CR-001 page or reusable shell/expiry partial. |
| `src/views/partials/footer.ejs` | CREATE | Provide CR-001 page or reusable shell/expiry partial. |
| `src/views/partials/head.ejs` | CREATE | Provide CR-001 page or reusable shell/expiry partial. |
| `src/views/partials/header.ejs` | CREATE | Provide CR-001 page or reusable shell/expiry partial. |
| `src/views/partials/session-expired-modal.ejs` | CREATE | Provide CR-001 page or reusable shell/expiry partial. |
| `src/views/profile/profile.ejs` | CREATE | Provide CR-001 page or reusable shell/expiry partial. |
| `src/views/session-expired.ejs` | CREATE | Provide CR-001 page or reusable shell/expiry partial. |
| `tests/api/cr001-navigation-profile-session.api.test.js` | CREATE | Verify CR-001 authorization, own profile, session/CSRF, browser behavior and/or isolated MySQL atomicity. |
| `tests/cr001-browser.test.js` | CREATE | Verify CR-001 authorization, own profile, session/CSRF, browser behavior and/or isolated MySQL atomicity. |
| `tests/integration/cr001.mysql.test.js` | CREATE | Verify CR-001 authorization, own profile, session/CSRF, browser behavior and/or isolated MySQL atomicity. |
| `docs/change-request/CR001/CR001-implementation-report.md` | CREATE | Record implementation evidence, complete file manifest, traceability and unresolved controlled-baseline conflicts. |

## 4. Database Changes

No application schema migration was added or applied. Historical migrations are unchanged. The requested bootstrap-state migration is blocked by conflict A below. Existing migrations v1.0 through v1.6 were applied only to disposable isolated MySQL 8.4 fixture databases for regression/browser verification; the user's existing database was not modified.

Profile writes lock the Participant row before the User row, matching existing registration transaction ordering. User email, Participant mobile and mandatory audit writes commit together; audit failures roll back the profile changes. Real MySQL tests verify duplicate-email sanitization and rollback.

**IMPLEMENTATION BASELINE CONFLICT A — incompatible foreign key**

- Specification: Implementation Specification v1.3 §22 requires `administrator_user_id BIGINT UNSIGNED` referencing `users(user_id)`; the requested migration is `v1.7_cr001_system_admin_bootstrap_state.sql`.
- Repository: `db/migrations/v1.0_participant-account-schema.sql:2` defines `users.user_id BIGINT`, signed. Existing migration files live under `db/migrations/`.
- Verification: executing the exact unsigned-reference contract against the existing schema in disposable MySQL 8.4 returned `ER_FK_INCOMPATIBLE_COLUMNS`.
- Affected modules: proposed v1.7 migration, bootstrap repository/service and bootstrap MySQL durability/atomicity/concurrency tests.
- Impact: the approved FK cannot be created; changing the parent key would exceed the approved database scope.
- Smallest recommended controlled resolution: approve signed `BIGINT` for the new FK to match the existing parent, retaining all singleton, timestamp, durable completion and atomicity requirements. This correction has not been assumed or implemented.

**IMPLEMENTATION BASELINE CONFLICT B — undefined non-public invocation boundary**

- Specification: Implementation Specification v1.3 §24.1 permits retained POST `/api/v1/auth/system-admin/bootstrap` only through the approved controlled non-public mechanism.
- Repository: `src/app.js` mounts the bootstrap composition on the ordinary public Express application. Existing bindings use the legacy static-key guard; no approved network/operational boundary is bound by the supplied baseline.
- Affected modules: bootstrap route/composition/bindings/service, deployment configuration/documentation and security tests.
- Impact: replacing the static key with email comparison alone would leave a publicly callable privileged provisioning API. Inventing an IP/network/loopback policy would be a new security decision.
- Smallest recommended controlled resolution: explicitly approve the operational access boundary (for example an existing reverse-proxy operations-network restriction), including how direct application access is prevented and tested. No access policy has been invented.

Bootstrap transaction, locking, migration singleton/FK, completion durability, rollback and concurrency verification are **pending**, not passed.

## 5. Security Changes

- Existing Argon2id authentication, signed `tms.sid` database sessions, role-protected APIs, correlation IDs and sanitized error envelope are reused.
- Dashboard direct URLs enforce roles server-side. Common login routes only by canonical returned server role and denies unknown roles.
- Own-profile operations resolve the authenticated user only. Explicit role-specific allowlists reject identity, role, status, password/security, audit and other unexpected fields. Participant NRIC/Passport is masked; no password/hash/session identifier is returned.
- Email normalization/shape, uniqueness and Participant mobile rules reuse existing validation conventions. Staff/System Administrator have no invented mobile field.
- Profile PUT and active-session logout require existing CSRF. Logout calls existing `sessions.invalidate(sessionId)` and clears the existing cookie; expired-session recovery clears the stale cookie and returns Home without granting access.
- Session expiry blocks protected interaction, makes background content inert and traps focus at Logout.
- Public bootstrap-page exposure is removed. **Legacy static-key POST/bootstrap implementation and runtime configuration remain unchanged in the affected blocked scope.** `SYSTEM_ADMIN_BOOTSTRAP_APPROVED_EMAIL`, permanent bootstrap state and full static-key removal are not implemented. The retained legacy bootstrap EJS file is unreachable through the removed page route but remains pending controlled replacement/removal.

## 6. Tests

- Pre-change baseline: 623 passed, 203 skipped.
- Default regression without live database environment: 637 passed, 218 skipped; 56 suites passed, 15 skipped. Database tests are opt-in by existing conventions.
- Focused live CR-001 MySQL: 15 passed; all four roles authenticate and view own profile; profile updates/audits, uniqueness and rollback; direct authorization; session expiry/logout; CSRF.
- Full final regression with all 15 isolated database groups enabled: **855 passed, 0 failed, 0 skipped; 71 suites passed**.
- Chromium and WebKit: 10 browser runs passed. Viewports 1440×900, 768×1024, 360×780 and 402×874; Home/common login/registration/dashboard/profile; no horizontal clipping; associated labels; mobile navbar; all-role canonical routing; expiry keyboard focus trap and Logout-to-Home. These are representative engines/viewports, not physical Samsung/iPhone device certification.
- Narrow profile screenshot visually inspected. Real screen-reader and physical-device validation remain manual release checks; automated checks do not establish full assistive-technology conformance.
- IDE build reports success with limited build diagnostics. `git diff --check` passes.
- Existing public bootstrap UI tests intentionally changed to expect route removal. Legacy static-key API/service tests remain because their replacement is blocked; their passing results do not verify the approved new bootstrap baseline.
- A restricted final test invocation failed because local Supertest listeners were denied; a subsequent run encountered fixtures left by that invocation. The final unrestricted run used fresh disposable names and passed. No tests were weakened to hide those environment failures.

## 7. Requirements Traceability

| Requirement | Implementation/evidence | Status |
| --- | --- | --- |
| FR-CR-001 | Home route/view; public link tests | Implemented |
| FR-CR-002 | Common login and public Login control | Implemented |
| FR-CR-003 | Existing auth APIs; canonical role map and browser tests | Implemented |
| FR-CR-004 | Existing `/register` entry | Implemented |
| FR-CR-005 | Public bootstrap page/link removed; controlled approved-email/durable bootstrap unresolved | Partial / blocked |
| FR-CR-006 | Participant dashboard, role gate, navigation | Implemented |
| FR-CR-007 | Staff dashboard; Trainer vs Training Administrator menus | Implemented |
| FR-CR-008 | System Administrator dashboard and existing user management | Implemented |
| FR-CR-009 | Existing authorized workflow links; independent server authorization | Implemented |
| FR-CR-010 | Authenticated logout endpoint and controls | Implemented |
| FR-CR-011 | Existing adapter invalidation, old-cookie denial and Home destination | Implemented |
| FR-CR-012 | Own profile DTO/page for all four canonical roles, non-secret/masked identity | Implemented |
| FR-CR-013 | Server rejects identity/name/protected field mutations | Implemented |
| FR-CR-014 | Email and Participant mobile allowlist, validation, uniqueness and atomic audit | Implemented |
| FR-CR-015 | Server expiry rejection; inert background, focus trap and recovery | Implemented |
| FR-CR-016 | Shared shell/landmarks/navbar/form/table/focus behavior | Implemented |
| BR-CR-001,006,007,008,011 | Role-aware menus and direct-route gates; no protected data on unauthenticated requests | Implemented |
| BR-CR-002,003,009,010 | Session middleware, common login, invalidation and blocked expiry | Implemented |
| BR-CR-004 | Own profile + protected field policy | Implemented |
| BR-CR-005 | Participant self-service preserved; public bootstrap page removed; remainder unresolved | Partial / blocked |
| NFR-CR-001,002,005,006 | Reusable Bootstrap shell; Chromium/WebKit representative responsive checks | Implemented; physical devices manual |
| NFR-CR-003 | Landmarks, labels, skip link, visible focus, validation summary, keyboard modal | Automated checks passed; screen-reader/manual checks pending |
| NFR-CR-004 | Existing auth/session/CSRF/error/audit reused; own-profile authorization | Implemented scope verified; bootstrap pending |
| VAL-001–006 | Authentication, dashboard roles, menu/direct-access and non-disclosure tests | Implemented |
| VAL-007–009 | Identity/NRIC/Name mass-assignment rejection tests | Implemented |
| VAL-010–011 | Existing validation, ownership and allowlist; duplicate-email rollback tests | Implemented |
| VAL-012–014 | Session invalidation/expiry/recovery, API and browser tests | Implemented |
| VAL-015–016 | Common account types and canonical server-role routing | Implemented |
| VAL-017 | No public bootstrap UI/link; controlled POST replacement missing | Partial / blocked |
| VAL-018 | Navigation-only dashboards, no KPIs/charts/new reports | Implemented |
| VAL-019–021 | Approved-email comparison, permanent completion and protected configuration | Blocked |
| TC-CR-001–010 | New API/DOM/live MySQL suites: public/login/roles/session/profile immutability/update | Passed |
| TC-CR-011–014 | Approved-email mismatch, atomic durable bootstrap, retries/concurrency | Pending / blocked |
| TC-CR-015 | Chromium/WebKit desktop/tablet/mobile shell checks | Passed |
| TC-CR-016 | Automated keyboard/labels/focus/modal checks; manual limitations above | Automated checks passed; manual pending |
| TC-CR-017 | Full existing suite including all live database groups | Passed |

Focused approved-bootstrap tests for rejected `staticAdministrationKey`, key-free request, protected email non-disclosure, restart persistence, deactivated initial administrator, mandatory-audit/completion rollback and at-most-one concurrent commit remain pending with the blocked implementation. Profile/logout CSRF, mass assignment and direct-dashboard authorization are covered now.

## 8. Deviations

No unapproved business/security/schema correction was implemented. The change set is deliberately incomplete in the affected bootstrap scope under the user's conflict-handling instruction. It must not be described as fully compliant. No production migration/configuration was changed.

## 9. Remaining Issues

1. Obtain controlled resolution of conflicts A and B, then implement v1.7 migration and the complete approved-email bootstrap replacement/configuration, remove obsolete key/UI code, and verify migration durability, rollback and concurrency.
2. Run the pending approved-bootstrap tests and repeat full regression after that implementation.
3. Perform manual screen-reader and physical-device release checks. Browser engines and representative viewports have passed automated verification.
