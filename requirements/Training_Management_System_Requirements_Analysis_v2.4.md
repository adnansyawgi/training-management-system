Requirements Analysis Document

Training Management System

| **Item**           | **Details**                                                                                                |
|--------------------|------------------------------------------------------------------------------------------------------------|
| Document Status    | Requirements Analysis — Governance Confirmation Pending                                                    |
| Purpose            | Foundation for System Design, Development, Test Scripts, and UAT                                           |
| System Description | A web application that lists training programs and allows participants to register for available programs. |

Analysis principle: Where the business information does not define a rule, the requirement is explicitly marked as an assumption, recommendation, open question, or requirement gap rather than being invented.

# 1. Document Governance and Sign-Off

## 1.1 Document Control

This document is the controlled Business Requirements / Requirements Analysis baseline for the Training Management System. Changes to the controlled baseline shall be managed through formal change control. The controlled version shall be maintained in the organization-approved document repository with access controlled according to role and project governance.

| **Control Item**                      | **Controlled Value**                                                        |
|---------------------------------------|-----------------------------------------------------------------------------|
| Document Title                        | Training Management System Business Requirement                             |
| Document Type                         | Requirements Baseline                                                       |
| Current Version                       | 2.4                                                                         |
| Current Status                        | Ready for System Design — Governance Confirmation Pending                   |
| Business Owner                        | Training Management / Business Sponsor — Adnan Syawgi                       |
| Product / Project Owner               | Adnan Syawgi                                                                |
| Business Analyst / Requirements Owner | Adnan Syawgi                                                                |
| Technical Owner                       | Adnan Syawgi                                                                |
| QA / UAT Owner                        | Adnan Syawgi                                                                |
| Compliance / Privacy Reviewer         | Pending organizational assignment                                           |
| Document Repository                   | Organization-approved controlled repository                                 |
| Review Cycle                          | At each material requirement change and before System Design / UAT baseline |

## 1.2 Version History

The following history preserves the progression of the requirements document and records the previous draft versions rather than treating the current document as a standalone artifact.

| **Version** | **Stage / Date**                                         | **Description of Change**                                                                                                                                                                                                                                                                                                                                               | **Status**                                                      |
|-------------|----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| 0.1         | Initial Draft                                            | Initial requirements analysis derived from the high-level Training Management System business objective. Defined objectives, scope, actors, business processes, functional requirements, NFRs, business rules, data requirements, validations, integrations, assumptions and open questions.                                                                            | Draft                                                           |
| 0.2         | Requirements Clarification                               | Updated based on stakeholder answers covering participant accounts, participant information, eligibility, capacity, waiting list, cancellation, modification, approval, payment, categories, sessions, multiple-program registration, registration status, email confirmation, attendance, certificates, reporting, roles, retention and HR integration.                | Draft — Clarified                                               |
| 0.3         | Final Requirements Draft                                 | Converted confirmed answers into formal requirements, business rules, validations, data requirements, actors, processes and scope. Added Training Administrator, attendance and certificate processes, operational reporting and startup NFR recommendations.                                                                                                           | Draft — Finalized                                               |
| 1.0         | Requirements Baseline Candidate                          | Requirements prepared for formal business review and sign-off. Remaining items were identified for stakeholder confirmation.                                                                                                                                                                                                                                            | Pending Sign-Off                                                |
| 1.1         | Governance Update                                        | Added MNC-level document governance, document control, formal version history, approval/sign-off matrix, change-control procedure, review criteria, distribution controls and baseline management.                                                                                                                                                                      | Superseded                                                      |
| 1.2         | Stakeholder Clarification                                | Incorporated confirmed program categories, certificate eligibility and format, required reports, administrative permission matrix, separate Training Administrator role, 99% 24/7 availability, 2,000 first-year students, 100 concurrent users and Malaysian privacy/compliance baseline.                                                                              | Superseded                                                      |
| 1.3         | Current Requirements Baseline                            | Consolidated all prior requirements and governance updates. Includes confirmed business requirements, recommended operating controls, Malaysian privacy/compliance baseline and final sign-off governance.                                                                                                                                                              | Current Controlled Draft                                        |
| 1.4         | Data Requirements Update                                 | Updated Section 8 Data Requirements to align mandatory/optional fields with the current requirements baseline, including making payment-related registration fields optional because payment is not required in the current release.                                                                                                                                    | Superseded                                                      |
| 1.5         | Requirements Consistency and Traceability Update         | Corrected business-process coverage and numbering; aligned cancellation with current-release scope; resolved the separate Training Administrator role; aligned reporting requirements and traceability; removed current-release payment/refund data fields; added account creation/authentication validation coverage; and normalized governance/status wording.        | Superseded                                                      |
| 1.7         | Business Requirement Update — Actor Model                | Updated the actor model: certificate responsibilities were assigned to the Training Administrator; attendance responsibilities were assigned to the Trainer; and the System Administrator was given responsibility for registering and maintaining Training Administrator and Trainer accounts.                                                                         | Superseded                                                      |
| 1.8         | Requirements Consistency Correction                      | Corrected document versioning, actor-model references, functional requirement count, traceability duplication, section cross-reference, certificate criterion wording, process wording and dependency wording. No new business scope introduced.                                                                                                                        | Superseded                                                      |
| 1.9         | Requirements Precision and Traceability Correction       | Corrected certificate administration role wording, attendance actor wording, registration-management wording, certificate criterion alignment, confirmed availability and capacity requirement wording, attendance data-field classification, and requirements traceability. No new business scope introduced.                                                          | Superseded                                                      |
| 2.0         | Final Requirements Baseline                              | Finalized active actor descriptions, corrected requirements traceability, ensured all functional requirements have meaningful traceability, standardized System Design readiness wording, and confirmed NFR-013 as a mandatory maintainability requirement. No new business scope introduced.                                                                           | Superseded                                                      |
| 2.1         | Business Process Completeness Update                     | Added explicit business processes for System Administrator authentication, System Administrator creation of Training Administrator and Trainer accounts, and Training Administrator / Trainer authentication. Added corresponding functional requirements and validation coverage, and updated business-process traceability. No unrelated business scope introduced.   | Superseded                                                      |
| 2.2         | Requirements Completeness Correction                     | Added the System Administrator account-creation business process and corresponding functional requirement and validation coverage; clarified administrative account scope wording; and updated business-process numbering and traceability. No unrelated business scope introduced.                                                                                     | Superseded                                                      |
| 2.3         | Requirements Governance and Security Completeness Update | Resolved document-control, administrative account provisioning, certificate scope, administrative account maintenance wording, NFR traceability and governance consistency; added the static administration key requirement for System Administrator account creation; and corrected business-process ordering. No unrelated business scope introduced.                 | Superseded                                                      |
| 2.4         | Requirements Finalization and Governance Clarification   | Corrected document version control, business-process exception wording and actor terminology; completed reporting traceability; clarified administrative account scope; refined System Administrator bootstrap governance and approval-role segregation as governance confirmations; and aligned governance status and summary. No unrelated business scope introduced. | Current Requirements Baseline — Governance Confirmation Pending |

