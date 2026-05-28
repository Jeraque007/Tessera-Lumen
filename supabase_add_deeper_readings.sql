-- Deeper reading orders table
-- Run in Supabase Dashboard > SQL Editor

create table if not exists public.deeper_readings (
  id              uuid primary key default gen_random_uuid(),
  payment_id      text unique not null,
  email           text not null,
  name            text,
  amount_zar      numeric(10,2),
  status          text not null default ''pending'',  -- pending | complete | failed
  image_url       text,                               -- uploaded image (future: storage bucket)
  image_data      text,                               -- base64 fallback
  delivered       boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_deeper_readings_email  on public.deeper_readings(email);
create index if not exists idx_deeper_readings_status on public.deeper_readings(status);

alter table public.deeper_readings enable row level security;

create or replace trigger trg_deeper_readings_updated_at
  before update on public.deeper_readings
  for each row execute function public.set_updated_at();
