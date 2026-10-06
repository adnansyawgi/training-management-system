TRAINING MANAGEMENT SYSTEM
# Architecture Diagram Specification
Complete Overview + Split Views + Mermaid Source

# 1. Purpose
This controlled design artifact provides the Training Management System logical architecture in a complete overview and four focused views. Each view contains maintainable Mermaid source followed by a clean rendered diagram for review and inclusion in Microsoft Word design documentation.
# 2. Diagram Set
Figure 3-0 provides the complete logical architecture. Figures 3-1 through 3-4 partition the same approved architecture into focused views to improve readability without changing the design. The original approved architecture artwork from Software Design Document v1.15 is also reproduced under Figures 3-1 through 3-4 for traceability.

# 3.0 Complete System Architecture Overview
Consolidated end-to-end logical architecture showing actors, presentation, application/security layers, business modules, persistence, and external notification integration.
## Mermaid Script

## Generated Diagram

Figure 3-0 - Complete System Architecture Overview

# 3.1 System Architecture Overview
High-level system context showing the four approved actors, the Training Management System, MySQL, and the external Email / Notification Service.
## Mermaid Script

## Generated Diagram

Figure 3-1 - System Architecture Overview
## Approved SDD Architecture Diagram

Figure 3-1 — System Architecture Overview (from Software Design Document v1.15)
This is the approved architecture artwork embedded in the Software Design Document v1.15. It is retained here alongside the Mermaid source and presentation-optimized diagram for direct design-baseline comparison.

# 3.2 Application Layer Architecture
Layered view of the Web UI, Express.js Web/API boundary, authentication and authorization, business modules, data access, and MySQL persistence.
## Mermaid Script

## Generated Diagram

Figure 3-2 - Application Layer Architecture
## Approved SDD Architecture Diagram

Figure 3-2 — Application Layer Architecture (from Software Design Document v1.15)
This is the approved architecture artwork embedded in the Software Design Document v1.15. It is retained here alongside the Mermaid source and presentation-optimized diagram for direct design-baseline comparison.

# 3.3 Functional Component Architecture
Functional view of the approved business modules and their relationship to security, data access, and the database.
## Mermaid Script

## Generated Diagram

Figure 3-3 - Functional Component Architecture
## Approved SDD Architecture Diagram

Figure 3-3 — Functional Component Architecture (from Software Design Document v1.15)
This is the approved architecture artwork embedded in the Software Design Document v1.15. It is retained here alongside the Mermaid source and presentation-optimized diagram for direct design-baseline comparison.

# 3.4 Registration and Notification Architecture
Focused registration flow showing validation, atomic registration/audit/outbox persistence, asynchronous notification processing, and external email delivery.
## Mermaid Script

## Generated Diagram

Figure 3-4 - Registration and Notification Architecture
## Approved SDD Architecture Diagram

Figure 3-4 — Registration and Notification Architecture (from Software Design Document v1.15)
This is the approved architecture artwork embedded in the Software Design Document v1.15. It is retained here alongside the Mermaid source and presentation-optimized diagram for direct design-baseline comparison.

# 4. Maintenance Guidance
Maintain the Mermaid definitions as the version-controlled textual architecture source. When an approved architecture change affects components, interfaces, data stores, security boundaries, or external integrations, update the Mermaid source and regenerate the corresponding diagram in the same controlled change set.

| Document Type | Software Design Supporting Artifact |
| --- | --- |
| Version | 1.2 |
| System | Training Management System |
| Technology Context | Node.js / Express.js / Bootstrap / MySQL 8.4 LTS |
| Presentation | Complete overview plus four focused architecture views |
| Source Baseline | Requirements Analysis v2.4 and Software Design Document v1.15 |

