**TRAINING MANAGEMENT SYSTEM**

**UI Wireframe Specification**

Professional Baseline v1.2

| **Source of Truth**        | Training Management System Requirements Analysis v2.4                                |
|----------------------------|--------------------------------------------------------------------------------------|
| **Design Baseline**        | Software Design Document v1.15                                                       |
| **Architecture Baseline**  | Architecture Diagrams v1.2                                                           |
| **Workflow Baseline**      | Sequence Diagrams v1.0                                                               |
| **Technology Constraints** | Node.js, Express.js, Bootstrap, MySQL                                                |
| **Scope Control**          | Approved current-release functionality only; no unsupported functionality introduced |
| **Status**                 | UI Wireframe Specification derived from approved design baseline                     |

*Prepared for Development, QA, UAT, Delivery and Architecture Review*

# UI Wireframe Visual Overview

The following master rendering provides a consolidated visual overview of UI-001 through UI-015 using an HTML/CSS/Bootstrap-inspired presentation. The individual screen renderings are repeated in their corresponding detailed sections for implementation and review convenience.

<img src="/mnt/data/ui_md_media/media/image1.png" style="width:7in;height:4.66667in" />

*Figure 1 - Master UI Wireframe Overview (UI-001 to UI-015)*

# 1. Purpose and Design Principles

This document converts the approved UI baseline into a structured, implementation-ready wireframe specification. It preserves the approved actors, workflows, validation boundaries, security controls and current-release scope.

**Design principles**

- Use only approved requirements and design decisions as the basis for UI behavior.

- Do not introduce payment, bank transfer, waiting list, HR integration, administrator registration approval, multi-session programs or undocumented registration mutations.

- Apply role-based navigation and server-side authorization to protected functions.

- Mask NRIC/Passport values on ordinary participant-facing screens and standard reports.

- Use server-side validation, CSRF protection for state-changing authenticated requests, and controlled pagination/filtering for list views.

# 2. Screen List

| **ID** | **Screen**                     | **Actor**                                               | **Workflow**                  |
|--------|--------------------------------|---------------------------------------------------------|-------------------------------|
| UI-001 | Participant Account Creation   | Participant                                             | WF-001                        |
| UI-002 | Participant Login              | Participant                                             | WF-002                        |
| UI-003 | Program Listing                | Participant                                             | WF-007                        |
| UI-004 | Program Details                | Participant                                             | WF-008                        |
| UI-005 | Registration Confirmation      | Participant                                             | WF-009                        |
| UI-006 | My Registrations               | Participant                                             | WF-010 / registration viewing |
| UI-007 | System Administrator Bootstrap | Static-key holder                                       | WF-003                        |
| UI-008 | Administrative Login           | System Administrator / Training Administrator / Trainer | WF-004 / WF-006               |
| UI-009 | User Account Management        | System Administrator                                    | WF-005                        |
| UI-010 | Program Management             | Training Administrator                                  | WF-011                        |
| UI-011 | Category Management            | Training Administrator                                  | WF-011                        |
| UI-012 | Registration Management        | Training Administrator                                  | WF-012                        |
| UI-013 | Attendance Management          | Trainer                                                 | WF-013                        |
| UI-014 | Certificate Management         | Training Administrator                                  | WF-014                        |
| UI-015 | Reports                        | Training Administrator                                  | WF-015                        |

# 3. Detailed UI Wireframes

## UI-001 — Participant Account Creation

<img src="/mnt/data/ui_md_media/media/image2.png" style="width:2.53034in;height:3.75in" />

*Figure 2 - Rendered UI-001 Wireframe*

| **Purpose**              | Create a participant account.                          |
|--------------------------|--------------------------------------------------------|
| **Actor**                | Prospective Participant                                |
| **Related Requirements** | BP-001; FR-001; FR-008; DR-001; DR-007; VE-014; VE-015 |
| **Related Workflow**     | WF-001                                                 |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+--------------------------------------------------------------+<br />
| TRAINING MANAGEMENT SYSTEM |<br />
+--------------------------------------------------------------+<br />
| CREATE PARTICIPANT ACCOUNT |<br />
| NRIC / Passport No. * [_______________________________] |<br />
| Name * [_______________________________] |<br />
| Email Address * [_______________________________] |<br />
| Mobile No. * [_______________________________] |<br />
| Password * [_______________________________] |<br />
| |<br />
| [ Create Account ] [ Back to Login ] |<br />
| Validation / outcome message area |<br />
+--------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- NRIC/Passport number

