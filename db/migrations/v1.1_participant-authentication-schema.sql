-- Apply once after v1.0 using the controlled migration process.
-- WF-002: database sessions and approved 15-minute failure observation window.
CREATE TABLE sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  session_data TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expiry (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE authentication_failures (
  failure_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  attempted_at DATETIME(3) NOT NULL,
  INDEX idx_authentication_failures_window (user_id, attempted_at),
  CONSTRAINT fk_authentication_failures_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;
