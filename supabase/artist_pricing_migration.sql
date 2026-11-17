begin;

alter table public.profiles
  add column if not exists estimated_price numeric(10, 2),
  add column if not exists price_unit text not null default 'show',
  add column if not exists accepts_different_proposals boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_estimated_price_check;
alter table public.profiles
  add constraint profiles_estimated_price_check
  check (estimated_price is null or estimated_price >= 0);

alter table public.profiles
  drop constraint if exists profiles_price_unit_check;
alter table public.profiles
  add constraint profiles_price_unit_check
  check (price_unit in ('hourly', 'show'));

grant update (estimated_price, price_unit, accepts_different_proposals)
  on public.profiles to authenticated;

commit;
