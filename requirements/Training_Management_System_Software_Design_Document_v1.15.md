**Software Design Document**

**Training Management System**

Design Baseline v1.15 --- Code Generation Baseline

  ---------------------------------------------------------------------------
  **Document    **Value**
  Item**        
  ------------- -------------------------------------------------------------
  Source of     Training Management System Requirements Analysis v2.4
  Truth         

  Document Type System Design Baseline --- Code Generation Ready for Approved
                Scope

  Design Status System Design Baseline --- Code Generation Ready for Approved
                Scope

  Technology    Node.js, Express.js, Bootstrap, MySQL
  Constraints   

  Purpose       Software Design → Code Generation → Test Scripts → UAT

  Current       READY FOR CODE GENERATION --- CONFIRMED CURRENT-RELEASE
  Readiness     SCOPE; compliance/privacy approval is a production release
                gate and does not block code generation
  ---------------------------------------------------------------------------

*Design principle: The approved Requirements Analysis is the source of
truth. Where the requirements do not define a design decision, the item
is explicitly recorded as a Design Gap.*

# 1. Design Governance and Baseline Control

## 1.1 Document Control

Version 1.15 incorporates the final code-generation readiness
corrections identified during the v1.14 review: corrected
document-control wording; retained the 95% / 2-second performance target
as a recommended technical target pending final technical confirmation;
made MySQL AUTO_INCREMENT explicit in every applicable physical BIGINT
primary-key definition; clarified CSV export as an implementation
convenience within the three confirmed reports; and separated technical
code-generation readiness from formal organizational approval.
Privacy/compliance approval remains a production release gate and does
not block code generation.

  ------------------------------------------------------------------------
  **Document       **Value**
  Item**           
  ---------------- -------------------------------------------------------
  Document Title   Training Management System --- Software Design Document

  Design Version   1.15

  Source           Training_Management_System_Requirements_Analysis_v2.4
  Requirements     

  Status           System Design Baseline --- Code Generation Ready for
                   Approved Scope

  Design Owner     Solution Architecture / Technical Lead

  Intended         Development, QA, UAT, Delivery and Operations
  Consumers        
  ------------------------------------------------------------------------

## 1.2 Version History

  ----------------------------------------------------------------------------------------------------------
  **Version**   **Stage / Date**  **Description of Change**                                     **Status**
  ------------- ----------------- ------------------------------------------------------------- ------------
  0.1           Initial Design    Initial software design derived from Requirements Analysis    Draft
                Draft             v2.4; architecture, data, operations, workflows, UI and NFR   
                                  design introduced.                                            

  1.0           System Design     Consolidated architecture, ERD, DFD, sequence diagrams,       Superseded
                Baseline          wireframes, validation design and requirements traceability.  
                Candidate         Outstanding governance/design gaps retained explicitly.       

  **1.1**       Code Generation   Closed the readiness questions through controlled design      Superseded
                Baseline          decisions; finalized security, permissions, data model, API   
                                  contracts, workflows, NFR targets, configuration, testing and 
                                  implementation baseline.                                      

  1.2           Consistency /     Resolved schema/API/RBAC/audit/retention/CSRF consistency     Superseded
                Governance        issues and formalized the code-generation baseline while      
                Remediation       retaining explicit governance dispositions.                   

  1.3           Physical / API /  Resolved registration re-registration uniqueness;             Superseded
                Traceability      consolidated the physical users schema; completed             
                Remediation       FK/delete/check constraints; aligned RBAC and report          
                                  authorization; defined audit transaction behavior; corrected  
                                  retention to the Requirements baseline; completed             
                                  API/CSRF/time contracts; aligned ERD/architecture/DFD; and    
                                  corrected traceability/readiness wording without changing     
                                  approved business scope.                                      

  1.4           Final             Corrected document-control and decision-table                 Superseded
                Code-Generation   inconsistencies; removed duplicate report schema; finalized   
                Readiness         Training Administrator registration-management scope using    
                Remediation       the existing cancellation operation; aligned API,             
                                  permissions, validation, workflow and UI contracts; and       
                                  clarified that compliance/release gates do not block code     
                                  generation.                                                   

  1.5           Code-Generation   Removed unsupported Training Administrator cancellation       Superseded
                Baseline          authority; completed DR-006/DR-007/DR-008/DR-009 physical     
                Correction        mappings; corrected NFR traceability; aligned report-period   
                                  rules, certificate issuance rules, OP-016, API, RBAC,         
                                  validation, workflow and UI contracts. Compliance/privacy     
                                  remains a production release gate and does not block code     
                                  generation.                                                   

  1.6           API /             Finalized field-level API request/response contracts; removed Superseded
                Code-Generation   duplicate registration endpoints and stale FR-022             
                Finalization      traceability; aligned report period requirements; completed   
                                  certificate issuance integrity; clarified Trainer             
                                  authorization, audit system actor and mutable fields;         
                                  consolidated certificate-output baseline; and confirmed       
                                  compliance/privacy remains a production release gate that     
                                  does not block code generation.                               

  1.7           API / Capacity /  Resolved the remaining FR-021 traceability and capacity API   Superseded
                Integrity         inconsistency; made program capacity an explicit mutable      
                Finalization      field of the program update contract; aligned the permission  
                                  matrix; clarified server-derived participant identity; made   
                                  attendance percentage deterministic for the single-occurrence 
                                  program model; strengthened certificate participant/program   
                                  referential integrity; corrected certificate_type             
                                  nullability; cleaned the design-gap summary; and reconfirmed  
                                  that compliance/privacy approval remains a production release 
                                  gate and does not block code generation.                      

  1.8           Registration /    Formally dispositioned re-registration after cancellation;    Superseded
                Certificate / API introduced a deterministic unique opaque certificate          
                Contract          reference generation mechanism while retaining the            
                Finalization      business-facing number format as deferred; recorded the       
                                  single-occurrence attendance percentage rule as a controlled  
                                  design decision; corrected participant registration API       
                                  request/response contracts and removed participant identity   
                                  fields from the GET registration query contract; and          
                                  reconfirmed that privacy/compliance approval remains a        
                                  production-release gate and does not block code generation.   

  1.9           Participant       Resolved the remaining participant registration POST contract Superseded
                Identity /        issue; unified authenticated identity for Participant,        
                Registration API  Trainer, Training Administrator and System Administrator      
                / Audit           through the users/session model; aligned participant audit    
                Finalization      identity and report Created By derivation; corrected          
                                  certificate/design-decision traceability; corrected stale     
                                  version references; and reconfirmed that privacy/compliance   
                                  approval remains a production-release gate and does not block 
                                  code generation.                                              

  1.10          Participant       Finalized participant account identifier and username         Superseded
                Account / Role /  generation/defaults; normalized canonical role codes across   
                Audit             schema and APIs; defined the reserved non-interactive         
                Finalization      technical audit actor within the four-role model; made the    
                                  users-to-participants relationship explicitly one-to-one for  
                                  participant accounts; finalized Student Account Creation      
                                  Report Created By derivation; corrected certificate-output    
                                  wording so the technical opaque certificate reference remains 
                                  in code-generation scope while business-facing                
                                  numbering/document format remains deferred; and reconfirmed   
                                  that privacy/compliance approval remains a production-release 
                                  gate and does not block code generation.                      

  1.11          Code Generation   Finalized document-control version consistency; clarified     Superseded
                Baseline          that participant account_identifier and username use defined  
                Finalization      server-side ULID generation rules rather than deterministic   
                                  values; explicitly defined the technical audit actor          
                                  password-hash treatment and authentication exclusion;         
                                  separated report Created By presentation from audit actor     
                                  identity; standardized canonical role-code terminology across 
                                  the design; and reconfirmed that privacy/compliance approval  
                                  remains a production-release gate and does not block code     
                                  generation.                                                   

  1.12          API Contract /    Corrected the participant account-creation and administrator  Superseded
                Code Generation   user-creation API table column alignment so Auth / Purpose,   
                Finalization      Request Contract and Response / HTTP Contract are explicitly  
                                  separated; retained the finalized participant identity,       
                                  role-code, audit-actor and report derivation controls; and    
                                  reconfirmed that privacy/compliance approval remains a        
                                  production-release gate and does not block code generation.   

  1.13          Authentication    Finalized the authentication and System Administrator         Superseded
                API Contract      bootstrap API request/response contracts by explicitly        
                Finalization      separating Auth / Purpose, Request Contract and Response /    
                                  HTTP Contract columns for all authentication endpoints;       
                                  retained the finalized participant account, canonical         
                                  role-code, technical audit-actor and report derivation        
                                  controls; and reconfirmed that privacy/compliance approval    
                                  remains a production-release gate and does not block code     
                                  generation.                                                   

  1.14          Final             Closed the remaining RBAC/API/physical-schema consistency     Superseded
                Code-Generation   gaps: restricted /api/v1/admin/users to System Administrator  
                Readiness         account creation only; defined MySQL AUTO_INCREMENT           
                Remediation       generation for all BIGINT primary keys; defined server-side   
                                  non-participant account_identifier generation; clarified      
                                  registration confirmation as pre-submission UI; standardized  
                                  authentication response role naming; removed the unnecessary  
                                  trainerUserId from the public program-detail response;        
                                  strengthened FR-016 cancellation traceability; and            
                                  reconfirmed that privacy/compliance approval remains a        
                                  production-release gate and does not block code generation.   

  1.15          Final             Corrected stale document-control version wording; retained    Current
                Code-Generation   NFR-007 as a recommended 95% / 2-second technical target      System
                Baseline          pending final technical confirmation; made AUTO_INCREMENT     Design
                Corrections       explicit on all applicable BIGINT primary keys; clarified CSV Baseline
                                  as an implementation convenience within the confirmed         
                                  reports; separated technical code-generation readiness from   
                                  formal organizational approval; and reconfirmed that          
                                  compliance/privacy approval remains a production-release gate 
                                  only and does not block code generation.                      
  ----------------------------------------------------------------------------------------------------------

## 1.3 Design Control Principles

-   Use only approved requirements as the business basis for design.

-   Do not introduce unsupported functionality, actors, business rules
    or data.

-   Every major design element shall be traceable to an approved
    requirement.

-   Approved NFRs shall be translated into appropriate technical
    controls without redefining them.

-   Insufficient information shall be recorded as a Design Gap.

-   All architecture, data, API, workflow and UI artifacts shall remain
    consistent with this written design.

-   Changes affecting scope, business rules, security, data, interfaces
    or NFRs shall be assessed through controlled change management.

# 2. Design Overview

## 2.1 System / Feature

Training Management System

## 2.2 Purpose

The purpose of this Software Design Document is to translate
Requirements Analysis v2.4 into a technical design suitable for Software
Design → Code Generation → Test Scripts → UAT.

## 2.3 Scope

### 2.3.1 In Scope

-   Participant account creation and authentication.

-   System Administrator bootstrap account creation and authentication.

-   Training Administrator and Trainer account creation by System
    Administrator.

-   Training Administrator and Trainer authentication.

-   Program and category management.

-   Program browsing and program details.

-   Participant registration and registration validation.

-   Capacity management, duplicate registration and schedule-overlap
    prevention.

-   Registration cancellation.

-   Registration confirmation email.

-   Attendance recording.

-   Certificate eligibility and issuance recording.

-   Required operational reports.

-   Role-based administrative access.

-   Audit history.

-   Participant and registration data retention.

### 2.3.2 Out of Scope

-   Payment processing and payment gateway integration.

-   Bank transfer processing.

-   HR / participant-management-system integration.

-   Native mobile applications.

-   Training content delivery.

-   Video conferencing.

-   Accounting or payroll functionality.

## 2.4 Design Principles

-   Requirements-first.

-   No unsupported business rules.

-   Role-based access control.

-   Server-side validation.

-   Transactional data integrity.

-   Separation of concerns.

-   Maintainability.

-   Auditability.

-   Responsive web design.

-   End-to-end requirement traceability.

# 3. Architecture

## 3.1 Architectural Overview

The design uses a layered modular web-application architecture. The
presentation layer uses server-rendered HTML, Bootstrap and browser
JavaScript/fetch. Express.js 5 provides the HTTP/API boundary.
Application services contain business rules and validation.
Repository/data-access components use MySQL 8.4 LTS. Authentication uses
server-side sessions with secure cookies. Registration confirmation
requests are written to a transactional notification outbox and
delivered asynchronously by a worker to the Email Service. Audit records
are persisted as part of the same database transaction as mandatory
business changes. The application is stateless between requests except
for authenticated session state held in the database-backed session
store, allowing more than one application process to support the
availability target.

## 3.2 Architectural Diagram

`<img src="/mnt/data/tms_sdd_media/media/image1.png" style="width:6.3in;height:5.76181in" />`{=html}

*Figure 3-1 --- Logical Application Architecture*

## 3.3 Components / Modules

  --------------------------------------------------------------------------------------------
  **ID**    **Component**    **Responsibility**                             **Dependencies**
  --------- ---------------- ---------------------------------------------- ------------------
  CMP-001   Web UI           Render participant, administrator and trainer  Express API,
                             views                                          Bootstrap

  CMP-002   Authentication   Account creation, password hashing, login,     User/Access data
                             session creation, logout, timeout and          
                             account-status enforcement                     

  CMP-003   Authorization    Enforce role permissions and participant       Authentication,
                             resource ownership on every protected          User/Access
                             operation                                      

  CMP-004   Participant      Maintain participant account and participant   Authentication,
            Management       information                                    MySQL

  CMP-005   Program          Create/update programs, categories and         Authorization,
            Management       capacity                                       MySQL

  CMP-006   Program          Display available programs, categories and     Program Management
            Catalogue        details                                        

  CMP-007   Registration     Create, view and cancel participant            Participant,
                             registrations with transaction-safe capacity   Program, MySQL
                             enforcement                                    

  CMP-008   Registration     Mandatory data, duplicate, overlap,            Registration,
            Validation       registration-window, availability and capacity Program
                             validation                                     

  CMP-009   Attendance       Record attendance against registration/program Trainer
                                                                            authorization,
                                                                            Registration

  CMP-010   Certificate      Evaluate eligibility and record certificate    Attendance,
                             issuance                                       Registration

  CMP-011   Reporting        Generate three confirmed reports               Participant,
                                                                            Program,
                                                                            Registration,
                                                                            Attendance,
                                                                            Certificate

  CMP-012   Notification     Send registration confirmation email; email    Email Service
                             failure is recorded and does not roll back a   
                             committed registration                         

  CMP-013   Audit            Record security and business audit events;     Applicable modules
                             audit records are append-only                  

  CMP-014   User             Create Training Administrator and Trainer      System
            Administration   accounts                                       Administrator
                                                                            authorization

  CMP-015   Data Access      Transactional persistence and retrieval        MySQL

  CMP-016   Notification     Persist committed notification requests and    MySQL, Email
            Outbox / Worker  asynchronously deliver registration            Service
                             confirmation email with retry and failure      
                             tracking; email failure never rolls back       
                             committed registration.                        
  --------------------------------------------------------------------------------------------

