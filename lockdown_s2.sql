-- ===== セキュリティ S-2：ログ系テーブルの anon SELECT を閉じる =====
-- Supabaseダッシュボード → SQL Editor で実行。
-- 対象：interest_forms / user_sessions / empathy_logs
-- 管理画面はすべて service_role API 経由で読むため、anon SELECT は不要。

REVOKE SELECT ON public.interest_forms  FROM anon;
REVOKE SELECT ON public.user_sessions   FROM anon;
REVOKE SELECT ON public.empathy_logs    FROM anon;

-- 確認用（任意）
-- SELECT grantee, privilege_type, table_name
-- FROM information_schema.role_table_grants
-- WHERE grantee = 'anon'
--   AND table_name IN ('interest_forms', 'user_sessions', 'empathy_logs')
-- ORDER BY table_name;
-- → 行なし（または INSERT/UPDATE のみ）が正しい状態。
