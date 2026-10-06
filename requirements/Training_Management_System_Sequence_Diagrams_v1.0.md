TRAINING MANAGEMENT SYSTEM

Sequence Diagram Specification

Professional Design Baseline

| Document Version \| 1.0 \|

| --- \| --- \|

| Status \| Design Documentation \|

| Requirements Baseline \|
  Training_Management_System_Requirements_Analysis_v2.4 \|

| Software Design Baseline \|
  Training_Management_System_Software_Design_Document_v1.15 \|

| Technology Context \| Node.js, Express.js, Bootstrap, MySQL \|

| Scope \| Approved important system operations and business workflows
  \|

Prepared from the approved requirements, software design, and
architecture artifacts.

# 1. Purpose and Scope

This document provides sequence diagrams for the important Training
Management System operations and business workflows defined by the
approved Requirements Analysis v2.4 and Software Design Document v1.15.
The sequence set follows the 15 major workflows WF-001 through WF-015
defined in the software design baseline.

Each sequence identifies the initiating actor, user interface, API
boundary, application component or service, MySQL data store, external
system where applicable, requests and responses, validations, and
important business-rule decisions. No payment, HR integration,
waiting-list processing, multi-session behavior, administrator
registration approval, or other behavior outside the approved baseline
is introduced.

# 2. Source Documents

-   Training_Management_System_Requirements_Analysis_v2.4

-   Training_Management_System_Software_Design_Document_v1.15

-   Figure 3-1 - System Architecture Overview

-   Figure 3-2 - Application Layer Architecture

-   Figure 3-3 - Functional Component Architecture

-   Figure 3-4 - Registration and Notification Architecture

# 3. Sequence Diagram Catalogue

| Workflow ID \| Workflow \| Primary Actor \|

| --- \| --- \| --- \|

| WF-001 \| Participant Account Creation \| Participant \|

| WF-002 \| Participant Authentication \| Participant \|

| WF-003 \| System Administrator Bootstrap \| Static-key holder \|

| WF-004 \| System Administrator Authentication \| System Administrator
  \|

| WF-005 \| Administrative User Creation \| System Administrator \|

| WF-006 \| Staff Authentication \| Training Administrator / Trainer \|

| WF-007 \| Browse Program \| Participant \|

| WF-008 \| View Program Details \| Participant \|

| WF-009 \| Register for Program \| Participant \|

| WF-010 \| Cancel Registration \| Participant \|

| WF-011 \| Manage Programs \| Training Administrator \|

| WF-012 \| Manage Registrations - View \| Training Administrator \|

| WF-013 \| Record Attendance \| Trainer \|

| WF-014 \| Issue Certificate \| Training Administrator \|

| WF-015 \| Generate Reports \| Training Administrator \|

# 4. Detailed Sequence Diagrams

## 4.1 WF-001 - Participant Account Creation

| Scenario / Use Case \| A prospective participant creates an account.
  \|

| --- \| --- \|

| Primary Actor \| Participant \|

| Related Requirements \| BP-001; FR-001; FR-008; DR-001; DR-007;
  VE-014; VE-015 \|

| Design Gap / Inconsistency \| None blocking code generation. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor P as Participant
    participant UI as Web UI
    participant API as Participant Account API
    participant AM as Participant / Account Management
    participant DB as MySQL
    P->>UI: Enter participant/account information
    UI->>API: POST /api/v1/auth/participants
    API->>AM: Validate account request
    AM->>DB: Check email and NRIC/Passport uniqueness
    alt Missing/invalid or duplicate information
        DB-->>AM: Validation/uniqueness failure
        AM-->>API: Reject account creation
        API-->>UI: 400 / 409 error
        UI-->>P: Display corrective message
    else Valid
        AM->>AM: Generate account identifier and username
        AM->>AM: Assign PARTICIPANT role / ACTIVE status
        AM->>DB: Create users + participant + audit atomically
        DB-->>AM: Commit
        AM-->>API: Account created
        API-->>UI: 201 participantId, status, createdAt
        UI-->>P: Display account creation outcome
    end