# 4. Data Design

## 4.1 Entities

  ----------------------------------------------------------------------------------------------------------
  **ID**    **Entity**     **Purpose**              **Key Attributes**                    **Requirements**
  --------- -------------- ------------------------ ------------------------------------- ------------------
  ENT-001   Participant    Represents a participant Participant ID, User ID,              DR-001
                           using the system         NRIC/Passport No, Name, Email         
                                                    (derived from User), Mobile No,       
                                                    Account Status (derived from User),   
                                                    Last Login Date/Time (derived from    
                                                    User), Created/Updated timestamps     

  ENT-002   Training       Represents an offered    Program ID, Code, Name, Description,  DR-002
            Program        training program         Objectives, Target Audience,          
                                                    Prerequisites, Category ID, Trainer   
                                                    User ID, Training Date, Start/End     
                                                    Time, Venue, Delivery Mode, Capacity, 
                                                    Derived Available Seats, Registration 
                                                    Open/Close DateTime, Status,          
                                                    Cancellation Policy Reference,        
                                                    Certificate Eligibility Criteria,     
                                                    Certificate Type, timestamps          

  ENT-003   Program        Classifies training      Category ID, Name, Description,       DR-003
            Category       programs                 Status, timestamps                    

  ENT-004   Registration   Represents participant   Registration ID, Reference No,        DR-004
                           registration             Participant ID, Program ID,           
                                                    Registration DateTime, Status,        
                                                    Cancellation DateTime, Cancellation   
                                                    Reason, timestamps                    

  ENT-005   Attendance     Records attendance       Attendance ID, Registration ID,       DR-005
                                                    Participant ID, Program ID,           
                                                    Attendance Date, Status, Percentage,  
                                                    Check-In, Check-Out, Verification     
                                                    Method, Evidence/Reference, Remarks,  
                                                    Recorded By, timestamps               

  ENT-006   Certificate    Records certificate      Certificate ID, Number, Participant   DR-006
                           eligibility and issuance ID, Registration ID, Program ID,      
                                                    Certificate Type, Title, Eligibility  
                                                    Status, Eligibility Criteria/Result,  
                                                    Attendance/Completion %, Completion   
                                                    Date, Issue Date, Certificate Status, 
                                                    Document/Reference, Verification      
                                                    Reference, Issuing                    
                                                    Authority/Signatory, Revocation       
                                                    Date/Reason, timestamps               

  ENT-007   User Role /    Represents authenticated User ID, User/Account Identifier,     DR-007
            Access         accounts, roles and      Linked Participant Identifier         
                           access for Participant,  (derived through                      
                           Training Administrator,  participants.user_id), Username,      
                           Trainer and System       Name, Email, Role ID, Role Name,      
                           Administrator; each      Permissions/Access Scope, Permitted   
                           PARTICIPANT account has  Responsibilities, Account Status,     
                           exactly one linked       Role Assignment Date/Time, Role       
                           participant profile and  Expiry Date/Time,                     
                           non-PARTICIPANT accounts Activation/Deactivation Date/Time,    
                           have no participant      Last Login Date/Time, Authentication  
                           profile                  Method/Reference, Created/Updated     
                                                    timestamps                            

  ENT-008   Audit Record   Records significant      Audit ID, Timestamp, Actor User ID,   DR-008
                           administrative and       Actor Role, Action, Entity Type/ID,   
                           registration actions     Result, Change Summary, Previous      
                                                    Value/Reference, New Value/Reference, 
                                                    Access Scope/Classification, IP       
                                                    Address, User Agent, Correlation ID   

  ENT-009   Report /       Supports required        Report execution metadata: Report     DR-009
            Reporting Data operational reports      ID/Name, Report Type, Reporting       
                                                    Period, Generation Date/Time,         
                                                    Parameters/Filters, Generated By,     
                                                    Status, Output/Reference, Data Access 
                                                    Classification                        

  ENT-010   Notification   Persists notification    Outbox ID, Event Type, Aggregate      Design support for
            Outbox         delivery requests        Type/ID, Recipient, Subject, Payload, email integration
                           created in the same      Status, Attempt Count, Next Attempt,  / NFR-005
                           transaction as committed Last Error, Created/Updated           
                           business events          timestamps                            
  ----------------------------------------------------------------------------------------------------------

## 4.2 Relationships

  ---------------------------------------------------------------------------
  **Entity**         **Relationship**   **Entity**          **Cardinality**
  ------------------ ------------------ ------------------- -----------------
  Program Category   classifies         Training Program    1 : many

  User Role / Access assigns trainer to Training Program    1 : many

  Training Program   has                Registration        1 : many

  Registration       has attendance for Attendance          1 : 0..1

  Participant        has                Attendance          1 : many

  Training Program   has                Attendance          1 : many

  Registration       may result in      Certificate         1 : 0..1

  Participant        may receive        Certificate         1 : many

  Training Program   may have           Certificate         1 : many

  Registration       creates            Notification Outbox 1 : many

  User Role / Access generates          Report Execution    1 : many

  Report Execution   reads              Reporting Data      logical/read
  ---------------------------------------------------------------------------

## 4.3 ERD

`<img src="/mnt/data/tms_sdd_media/media/image2.png" style="width:6.5in;height:1.76119in" />`{=html}

*Figure 4-1 --- Logical Entity Relationship Diagram*

## 4.4 Data Integrity Design

  ----------------------------------------------------------------------------------------------------------------------
  **Table**             **Physical design**                  **Indexes / constraints**
  --------------------- ------------------------------------ -----------------------------------------------------------
  participants          participant_id BIGINT AUTO_INCREMENT Indexes on user_id and nric_passport_no;
                        PK; user_id BIGINT NOT NULL UNIQUE   participants.user_id is a required UNIQUE FK to
                        FK→users.user_id; nric_passport_no   users.user_id and establishes a one-to-one
                        VARCHAR(50) NOT NULL UNIQUE; name    participant-account relationship; participant email,
                        VARCHAR(200) NOT NULL; mobile_no     account status, failed-login state and last-login timestamp
                        VARCHAR(30) NOT NULL; created_at     are derived from users; participant credentials are not
                        DATETIME NOT NULL; updated_at        stored in this table; non-PARTICIPANT users must not have a
                        DATETIME NOT NULL \| Indexes on      participant profile; no mobile uniqueness is assumed
                        user_id, nric_passport_no;           because it is not a confirmed business rule; FK delete rule
                        participant email, account status    RESTRICT
                        and last-login values are derived    
                        from the linked users record;        
                        participant account credentials are  
                        stored only in users.password_hash;  
                        FK delete rule RESTRICT              

  program_categories    category_id BIGINT AUTO_INCREMENT    Index status; category deletion is prohibited when
                        PK; name VARCHAR(150) NOT NULL       referenced by a program; status values limited to
                        UNIQUE; description VARCHAR(500)     ACTIVE/INACTIVE
                        NULL; status VARCHAR(20) NOT NULL;   
                        created_at DATETIME NOT NULL;        
                        updated_at DATETIME NOT NULL         

  users                 user_id BIGINT AUTO_INCREMENT PK;    Indexes
                        account_identifier VARCHAR(100) NOT  account_identifier/username/email/role_id/account_status;
                        NULL UNIQUE; username VARCHAR(100)   canonical role codes are PARTICIPANT, TRAINER,
                        NOT NULL UNIQUE; name VARCHAR(200)   TRAINING_ADMINISTRATOR and SYSTEM_ADMINISTRATOR; role_id
                        NOT NULL; email VARCHAR(254) NOT     and role_name persist only these canonical codes and
                        NULL UNIQUE; password_hash           display labels are UI-only; role display labels are
                        VARCHAR(255) NOT NULL; role_id       UI-only; only System Administrator may create Training
                        VARCHAR(50) NOT NULL; role_name      Administrator or Trainer accounts; Participant account
                        VARCHAR(100) NOT NULL; permissions   creation creates the users row and linked participants row
                        JSON NOT NULL; access_scope JSON NOT atomically: validate uniqueness, generate
                        NULL; permitted_responsibilities     user_id/account_identifier/username, resolve the
                        JSON NOT NULL; account_status        PARTICIPANT role defaults, create users, create the
                        VARCHAR(20) NOT NULL;                participants row referencing users.user_id, create the
                        failed_login_count INT NOT NULL      account-creation audit event, then commit; on failure the
                        DEFAULT 0; lockout_until DATETIME    complete account/profile/audit transaction is rolled back.
                        NULL; role_assigned_at DATETIME NOT  For participant accounts, account_identifier and username
                        NULL; role_expires_at DATETIME NULL; use the defined server-side ULID generation rules; account
                        activated_at DATETIME NULL;          status values are ACTIVE/INACTIVE/LOCKED/DISABLED; one
                        deactivated_at DATETIME NULL;        primary role per account; participant linkage is
                        last_login_at DATETIME NULL;         represented by participants.user_id; referenced user
                        authentication_method VARCHAR(100)   records are not hard-deleted; non-PARTICIPANT
                        NULL; created_at DATETIME NOT NULL;  account_identifier values use the server-side A-\<ULID\>
                        updated_at DATETIME NOT NULL         rule and are unique opaque immutable identifiers

  training_programs     program_id BIGINT AUTO_INCREMENT PK; Indexes category/status/date; CHECK capacity \> 0, end_time
                        code VARCHAR(50) NOT NULL UNIQUE;    \> start_time and registration_open_at \<
                        name VARCHAR(200) NOT NULL;          registration_close_at; application validation requires
                        description TEXT NOT NULL;           trainer_user_id to reference an ACTIVE Trainer;
                        objectives TEXT NOT NULL;            available_seats is derived as capacity minus active
                        target_audience VARCHAR(500) NOT     REGISTERED registrations and is not independently stored;
                        NULL; prerequisites VARCHAR(1000)    FK delete rule RESTRICT
                        NULL; category_id BIGINT NOT NULL    
                        FK→program_categories.category_id;   
                        trainer_user_id BIGINT NOT NULL      
                        FK→users.user_id; training_date DATE 
                        NOT NULL; start_time TIME NOT NULL;  
                        end_time TIME NOT NULL; venue        
                        VARCHAR(300) NULL; delivery_mode     
                        VARCHAR(50) NOT NULL; capacity INT   
                        NOT NULL; registration_open_at       
                        DATETIME NOT NULL;                   
                        registration_close_at DATETIME NOT   
                        NULL; status VARCHAR(30) NOT NULL;   
                        cancellation_policy_reference        
                        VARCHAR(255) NULL;                   
                        certificate_eligibility_criteria     
                        VARCHAR(100) NOT NULL;               
                        certificate_type VARCHAR(100) NULL;  
                        created_at DATETIME NOT NULL;        
                        updated_at DATETIME NOT NULL         

  registrations         registration_id BIGINT               UNIQUE active_registration_key enforces one active
                        AUTO_INCREMENT PK; reference_no      registration per participant/program while allowing
                        VARCHAR(50) NOT NULL UNIQUE;         re-registration after cancellation; indexes
                        participant_id BIGINT NOT NULL       participant_id/status and program_id/status; status values
                        FK→participants.participant_id;      limited to REGISTERED/CANCELLED; FK delete rules RESTRICT;
                        program_id BIGINT NOT NULL           cancelled rows are retained
                        FK→training_programs.program_id;     
                        registered_at DATETIME NOT NULL;     
                        status VARCHAR(20) NOT NULL;         
                        cancelled_at DATETIME NULL;          
                        cancellation_reason VARCHAR(500)     
                        NULL; registration_remarks           
                        VARCHAR(500) NULL; created_at        
                        DATETIME NOT NULL; updated_at        
                        DATETIME NOT NULL;                   
                        active_registration_key VARCHAR(100) 
                        GENERATED ALWAYS AS (CASE WHEN       
                        status = 'REGISTERED' THEN           
                        CONCAT(participant_id, ':',          
                        program_id) ELSE NULL END) STORED    

  attendance            attendance_id BIGINT AUTO_INCREMENT  UNIQUE registration_id enforces one attendance record per
                        PK; registration_id BIGINT NOT NULL  registration; participant_id/program_id must match the
                        FK→registrations.registration_id;    referenced registration and are immutable after creation;
                        participant_id BIGINT NOT NULL;      CHECK percentage between 0 and 100; for the
                        program_id BIGINT NOT NULL;          single-occurrence program model, PRESENT derives to 100.00
                        attendance_date DATE NOT NULL;       and ABSENT derives to 0.00; percentage is server-derived
                        status VARCHAR(20) NOT NULL;         and not trusted from client input; status limited to
                        percentage DECIMAL(5,2) NOT NULL;    PRESENT/ABSENT; application authorization requires
                        check_in_at DATETIME NULL;           recorded_by to be an ACTIVE Trainer authorized for the
                        check_out_at DATETIME NULL;          selected program; FK delete rules RESTRICT
                        verification_method VARCHAR(50)      
                        NULL; evidence_reference             
                        VARCHAR(255) NULL; remarks           
                        VARCHAR(500) NULL; recorded_by       
                        BIGINT NOT NULL FK→users.user_id;    
                        created_at DATETIME NOT NULL;        
                        updated_at DATETIME NOT NULL         

  certificates          certificate_id BIGINT AUTO_INCREMENT UNIQUE registration_id enforces one certificate record per
                        PK; certificate_number VARCHAR(60)   registration; participant_id/program_id must match the
                        UNIQUE NULL; participant_id BIGINT   referenced registration and are immutable after creation;
                        NOT NULL                             participant_id/program_id also reference
                        FK→participants.participant_id;      participants/training_programs respectively; CHECK
                        registration_id BIGINT NOT NULL      attendance_percentage between 0 and 100; when
                        FK→registrations.registration_id;    certificate_status = ISSUED, certificate_number, issue_date
                        program_id BIGINT NOT NULL           and issued_by are mandatory; business-facing certificate
                        FK→training_programs.program_id;     numbering format, document/PDF and signatory content remain
                        certificate_type VARCHAR(100) NOT    deferred; current implementation generates a unique opaque
                        NULL; certificate_title VARCHAR(255) UUID/ULID-compatible certificate reference at issuance and
                        NOT NULL; eligibility_status         stores it in certificate_number; FK delete rules RESTRICT
                        VARCHAR(30) NOT NULL;                
                        eligibility_result VARCHAR(255) NOT  
                        NULL; attendance_percentage          
                        DECIMAL(5,2) NOT NULL;               
                        completion_date DATE NOT NULL;       
                        issue_date DATE NULL;                
                        certificate_status VARCHAR(30) NOT   
                        NULL; document_reference             
                        VARCHAR(500) NULL;                   
                        verification_reference VARCHAR(255)  
                        NULL; issuing_authority VARCHAR(255) 
                        NULL; revocation_date DATE NULL;     
                        revocation_reason VARCHAR(500) NULL; 
                        issued_by BIGINT NULL                
                        FK→users.user_id; created_at         
                        DATETIME NOT NULL; updated_at        
                        DATETIME NOT NULL                    

  audit_records         audit_id BIGINT AUTO_INCREMENT PK;   Indexes timestamp, actor_user_id, entity_type/entity_id and
                        event_timestamp DATETIME NOT NULL;   correlation_id; all authenticated principal actions,
                        actor_user_id BIGINT NOT NULL        including Participant actions, reference users.user_id;
                        FK→users.user_id; actor_role         application APIs never update/delete audit rows;
                        VARCHAR(30) NOT NULL; action         system-originated events use the reserved technical audit
                        VARCHAR(100) NOT NULL; entity_type   actor defined in DEC-015
                        VARCHAR(100) NOT NULL; entity_id     (users.role_id=SYSTEM_ADMINISTRATOR,
                        VARCHAR(100) NOT NULL; result        account_status=DISABLED, authentication_method=SYSTEM,
                        VARCHAR(20) NOT NULL; change_summary non-interactive); the actor has a generated unusable
                        TEXT NOT NULL; previous_value JSON   password_hash value, is never issued a usable credential
                        NULL; new_value JSON NULL;           and is rejected by interactive authentication because it is
                        access_scope VARCHAR(100) NOT NULL;  DISABLED/SYSTEM; FK delete rule RESTRICT
                        data_classification VARCHAR(50) NOT  
                        NULL; ip_address VARCHAR(45) NULL;   
                        user_agent VARCHAR(500) NULL;        
                        correlation_id VARCHAR(100) NULL \|  
                        Indexes timestamp, actor_user_id,    
                        entity_type/entity_id,               
                        correlation_id; Participant actions  
                        are audited through the same users   
                        identity as other authenticated      
                        principals; application APIs never   
                        update/delete audit rows;            
                        system-originated events use a       
                        reserved non-interactive technical   
                        System Audit Actor provisioned by    
                        the initial migration; FK delete     
                        rule RESTRICT                        

  sessions              session_id VARCHAR(128) PK; user_id  Indexes user_id and expires_at; every authenticated
                        BIGINT NOT NULL FK→users.user_id;    principal, including Participant, has a users record;
                        session_data TEXT NOT NULL;          expired sessions are purged; FK delete rule CASCADE because
                        expires_at DATETIME NOT NULL \|      sessions have no independent business value
                        Indexes user_id and expires_at;      
                        every authenticated principal,       
                        including Participant, has a users   
                        record; expired sessions are purged; 
                        FK delete rule CASCADE because       
                        sessions have no independent         
                        business value                       

  notification_outbox   outbox_id BIGINT AUTO_INCREMENT PK;  Indexes status/next_attempt_at and aggregate; status values
                        event_type VARCHAR(100) NOT NULL;    limited to PENDING/PROCESSING/SENT/FAILED; unique
                        aggregate_type VARCHAR(100) NOT      business-event key where required for idempotency; created
                        NULL; aggregate_id BIGINT NOT NULL;  in the same transaction as the registration
                        recipient VARCHAR(254) NOT NULL;     
                        subject VARCHAR(255) NOT NULL;       
                        payload JSON NOT NULL; status        
                        VARCHAR(20) NOT NULL; attempt_count  
                        INT NOT NULL DEFAULT 0;              
                        next_attempt_at DATETIME NULL;       
                        last_error VARCHAR(1000) NULL;       
                        created_at DATETIME NOT NULL;        
                        updated_at DATETIME NOT NULL         

  report_executions     report_execution_id BIGINT           Indexes generated_at, report_type, generated_by; CHECK
                        AUTO_INCREMENT PK; report_name       period_from \<= period_to; report generation and download
                        VARCHAR(100) NOT NULL; report_type   are auditable; FK delete rule RESTRICT
                        VARCHAR(50) NOT NULL; period_from    
                        DATETIME NOT NULL; period_to         
                        DATETIME NOT NULL; parameters JSON   
                        NULL; generated_at DATETIME NOT      
                        NULL; generated_by BIGINT NOT NULL   
                        FK→users.user_id; status VARCHAR(20) 
                        NOT NULL; output_reference           
                        VARCHAR(500) NULL;                   
                        data_access_classification           
                        VARCHAR(50) NOT NULL                 
  ----------------------------------------------------------------------------------------------------------------------

