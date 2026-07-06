-- 仕事の軸レポートの「共感を伝える」CTAタップ計測（H1検証：軸レポート発のフォーム誘導）
-- 実行後、api/card-log.js の ALLOWED に 'wb_cta' 追記済み（2026-07-06）
ALTER TABLE card_logs ADD COLUMN IF NOT EXISTS wb_cta boolean;
