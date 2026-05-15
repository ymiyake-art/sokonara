-- =============================================
-- ソコナラ Supabase テーブル設定
-- Supabase Dashboard → SQL Editor で実行
-- =============================================

-- 1. catchphrase カラム追加（companiesテーブル）
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS catchphrase text DEFAULT '';

-- 2. ユーザーテーブル（LINE IDを主キー）
CREATE TABLE IF NOT EXISTS users (
  line_id      text PRIMARY KEY,
  email        text,
  display_name text,
  picture_url  text,
  created_at   timestamptz DEFAULT now()
);

-- 3. セッションテーブル（記事を読むたびに蓄積）
CREATE TABLE IF NOT EXISTS user_sessions (
  id          text PRIMARY KEY,
  line_id     text REFERENCES users(line_id) ON DELETE SET NULL,
  company_id  text,
  q1_answer   text DEFAULT '',
  q2_values   jsonb DEFAULT '[]',
  q3_answer   text DEFAULT '',
  ai_values   jsonb DEFAULT '[]',
  ai_message  text DEFAULT '',
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_line_id ON user_sessions(line_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_company_id ON user_sessions(company_id);

-- 4. 興味通知フォームテーブル
CREATE TABLE IF NOT EXISTS interest_forms (
  id           text PRIMARY KEY,
  line_id      text REFERENCES users(line_id) ON DELETE SET NULL,
  company_id   text,
  company_name text DEFAULT '',
  ceo_name     text DEFAULT '',
  intent_type  text DEFAULT 'empathy',  -- empathy / collaborate / hire
  q1_answer    text DEFAULT '',
  q2_values    jsonb DEFAULT '[]',
  q3_answer    text DEFAULT '',
  ai_values    jsonb DEFAULT '[]',
  form_data    jsonb DEFAULT '{}',       -- フォーム回答をまるごと保存
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interest_forms_company_id ON interest_forms(company_id);
CREATE INDEX IF NOT EXISTS idx_interest_forms_intent_type ON interest_forms(intent_type);

-- 5. RLS（Row Level Security）設定

-- companies テーブル：管理画面（anonキー）から読み書き可能にする
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon read companies"   ON companies FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert companies" ON companies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update companies" ON companies FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ユーザー系テーブル：anonからINSERT、管理者のみSELECT
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert users" ON users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "service read users" ON users FOR SELECT TO service_role USING (true);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert sessions" ON user_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "service read sessions" ON user_sessions FOR SELECT TO service_role USING (true);

ALTER TABLE interest_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert interest" ON interest_forms FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "service read interest" ON interest_forms FOR SELECT TO service_role USING (true);

-- =============================================
-- 実行後の確認クエリ
-- =============================================
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'catchphrase';
-- SELECT * FROM users LIMIT 5;
-- SELECT * FROM user_sessions LIMIT 5;
-- SELECT * FROM interest_forms LIMIT 5;