> Validate participant\
> ↓\
> Validate program availability / registration window\
> ↓\
> Lock program capacity state / validate active registration uniqueness\
> ↓\
> Validate schedule overlap\
> ↓\
> Create Registration = Registered\
> ↓\
> Create mandatory Audit Record\
> ↓\
> Create Notification Outbox record\
> ↓\
> Commit transaction\
> ↓\
> Outbox Worker delivers confirmation email asynchronously All BIGINT
> primary-key identifiers are generated by MySQL using AUTO_INCREMENT;
> application code does not calculate or reuse BIGINT primary-key
> values. Opaque business/account references such as account_identifier,
> username and certificate_number follow their separately defined
> generation rules.

# 5. Data Flow

## 5.1 Data Flow Overview

> Actor\
> ↓\
> Web UI\
> ↓\
> Express API\
> ↓\
> Authentication / Authorization\
> ↓\
> Business Module\
> ↓\
> Validation\
> ↓\
> MySQL\
> ↓\
> Business Result\
> ↓\
> Web UI

## 5.2 DFD --- Level 0

`<img src="/mnt/data/tms_sdd_media/media/image3.png" style="width:6.4in;height:2.21849in" />`{=html}

*Figure 5-1 --- Level 0 Data Flow Diagram*

## 5.3 DFD --- Registration

> Participant\
> ↓\
> Registration UI\
> ↓\
> Registration API\
> ↓\
> Authentication / Authorization\
> ↓\
> Registration Validation\
> ├── Participant / Program checks\
> ├── Active-registration uniqueness\
> ├── Schedule overlap\
> └── Capacity / availability\
> ↓\
> MySQL transaction\
> ├── Registration\
> ├── Mandatory Audit\
> └── Notification Outbox\
> ↓\
> Commit\
> ↓\
> Outbox Worker → Email / Notification Service

# 6. Operations

## 6.1 Operations / API Design

  ----------------------------------------------------------------------------------------------------------------
  **ID**   **Operation**           **Actor**       **Input**                    **Output**      **Requirements**
  -------- ----------------------- --------------- ---------------------------- --------------- ------------------
  OP-001   Create participant      Participant     Participant/account          Account status  FR-001, FR-008
           account                                 information                                  

  OP-002   Authenticate            Participant     Credentials                  Authenticated   FR-002
           participant                                                          session         

  OP-003   Bootstrap System        Static-key      Static key + account         Account status  FR-035
           Administrator account   holder          information                                  

  OP-004   Authenticate System     System          Credentials                  Authenticated   FR-034
           Administrator           Administrator                                session         

  OP-005   Create Training         System          Account + role               Account status  FR-029
           Administrator/Trainer   Administrator                                                
           account                                                                              

  OP-006   Authenticate Training   TA / Trainer    Credentials                  Authenticated   FR-033
           Administrator/Trainer                                                session         

  OP-007   List available programs Participant     Category/filter parameters   Program list    FR-003, FR-004

  OP-008   View program details    Participant     Program ID                   Program details FR-005, FR-006

  OP-009   Create registration     Participant     Program ID + registration    Registration    FR-007--FR-014
                                                   information                                  

  OP-010   View participant        Participant     Authenticated participant    Registration    FR-015
           registrations                                                        list/details    

  OP-011   Cancel registration     Participant     Registration ID              Updated         FR-016
                                                                                registration    

  OP-012   Create training program Training        Program data                 Program         FR-018
                                   Administrator                                                

  OP-013   Update training program Training        Program ID + changed data    Updated program FR-019
                                   Administrator                                                

  OP-014   Maintain program        Training        Category data                Category        FR-020
           category                Administrator                                                

  OP-015   Configure program       Training        Program ID + capacity        Updated         FR-021
           capacity                Administrator                                capacity        

  OP-016   View registration       Training        Registration criteria /      Registration    FR-022
           administration          Administrator   filters; optional            list/detail     
                                                   registration ID for                          
                                                   permitted view action                        

  OP-017   Record attendance       Trainer         Program/registration         Attendance      FR-023, FR-024
                                                   attendance data              result          

  OP-018   Record certificate      Training        Eligible                     Certificate     FR-025, FR-026
           issuance                Administrator   registration/certificate     record          
                                                   data                                         

  OP-019   Generate Certificate    Training        Report parameters            Report          FR-027
           Report                  Administrator                                                

  OP-020   Generate Program        Training        Report parameters            Report          FR-027
           Registration Report     Administrator                                                

  OP-021   Generate Account        Training        Report parameters            Report          FR-027
           Creation Report         Administrator                                                
  ----------------------------------------------------------------------------------------------------------------

API common contract: JSON UTF-8; Content-Type application/json;
correlationId is returned on every response; server-side validation is
mandatory; IDs are positive integers unless otherwise stated; timestamps
use ISO 8601 UTC; date values use YYYY-MM-DD; time values use HH:mm:ss;
strings use the maximum lengths defined by the physical schema;
enum/status fields accept only values defined in this SDD; null is
allowed only where the schema marks a field nullable; list endpoints use
page\>=1 and pageSize 1..100 with default 20; sorting uses an explicit
allow-list and deterministic secondary key; filters are server-side and
parameterized. State-changing cookie-authenticated requests require a
server-issued CSRF token supplied in the X-CSRF-Token header; the token
is rendered into authenticated HTML pages and is validated before
controller execution. Error envelope: { code, message, details,
timestamp, correlationId }. Never return password hashes, static keys,
session identifiers or unmasked NRIC/Passport values. API role values
use only canonical role codes PARTICIPANT, TRAINER,
TRAINING_ADMINISTRATOR and SYSTEM_ADMINISTRATOR; human-readable role
labels are UI-only.

