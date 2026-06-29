-- 個人LPの「出会いの実例（CASES）」を管理画面で編集可能にするテーブル。
-- 公開READはanon可（PIIなし・許諾済の掲載）。書き込みは service_role API(admin-data) 経由。
create table if not exists cases (
  id          text primary key,
  sort        int default 0,
  photo_url   text,
  pos_y       int default 28,        -- 写真の表示位置(object-position の縦%)。顔が切れる時に調整。
  headline    text,
  facts       jsonb default '[]'::jsonb,  -- ✔の配列（文字列）
  name_label  text,
  active      boolean default true,
  created_at  timestamptz default now()
);
-- 写真の視覚調整（左右%・拡大%）。既存テーブルにも追加。
alter table cases add column if not exists pos_x int default 50;
alter table cases add column if not exists zoom  int default 100;
alter table cases enable row level security;
drop policy if exists "cases public read" on cases;
create policy "cases public read" on cases for select using (true);

-- 現在の4枚を初期投入（以降は admin で編集）
insert into cases (id,sort,photo_url,pos_y,headline,facts,name_label) values
 ('case1',1,'/images/case1.png',28,'“人”に惹かれて、愛知から古賀へ移住。','["愛知県瀬戸市 → 古賀市へ移住","正社員として、社長の右腕に","きっかけはイベント。社長の話に惹かれて"]','川上さん'),
 ('case2',2,'/images/case2.png',22,'まず話を聞いてみたら、道がひらけた。','["学習塾の運営・企画 → G''s福岡校の運営＋研修企画","条件より“ミッション共感”で決めた","“もっと話を聞きたい”から面談→入社"]','海部さん'),
 ('case3',3,'/images/case3.jpg',28,'同世代の挑戦に共感し、幹部候補へ。','["主体性×価値観の一致で採用","人事を担い、将来の幹部候補に","通勤の不安は、会社の支援で解消"]','池田さん'),
 ('case4',4,'/images/case4.png',28,'価値観の合う場所で、二人とも正社員に。','["スキルより“価値観の親和性”で採用","早川さん＝営業／北川さん＝SE（挑戦採用）","2025年、ともに入社"]','北川さん・早川さん')
on conflict (id) do nothing;
