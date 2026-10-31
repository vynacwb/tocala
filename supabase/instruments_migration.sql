-- Adiciona a lista de instrumentos ao perfil público e habilita seu salvamento.
alter table public.profiles
  add column if not exists instruments text[] not null default '{}';

grant update (instruments) on public.profiles to authenticated;