- Name

- Email address

- Mobile number

- Password

**Actions**

- Create Account

- Back to Login

**Validation messages / conditions**

- Required-field and format validation

- Password policy validation

- Duplicate email validation

- Duplicate NRIC/Passport validation

**Navigation:** Account creation -\> success -\> Participant Login.

**Design note:** Participant username, account identifier, PARTICIPANT role and ACTIVE status are server-generated/assigned; the participant does not enter them.

## UI-002 — Participant Login

<img src="/mnt/data/ui_md_media/media/image3.png" style="width:2.07524in;height:3.75in" />

*Figure 3 - Rendered UI-002 Wireframe*

| **Purpose**              | Authenticate an existing participant.   |
|--------------------------|-----------------------------------------|
| **Actor**                | Participant                             |
| **Related Requirements** | BP-002; FR-002; BR-001; VE-016; NFR-003 |
| **Related Workflow**     | WF-002                                  |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+--------------------------------------------------------------+<br />
| TRAINING MANAGEMENT SYSTEM |<br />
+--------------------------------------------------------------+<br />
| PARTICIPANT LOGIN |<br />
| Email Address * [_____________________________________] |<br />
| Password * [_____________________________________] |<br />
| |<br />
| [ Login ] |<br />
| Don't have an account? [ Create Account ] |<br />
| Authentication message |<br />
+--------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Email address

- Password

**Actions**

- Login

- Create Account

**Validation messages / conditions**

- Email is required

- Password is required

- Invalid credentials

- Account locked or disabled

**Navigation:** Login -\> Program Listing on success.

**Design note:** Authentication validates credentials, ACTIVE status and PARTICIPANT role before creating a server-side session.

## UI-003 — Program Listing

<img src="/mnt/data/ui_md_media/media/image4.png" style="width:3.45874in;height:3.75in" />

*Figure 4 - Rendered UI-003 Wireframe*

| **Purpose**              | Browse available training programs.                            |
|--------------------------|----------------------------------------------------------------|
| **Actor**                | Participant                                                    |
| **Related Requirements** | BP-007; FR-003; FR-004; FR-032; BR-014; VE-012; DR-002; DR-003 |
| **Related Workflow**     | WF-007                                                         |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+----------------------------------------------------------------+<br />
| TRAINING MANAGEMENT SYSTEM Login / My Registr. |<br />
+----------------------------------------------------------------+<br />
| TRAINING PROGRAMS |<br />
| Category: [ All Categories v ] |<br />
| Availability: [ ... v ] |<br />
| |<br />
| Code | Program Name | Date | Seats |<br />
| PRG-001 | Node.js Fundamentals | 10/11/26 | 15 / 20 |<br />
| PRG-002 | Java Programming | 15/11/26 | FULL |<br />
| |<br />
| [ Previous ] Page 1 [ Next ] |<br />
| Select Program -&gt; [ View Details ] |<br />
+----------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Category filter

- Availability filter

**Actions**

- Filter

- Paginate

- View Details

**Validation messages / conditions**

- Invalid filter values

- No programs available

**Navigation:** Program Listing -\> Program Details.

**Design note:** Visible programs are returned as a paginated list with capacity and available-seat information.

## UI-004 — Program Details

<img src="/mnt/data/ui_md_media/media/image5.png" style="width:3.09466in;height:3.75in" />

*Figure 5 - Rendered UI-004 Wireframe*