| flowchart LR
    subgraph ACTORS["Users / Actors"]
        P[Participant]
        TA[Training Administrator]
        T[Trainer]
        SA[System Administrator]
    end

    subgraph CLIENT["Client / Presentation Layer"]
        B["Web Browser"]
        UI["Web UI<br/>Server-Rendered HTML / Bootstrap / JavaScript"]
    end

    subgraph TMS["Training Management System"]
        API["Express.js 5 Web / API Layer"]
        SEC["Authentication & Authorization"]
        MOD["Business Modules<br/>Participant / Program / Catalogue / Registration<br/>Attendance / Certificate / Reporting / User Administration"]
        DAL["Data Access Layer"]
        API --> SEC --> MOD --> DAL
    end

    DB[("MySQL 8.4 LTS<br/>Application Data / Session Store / Audit / Notification Outbox")]
    EMAIL["Email / Notification Service<br/>(External System)"]

    P --> B
    TA --> B
    T --> B
    SA --> B
    B --> UI -->|HTTPS| API
    DAL -->|Read / Write| DB
    MOD -->|Notification request| DB
    DB -->|Pending outbox event| MOD
    MOD -->|Send notification| EMAIL |
| --- |

| flowchart LR
    subgraph ACTORS["Users / Actors"]
        P[Participant]
        TA[Training Administrator]
        T[Trainer]
        SA[System Administrator]
    end
    TMS["Training Management System<br/>(Web Application)<br/><br/>Web UI<br/>Express.js Application<br/>Data Access Layer"]
    DB[("MySQL 8.4 LTS<br/>(Database)")]
    EMAIL["Email / Notification Service<br/>(External System)"]
    P -->|HTTPS / Web Browser| TMS
    TA -->|HTTPS / Web Browser| TMS
    T -->|HTTPS / Web Browser| TMS
    SA -->|HTTPS / Web Browser| TMS
    TMS -->|Read / Write| DB
    TMS -->|Email Notifications| EMAIL |
| --- |

| flowchart TB
    UI["Web UI<br/>Server-Rendered HTML, Bootstrap, JavaScript"]
    WEB["Express.js 5 Web / API Layer<br/>HTTP Routing, Request Handling, Session Management"]
    SEC["Authentication & Authorization<br/>User Authentication, RBAC, Session Management"]
    subgraph APP["Application Layer (Business Modules)"]
        PM[Participant Management]
        PRG[Program Management]
        REG[Registration Management]
        ATT[Attendance Management]
        CERT[Certificate Management]
        REP[Reporting]
        UA[User Administration]
        AUD[Audit]
    end
    DAL["Data Access Layer<br/>Repository / Data Access Components"]
    DB[("MySQL 8.4 LTS<br/>Application Data / Session Store / Audit / Notification Outbox")]
    UI --> WEB --> SEC --> APP --> DAL --> DB |
| --- |

| flowchart TB
    UI["Web UI<br/>HTML / Bootstrap / JavaScript"]
    subgraph BM["Business Modules"]
        PM[Participant Management]
        PRG[Program Management]
        CAT[Program Catalogue]
        REG[Registration]
        ATT[Attendance]
        CERT[Certificate]
        REP[Reporting]
        UA[User Administration]
        AUD[Audit]
    end
    SEC[Authentication & Authorization]
    DAL[Data Access Layer / Repository]
    DB[("MySQL 8.4 LTS<br/>Application Data / Session Store / Audit / Notification Outbox")]
    UI --> BM
    BM --> SEC --> DAL --> DB |
| --- |

| flowchart LR
    P[Participant]
    UI[Web UI]
    API[Registration API]
    AUTH[Authentication & Authorization]
    VAL[Registration Validation]
    TX["Database Transaction<br/>Registration + Audit + Notification Outbox"]
    DB[(MySQL 8.4 LTS)]
    WORK[Notification Worker]
    EMAIL["Email / Notification Service<br/>(External System)"]
    P --> UI --> API --> AUTH --> VAL --> TX --> DB
    DB -->|Committed outbox event| WORK
    WORK -->|Send confirmation email| EMAIL
    EMAIL -->|Delivery result| WORK
    WORK -->|Update delivery status| DB |
| --- |