## 1.3 Review and Approval Matrix

| **Role**                                     | **Responsibility**                                                                                            | **Approval / Concurrence**        |
|----------------------------------------------|---------------------------------------------------------------------------------------------------------------|-----------------------------------|
| Business Sponsor / Business Owner            | Owns business objectives, scope, priorities and acceptance of business requirements.                          | Final Business Approval           |
| Product / Project Owner                      | Confirms product scope, delivery priorities, dependencies and operational ownership.                          | Business / Product Approval       |
| Senior Business Analyst / Requirements Owner | Owns requirements quality, traceability, consistency and change impact analysis.                              | Requirements for Quality Approval |
| Technical Lead / Solution Architect          | Reviews design feasibility, NFR implications and architectural dependencies without changing business intent. | Technical Review / Concurrence    |
| QA Lead / Test Manager                       | Confirms requirements are testable and can be translated into SIT/UAT scenarios.                              | Testability Review / Concurrence  |
| UAT Business Owner                           | Confirms business acceptance criteria and UAT readiness.                                                      | UAT Acceptance                    |
| Compliance / Privacy Officer                 | Reviews personal data, privacy, retention, security and applicable regulatory requirements.                   | Compliance Concurrence            |
| Project / Delivery Manager                   | Ensures governance, version control, approvals and baseline discipline are followed.                          | Governance Control                |

## 1.4 Formal Sign-Off

Formal sign-off confirms that the approving stakeholders agree that the requirements are sufficiently complete, understood, testable and appropriate to proceed to the next lifecycle stage. Approval does not imply that technical design has already been finalized.

| **Approval Role**                            | **Name**                          | **Signature / Electronic Approval** | **Date**  | **Status** |
|----------------------------------------------|-----------------------------------|-------------------------------------|-----------|------------|
| Business Sponsor / Business Owner            | Adnan Syawgi                      | AS                                  | 6/10/2026 | Completed  |
| Product / Project Owner                      | Adnan Syawgi                      | AS                                  | 6/10/2026 | Completed  |
| Requirements Owner / Senior Business Analyst | Adnan Syawgi                      | AS                                  | 6/10/2026 | Completed  |
| Technical Lead / Solution Architect          | Adnan Syawgi                      | AS                                  | 6/10/2026 | Completed  |
| QA Lead / Test Manager                       | Adnan Syawgi                      | AS                                  | 6/10/2026 | Completed  |
| UAT Business Owner                           | Adnan Syawgi                      | AS                                  | 6/10/2026 | Completed  |
| Compliance / Privacy Officer                 | Pending organizational assignment |                                     |           | Pending    |

## 1.5 Sign-Off Criteria

- Business objectives and scope are agreed.

- Actors and responsibilities are agreed.

- Major business processes are documented.

- Functional requirements are atomic, testable and traceable.

- Non-functional requirements have measurable targets or documented rationale.

- Business rules and validations are explicitly defined.

- Required business data is identified without prescribing database implementation.

- Integrations and external dependencies are identified.

- Open business requirements have been resolved or formally accepted as future scope.

- Privacy, security and compliance requirements have been reviewed by the appropriate owner.

- Requirements are sufficiently stable to establish the System Design baseline.

- All required approvers have provided formal sign-off.

## 1.6 Change Control and Baseline Management

This document is the controlled requirements baseline. Any proposed change that affects scope, business rules, functional requirements, NFRs, data requirements, integrations, acceptance criteria or delivery impact shall be managed through formal change control.

- A Change Request (CR) shall identify the requested change, reason, business owner, priority and requested effective version.

- The Requirements Owner shall perform impact analysis covering requirements, scope, process, data, security, testing, schedule and dependencies.

- Affected stakeholders shall review the impact analysis before approval.

- Approved changes shall receive a new version of document and update the relevant requirements and traceability.

- Rejected changes shall be recorded with the decision rationale.

- Emergency changes shall follow the organization's emergency change process and be retrospectively documented.

- No development or test case should be treated as the new baseline until the corresponding approved requirement change is incorporated.

## 1.7 Document Status Definitions

| **Status**           | **Definition**                                                                                |
|----------------------|-----------------------------------------------------------------------------------------------|
| Draft                | Document is being prepared or materially revised and is not an approved baseline.             |
| Under Review         | Document is distributed to designated reviewers for formal review and comments.               |
| Approved / Baselined | Required approvers have signed off and the document is the controlled requirements baseline.  |
| Superseded           | A newer approved version has replaced this version; retained for audit/history.               |
| Obsolete             | Document is no longer applicable and is retained only according to document-retention policy. |

## 1.8 Traceability and Audit Expectations

Each approved functional and non-functional requirement should be traceable through the project lifecycle to its applicable business process, business rule, data requirement, system design component, test case and UAT scenario. Requirement IDs shall not be reused after approval. Deleted or superseded requirements should remain traceable through version history and change records.

## 1.9 Distribution and Access Control

- The controlled version shall be maintained in the organization-approved repository.

- Only authorized project stakeholders should have edit access to the controlled source.

- Review copies should clearly identify their version and status.

- Superseded versions shall be retained for auditability and shall not be used as the active implementation baseline.

- External distribution shall require approval from the document owner where the document contains confidential business or personal-data requirements.

## 1.10 Governance Recommendation

For an MNC-level delivery, the recommended governance model is: Business Owner approval → Requirements / BA quality review → Architecture concurrence → QA/Testability concurrence → Compliance/Privacy concurrence → UAT Business Owner acceptance → formal baseline approval by the Business Sponsor / Project Owner. Following baseline approval, all material changes should be controlled through a Change Request and reflected in the version history and requirements traceability.

# 2. Business Objectives

| **ID** | **Business Objective**                                                                                                                   |
|--------|------------------------------------------------------------------------------------------------------------------------------------------|
| BO-001 | Provide participants with a centralized platform to view available training programs.                                                    |
| BO-002 | Allow eligible participants to register for available training programs.                                                                 |
| BO-003 | Provide accurate and understandable information about training programs to support participant registration decisions.                   |
| BO-004 | Reduce manual effort associated with managing participant registrations.                                                                 |
| BO-005 | Maintain reliable records of training programs, participant registrations, attendance, and certificates.                                 |
| BO-006 | Provide authorized users with visibility and management capabilities for programs, registrations, attendance, certificates, and reports. |

## Objective Gaps / Future Considerations

- Paid programs are excluded from the current release but may be considered as a future enhancement.

- External HR/participant-system integration is not required for the current release.

# 3. Scope

## 3.1 In Scope

- Participant’s account creation and login.

- System Administrator account creation using the configured static administration key and login.

