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
  reason        text DEFAULT '',            -- スワイプ後に選んだ「惹かれた理由」
  memo_chips    text[] DEFAULT '{}',        -- できそうなこと（チップ）
  memo_text     text DEFAULT '',            -- 自由記述（PIIマスク済み）
  article_read  boolean DEFAULT false,      -- 記事到達
  ai_viewed     boolean DEFAULT false,      -- AI診断閲覧
  line_registered boolean DEFAULT false,    -- LINE登録（デモ含む）
  contact_cta   boolean DEFAULT false,      -- 接点CTAクリック
  ai_summary    text DEFAULT '',            -- 診断結果(要約)。ログイン往復後の復元用に匿名保存
  ai_message    text DEFAULT '',            -- 診断結果(本文)
  ai_bridge     text DEFAULT '',            -- 診断結果(接点の一言)
  started        boolean DEFAULT false,     -- カードを開始した（KPI：入口）
  started_at     timestamptz,               -- 開始時刻
  shown_cards    text[] DEFAULT '{}',       -- その回に表示されたカードID（ランダム抽出のため記録）
  reached_result boolean DEFAULT false,     -- 結果(診断)に到達した（完了）
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_logs_reco ON card_logs(recommended_company);
CREATE INDEX IF NOT EXISTS idx_card_logs_created ON card_logs(created_at);

ALTER TABLE card_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon insert logs" ON card_logs;
DROP POLICY IF EXISTS "anon update logs" ON card_logs;
DROP POLICY IF EXISTS "anon select logs" ON card_logs;  -- 公開SELECTは閉じる（読み取りはreport.js=service_role経由）
DROP POLICY IF EXISTS "anon delete logs" ON card_logs;  -- 削除もservice_role経由
-- pfは匿名でINSERT/UPDATEのみ可。読み取り(集計/復元)・削除はサーバーAPI(report.js, service_role)に限定。
CREATE POLICY "anon insert logs" ON card_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update logs" ON card_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);
-- ※ SELECT / DELETE の anon ポリシーは作らない（RLSにより匿名読み取り・削除は不可になる）
