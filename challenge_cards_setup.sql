-- ===== v2 課題カード テーブル =====
-- Supabaseダッシュボード → SQL Editor で実行（CREATE/RLSはanonでは不可のためダッシュボードで）
-- RLSの姿勢は既存 companies に合わせる（anonフルアクセス。管理画面はクライアント側パスワードでゲート）。

CREATE TABLE IF NOT EXISTS challenge_cards (
  id          text PRIMARY KEY,
  card_title  text NOT NULL,           -- 1行目：課題
  card_sub    text DEFAULT '',         -- 2行目：経営層の想い
  company_id  text,                    -- 紐づく companies.id（記事レコメンド先）
  leader      text DEFAULT '',         -- 表示用の経営層名（敬称なし）
  company     text DEFAULT '',         -- 表示用の会社名
  btags       text[] DEFAULT '{}',     -- 事業テーマタグ
  rtags       text[] DEFAULT '{}',     -- 共鳴タグ
  active      boolean DEFAULT true,    -- 表示ON/OFF
  sort        int DEFAULT 100,         -- 並び順（小さいほど先）
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenge_cards_active ON challenge_cards(active, sort);

ALTER TABLE challenge_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon select cards" ON challenge_cards;
DROP POLICY IF EXISTS "anon insert cards" ON challenge_cards;
DROP POLICY IF EXISTS "anon update cards" ON challenge_cards;
DROP POLICY IF EXISTS "anon delete cards" ON challenge_cards;
CREATE POLICY "anon select cards" ON challenge_cards FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert cards" ON challenge_cards FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon update cards" ON challenge_cards FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon delete cards" ON challenge_cards FOR DELETE TO anon USING (true);

-- ===== シード（12枚：1経営層2枚ずつ）=====
-- 既存シードを消してから入れ直す場合：DELETE FROM challenge_cards;
INSERT INTO challenge_cards (id, card_title, card_sub, company_id, leader, company, btags, rtags, active, sort) VALUES
('card_inoue_a','九州で学びが当たり前にある社会を、事業として成り立たせたい','地域の可能性を信じ、学びのインフラを本気でつくる挑戦です。','co_import_1776760337430','井上','株式会社Schoo','{newbiz,local}','{mission,challenge}',true,10),
('card_inoue_b','社会性と経済性を、両立させながら事業を伸ばしたい','「文化をつくる」を20年以上貫いてきた経営層です。','co_import_1776760337430','井上','株式会社Schoo','{newbiz}','{challenge,mission}',true,20),
('card_sonoda_a','学びで地域の選択肢を増やす拠点を、福岡にゼロからつくりたい','人が変わる瞬間を、地域の中で増やしていく仕事です。','co_import_1776760337431','園田','株式会社Schoo','{local,newbiz}','{dialogue,mission}',true,30),
('card_sonoda_b','「自分にできるのはこれくらい」を、学びで超えられる地域をつくりたい','現場で人に会い、地域に何を残せるかを考え続けてきた人です。','co_import_1776760337431','園田','株式会社Schoo','{local}','{mission,dialogue}',true,40),
('card_inaba_a','生成AI時代に、エンジニアの価値の出し方をチームで作り直したい','技術だけでなく、仲間とどう価値を出すかを問い直す挑戦です。','co_import_1776760337432','稲葉','株式会社Ruby開発','{dx,orgchange}','{team,challenge}',true,50),
('card_inaba_b','「言ったことで組織が変わる」を、仕組みで担保したい','心理的安全性を、制度と空気の両方でつくる経営層です。','co_import_1776760337432','稲葉','株式会社Ruby開発','{orgchange}','{trust,team}',true,60),
('card_ueno_a','IT×XRで、福岡発の強い受託開発会社を第2創業期からつくりたい','技術者が誇りを持てる会社を、次のステージへ進める挑戦です。','co_import_1776760337433','上野','株式会社エクシーズ','{dx,newbiz}','{challenge,craft}',true,70),
('card_ueno_b','安定より「ワクワクするか」で、次の挑戦を選びたい','50代でIT業界へ飛び込んだ、元銀行員の経営層です。','co_import_1776760337433','上野','株式会社エクシーズ','{dx,challenge}','{craft,challenge}',true,80),
('card_ishikura_a','福岡発の遮熱シートで、建材の未来を変えたい','仲間を大切にしながら、地球を救う事業を全国へ広げる挑戦です。','co_ishikura_1777510220','石蔵','石蔵商店 建材事業部','{newbiz,growth}','{team,mission,challenge}',true,90),
('card_ishikura_b','80年続く事業を、規律と信頼でもう一段強くしたい','ラグビー33年、「チームでやり切る」を大切にする経営層です。','co_ishikura_1777510220','石蔵','石蔵商店 建材事業部','{growth}','{team,trust}',true,100),
('card_koga_a','印刷会社を、地域企業の販促DXパートナーへ変えたい','働く人が自分らしく力を発揮できる会社づくりにも挑んでいます。','co_import_1776760337434','古賀','アド印刷株式会社','{dx,expertise}','{selfrealization,dialogue}',true,110),
('card_koga_b','「人情」と「おせっかい」で、中小企業の成果まで伴走したい','斜陽と言われた業界で48年、人で選ばれてきた会社です。','co_import_1776760337434','古賀','アド印刷株式会社','{expertise,local}','{dialogue,selfrealization}',true,120)
ON CONFLICT (id) DO NOTHING;
