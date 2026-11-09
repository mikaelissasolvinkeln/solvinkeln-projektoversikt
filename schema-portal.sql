-- ---------------------------------------------------------------------------
-- Ägarportal (Prosavio) - Supabase-schema
--
-- Körs EN gång i Supabase SQL Editor (Dashboard -> SQL Editor -> New query ->
-- klistra in hela filen -> Run).
--
-- Ägarna i Prosavio loggar in med egna konton (Authentication -> Users ->
-- "Add user", e-post + lösenord, bocka i "Auto Confirm User"). När en
-- inloggad e-post finns i portal_users visas bara ägarportalen - inte
-- projektöversikten. Rapporten de ser är en ögonblicksbild (portal_rapport)
-- som Mikael publicerar från Koncern -> Bolag -> "Publicera ägarrapport".
-- ---------------------------------------------------------------------------

create table if not exists portal_users (
  email text primary key,
  namn text,
  created_at timestamptz not null default now()
);

create table if not exists portal_rapport (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  published_at timestamptz not null default now(),
  published_by text
);

alter table portal_users enable row level security;
alter table portal_rapport enable row level security;

-- Hjälpfunktioner: inloggad e-post (gemener) och om den är administratör
-- (Mikael) respektive ägare i portalen.
create or replace function portal_email() returns text
  language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function portal_is_admin() returns boolean
  language sql stable as $$ select portal_email() = 'mikael.issa@jwk.se' $$;

create or replace function portal_is_owner() returns boolean
  language sql stable security definer as $$
    select exists (select 1 from portal_users where lower(email) = portal_email())
  $$;

-- portal_users: var och en ser sin egen rad (så appen vet att visa portalen),
-- Mikael ser och hanterar alla.
drop policy if exists "portal_users own row" on portal_users;
create policy "portal_users own row" on portal_users
  for select using (lower(email) = portal_email() or portal_is_admin());
drop policy if exists "portal_users admin write" on portal_users;
create policy "portal_users admin write" on portal_users
  for all using (portal_is_admin()) with check (portal_is_admin());

-- portal_rapport: ägare och Mikael läser, bara Mikael skriver.
drop policy if exists "portal_rapport read" on portal_rapport;
create policy "portal_rapport read" on portal_rapport
  for select using (portal_is_owner() or portal_is_admin());
drop policy if exists "portal_rapport admin write" on portal_rapport;
create policy "portal_rapport admin write" on portal_rapport
  for all using (portal_is_admin()) with check (portal_is_admin());

grant select, insert, update, delete on portal_users to authenticated;
grant select, insert, update, delete on portal_rapport to authenticated;
grant select, insert, update, delete on portal_users to service_role;
grant select, insert, update, delete on portal_rapport to service_role;
grant execute on function portal_email() to authenticated, anon;
grant execute on function portal_is_admin() to authenticated, anon;
grant execute on function portal_is_owner() to authenticated, anon;

-- Ägarna (lägg till/ta bort rader här eller via Table Editor). E-post jämförs
-- skiftlägesokänsligt.
insert into portal_users (email, namn) values
  ('mikael.wiklund@prosavio.se', 'Mikael Wiklund'),
  ('aygun.akkurt@prosavio.se', 'Aygun Akkurt'),
  ('saman.haake@solvinkeln.se', 'Saman Haake'),
  ('robert.bekil@prosavio.se', 'Robert Bekil')
on conflict (email) do nothing;
