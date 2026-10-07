# Backend implementation document review

Version 1.0 • 07 Oct 2026

Reviewed all fourteen WF-002 through WF-015 implementation documents, version 1.0, against their feature specifications and Software Design Document v1.15. Requirements Analysis v2.4 and the WF-001 backend implementation document provide the business and reference baselines.

**Decision: revisions required.** The documents can remain draft implementation baselines. They should not be approved as complete backend code packages. There are confirmed source-mapping and validation defects, an account-report query inconsistency, and response-contract and adapter-ordering details that need clarification. Their existing declarations that repository integration and executable tests are pending are appropriate.

The original Word documents were not edited during this review. This report records findings and required follow-up.

## Review evidence and limits

- All fourteen documents were read, including their table contents and code examples.
- All fourteen generated API sections match the corresponding feature specification text. This establishes transcription fidelity; it does not establish that every specification contains a complete implementation contract.
- Thirteen generated traceability sections match their source traceability sections. WF-002 does not.
- All fourteen extracted service examples pass `node --check`. This checks JavaScript syntax only.
- A small executable probe of the shared `positiveId` helper reproduced type coercion and unsafe-number corruption.
- Current database configuration, user repository, and error middleware were inspected to assess integration claims. No `.env` values were read or copied.
- No implemented feature API, live database transaction, concurrency test, session store, or email worker was tested. The documents themselves identify those components as pending.
- Visual layout remains unverified. The previous rendering attempt could not complete; this review does not assert clean pagination, table layout, or absence of clipping. Locations below are section names, not unverified page numbers.

## Findings

### R01 High WF-002 source sections are mapped incorrectly

**Locations:** Section 2 Preconditions; Section 7 Processing and Transaction Model and Notification Behavior; Section 9 Requirements and Design Traceability; Section 13 Repository Integration Gates and Source Constraints.

The WF-002 specification has a different section sequence from the other thirteen specifications. Its transaction requirements are in source Section 11, notifications in Section 14, traceability in Section 22, and design constraints in Section 23. The generated document instead copies source Sections 9, 12, 20, and 21 into those slots.

Consequently:

- The transaction section contains Password Security material.
- Notification Behavior contains Error Handling Requirements rather than the explicit prohibition on login notifications and outbox records.
- Traceability contains authentication postconditions instead of the approved BP-002, FR-002, BR-001, VE-016, DR-007, NFR-003, OP-002, VAL and DEC mappings.
- Integration Gates contains Test Considerations rather than the source design constraints, including the restrictions on persistent Remember me and password-reset functionality.
- Preconditions has an empty heading. The seven manually numbered prerequisites were lost because the generator treated numbered list entries as section boundaries.

Some security and consistency requirements appear elsewhere in the generated document, so this is not a claim that all authentication controls disappeared. The section assignments and source coverage are nevertheless incorrect.

**Required correction:** Map source content by verified heading identity and semantic role, not shared numeric section positions. Distinguish a top-level heading from a numbered list entry. Restore the seven prerequisites, correct the four affected source mappings, and verify all approved traceability IDs and constraints.

### R02 Medium Shared identifier validation accepts invalid types and can change identity

**Location:** Section 6 Validation Implementation Primitives in all fourteen documents.

`positiveId(value)` converts its input with `String(value)` before validating it. That conversion accepts an array as an identifier and cannot recover an integer already rounded by JavaScript's numeric representation. The probe returned:

```text
positiveId([1])                  -> "1"
positiveId(9007199254740993)      -> "9007199254740992"
positiveId("9223372036854775808") -> "9223372036854775808"
```

The second example demonstrates a request being associated with a different identifier. The third is above the signed MySQL BIGINT range used by the physical schema. Separate field validators could reject such values, but they are not supplied and the shared helper itself does not enforce that contract.

**Required correction:** Reject arrays and objects before conversion. Accept numeric inputs only when they are positive safe integers. Define and validate the approved decimal-string representation for larger BIGINT values, including the physical range. Normalize repository and session identities consistently before strict equality checks in cancellation and attendance services. Do not silently change the approved API representation.

**Required regression cases:** Arrays, objects, booleans, unsafe numeric values, zero, negative values, fractional values, valid large decimal strings, and values beyond the physical range.

### R03 High WF-015 account-report query guidance cannot cover its stated staff-account case

**Locations:** Section 2 Approved Business and Validation Rules; Section 4 Parameterized Persistence Baseline; Section 6 Required Adapter Contracts.

The persistence guidance starts the account report from `participants -> users`. The same document requires DEC-016 handling for administrator-created TRAINING_ADMINISTRATOR and TRAINER accounts. Those accounts explicitly have no participant profile under the approved identity model. A query rooted in participants cannot return those staff rows, so the guidance cannot implement both cases as written.

This is a document-level inconsistency; the report repository has not been implemented or executed. The approved Student Account Creation Report also has participant-oriented columns, so row eligibility and the representation of staff values must not be guessed.