| **Purpose**              | Review a selected program and its current availability. |
|--------------------------|---------------------------------------------------------|
| **Actor**                | Participant                                             |
| **Related Requirements** | BP-008; FR-005; FR-006; FR-030; DR-002                  |
| **Related Workflow**     | WF-008                                                  |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+----------------------------------------------------------------+<br />
| PROGRAM DETAILS |<br />
+----------------------------------------------------------------+<br />
| Program Code: PRG-001 |<br />
| Program Name: Node.js Fundamentals |<br />
| Category: IT Programming |<br />
| Description: [......................................] |<br />
| Learning Objectives: [......................................] |<br />
| Target Audience: [......................................] |<br />
| Prerequisites: [Optional] |<br />
| Trainer: [Trainer Name] |<br />
| Date/Time: [Date] [Start-End] |<br />
| Venue / Delivery: [......................................] |<br />
| Capacity: 20 Available Seats: 15 |<br />
| Registration: [Opening] - [Closing] |<br />
| Certificate: [Certificate information] |<br />
| |<br />
| [ Back ] [ REGISTER ] |<br />
+----------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields:** No direct editable participant input on this view except where actions open a controlled form.

**Actions**

- Back

- Register

**Validation messages / conditions**

- Program unavailable or not visible

- Registration unavailable/full/closed as applicable

**Navigation:** Program Listing -\> Program Details -\> Login if needed -\> Registration Confirmation.

**Design note:** Program detail includes the approved description, objectives, audience, prerequisites, category, trainer, schedule, venue/delivery mode, capacity, available seats, registration window and certificate information.

## UI-005 — Registration Confirmation

<img src="/mnt/data/ui_md_media/media/image6.png" style="width:2.58495in;height:3.75in" />

*Figure 6 - Rendered UI-005 Wireframe*

| **Purpose**              | Review selected program and read-only participant information before registration submission. |
|--------------------------|-----------------------------------------------------------------------------------------------|
| **Actor**                | Participant                                                                                   |
| **Related Requirements** | FR-007–FR-014; FR-030; FR-031; BR-001–BR-009; BR-012; BR-013; VE-001–VE-011                   |
| **Related Workflow**     | WF-009                                                                                        |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+----------------------------------------------------------------+<br />
| CONFIRM REGISTRATION |<br />
+----------------------------------------------------------------+<br />
| PARTICIPANT INFORMATION |<br />
| NRIC / Passport: ******1234 [Read Only] |<br />
| Name: Participant Name [Read Only] |<br />
| Email: participant@email [Read Only] |<br />
| Mobile: 01X-XXXXXXX [Read Only] |<br />
| |<br />
| PROGRAM |<br />
| Program: Node.js Fundamentals |<br />
| Date/Time: 10/11/2026 09:00 - 17:00 |<br />
| Availability: 15 seats |<br />
| |<br />
| Registration is validated again when submitted. |<br />
| [ Cancel ] [ Confirm Registration ] |<br />
| Validation / registration outcome |<br />
+----------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields:** No direct editable participant input on this view except where actions open a controlled form.

**Actions**

- Cancel

- Confirm Registration

**Validation messages / conditions**

- Authenticated participant required

- Registration window must be open

- Program must be visible/open

- No active duplicate registration

- No schedule overlap

- Capacity must be available

**Navigation:** Program Details -\> Registration Confirmation -\> My Registrations / success outcome.

**Design note:** Participant data is server-derived and read-only; NRIC/Passport is masked. Registration, mandatory audit and notification outbox are committed transactionally; email delivery is asynchronous.

## UI-006 — My Registrations

<img src="/mnt/data/ui_md_media/media/image7.png" style="width:5.31122in;height:3.75in" />

*Figure 7 - Rendered UI-006 Wireframe*

| **Purpose**              | View own registrations and cancel an eligible registration. |
|--------------------------|-------------------------------------------------------------|
| **Actor**                | Participant                                                 |
| **Related Requirements** | FR-015; FR-016; FR-017; BR-010; BR-011; BR-018              |
| **Related Workflow**     | WF-010                                                      |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+----------------------------------------------------------------+<br />
| MY REGISTRATIONS |<br />
+----------------------------------------------------------------+<br />
| Reference | Program | Date | Status | Action |<br />
| REG-001 | Node.js | 10/11/26 | REGISTERED | View/Cancel|<br />
| REG-002 | Java | 15/11/26 | CANCELLED | View |<br />
| [ Previous ] Page 1 [ Next ] |<br />
+----------------------------------------------------------------+<br />
| CANCEL REGISTRATION |<br />
| Program: Node.js Fundamentals |<br />
| Cancellation Reason: [____________________________________] |<br />
| [ Keep Registration ] [ Confirm Cancellation ] |<br />
+----------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Cancellation reason (when cancelling)

