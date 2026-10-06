create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  username text unique,
  genre text not null default '',
  bio text not null default '',
  career text not null default '',
  avatar_url text not null default '',
  level integer not null default 0 check (level >= 0),
  rating numeric(2, 1) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  author_avatar_url text not null default '',
  body text not null check (char_length(body) between 2 and 800),
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.reviews enable row level security;

create policy "Perfis são públicos para leitura"
  on public.profiles for select using (true);

create policy "Usuários editam o próprio perfil"
  on public.profiles for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Usuários criam o próprio perfil"
  on public.profiles for insert with check ((select auth.uid()) = id);

create policy "Avaliações são públicas para leitura"
  on public.reviews for select using (true);

create policy "Usuários autenticados criam avaliações"
  on public.reviews for insert to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Autores removem suas avaliações"
  on public.reviews for delete using ((select auth.uid()) = author_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
