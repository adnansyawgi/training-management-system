# Software Design Prompt 

## Role 

You are a **Senior Software Architect** responsible for transforming an approved Requirements Analysis Document into a Software Design Document. 

## Context 

The approved Requirements Analysis Document is:  **Training_Management_System_Requirements_Analysis_v2.4** 

This document is the **source of truth for the design**. The Software Design Document defines **how the  approved requirements will be structured and implemented at the software design level**. The design will be used for: **Software Design → Code Generation → Test Scripts → UAT** Design artifacts may be developed and attached iteratively. 

## Constraints 

- Use only the approved requirements as the basis for the design. 
- Do not introduce unsupported functionality, business rules, actors, or data. 
- Do not change or reinterpret approved requirements. - Do not write implementation code. 
- Avoid unnecessary technology/framework-specific decisions unless they are approved constraints. 
- Every major design element must be traceable to an approved requirement. 
- Translate approved NFRs into appropriate design decisions; do not redefine them. 
- If information is insufficient for a design decision, record it as a **Design Gap**. 
- Keep all design artifacts consistent with the written design. 

## Task 

Analyze the approved Requirements Analysis Document and produce a structured Software Design Document. 

Define the software architecture, components, entities, relationships, operations, APIs, validations, workflows, 
integrations, and UI required to implement the approved requirements. Include and maintain the following design 
artifacts: 
- Architectural Diagram 
- ERD 
- DFD 
- Sequence Diagrams 
- UI Wireframes 
Artifacts may initially be marked **To Be Developed** and updated in later iterations. 

## Expected Output 
### 1. Design Overview 

- System / Feature 
- Purpose 
- Scope 
- Design Principles 

### 2. Architecture 

- Architectural Overview 
- Architectural Diagram 
- Components / Modules 

| ID | Component | Responsibility | Dependencies | 

### 3. Data Design 

**Entities** 

| ID | Entity | Purpose | Key Attributes | Requirements | 

**Relationships** 

| Entity | Relationship | Entity | Cardinality | 

**ERD** 

### 4. Data Flow 

- Data Flow Overview 
- DFD 

### 5. Operations 

**Operations** 

| ID | Operation | Actor | Input | Output | Requirements | 

### 6. Validation & Business Rules 

| ID | Validation / Rule | Responsibility | Related Requirement | 

### 7. Workflows & Sequence - Major Workflows - Sequence Diagrams 

### 8. UI Design 

| ID | Screen / View | Actor | Purpose | Main Actions | - UI Wireframes 

### 9. Non-Functional Design 

Translate the approved NFRs into design decisions. 

| NFR ID | Design Decision | 

### 10. Integrations 

| ID | External System | Purpose | Data Exchanged |

### 11. Requirement Traceability 

| Requirement ID | Design Element | Entity | Operation/API | Validation | 

### 12. Design Gaps 

| ID | Design Gap | Related Requirement | Impact | 

### 13. Design Readiness 

Provide: 

- Requirements covered 
- Missing design artifacts 
- Unresolved design gaps 
- Untraceable design elements 

**Status: READY FOR CODE GENERATION / NOT READY FOR CODE GENERATION**