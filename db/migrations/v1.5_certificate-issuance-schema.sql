-- WF-014 / SDD v1.16. Apply once after v1.0 through v1.4.
CREATE TABLE certificates (
  certificate_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  certificate_number VARCHAR(60) NULL UNIQUE,
  participant_id BIGINT NOT NULL,
  registration_id BIGINT NOT NULL UNIQUE,
  program_id BIGINT NOT NULL,
  certificate_type VARCHAR(100) NOT NULL,
  certificate_title VARCHAR(255) NOT NULL,
  eligibility_status VARCHAR(30) NOT NULL,
  eligibility_result VARCHAR(255) NOT NULL,
  attendance_percentage DECIMAL(5,2) NOT NULL,
  completion_date DATE NOT NULL,
  issue_date DATE NULL,
  certificate_status VARCHAR(30) NOT NULL,
  document_reference VARCHAR(500) NULL,
  verification_reference VARCHAR(255) NULL,
  issuing_authority VARCHAR(255) NULL,
  revocation_date DATE NULL,
  revocation_reason VARCHAR(500) NULL,
  issued_by BIGINT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_certificate_participant FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_certificate_registration FOREIGN KEY (registration_id) REFERENCES registrations(registration_id) ON DELETE RESTRICT,
  CONSTRAINT fk_certificate_program FOREIGN KEY (program_id) REFERENCES training_programs(program_id) ON DELETE RESTRICT,
  CONSTRAINT fk_certificate_issuer FOREIGN KEY (issued_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT chk_certificate_percentage CHECK (attendance_percentage BETWEEN 0 AND 100),
  CONSTRAINT chk_certificate_issued_fields CHECK (certificate_status<>'ISSUED' OR (certificate_number IS NOT NULL AND issue_date IS NOT NULL AND issued_by IS NOT NULL))
) ENGINE=InnoDB;
-- Relationship fields, eligibility, completion date and issuance authority are
-- server-derived. WF-014 records issuance only; revocation/document generation
-- operations and business-facing numbering remain outside this feature.