- Training Administrator and Trainer account creation by the System Administrator, and authentication by their respective users.

- Displaying available training programs and program categories.

- Viewing training program details.

- Participant registration for available programs.

- Participant registration validation and duplicate/overlap checking.

- Program capacity management.

- Participant registration cancellation.

- Email registration confirmation.

- Training program and registration administration.

- Attendance recording and management.

- Certificate eligibility and issuance recording for eligible participants.

- Operational and management reporting.

- Retention of participant and registration information.

## 3.2 Out of Scope

- Payment processing and paid-program functionality for the current release.

- Online payment gateway integration.

- Bank transfer processing.

- HR/participant-system integration.

- Mobile-native applications.

- Training content delivery.

- Video conferencing.

- Accounting and payroll functionality.

Paid programs may be introduced as a future enhancement.

# 4. Actors

| **ID**  | **Actor**              | **Responsibility**                                                                                      |
|---------|------------------------|---------------------------------------------------------------------------------------------------------|
| ACT-001 | Participant            | End user who creates an account, browses programs and registers for training.                           |
| ACT-002 | Training Administrator | Manages training programs, registrations, attendance records and certificate issuance.                  |
| ACT-003 | Trainer                | Records participant attendance for assigned training programs.                                          |
| ACT-004 | System Administrator   | Manages system administration and user access, including creating Training Administrators and Trainers. |

The Training Administrator is the primary business administration role responsible for training programs, registrations, attendance records and certificate issuance. The Trainer manages attendance for assigned programs. The System Administrator manages system administration and user access, including Training Administrator and Trainer accounts. The Participant manages their own account and registrations.

# 5. Business Processes

## BP-001 — Create Student Account

**Purpose:** Allow a prospective participant to create an account required for authenticated system access.

**Trigger:** Participant chooses to create an account.

**Actors:** Participant

**Main Flow**

1.  Participant opens the account creation function.

2.  Participant provides the required account and participant information.

3.  System validates mandatory and applicable account information.

4.  System creates the participant account and records the account status.

**Alternative / Exception Flow**

1.  If mandatory information is missing or invalid, or account information that must be unique already exists, the system rejects account creation and identifies the applicable information or condition that must be corrected.

**Business Outcome:** A participant account is created with the applicable account status.

## BP-002 — Authenticate Participant

**Purpose:** Allow a registered participant to securely access authenticated system functions.

**Trigger:** Participant attempts to log in.

**Actors:** Participant

**Main Flow**

1.  Participant opens the login function.

<!-- -->

5.  Participant provides the required authentication credentials.

6.  System validates the credentials and account status.

7.  System creates an authenticated session when validation succeeds.

**Business Outcome:** An eligible participant is authenticated and can access permitted functions.

**Alternative / Exception Flow**

1.  If credentials are missing or invalid, the account is inactive, suspended or unverified, or authentication cannot be completed, the system shall reject authentication and provide an appropriate message or account status or verification outcome.

## BP-003 — Create System Administrator Account

**Purpose:** Allow a person possessing the valid static administration key to create a System Administrator account for authorized system administration access.

**Trigger:** System Administrator account creation is required and the person performing the action possesses the configured static administration key.

**Actors: Person possessing valid static administration key**

**Main Flow**

1.  The person opens the System Administrator account creation function.

<!-- -->

8.  The person provides the configured static administration key.

9.  The system validates the static administration key.

10. The person provides the required System Administrator account information.

11. The system validates the required account information and assigned System Administrator role.

12. The system creates the System Administrator account and records the applicable account status.

13. The system provides the account activation or verification outcome.

**Alternative / Exception Flow**

1.  If mandatory information is missing or invalid, account information that must be unique already exists, the static administration key is missing or invalid, or account creation cannot be completed, the system shall reject account creation and identify the applicable information or condition that must be corrected.

**Business Outcome:** A System Administrator account is created with the applicable account status when a valid static administration key and valid account information are provided.

## BP-004 — Authenticate System Administrator

**Purpose:** Allow the System Administrator to securely access authenticated system administration functions.

**Trigger:** System Administrator attempts to log in.

**Actors:** System Administrator

**Main Flow**

1.  System Administrator opens the login function.

<!-- -->

14. System Administrator provides the required authentication credentials.

15. System validates the credentials, account status and assigned role.

16. System creates an authenticated session when validation succeeds.

**Alternative / Exception Flow**

1.  If credentials are missing or invalid, the account is inactive, suspended or unverified, or authentication cannot be completed, the system shall reject authentication and provide an appropriate authentication or account-status message.

**Business Outcome:** An eligible System Administrator is authenticated and can access permitted system administration functions.

## BP-005 — Create Training Administrator and Trainer Account

**Purpose:** Allow the System Administrator to create Training Administrator and Trainer user accounts.

**Trigger:** System Administrator chooses to create a Training Administrator or Trainer account.

**Actors:** System Administrator

**Main Flow**

1.  System Administrator opens the user account management function.

<!-- -->

17. System Administrator selects Training Administrator or Trainer as the user role.

18. System Administrator provides the required user account information.

19. System validates mandatory information and role/access configuration.

20. System creates the user account and records the applicable account status.

**Alternative / Exception Flow**

1.  Invalid or incomplete information, duplicate account information, or unauthorized account-management action.

**Business Outcome:** A Training Administrator or Trainer account is created with the applicable account status.

## BP-006 — Authenticate Training Administrator and Trainer

**Purpose:** Allow registered Training Administrators and Trainers to securely access authenticated system functions.

**Trigger:** Training Administrator or Trainer attempts to log in.

**Actors:** Training Administrator / Trainer

**Main Flow**

1.  User opens the login function.

<!-- -->

21. User provides the required authentication credentials.

22. System validates the credentials, account status and assigned role.

23. System creates an authenticated session when validation succeeds.

**Alternative / Exception Flow**

1.  If credentials are missing or invalid, the account is inactive, suspended or unverified, or authentication cannot be completed, the system shall reject authentication and provide an appropriate authentication or account-status message.

**Business Outcome:** An eligible Training Administrator or Trainer is authenticated and can access permitted functions.

## BP-007 — Browse Training Programs

**Purpose:** Allow participants to discover available training programs.

**Trigger:** Participant accesses the program listing.

**Actors:** Participant

**Main Flow**

1.  Participants access the program listing.

<!-- -->

24. System displays available programs and categories.

25. Participant reviews program information.

26. Participant selects a program.

**Alternative / Exception Flow**

1.  No programs are available; the system informs the participant.

**Business Outcome:** Participant can identify a relevant program.

## BP-008 — View Program Details

**Purpose:** Allow participants to review program information before registration.

**Trigger:** Participant selects a program.

**Actors:** Participant

**Main Flow**

1.  Participant selects a program.

<!-- -->

27. System displays program details, schedule, category, capacity/availability and other published information.

28. Participant decides whether to register.

**Alternative / Exception Flow**

