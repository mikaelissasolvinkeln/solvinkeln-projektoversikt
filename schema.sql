-- ---------------------------------------------------------------------------
-- Projektöversikt - Supabase-schema
--
-- Körs EN gång i ert Supabase-projekts SQL Editor (Dashboard -> SQL Editor ->
-- New query -> klistra in hela filen -> Run). Se MIGRATION.md för hela
-- ordningen (skapa projekt -> köra denna fil -> skapa delat inloggningskonto
-- -> fylla i config.js).
-- ---------------------------------------------------------------------------

create table if not exists kv_store (
  key text primary key,
  value text not null,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table kv_store enable row level security;

-- Endast inloggade (det delade kontot alla fyra använder) får läsa/skriva.
-- Ingen anonym åtkomst, vilket skyddar persondata (köparnamn, telefon, mejl)
-- som annars låg oskyddad i window.storage.
create policy "authenticated read" on kv_store
  for select using (auth.role() = 'authenticated');

create policy "authenticated write" on kv_store
  for insert with check (auth.role() = 'authenticated');

create policy "authenticated update" on kv_store
  for update using (auth.role() = 'authenticated');

-- Realtid: gör att andra inloggade webbläsare får ett meddelande direkt när
-- en rad ändras (istället för dagens 30-minuters pollning).
alter publication supabase_realtime add table kv_store;

-- Från 2026-10-30 ger Supabase inte längre nya tabeller i "public" automatisk
-- åtkomst via Data API (supabase-js/PostgREST). Befintliga tabeller behåller
-- sina rättigheter, men vid ny installation/återställning måste de ges explicit.
grant select, insert, update on kv_store to authenticated;
grant select, insert, update, delete on kv_store to service_role;