**Actions**

- View

- Cancel

- Confirm Cancellation

**Validation messages / conditions**

- Registration not found

- Cancellation not permitted

- Unauthorized

- Cancellation successful

**Navigation:** My Registrations -\> View / Cancel -\> refreshed registration list.

**Design note:** Cancellation is permitted before the scheduled start time. Historical registration remains as CANCELLED and may later be re-registered subject to normal validation.

## UI-007 — System Administrator Bootstrap

<img src="/mnt/data/ui_md_media/media/image8.png" style="width:3.36735in;height:3.75in" />

*Figure 8 - Rendered UI-007 Wireframe*

| **Purpose**              | Create the initial System Administrator account using the configured static administration key. |
|--------------------------|-------------------------------------------------------------------------------------------------|
| **Actor**                | Authorized static-key holder                                                                    |
| **Related Requirements** | BP-003; FR-035; BR-021; VE-018; VE-019; NFR-003                                                 |
| **Related Workflow**     | WF-003                                                                                          |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+--------------------------------------------------------------+<br />
| SYSTEM ADMINISTRATOR INITIAL SETUP |<br />
+--------------------------------------------------------------+<br />
| Static Administration Key * [___________________________] |<br />
| Name * [___________________________] |<br />
| Email * [___________________________] |<br />
| Password * [___________________________] |<br />
| |<br />
| [ Create System Administrator ] |<br />
| Bootstrap outcome / validation |<br />
+--------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Static administration key

- Name

- Email

- Password

**Actions**

- Create System Administrator

**Validation messages / conditions**

- Static key required/invalid

- Account information invalid

- Duplicate account information

- Active System Administrator already exists

**Navigation:** Bootstrap -\> Administrative Login on success.

**Design note:** The key is validated against the deployment secret and must not be persisted or logged.

## UI-008 — Administrative Login

<img src="/mnt/data/ui_md_media/media/image9.png" style="width:2.7398in;height:3.75in" />

*Figure 9 - Rendered UI-008 Wireframe*

| **Purpose**              | Authenticate System Administrator, Training Administrator or Trainer. |
|--------------------------|-----------------------------------------------------------------------|
| **Actor**                | System Administrator / Training Administrator / Trainer               |
| **Related Requirements** | FR-028; FR-033; FR-034; VE-017; NFR-002; NFR-003                      |
| **Related Workflow**     | WF-004 / WF-006                                                       |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+--------------------------------------------------------------+<br />
| TRAINING MANAGEMENT SYSTEM |<br />
+--------------------------------------------------------------+<br />
| ADMINISTRATIVE LOGIN |<br />
| Email * [___________________________________________] |<br />
| Password * [___________________________________________] |<br />
| |<br />
| [ Login ] |<br />
| Authentication message |<br />
+--------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Email

- Password

**Actions**

- Login

**Validation messages / conditions**

- Required credentials

- Invalid credentials

- Inactive/locked/disabled account

- Role not permitted

**Navigation:** Successful login -\> role-authorized administrative function.

**Design note:** Role-specific authorization determines permitted post-login functions.

## UI-009 — User Account Management

<img src="/mnt/data/ui_md_media/media/image10.png" style="width:5.61735in;height:3.75in" />

*Figure 10 - Rendered UI-009 Wireframe*

| **Purpose**              | Create Training Administrator or Trainer accounts. |
|--------------------------|----------------------------------------------------|
| **Actor**                | System Administrator                               |
| **Related Requirements** | FR-028; FR-029; DR-007; DR-008                     |
| **Related Workflow**     | WF-005                                             |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+----------------------------------------------------------------+<br />
| SYSTEM ADMINISTRATOR &gt; USER ACCOUNT MANAGEMENT |<br />
+----------------------------------------------------------------+<br />
| CREATE STAFF ACCOUNT |<br />
| Name * [___________________________________________] |<br />
| Email * [___________________________________________] |<br />
| Password * [___________________________________________] |<br />
| Role * [ Training Administrator / Trainer v] |<br />
| |<br />
| [ Create Account ] |<br />
| Account creation outcome / validation |<br />
+----------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Name

