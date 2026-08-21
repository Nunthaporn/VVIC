CREATE TABLE IF NOT EXISTS analytics.dashboard_config (
  config_key text PRIMARY KEY,
  numeric_value numeric,
  text_value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO analytics.dashboard_config(config_key,numeric_value)
VALUES ('customer_mtd_target',0.60)
ON CONFLICT(config_key) DO NOTHING;