## 6.2 Logical API Resource Structure

  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Method**   **Path**                                         Auth / Purpose      Request Contract                                                                                                                                                                                                                                                              Response / HTTP Contract
  ------------ ------------------------------------------------ ------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  POST         /api/v1/auth/participants                        Public /            JSON: nricPassportNo, name, email, mobileNo, password; all request fields are validated; password is never returned. Server applies the defined server-side ULID generation rules for account_identifier=P-\<ULID\> and username=participant-\<ULID\>; both are unique opaque 201 {participantId,status,createdAt}; 400 {code,message,details,timestamp,correlationId}; 409 duplicate email/NRIC
                                                                participant         identifiers and are not deterministic values derived from participant input. Server assigns role_id=PARTICIPANT and role_name=PARTICIPANT, initializes account_status=ACTIVE and role_assigned_at=created_at, derives permissions/access_scope/permitted_responsibilities     
                                                                self-registration   from the PARTICIPANT role, and atomically creates users, the linked participants profile and the account-creation audit event; any failure rolls back the complete transaction. Participant login uses email/password; username is an immutable account identifier and is not 
                                                                                    a participant login input in the current release.                                                                                                                                                                                                                             

  POST         /api/v1/auth/participants/login                  Public /            JSON: email,password; both required. Server validates credentials, account_status and canonical role code PARTICIPANT; no session identifier is returned.                                                                                                                     200 {userId,participantId,role,status,expiresAt}; role uses canonical code PARTICIPANT; session is server-side and session ID is never returned; 401 generic authentication failure; 423 locked/disabled
                                                                participant login                                                                                                                                                                                                                                                                                 

  POST         /api/v1/auth/system-admin/bootstrap              Static key only /   JSON: staticAdministrationKey,username,name,email,password; all account fields are validated; staticAdministrationKey is validated against the configured deployment secret and is never persisted or logged; role is server-assigned as SYSTEM_ADMINISTRATOR;                201 {userId,accountIdentifier,username,role,accountStatus,createdAt}; role uses canonical role code SYSTEM_ADMINISTRATOR; 400 validation; 401 invalid key; 409 active System Administrator exists
                                                                System              account_identifier=A-\<ULID\> is server-generated, unique, opaque and immutable; permissions, access_scope, permitted_responsibilities, account_status and timestamps are server-controlled.                                                                                  
                                                                Administrator                                                                                                                                                                                                                                                                                     
                                                                bootstrap                                                                                                                                                                                                                                                                                         

  POST         /api/v1/auth/system-admin/login                  Public / System     JSON: email,password; both required. Server validates credentials, account_status and canonical role code SYSTEM_ADMINISTRATOR; no session identifier is returned.                                                                                                            200 {userId,role,status,expiresAt}; role uses canonical role code SYSTEM_ADMINISTRATOR; session is server-side and session ID is never returned; 401 generic authentication failure; 423 locked/disabled
                                                                Administrator login                                                                                                                                                                                                                                                                               

  POST         /api/v1/auth/staff/login                         Public / Training   JSON: email,password; both required. Server validates credentials, account_status and canonical role code TRAINING_ADMINISTRATOR or TRAINER; no session identifier is returned.                                                                                               200 {userId,role,status,expiresAt}; role uses canonical role code TRAINING_ADMINISTRATOR or TRAINER; session is server-side and session ID is never returned; 401 generic authentication failure; 423 locked/disabled
                                                                Administrator or                                                                                                                                                                                                                                                                                  
                                                                Trainer login                                                                                                                                                                                                                                                                                     

  POST         /api/v1/auth/logout                              Authenticated /     No body                                                                                                                                                                                                                                                                       204 no body; CSRF protected
                                                                invalidate current                                                                                                                                                                                                                                                                                
                                                                session                                                                                                                                                                                                                                                                                           

  GET          /api/v1/programs                                 Public / catalogue  Query: page, pageSize\<=100, categoryId, availability, sort                                                                                                                                                                                                                   200 {items\[\],page,pageSize,total}; item={programId,code,name,categoryId,categoryName,trainingDate,startTime,endTime,venue,deliveryMode,capacity,availableSeats,status,registrationOpenAt,registrationCloseAt}; 400 invalid filter
                                                                listing                                                                                                                                                                                                                                                                                           

  GET          /api/v1/programs/:programId                      Public / program    Path: programId                                                                                                                                                                                                                                                               200
                                                                detail                                                                                                                                                                                                                                                                                            {programId,code,name,description,objectives,targetAudience,prerequisites,categoryId,categoryName,trainerName,trainingDate,startTime,endTime,venue,deliveryMode,capacity,availableSeats,status,registrationOpenAt,registrationCloseAt,cancellationPolicyReference,certificateEligibilityCriteria,certificateType,createdAt,updatedAt};
                                                                                                                                                                                                                                                                                                                                                                  404 not found/not visible

  POST         /api/v1/registrations                            Participant /       JSON: programId required. Participant identity is derived exclusively from the authenticated participant session; no participantId, NRIC/Passport, name, email or mobile identity field is accepted. Server derives registrationId, referenceNo, registeredAt, status and     201 {registrationId,referenceNo,programId,status,registeredAt}; 400 validation; 401 unauthenticated; 404 program not found/not visible; 409 duplicate/full/window/overlap
                                                                create own          timestamps.                                                                                                                                                                                                                                                                   
                                                                registration                                                                                                                                                                                                                                                                                      

  GET          /api/v1/registrations                            Participant / own   Query: page, pageSize, status, sort. Participant identity is derived exclusively from the authenticated participant/session; no participantId, NRIC/Passport, name, email or mobile identity parameter is accepted.                                                           200 {items\[\],page,pageSize,total}; item={registrationId,referenceNo,programId,programCode,programName,trainingDate,startTime,endTime,registeredAt,status,cancelledAt,cancellationReason}; 401
                                                                records only                                                                                                                                                                                                                                                                                      

  POST         /api/v1/registrations/:registrationId/cancel     Participant / own   Path: registrationId; optional cancellationReason                                                                                                                                                                                                                             200 {registrationId,referenceNo,status,cancelledAt}; 400 not cancellable; 403 ownership; 404
                                                                registration only                                                                                                                                                                                                                                                                                 

  POST         /api/v1/admin/programs                           Training            JSON:                                                                                                                                                                                                                                                                         201 {program}; 400 validation; 403
                                                                Administrator /     code,name,description,objectives,targetAudience,prerequisites,categoryId,trainerUserId,trainingDate,startTime,endTime,venue,deliveryMode,capacity,registrationOpenAt,registrationCloseAt,status,cancellationPolicyReference,certificateEligibilityCriteria,certificateType;   
                                                                create program      required fields follow DR-002; certificateType and venue/prerequisites/cancellationPolicyReference are optional                                                                                                                                                               

  PUT          /api/v1/admin/programs/:programId                Training            Path programId; JSON only mutable fields:                                                                                                                                                                                                                                     200 {program}; 400 validation/capacity/date rule; 403/404
                                                                Administrator /     name,description,objectives,targetAudience,prerequisites,categoryId,trainerUserId,trainingDate,startTime,endTime,venue,deliveryMode,capacity,registrationOpenAt,registrationCloseAt,status,cancellationPolicyReference,certificateEligibilityCriteria,certificateType;        
                                                                update program      programId/code/createdAt immutable Capacity must be an integer \> 0 and must not be lower than the current number of REGISTERED registrations; the update is transactional and availableSeats is re-derived after update.                                                     

  POST         /api/v1/admin/categories                         Training            JSON: name required; description optional; status optional ACTIVE\|INACTIVE                                                                                                                                                                                                   201 {categoryId,name,description,status,createdAt,updatedAt}; 400; 403; 409 duplicate
                                                                Administrator /                                                                                                                                                                                                                                                                                   
                                                                create category                                                                                                                                                                                                                                                                                   

  PUT          /api/v1/admin/categories/:categoryId             Training            Path categoryId; JSON: name required, description optional, status ACTIVE\|INACTIVE                                                                                                                                                                                           200 {categoryId,name,description,status,updatedAt}; 400/403/404
                                                                Administrator /                                                                                                                                                                                                                                                                                   
                                                                update category                                                                                                                                                                                                                                                                                   

  GET          /api/v1/admin/registrations/:registrationId      Training            Path: registrationId positive integer                                                                                                                                                                                                                                         200 {registrationId,referenceNo,participantId,programId,registeredAt,status,cancelledAt,cancellationReason,registrationRemarks}; 403; 404
                                                                Administrator /                                                                                                                                                                                                                                                                                   
                                                                view registration                                                                                                                                                                                                                                                                                 
                                                                detail within                                                                                                                                                                                                                                                                                     
                                                                operational scope                                                                                                                                                                                                                                                                                 

  GET          /api/v1/admin/registrations                      Training            Query: periodFrom, periodTo optional; programId, categoryId, participantId, status optional; page\>=1; pageSize 1..100; sort allow-list                                                                                                                                       200 {items\[\],page,pageSize,total}; item={registrationId,referenceNo,participantId,programId,registeredAt,status,cancelledAt,cancellationReason}; 400 invalid filter; 403
                                                                Administrator /                                                                                                                                                                                                                                                                                   
                                                                view registrations                                                                                                                                                                                                                                                                                
                                                                within operational                                                                                                                                                                                                                                                                                
                                                                scope                                                                                                                                                                                                                                                                                             

  POST         /api/v1/admin/users                              System              JSON: username,name,email,password,role; role must be TRAINING_ADMINISTRATOR or TRAINER. role_id and role_name are stored using the canonical role code; account_identifier=A-\<ULID\> is server-generated, unique, opaque and immutable; permissions, access_scope,          201 {userId,accountIdentifier,username,name,email,role,accountStatus,createdAt}; 400 validation; 403 unauthorized role/account action; 409 duplicate
                                                                Administrator /     permitted_responsibilities, account_status, timestamps and other account-control fields are server-controlled.                                                                                                                                                                
                                                                create Training                                                                                                                                                                                                                                                                                   
                                                                Administrator or                                                                                                                                                                                                                                                                                  
                                                                Trainer account                                                                                                                                                                                                                                                                                   

  POST         /api/v1/trainer/programs/:programId/attendance   Trainer / assigned  Path programId; JSON: attendanceDate, records\[\]; each record={registrationId,status,checkInAt?,checkOutAt?,verificationMethod?,evidenceReference?,remarks?}; status is PRESENT or ABSENT; percentage is server-derived as 100.00 for PRESENT and 0.00 for ABSENT;           200 {items\[\]}; item={attendanceId,registrationId,participantId,programId,attendanceDate,status,percentage,recordedBy}; 400 validation; 403 if not assigned; 404
                                                                program only        participantId/programId/recordedBy are server-derived                                                                                                                                                                                                                         

  POST         /api/v1/admin/certificates                       Training            JSON: registrationId,certificateType,certificateTitle; issuingAuthority?,verificationReference?,documentReference?; eligibilityStatus,eligibilityResult,attendancePercentage and completionDate are server-derived/validated; all certificate type/title fields required      201 {certificateId,certificateNumber,participantId,registrationId,programId,certificateType,certificateTitle,eligibilityStatus,eligibilityResult,attendancePercentage,completionDate,issueDate,certificateStatus,documentReference,verificationReference,issuingAuthority,issuedBy}; 400 ineligible/validation; 403; 409 already issued
                                                                Administrator /     Server generates a unique opaque certificateNumber (UUID/ULID-compatible reference) at issuance; the business-facing certificate numbering format remains deferred.                                                                                                           
                                                                issue certificate                                                                                                                                                                                                                                                                                 

  GET          /api/v1/admin/reports/certificates               Training            Query: periodFrom and periodTo required ISO-8601 datetimes; programId,categoryId,participantId,certificateStatus,output optional; page\>=1; pageSize 1..100                                                                                                                   200 JSON {reportExecutionId,reportName,reportType,periodFrom,periodTo,generatedAt,generatedBy,status,data\[\],page,pageSize,total}; output=csv returns text/csv; 400/403
                                                                Administrator /                                                                                                                                                                                                                                                                                   
                                                                certificate report                                                                                                                                                                                                                                                                                

  GET          /api/v1/admin/reports/registrations              Training            Query: periodFrom and periodTo required ISO-8601 datetimes; programId,categoryId,participantId,status,output optional; page\>=1; pageSize 1..100                                                                                                                              200 JSON {reportExecutionId,reportName,reportType,periodFrom,periodTo,generatedAt,generatedBy,status,data\[\],page,pageSize,total}; output=csv returns text/csv; 400/403
                                                                Administrator /                                                                                                                                                                                                                                                                                   
                                                                registration report                                                                                                                                                                                                                                                                               

  GET          /api/v1/admin/reports/accounts                   Training            Query: periodFrom and periodTo required ISO-8601 datetimes; accountStatus,participantId,output optional; page\>=1; pageSize 1..100; NRIC/Passport never returned unmasked                                                                                                     200 JSON {reportExecutionId,reportName,reportType,periodFrom,periodTo,generatedAt,generatedBy,status,data\[\],page,pageSize,total}; output=csv returns text/csv; 400/403
                                                                Administrator /                                                                                                                                                                                                                                                                                   
                                                                account report                                                                                                                                                                                                                                                                                    
  -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> /api/v1
>
> /auth\
> /participants\
> /participants/login\
> /system-admin/bootstrap\
> /system-admin/login\
> /staff/login
>
> /programs\
> /programs/:programId
>
> /registrations\
> /registrations/:registrationId\
> /registrations/:registrationId/cancel
>
> /admin/programs\
> /admin/categories\
> /admin/registrations\
> /admin/users
>
> /trainer/programs/:programId/attendance
>
> /admin/certificates
>
> /admin/reports/certificates\
> /admin/reports/registrations\
> /admin/reports/accounts

