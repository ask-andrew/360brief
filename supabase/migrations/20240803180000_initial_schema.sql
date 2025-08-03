-- Enable UUID extension
create extension if not exists "uuid-ossp" with schema extensions;

-- Create users table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  timezone text default 'UTC',
  digest_time time with time zone default '07:00:00+00',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint username_length check (char_length(full_name) >= 1)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policy for profiles
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a function to update the updated_at column
execute sql format('create or replace function public.update_updated_at_column()
  returns trigger as %s
  begin
    new.updated_at = timezone(''utc''::text, now());
    return new;
  end; %s', '$$', '$$ language plpgsql;');

-- Create a trigger to update the updated_at column
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

-- Create a table to store user preferences
create table public.user_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  key text not null,
  value jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, key)
);

-- Set up Row Level Security (RLS)
alter table public.user_preferences enable row level security;

-- Create policy for user_preferences
create policy "Users can view their own preferences." on public.user_preferences
  for select using (auth.uid() = user_id);

create policy "Users can insert their own preferences." on public.user_preferences
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own preferences." on public.user_preferences
  for update using (auth.uid() = user_id);

-- Create a trigger to update the updated_at column
create trigger handle_updated_at before update on public.user_preferences
  for each row execute procedure public.update_updated_at_column();
