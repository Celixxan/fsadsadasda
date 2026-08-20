-- Verdensbordet production schema for Supabase
-- Run in Supabase SQL Editor, then copy Project URL and Publishable Key into config.js.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'nb-NO',
  created_at timestamptz not null default now()
);

create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Verdensbordet',
  cadence text not null default 'weekly' check (cadence in ('weekly','monthly','flexible')),
  created_at timestamptz not null default now()
);

create table if not exists public.cookbook_entries (
  id uuid primary key,
  journey_id uuid not null references public.journeys(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null check (char_length(country_code) between 2 and 3),
  country_name text not null,
  dish_name text not null,
  cooked_at date not null,
  rating_person_1 smallint check (rating_person_1 between 1 and 5),
  rating_person_2 smallint check (rating_person_2 between 1 and 5),
  actual_minutes integer check (actual_minutes > 0),
  cost_nok numeric(10,2) check (cost_nok >= 0),
  roles text,
  personal_twist text,
  notes text,
  next_time text,
  memory text,
  photo_paths text[] not null default '{}',
  recipe_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cookbook_entries_owner_idx on public.cookbook_entries(owner_id, cooked_at desc);
create index if not exists cookbook_entries_country_idx on public.cookbook_entries(owner_id, country_code);

alter table public.profiles enable row level security;
alter table public.journeys enable row level security;
alter table public.cookbook_entries enable row level security;

create policy "Profiles are private" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Journeys are private" on public.journeys
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Cookbook entries are private" on public.cookbook_entries
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Users upload own meal photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read own meal photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own meal photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own meal photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