```

### Interaction Description

The participant submits NRIC/Passport number, name, email, mobile number
and password. The server validates mandatory data and uniqueness,
generates opaque participant account identifiers, assigns the
PARTICIPANT role and creates the users record, linked participant
profile and account-creation audit record atomically.

## 4.2 WF-002 - Participant Authentication

| Scenario / Use Case \| A registered participant logs in. \|

| --- \| --- \|

| Primary Actor \| Participant \|

| Related Requirements \| BP-002; FR-002; BR-001; VE-016; NFR-003 \|

| Design Gap / Inconsistency \| None. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor P as Participant
    participant UI as Login UI
    participant API as Authentication API
    participant AUTH as Authentication Service
    participant DB as MySQL / Session Store
    P->>UI: Enter email and password
    UI->>API: POST /api/v1/auth/participants/login
    API->>AUTH: Authenticate credentials
    AUTH->>DB: Retrieve user
    DB-->>AUTH: User / credential / status / role
    AUTH->>AUTH: Verify password, ACTIVE status, PARTICIPANT role
    alt Invalid credentials
        AUTH-->>API: Authentication rejected
        API-->>UI: 401
    else Locked or disabled
        AUTH-->>API: Account unavailable
        API-->>UI: 423
    else Valid
        AUTH->>DB: Create server-side session
        AUTH->>DB: Update login/audit information
        AUTH-->>API: Authentication success
        API-->>UI: 200 userId, participantId, role, status, expiresAt
        UI-->>P: Authenticated application view
    end
```

### Interaction Description

The system validates email/password, account status and the canonical
PARTICIPANT role before establishing a server-side session. The session
identifier is not exposed to the client.

## 4.3 WF-003 - System Administrator Bootstrap

| Scenario / Use Case \| A valid static-key holder creates the System
  Administrator account. \|

| --- \| --- \|

| Primary Actor \| Static-key holder \|

| Related Requirements \| BP-003; FR-035; BR-021; VE-018; VE-019;
  NFR-003 \|

| Design Gap / Inconsistency \| GOV-002 remains a production governance
  item covering ownership, secure storage, authorized distribution/use,
  rotation/replacement, revocation and auditability of the static
  administration key. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor H as Static-Key Holder
    participant UI as Bootstrap UI
    participant API as Bootstrap API
    participant KEY as Key Validation
    participant UA as User Administration
    participant DB as MySQL
    H->>UI: Enter static key and account data
    UI->>API: POST /api/v1/auth/system-admin/bootstrap
    API->>KEY: Validate static administration key
    alt Key missing or invalid
        KEY-->>API: Invalid
        API-->>UI: 401
    else Key valid
        API->>UA: Validate account information
        UA->>DB: Check active System Administrator / uniqueness
        alt Active System Administrator already exists
            UA-->>API: Conflict
            API-->>UI: 409
        else Valid
            UA->>UA: Assign SYSTEM_ADMINISTRATOR role
            UA->>DB: Create account + audit record
            DB-->>UA: Commit
            API-->>UI: 201 account outcome
        end
    end
```

### Interaction Description

The static key is validated against the configured deployment secret and
is not persisted or logged. The System Administrator role and opaque
account identifier are server controlled.

## 4.4 WF-004 - System Administrator Authentication

| Scenario / Use Case \| The System Administrator authenticates for
  system administration access. \|

| --- \| --- \|

| Primary Actor \| System Administrator \|

| Related Requirements \| BP-004; FR-034; FR-028; VE-017; NFR-003 \|

| Design Gap / Inconsistency \| None specific to authentication;
  static-key governance applies to bootstrap. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor SA as System Administrator
    participant UI as Administrative Login UI
    participant API as Authentication API
    participant AUTH as Authentication Service
    participant DB as MySQL / Session Store
    SA->>UI: Enter email and password
    UI->>API: POST /api/v1/auth/system-admin/login
    API->>AUTH: Authenticate
    AUTH->>DB: Retrieve account
    AUTH->>AUTH: Validate credentials, status and SYSTEM_ADMINISTRATOR role
    alt Invalid
        AUTH-->>API: Reject
        API-->>UI: 401 / 423
    else Valid
        AUTH->>DB: Create server-side session
        AUTH-->>API: Authenticated
        API-->>UI: 200 userId, role, status, expiresAt
    end
```

### Interaction Description

The endpoint validates credentials, account status and the canonical
SYSTEM_ADMINISTRATOR role before establishing the server-side session.

## 4.5 WF-005 - Administrative User Creation

| Scenario / Use Case \| The System Administrator creates a Training
  Administrator or Trainer account. \|

| --- \| --- \|

| Primary Actor \| System Administrator \|

| Related Requirements \| FR-029; FR-028; DR-007; DR-008 \|

