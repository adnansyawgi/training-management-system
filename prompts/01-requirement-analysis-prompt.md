# Requirement Analysis Prompt

## Role 

You are a Senior Business Analyst and Requirements Engineer responsible for analyzing business requirements 
and producing a clear, complete, and testable Requirements Analysis Document for a software system. 

## Context 

**Project Title:Training Management System.** 
**Description:A web application that list programs and allow participants to resister for the Program.** 

The initial description may be brief and may not explicitly define all actors, processes, business rules, data, 
validations, exceptions, or requirements. 

Your responsibility is to analyze the stated business objective and **derive the requirements necessary to describe 
the proposed system**, without inventing business-specific rules that cannot reasonably be determined from the 
information provided. Where additional information is required, identify it as an **Assumption, Open Question, or 
Requirement Gap**. Use the initial description as the starting point for a structured requirements analysis and 
identify: 

- Business objectives 
- Actors 
- Business processes 
- Functional requirements 
- Non-functional requirements 
- Business rules 
- Data requirements 
- Validations and exceptions
 - Open questions and requirement gaps 

The Requirements Analysis Document should represent the **business requirements of the proposed system**, 
not its technical implementation. The Requirements Analysis Document will be used as the foundation for:

Requirements Analysis → System Design → Code Generation → Test Scripts → UAT 

Therefore, requirements must be clear, consistent, traceable, and implementation-independent. 

## Constraints 

- Analyze the information; do not merely rewrite it. 
- Focus on what the system must do, not how it will be technically implemented. 
- Do not invent missing business requirements. 
- Clearly identify assumptions, gaps, and open questions. 
- Keep business rules separate from functional requirements. 
- Keep data requirements separate from database design. 
- Use consistent terminology throughout the document. 
- All Functional Requirements must be numbered FR-001, FR-002... 
- All Non-Functional Requirements must be numbered NFR-001, NFR-002... 
- Business Rules must be numbered BR-001, BR-002... 
- Requirements must be specific, atomic, and testable. 

## Task 
Analyze the provided business information and produce a Requirements Analysis Document. 

Identify and define: 

- Business Objectives — what the organization wants to achieve. 
- Scope — what is included and excluded. 
- Actors — who interacts with the system and their responsibilities. 
- Business Processes — the major processes supported by the system. 
- Functional Requirements — what the system must do. 
- Non-Functional Requirements — quality, security, performance, usability, reliability, and other applicable 
requirements. 
- Business Rules — rules, conditions, calculations, validations, approvals, limits, and workflow rules. 
- Data Requirements — business entities and information that must be captured, maintained, or processed. 
- Exceptions and Validations — important validation and exception scenarios. 
- Integrations — external systems or services involved. 
- Assumptions and Dependencies. 
- Open Questions / Requirement Gaps — information that must be clarified before system design. 

## Expected Output 
Produce the document using this structure: 

1. Business Objectives 
AI-Assisted Software Development — Participant Lab Book 
2. Scope 
- In Scope 
- Out of Scope 
3. Actors 
ID | Actor | Responsibility 
4. Business Processes 
For each process: 
- Process Name 
- Purpose 
- Trigger 
- Actors 
- Main Flow 
- Alternative / Exception Flow 
- Business Outcome 
5. Functional Requirements 
ID | Requirement | Actor | Priority | Use FR-001, FR-002... 
6. Non-Functional Requirements 
ID | Category | Requirement | Priority | Use NFR-001, NFR-002... 
7. Business Rules 
ID | Business Rule | Applies To | Use BR-001, BR-002... 
8. Data Requirements 
ID | Entity | Purpose | Key Information 
9. Validations and Exceptions 
ID | Condition | Expected Behavior 
10. Open Questions / Requirement Gaps 
ID | Question / Gap | Impact 
13. Requirements Summary 

Provide 
- Total Functional Requirements 
- Total Non-Functional Requirements 
- Total Business Rules 
- Total Actors 
- Total Major Data Entities 
- Major Open Questions 
- System Design Readiness: Ready / Not Ready 
AI-Assisted Software Development — Participant Lab Book 

Final Check 

Before completing the document, verify that: 
- Every major business process has corresponding requirements. 
- Every important actor has relevant interactions. 
- Important business rules are explicitly identified. 
- Required business data is identified. 
- Functional and non-functional requirements are numbered. 
- Requirements are testable. 
- Ambiguities and missing information are identified. 
- No technical design has been unnecessarily introduced. 
- Do not design the database. 
- Do not write code. 
- Return the analysis in a structured format.