1.  Program is no longer available; registration cannot proceed.

**Business Outcome:** Participant has sufficient information to make a registration decision.

## BP-009 — Register for Training Program

**Purpose:** Allow a participant to register for an available program.

**Trigger:** Participant chooses to register.

**Actors:** Participant

**Main Flow**

1.  Participant selects a program.

<!-- -->

29. System validates authentication, mandatory participant information, duplicate registration, schedule overlap and capacity.

30. Participant confirms registration.

31. System creates registration with status Registered.

32. System sends an email confirmation.

**Alternative / Exception Flow**

1.  Program is full, participant is already registered, schedule overlaps, mandatory information is invalid, the program is unavailable, or registration cannot be completed.

**Business Outcome:** A valid registration is recorded with status Registered.

## BP-010 — Cancel Training Program Registration

**Purpose:** Allow a participant to cancel an existing registration.

**Trigger:** Participant chooses to cancel registration.

**Actors:** Participant

**Main Flow**

1.  Participant views an existing registration.

<!-- -->

33. Participant selects the cancellation function.

34. System validates that the registration can be cancelled.

35. System records the cancellation and updates the registration status.

**Alternative / Exception Flow**

1.  Registration does not exist, is inaccessible to the participant, or cannot be cancelled.

**Business Outcome:** The participant's registration is cancelled, and the registration record is updated.

## BP-011 — Manage Training Programs

**Purpose: Allow the Training Administrator to maintain programs, categories and capacity.**

**Trigger:** Training Administrator creates or updates a program.

**Actors:** Training Administrator

**Main Flow**

1.  Training Administrator creates or updates program information.

<!-- -->

36. Training Administrator assigns a category and capacity.

37. System validates required information.

38. System saves the program.

**Alternative / Exception Flow**

1.  Invalid or incomplete information, or the requested action is not permitted within the Training Administrator's responsibilities.

**Business Outcome:** Program information is maintained accurately.

## BP-012 — Manage Registrations

**Purpose: Allow the Training Administrator to review and manage registrations within the Training Administrator's permitted responsibilities.**

**Trigger:** Training Administrator accesses registration management.

**Actors:** Training Administrator

**Main Flow**

1.  Training Administrator views registrations.

<!-- -->

39. Training Administrator performs permitted operational actions.

40. System applies the Training Administrator's role and access scope.

41. System records permitted registration-management actions.

**Alternative / Exception Flow**

1.  The requested action is not permitted within the Training Administrator's responsibilities or the administrative action is invalid.

**Business Outcome:** Registration information is operationally managed.

## BP-013 — Record Attendance

**Purpose:** Record participant attendance for a program.

**Trigger:** Program session/event occurs.

**Actors:** Trainer

**Main Flow**

1.  Trainer opens the participant list for the assigned program.

<!-- -->

42. Trainer records attendance for registered participants.

43. System saves attendance information against the relevant registration and program.

**Alternative / Exception Flow**

1.  Participants are not registered, the program is not assigned to the Trainer, or attendance cannot be recorded.

**Business Outcome:** Attendance record is maintained for the program.

## BP-014 — Issue Certificate

**Purpose:** Provide certificates to participants who achieve 100% attendance for the relevant program.

**Trigger:** Program completion criteria are assessed.

**Actors:** Training Administrator

**Main Flow**

1.  Authorized Training Administrator identifies eligible participants.

<!-- -->

44. System evaluates or records the certificate eligibility result.

45. Training Administrator records certificate issuance for eligible participants.

46. System maintains the certificate record.

**Alternative / Exception Flow**

1.  Participant does not meet the 100% attendance requirement, or the certificate cannot be issued.

**Business Outcome:** Certificate eligibility and issuance are recorded.

## BP-015 — Generate and View Reports

**Purpose:** Provide the Training Administrator with the required operational and management reports.

**Trigger: Training Administrator requests a report.**

**Actors:** Training Administrator

**Main Flow**

1.  Training Administrator selects the required report and applicable parameters.

<!-- -->

47. System retrieves the permitted reporting data.

48. System generates the requested report.

49. Training Administrator views the report.

**Alternative / Exception Flow**

1.  The requested report is not permitted within the Training Administrator's responsibilities, required report data is unavailable, or report generation cannot be completed.

**Business Outcome: The Training Administrator can obtain the required operational and management reports.**

# 6. Functional Requirements

| **ID** | **Requirement**                                                                                                                                                                                                                   | **Actor**                                         | **Priority** |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|--------------|
| FR-001 | The system shall allow participants to create an account.                                                                                                                                                                         | Participant                                       | High         |
| FR-002 | The system shall allow registered participants to log in.                                                                                                                                                                         | Participant                                       | High         |
| FR-003 | The system shall display a list of available training programs.                                                                                                                                                                   | Participant                                       | High         |
| FR-004 | The system shall allow participants to browse programs by category.                                                                                                                                                               | Participant                                       | Medium       |
| FR-005 | The system shall display the details of a selected program.                                                                                                                                                                       | Participant                                       | High         |
| FR-006 | The system shall display program availability and remaining capacity.                                                                                                                                                             | Participant                                       | High         |
| FR-007 | The system shall allow a participant to initiate registration for an available program.                                                                                                                                           | Participant                                       | High         |
| FR-008 | The system shall capture NRIC/Passport No, Name, Email Address and Mobile No as participant information.                                                                                                                          | Participant                                       | High         |
| FR-009 | The system shall validate mandatory registration information before accepting registration.                                                                                                                                       | Participant                                       | High         |
| FR-010 | The system shall prevent duplicate registration for the same participant and program.                                                                                                                                             | Participant                                       | High         |
| FR-011 | The system shall prevent registration when the program has reached its configured capacity.                                                                                                                                       | Participant                                       | High         |
| FR-012 | The system shall prevent a participant from registering for programs whose scheduled date/time overlaps with an existing registration.                                                                                            | Participant                                       | High         |
| FR-013 | The system shall create a registration with status Registered after successful validation.                                                                                                                                        | Participant                                       | High         |
| FR-014 | The system shall send email confirmation after successful registration.                                                                                                                                                           | Participant                                       | High         |
| FR-015 | The system shall allow participants to view their registration information.                                                                                                                                                       | Participant                                       | Medium       |
| FR-016 | The system shall allow participants to cancel the registration.                                                                                                                                                                   | Participant                                       | High         |
| FR-017 | The system shall not allow participants to modify registration information after submission.                                                                                                                                      | Participant                                       | High         |
| FR-018 | The system shall allow authorized users to create training programs.                                                                                                                                                              | Training Administrator                            | High         |
| FR-019 | The system shall allow authorized users to update training programs.                                                                                                                                                              | Training Administrator                            | High         |
| FR-020 | The system shall allow authorized users to create and maintain program categories.                                                                                                                                                | Training Administrator                            | Medium       |
| FR-021 | The system shall allow authorized users to configure the maximum participant capacity for each program.                                                                                                                           | Training Administrator                            | High         |
| FR-022 | The system shall allow the Training Administrator to view and perform permitted registration-management actions within the Training Administrator's responsibilities.                                                             | Training Administrator                            | High         |
| FR-023 | The system shall allow Trainers to record participant attendance.                                                                                                                                                                 | Trainer                                           | High         |
| FR-024 | The system shall maintain attendance information against the relevant participant and program.                                                                                                                                    | Trainer                                           | High         |
| FR-025 | The system shall allow authorized Training Administrators to record certificate issuance for eligible participants.                                                                                                               | Training Administrator                            | High         |
| FR-026 | The system shall maintain certificate information for issued certificates.                                                                                                                                                        | Training Administrator                            | Medium       |
| FR-027 | The system shall provide the confirmed operational and management reports: Student Certificate Report, Student Program Registration Report and Student Account Creation Report.                                                   | Training Administrator                            | Medium       |
| FR-028 | The system shall restrict administrative functions according to assigned roles.                                                                                                                                                   | System Administrator                              | High         |
| FR-029 | The system shall allow the System Administrator to create Training Administrator and Trainer user accounts.                                                                                                                       | System Administrator                              | High         |
| FR-030 | The system shall prevent registration when the selected program is unavailable.                                                                                                                                                   | Participant                                       | High         |
| FR-031 | The system shall inform participants when registration cannot be completed and identify the applicable reason where appropriate.                                                                                                  | Participant                                       | High         |
| FR-032 | The system shall display an appropriate message when no programs are available.                                                                                                                                                   | Participant                                       | Medium       |
| FR-033 | The system shall allow registered Training Administrators and Trainers to log in.                                                                                                                                                 | Training Administrator / Trainer                  | High         |
| FR-034 | The system shall allow the System Administrator to log in.                                                                                                                                                                        | System Administrator                              | High         |
| FR-035 | The system shall provide an input for the configured static administration key and shall allow creation of a System Administrator account only when a valid static administration key and valid account information are provided. | Person possessing valid static administration key | High         |

