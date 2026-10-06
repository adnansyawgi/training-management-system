# TRAINING MANAGEMENT SYSTEM

## Entity Relationship Diagram (ERD)

Mermaid Source & Rendered Diagrams

| Document Type | Software Design Supporting Artifact |
| --- | --- |
| Version | 1.0 |
| Technology Context | Node.js / Express.js / Bootstrap / MySQL |
| Purpose | Maintainable ERD source and visual reference |

# 1. Document Purpose

This document provides the Training Management System logical Entity Relationship Diagrams together with the Mermaid source used to define each diagram. The source is retained as a version-controllable design artifact, while the rendered image provides a review-friendly visual representation.

# 2. Diagram Conventions

Primary keys are marked PK and foreign keys are marked FK. Mermaid crow's-foot cardinality is used: '||' means exactly one, 'o|' means zero or one, and 'o{' means zero or many. The diagrams are separated by domain to keep the model readable while preserving the approved logical relationships.

# 3. Logical ERD — Overview

## Mermaid Script

```mermaid
erDiagram
    USER_ROLE_ACCESS ||--o| PARTICIPANT : "has profile"
    USER_ROLE_ACCESS ||--o{ TRAINING_PROGRAM : "assigned as trainer"
    PROGRAM_CATEGORY ||--o{ TRAINING_PROGRAM : "classifies"
    PARTICIPANT ||--o{ REGISTRATION : "registers"
    TRAINING_PROGRAM ||--o{ REGISTRATION : "receives registrations"
    REGISTRATION ||--o| ATTENDANCE : "has attendance"
    REGISTRATION ||--o| CERTIFICATE : "may produce certificate"
    REGISTRATION ||--o{ NOTIFICATION_OUTBOX : "creates notification"
    USER_ROLE_ACCESS ||--o{ AUDIT_RECORD : "performs"
    USER_ROLE_ACCESS ||--o{ REPORT_REPORTING_DATA : "generates"
```

## Generated Diagram

![Figure 4-1 — Logical ERD — Overview](Training_Management_System_Entity_Relationship_Diagram_v1.0_assets/erd_image_1.png)

Figure 4-1 — Logical ERD — Overview

# 4. Account & Program Management ERD

## Mermaid Script

```mermaid
erDiagram
    USER_ROLE_ACCESS ||--o| PARTICIPANT : "has profile"
    USER_ROLE_ACCESS ||--o{ TRAINING_PROGRAM : "assigned as trainer"
    PROGRAM_CATEGORY ||--o{ TRAINING_PROGRAM : "classifies"

    USER_ROLE_ACCESS {
        bigint user_id PK
        string account_identifier
        string username
        string name
        string email
        bigint role_id
        string role_name
        string account_status
        datetime last_login_at
        datetime created_at
        datetime updated_at
    }

    PARTICIPANT {
        bigint participant_id PK
        bigint user_id FK
        string nric_passport_no
        string name
        string mobile_no
        datetime created_at
        datetime updated_at
    }

    PROGRAM_CATEGORY {
        bigint category_id PK
        string name
        string description
        string status
        datetime created_at
        datetime updated_at
    }

    TRAINING_PROGRAM {
        bigint program_id PK
        string code
        string name
        bigint category_id FK
        bigint trainer_user_id FK
        date training_date
        time start_time
        time end_time
        string venue
        string delivery_mode
        int capacity
        datetime registration_open_at
        datetime registration_close_at
        string status
        string certificate_type
        datetime created_at
        datetime updated_at
    }
```

## Generated Diagram

![Figure 4-2 — Account & Program Management ERD](Training_Management_System_Entity_Relationship_Diagram_v1.0_assets/erd_image_2.png)

Figure 4-2 — Account & Program Management ERD

# 5. Registration Lifecycle ERD

## Mermaid Script

```mermaid
erDiagram
    PARTICIPANT ||--o{ REGISTRATION : "registers"
    TRAINING_PROGRAM ||--o{ REGISTRATION : "receives registrations"
    REGISTRATION ||--o| ATTENDANCE : "has attendance"
    PARTICIPANT ||--o{ ATTENDANCE : "attendance belongs to"
    TRAINING_PROGRAM ||--o{ ATTENDANCE : "attendance for"
    REGISTRATION ||--o| CERTIFICATE : "may produce"
    PARTICIPANT ||--o{ CERTIFICATE : "receives"
    TRAINING_PROGRAM ||--o{ CERTIFICATE : "certificate for"

    PARTICIPANT {
        bigint participant_id PK
        bigint user_id FK
        string nric_passport_no
        string name
        string mobile_no
    }

    TRAINING_PROGRAM {
        bigint program_id PK
        string code
        string name
        bigint category_id FK
        bigint trainer_user_id FK
        date training_date
        time start_time
        time end_time
        int capacity
        datetime registration_open_at
        datetime registration_close_at
        string status
    }

    REGISTRATION {
        bigint registration_id PK
        string reference_no
        bigint participant_id FK
        bigint program_id FK
        datetime registered_at
        string status
        datetime cancelled_at
        string cancellation_reason
        datetime created_at
        datetime updated_at
    }

    ATTENDANCE {
        bigint attendance_id PK
        bigint registration_id FK
        bigint participant_id FK
        bigint program_id FK
        date attendance_date
        string status
        decimal percentage
        bigint recorded_by FK
        datetime created_at
        datetime updated_at
    }

    CERTIFICATE {
        bigint certificate_id PK
        string certificate_number
        bigint participant_id FK
        bigint registration_id FK
        bigint program_id FK
        string certificate_type
        string eligibility_status
        decimal attendance_percentage
        date completion_date
        date issue_date
        string certificate_status
        bigint issued_by FK
        datetime created_at
        datetime updated_at
    }
```

## Generated Diagram

![Figure 4-3 — Registration Lifecycle ERD](Training_Management_System_Entity_Relationship_Diagram_v1.0_assets/erd_image_3.png)

Figure 4-3 — Registration Lifecycle ERD

# 6. Supporting & Governance ERD

## Mermaid Script

```mermaid
erDiagram
    REGISTRATION ||--o{ NOTIFICATION_OUTBOX : "creates"
    USER_ROLE_ACCESS ||--o{ AUDIT_RECORD : "performs"
    USER_ROLE_ACCESS ||--o{ REPORT_REPORTING_DATA : "generates"

    USER_ROLE_ACCESS {
        bigint user_id PK
        string account_identifier
        string username
        string name
        string email
        bigint role_id
        string role_name
        string account_status
    }

    REGISTRATION {
        bigint registration_id PK
        string reference_no
        bigint participant_id FK
        bigint program_id FK
        datetime registered_at
        string status
    }

    NOTIFICATION_OUTBOX {
        bigint outbox_id PK
        string event_type
        string aggregate_type
        bigint aggregate_id
        string recipient
        string subject
        string status
        int attempt_count
        datetime next_attempt
        string last_error
        datetime created_at
        datetime updated_at
    }

    AUDIT_RECORD {
        bigint audit_id PK
        datetime event_timestamp
        bigint actor_user_id FK
        string actor_role
        string action
        string entity_type
        bigint entity_id
        string result
        string change_summary
        string correlation_id
    }

    REPORT_REPORTING_DATA {
        bigint report_id PK
        string report_name
        string report_type
        string reporting_period
        datetime generated_at
        bigint generated_by FK
        string status
        string output_reference
        string data_access_classification
    }
```

## Generated Diagram

![Figure 4-4 — Supporting & Governance ERD](Training_Management_System_Entity_Relationship_Diagram_v1.0_assets/erd_image_4.png)

Figure 4-4 — Supporting & Governance ERD

# 7. Implementation Notes

The Mermaid definitions should be maintained alongside the application source code so that data-model changes can be reviewed through normal version control. When a database change is approved, update the Mermaid source, regenerate the corresponding diagram, and update the Software Design Document in the same change set.

The ERD is a logical design artifact. Physical MySQL implementation details such as exact column lengths, indexes, constraints, engine settings, migration scripts and environment-specific configuration should remain aligned with the approved database design and implementation specifications.