| Design Gap / Inconsistency \| None. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor SA as System Administrator
    participant UI as User Management UI
    participant API as Admin User API
    participant AUTHZ as Authorization
    participant UA as User Administration
    participant DB as MySQL
    SA->>UI: Enter staff account data and role
    UI->>API: POST /api/v1/admin/users
    API->>AUTHZ: Verify SYSTEM_ADMINISTRATOR
    AUTHZ-->>API: Authorized
    API->>UA: Validate account and permitted role
    UA->>DB: Check uniqueness
    alt Invalid / duplicate
        UA-->>API: Reject
        API-->>UI: Validation/conflict response
    else Valid
        UA->>DB: Create staff user + mandatory audit
        DB-->>UA: Commit
        API-->>UI: Account result
    end
```

### Interaction Description

Only the System Administrator can create administrative users. The
operation validates the requested staff account and permitted role,
checks uniqueness, persists the account and records the administrative
action.

## 4.6 WF-006 - Staff Authentication

| Scenario / Use Case \| A Training Administrator or Trainer
  authenticates. \|

| --- \| --- \|

| Primary Actor \| Training Administrator / Trainer \|

| Related Requirements \| FR-033; FR-028; VE-017; NFR-002; NFR-003 \|

| Design Gap / Inconsistency \| None. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor S as Training Administrator / Trainer
    participant UI as Administrative Login UI
    participant API as Authentication API
    participant AUTH as Authentication Service
    participant DB as MySQL / Session Store
    S->>UI: Enter email and password
    UI->>API: POST /api/v1/auth/staff/login
    API->>AUTH: Validate credentials
    AUTH->>DB: Retrieve account
    AUTH->>AUTH: Validate status and TRAINING_ADMINISTRATOR / TRAINER role
    alt Authentication fails
        AUTH-->>API: Reject
        API-->>UI: 401 / 423
    else Valid
        AUTH->>DB: Create server-side session
        AUTH-->>API: Success
        API-->>UI: 200 userId, role, status, expiresAt
    end
```

### Interaction Description

The staff-login endpoint validates credentials, account status and one
of the two approved staff roles before creating a server-side session.

## 4.7 WF-007 - Browse Available Programs

| Scenario / Use Case \| A participant browses the available training
  catalogue, optionally by category. \|

| --- \| --- \|

| Primary Actor \| Participant \|

| Related Requirements \| BP-007; FR-003; FR-004; FR-032; BR-014;
  VE-012; DR-002; DR-003 \|

| Design Gap / Inconsistency \| None. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor P as Participant
    participant UI as Program Listing UI
    participant API as Program Catalogue API
    participant CAT as Program Catalogue
    participant DB as MySQL
    P->>UI: Browse programs / select category
    UI->>API: GET /api/v1/programs?filters
    API->>CAT: Validate filters
    CAT->>DB: Query available programs/categories
    DB-->>CAT: Program results
    alt No available programs
        API-->>UI: 200 empty items
    else Programs available
        API-->>UI: 200 paginated programs
        UI-->>P: Display programs and availability
    end
```

### Interaction Description

The public catalogue validates list filters, retrieves visible programs
and returns paginated results including capacity and available-seat
information.

## 4.8 WF-008 - View Program Details

| Scenario / Use Case \| A participant views the details and current
  availability of a selected program. \|

| --- \| --- \|

| Primary Actor \| Participant \|

| Related Requirements \| BP-008; FR-005; FR-006; FR-030; DR-002 \|

| Design Gap / Inconsistency \| None. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor P as Participant
    participant UI as Program Details UI
    participant API as Program API
    participant CAT as Program Catalogue
    participant DB as MySQL
    P->>UI: Select program
    UI->>API: GET /api/v1/programs/:programId
    API->>CAT: Retrieve visible program
    CAT->>DB: Query program/category/trainer/availability
    DB-->>CAT: Program information
    alt Not found / not visible
        API-->>UI: 404
        UI-->>P: Program unavailable
    else Found
        API-->>UI: 200 details + availableSeats
        UI-->>P: Display program details
    end
```

### Interaction Description

The detail response includes the approved program description,
objectives, target audience, prerequisites, category, trainer, schedule,
venue/delivery mode, capacity, available seats, registration window and
certificate information.

## 4.9 WF-009 - Register for Program

| Scenario / Use Case \| An authenticated participant registers for an
  available program. \|

| --- \| --- \|

| Primary Actor \| Participant \|

| Related Requirements \| FR-007 to FR-014; FR-030; FR-031; BR-001 to
  BR-009; BR-012; BR-013; VE-001 to VE-011; DR-001; DR-002; DR-004 \|