All mandatory functional requirements use “shall”. Recommendations are explicitly identified as recommendations and are not treated as approved mandatory requirements.

# 7. Non-Functional Requirements

| **ID**  | **Category**    | **Requirement**                                                                                                                                                                              | **Priority** |
|---------|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| NFR-001 | Security        | The system shall protect participant information from unauthorized access.                                                                                                                   | High         |
| NFR-002 | Security        | The system shall restrict administrative functions according to assigned roles.                                                                                                              | High         |
| NFR-003 | Security        | The system shall protect authentication credentials, the static administration key and sensitive information using appropriate security controls.                                            | High         |
| NFR-004 | Privacy         | The system shall handle participant personal information in accordance with applicable Malaysian privacy and organizational requirements.                                                    | High         |
| NFR-005 | Data Integrity  | The system shall maintain consistent and accurate program, registration, attendance and certificate information.                                                                             | High         |
| NFR-006 | Availability    | The system shall provide at least 99% service availability on a 24/7 basis, excluding approved planned maintenance.                                                                          | High         |
| NFR-007 | Performance     | The system should target 95% of normal requests completing within 2 seconds under the agreed expected load. This remains a technical recommendation pending final architecture confirmation. | Medium       |
| NFR-008 | Usability       | The system shall provide clear navigation for browsing programs and completing registration.                                                                                                 | High         |
| NFR-009 | Usability       | Validation and error messages shall clearly explain what the participant needs to correct.                                                                                                   | High         |
| NFR-010 | Auditability    | The system shall maintain an audit history of significant administrative changes and registration actions.                                                                                   | High         |
| NFR-011 | Scalability     | The system shall support the confirmed expected volume of 2,000 students in Year 1 and 100 concurrent logged-in users.                                                                       | Medium       |
| NFR-012 | Compatibility   | The system shall support organization-approved desktop and mobile web browsers.                                                                                                              | Medium       |
| NFR-013 | Maintainability | Business rules and validation behavior shall be maintainable without unnecessary impact to unrelated functionality.                                                                          | Medium       |

Availability and performance targets are stated separately below. The 99% availability target is a confirmed business target; the 95% within 2 seconds performance target remains a technical recommendation pending final architecture confirmation.

# 8. Business Rules

| **ID** | **Business Rule**                                                                                                                                                                                                    | **Applies To**                        |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| BR-001 | A participant must have an account and be authenticated before registering for a program.                                                                                                                            | Registration                          |
| BR-002 | Everyone is eligible to register unless another explicit program-specific restriction is introduced in the future.                                                                                                   | Eligibility                           |
| BR-003 | Each program has a configurable maximum participant capacity; the initial/default capacity is 20 participants.                                                                                                       | Capacity                              |
| BR-004 | Registration is not permitted when the configured program capacity has been reached.                                                                                                                                 | Capacity                              |
| BR-005 | A waiting list is not maintained when a program is full.                                                                                                                                                             | Capacity                              |
| BR-006 | A participant may register for multiple programs provided the scheduled date/time does not overlap.                                                                                                                  | Registration                          |
| BR-007 | A participant may not register more than once for the same program.                                                                                                                                                  | Registration                          |
| BR-008 | Registration is automatically confirmed after successful validation; administrator approval is not required.                                                                                                         | Registration                          |
| BR-009 | The registration status after successful registration is Registered.                                                                                                                                                 | Registration                          |
| BR-010 | Participants may cancel existing registration.                                                                                                                                                                       | Cancellation                          |
| BR-011 | Participants may not modify registration information after submission.                                                                                                                                               | Registration                          |
| BR-012 | A successful registration requires NRIC/Passport No, Name, Email Address and Mobile No.                                                                                                                              | Registration                          |
| BR-013 | An email confirmation shall be sent after successful registration.                                                                                                                                                   | Notification                          |
| BR-014 | Each program belongs to a program category.                                                                                                                                                                          | Program                               |
| BR-015 | A program has one scheduled occurrence; multiple sessions for a single program are not supported.                                                                                                                    | Program                               |
| BR-016 | Attendance shall be recorded for registered participants against the relevant program.                                                                                                                               | Attendance                            |
| BR-017 | Certificates shall be issued only to participants who achieve 100% attendance for the relevant program.                                                                                                              | Certificate                           |
| BR-018 | Participant and registration data shall be retained indefinitely, subject to applicable Malaysian law and organizational privacy/retention policy.                                                                   | Data Retention                        |
| BR-019 | Paid programs and payment processing are not part of the current release.                                                                                                                                            | Scope                                 |
| BR-020 | No integration with an existing HR or participant management system is required for the current release.                                                                                                             | Integration                           |
| BR-021 | A person may create a System Administrator account only when a valid configured static administration key is provided; anyone who knows the valid static administration key may perform the account-creation action. | System Administrator Account Creation |

