-- =====================================================
-- interest_forms テーブル RLS 設定
-- Supabase Studio > SQL Editor で実行してください
-- =====================================================

-- 1) RLS を有効化
ALTER TABLE interest_forms ENABLE ROW LEVEL SECURITY;

-- 2) 既存ポリシーをクリア（再実行時の重複エラー回避）
DROP POLICY IF EXISTS "anon_insert_only"    ON interest_forms;
DROP POLICY IF EXISTS "allow_all_for_admin" ON interest_forms;

-- 3) 匿名ユーザー（MVPサイトからのフォーム送信）: INSERT のみ許可
CREATE POLICY "anon_insert_only"
  ON interest_forms
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4) SELECT / UPDATE / DELETE は service_role のみ
--    （service_role は RLS を自動バイパスするため追加ポリシー不要）
--    → anon キーからの SELECT は自動的にブロックされます

-- =====================================================
-- 確認クエリ
-- =====================================================
-- SELECT * FROM pg_policies WHERE tablename = 'interest_forms';
