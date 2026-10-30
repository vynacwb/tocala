-- Execute este arquivo para atualizar um banco que já recebeu schema.sql anteriormente.
create table if not exists public.demo_reviews (
  id uuid primary key default gen_random_uuid(),
  source_id text unique,
  artist_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null default 'Contratante fictício',
  body text not null default '' check (char_length(body) <= 800),
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  constraint demo_reviews_author_artist_differ check (author_id <> artist_id)
);

create index if not exists demo_reviews_artist_created_at_idx
  on public.demo_reviews (artist_id, created_at desc);

alter table public.demo_reviews enable row level security;
grant select on public.demo_reviews to anon, authenticated;
grant insert on public.demo_reviews to authenticated;

drop policy if exists "Demo reviews are publicly readable" on public.demo_reviews;
create policy "Demo reviews are publicly readable" on public.demo_reviews
  for select using (true);

drop policy if exists "Authenticated users add demo reviews" on public.demo_reviews;
create policy "Authenticated users add demo reviews" on public.demo_reviews
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and artist_id <> (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = artist_id
        and p.account_type = 'MUSICO'
        and p.profile_visible = true
        and p.status = 'ATIVO'
    )
  );
