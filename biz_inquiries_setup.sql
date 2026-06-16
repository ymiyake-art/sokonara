-- ============================================================
-- 法人LP（/biz/）問い合わせ保存テーブル
-- 設計方針：anon(匿名)には一切の権限を与えない。
--   書き込み・読み取りはすべて api/biz-inquiry.js（service_role）経由のみ。
--   → 「誰でも全件読める」事故を構造的に防ぐ（個人情報の漏洩対策）。
--   service_role は RLS をバイパスするため、ポリシーは不要。
-- Supabase SQL Editor で実行してください。
-- ============================================================

create table if not exists public.biz_inquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  company     text not null,           -- 会社名
  name        text not null,           -- お名前
  email       text not null,           -- メール
  tel         text,                    -- 電話（任意）
  size        text,                    -- 従業員規模（任意）
  message     text not null,           -- ご相談内容
  source      text,                    -- 流入元（'biz_lp'）
  user_agent  text,                    -- 参考情報
  handled     boolean not null default false  -- 対応済みフラグ（管理用）
);

create index if not exists biz_inquiries_created_at_idx
  on public.biz_inquiries (created_at desc);

-- RLS 有効化（ポリシー未定義＝anon/authenticated からはアクセス不可）
alter table public.biz_inquiries enable row level security;

-- 念のため anon / authenticated の権限を明示的に剥奪
revoke all on public.biz_inquiries from anon;
revoke all on public.biz_inquiries from authenticated;

-- 確認用：anon でアクセスできないこと、API(service_role)経由でのみ読み書きできることをテスト。