# 9. Data Requirements

The following data requirements define the business-level information that the system must capture, maintain, or make available. (M) indicates mandatory and (O) indicates optional.

| **ID** | **Entity**              | **Purpose**                                                                            | **Key Information**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|--------|-------------------------|----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| DR-001 | Participant             | Represents an individual participant using the system.                                 | Participant ID (M); NRIC/Passport No (M); Name (M); Email Address (M); Mobile No (M); Account Status (M); Account Creation Date/Time (M); Last Updated Date/Time (M)                                                                                                                                                                                                                                                                                                                                                                                                                               |
| DR-002 | Training Program        | Represents a training program offered by the organization.                             | Program ID (M); Program Code (M); Program Name (M); Description (M); Learning Objectives (M); Program Category ID (M); Target Audience (M); Prerequisites (O); Trainer/Instructor (M); Training Date/Time (M); Registration Opening Date/Time (M); Registration Closing Date/Time (M); Location/Venue (O); Delivery Mode (M); Capacity (M); Available Seats (M); Program Status (M); Cancellation Policy Reference (O); Certificate Eligibility Criteria (M — 100% attendance); Certificate Type (O); Created Date/Time (M); Last Updated Date/Time (M)                                            |
| DR-003 | Program Category        | Classifies training programs.                                                          | Program Category ID (M); Category Name (M); Category Description (O); Category Status (M); Created Date/Time (M); Last Updated Date/Time (M)                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| DR-004 | Registration            | Represents a participant's registration for a program.                                 | Registration ID (M); Registration/Reference Number (M); Participant ID (M); Program ID (M); Registration Date/Time (M); Registration Status (M); Cancellation Date/Time (O); Cancellation Reason (O); Registration Remarks (O); Created Date/Time (M); Last Updated Date/Time (M)                                                                                                                                                                                                                                                                                                                  |
| DR-005 | Attendance              | Records participant attendance for a program.                                          | Attendance ID (M); Participant ID (M); Registration ID (M); Program ID (M); Attendance Date (M); Attendance Status (M); Attendance Percentage (M); Check-In Date/Time (O — recommended); Check-Out Date/Time (O — recommended); Attendance Verification Method (O — recommended); Attendance Evidence/Reference (O — recommended); Attendance Remarks (O); Recorded By (M); Recorded Date/Time (M); Last Updated Date/Time (M)                                                                                                                                                                     |
| DR-006 | Certificate             | Records certificate eligibility and issuance.                                          | Certificate ID (M); Certificate Number/Reference (M — once issued); Participant ID (M); Registration ID (M); Program ID (M); Certificate Type (M); Certificate Title (M); Eligibility Status (M); Eligibility Criteria/Result (M); Attendance/Completion Percentage (M); Completion Date (M); Issuance Date (O — before issuance); Certificate Status (M); Certificate Document/Reference (O — until issued); Verification Reference (O); Issuing Authority/Signatory (O); Revocation/Cancellation Date (O); Revocation/Cancellation Reason (O); Created Date/Time (M); Last Updated Date/Time (M) |
| DR-007 | User Role / Access      | Represents administrative roles and permissions.                                       | User ID (M); User/Account Identifier (M); Linked Participant Identifier (O); Username (M); Email Address (M); Role ID (M); Role Name (M); Permissions/Access Scope (M); Permitted Responsibilities (M); Account Status (M); Role Assignment Date/Time (M); Role Expiry Date/Time (O); Account Activation/Deactivation Date/Time (O); Last Login Date/Time (O); Authentication Method/Reference (O); Created Date/Time (M); Last Updated Date/Time (M) Supported administrative roles: System Administrator, Training Administrator and Trainer.                                                    |
| DR-008 | Audit Record            | Provides traceability for significant administrative changes and registration actions. | Audit Record ID (M); Event Date/Time (M); Actor User ID (M); Actor Role (M); Action Type (M); Entity Type (M); Entity ID/Reference (M); Action Result/Status (M); Change Summary (M); Previous Value/Reference (O); New Value/Reference (O); Access Scope/Classification (M)                                                                                                                                                                                                                                                                                                                       |
| DR-009 | Report / Reporting Data | Supports the confirmed operational and management reports.                             | Report ID/Name (M); Report Type/Category (M); Reporting Period (M); Report Generation Date/Time (M); Report Parameters/Filters (O); Participant Information (O — based on report); Program Information (O — based on report); Registration Information (O — based on report); Attendance Information (O — based on report); Certificate Information (O — based on report); Account Information (O — based on report); Report Status (M); Generated By (M); Report Output/Reference (O); Data Access Classification (M)                                                                             |

# 10. Validations and Exceptions

| **ID** | **Condition**                                                                                                                     | **Expected Behavior**                                                                                |
|--------|-----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| VE-001 | Mandatory participant information is missing.                                                                                     | Reject registration and identify the missing information.                                            |
| VE-002 | Participant information is invalid.                                                                                               | Reject the affected information and provide an appropriate validation message.                       |
| VE-003 | Program is full.                                                                                                                  | Prevent registration and indicate that the program has reached capacity.                             |
| VE-004 | Participants are already registered for the same program.                                                                         | Prevent duplicate registration.                                                                      |
| VE-005 | Selected program overlaps with another registered program.                                                                        | Prevent registration and indicate the schedule conflict.                                             |
| VE-006 | Program is unavailable.                                                                                                           | Prevent registration.                                                                                |
| VE-007 | Participant attempts to modify an existing registration.                                                                          | Prevent modification.                                                                                |
| VE-008 | Participants attempt to register without being authenticated.                                                                     | Require login/account access before registration.                                                    |
| VE-009 | Unauthorized user attempts administrative access.                                                                                 | Deny access.                                                                                         |
| VE-010 | Participant attempts to register for a nonexistent or inaccessible program.                                                       | Inform the participant that the program cannot be registered for.                                    |
| VE-011 | Unexpected error occurs during registration.                                                                                      | Do not represent the registration as successful unless it has been successfully recorded.            |
| VE-012 | No programs are available.                                                                                                        | Display an appropriate no-programs-available message.                                                |
| VE-013 | Certificate criteria are not met. 100% attendance is required                                                                     | Do not issue/record the certificate as eligible.                                                     |
| VE-014 | Account creation information is missing or invalid.                                                                               | Reject account creation and identify the applicable information that must be corrected.              |
| VE-015 | Account information that must be unique already exists.                                                                           | Prevent account creation and inform the participant that the account information cannot be used.     |
| VE-016 | Participant authentication fails or the account is inactive, suspended or unverified.                                             | Deny authentication and provide an appropriate authentication message.                               |
| VE-017 | Training Administrator, Trainer or System Administrator authentication fails or the account is inactive, suspended or unverified. | Deny authentication and provide an appropriate authentication message.                               |
| VE-018 | System Administrator account creation information is missing, invalid, or cannot be created.                                      | Reject account creation and identify the applicable information or condition that must be corrected. |
| VE-019 | Static administration key is missing or invalid during System Administrator account creation.                                     | Reject account creation and indicate that a valid static administration key is required.             |