# 7. Validation & Business Rules

  -----------------------------------------------------------------------------------------------------------------------------
  Endpoint / Operation                      Participant   Trainer         Training Administrator         System Administrator
  ----------------------------------------- ------------- --------------- ------------------------------ ----------------------
  /api/v1/auth/participants                 C             \-              \-                             \-

  /api/v1/auth/participants/login           C             \-              \-                             \-

  /api/v1/auth/system-admin/bootstrap       \-            \-              \-                             Bootstrap/static key

  /api/v1/auth/system-admin/login           \-            \-              \-                             C

  /api/v1/auth/staff/login                  \-            C               C                              \-

  /api/v1/auth/logout                       C             C               C                              C

  /api/v1/programs                          R             R               R                              R

  /api/v1/programs/:programId               R             R               R                              R

  /api/v1/registrations                     C/R own       \-              \-                             \-

  /api/v1/registrations/:id/cancel          C own         \-              \-                             \-

  /api/v1/admin/programs/:programId         \-            \-              C/U                            \-

  /api/v1/admin/categories\*                \-            \-              C/U                            \-

  /api/v1/admin/registrations/:id           \-            \-              R                              \-

  /api/v1/admin/registrations               R             \-              R                              \-

  /api/v1/admin/users                       \-            \-              \-                             C

  /api/v1/trainer/programs/:id/attendance   \-            C/U assigned    \-                             \-

  /api/v1/admin/certificates                \-            \-              C                              \-

  /api/v1/admin/reports/\*                  \-            \-              R                              \-

  Audit records                             \-            \-              \-                             R

  Authorization rule                        Own           Assigned        All operational training data  System administration
                                            participant   programs only;  required by role; canonical    scope only; canonical
                                            resources     canonical role  role code                      role code
                                            only;         code TRAINER;   TRAINING_ADMINISTRATOR;        SYSTEM_ADMINISTRATOR
                                            canonical     participant     registration-management        
                                            role code     data limited to mutation actions are not       
                                            PARTICIPANT   operational     implemented until explicitly   
                                                          attendance      permitted by controlled        
                                                          scope           requirements change            
  -----------------------------------------------------------------------------------------------------------------------------

  ----------------------------------------------------------------------------------------------------------------
  **ID**    **Validation / Rule**                                      **Responsibility**          **Related
                                                                                                   Requirement**
  --------- ---------------------------------------------------------- --------------------------- ---------------
  VAL-001   Participant must be authenticated before registration      Authorization /             BR-001, VE-008
                                                                       Registration                

  VAL-002   Required participant information must be present           Registration Validator      BR-012, VE-001

  VAL-003   Participant information must be valid                      Participant/Registration    VE-002
                                                                       Validator                   

  VAL-004   Participant must not have an active REGISTERED             Registration Validator / DB BR-007 /
            registration for the same program. A CANCELLED historical  constraint                  DEC-011
            registration does not block a later registration because                               
            DEC-011 explicitly adopts re-registration after                                        
            cancellation for the current release.                                                  

  VAL-005   Program must be available                                  Program/Registration        FR-030, VE-006
                                                                       Validator                   

  VAL-006   Program capacity must not be reached                       Registration Validator      BR-003, BR-004,
                                                                                                   VE-003

  VAL-007   No waiting list is created when full                       Registration Module         BR-005

  VAL-008   Schedule must not overlap another registration             Registration Validator      BR-006, VE-005

  VAL-009   Successful registration status is Registered               Registration Module         BR-008, BR-009

  VAL-010   Registration information cannot be modified after          Registration API            BR-011, VE-007
            submission                                                                             

  VAL-011   Participant may cancel existing registration               Registration Module         BR-010

  VAL-012   Certificate requires 100% attendance                       Certificate Module          BR-017, VE-013

  VAL-013   Attendance applies only to registered participants         Attendance Module           BR-016

  VAL-014   Unauthorized administrative access is denied               Authorization               FR-028, VE-009

  VAL-015   Account information uniqueness is enforced                 Account Module              VE-015

  VAL-016   Account status must permit authentication                  Authentication              VE-016, VE-017

  VAL-017   Static administration key must be valid for bootstrap      Bootstrap Module            BR-021, VE-019

  VAL-018   System Administrator account information must be valid     Bootstrap Module            VE-018

  VAL-019   No-program scenario returns appropriate message            Program Catalogue           FR-032, VE-012

  VAL-020   Registration failure must never be represented as          Registration Transaction    VE-011
            successful                                                                             

  VAL-021   Registration is allowed only during the configured         Registration Validator      FR-030 /
            registration-open/close window                                                         registration
                                                                                                   window rule

  VAL-022   Cancellation changes status to CANCELLED, releases the     Registration Module         BR-010 / BR-018
            active-registration key and retains the historical                                     / DEC-011
            registration row. A participant may later submit a new                                 
            registration for the same program, subject to normal                                   
            registration validation, as defined by DEC-011.                                        

  VAL-023   Only ACTIVE accounts may authenticate; LOCKED and DISABLED Authentication              NFR-003 /
            accounts are rejected                                                                  security design

  VAL-024   Registration capacity is enforced inside a database        Registration Transaction    BR-003 / BR-004
            transaction with row-level locking or an equivalent atomic                             / NFR-005
            conditional update; the mandatory audit and outbox records                             
            are created in the same transaction                                                    

  VAL-025   Certificate issuance is permitted only once per            Certificate Module          BR-017
            registration and only when attendance percentage is                                    
            exactly 100%                                                                           

  VAL-026   Attendance can be recorded only for the selected program   Attendance Module           BR-016
            and a Registered participant; one attendance record per                                
            registration                                                                           

  VAL-027   API resources enforce role authorization and participant   Authorization               FR-028 /
            ownership on every protected operation; Training                                       NFR-001 /
            Administrator report access is limited to the three                                    NFR-002 /
            approved reports                                                                       FR-027

  VAL-028   NRIC/Passport is masked in ordinary participant-facing     Privacy/Security            NFR-004
            screens, standard reports and logs; full value is                                      
            restricted to authorized administrative views                                          

  VAL-029   Audit records are append-only and cannot be modified or    Audit Module                NFR-010 /
            deleted through application APIs; mandatory business audit                             NFR-005
            events are transactionally committed with the business                                 
            change                                                                                 

  VAL-030   Email failure does not change a committed registration     Notification/Registration   BR-013 /
            outcome; failure and retry state are recorded in the                                   NFR-005
            notification outbox                                                                    

  VAL-031   All state-changing cookie-authenticated requests require a Security Middleware         NFR-003 /
            valid CSRF token rendered by the server into the                                       browser session
            authenticated page and supplied in X-CSRF-Token;                                       design
            invalid/missing token returns 403 and is audited as a                                  
            security event                                                                         

  VAL-032   Training Administrator registration administration is      Registration /              FR-022 / FR-016
            read-only for the code-generation baseline because FR-022  Authorization               / BR-010
            does not enumerate specific mutation actions. No                                       
            registration-management mutation endpoint is implemented;                              
            unsupported mutation methods/routes are rejected according                             
            to the standard authorization/routing contract. The                                    
            confirmed participant cancellation flow remains unchanged.                             

  VAL-033   Training Program capacity updates require an integer       Program Management /        FR-021 / BR-004
            capacity greater than zero and must not reduce capacity    Capacity                    / NFR-005
            below the current number of REGISTERED registrations; the                              
            capacity update and available-seat re-derivation occur                                 
            transactionally.                                                                       

  VAL-034   For a single-occurrence program, attendance percentage is  Attendance / Certificate    BR-016 / BR-017
            server-derived: PRESENT = 100.00 and ABSENT = 0.00.                                    / NFR-005
            Client-supplied percentage values are ignored/rejected and                             
            cannot determine certificate eligibility.                                              

  VAL-035   All authenticated principals, including Participants, use  Authentication / Account    FR-001 / FR-002
            the users identity for sessions and audit attribution.     Identity                    / FR-028 /
            Participant account creation creates a users record with                               NFR-003 /
            role PARTICIPANT and a linked participant profile                                      DR-007 / DR-008
            atomically; participant email/account status/last login                                
            are derived from the users record.                                                     

  VAL-036   Participant account creation uses defined server-side      Account / Identity Module   FR-001 / DR-007
            generation/default rules: account_identifier=P-\<ULID\>,                               / DEC-014
            username=participant-\<ULID\>,                                                         
            role_id/role_name=PARTICIPANT, account_status=ACTIVE,                                  
            role_assigned_at=created_at;                                                           
            permissions/access_scope/permitted_responsibilities are                                
            derived from the PARTICIPANT role. The generated username                              
            and account identifier are unique and immutable after                                  
            creation; the values are opaque server-generated                                       
            identifiers and are not derived deterministically from                                 
            participant input.                                                                     

  VAL-037   A PARTICIPANT user must have exactly one linked            Account / Identity Module / FR-001 / DR-001
            participants profile through participants.user_id; a       DB Constraint               / DR-007 /
            non-PARTICIPANT user must not have a participant profile.                              DEC-014
            The one-to-one relationship is enforced by the UNIQUE                                  
            participant FK and application role validation.                                        
  ----------------------------------------------------------------------------------------------------------------

# 8. Workflows & Sequence

## 8.1 Major Workflows

  -------------------------------------------------------------------------
  **ID**   **Workflow**                      **Primary Actor**
  -------- --------------------------------- ------------------------------
  WF-001   Participant Account Creation      Participant

  WF-002   Participant Authentication        Participant

  WF-003   System Administrator Bootstrap    Static-key holder

  WF-004   System Administrator              System Administrator
           Authentication                    

  WF-005   Administrative User Creation      System Administrator

  WF-006   Staff Authentication              Training Administrator /
                                             Trainer

  WF-007   Browse Program                    Participant

  WF-008   View Program Details              Participant

  WF-009   Register for Program              Participant

  WF-010   Cancel Registration               Participant

  WF-011   Manage Programs                   Training Administrator

  WF-012   Manage Registrations --- View     Training Administrator

  WF-013   Record Attendance                 Trainer

  WF-014   Issue Certificate                 Training Administrator

  WF-015   Generate Reports                  Training Administrator
  -------------------------------------------------------------------------

## 8.2 Sequence Diagram --- Participant Registration

> Participant → Web UI: Select program\
> Web UI → Registration API: Request registration\
> Registration API → Authorization: Validate authenticated participant\
> Authorization → Registration API: Authorized\
> Registration API → Registration Validator: Validate registration\
> Validator → MySQL: Lock program / validate active-registration
> uniqueness / overlap / window / capacity\
> Validator → MySQL: Create Registration = Registered\
> Validator → MySQL: Create mandatory Audit + Notification Outbox\
> MySQL → Registration API: Commit or rollback atomically\
> Outbox Worker → Email Service: Send confirmation after commit\
> Registration API → Web UI: Registration result\
> Web UI → Participant: Display result

*Figure 8-1 --- Participant Registration Sequence*

## 8.3 Sequence Diagram --- Cancellation

> Participant → Web UI: Select cancellation\
> Web UI → Registration API: Cancel registration\
> Registration API → Authorization: Verify participant ownership\
> Authorization → MySQL: Retrieve registration\
> Registration API → MySQL: Update status to Cancelled and release
> active-registration key\
> Registration API → MySQL: Create mandatory Audit Record\
> MySQL → Registration API: Commit cancellation transaction\
> Registration API → Web UI: Cancellation result\
> Web UI → Participant: Display result

*Figure 8-2 --- Registration Cancellation Sequence*

## 8.4 Sequence Diagram --- Attendance and Certificate

> Trainer → Attendance UI: Open assigned program\
> Attendance UI → Attendance Module: Retrieve registered participants\
> Trainer → Attendance UI: Record attendance\
> Attendance Module → MySQL: Save attendance + mandatory audit
> transactionally\
> Training Administrator → Certificate UI: Evaluate eligibility\
> Certificate Module → MySQL: Retrieve attendance\
> Certificate Module → UI: Eligible when attendance = 100%\
> Training Administrator → Certificate UI: Record issuance\
> Certificate Module → MySQL: Save certificate + mandatory audit
> transactionally

*Figure 8-3 --- Attendance and Certificate Sequence*

## 8.5 Sequence Diagram --- System Administrator Bootstrap

> Static-Key Holder → Bootstrap UI: Enter static key and account data\
> Bootstrap UI → Bootstrap API: Submit request\
> Bootstrap API → Key Validation: Validate static key\
> Key Validation → Bootstrap API: Valid / invalid\
> Bootstrap API → MySQL: Validate and create account\
> Bootstrap API → Audit: Record creation\
> Bootstrap API → UI: Activation / verification outcome

*Figure 8-4 --- System Administrator Bootstrap Sequence*

# 9. UI Design

  ----------------------------------------------------------------------------------------------
  **ID**   **Screen /       **Actor**       **Purpose**                  **Main Actions**
           View**                                                        
  -------- ---------------- --------------- ---------------------------- -----------------------
  UI-001   Participant      Participant     Create account               Submit account
           Account Creation                                              

  UI-002   Participant      Participant     Authenticate                 Login
           Login                                                         

  UI-003   Program Listing  Participant     Browse programs              Filter category, select
                                                                         program

  UI-004   Program Details  Participant     Review program               Register

  UI-005   Registration     Participant     Review selected program and  Confirm Registration →
           Confirmation                     read-only participant        submit POST
                                            information before           /api/v1/registrations
                                            submission                   

  UI-006   My Registrations Participant     View registrations           View / cancel

  UI-007   System           Static-key      Create System Administrator  Enter key/account data
           Administrator    holder                                       
           Bootstrap                                                     

  UI-008   Administrative   Admin/Trainer   Authenticate                 Login
           Login                                                         

  UI-009   User Account     System          Create TA/Trainer            Select role, create
           Management       Administrator                                account

  UI-010   Program          Training        Maintain programs            Create/update
           Management       Administrator                                

  UI-011   Category         Training        Maintain categories          Create/update
           Management       Administrator                                

  UI-012   Registration     Training        Operational registration     View / filter / inspect
           Management       Administrator   management                   registration

  UI-013   Attendance       Trainer         Record attendance            Mark attendance
           Management                                                    

  UI-014   Certificate      Training        Manage eligibility/issuance  Evaluate/issue
           Management       Administrator                                

  UI-015   Reports          Training        Generate reports             Select
                            Administrator                                report/parameters
  ----------------------------------------------------------------------------------------------

## 9.1 UI-003 --- Program Listing

> +-----------------------------------------------------------+\
> \| TRAINING MANAGEMENT SYSTEM Login \|\
> +-----------------------------------------------------------+\
> \| Training Programs \|\
> \| \|\
> \| Category: \[ All Categories v \] \|\
> \| \|\
> \| +-------------------------------------------------------+ \|\
> \| \| Program Code \| Program Name \| Seats \| \|\
> \| \|-------------------------------------------------------\| \|\
> \| \| PRG-001 \| Node.js Fundamentals \| 15 / 20 \| \|\
> \| \| PRG-002 \| Java Programming \| 8 / 20 \| \|\
> \| +-------------------------------------------------------+ \|\
> \| \|\
> \| \[ View Details \] \|\
> +-----------------------------------------------------------+

## 9.2 UI-004 --- Program Details

> +-----------------------------------------------------------+\
> \| Program Details \|\
> +-----------------------------------------------------------+\
> \| Program Name: \[Program Name\] \|\
> \| Category: \[IT Programming Category\] \|\
> \| Description: \[Description\] \|\
> \| Learning Objectives: \[Objectives\] \|\
> \| Target Audience: \[Audience\] \|\
> \| Prerequisites: \[Optional\] \|\
> \| Trainer: \[Trainer\] \|\
> \| Date/Time: \[Date / Time\] \|\
> \| Venue: \[Optional Venue\] \|\
> \| Capacity: 20 \|\
> \| Available Seats: 15 \|\
> \| Registration: \[Opening\] - \[Closing\] \|\
> \| \|\
> \| \[ REGISTER \] \|\
> +-----------------------------------------------------------+

## 9.3 UI-005 --- Registration

> +-----------------------------------------------------------+\
> \| Confirm Registration \|\
> +-----------------------------------------------------------+\
> \| Participant Information (read-only from authenticated account) \|\
> \| NRIC/Passport No: \[masked / read-only\] \|\
> \| Name: \[read-only\] \|\
> \| Email Address: \[read-only\] \|\
> \| Mobile No: \[read-only\] \|\
> \| \|\
> \| Program \|\
> \| \[Program Name\] \|\
> \| \[Training Date / Time\] \|\
> \| \|\
> \| \[ Cancel \] \[ Confirm Registration \]\|\
> +-----------------------------------------------------------+

