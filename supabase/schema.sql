begin;

create extension if not exists "pgcrypto";

-- Dados públicos de autenticação. Credenciais permanecem exclusivamente em auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  username text unique,
  account_type text not null default 'MUSICO' check (account_type in ('MUSICO', 'ORGANIZADOR')),
  status text not null default 'ATIVO' check (status in ('ATIVO', 'INATIVO')),
  genre text not null default '',
  bio text not null default '',
  career text not null default '',
  avatar_url text not null default '',
  level integer not null default 0 check (level >= 0),
  rating numeric(3, 2) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.musician_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  stage_name text not null,
  bio_description text not null default '',
  format text check (format in ('SOLO', 'DUO', 'BANDA', 'DJ')),
  musical_genres text[] not null default '{}',
  base_fee numeric(10, 2) check (base_fee is null or base_fee >= 0),
  portfolio_links text[] not null default '{}',
  average_rating numeric(3, 2) not null default 0 check (average_rating between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  venue_or_company_name text not null,
  tax_id text unique,
  full_address text not null default '',
  venue_description text not null default '',
  average_rating numeric(3, 2) not null default 0 check (average_rating between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizer_profiles(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  requirements_description text not null default '',
  offered_fee numeric(10, 2) check (offered_fee is null or offered_fee >= 0),
  status text not null default 'ABERTO' check (status in ('ABERTO', 'EM_NEGOCIACAO', 'FECHADO', 'CONCLUIDO', 'CANCELADO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_valid_period check (ends_at > starts_at)
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  musician_id uuid not null references public.musician_profiles(id) on delete cascade,
  initiated_by text not null check (initiated_by in ('MUSICO', 'ORGANIZADOR')),
  negotiated_amount numeric(10, 2) check (negotiated_amount is null or negotiated_amount >= 0),
  status text not null default 'PENDENTE' check (status in ('PENDENTE', 'ACEITA', 'RECUSADA')),
  proposed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposals_event_musician_unique unique (event_id, musician_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  is_read boolean not null default false,
  sent_at timestamptz not null default now()
);

-- Mantém os nomes consumidos pela tela atual e associa a avaliação ao evento.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  artist_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null default '',
  author_avatar_url text not null default '',
  body text not null check (char_length(body) between 2 and 800),
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_participants_differ check (author_id <> artist_id),
  constraint reviews_event_author_artist_unique unique (event_id, author_id, artist_id)
);

create index if not exists musician_profiles_genres_idx on public.musician_profiles using gin (musical_genres);
create index if not exists events_organizer_idx on public.events (organizer_id);
create index if not exists events_status_starts_at_idx on public.events (status, starts_at);
create index if not exists proposals_event_idx on public.proposals (event_id);
create index if not exists proposals_musician_idx on public.proposals (musician_id);
create index if not exists messages_proposal_sent_at_idx on public.messages (proposal_id, sent_at);
create index if not exists reviews_artist_created_at_idx on public.reviews (artist_id, created_at desc);
create index if not exists reviews_event_idx on public.reviews (event_id);

alter table public.profiles enable row level security;
alter table public.musician_profiles enable row level security;
alter table public.organizer_profiles enable row level security;
alter table public.events enable row level security;
alter table public.proposals enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.musician_profiles, public.organizer_profiles, public.events, public.reviews to anon, authenticated;
grant insert on public.profiles to authenticated;
grant update (full_name, username, account_type, genre, bio, career, avatar_url) on public.profiles to authenticated;
grant insert, update, delete on public.musician_profiles, public.organizer_profiles, public.events to authenticated;
grant insert on public.proposals, public.messages, public.reviews to authenticated;
grant update (status, negotiated_amount) on public.proposals to authenticated;
grant update (is_read) on public.messages to authenticated;
grant update (body, rating), delete on public.reviews to authenticated;
grant select on public.proposals, public.messages to authenticated;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable" on public.profiles for select using (true);

drop policy if exists "Users insert their own profile" on public.profiles;
create policy "Users insert their own profile" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Musicians are publicly readable" on public.musician_profiles;
create policy "Musicians are publicly readable" on public.musician_profiles for select using (true);

drop policy if exists "Musicians manage their own profile" on public.musician_profiles;
create policy "Musicians manage their own profile" on public.musician_profiles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.profiles p where p.id = user_id and p.account_type = 'MUSICO')
  );

drop policy if exists "Organizers are publicly readable" on public.organizer_profiles;
create policy "Organizers are publicly readable" on public.organizer_profiles for select using (true);

drop policy if exists "Organizers manage their own profile" on public.organizer_profiles;
create policy "Organizers manage their own profile" on public.organizer_profiles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.profiles p where p.id = user_id and p.account_type = 'ORGANIZADOR')
  );