- Email

- Password

- Role

**Actions**

- Create Account

**Validation messages / conditions**

- Required fields

- Permitted role only

- Duplicate account information

- Password rules

**Navigation:** Administrative Login -\> User Account Management.

**Design note:** Only System Administrator may create Training Administrator and Trainer accounts.

## UI-010 — Program Management

<img src="/mnt/data/ui_md_media/media/image11.png" style="width:6.09184in;height:3.75in" />

*Figure 11 - Rendered UI-010 Wireframe*

| **Purpose**              | Create and update training programs, including capacity.        |
|--------------------------|-----------------------------------------------------------------|
| **Actor**                | Training Administrator                                          |
| **Related Requirements** | BP-011; FR-018; FR-019; FR-021; BR-003; BR-014; BR-015; NFR-005 |
| **Related Workflow**     | WF-011                                                          |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+----------------------------------------------------------------+<br />
| TRAINING ADMINISTRATOR &gt; PROGRAM MANAGEMENT |<br />
+----------------------------------------------------------------+<br />
| [ Create Program ] |<br />
| Code | Name | Category | Date | Capacity | Registered | Status |<br />
| ... | ... | ... | ... | 20 | 12 | OPEN |<br />
| [ View / Edit ] |<br />
+----------------------------------------------------------------+<br />
| CREATE / UPDATE PROGRAM |<br />
| Code * [____________________________] |<br />
| Name * [____________________________] |<br />
| Description * [____________________________] |<br />
| Objectives * [____________________________] |<br />
| Target Audience * [____________________________] |<br />
| Prerequisites [____________________________] |<br />
| Category * [__________________________ v] |<br />
| Trainer * [__________________________ v] |<br />
| Training Date * [____________] |<br />
| Start / End Time * [________] [________] |<br />
| Venue [____________________________] |<br />
| Delivery Mode * [__________________________ v] |<br />
| Capacity * [________] |<br />
| Registration Window* [____________] - [____________] |<br />
| Status * [__________________________ v] |<br />
| Certificate Type [____________________________] |<br />
| [ Cancel ] [ Save ] |<br />
+----------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Approved program fields

- Capacity

- Registration window

- Status

**Actions**

- Create Program

- View/Edit

- Save

- Cancel

**Validation messages / conditions**

- Required program fields

- Valid category and active Trainer

- End time after start time

- Valid registration window

- Capacity \> 0

- Capacity cannot be reduced below REGISTERED count

**Navigation:** Administrative Login -\> Program Management -\> Create/Edit.

**Design note:** Program lifecycle and capacity rules are enforced server-side and transactionally.

## UI-011 — Category Management

<img src="/mnt/data/ui_md_media/media/image12.png" style="width:4.15578in;height:3.75in" />

*Figure 12 - Rendered UI-011 Wireframe*

| **Purpose**              | Maintain training program categories. |
|--------------------------|---------------------------------------|
| **Actor**                | Training Administrator                |
| **Related Requirements** | FR-020                                |
| **Related Workflow**     | WF-011                                |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+---------------------------------------------------------------+<br />
| TRAINING ADMINISTRATOR &gt; CATEGORY MANAGEMENT |<br />
+---------------------------------------------------------------+<br />
| [ Create Category ] |<br />
| Name | Description | Status | Action |<br />
| Programming | Software development | Active | Edit |<br />
| |<br />
| CATEGORY DETAILS |<br />
| Name * [__________________________________________] |<br />
| Description [__________________________________________] |<br />
| Status * [_______________________________________ v] |<br />
| [ Cancel ] [ Save ] |<br />
+---------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Name

- Description

- Status

**Actions**

- Create Category

- Edit

- Save

- Cancel

**Validation messages / conditions**

- Required category fields

- Invalid/duplicate category information as applicable

