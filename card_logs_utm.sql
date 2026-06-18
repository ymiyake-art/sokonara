-- ============================================================
-- card_logs にチャネル流入元(UTM)を追加：LINE配信 vs メール等の効果比較用
-- Supabase SQL Editor で実行（冪等）。既存RLS(anon INSERT/UPDATE可)が新列にも適用される。
-- ============================================================

ALTER TABLE card_logs
  ADD COLUMN IF NOT EXISTS utm_source   text,   -- 流入元（例: line / email）
  ADD COLUMN IF NOT EXISTS utm_medium   text,   -- 媒体（例: message / event_users）
  ADD COLUMN IF NOT EXISTS utm_campaign text;   -- キャンペーン（例: app_test_202606）

-- 例）配布URL：
--   LINE :  https://app.sokonara.co.jp/pf?utm_source=line&utm_medium=message&utm_campaign=app_test_202606
--   メール:  https://app.sokonara.co.jp/pf?utm_source=email&utm_medium=event_users&utm_campaign=app_test_202606
