-- ---------------------------------------------------------------------------
-- Personliga inloggningar - tabell för privat data per medarbetare.
--
-- Körs EN gång i Supabase SQL Editor (samma sätt som schema.sql tidigare).
-- Rör inte kv_store/RLS för den delade projektdatan - den fungerar exakt
-- som innan. Den här tabellen är NY och separat, med striktare policy
-- baserad på auth.uid() så var och en bara ser sin egen data.
-- ---------------------------------------------------------------------------

create table if not exists personal_data (
  user_id uuid not null references auth.users(id),
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table personal_data enable row level security;

create policy "read own personal data" on personal_data
  for select using (auth.uid() = user_id);

create policy "insert own personal data" on personal_data
  for insert with check (auth.uid() = user_id);

create policy "update own personal data" on personal_data
  for update using (auth.uid() = user_id);

-- Tabeller skapade via SQL Editor får INTE automatiskt de rättigheter PostgREST
-- kräver för att ens lista tabellen (annars ger den samma fel som om tabellen
-- inte fanns, "PGRST205"). RLS-policyerna ovan begränsar sen ändå varje rad
-- till ägaren - detta grant ger bara åtkomst till "authenticated" i stort.
grant select, insert, update on personal_data to authenticated;

-- Från 2026-10-30 (Supabase slutar auto-granta nya tabeller i "public"):
grant select, insert, update, delete on personal_data to service_role;