**Navigation:** Administrative Login -\> Category Management.

**Design note:** Category management supports the approved create/update program-management workflow.

## UI-012 — Registration Management

<img src="/mnt/data/ui_md_media/media/image13.png" style="width:6.14272in;height:3.75in" />

*Figure 13 - Rendered UI-012 Wireframe*

| **Purpose**              | View, filter and inspect operational registrations. |
|--------------------------|-----------------------------------------------------|
| **Actor**                | Training Administrator                              |
| **Related Requirements** | BP-012; FR-022; FR-028; VE-009                      |
| **Related Workflow**     | WF-012                                              |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+--------------------------------------------------------------------+<br />
| TRAINING ADMINISTRATOR &gt; REGISTRATION MANAGEMENT |<br />
+--------------------------------------------------------------------+<br />
| FILTERS |<br />
| Date: [ From ] [ To ] Program: [________________________ v] |<br />
| Category: [________________ v] Student: [____________________] |<br />
| Status: [________________ v] [ Search ] [ Clear ] |<br />
| |<br />
| Reg ID | Student | Program | Registered Date | Status | Action |<br />
| ... | ... | ... | ... | ... | View |<br />
| [ Previous ] Page 1 [ Next ] |<br />
+--------------------------------------------------------------------+<br />
| REGISTRATION DETAIL - READ ONLY |<br />
| Registration Reference: ... Student: ... |<br />
| Program: ... Registration Date: ... |<br />
| Status: ... Cancellation Date: ... |<br />
| Cancellation Reason: ... |<br />
| [ Back ] |<br />
+--------------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Date range

- Program

- Category

- Student

- Status

**Actions**

- Search

- Clear

- View

- Back

**Validation messages / conditions**

- Invalid filter values

- Registration not found

- Unauthorized access

**Navigation:** Administrative Login -\> Registration Management -\> Registration Detail.

**Design note:** Current baseline is strictly read-only: View / Filter / Inspect only. No administrator cancellation, approval, rejection or edit action is introduced.

## UI-013 — Attendance Management

<img src="/mnt/data/ui_md_media/media/image14.png" style="width:3.3722in;height:3.75in" />

*Figure 14 - Rendered UI-013 Wireframe*

| **Purpose**              | Record attendance for registered participants in an assigned program. |
|--------------------------|-----------------------------------------------------------------------|
| **Actor**                | Trainer                                                               |
| **Related Requirements** | BP-013; FR-023; FR-024; BR-015; BR-016; DR-005                        |
| **Related Workflow**     | WF-013                                                                |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+----------------------------------------------------------------+<br />
| TRAINER &gt; ATTENDANCE |<br />
+----------------------------------------------------------------+<br />
| Program: [ Assigned Program v ] |<br />
| Date: [ Training Date ] |<br />
| |<br />
| Participant Registration Ref Attendance |<br />
| Participant A REG-001 [ PRESENT v ] |<br />
| Participant B REG-002 [ ABSENT v ] |<br />
| Participant C REG-003 [ PRESENT v ] |<br />
| |<br />
| [ Save Attendance ] |<br />
| Save outcome / validation |<br />
+----------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Assigned program

- Attendance status PRESENT/ABSENT

**Actions**

- Save Attendance

**Validation messages / conditions**

- Program must be assigned to Trainer

- Participant must be REGISTERED

- One attendance record per registration

- Only PRESENT or ABSENT permitted

**Navigation:** Administrative Login -\> Attendance Management.

**Design note:** Attendance percentage is server-derived: PRESENT = 100.00 and ABSENT = 0.00; the client does not supply percentage.

## UI-014 — Certificate Management

<img src="/mnt/data/ui_md_media/media/image15.png" style="width:3.81996in;height:3.75in" />

*Figure 15 - Rendered UI-014 Wireframe*

