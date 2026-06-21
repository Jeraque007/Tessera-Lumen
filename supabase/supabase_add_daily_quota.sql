-- Add daily quota tracking columns to subscriptions table
-- Run in Supabase Dashboard > SQL Editor

alter table public.subscriptions
  add column if not exists reads_per_day    int default null,
  add column if not exists daily_reads_used int default 0,
  add column if not exists daily_reset_date date default current_date;

-- Index for fast daily reset checks
create index if not exists idx_subscriptions_daily_reset
  on public.subscriptions(daily_reset_date);
