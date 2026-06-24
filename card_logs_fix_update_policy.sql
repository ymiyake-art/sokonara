-- ============================================================
-- 【重要・不具合修正】card_logs の anon UPDATE が0行になる問題
--   症状：カード開始(INSERT)は記録されるが、スワイプ枚数/到達/記事/AI診断/LINE/面談、
--         およびカード経由の診断保存(ai_summary等)が一切保存されない。
--   原因：anon用のUPDATEポリシーが本番テーブルに無く、RLSでUPDATEが0行になっていた。
--   対処：anonのINSERT/UPDATEポリシーを（再）作成する。SELECT/DELETEは引き続き閉じたまま。
-- Supabase SQL Editor で実行してください（冪等）。
-- ============================================================

ALTER TABLE card_logs ENABLE ROW LEVEL SECURITY;

-- INSERT（カード開始・診断保存の新規行）
DROP POLICY IF EXISTS "anon insert logs" ON card_logs;
CREATE POLICY "anon insert logs" ON card_logs
  FOR INSERT TO anon WITH CHECK (true);

-- ★UPDATE（スワイプ進捗・到達・記事・AI診断・LINE・面談・診断結果保存）← これが効いていなかった
DROP POLICY IF EXISTS "anon update logs" ON card_logs;
CREATE POLICY "anon update logs" ON card_logs
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 念のためテーブル権限も保証（SupabaseのデフォルトGRANT前提だが明示）
GRANT INSERT, UPDATE ON card_logs TO anon;

-- ※ SELECT / DELETE の anon ポリシーは作らない（読取・削除はservice_role APIのみ＝従来通り安全）

-- 確認：実行後、anonでUPDATEが実際に反映されること（PATCH→値が変わる）。
