-- WF-015 / SDD v1.16. Apply once after v1.0 through v1.5.
CREATE TABLE report_executions (
  report_execution_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  report_name VARCHAR(100) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  period_from DATETIME NOT NULL,
  period_to DATETIME NOT NULL,
  parameters JSON NULL,
  generated_at DATETIME NOT NULL,
  generated_by BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL,
  output_reference VARCHAR(500) NULL,
  data_access_classification VARCHAR(50) NOT NULL,
  CONSTRAINT fk_report_generator FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT chk_report_period CHECK (period_from<=period_to),
  INDEX idx_report_generated_at (generated_at),
  INDEX idx_report_type (report_type),
  INDEX idx_report_generated_by (generated_by)
) ENGINE=InnoDB;