| Design Gap / Inconsistency \| Re-registration after cancellation is
  supported by the design: only an active REGISTERED registration blocks
  a new registration; historical CANCELLED registrations do not. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor P as Participant
    participant UI as Registration UI
    participant API as Registration API
    participant AUTH as Authentication / Authorization
    participant VAL as Registration Validation
    participant DB as MySQL
    participant WORK as Notification Worker
    participant EMAIL as Email / Notification Service
    P->>UI: Select program and confirm registration
    UI->>API: POST /api/v1/registrations {programId}
    API->>AUTH: Validate session and participant
    AUTH-->>API: Authorized participant
    API->>VAL: Validate registration
    VAL->>DB: Lock/read program and registrations
    VAL->>VAL: Check window, visibility, duplicate, overlap, capacity
    alt Validation fails
        VAL-->>API: Validation failure
        API-->>UI: 400 / 404 / 409
    else Validation succeeds
        VAL->>DB: Begin transaction
        VAL->>DB: Create REGISTERED registration
        VAL->>DB: Create mandatory audit record
        VAL->>DB: Create notification outbox record
        DB-->>VAL: Commit atomically
        API-->>UI: 201 registration result
        UI-->>P: Display successful registration
        WORK->>DB: Read committed outbox event
        WORK->>EMAIL: Send confirmation email
        alt Email delivered
            EMAIL-->>WORK: Success
            WORK->>DB: Mark notification delivered
        else Email fails
            EMAIL-->>WORK: Failure
            WORK->>DB: Record retry/failure state
            Note over WORK,DB: Registration remains committed
        end
    end
```

### Interaction Description

Participant identity is derived exclusively from the authenticated
session. Registration validates the registration window, program
visibility, active duplicate, schedule overlap and capacity. Success
creates the REGISTERED registration, mandatory audit event and
notification outbox atomically. Email delivery occurs asynchronously
after commit.

## 4.10 WF-010 - Cancel Registration

| Scenario / Use Case \| A participant cancels their own existing
  registration. \|

| --- \| --- \|

| Primary Actor \| Participant \|

| Related Requirements \| BP-010; FR-016; FR-017; BR-010; BR-011;
  BR-018; VE-007 \|

| Design Gap / Inconsistency \| None blocking. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor P as Participant
    participant UI as My Registrations UI
    participant API as Registration API
    participant AUTH as Authorization
    participant REG as Registration Service
    participant DB as MySQL
    P->>UI: Select registration and cancel
    UI->>API: POST /api/v1/registrations/:registrationId/cancel
    API->>AUTH: Validate session and ownership
    alt Not owner
        API-->>UI: 403
    else Authorized
        API->>REG: Cancel registration
        REG->>DB: Retrieve registration
        alt Missing
            API-->>UI: 404
        else Not cancellable
            API-->>UI: 400
        else Cancellable
            REG->>DB: Set status CANCELLED + cancellation data
            REG->>DB: Release active-registration key
            REG->>DB: Create mandatory audit record
            DB-->>REG: Commit
            API-->>UI: 200 cancellation result
        end
    end
```

### Interaction Description

The cancellation operation verifies ownership and cancellability,
preserves the historical registration, changes status to CANCELLED,
releases the active-registration key and records the action in the audit
trail.

## 4.11 WF-011 - Manage Training Programs

| Scenario / Use Case \| A Training Administrator creates or updates
  programs, categories and capacity. \|

| --- \| --- \|

| Primary Actor \| Training Administrator \|

| Related Requirements \| BP-011; FR-018 to FR-021; BR-003; BR-014;
  BR-015; NFR-005 \|

| Design Gap / Inconsistency \| None. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor TA as Training Administrator
    participant UI as Program Management UI
    participant API as Admin Program API
    participant AUTH as Authorization
    participant PM as Program Management
    participant DB as MySQL
    TA->>UI: Create/update program/category/capacity
    UI->>API: POST/PUT admin program/category API
    API->>AUTH: Verify TRAINING_ADMINISTRATOR
    AUTH-->>API: Authorized
    API->>PM: Validate program data
    PM->>PM: Validate category, schedule and capacity
    opt Capacity update
        PM->>DB: Count REGISTERED participants
        DB-->>PM: Current registered count
        PM->>PM: Ensure new capacity >= registered count
    end
    alt Validation failure
        API-->>UI: 400
    else Valid
        PM->>DB: Save program/category/capacity + audit
        DB-->>PM: Commit
        API-->>UI: 200 / 201
    end
