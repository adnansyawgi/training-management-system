CREATE TABLE system_administrator_bootstrap_state (
  state_id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  completed_at DATETIME(6) NULL,
  administrator_user_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT chk_bootstrap_singleton CHECK (state_id = 1),
  CONSTRAINT fk_bootstrap_administrator FOREIGN KEY (administrator_user_id)
    REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO system_administrator_bootstrap_state
  (state_id, completed_at, administrator_user_id, created_at, updated_at)
VALUES (1, NULL, NULL, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6));
