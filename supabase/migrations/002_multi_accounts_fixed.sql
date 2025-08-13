-- 002_multi_accounts_fixed.sql
-- Add table to support multiple connected accounts per user with labeling

create table if not exists public.user_connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('google')),
  provider_account_id text not null, -- e.g., Google user sub
  email text not null,
  account_type text not null default 'personal' check (account_type in ('personal','business')),
  scopes text[] not null default '{}',
  access_token text not null,
  refresh_token text not null,
  token_type text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_account_id)
);

-- Helpful index for queries by user
create index if not exists idx_user_connected_accounts_user on public.user_connected_accounts(user_id);

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_user_connected_accounts_updated
before update on public.user_connected_accounts
for each row execute function public.set_updated_at();

-- Enable RLS and policies for per-user access control
alter table public.user_connected_accounts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'user_connected_accounts' 
    and policyname = 'Users manage their own connected accounts'
  ) then
    create policy "Users manage their own connected accounts"
      on public.user_connected_accounts
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;