drop policy if exists "Events are publicly readable" on public.events;
create policy "Events are publicly readable" on public.events for select using (true);

drop policy if exists "Organizers manage their events" on public.events;
create policy "Organizers manage their events" on public.events for all to authenticated
  using (exists (select 1 from public.organizer_profiles o where o.id = organizer_id and o.user_id = (select auth.uid())))
  with check (exists (select 1 from public.organizer_profiles o where o.id = organizer_id and o.user_id = (select auth.uid())));

drop policy if exists "Participants read proposals" on public.proposals;
create policy "Participants read proposals" on public.proposals for select to authenticated
  using (
    exists (select 1 from public.musician_profiles m where m.id = musician_id and m.user_id = (select auth.uid()))
    or exists (
      select 1 from public.events e
      join public.organizer_profiles o on o.id = e.organizer_id
      where e.id = event_id and o.user_id = (select auth.uid())
    )
  );

drop policy if exists "Participants create proposals" on public.proposals;
create policy "Participants create proposals" on public.proposals for insert to authenticated
  with check (
    (initiated_by = 'MUSICO' and exists (
      select 1 from public.musician_profiles m where m.id = musician_id and m.user_id = (select auth.uid())
    ))
    or (initiated_by = 'ORGANIZADOR' and exists (
      select 1 from public.events e
      join public.organizer_profiles o on o.id = e.organizer_id
      where e.id = event_id and o.user_id = (select auth.uid())
    ))
  );

drop policy if exists "Participants update proposals" on public.proposals;
create policy "Participants update proposals" on public.proposals for update to authenticated
  using (
    exists (select 1 from public.musician_profiles m where m.id = musician_id and m.user_id = (select auth.uid()))
    or exists (
      select 1 from public.events e
      join public.organizer_profiles o on o.id = e.organizer_id
      where e.id = event_id and o.user_id = (select auth.uid())
    )
  )
  with check (
    exists (select 1 from public.musician_profiles m where m.id = musician_id and m.user_id = (select auth.uid()))
    or exists (
      select 1 from public.events e
      join public.organizer_profiles o on o.id = e.organizer_id
      where e.id = event_id and o.user_id = (select auth.uid())
    )
  );

drop policy if exists "Participants read messages" on public.messages;
create policy "Participants read messages" on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.proposals pr
      join public.musician_profiles m on m.id = pr.musician_id
      join public.events e on e.id = pr.event_id
      join public.organizer_profiles o on o.id = e.organizer_id
      where pr.id = proposal_id and (m.user_id = (select auth.uid()) or o.user_id = (select auth.uid()))
    )
  );

drop policy if exists "Participants send messages" on public.messages;
create policy "Participants send messages" on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.proposals pr
      join public.musician_profiles m on m.id = pr.musician_id
      join public.events e on e.id = pr.event_id
      join public.organizer_profiles o on o.id = e.organizer_id
      where pr.id = proposal_id and (m.user_id = (select auth.uid()) or o.user_id = (select auth.uid()))
    )
  );

