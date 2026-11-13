-- ---------------------------------------------------------------------------
-- Nya projekt och delningslänkar - stramare åtkomst
--
-- Körs EN gång i Supabase SQL Editor (Dashboard -> SQL Editor -> New query ->
-- klistra in hela filen -> Run). Kan köras flera gånger utan skada.
--
-- Före den här ändringen:
--   * alla inloggade konton kunde läsa och ändra hela tabellen nya_projekt
--   * vem som helst kunde lista ALLA delade rader (kalkyler, bolagsrapporter
--     och ägarrapporten) utan att känna till någon länk
--
-- Efter:
--   * bara Mikaels konto kan läsa och ändra tabellen
--   * en delad rad lämnas bara ut till den som har exakt rätt länk (share_id),
--     via funktionen nya_projekt_delad - det går inte längre att lista delade rader
--
-- VIKTIGT: appen måste vara version 20261113 eller senare innan filen körs
-- (db.js använder då funktionen nedan). Annars slutar delningslänkarna fungera.
-- ---------------------------------------------------------------------------

-- Är den inloggade Mikael?
create or replace function app_is_admin() returns boolean
  language sql stable as $$
    select lower(coalesce(auth.jwt() ->> 'email', '')) = 'mikael.issa@jwk.se'
  $$;

-- Ta bort de gamla, öppna reglerna
drop policy if exists "authenticated read" on nya_projekt;
drop policy if exists "authenticated insert" on nya_projekt;
drop policy if exists "authenticated update" on nya_projekt;
drop policy if exists "authenticated delete" on nya_projekt;
drop policy if exists "public read when shared" on nya_projekt;
drop policy if exists "admin read" on nya_projekt;
drop policy if exists "admin insert" on nya_projekt;
drop policy if exists "admin update" on nya_projekt;
drop policy if exists "admin delete" on nya_projekt;

-- Bara Mikael läser och ändrar tabellen
create policy "admin read" on nya_projekt
  for select using (app_is_admin());
create policy "admin insert" on nya_projekt
  for insert with check (app_is_admin());
create policy "admin update" on nya_projekt
  for update using (app_is_admin()) with check (app_is_admin());
create policy "admin delete" on nya_projekt
  for delete using (app_is_admin());

-- Delningslänkar: lämnar ut EN rad, och bara om share_id stämmer exakt och raden är delad.
create or replace function nya_projekt_delad(p_share_id text) returns setof nya_projekt
  language sql stable security definer set search_path = public as $$
    select * from nya_projekt
    where share_id = p_share_id and is_public = true
    limit 1
  $$;

revoke all on function nya_projekt_delad(text) from public;
grant execute on function nya_projekt_delad(text) to anon, authenticated;
grant execute on function app_is_admin() to anon, authenticated;

-- Oinloggade får inte längre läsa tabellen direkt, bara via funktionen ovan.
revoke select on nya_projekt from anon;
