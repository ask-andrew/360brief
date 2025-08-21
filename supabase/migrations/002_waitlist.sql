-- Waitlist table for beta invites
-- Ensure required extension for gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  role text,
  company_size text,
  tools text[] default '{}',
  pain_point text,
  must_haves text[] default '{}',
  delivery_pref text,
  style_pref text,
  willing_call boolean default false,
  source text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.waitlist enable row level security;

-- By default, deny everything; create explicit minimal policies.
-- No select for anon/auth (admin/service role bypasses RLS).
drop policy if exists "waitlist_insert_authenticated" on public.waitlist;
create policy "waitlist_insert_authenticated"
  on public.waitlist
  for insert
  to authenticated
  with check (true);

-- Optional: allow users to read their own row if you ever authenticate signups
drop policy if exists "waitlist_select_self" on public.waitlist;
create policy "waitlist_select_self"
  on public.waitlist
  for select
  to authenticated
  using (false);

-- Index for created_at to view latest signups quickly
create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);
