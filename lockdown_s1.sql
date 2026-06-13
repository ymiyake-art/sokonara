-- ===== セキュリティ S-1：匿名キーによる改竄・削除を塞ぐ =====
-- Supabaseダッシュボード → SQL Editor で実行。
-- 方針：公開(anon)は「閲覧」と「共感(reactions++)」のみ。記事/カードの編集・追加・削除は
--       管理API(service_role, ADMIN_PASSWORD認証)経由に限定する。
-- ※ ポリシー名に依存しないよう、テーブル権限(GRANT/REVOKE)で確実に制御する。

-- companies：閲覧OK。更新はreactions列のみ（共感ボタン）。追加・削除は不可。
REVOKE INSERT, UPDATE, DELETE ON public.companies FROM anon;
GRANT  UPDATE(reactions)       ON public.companies TO   anon;

-- challenge_cards：閲覧OK（pfがカードを読む）。書込はadmin API経由のみ。
REVOKE INSERT, UPDATE, DELETE ON public.challenge_cards FROM anon;

-- projects（共創テーマ）：閲覧OK。書込はadmin API経由のみ。
REVOKE INSERT, UPDATE, DELETE ON public.projects FROM anon;

-- 確認用（任意）：anonに残っている権限を確認
-- SELECT grantee, privilege_type, table_name, column_name
-- FROM information_schema.role_column_grants
-- WHERE grantee='anon' AND table_name IN ('companies','challenge_cards','projects');
