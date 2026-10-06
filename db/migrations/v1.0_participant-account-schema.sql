CREATE TABLE users (
  user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_identifier VARCHAR(100) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id VARCHAR(50) NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  permissions JSON NOT NULL,
  access_scope JSON NOT NULL,
  permitted_responsibilities JSON NOT NULL,
  account_status VARCHAR(20) NOT NULL,
  failed_login_count INT NOT NULL DEFAULT 0,
  lockout_until DATETIME NULL,
  role_assigned_at DATETIME NOT NULL,
  role_expires_at DATETIME NULL,
  activated_at DATETIME NULL,
  deactivated_at DATETIME NULL,
  last_login_at DATETIME NULL,
  authentication_method VARCHAR(100) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_users_role_id (role_id),
  INDEX idx_users_account_status (account_status)
) ENGINE=InnoDB;

INSERT INTO users (
  account_identifier, username, name, email, password_hash, role_id, role_name,
  permissions, access_scope, permitted_responsibilities, account_status,
  role_assigned_at, authentication_method, created_at, updated_at
) VALUES (
  CONCAT('A-', REPLACE(UUID(), '-', '')),
  CONCAT('system-audit-', REPLACE(UUID(), '-', '')),
  'System Audit Actor',
  CONCAT('system-audit-', REPLACE(UUID(), '-', ''), '@invalid.local'),
  '$argon2id$v=19$m=65536,p=4,t=3$H386vAQjAZwvmKBVgEwebA$NNN7VG7DlNz3OU4mcue/EXsYaO8kv5ZPdI+5dyhFHkE',
  'SYSTEM_ADMINISTRATOR', 'SYSTEM_ADMINISTRATOR', JSON_ARRAY(), JSON_ARRAY(), JSON_ARRAY(),
  'DISABLED', NOW(), 'SYSTEM', NOW(), NOW()
);

CREATE TABLE participants (
  participant_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  nric_passport_no VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  mobile_no VARCHAR(30) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT fk_participants_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE audit_records (
  audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_timestamp DATETIME NOT NULL,
  actor_user_id BIGINT NOT NULL,
  actor_role VARCHAR(30) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  result VARCHAR(20) NOT NULL,
  change_summary TEXT NOT NULL,
  previous_value JSON NULL,
  new_value JSON NULL,
  access_scope VARCHAR(100) NOT NULL,
  data_classification VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  correlation_id VARCHAR(100) NULL,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  INDEX idx_audit_event_timestamp (event_timestamp),
  INDEX idx_audit_actor_user_id (actor_user_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_correlation_id (correlation_id)
) ENGINE=InnoDB;

-- Provision exactly one reserved SYSTEM_ADMINISTRATOR/DISABLED/SYSTEM actor
-- through the controlled bootstrap process with generated opaque identifiers
-- and an unusable Argon2id password hash before enabling this API.