```

### Interaction Description

Program management enforces required program/category fields, the
single-occurrence schedule model and configurable capacity. Capacity
cannot be reduced below the current number of registered participants.

## 4.12 WF-012 - Registration Administration - View Only

| Scenario / Use Case \| A Training Administrator views and filters
  registrations within the approved role scope. \|

| --- \| --- \|

| Primary Actor \| Training Administrator \|

| Related Requirements \| BP-012; FR-022; FR-028; VE-009 \|

| Design Gap / Inconsistency \| Specific future Training Administrator
  registration mutation actions remain deferred and require controlled
  requirements/design change. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor TA as Training Administrator
    participant UI as Registration Management UI
    participant API as Admin Registration API
    participant AUTH as Authorization
    participant REG as Registration Service
    participant DB as MySQL
    TA->>UI: Open registration management
    UI->>API: GET /api/v1/admin/registrations
    API->>AUTH: Verify TRAINING_ADMINISTRATOR
    AUTH-->>API: Authorized
    API->>REG: Apply filters/pagination
    REG->>DB: Retrieve permitted registration data
    DB-->>REG: Registration list
    API-->>UI: 200 registration list
    opt View registration detail
        UI->>API: GET /api/v1/admin/registrations/:id
        REG->>DB: Read registration
        DB-->>REG: Registration
        API-->>UI: 200 registration detail
    end
```

### Interaction Description

The current design deliberately implements Training Administrator
registration management as view/filter/inspect only. No undocumented
mutation endpoint is introduced.

## 4.13 WF-013 - Record Attendance

| Scenario / Use Case \| A Trainer records attendance for registered
  participants in an assigned program. \|

| --- \| --- \|

| Primary Actor \| Trainer \|

| Related Requirements \| BP-013; FR-023; FR-024; BR-015; BR-016; DR-005
  \|

| Design Gap / Inconsistency \| None. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor T as Trainer
    participant UI as Attendance UI
    participant API as Attendance API
    participant AUTH as Authorization
    participant ATT as Attendance Service
    participant DB as MySQL
    T->>UI: Open assigned program
    UI->>API: GET attendance/registered participants
    API->>AUTH: Verify TRAINER and program assignment
    alt Program not assigned
        API-->>UI: 403
    else Authorized
        ATT->>DB: Query REGISTERED participants
        DB-->>ATT: Participant registrations
        ATT-->>UI: Participant list
        T->>UI: Mark PRESENT / ABSENT
        UI->>API: Attendance submission
        API->>ATT: Validate attendance
        ATT->>ATT: Verify registration belongs to program
        alt PRESENT
            ATT->>ATT: percentage = 100.00
        else ABSENT
            ATT->>ATT: percentage = 0.00
        end
        ATT->>DB: Save attendance + mandatory audit
        DB-->>ATT: Commit
        API-->>UI: Attendance result
    end
```

### Interaction Description

Attendance is limited to registered participants for the Trainer's
assigned program. Under the approved single-occurrence model, attendance
percentage is server-derived: PRESENT equals 100.00 and ABSENT equals
0.00.

## 4.14 WF-014 - Certificate Eligibility and Issuance

| Scenario / Use Case \| A Training Administrator evaluates eligibility
  and records certificate issuance. \|

| --- \| --- \|

| Primary Actor \| Training Administrator \|

| Related Requirements \| BP-014; FR-025; FR-026; BR-017; VE-013; DR-006
  \|

| Design Gap / Inconsistency \| The issuance record and technical
  certificate reference are defined, but final business-facing
  certificate document/number format remains deferred for business
  confirmation. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor TA as Training Administrator
    participant UI as Certificate Management UI
    participant API as Certificate API
    participant AUTH as Authorization
    participant CERT as Certificate Service
    participant DB as MySQL
    TA->>UI: Select participant/registration
    UI->>API: Request eligibility / issuance
    API->>AUTH: Verify TRAINING_ADMINISTRATOR
    AUTH-->>API: Authorized
    API->>CERT: Evaluate eligibility
    CERT->>DB: Retrieve registration + attendance
    DB-->>CERT: Attendance information
    CERT->>CERT: Check attendance percentage = 100%
    alt Attendance < 100%
        API-->>UI: Not eligible
    else 100% attendance
        CERT->>DB: Check existing certificate
        alt Certificate already issued
            API-->>UI: Reject duplicate issuance
        else Not previously issued
            CERT->>CERT: Generate unique opaque certificate reference
            CERT->>DB: Save certificate + mandatory audit
            DB-->>CERT: Commit
            API-->>UI: Created
        end
    end
```