| **Purpose**              | Evaluate certificate eligibility and record certificate issuance. |
|--------------------------|-------------------------------------------------------------------|
| **Actor**                | Training Administrator                                            |
| **Related Requirements** | FR-025; FR-026; BR-017; DR-006                                    |
| **Related Workflow**     | WF-014                                                            |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+----------------------------------------------------------------+<br />
| TRAINING ADMINISTRATOR &gt; CERTIFICATE MANAGEMENT |<br />
+----------------------------------------------------------------+<br />
| Program: [ Selected Program v ] |<br />
| Participant | Attendance | Eligibility | Certificate | Action |<br />
| Student A | 100% | ELIGIBLE | Not Issued | Issue |<br />
| Student B | 0% | NOT ELIGIBLE | -- | -- |<br />
+----------------------------------------------------------------+<br />
| CERTIFICATE ISSUANCE |<br />
| Participant: Student A [Read Only] |<br />
| Program: Node.js Fundamentals [Read Only] |<br />
| Attendance: 100% [Read Only] |<br />
| Eligibility: ELIGIBLE [Read Only] |<br />
| Certificate Type: [.................................] |<br />
| Completion Date: [.................................] |<br />
| [ Cancel ] [ Record Certificate Issuance ] |<br />
+----------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Program selection

- Certificate Type

- Completion Date

**Actions**

- Issue

- Record Certificate Issuance

- Cancel

**Validation messages / conditions**

- Attendance must equal 100%

- Only one certificate per registration

- Registration/participant/program integrity must be valid

**Navigation:** Administrative Login -\> Certificate Management -\> Issuance.

**Design note:** Current release records issuance only. Certificate PDF/document generation, template/signatory details and business-facing numbering format are deferred.

## UI-015 — Reports

<img src="/mnt/data/ui_md_media/media/image16.png" style="width:3.65205in;height:3.75in" />

*Figure 16 - Rendered UI-015 Wireframe*

| **Purpose**              | Generate one of the three approved Training Administrator reports. |
|--------------------------|--------------------------------------------------------------------|
| **Actor**                | Training Administrator                                             |
| **Related Requirements** | FR-027                                                             |
| **Related Workflow**     | WF-015                                                             |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>+----------------------------------------------------------------+<br />
| TRAINING ADMINISTRATOR &gt; REPORTS |<br />
+----------------------------------------------------------------+<br />
| Report Type * [ Student Certificate Report v ] |<br />
| Reporting Period * |<br />
| From: [ DD/MM/YYYY ] To: [ DD/MM/YYYY ] |<br />
| Additional approved report-specific filters |<br />
| [...........................................................] |<br />
| [ Generate Report ] |<br />
+----------------------------------------------------------------+<br />
| REPORT RESULTS |<br />
| [Report Name] Period: [From] - [To] |<br />
| Approved report columns |<br />
| ... |<br />
| [ Previous ] Page 1 [ Next ] [ Export CSV ] |<br />
+----------------------------------------------------------------+</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

**Input fields**

- Report type

- Period From

- Period To

- Approved report-specific filters

**Actions**

- Generate Report

- Paginate

- Export CSV

**Validation messages / conditions**

- Report type required

- From/To required

- Valid reporting period

- Approved filters only

**Navigation:** Administrative Login -\> Reports -\> Results / CSV export.

**Design note:** Only Student Certificate Report, Student Program Registration Report and Student Account Creation Report are approved. CSV is an implementation convenience within those reports.

# 4. Navigation Structure

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr class="header">
<th>PUBLIC<br />
|<br />
+-- Create Participant Account (UI-001)<br />
| +-- Participant Login (UI-002)<br />
|<br />
+-- Program Listing (UI-003)<br />
| +-- Program Details (UI-004)<br />
| +-- Login if needed<br />
| +-- Registration Confirmation (UI-005)<br />
|<br />
+-- Administrative Login (UI-008)<br />
<br />
PARTICIPANT<br />
+-- Program Listing (UI-003)<br />
| +-- Program Details (UI-004)<br />
| +-- Registration Confirmation (UI-005)<br />
+-- My Registrations (UI-006)<br />
<br />
TRAINING ADMINISTRATOR<br />
+-- Program Management (UI-010)<br />
+-- Category Management (UI-011)<br />
+-- Registration Management (UI-012)<br />
+-- Certificate Management (UI-014)<br />
+-- Reports (UI-015)<br />
<br />
TRAINER<br />
+-- Attendance Management (UI-013)<br />
<br />
SYSTEM ADMINISTRATOR<br />
+-- User Account Management (UI-009)<br />
<br />
INITIAL SYSTEM SETUP<br />
+-- System Administrator Bootstrap (UI-007)</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# 5. Requirements and Workflow Traceability

