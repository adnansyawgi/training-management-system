# ERD Prompt — Mermaid.js

## Role

You are a Senior Software Architect and Data Modeler.

## Source Documents

Use the following confirmed documents as the authoritative sources:

**Requirements Analysis:**  
`Training_Management_System_Requirements_Analysis_v2.4`

**Software Design:**  
`Training_Management_System_Software_Design_Document_v1.15`

## Task

Create the Entity Relationship Diagram (ERD) using Mermaid.js ER diagram syntax, based strictly on the approved Requirements Analysis and Software Design documents.

The ERD must represent the entities, attributes, relationships, and constraints defined by the approved documents.

## Constraints

- Use only entities and data supported by the approved documents.
- Do not introduce unsupported entities, attributes, or relationships.
- Do not invent unresolved cardinalities or business rules.
- Do not introduce physical database implementation details unless they are explicitly defined in the Software Design Document.
- Use the existing entity names and terminology.
- Mark unresolved design decisions as Design Gaps outside the Mermaid diagram.
- The Mermaid diagram must remain consistent with the Software Design Document.
- Do not write application or database implementation code.

## Expected Output

### 1. Mermaid ERD

Return the complete Mermaid.js ER diagram inside a single code block:

```text
erDiagram 
    ...
```

The diagram should include:

- Entity names
- Primary keys
- Important attributes
- Foreign keys where supported by the design
- Relationships
- Cardinalities supported by the approved documents

### 2. Entity Summary

| Entity | Purpose | Key Attributes |
|---|---|---|
|  |  |  |

### 3. Relationship Summary

| Entity | Relationship | Entity | Cardinality | Business Meaning |
|---|---|---|---|---|
|  |  |  |  |  |

### 4. Design Gaps

Identify any unresolved items affecting the ERD.

| ID | Design Gap | Impact |
|---|---|---|
|  |  |  |

### 5. Consistency Check

State whether the generated ERD is consistent with:

- Requirements Analysis
- Software Design

Identify any inconsistencies found.

## Important

The Mermaid ERD is a design artifact, not a database implementation.

Do not create tables, indexes, constraints, data types, or other physical database details unless they are explicitly supported by the approved Software Design Document.

The resulting Mermaid diagram must be suitable for inclusion in the Software Design Document and for subsequent use in code generation.