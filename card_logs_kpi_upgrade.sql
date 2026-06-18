-- ============================================================
-- card_logs KPI強化：入口〜途中離脱まで測れるように列を追加
-- Supabase SQL Editor で実行（既存の card_logs に対する ALTER・冪等）。
-- 既存のRLS/anonポリシー(INSERT/UPDATE可)はそのまま新列にも適用される。
-- ============================================================

ALTER TABLE card_logs
  ADD COLUMN IF NOT EXISTS started        boolean     DEFAULT false,  -- カードを開始した
  ADD COLUMN IF NOT EXISTS started_at     timestamptz,                -- 開始時刻
  ADD COLUMN IF NOT EXISTS shown_cards    text[]      DEFAULT '{}',   -- その回に表示されたカードID（ランダム抽出のため記録）
  ADD COLUMN IF NOT EXISTS reached_result boolean     DEFAULT false;  -- 最後まで見て結果(診断)に到達した

-- 補足：スワイプ枚数は picked_cards + dropped_cards の件数で算出できるため専用列は持たない。
