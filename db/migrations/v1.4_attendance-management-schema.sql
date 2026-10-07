-- WF-013 / SDD v1.16. Apply once after v1.0 through v1.3.
CREATE TABLE attendance (
  attendance_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  registration_id BIGINT NOT NULL UNIQUE,
  participant_id BIGINT NOT NULL,
  program_id BIGINT NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  check_in_at DATETIME NULL,
  check_out_at DATETIME NULL,
  verification_method VARCHAR(50) NULL,
  evidence_reference VARCHAR(255) NULL,
  remarks VARCHAR(500) NULL,
  recorded_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_attendance_registration FOREIGN KEY (registration_id) REFERENCES registrations(registration_id) ON DELETE RESTRICT,
  CONSTRAINT fk_attendance_recorder FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT chk_attendance_status CHECK (status IN ('PRESENT','ABSENT')),
  CONSTRAINT chk_attendance_percentage CHECK (percentage BETWEEN 0 AND 100)
) ENGINE=InnoDB;
-- participant_id/program_id derive from registration and are immutable in the
-- application. Percentage is always derived from PRESENT/ABSENT by the service.
