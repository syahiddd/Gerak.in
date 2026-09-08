-- Gerak.in schema — jalankan di Supabase Dashboard > SQL Editor.
-- Scope: DB + Auth dasar (email/password, RLS per-user).

-- 1. Profiles (1 row per auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- 2. Workouts
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise text not null,
  sets int not null default 0 check (sets >= 0),
  reps int not null default 0 check (reps >= 0),
  created_at timestamptz default now()
);
create index if not exists workouts_user_created_idx
  on public.workouts (user_id, created_at desc);

-- 3. Weekly progress (1 row per user+day)
create table if not exists public.weekly_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day text not null check (day in ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  completed boolean not null default false,
  updated_at timestamptz default now(),
  primary key (user_id, day)
);

-- 4. Quotes (public read)
create table if not exists public.quotes (
  id serial primary key,
  text text not null
);

insert into public.quotes (text) values
  ('Push yourself, because no one else is going to do it for you.'),
  ('The body achieves what the mind believes.'),
  ('Sweat is just fat crying.'),
  ('Small steps every day.'),
  ('Discipline > motivation.'),
  ('You don''t have to be extreme, just consistent.'),
  ('Your only competition is who you were yesterday.')
on conflict do nothing;

-- 5. RLS
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.weekly_progress enable row level security;
alter table public.quotes enable row level security;

drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "workouts_owner" on public.workouts;
create policy "workouts_owner" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "weekly_owner" on public.weekly_progress;
create policy "weekly_owner" on public.weekly_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "quotes_public_read" on public.quotes;
create policy "quotes_public_read" on public.quotes
  for select using (true);

-- 6. Exercise cache (katalog OSS, shared read, tulis via service/route)
create table if not exists public.exercise_cache (
  exercise_id text primary key,
  name text not null,
  target text,
  gif_url text,
  body_part text,
  updated_at timestamptz default now()
);
alter table public.exercise_cache enable row level security;
drop policy if exists "exercise_cache_public_read" on public.exercise_cache;
create policy "exercise_cache_public_read" on public.exercise_cache
  for select using (true);
-- Tulis dibatasi ke service_role di dashboard (anon tidak diberi policy insert/update).

-- 7. Exercise favorites (per-user)
create table if not exists public.exercise_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id text not null,
  name text not null,
  target text,
  gif_url text,
  created_at timestamptz default now(),
  unique (user_id, exercise_id)
);
create index if not exists favorites_user_idx
  on public.exercise_favorites (user_id, name);
alter table public.exercise_favorites enable row level security;
drop policy if exists "favorites_owner" on public.exercise_favorites;
create policy "favorites_owner" on public.exercise_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 8. Auto-create profile saat user daftar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
