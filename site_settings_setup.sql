-- サイト設定（key-value・jsonb）。まずは MEET LP の文言上書き（key='meet_lp'）に使用。
-- 公開LPが読むため anon は読み取りのみ許可。書き込みは /api/admin-data（ADMIN_PASSWORD認証・service_role）経由のみ。
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS site_settings_anon_read ON site_settings;
CREATE POLICY site_settings_anon_read ON site_settings FOR SELECT TO anon USING (true);
-- INSERT/UPDATE/DELETE のポリシーは作らない（anon書込不可・service_roleはRLSバイパス）
