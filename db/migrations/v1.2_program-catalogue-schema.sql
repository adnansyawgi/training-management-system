-- WF-007 SDD v1.16 catalogue and seat-count dependencies.
-- Apply once after v1.0 and v1.1; no sample/business records are provisioned.
CREATE TABLE program_categories (
  category_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description VARCHAR(500) NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT chk_category_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
  INDEX idx_category_status (status)
) ENGINE=InnoDB;

CREATE TABLE training_programs (
  program_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  objectives TEXT NOT NULL,
  target_audience VARCHAR(500) NOT NULL,
  prerequisites VARCHAR(1000) NULL,
  category_id BIGINT NOT NULL,
  trainer_user_id BIGINT NOT NULL,
  training_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue VARCHAR(300) NULL,
  delivery_mode VARCHAR(50) NOT NULL,
  capacity INT NOT NULL,
  registration_open_at DATETIME NOT NULL,
  registration_close_at DATETIME NOT NULL,
  status VARCHAR(30) NOT NULL,
  cancellation_policy_reference VARCHAR(255) NULL,
  certificate_eligibility_criteria VARCHAR(100) NOT NULL,
  certificate_type VARCHAR(100) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_program_category FOREIGN KEY (category_id) REFERENCES program_categories(category_id) ON DELETE RESTRICT,
  CONSTRAINT fk_program_trainer FOREIGN KEY (trainer_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT chk_program_capacity CHECK (capacity > 0),
  CONSTRAINT chk_program_time CHECK (end_time > start_time),
  CONSTRAINT chk_program_window CHECK (registration_open_at < registration_close_at),
  CONSTRAINT chk_program_status CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'COMPLETED', 'CANCELLED')),
  INDEX idx_program_category (category_id),
  INDEX idx_program_status_date (status, training_date)
) ENGINE=InnoDB;

CREATE TABLE registrations (
  registration_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reference_no VARCHAR(50) NOT NULL UNIQUE,
  participant_id BIGINT NOT NULL,
  program_id BIGINT NOT NULL,
  registered_at DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL,
  cancelled_at DATETIME NULL,
  cancellation_reason VARCHAR(500) NULL,
  registration_remarks VARCHAR(500) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  active_registration_key VARCHAR(100) GENERATED ALWAYS AS
    (CASE WHEN status = 'REGISTERED' THEN CONCAT(participant_id, ':', program_id) ELSE NULL END) STORED,
  UNIQUE KEY uq_active_registration (active_registration_key),
  CONSTRAINT fk_registration_participant FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_registration_program FOREIGN KEY (program_id) REFERENCES training_programs(program_id) ON DELETE RESTRICT,
  CONSTRAINT chk_registration_status CHECK (status IN ('REGISTERED', 'CANCELLED')),
  INDEX idx_registration_participant_status (participant_id, status),
  INDEX idx_registration_program_status (program_id, status)
) ENGINE=InnoDB;
