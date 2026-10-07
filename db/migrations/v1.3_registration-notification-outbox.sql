-- Apply once after v1.2. Delivery is asynchronous after registration commit.
CREATE TABLE notification_outbox (
  outbox_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  aggregate_id BIGINT NOT NULL,
  recipient VARCHAR(254) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  payload JSON NOT NULL,
  status VARCHAR(20) NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  next_attempt_at DATETIME NULL,
  last_error VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_notification_event (event_type, aggregate_type, aggregate_id),
  CONSTRAINT chk_outbox_status CHECK (status IN ('PENDING','PROCESSING','SENT','FAILED')),
  CONSTRAINT chk_outbox_attempts CHECK (attempt_count >= 0),
  INDEX idx_outbox_due (status, next_attempt_at),
  INDEX idx_outbox_aggregate (aggregate_type, aggregate_id)
) ENGINE=InnoDB;
