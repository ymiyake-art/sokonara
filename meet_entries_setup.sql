-- ソコナラMEET 当日運営テーブル（氏名＋気になる企業チェック＋最低限アンケート）。
-- ⚠️ PII（氏名）を含むため anon の読み書きは一切許可しない（ポリシーなし＝RLSで全遮断）。
--    書き込みは /api/meet-log（service_role）、閲覧は admin の /api/admin-data list（ADMIN_PASSWORD認証）のみ。
-- 企業向けレポートには匿名・集計情報のみ使用。氏名等の企業共有は consent=true の本人のみ。
CREATE TABLE IF NOT EXISTS meet_entries (
  id text PRIMARY KEY,                      -- 端末生成ID（meet_<ts>_<rand>）
  event_id text,                            -- 例: meet_2026_07_30（次回以降の再利用用）
  name text,                                -- 氏名（班分け・当日運営のためソコナラのみ利用）
  checks jsonb DEFAULT '[]'::jsonb,         -- 気になる企業（company id 最大3）
  deep jsonb DEFAULT '[]'::jsonb,           -- 詳しく知りたい企業
  talk jsonb DEFAULT '[]'::jsonb,           -- 個別に話してみたい企業
  consent boolean,                          -- 企業への情報共有可否（本人同意）
  rtags jsonb DEFAULT '[]'::jsonb,          -- 理由タグ（leader/biz/exp/local/growth/people/cond/undecided）
  comment text,                             -- 任意の一言コメント
  survey_done boolean,                      -- アンケート送信済み
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);
ALTER TABLE meet_entries ENABLE ROW LEVEL SECURITY;
-- ポリシーは作らない（anon全遮断・service_roleはRLSバイパス）