### Interaction Description

Certificate issuance is permitted only when attendance is 100%. The
service also prevents duplicate issuance for the same registration and
records the issuance and audit event transactionally.

## 4.15 WF-015 - Generate Operational Reports

| Scenario / Use Case \| A Training Administrator generates one of the
  three approved reports. \|

| --- \| --- \|

| Primary Actor \| Training Administrator \|

| Related Requirements \| BP-015; FR-027; FR-028; DR-009; NFR-002;
  NFR-010 \|

| Design Gap / Inconsistency \| No code-generation blocker. CSV output
  is an implementation format within the approved reports, not an
  additional reporting function. \|

### Sequence Diagram

``` mermaid
sequenceDiagram
    actor TA as Training Administrator
    participant UI as Reports UI
    participant API as Reporting API
    participant AUTH as Authorization
    participant REP as Reporting Service
    participant DB as MySQL
    TA->>UI: Select report and reporting period
    UI->>API: GET approved report endpoint
    API->>AUTH: Verify TRAINING_ADMINISTRATOR
    alt Unauthorized / unsupported report
        API-->>UI: 403
    else Authorized
        API->>REP: Validate report parameters
        REP->>REP: Validate periodFrom / periodTo
        REP->>DB: Retrieve permitted reporting data
        DB-->>REP: Reporting dataset
        REP->>DB: Record report execution metadata
        REP-->>API: Generated report
        API-->>UI: 200 report data / CSV where requested
    end
```

### Interaction Description

The approved reports are Student Certificate Report, Student Program
Registration Report and Student Account Creation Report. The reporting
service validates parameters, retrieves only permitted data and returns
the requested report.

# 5. Cross-Workflow Security Interaction

The following sequence is a common technical interaction applied to
protected state-changing workflows. It is not an additional business
workflow.

``` mermaid
sequenceDiagram
    actor U as Authenticated User
    participant UI as Web UI
    participant SEC as Express Security Middleware
    participant AUTH as Session / Authorization
    participant API as Protected API
    participant AUD as Audit
    participant DB as MySQL
    U->>UI: Perform state-changing action
    UI->>SEC: Request + session cookie + X-CSRF-Token
    SEC->>AUTH: Validate session
    AUTH->>DB: Read session/account
    DB-->>AUTH: Identity + role + status
    AUTH->>AUTH: Check role/resource ownership
    alt Invalid session / unauthorized
        SEC-->>UI: 401 / 403
    else Authorized
        SEC->>SEC: Validate CSRF token
        alt Missing/invalid CSRF token
            SEC->>AUD: Record security event
            AUD->>DB: Persist audit
            SEC-->>UI: 403
        else Valid CSRF token
            SEC->>API: Execute protected operation
            API-->>UI: Operation response
        end
    end
```

State-changing cookie-authenticated requests require a server-issued
CSRF token in the X-CSRF-Token header. The common API contract also
requires correlation IDs and prohibits exposure of password hashes,
static keys, session identifiers and unmasked NRIC/Passport values.

# 6. Overall Consistency and Design-Gap Assessment

The sequence model is aligned to the approved application layering:
Bootstrap Web UI -\> Express.js Web/API Layer -\>
Authentication/Authorization -\> application/business modules -\>
repository/data-access layer -\> MySQL. Registration additionally uses
the approved notification outbox/worker and the external Email /
Notification Service.

No implementation-design blocker is identified for the confirmed
code-generation scope. The remaining notable items are governance or
deliberately deferred scope: Malaysian privacy/compliance confirmation
remains a production-release gate; System Administrator static-key
governance requires confirmation; approval-role segregation requires
organizational confirmation; Training Administrator registration
mutation beyond read-only viewing is deferred; and the final
business-facing certificate document/number format remains subject to
business confirmation.

# 7. Explicitly Excluded Behavior

-   Payment processing and paid-program workflow.

-   Bank-transfer proof submission or finance verification.

-   Waiting-list processing when a program is full.

-   HR or participant-management system integration.

-   Administrator approval of participant registration.

-   Multiple sessions for a single program.

-   Training Administrator registration mutations not explicitly
    approved by controlled requirements/design change.

# 8. Document Conclusion

This sequence-diagram specification provides an implementation-oriented
view of the approved Training Management System business workflows while
preserving the requirements and software-design boundaries. It is
suitable as a design reference for implementation, code review,
test-case derivation and requirements traceability.
