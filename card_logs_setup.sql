-- ===== v2 行動ログ（匿名） =====
-- Supabaseダッシュボード → SQL Editor で実行。
-- 「どんなタイプ(カード/タグ)が・どの言葉(q1)に反応したか」を経営層フィードバックで集計するための土台。
-- 個人情報は保存しない（line_idは持たず、memo_textはクライアント側でPIIマスク済みを保存）。

CREATE TABLE IF NOT EXISTS card_logs (
  id            text PRIMARY KEY,           -- クライアント生成のセッションキー(uuid)
  picked_cards  text[] DEFAULT '{}',        -- 「関わりたい」と選んだカードID
  dropped_cards text[] DEFAULT '{}',        -- 「スキップ」したカードID
  top_tags      text[] DEFAULT '{}',        -- 上位の事業テーマタグ
  rtags_hit     text[] DEFAULT '{}',        -- 選んだカードに含まれた共鳴タグ（集計用）
  recommended_company text,                 -- レコメンドされた company_id
  recommended_card    text,                 -- レコメンドされた card_id
  q1_phrase     text DEFAULT '',            -- 刺さった言葉（記事のどの一文に反応したか）
  memo_chips    text[] DEFAULT '{}',        -- できそうなこと（チップ）
  memo_text     text DEFAULT '',            -- 自由記述（PIIマスク済み）
  article_read  boolean DEFAULT false,      -- 記事到達
  ai_viewed     boolean DEFAULT false,      -- AI診断閲覧
  line_registered boolean DEFAULT false,    -- LINE登録（デモ含む）
  contact_cta   boolean DEFAULT false,      -- 接点CTAクリック
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_logs_reco ON card_logs(recommended_company);
CREATE INDEX IF NOT EXISTS idx_card_logs_created ON card_logs(created_at);

ALTER TABLE card_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon insert logs" ON card_logs;
DROP POLICY IF EXISTS "anon update logs" ON card_logs;
DROP POLICY IF EXISTS "anon select logs" ON card_logs;
DROP POLICY IF EXISTS "anon delete logs" ON card_logs;
-- pfが匿名でINSERT/UPDATE。管理画面の集計・削除用にSELECT/DELETEも許可（既存テーブルと同じ姿勢）。
CREATE POLICY "anon insert logs" ON card_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update logs" ON card_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon select logs" ON card_logs FOR SELECT TO anon USING (true);
CREATE POLICY "anon delete logs" ON card_logs FOR DELETE TO anon USING (true);
