-- ============================================================
-- Tessera Lumen  Supabase Schema
-- Paste into: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. USER PROFILES
create table if not exists public.user_profiles (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  name       text,
  dob        text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique not null,
  plan_id            int not null,
  plan_name          text,
  reads_remaining    int,          -- null = unlimited
  reads_limit        int,          -- null = unlimited
  active             boolean default true,
  activated_at       timestamptz default now(),
  renewal_date       timestamptz,
  subscription_token text,
  updated_at         timestamptz default now()
);

-- 3. PAYMENT LOG  (immutable  never update, only insert)
create table if not exists public.payment_log (
  id              uuid primary key default gen_random_uuid(),
  payment_id      text unique not null,
  m_payment_id    text,
  email           text,
  name            text,
  amount          numeric(10,2),
  status          text,            -- COMPLETE | FAILED | CANCELLED
  plan_id         int,
  item_name       text,
  is_subscription boolean default false,
  raw_payload     jsonb,
  created_at      timestamptz default now()
);

-- 4. READING LOG
create table if not exists public.reading_log (
  id           uuid primary key default gen_random_uuid(),
  email        text,
  card_numbers int[],
  intention    text,
  plan_id      int,
  language     text default ''en'',
  created_at   timestamptz default now()
);

-- 5. TRANSLATION CACHE
create table if not exists public.translation_cache (
  cache_key    text primary key,
  lang         text not null,
  translations jsonb not null,
  created_at   timestamptz default now()
);

-- INDEXES
create index if not exists idx_subscriptions_email on public.subscriptions(email);
create index if not exists idx_payment_log_email   on public.payment_log(email);
create index if not exists idx_reading_log_email   on public.reading_log(email);
create index if not exists idx_reading_log_created on public.reading_log(created_at);

-- ROW LEVEL SECURITY
-- All tables are backend-only (service_role key).
-- No public/anon access.
alter table public.user_profiles     enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.payment_log       enable row level security;
alter table public.reading_log       enable row level security;
alter table public.translation_cache enable row level security;

-- UPDATED_AT trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

create or replace trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
