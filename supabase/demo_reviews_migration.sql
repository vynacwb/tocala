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

-- Também atualiza instalações antigas nas quais a tabela foi criada sem a
-- chave usada pelo upsert do fluxo fictício.
alter table public.demo_reviews
  add column if not exists source_id text;

-- Preserva as avaliações existentes e limpa somente chaves repetidas antes
-- de criar a unicidade necessária para ON CONFLICT (source_id).
with duplicate_source_ids as (
  select id, row_number() over (partition by source_id order by created_at, id) as duplicate_number
  from public.demo_reviews
  where source_id is not null
)
update public.demo_reviews as review
set source_id = null
from duplicate_source_ids as duplicate
where review.id = duplicate.id
  and duplicate.duplicate_number > 1;

create unique index if not exists demo_reviews_source_id_uidx
  on public.demo_reviews (source_id);

create index if not exists demo_reviews_artist_created_at_idx
  on public.demo_reviews (artist_id, created_at desc);

grant usage on schema public to anon, authenticated;
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

-- Recarrega o cache do PostgREST usado pelo cliente Supabase.
notify pgrst, 'reload schema';
