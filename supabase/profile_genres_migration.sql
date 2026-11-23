-- Habilita vários estilos musicais por perfil e permite salvá-los.
alter table public.profiles
  add column if not exists genres text[] not null default '{}';

update public.profiles p
set genres = array(
  select btrim(value)
  from unnest(regexp_split_to_array(p.genre, '[·,]')) as parsed(value)
  where btrim(value) <> ''
)
where cardinality(p.genres) = 0 and btrim(p.genre) <> '';

grant update (genres) on public.profiles to authenticated;