## 9.4 UI-006 --- My Registrations

> +-----------------------------------------------------------+\
> \| My Registrations \|\
> +-----------------------------------------------------------+\
> \| Reference \| Program \| Date/Time \| Status \| Action \|\
> \|-----------------------------------------------------------\|\
> \| REG-001 \| Node.js \| 10/11/26 \| Registered \| Cancel \|\
> \| REG-002 \| Java \| 15/11/26 \| Registered \| Cancel \|\
> +-----------------------------------------------------------+

## 9.5 UI-010 --- Program Management

> +-----------------------------------------------------------+\
> \| Training Administrator \> Program Management \|\
> +-----------------------------------------------------------+\
> \| \[ Create Program \] \|\
> \| \|\
> \| Code \| Name \| Category \| Date \| Capacity \| Status \|\
> \|-----------------------------------------------------------\|\
> \| ... \| ... \| ... \| ... \| 20 \| ... \|\
> \| \|\
> \| \[ Edit \] \|\
> +-----------------------------------------------------------+

## 9.6 UI-013 --- Attendance

> +-----------------------------------------------------------+\
> \| Trainer \> Attendance \|\
> +-----------------------------------------------------------+\
> \| Program: \[Selected Program\] \|\
> \| Date: \[Training Date\] \|\
> \| \|\
> \| Participant Attendance Status \|\
> \|-----------------------------------------------------------\|\
> \| Participant A \[ Present v \] \|\
> \| Participant B \[ Present v \] \|\
> \| Participant C \[ Absent v \] \|\
> \| \|\
> \| \[ Save Attendance \] \|\
> +-----------------------------------------------------------+

## 9.7 UI-014 --- Certificate

> +-----------------------------------------------------------+\
> \| Training Administrator \> Certificates \|\
> +-----------------------------------------------------------+\
> \| Program: \[Selected Program\] \|\
> \| \|\
> \| Participant Attendance Eligibility \|\
> \|-----------------------------------------------------------\|\
> \| Participant A 100% Eligible \|\
> \| Participant B 80% Not Eligible \|\
> \| \|\
> \| Participant A \|\
> \| \[ Record Certificate Issuance \] \|\
> +-----------------------------------------------------------+

## 9.8 UI-015 --- Reports

> +-----------------------------------------------------------+\
> \| Reports \|\
> +-----------------------------------------------------------+\
> \| Report Type: \[ Select Report v \] \|\
> \| \|\
> \| \[ Student Certificate Report \] \|\
> \| \[ Student Program Registration Report \] \|\
> \| \[ Student Account Creation Report \] \|\
> \| \|\
> \| Reporting Period: \[ From \] \[ To \] \|\
> \| \|\
> \| \[ Generate Report \] \|\
> +-----------------------------------------------------------+

# 10. Non-Functional Design

The following design decisions translate the approved NFRs into
implementation-level controls without changing their targets.

  -------------------------------------------------------------------------------
  **NFR     **Design Decision**
  ID**      
  --------- ---------------------------------------------------------------------
  NFR-001   Enforce authenticated access and server-side authorization for
            participant information; participants can access only their own
            registration information.

  NFR-002   Implement role-based authorization for Participant, Training
            Administrator, Trainer and System Administrator.

  NFR-003   Protect authentication credentials, the static administration key and
            sensitive information using Argon2id password hashing, secure
            database-backed sessions/cookies, CSRF controls, secret
            externalization and security-event controls.

  NFR-004   Handle participant personal information in accordance with applicable
            Malaysian privacy and organizational requirements. Technical baseline
            includes least privilege, NRIC/Passport masking, access
            classification and the confirmed indefinite participant/registration
            retention requirement; compliance confirmation remains a production
            release gate.

  NFR-005   Use transactional database operations, validation, integrity
            constraints and controlled updates to maintain consistent and
            accurate program, registration, attendance and certificate
            information.

  NFR-006   Design deployment and database/infrastructure controls to support at
            least 99% service availability on a 24/7 basis, excluding approved
            planned maintenance. Availability acceptance is a production/release
            quality gate and does not block code generation.

  NFR-007   Use indexed queries, bounded result sets, efficient DB access and
            asynchronous notification delivery. The 95% / 2-second target for
            normal requests under 100 concurrent logged-in users is retained as a
            recommended technical performance target pending final technical
            confirmation; registration is included, while report generation and
            external email delivery are excluded. Performance testing may be
            executed against this target, but formal acceptance of the target is
            not a code-generation blocker.

  NFR-008   Use consistent navigation, responsive Bootstrap layouts and
            straightforward program-to-registration navigation.

  NFR-009   Centralize validation responses and expose actionable validation
            messages to users.

  NFR-010   Maintain an audit history of significant administrative changes and
            registration actions.

  NFR-011   Size the application/database design against 2,000 Year-1 students
            and 100 concurrent logged-in users.

  NFR-012   Support organization-approved desktop and mobile web browsers using
            responsive Bootstrap UI.

  NFR-013   Keep business rules and validation behavior maintainable through
            centralized service/validation components with minimal unrelated
            impact.
  -------------------------------------------------------------------------------

# 11. Integrations

  -------------------------------------------------------------------------------------------------------------------------
  ID            Design Decision / Status  Related          Resolution / Implementation Baseline
                                          Requirement      
  ------------- ------------------------- ---------------- ----------------------------------------------------------------
  **DEC-001**   Privacy and personal-data NFR-004 /        Governance pending --- implement privacy-by-design, masked
                control baseline          GOV-001          NRIC/Passport display, least privilege and controlled
                                                           correction. Participant and registration data remains retained
                                                           indefinitely as required by BR-018, subject to applicable law
                                                           and organizational privacy/retention policy. Compliance/legal
                                                           sign-off remains a release gate.

  **DEC-002**   System Administrator      FR-035 / BR-021  Governance pending --- bootstrap only when no active System
                bootstrap/static-key      / NFR-003 /      Administrator exists; static key is deployment-secret managed,
                governance                GOV-002          never logged or stored in source; bootstrap is audited;
                                                           rotation/replacement/revocation is controlled by
                                                           deployment/security governance.

  **DEC-003**   Role segregation          NFR-002 /        Closed for current scope --- no approval workflow exists in the
                                          GOV-003          current release. Each account has one primary role.
                                                           Organizational approval-role segregation applies to document
                                                           governance, not an application business workflow.

  **DEC-004**   Certificate               FR-025 / FR-026  Business confirmation remains deferred for certificate
                format/content            / BR-017         document/PDF template, exact contents, business-facing numbering
                                                           format and signatory. Code generation covers eligibility and
                                                           issuance records. For the current implementation, an opaque
                                                           unique certificate reference (UUID/ULID-compatible value) is
                                                           generated at issuance and stored in certificate_number; it is
                                                           unique, immutable after issuance and satisfies the mandatory
                                                           certificate-number field without inventing a business serial
                                                           format.

  **DEC-005**   Performance target        NFR-007 /        Recommended technical target --- 95% of normal requests within 2
                                          DEC-008          seconds under 100 concurrent logged-in users; registration
                                                           included; report generation and external email delivery
                                                           excluded. Final technical confirmation of this target remains
                                                           pending; performance testing may use it as the test baseline,
                                                           but target acceptance does not block code generation.

  **DEC-006**   Credential storage        NFR-003 / DR-007 Closed technical baseline --- Argon2id password hashing with
                                                           unique salts; server-side database-backed sessions; secure
                                                           HttpOnly/SameSite cookies; CSRF protection; failed-login lockout
                                                           controls; secrets externalized; no plaintext or reversible
                                                           credential storage.

  **DEC-007**   Technology baseline       Architecture /   Closed technical baseline --- Node.js 24 LTS, Express.js 5.2.x,
                                          technology       Bootstrap 5.3.x, MySQL 8.4 LTS, server-rendered
                                          constraints      HTML/Bootstrap/browser JS, mysql2 pool.

  **DEC-008**   API/data contract         Architecture /   Closed technical baseline --- REST-style JSON under /api/v1;
                baseline                  implementation   every implemented endpoint has an explicit method/path,
                                          readiness        field-level request rules, field-level response shape, HTTP
                                                           statuses, authentication, authorization and shared
                                                           error/pagination/time/CSRF rules; report periodFrom/periodTo are
                                                           mandatory; correlation IDs are returned on every response.

  **DEC-009**   Testing baseline          NFR-013 / UAT    Closed technical baseline --- unit, API, repository/transaction,
                                          coverage         MySQL integration, RBAC/security, concurrency, migration and
                                                           performance tests against the approved traceability matrix.

  DEC-010       Training Administrator    FR-022           Business clarification remains deferred --- the Requirements
                registration-management                    Analysis permits Training Administrator registration-management
                action set                                 actions but does not enumerate specific mutations. For code
                                                           generation, OP-016 is limited to viewing registrations; no
                                                           undocumented mutation is invented. No mutation endpoint is
                                                           exposed. Any future permitted mutation requires controlled
                                                           requirements/design change. This does not block code generation
                                                           of the confirmed current-release scope.

  DEC-011       Registration              BR-007 / BR-010  Controlled current-release design decision --- a CANCELLED
                re-registration after     / BR-018 /       historical registration does not block a later registration for
                cancellation              NFR-005          the same program. The active-registration uniqueness key
                                                           therefore applies only to REGISTERED rows. Historical
                                                           cancellation records remain retained. This resolves the
                                                           ambiguity between the duplicate-registration rule and
                                                           cancellation behavior without changing the retained registration
                                                           history. Business confirmation may change this through
                                                           controlled requirements/design change before production, but it
                                                           does not block code generation.

  DEC-012       Attendance percentage     BR-015 / BR-016  Closed technical baseline --- each program has one scheduled
                calculation               / BR-017 /       occurrence. Attendance percentage is derived server-side as
                                          NFR-005          100.00 for PRESENT and 0.00 for ABSENT. Client-supplied
                                                           percentage is not authoritative. This directly supports the
                                                           confirmed 100% attendance certificate eligibility rule and
                                                           avoids introducing an unsupported multi-session calculation
                                                           model.

  DEC-013       Unified authenticated     FR-001 / FR-002  Closed technical baseline --- all authenticated principals use
                account identity          / FR-028 /       the users table as the authentication/session/audit identity.
                                          NFR-003 / DR-007 Participant account creation creates a users record with
                                          / DR-008         canonical role code PARTICIPANT and a participant profile linked
                                                           by participants.user_id in one transaction. Participant
                                                           credentials, account status and last-login information are
                                                           maintained in users; participant-facing profile data remains in
                                                           participants. sessions.user_id and audit_records.actor_user_id
                                                           therefore support Participant, Trainer, Training Administrator
                                                           and System Administrator consistently. The participant-account
                                                           defaults and one-to-one relationship are finalized in DEC-014,
                                                           while system-originated audit attribution is finalized in
                                                           DEC-015. No separate participant credential store is used.

  DEC-014       Participant account       FR-001 / DR-007  Closed technical baseline --- participant self-registration uses
                identifier, username and  / NFR-002 /      defined server-side generation rules:
                role defaults             NFR-003          account_identifier=P-\<ULID\> and username=participant-\<ULID\>;
                                                           both values are unique, opaque and immutable and are not
                                                           deterministic values derived from participant input. role_id and
                                                           role_name use only the canonical code PARTICIPANT;
                                                           account_status is initialized to ACTIVE; role_assigned_at equals
                                                           created_at; permissions, access_scope and
                                                           permitted_responsibilities are derived from the PARTICIPANT
                                                           role. Role display labels are UI-only and are not persisted as
                                                           alternate role codes. The users row, linked participants row and
                                                           account-creation audit event are created in one transaction:
                                                           validate uniqueness, generate
                                                           user_id/account_identifier/username, resolve role defaults,
                                                           create users, create participants, create audit event, then
                                                           commit; any failure rolls back the complete transaction. For
                                                           System Administrator, Training Administrator and Trainer
                                                           accounts, account_identifier=A-\<ULID\> is server-generated,
                                                           unique, opaque and immutable; usernames for these roles remain
                                                           administrator-supplied and unique. Authentication API responses
                                                           expose the canonical role in the role field; role_name remains
                                                           the canonical persisted database field.

  DEC-015       Reserved technical audit  DR-008 / NFR-010 Closed technical baseline --- system-originated audit events use
                actor                     / NFR-003        a reserved users record with canonical role code
                                                           SYSTEM_ADMINISTRATOR, account_status=DISABLED,
                                                           authentication_method=SYSTEM and non-interactive access. The
                                                           technical audit actor cannot authenticate, is excluded from
                                                           normal user-management APIs, is not an active System
                                                           Administrator, and is provisioned by the initial migration with
                                                           generated opaque user/account identifiers and a generated
                                                           unusable password_hash value. No known/default password is
                                                           stored, no usable interactive credential is issued, and
                                                           authentication middleware rejects the account because it is
                                                           DISABLED and SYSTEM. The actor exists only to satisfy the
                                                           mandatory audit_records.actor_user_id FK for system-originated
                                                           events.

  DEC-016       Student Account Creation  DR-009 / FR-027  Closed technical baseline --- Created By is a business-facing
                Report Created By         / NFR-010        report presentation value derived from the successful
                derivation                                 account-creation audit event and is not stored as a duplicate
                                                           participant-profile field. For participant self-registration,
                                                           Created By is the fixed value SELF-REGISTRATION; the
                                                           corresponding audit actor is the reserved technical audit actor.
                                                           SELF-REGISTRATION is never written to
                                                           audit_records.actor_user_id. For administrator-created Training
                                                           Administrator/Trainer accounts, Created By is the authenticated
                                                           creator account_identifier derived from
                                                           audit_records.actor_user_id. The audit actor identity and the
                                                           report presentation value therefore remain distinct and
                                                           type-safe.
  -------------------------------------------------------------------------------------------------------------------------

# 12. Requirement Traceability