drop policy if exists "Recipients mark messages as read" on public.messages;
create policy "Recipients mark messages as read" on public.messages for update to authenticated
  using (
    sender_id <> (select auth.uid())
    and exists (
      select 1 from public.proposals pr
      join public.musician_profiles m on m.id = pr.musician_id
      join public.events e on e.id = pr.event_id
      join public.organizer_profiles o on o.id = e.organizer_id
      where pr.id = proposal_id and (m.user_id = (select auth.uid()) or o.user_id = (select auth.uid()))
    )
  )
  with check (sender_id <> (select auth.uid()));

drop policy if exists "Reviews are publicly readable" on public.reviews;
create policy "Reviews are publicly readable" on public.reviews for select using (true);

drop policy if exists "Event participants create reviews" on public.reviews;
create policy "Event participants create reviews" on public.reviews for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.events e
      join public.organizer_profiles o on o.id = e.organizer_id
      join public.proposals pr on pr.event_id = e.id and pr.status = 'ACEITA'
      join public.musician_profiles m on m.id = pr.musician_id
      where e.id = event_id
        and e.status = 'CONCLUIDO'
        and (
          (o.user_id = (select auth.uid()) and m.user_id = artist_id)
          or (m.user_id = (select auth.uid()) and o.user_id = artist_id)
        )
    )
  );

drop policy if exists "Authors update their reviews" on public.reviews;
create policy "Authors update their reviews" on public.reviews for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

drop policy if exists "Authors delete their reviews" on public.reviews;
create policy "Authors delete their reviews" on public.reviews for delete to authenticated
  using (author_id = (select auth.uid()));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_username text;
  requested_type text;
begin
  generated_username := lower(regexp_replace(split_part(coalesce(new.email, 'artista'), '@', 1), '[^a-zA-Z0-9_]+', '', 'g'))
    || '-' || substr(new.id::text, 1, 6);
  requested_type := upper(coalesce(new.raw_user_meta_data ->> 'account_type', 'MUSICO'));

  if requested_type not in ('MUSICO', 'ORGANIZADOR') then
    requested_type := 'MUSICO';
  end if;

  insert into public.profiles (id, full_name, username, account_type)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), generated_username, requested_type)
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.refresh_review_stats(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_rating numeric(3, 2);
  new_count integer;
begin
  select coalesce(round(avg(r.rating)::numeric, 2), 0), count(*)::integer
  into new_rating, new_count
  from public.reviews r
  where r.artist_id = target_profile_id;

  update public.profiles set rating = new_rating, review_count = new_count, updated_at = now()
  where id = target_profile_id;
  update public.musician_profiles set average_rating = new_rating, updated_at = now()
  where user_id = target_profile_id;
  update public.organizer_profiles set average_rating = new_rating, updated_at = now()
  where user_id = target_profile_id;
end;
$$;

create or replace function public.handle_review_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_review_stats(old.artist_id);
    return old;
  elsif tg_op = 'INSERT' then
    perform public.refresh_review_stats(new.artist_id);
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.refresh_review_stats(old.artist_id);
    if new.artist_id <> old.artist_id then
      perform public.refresh_review_stats(new.artist_id);
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists musician_profiles_set_updated_at on public.musician_profiles;
create trigger musician_profiles_set_updated_at before update on public.musician_profiles for each row execute function public.set_updated_at();
drop trigger if exists organizer_profiles_set_updated_at on public.organizer_profiles;
create trigger organizer_profiles_set_updated_at before update on public.organizer_profiles for each row execute function public.set_updated_at();
drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();
drop trigger if exists proposals_set_updated_at on public.proposals;
create trigger proposals_set_updated_at before update on public.proposals for each row execute function public.set_updated_at();
drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at before update on public.reviews for each row execute function public.set_updated_at();
drop trigger if exists reviews_refresh_stats on public.reviews;
create trigger reviews_refresh_stats after insert or update or delete on public.reviews for each row execute function public.handle_review_stats();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

commit;
