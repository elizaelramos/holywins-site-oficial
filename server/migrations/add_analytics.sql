CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  visitor_id VARCHAR(36),
  session_id VARCHAR(36),
  path VARCHAR(255) NOT NULL,
  referrer VARCHAR(500),
  utm_source VARCHAR(120) DEFAULT NULL,
  utm_medium VARCHAR(120) DEFAULT NULL,
  utm_campaign VARCHAR(120) DEFAULT NULL,
  user_agent VARCHAR(500),
  device_type VARCHAR(12),
  browser VARCHAR(60),
  os VARCHAR(60),
  language VARCHAR(20),
  ip VARCHAR(45),
  country VARCHAR(80),
  city VARCHAR(120),
  is_bot TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pv_created_at (created_at),
  INDEX idx_pv_visitor (visitor_id),
  INDEX idx_pv_path (path),
  INDEX idx_pv_is_bot (is_bot)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS request_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  ip VARCHAR(45),
  method VARCHAR(10),
  path VARCHAR(255) NOT NULL,
  status_code SMALLINT,
  response_time_ms INT,
  user_agent VARCHAR(500),
  referer VARCHAR(500),
  is_bot TINYINT(1) NOT NULL DEFAULT 0,
  threat_type VARCHAR(40) DEFAULT NULL,
  country VARCHAR(80) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rl_created_at (created_at),
  INDEX idx_rl_ip (ip),
  INDEX idx_rl_is_bot (is_bot),
  INDEX idx_rl_threat (threat_type),
  INDEX idx_rl_status (status_code)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_stats (
  day DATE PRIMARY KEY,
  total_views INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  api_requests INT NOT NULL DEFAULT 0,
  bot_requests INT NOT NULL DEFAULT 0,
  threats INT NOT NULL DEFAULT 0
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
