-- Shared fictitious contracts and in-app notifications between authenticated users.
create table if not exists public.simulated_contracts (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles(id) on delete cascade,
  contractor_id uuid not null references public.profiles(id) on delete cascade,
  artist_name text not null default '',
  artist_genre text not null default '',
  draft jsonb not null check (jsonb_typeof(draft) = 'object'),
  status text not null default 'pending_artist' check (status in ('pending_artist', 'adjustment_requested', 'awaiting_payment', 'awaiting_checkin', 'completed', 'reviewed')),
  change_request text,
  contractor_checked_in boolean not null default false,
  artist_checked_in boolean not null default false,
  contractor_review jsonb,
  artist_review jsonb,
  accepted_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  contract_id uuid not null references public.simulated_contracts(id) on delete cascade,
  title text not null,
  detail text not null,
  type text not null default 'general' check (type in ('general', 'contract-proposal', 'contract-accepted', 'contract-payment', 'contract-checkin', 'contract-completed')),
  href text,
  action_label text,
  simulation_role text check (simulation_role in ('contractor', 'artist')),
  read boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists simulated_contracts_artist_created_idx on public.simulated_contracts (artist_id, created_at desc);
create index if not exists simulated_contracts_contractor_created_idx on public.simulated_contracts (contractor_id, created_at desc);
create index if not exists user_notifications_recipient_created_idx on public.user_notifications (recipient_id, created_at desc);

alter table public.simulated_contracts enable row level security;
alter table public.user_notifications enable row level security;

grant select, insert on public.simulated_contracts to authenticated;
revoke update on public.simulated_contracts from authenticated;
grant update (
  draft, status, change_request, contractor_checked_in, artist_checked_in,
  contractor_review, artist_review, accepted_at, paid_at
) on public.simulated_contracts to authenticated;
grant select, insert, update, delete on public.user_notifications to authenticated;

drop policy if exists "Contract participants read simulations" on public.simulated_contracts;
create policy "Contract participants read simulations" on public.simulated_contracts
  for select to authenticated
  using ((select auth.uid()) in (artist_id, contractor_id));

drop policy if exists "Contractors create simulations" on public.simulated_contracts;
create policy "Contractors create simulations" on public.simulated_contracts
  for insert to authenticated
  with check ((select auth.uid()) = contractor_id);

drop policy if exists "Contract participants update simulations" on public.simulated_contracts;
create policy "Contract participants update simulations" on public.simulated_contracts
  for update to authenticated
  using ((select auth.uid()) in (artist_id, contractor_id))
  with check ((select auth.uid()) in (artist_id, contractor_id));

drop policy if exists "Recipients read notifications" on public.user_notifications;
create policy "Recipients read notifications" on public.user_notifications
  for select to authenticated
  using ((select auth.uid()) = recipient_id);

drop policy if exists "Contract participants create notifications" on public.user_notifications;
create policy "Contract participants create notifications" on public.user_notifications
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.simulated_contracts contract
      where contract.id = contract_id
        and (select auth.uid()) in (contract.artist_id, contract.contractor_id)
        and recipient_id in (contract.artist_id, contract.contractor_id)
    )
  );

drop policy if exists "Recipients update notifications" on public.user_notifications;
create policy "Recipients update notifications" on public.user_notifications
  for update to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

drop policy if exists "Recipients delete notifications" on public.user_notifications;
create policy "Recipients delete notifications" on public.user_notifications
  for delete to authenticated
  using ((select auth.uid()) = recipient_id);

create or replace function public.validate_simulated_contract_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.artist_id <> old.contractor_id and (select auth.uid()) = old.artist_id then
    if new.paid_at is distinct from old.paid_at
      or new.contractor_checked_in is distinct from old.contractor_checked_in
      or new.contractor_review is distinct from old.contractor_review then
      raise exception 'artist cannot update contractor fields';
    end if;
  elsif old.artist_id <> old.contractor_id and (select auth.uid()) = old.contractor_id then
    if new.artist_checked_in is distinct from old.artist_checked_in
      or new.artist_review is distinct from old.artist_review
      or new.change_request is distinct from old.change_request then
      raise exception 'contractor cannot update artist fields';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists simulated_contracts_validate_update on public.simulated_contracts;
create trigger simulated_contracts_validate_update
  before update on public.simulated_contracts
  for each row execute function public.validate_simulated_contract_update();

drop trigger if exists simulated_contracts_set_updated_at on public.simulated_contracts;
create trigger simulated_contracts_set_updated_at
  before update on public.simulated_contracts
  for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'simulated_contracts'
  ) then
    alter publication supabase_realtime add table public.simulated_contracts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_notifications'
  ) then
    alter publication supabase_realtime add table public.user_notifications;
  end if;
end $$;
