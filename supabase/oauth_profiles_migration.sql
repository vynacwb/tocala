-- Execute no SQL Editor para manter perfis reais vinculados a contas criadas
-- por e-mail, Google, LinkedIn OIDC ou Spotify.
begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_username text;
  requested_type text;
  provider_name text;
begin
  generated_username := lower(regexp_replace(split_part(coalesce(new.email, 'artista'), '@', 1), '[^a-zA-Z0-9_]+', '', 'g'))
    || '-' || substr(new.id::text, 1, 6);
  requested_type := upper(coalesce(new.raw_user_meta_data ->> 'account_type', 'MUSICO'));
  provider_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'preferred_username',
    ''
  );

  if requested_type not in ('MUSICO', 'ORGANIZADOR') then
    requested_type := 'MUSICO';
  end if;

  insert into public.profiles (id, full_name, real_name, username, account_type)
  values (new.id, provider_name, provider_name, generated_username, requested_type)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Recupera contas existentes que eventualmente tenham sido criadas antes do
-- trigger, sem alterar ou apagar perfis já configurados.
insert into public.profiles (id, full_name, real_name, username, account_type)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name', users.raw_user_meta_data ->> 'display_name', users.raw_user_meta_data ->> 'preferred_username', ''),
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name', users.raw_user_meta_data ->> 'display_name', users.raw_user_meta_data ->> 'preferred_username', ''),
  lower(regexp_replace(split_part(coalesce(users.email, 'artista'), '@', 1), '[^a-zA-Z0-9_]+', '', 'g')) || '-' || substr(users.id::text, 1, 6),
  'MUSICO'
from auth.users as users
where not exists (select 1 from public.profiles as profiles where profiles.id = users.id)
on conflict (id) do nothing;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Perfis privados continuam acessíveis ao próprio titular, mas deixam de ser
-- enumeráveis pela API pública até que profile_visible seja ativado.
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable" on public.profiles for select using (
  (profile_visible = true and status = 'ATIVO') or (select auth.uid()) = id
);

drop policy if exists "Artist availability is publicly readable" on public.artist_availability;
create policy "Artist availability is publicly readable" on public.artist_availability for select using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles p
    where p.id = user_id and p.profile_visible = true and p.status = 'ATIVO'
  )
);

drop policy if exists "Musicians are publicly readable" on public.musician_profiles;
create policy "Musicians are publicly readable" on public.musician_profiles for select using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles p
    where p.id = user_id and p.profile_visible = true and p.status = 'ATIVO'
  )
);

commit;
notify pgrst, 'reload schema';