**Required correction:** Reconcile report row scope with DEC-016. If the approved report includes staff accounts, define an account-rooted query with optional participant linkage and approved values for participant-only columns. If it is participant-only, clarify how the staff creation presentation rule is scoped. Preserve the approved columns and filters and exclude the technical audit actor according to approved account eligibility rules.

**Required regression cases:** Participant self-registration, administrator-created staff where included by the approved scope, deterministic creation-event attribution, no duplicate rows from audit joins, and exclusion of technical identities.

### R04 Medium WF-011 and WF-012 omit available field-level success contracts

**Location:** Section 5 API Contract and Section 6 DTO adapter contracts.

WF-011 reduces success to `201/200 approved program/category objects`. WF-012 reduces it to `200 paginated list; 200 registration detail`. The SDD supplies explicit category create/update response fields and registration list/detail projections, but those available details are not reproduced. Named DTO functions and field counts alone do not define JSON keys, optionality, or timestamp handling.

For example, the SDD's WF-012 list item is:

```text
registrationId, referenceNo, participantId, programId,
registeredAt, status, cancelledAt, cancellationReason
```

The detail adds `registrationRemarks`. The SDD's category creation response includes `createdAt` and `updatedAt`, whereas its update response includes `updatedAt` without `createdAt`.

**Required correction:** Expand the separate endpoint contracts using those approved fields. Define the snake_case-to-camelCase DTO mapping and null/date serialization. Keep the program `{program}` wrapper required by the SDD; resolve any genuinely unspecified inner fields through controlled alignment rather than inventing a projection.

**Required regression cases:** Exact list and detail keys; category create versus update keys; no extra internal fields; correct nullable and time representations.

### R05 Medium Authentication cookie emission and commit ordering are underspecified

**Affected documents:** WF-002, WF-004, WF-006.

**Location:** Section 6 `sessions.establish` adapter and shared authentication service.

The session adapter is described as persisting a session and attaching its cookie. The service calls it before `security.recordSuccess`, and before the coordinator completes the operation. A later audit or commit failure can therefore occur after the adapter has staged a cookie. The coordinator is required to prevent a false success, but its contract does not explicitly describe cookie suppression and session cleanup for every later failure.

This is an ordering-contract gap, not evidence that an implemented session store currently leaks valid sessions. A compatible coordinator might already provide the necessary compensation; no such implementation is present in the reviewed package.

**Required correction:** Explicitly defer cookie emission until successful completion of the approved consistency boundary, or specify and verify the existing approved compensation mechanism. Cover session-store, successful-login state, audit, and commit failures. Preserve failed-attempt security state on rejected login.

**Required regression cases:** A failure after session preparation produces no usable authenticated session or success cookie; failed-login counters survive a rejected HTTP outcome; successful authentication emits the cookie only after required persistence succeeds.

### R06 Medium Code-package assembly contracts are incomplete

**Affected documents:** All fourteen.

**Locations:** Section 3 Implementation File Manifest; Section 6 Routes and Controller Integration; validation and error middleware examples.

Route examples use `service`, `validators`, `security`, and `requestContext` without showing their imports or a factory signature that supplies them. Authentication wrappers additionally reference `sharedLogin`. The manifests list separate controller files, but the route examples contain an inline controller closure without specifying how it maps to those files. Feature validators, DTOs, and the trusted error resolver remain named capabilities rather than implementations.

These omissions are consistent with the documents' declaration that they are integration baselines. They are not syntax errors, and they should not be represented as unexpected failures in already executable code. They do prevent the package from being assembled directly and leave implementers to infer module boundaries.

**Required correction:** Provide explicit route/service factory assembly examples, exports, and input/output signatures. Distinguish supplied code, work to implement from approved rules, and genuine source/repository decisions that require clarification. Supply validators and DTO mappings for approved behavior; retain explicit gates for unresolved audit, session, role, enum, and migration bindings.

### R07 Low WF-002 processing flow loses its separators

**Location:** Section 2 Authentication Validation Order.

The processing sequence appears as `Validate requestRetrieve candidate user...` in one paragraph. Source line breaks were discarded during conversion, making the ordered flow difficult to read.

**Required correction:** Preserve source breaks or use an ordered list. Include this paragraph and the API examples in the subsequent visual review.

## Per-document assessment

Every document inherits R02 and R06. The absence of a feature-specific finding below means no additional confirmed defect was found in that feature's reviewed orchestration; it is not implementation approval.