## 12.1 Functional Requirement Traceability

  ----------------------------------------------------------------------------------------------------------------------------------------------------
  **Requirement ID** **Design Element**                                         **Entity**     **Operation/API**                   **Validation**
  ------------------ ---------------------------------------------------------- -------------- ----------------------------------- -------------------
  FR-001             Participant Account Module                                 Participant    OP-001                              VE-014, VE-015

  FR-002             Authentication Module                                      Participant /  OP-002                              VE-016
                                                                                User Role                                          

  FR-003             Program Catalogue                                          Training       OP-007                              VE-012
                                                                                Program                                            

  FR-004             Category Filtering                                         Program        OP-007                              ---
                                                                                Category                                           

  FR-005             Program Details                                            Training       OP-008                              VE-006
                                                                                Program                                            

  FR-006             Availability Display                                       Training       OP-008                              VE-003, VE-006
                                                                                Program                                            

  FR-007             Registration Module                                        Registration   OP-009                              VE-008

  FR-008             Participant Data                                           Participant    OP-001 / OP-009                     VE-001, VE-002

  FR-009             Registration Validation                                    Registration   OP-009                              VE-001, VE-002

  FR-010             Duplicate Validation                                       Registration   OP-009                              VE-004

  FR-011             Capacity Validation                                        Program /      OP-009                              VE-003
                                                                                Registration                                       

  FR-012             Schedule Validation                                        Registration / OP-009                              VE-005
                                                                                Program                                            

  FR-013             Registration Creation                                      Registration   OP-009                              VE-011

  FR-014             Notification                                               Registration / OP-009                              ---
                                                                                Email                                              

  FR-015             My Registrations                                           Registration   OP-010                              Authorization

  FR-016             Cancellation                                               Registration   OP-011                              VAL-022 / VE-007

  FR-017             Registration Immutability                                  Registration   OP-011                              VE-007

  FR-018             Program Management                                         Training       OP-012                              Program validation
                                                                                Program                                            

  FR-019             Program Update                                             Training       OP-013                              Program validation
                                                                                Program                                            

  FR-020             Category Management                                        Program        OP-014                              Category validation
                                                                                Category                                           

  FR-021             Program Capacity Management                                Training       OP-015 / PUT                        Capacity validation
                                                                                Program        /api/v1/admin/programs/:programId   / VAL-033

  FR-022             Registration Administration                                Registration   OP-016 / admin registration view    VE-009, VAL-032

  FR-023             Attendance                                                 Attendance     OP-017                              Registration/role
                                                                                                                                   validation

  FR-024             Attendance Maintenance                                     Attendance     OP-017                              Registration
                                                                                                                                   validation

  FR-025             Certificate Issuance                                       Certificate    OP-018                              VE-013

  FR-026             Certificate Maintenance                                    Certificate    OP-018                              VE-013

  FR-027             Reporting                                                  Report /       OP-019--OP-021                      Authorization
                                                                                Reporting Data                                     

  FR-028             RBAC                                                       User Role /    Authorization layer                 VE-009
                                                                                Access                                             

  FR-029             Admin User Creation                                        User Role /    OP-005                              Account validation
                                                                                Access                                             

  FR-030             Program Availability                                       Training       OP-009                              VE-006
                                                                                Program                                            

  FR-031             Registration Error Handling                                Registration   OP-009                              VE-001--VE-011

  FR-032             No Programs Message                                        Program        OP-007                              VE-012
                                                                                Catalogue                                          

  FR-033             TA/Trainer Login                                           User Role /    OP-006                              VE-017
                                                                                Access                                             

  FR-034             System Administrator Login                                 User Role /    OP-004                              VE-017
                                                                                Access                                             

  FR-035             Static Key Bootstrap                                       User Role /    OP-003                              VE-018, VE-019
                                                                                Access                                             

  **Physical MySQL   Approved --- implementation baseline                                                                          
  schema**                                                                                                                         

  **Complete API     Approved --- implementation baseline                                                                          
  contracts**                                                                                                                      

  **Authentication / Approved --- implementation baseline                                                                          
  security**                                                                                                                       

  **Permission       Approved --- implementation baseline                                                                          
  matrix**                                                                                                                         

  **Testing          Approved --- implementation baseline                                                                          
  baseline**                                                                                                                       

  **Design gaps**    Dispositioned --- technical design items required for the                                                     
                     confirmed code-generation scope are closed. DG-001 to                                                         
                     DG-005 remain explicit production/release governance or                                                       
                     deferred-feature gates, DG-006 is closed technical design,                                                    
                     DG-007 is a scoped business clarification, and DEC-011                                                        
                     through DEC-016 explicitly close the current-release                                                          
                     re-registration, attendance calculation, unified                                                              
                     authenticated account identity, participant account                                                           
                     defaults/role codes, technical audit actor and report                                                         
                     Created By behavior. None of these items blocks code                                                          
                     generation. Compliance/privacy approval remains a                                                             
                     production-release gate only and does not block code                                                          
                     generation.                                                                                                   
  ----------------------------------------------------------------------------------------------------------------------------------------------------

## 12.2 NFR Traceability

  ------------------------------------------------------------------------------
  **Requirement    **Design Element**                       **Primary Control**
  ID**                                                      
  ---------------- ---------------------------------------- --------------------
  NFR-001          Authorization / Participant access       Resource ownership
                                                            and access control

  NFR-002          RBAC                                     Role/access
                                                            component

  NFR-003          Authentication / Secret Protection       Credential hashing,
                                                            session security,
                                                            static-key
                                                            protection and
                                                            secret controls

  NFR-004          Privacy                                  Privacy-by-design,
                                                            NRIC/Passport
                                                            masking, access
                                                            classification and
                                                            retention

  NFR-005          Database / Transactions                  Integrity
                                                            constraints and
                                                            transactions

  NFR-006          Design deployment so availability is not Availability
                   dependent on a single application        controls
                   process; database and infrastructure     
                   availability controls shall support the  
                   99% target.                              

  NFR-007          API / DB design                          Performance
                                                            optimization

  NFR-008          UI architecture                          Responsive
                                                            navigation

  NFR-009          Validation layer                         Consistent error
                                                            responses

  NFR-010          Audit Module                             Audit records

  NFR-011          Capacity architecture                    2,000 students / 100
                                                            concurrent baseline

  NFR-012          Bootstrap UI                             Responsive browser
                                                            support

  NFR-013          Business/service layer                   Centralized rules
                                                            and validation

  **Physical       Developed --- baseline version           
  Database                                                  
  Schema**                                                  

  **Permission     Developed --- approved                   
  Matrix**                                                  

  **Security /     Developed --- approved                   
  Authentication                                            
  Baseline**                                                

  **Code           Developed --- approved                   
  Generation                                                
  Baseline**                                                
  ------------------------------------------------------------------------------

# 13. Design Gaps and Governance Dispositions

  ----------------------------------------------------------------------------------------------------------
  ID       Design / Governance Item  Related       Disposition / Impact
                                     Requirement   
  -------- ------------------------- ------------- ---------------------------------------------------------
  DG-001   Malaysian                 NFR-004 /     Production release gate only. Technical privacy controls,
           privacy/compliance        GOV-001       masking, access control and retention baseline are
           confirmation                            defined. Compliance/Privacy confirmation is not required
                                                   to start code generation and shall be completed before
                                                   production release; it does not block code generation.

  DG-002   System Administrator      FR-035 /      Production operational governance gate. Deployment-secret
           static-key governance     BR-021 /      storage, non-source-controlled handling, bootstrap audit
                                     NFR-003 /     and one-active-admin rule are defined for code
                                     GOV-002       generation. Operational ownership/rotation/revocation
                                                   confirmation is required before production release, not
                                                   before code generation.

  DG-003   Approval-role segregation Governance /  Governance/document-approval item, not an application
                                     GOV-003       workflow. The current release has no approval feature.
                                                   Formal document sign-off may require independent
                                                   approvers, but this does not block code generation.

  DG-004   Certificate document      DEC-004       Deferred feature decision. 100% attendance eligibility
           format/content                          and issuance-record implementation are closed for code
                                                   generation. Certificate document/PDF template and exact
                                                   document contents are excluded until business
                                                   confirmation; this does not block the current
                                                   implementation baseline.

  DG-005   95% / 2-second            NFR-007 /     Recommended technical target pending final technical
           performance target        DEC-008       confirmation. Performance tests should verify 95% of
                                                   normal requests within 2 seconds under 100 concurrent
                                                   logged-in users; report generation and external email
                                                   delivery are excluded. Formal acceptance of this target
                                                   is a production/release governance item and does not
                                                   block code generation.

  DG-006   Credential representation NFR-003 /     Closed technical design. Argon2id, unique salts,
                                     DR-007        server-side sessions, secure cookies, CSRF controls and
                                                   secret externalization are defined; no
                                                   plaintext/reversible credentials.

  DG-007   Training Administrator    FR-022        Deferred business clarification. The Requirements
           registration-management                 Analysis does not enumerate the permitted
           action set                              registration-management mutations. OP-016 code-generation
                                                   scope is limited to viewing registrations; no unsupported
                                                   mutation endpoint is implemented. Any future permitted
                                                   mutation requires controlled requirements/design change.
                                                   This is a scoped business clarification and does not
                                                   block code generation of the confirmed current-release
                                                   scope.
  ----------------------------------------------------------------------------------------------------------

## 13.1 Design Gap and Governance Handling

Design gaps shall not be silently resolved by implementation. Items that
affect production compliance, operational governance or deferred
document output are explicitly controlled as release gates and do not
block code generation for the approved current-release implementation
scope. Any business rule or interface required by the code-generation
scope is closed in this SDD through a controlled design decision. Later
governance decisions shall be incorporated through controlled document
change and traceability update.

## 13.2 Final Implementation Decisions

Authentication: server-side database-backed sessions; secure, HttpOnly,
SameSite=Lax cookies; 30-minute idle timeout; 8-hour absolute timeout;
logout invalidates the session; disabled/locked accounts cannot
authenticate.

Password security: Argon2id hashing with unique salts; minimum 12
characters; password must contain at least one uppercase, one lowercase,
one digit and one non-alphanumeric character; five failed attempts
within 15 minutes trigger a 15-minute lockout; credentials are never
logged.

Account model: Participant, Training Administrator, Trainer and System
Administrator are the four application roles represented by users, using
canonical role codes PARTICIPANT, TRAINING_ADMINISTRATOR, TRAINER and
SYSTEM_ADMINISTRATOR. Each account has one primary role. Participant
account creation creates the users record with defined server-side
account_identifier and username generation rules, role PARTICIPANT,
ACTIVE status and role-derived permissions/access
scope/responsibilities, plus exactly one linked participants profile in
one atomic transaction; participant users must have exactly one
participant profile and non-PARTICIPANT users must have none; sessions
and audit records reference users.user_id for every authenticated
principal. Account statuses are ACTIVE, INACTIVE, LOCKED and DISABLED.
Only ACTIVE accounts may authenticate. A non-PARTICIPANT account must
not have a participant profile. Canonical role-code rule: role_id,
role_name and API role values use only PARTICIPANT, TRAINER,
TRAINING_ADMINISTRATOR or SYSTEM_ADMINISTRATOR; human-readable role
labels are UI-only.

Registration: status values are REGISTERED and CANCELLED. Participant
cancellation is permitted before the scheduled start time, releases the
active-registration key, retains the historical registration row and
permits later re-registration subject to normal validation. Registration
data cannot be edited after submission. The database enforces one active
REGISTERED record per participant/program through a generated
active-registration key. OP-016 provides Training Administrator
registration viewing only in the confirmed code-generation scope; no
undocumented administrative cancellation or other mutation is
introduced.

Program lifecycle: DRAFT → OPEN → CLOSED → COMPLETED; CANCELLED may be
entered from DRAFT, OPEN or CLOSED. OPEN is required for participant
registration. Status transition matrix: DRAFT→OPEN/CANCELLED;
OPEN→CLOSED/CANCELLED; CLOSED→COMPLETED/CANCELLED; COMPLETED and
CANCELLED are terminal. Capacity reaching the configured limit does not
create a waiting list; the program remains visible with availability
shown as full.

Program change control: reducing capacity below current registered
participants is rejected; changes to date/time re-run overlap and
registration-window validation; cancellation retains registrations and
prevents new registration. Participant notification for program changes
is outside the current release unless explicitly added through
requirements change control.

Attendance: one attendance record per registration; status values
PRESENT or ABSENT; percentage is automatically 100 for PRESENT and 0 for
ABSENT. Only Trainer may record attendance for registered participants.
Participant ID and Program ID stored with attendance must match the
referenced registration. Attendance changes are audited transactionally.

Certificate: eligibility is exactly 100% attendance. One certificate may
be issued per registration. Certificate Type, Certificate Title,
eligibility information, attendance/completion percentage, completion
date and issuance information are maintained as required by DR-006.
Certificate Number/Reference is mandatory once issued; its numbering
format/sequence remains deferred. Certificate document/PDF generation,
template, exact contents and signatory details remain deferred and are
not implemented.

Reports: three required reports are available only to the Training
Administrator: Student Certificate Report, Student Program Registration
Report and Student Account Creation Report. The code-generation contract
defines role-authorized filtering, pagination and HTML/web presentation;
CSV export is included as an implementation convenience within the same
three confirmed reports and does not create an additional business
report requirement or expand report scope. Standard report columns are
fixed in the report specifications: Certificate Report --- Certificate
Number, Student Name/ID, Program Code/Name, Category, Program Date,
Attendance %, Certificate Status, Issue Date and Issued By; Registration
Report --- Registration ID, Student ID/Name, Program Code/Name,
Category, Program Date, Registration Date, Registration Status,
Cancellation Date and Cancellation Reason; Account Creation Report ---
Student ID, Name, Email, Mobile, Account Status, Created Date, Created
By and Last Login. Created By is a business-facing report presentation
value derived from the successful account-creation audit event under
DEC-016: SELF-REGISTRATION for participant self-registration, or the
authenticated creator account identifier for administrator-created
accounts. SELF-REGISTRATION is never stored as
audit_records.actor_user_id; the underlying participant
self-registration audit event uses the reserved technical audit actor.
Full NRIC/Passport is excluded from standard reports and masked values
are used where operationally required. Report execution and download are
auditable.