# 11. Integrations

No external business-system integration is required for the current release.

| **ID**  | **Potential Integration**          | **Purpose**                            | **Status**                                |
|---------|------------------------------------|----------------------------------------|-------------------------------------------|
| INT-001 | Email / Notification Service       | Send registration confirmation emails. | Required                                  |
| INT-002 | Payment Service                    | Payment processing for paid programs.  | Future enhancement — not in current scope |
| INT-003 | HR / Participant Management System | Retrieve participant information.      | Not required for current release          |

The email capability is required to satisfy the confirmed registration-confirmation requirement. Payment and HR integration remain outside the current release.

# 12. Assumptions and Dependencies

## 12.1 Assumptions

- All participants are eligible unless future program-specific eligibility rules are introduced.

- The default maximum capacity is 20 participants per program, and administrators can change the configured capacity.

- Each program has one scheduled occurrence; multiple sessions are not supported.

- Participants can cancel registration but cannot modify submitted registration information.

- Registration is automatically confirmed after successful validation.

- Email is the required confirmation channel.

- Attendance and certificates are part of the current system scope.

- Participant and registration data is retained indefinitely, subject to applicable requirements.

## 12.2 Dependencies

- The initial program category structure consists of IT programming-related categories confirmed by the business.

- Certificate eligibility is confirmed as 100% attendance. The certificate format/content remains a recommended format for final business confirmation.

- The required reports are confirmed as Student Certificate Report, Student Program Registration Report and Student Account Creation Report.

- The least privilege administrative permission matrix is confirmed for System Administrator, Training Administrator, Trainer and Participant.

- The expected volume is confirmed as 2,000 students in Year 1 and 100 concurrent logged-in users. The 99% availability target is confirmed; the 95% performance target within 2 seconds remains a recommended technical target pending final technical confirmation.

- Applicable Malaysian privacy requirements and organizational policies must be confirmed by the responsible compliance/business owner.

- Email service availability is required for registration confirmation notifications.

# 13. Requirement Decisions, Recommendations and Remaining Governance Item

| **ID**  | **Decision / Gap**                                                      | **Status**                           | **Resolution / Impact**                                                                                                                                                                                                                                                                                                                                                                               |
|---------|-------------------------------------------------------------------------|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| DEC-001 | Program categories                                                      | Confirmed                            | The initial program category structure consists of IT programming-related categories confirmed by the business.                                                                                                                                                                                                                                                                                       |
| DEC-002 | Certificate eligibility                                                 | Confirmed                            | 100% attendance is the confirmed eligibility criterion.                                                                                                                                                                                                                                                                                                                                               |
| DEC-003 | Certificate format/content                                              | Recommended / Business Confirmation  | Recommended content includes organization name/logo, certificate title, participant name, program name/date, duration/hours, completion statement, certificate ID/serial number, issue date, authorized signatory and verification reference/QR code where appropriate.                                                                                                                               |
| DEC-004 | Required reports                                                        | Confirmed                            | Student Certificate Report; Student Program Registration Report; Student Account Creation Report.                                                                                                                                                                                                                                                                                                     |
| DEC-005 | Administrative permission matrix                                        | Confirmed                            | Least-privilege responsibilities are defined across System Administrator, Training Administrator, Trainer and Participant.                                                                                                                                                                                                                                                                            |
| DEC-006 | Certificate administration role                                         | Confirmed                            | Certificate issuance is handled by the Training Administrator. No separate Certificate Administrator role is required.                                                                                                                                                                                                                                                                                |
| DEC-007 | Availability target                                                     | Confirmed                            | At least 99% service availability on a 24/7 basis, excluding approved planned maintenance.                                                                                                                                                                                                                                                                                                            |
| DEC-008 | Performance target                                                      | Recommended / Technical Confirmation | 95% of normal requests within 2 seconds under the agreed expected load.                                                                                                                                                                                                                                                                                                                               |
| DEC-009 | Expected volume                                                         | Confirmed                            | 2,000 students in Year 1 and 100 concurrent logged-in users.                                                                                                                                                                                                                                                                                                                                          |
| GOV-001 | Malaysian privacy/compliance applicability                              | Pending Confirmation                 | Formal compliance/legal confirmation is required before production release. Compliance / Privacy Officer sign-off remains pending until that confirmation is completed.                                                                                                                                                                                                                               |
| GOV-002 | System Administrator bootstrap and static administration key governance | Pending Confirmation                 | Before production release, the responsible governance/security owner must confirm who controls the initial System Administrator provisioning process and the static administration key, including secure storage, authorized distribution/use, rotation or replacement, revocation, and auditability. The static administration key remains a required control for the current requirements baseline. |
| GOV-003 | Approval-role segregation of duties                                     | Pending Confirmation                 | Confirm whether organizational governance permits the same person to hold multiple approval roles in this baseline. Where segregation of duties is required, the affected approvals shall be completed by the designated independent approvers before the requirements baseline is treated as fully approved.                                                                                         |

No remaining major business-scope requirement gaps are identified. The remaining governance items are formal compliance/legal confirmation, System Administrator bootstrap/static administration key governance confirmation, and confirmation of approval-role segregation requirements before production release.

# 14. Requirements Traceability

The following matrix provides representative end-to-end traceability for the core business objectives and participant registration lifecycle. Detailed test-case and UAT IDs shall be maintained in the test/UAT baseline.