| **Screen**                              | **Key Requirements**                                                                            | **Workflow**    |
|-----------------------------------------|-------------------------------------------------------------------------------------------------|-----------------|
| UI-001 — Participant Account Creation   | Create a participant account.                                                                   | WF-001          |
| UI-002 — Participant Login              | Authenticate an existing participant.                                                           | WF-002          |
| UI-003 — Program Listing                | Browse available training programs.                                                             | WF-007          |
| UI-004 — Program Details                | Review a selected program and its current availability.                                         | WF-008          |
| UI-005 — Registration Confirmation      | Review selected program and read-only participant information before registration submission.   | WF-009          |
| UI-006 — My Registrations               | View own registrations and cancel an eligible registration.                                     | WF-010          |
| UI-007 — System Administrator Bootstrap | Create the initial System Administrator account using the configured static administration key. | WF-003          |
| UI-008 — Administrative Login           | Authenticate System Administrator, Training Administrator or Trainer.                           | WF-004 / WF-006 |
| UI-009 — User Account Management        | Create Training Administrator or Trainer accounts.                                              | WF-005          |
| UI-010 — Program Management             | Create and update training programs, including capacity.                                        | WF-011          |
| UI-011 — Category Management            | Maintain training program categories.                                                           | WF-011          |
| UI-012 — Registration Management        | View, filter and inspect operational registrations.                                             | WF-012          |
| UI-013 — Attendance Management          | Record attendance for registered participants in an assigned program.                           | WF-013          |
| UI-014 — Certificate Management         | Evaluate certificate eligibility and record certificate issuance.                               | WF-014          |
| UI-015 — Reports                        | Generate one of the three approved Training Administrator reports.                              | WF-015          |

# 6. Common UI Interaction and Security Rules

**Common rules**

- Protected screens use role-based navigation and server-side authorization; hiding a button in the browser is not an authorization control.

- All state-changing cookie-authenticated requests require the server-issued CSRF token.

- List endpoints use server-side filtering, deterministic sorting and pagination; unbounded list retrieval is not exposed.

- Validation is displayed near the relevant field where practical, with page-level messages for business-rule failures.

- Standard backend outcomes are represented consistently: 400 validation, 401 authentication, 403 authorization, 404 not found, 409 conflict and 500 unexpected server error.

- NRIC/Passport is masked on ordinary participant-facing screens and standard reports; full values are restricted to authorized administrative contexts.

- UI displays program/business times in the configured business-local timezone while persisted timestamps follow the approved UTC design.

# 7. Design Gaps and Inconsistencies

| **ID**     | **Item**                                     | **UI Disposition**                                                                                                                       |
|------------|----------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| DG-001     | Malaysian privacy/compliance confirmation    | Implement approved masking/access-control baseline; final compliance/privacy approval remains a production-release gate.                 |
| DG-002     | System Administrator static-key governance   | UI-007 is implementable. Operational ownership, rotation, revocation and compromise handling require production governance confirmation. |
| DG-007     | Training Administrator registration mutation | UI-012 remains read-only. Do not add Edit, Approve, Reject or Cancel actions.                                                            |
| Deferred   | Certificate document output                  | UI-014 records issuance only. Do not introduce certificate PDF/template/signatory/business-numbering functionality.                      |
| Governance | Formal organizational approvals              | Do not alter UI scope; approvals remain governance/release matters.                                                                      |

**Scope exclusions:** No payment processing, bank transfer, waiting list, HR integration, administrator registration approval, multi-session program functionality or undocumented registration-management mutation is included.

# 8. Conclusion

The resulting wireframe specification is aligned to Requirements Analysis v2.4, Software Design Document v1.15, Architecture Diagrams v1.2 and Sequence Diagrams v1.0. It expands the approved baseline into a professional screen-by-screen interaction specification without expanding the approved business scope.