| Document | Additional findings | Feature-specific review result |
|---|---|---|
| [WF-002](WF-002_Participant_Authentication_Login_Implementation_v1.0.docx) | R01, R05, R07 | Major source-mapping correction required; authentication coordinator still needs binding. |
| [WF-003](WF-003_System_Administrator_Bootstrap_Implementation_v1.0.docx) | None | Static-key scope, exclusive bootstrap prerequisite, A-ULID and atomic audit are retained. Verify empty-set serialization and missing-key 401 behavior during assembly. |
| [WF-004](WF-004_System_Administrator_Authentication_Implementation_v1.0.docx) | R05 | Canonical role gate and shared authentication policy are retained; clarify cookie completion ordering. |
| [WF-005](WF-005_Administrative_User_Creation_Implementation_v1.0.docx) | None | Permitted target roles, supplied username, server account controls and atomic audit are retained. Bind role defaults and verified duplicate classifications. |
| [WF-006](WF-006_Staff_Authentication_Implementation_v1.0.docx) | R05 | Staff-only policy and common lockout/session requirements are retained; clarify cookie completion ordering. |
| [WF-007](WF-007_Browse_Available_Training_Programs_Implementation_v1.0.docx) | None | Bounded catalogue, derived seats and empty results are retained. Bind visibility, availability values and sort allow-list. |
| [WF-008](WF-008_View_Training_Program_Details_Implementation_v1.0.docx) | None | Public detail and approved field count are retained. Implement the explicit DTO so internal `p.*` never reaches the response. |
| [WF-009](WF-009_Participant_Program_Registration_Implementation_v1.0.docx) | None | Participant/program serialization, active uniqueness, overlap checks and atomic registration/audit/outbox are retained. Prove these with real concurrent connections. |
| [WF-010](WF-010_Participant_Registration_Cancellation_Implementation_v1.0.docx) | None | Ownership, strict before-start cancellation, history and no cancellation notification are retained. Bind the shared lock order and test audit rollback. |
| [WF-011](WF-011_Training_Program_Category_Management_Implementation_v1.0.docx) | R04 | Capacity, immutable code, lifecycle and administrative audit are retained; expand available response contracts. |
| [WF-012](WF-012_Registration_Management_View_Implementation_v1.0.docx) | R04 | Read-only scope is retained; expand list/detail DTO fields and test scope on count and detail. |
| [WF-013](WF-013_Attendance_Management_Record_Attendance_Implementation_v1.0.docx) | None | Atomic batch, assignment, REGISTERED targets, immutable linkage and derived percentage are retained. Normalize IDs and prove batch rollback. |
| [WF-014](WF-014_Certificate_Eligibility_Issuance_Implementation_v1.0.docx) | None | Exactly 100 percent, one certificate, opaque reference, atomic audit and deferred PDF scope are retained. Bind completion-date and eligibility values and test duplicate issuance. |
| [WF-015](WF-015_Report_Generation_Implementation_v1.0.docx) | R03 | Three reports, mandatory periods, approved columns and metadata/audit are retained; reconcile account-report row selection. |

## Declared integration gates that remain open

These are pending implementation work or controlled source bindings, not new business requirements introduced by this review:

- A compatible shared authentication coordinator, rolling failed-attempt observation window, INACTIVE outcome mapping, session store, and anonymous audit actor binding.
- Canonical staff role defaults, bootstrap serialization, deterministic audit actors and approved audit event literals.
- Missing SDD physical objects, actual applied migration state, and verified unique-constraint classification. The reference SQL is not a ready-to-run migration.
- Shared mutation lock ordering and isolation behavior across registration, cancellation, capacity changes, attendance, and certificate issuance.
- Trusted common error mapping. The current repository handler still recognizes only 400 and 409 application outcomes; its extension is explicitly pending in the documents.
- Approved timezone conversion for schedule DATE/TIME and UTC registration windows; do not substitute the client timezone for the SDD deployment business timezone.
- Report period semantics, enum bindings, output limits, scope predicates, and execution/audit consistency.
- Real Jest/Supertest/MySQL fixtures and passing API, rollback, authorization, and concurrency evidence. Generic test patterns are correctly labeled non-executable.
- Rendered Word page review and formal approval records.

## Remediation order

1. Correct WF-002 semantic source mapping and restore omitted content.
2. Reconcile WF-015 account-report row scope with the approved identity model and DEC-016.
3. Replace the shared ID validation helper and define the consistent identity codec.
4. Expand the available WF-011/WF-012 response projections and supply explicit package assembly contracts.
5. Clarify and test authentication cookie/commit ordering.
6. Implement approved adapters and fixtures, execute the feature checks, and complete visual review before approval.

## Source register

The fourteen reviewed Word files are linked in the assessment table. Each was compared with its matching file in `docs/implementation-spec`:

- WF-002 and WF-007/WF-008/WF-012 implementation specifications version 1.1.
- WF-003/WF-004/WF-005/WF-006/WF-009/WF-010/WF-011/WF-013/WF-014/WF-015 implementation specifications version 1.2.
- [Software Design Document v1.15](../Training_Management_System_Software_Design_Document_v1.15.docx), especially physical integrity, API contracts, time handling, and DEC-016.
- [Requirements Analysis v2.4](../Training_Management_System_Requirements_Analysis_v2.4.docx).
- [WF-001 backend reference v1.2](WF-001_Participant_Account_Creation_Implementation_v1.2.docx).

Implementation-readiness observations also refer to the inspected `src/config/database.js`, `src/repositories/user.repository.js`, and `src/middleware/error-handler.middleware.js`.