| **Business Objective** | **Business Process**                                           |                  | **Functional Requirements**            | **Business Rules / Validations**                   |                                                                       | **Data Requirements**                  |                                                    | **Test / UAT Coverage**                                                                                                                                                     |     |
|------------------------|----------------------------------------------------------------|------------------|----------------------------------------|----------------------------------------------------|-----------------------------------------------------------------------|----------------------------------------|----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----|
| BO-001                 | BP-007, BP-008                                                 |                  | FR-003 to FR-006, FR-032               | BR-014, BR-015; VE-012                             |                                                                       | DR-002, DR-003                         |                                                    | Program listing, category browsing, program details and no-program scenarios                                                                                                |     |
| BO-002                 | BP-001, BP-002                                                 |                  | FR-001, FR-002                         | BR-001; VE-014 to VE-016                           |                                                                       | DR-001, DR-007                         |                                                    | Account creation and authentication scenarios                                                                                                                               |     |
| BO-002                 | BP-009                                                         |                  | FR-007 to FR-014, FR-030, FR-031       | BR-001 to BR-009, BR-012, BR-013; VE-001 to VE-011 |                                                                       | DR-001, DR-002, DR-004                 |                                                    | Registration happy-path and exception scenarios                                                                                                                             |     |
| BO-003                 | BP-007, BP-008                                                 |                  | FR-003 to FR-006                       | BR-014, BR-015; VE-012                             |                                                                       | DR-002, DR-003                         |                                                    | Program information, category browsing and program-detail scenarios                                                                                                         |     |
| BO-004                 | BP-009, BP-010, BP-012                                         |                  | FR-015 to FR-017, FR-022               | BR-008 to BR-011; VE-007, VE-009, VE-011           |                                                                       | DR-004, DR-007, DR-008                 |                                                    | Participant registration view/cancellation and registration administration scenarios                                                                                        |     |
| BO-005                 | BP-011, BP-012, BP-013, BP-014                                 |                  | FR-018 to FR-026                       | BR-003, BR-008 to BR-018                           |                                                                       | DR-002, DR-003, DR-004, DR-005, DR-006 |                                                    | Program, registration, attendance and certificate record scenarios                                                                                                          |     |
| BO-006                 | BP-011                                                         |                  | FR-018 to FR-021                       | BR-003, BR-014, BR-015                             |                                                                       | DR-002, DR-003                         |                                                    | Program, category and capacity administration scenarios                                                                                                                     |     |
| BO-006                 | BP-004, BP-005, BP-006, BP-011, BP-012, BP-013, BP-014, BP-015 |                  | FR-028, FR-029, FR-033, FR-034, FR-027 | Role/access rules; VE-009, VE-017                  |                                                                       | DR-007, DR-008, DR-009                 |                                                    | System Administrator authentication, Training Administrator / Trainer authentication, role/access control and administrative user-account scenarios and reporting scenarios |     |
| BO-006                 | BP-003                                                         |                  | FR-035                                 | BR-021; VE-018, VE-019                             |                                                                       | DR-007, DR-008                         |                                                    | System Administrator account creation, static administration key validation and administrative user-account scenarios                                                       |     |
| NFR                    |                                                                | Requirement Area |                                        |                                                    | Design / Control Consideration                                        |                                        | Verification / Test Coverage                       |                                                                                                                                                                             |     |
| NFR-001                |                                                                | Security         |                                        |                                                    | Participant information access control                                |                                        | Security and authorization tests                   |                                                                                                                                                                             |     |
| NFR-002                |                                                                | Security         |                                        |                                                    | Role-based administrative access control                              |                                        | Role/permission tests                              |                                                                                                                                                                             |     |
| NFR-003                |                                                                | Security         |                                        |                                                    | Credential protection and static administration key protection        |                                        | Authentication and security tests                  |                                                                                                                                                                             |     |
| NFR-004                |                                                                | Privacy          |                                        |                                                    | Applicable privacy, personal-data and organizational controls         |                                        | Compliance/privacy verification                    |                                                                                                                                                                             |     |
| NFR-005                |                                                                | Data Integrity   |                                        |                                                    | Validation, transaction consistency and controlled updates            |                                        | Data integrity and reconciliation tests            |                                                                                                                                                                             |     |
| NFR-006                |                                                                | Availability     |                                        |                                                    | Service availability and approved maintenance controls                |                                        | Availability/operational readiness test            |                                                                                                                                                                             |     |
| NFR-007                |                                                                | Performance      |                                        |                                                    | Performance design and capacity assumptions                           |                                        | Performance/load test                              |                                                                                                                                                                             |     |
| NFR-008                |                                                                | Usability        |                                        |                                                    | Navigation and registration user experience                           |                                        | Usability/UAT scenarios                            |                                                                                                                                                                             |     |
| NFR-009                |                                                                | Usability        |                                        |                                                    | Validation and error-message behavior                                 |                                        | Validation/UAT scenarios                           |                                                                                                                                                                             |     |
| NFR-010                |                                                                | Auditability     |                                        |                                                    | Audit logging for significant administrative and registration actions |                                        | Audit logging verification                         |                                                                                                                                                                             |     |
| NFR-011                |                                                                | Scalability      |                                        |                                                    | Support for 2,000 students and 100 concurrent users                   |                                        | Load/concurrency test                              |                                                                                                                                                                             |     |
| NFR-012                |                                                                | Compatibility    |                                        |                                                    | Supported organization-approved desktop/mobile browsers               |                                        | Browser compatibility test                         |                                                                                                                                                                             |     |
| NFR-013                |                                                                | Maintainability  |                                        |                                                    | Maintainable business rules and validation behavior                   |                                        | Architecture/code review and regression assessment |                                                                                                                                                                             |     |

The following matrix provides traceability from each non-functional requirement to the corresponding design concern and verification approach. Detailed test-case and UAT IDs shall be maintained in the test/UAT baseline.

## 14.1 Non-Functional Requirements Traceability

# 15. Requirements Summary

| **Metric**                                | **Result**                                                                                                                                                         |
|-------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Total Functional Requirements             | 35                                                                                                                                                                 |
| Total Non-Functional Requirements         | 13                                                                                                                                                                 |
| Total Business Rules                      | 21                                                                                                                                                                 |
| Total Actors                              | 4                                                                                                                                                                  |
| Total Major Data Entities                 | 9                                                                                                                                                                  |
| Remaining Major Business Requirement Gaps | 0                                                                                                                                                                  |
| Remaining Governance Items                | 3 — formal compliance/legal confirmation; System Administrator bootstrap/static administration key governance confirmation; approval-role segregation confirmation |
| Major Business Processes                  | 15                                                                                                                                                                 |
| External Integrations Confirmed           | Email / Notification Service                                                                                                                                       |
| System Design Readiness                   | Ready for System Design — subject to completion of outstanding governance confirmations                                                                            |

## System Design Readiness: Ready for System Design — subject to completion of outstanding governance confirmations

The major business decisions required for the core participant registration journey have been established: participant account creation and login are required; participant information is defined; all participants are eligible; program capacity is configurable; registration validation, cancellation, attendance, certificate eligibility and issuance, reporting, role-based administration and email confirmation are defined. Remaining items are governance confirmations and do not introduce new business scope.

The system can proceed to detailed System Design. The remaining governance items are formal compliance/legal confirmation, System Administrator bootstrap/static administration key governance confirmation, and approval-role segregation confirmation before the requirements baseline is treated as fully approved and before production release.

## Final Analysis Conclusion

The Training Management System requirements are sufficiently defined for detailed System Design. This corrected baseline consolidates the confirmed participant registration lifecycle, capacity management, cancellation behavior, attendance, certificate eligibility and certificate issuance recording, role-based administration, email confirmation, reporting, privacy baseline and current-release scope. Remaining items are governance confirmations rather than unresolved business-scope requirements.

The system can proceed to detailed System Design. The remaining governance items are formal compliance/legal confirmation, System Administrator bootstrap/static administration key governance confirmation, and approval-role segregation confirmation before the requirements baseline is treated as fully approved and before production release.

This controlled requirements baseline shall serve as the authoritative business baseline for System Design → Development → Test Scripts → UAT.
