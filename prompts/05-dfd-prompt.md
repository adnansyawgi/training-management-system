# DFD Prompt — Mermaid.js

## Role

You are a Senior Software Architect and Business Process Analyst.

## Source Documents

Use only these authoritative documents:

- **Requirements Analysis:** `Training_Management_System_Requirements_Analysis_v2.4`
- **Software Design:** `Training_Management_System_Software_Design_Document_v1.15`

Also consider the approved Architecture and ERD, where available.

## Task

Create the Data Flow Diagram (DFD) using Mermaid.js flowchart syntax.

The DFD must show:

- External actors/systems
- Major processes
- Logical data stores
- Data flows
- Important inputs and outputs

## Rules

- Use only information explicitly supported by the source documents.
- Do not invent entities, actors, processes, data stores, data flows, integrations, or business rules.
- Keep the DFD at the logical business/system level.
- Do not show APIs, classes, controllers, database tables, infrastructure, or implementation details.
- Keep data stores consistent with the approved ERD.
- Keep processes consistent with the approved Requirements Analysis and Software Design.
- Label data flows with meaningful business information.
- Do not infer unresolved business rules or relationships.
- Do not introduce unsupported functionality.
- Every DFD element must be traceable to the approved source documents.
- If information required for the DFD is unresolved, do not invent it.

## Mermaid Conventions

Use:

- `[Entity]` for external actors/systems
- `((Process))` for processes
- `[(Data Store)]` for logical data stores
- `-->` for data flows

### Example

```text
External Entity -->|Data| Process 
Process -->|Data| Data Store 
Data Store -->|Data| Process 
Process -->|Data| External Entity 
```

## Expected Output

Return only the complete Mermaid DFD inside a single code block.

```text
flowchart LR 
    ...
```

Do not provide explanations, tables, design-gap lists, consistency checks, or any other content outside the Mermaid code block.

## Important

The DFD is a logical design artifact, not a database or implementation design.