API error contract: { code, message, details, timestamp, correlationId
}. Validation failures return 400, authentication failures 401,
authorization failures 403, not found 404, conflicts 409, unexpected
server failures 500. Error messages do not expose secrets or unnecessary
personal data.

Pagination: list endpoints default to 20 records, maximum 100. Supported
list operations provide deterministic sorting with an explicit
allow-list and server-side filtering. Program listing supports category
and availability filters; registration lists support
date/program/category/student/status; report lists support approved
report-specific filters. No unbounded list endpoint is exposed.

Time handling: all persisted timestamps are stored in UTC using DATETIME
values representing UTC. Program schedule DATE/TIME fields are
interpreted in the configured business timezone (Asia/Kuala_Lumpur for
the current Malaysia deployment); registration-window DATETIME values
are stored as UTC instants after conversion from business-local input.
The timezone is externalized configuration and UI displays
business-local time.

Delete policy: application APIs do not hard-delete participant,
registration, attendance, certificate or audit records. Participant and
registration data shall be retained indefinitely as required by BR-018,
subject to applicable Malaysian law and organizational privacy/retention
policy. Compliance/privacy approval is a production release gate and
does not block code generation. Archival/disposal, if later required by
approved policy, must be handled through controlled
requirements/document change so it does not silently alter the current
business retention requirement.

Email: SMTP over TLS, 10-second timeout, up to three retries with
exponential backoff. The registration transaction creates the
notification outbox record before commit. The worker processes only
committed outbox records. Failed email delivery is recorded and must not
falsely report registration failure.

Configuration/secrets: all environment-specific values are externalized.
Database credentials, SMTP credentials, session secrets and static
administration key are stored in the environment/deployment secret store
and never committed to source control.

Code structure: src/config, middleware, routes, controllers, services,
validators, repositories, models, auth, views, public assets, jobs,
utils and tests. Controllers are thin; services own business rules;
repositories own persistence; validators are reusable and server-side.

Testing: Jest for unit/API tests, Supertest for HTTP integration tests,
MySQL integration tests using an isolated test database, security/RBAC
test suites, concurrency tests for active-registration uniqueness and
final-seat capacity, migration tests, CSRF tests, OP-016
registration-view authorization tests, outbox retry/failure tests and
performance tests at the approved 100-concurrent-user baseline.

  -----------------------------------------------------------------------------------------
  **Baseline       **Approved Choice**                             **Code Generation Rule**
  Area**                                                           
  ---------------- ----------------------------------------------- ------------------------
  Runtime          Node.js 24 LTS                                  Approved implementation
                                                                   runtime

  Web framework    Express.js 5.2.x                                Approved HTTP/API
                                                                   framework

  UI framework     Bootstrap 5.3.x                                 Approved responsive UI
                                                                   framework

  Database         MySQL 8.4 LTS                                   Approved relational
                                                                   database

  DB access        mysql2 connection pool                          Direct parameterized
                                                                   SQL/data-access baseline

  Views            Express server-rendered HTML templates +        No separate frontend
                   Bootstrap + browser JavaScript/fetch            application in current
                                                                   release

  Authentication   Server-side sessions + secure cookies for all   Database-backed
                   four application roles; canonical role codes    sessions;
                   are PARTICIPANT, TRAINER,                       sessions.user_id
                   TRAINING_ADMINISTRATOR and                      references users.user_id
                   SYSTEM_ADMINISTRATOR; all authenticate through  for every authenticated
                   users.user_id                                   principal

  Password hashing Argon2id                                        No plaintext/reversible
                                                                   password storage

  API format       REST-style JSON under /api/v1                   Standard
                                                                   request/response/error
                                                                   contract

  Testing          Jest + Supertest + MySQL integration            Unit, API, integration,
                   environment                                     security, RBAC,
                                                                   concurrency, migration,
                                                                   CSRF,
                                                                   notification-outbox and
                                                                   performance tests

  Database         Versioned SQL migrations applied sequentially;  Approved implementation
  migrations       reviewed and tested in DEV/SIT/UAT before PROD. governance
                   No ad-hoc production schema changes.            

  Certificate      Eligibility and issuance record is in approved  Approved issuance-record
  document output  code-generation scope. PDF/document generation  baseline; deferred
                   and business-facing certificate numbering       document-format feature;
                   format/content are deferred pending business    defined server-side
                   confirmation. The technical certificate_number  unique opaque
                   is nevertheless generated at issuance as a      certificate-reference
                   unique opaque UUID/ULID-compatible reference    generation remains
                   and stored immutably; no business serial-number implemented
                   algorithm is invented.                          

  Notification     Transactional outbox written with the business  Approved integration
  processing       transaction; background worker sends SMTP/TLS   pattern
                   messages, retries up to three times with        
                   backoff and records permanent failure.          

  CSRF             Server-generated CSRF token for state-changing  Approved browser
                   cookie-authenticated requests; failed           security control
                   validation returns 403 and is audited.          
  -----------------------------------------------------------------------------------------

# 14. Design Readiness

## 14.1 Requirements Covered

  --------------------------------------------------------------------------------------
  **Area**           **Status**
  ------------------ -------------------------------------------------------------------
  Business           Covered
  objectives         

  Scope              Covered

  Actors             Covered

  Business processes Covered

  Functional         Covered
  requirements       
  FR-001--FR-035     

  NFR-001--NFR-013   Design mapped

  Business rules     Covered
  BR-001--BR-021     

  Validation         Covered
  VE-001--VE-019     

  Data requirements  Covered
  DR-001--DR-009     

  Email integration  Covered

  Payment            Correctly excluded
  integration        

  HR integration     Correctly excluded

  Program categories Covered

  Registration       Covered

  Capacity           Covered --- capacity configuration is implemented through the
                     program update contract with transactional validation and
                     available-seat re-derivation.

  Cancellation       Covered

  Attendance         Covered

  Certificate        Covered
  eligibility        

  Certificate        Covered
  issuance           

  Reporting          Covered

  RBAC               Covered

  Auditability       Covered

  Physical data      Completed --- every mandatory business data field is mapped to a
  mapping            physical/derived field; active-registration uniqueness, certificate
  DR-001--DR-009     issuance requirements, audit mandatory fields and report-period
                     constraints are defined; participant account identifiers/role
                     defaults, one-to-one participant linkage and technical audit actor
                     mapping are explicitly defined.

  Complete API       Completed --- every implemented endpoint defines method/path,
  request/response   explicit Auth / Purpose, field-level Request Contract, field-level
  contracts          Response / HTTP Contract, HTTP statuses, authentication,
                     authorization and shared error/pagination/time/CSRF rules. Report
                     periodFrom/periodTo are mandatory; participant identity is
                     server-derived for participant registration resources; certificate
                     issuance has a defined server-side unique opaque
                     certificate-reference generation rule; participant POST
                     registration has an explicit programId request contract;
                     participant authentication/session/audit identity is unified
                     through users.user_id; participant account defaults and canonical
                     role codes are finalized in DEC-014 and the technical audit actor
                     in DEC-015.

  Endpoint-level     Completed --- endpoint/resource ownership matrix aligned with API
  authorization      contracts. Training Administrator has access to the three approved
                     reports and may view operational registration data within OP-016;
                     no undocumented registration mutation is exposed.

  CSRF protection    Completed --- server-issued CSRF token rendered into authenticated
                     HTML and supplied via X-CSRF-Token for state-changing requests

  Notification       Completed --- committed registration creates outbox record
  outbox             transactionally; worker handles asynchronous delivery/retry/failure

  Audit schema       Completed --- previous/new values, access scope, classification,
                     correlation and transaction behavior included

  Report execution   Completed --- report execution data model and authorization/audit
  metadata           rules defined

  Migration strategy Completed --- versioned migrations with DEV/SIT/UAT/PROD promotion
                     controls defined

  Environment        Completed --- DEV/SIT/UAT/PROD baseline defined
  configuration      

  Formal SDD         Defined --- approval matrix recorded in Section 14.5
  sign-off           

  Design gaps        Dispositioned --- technical design items required for the confirmed
                     code-generation scope are closed. DG-001 to DG-005 remain explicit
                     production/release governance or deferred-feature gates, DG-006 is
                     closed technical design, DG-007 is a scoped business clarification,
                     and DEC-011 through DEC-016 explicitly close the current-release
                     re-registration, attendance calculation, unified authenticated
                     account identity, participant account defaults/role codes,
                     technical audit actor and report Created By behavior. None of these
                     items blocks code generation. Compliance/privacy approval remains a
                     production-release gate only and does not block code generation.
  --------------------------------------------------------------------------------------

## 14.2 Design Artifacts

  -----------------------------------------------------------------------
  **Artifact**        **Status**
  ------------------- ---------------------------------------------------
  Architectural       Developed --- baseline version
  Diagram             

  ERD                 Developed --- baseline version

  DFD                 Developed --- Level 0 and registration flow

  Sequence Diagrams   Developed --- major workflows

  UI Wireframes       Developed --- baseline wireframes

  API Operation       Developed --- logical API design
  Catalogue           

  Validation Matrix   Developed

  NFR Design Matrix   Developed

  Requirement         Developed
  Traceability        

  Business Owner      Pending formal concurrence --- organizational
  Approval            baseline/release governance; does not block
                      technical code-generation readiness

  Solution Architect  Ready for approval
  / Technical Lead    
  Approval            

  QA / Test Lead      Ready for approval
  Approval            

  Security Review     Pending governance review --- does not block
                      technical code-generation readiness; required
                      before production release

  Compliance /        Pending --- production release gate only; does not
  Privacy Review      block technical code-generation readiness

  Operations /        Ready for approval
  Delivery Review     
  -----------------------------------------------------------------------

## 14.3 Unresolved Design Gaps

-   No implementation design blocker remains for the confirmed
    current-release code-generation scope. DG-001, DG-002, DG-003,
    DG-004 and DG-005 are explicitly classified as production/release
    governance or deferred-feature gates and do not block code
    generation. DG-006 is technically closed. DG-007 is a scoped
    business clarification for unspecified Training Administrator
    registration-management mutations and does not block code generation
    because no undocumented mutation is implemented.

## 14.4 Untraceable Design Elements

No unresolved technical design element remains within the confirmed
current-release code-generation scope. DG-001, DG-002, DG-003, DG-004
and DG-005 remain explicitly classified as production/release governance
or deferred-feature gates and do not block code generation. DG-006 is
technically closed. DG-007 remains a scoped business clarification for
unspecified Training Administrator registration-management mutations.
Re-registration behavior, attendance calculation, unified authenticated
account identity, participant account generation/defaults/canonical role
codes, technical audit attribution, report Created By derivation and
account-creation transaction behavior and API contract column alignment,
including authentication/bootstrap request and response separation, are
explicitly dispositioned in DEC-011 through DEC-016; the technical
certificate reference generation mechanism remains explicitly
dispositioned in DEC-004. None of these decisions blocks code
generation. Compliance/privacy approval remains a production-release
gate only and does not block code generation. RBAC scope for
/api/v1/admin/users, BIGINT primary-key generation, non-participant
account identifiers, registration-confirmation UI sequencing,
authentication role response naming, public program-detail data
minimization and FR-016 cancellation traceability are explicitly closed
in this baseline.

## 14.5 SDD Review, Approval and Final Design Status

SYSTEM DESIGN: COMPLETE --- TECHNICAL CODE-GENERATION BASELINE FOR
CONFIRMED CURRENT-RELEASE SCOPE

The design covers the confirmed business scope, 35 functional
requirements, 13 NFRs, 21 business rules, validation conditions,
DR-001--DR-009, email integration, field-level API contracts, endpoint
authorization, CSRF, notification outbox, audit controls, reporting
metadata, migration strategy, environment baseline and testing baseline.
Physical schema constraints, participant registration API input, unified
authentication/session/audit identity, re-registration behavior,
transaction handling, attendance derivation, certificate issuance and
technical certificate-reference generation are explicitly dispositioned
and internally consistent. The final remediation also explicitly defines
BIGINT primary-key generation, non-participant account identifiers,
authentication role response naming, public program-detail data
minimization, registration confirmation sequencing and user-management
RBAC.

Technical Code-Generation Readiness: READY --- CONFIRMED CURRENT-RELEASE
SCOPE

The design is the controlled System Design baseline for code generation
of the confirmed current-release scope. Technical code-generation
readiness is distinct from formal organizational sign-off: the
implementation baseline is sufficiently defined for code generation,
while business-owner concurrence and other governance reviews remain
tracked separately. Certificate document/PDF presentation,
business-facing certificate number format and signatory content remain
deferred until business confirmation; however, the current
implementation generates a unique opaque certificate reference for
issued certificates so the mandatory certificate-number field has a
defined server-side unique opaque generation rule. Unspecified Training
Administrator registration-management mutations remain excluded until
controlled requirements clarification. Privacy/compliance approval,
static-key governance, security review, performance-target acceptance
and other production governance gates remain required before production
release but do not block code generation of the confirmed
current-release scope.

## 14.6 Final Baseline Gate

> Requirements Baseline v2.4\
> │\
> ▼\
> ┌─────────────────────────────────┐\
> │ SSD v1.15 Code Generation Gate │\
> │ Physical DB + Field-Level APIs │\
> │ Security + RBAC + Workflows │\
> │ NFR + Testing + Traceability │\
> └─────────────────────────────────┘\
> │\
> ▼\
> ┌──────────────────────────────────────────┐\
> │ CODE GENERATION READY --- CONFIRMED SCOPE │\
> └──────────────────────────────────────────┘\
> │\
> ▼\
> ┌──────────────────────────────────────────┐\
> │ Production Release Gates │\
> │ Privacy / Static-Key Governance / SoD │\
> │ Compliance approval: release gate only │\
> │ Certificate Format / Numbering Approval │\
> │ Performance Acceptance │\
> └──────────────────────────────────────────┘
