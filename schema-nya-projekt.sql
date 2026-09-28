-- ---------------------------------------------------------------------------
-- Nya projekt (projektkalkyler under utvärdering) - Supabase-schema
--
-- Körs EN gång i Supabase-projektets SQL Editor (Dashboard -> SQL Editor ->
-- New query -> klistra in hela filen -> Run).
--
-- Skiljer sig från kv_store/personal_data genom att en rad kan göras publikt
-- läsbar (utan inloggning) när Mikael väljer att dela den som en
-- investeringspropå - därför en egen tabell med egen RLS istället för att
-- återanvända det befintliga, alltid-inloggat-krävande lagret.
-- ---------------------------------------------------------------------------

create table if not exists nya_projekt (
  id text primary key,
  share_id text unique not null,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  status text not null default 'candidate', -- 'candidate' | 'promoted'
  promoted_project_id text,
  created_by text,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table nya_projekt enable row level security;

-- Alla inloggade (samma delade konto-modell som resten av appen) ser och kan
-- hantera hela listan med kandidatprojekt.
create policy "authenticated read" on nya_projekt
  for select using (auth.role() = 'authenticated');

create policy "authenticated insert" on nya_projekt
  for insert with check (auth.role() = 'authenticated');

create policy "authenticated update" on nya_projekt
  for update using (auth.role() = 'authenticated');

create policy "authenticated delete" on nya_projekt
  for delete using (auth.role() = 'authenticated');

-- Publik, oinloggad läsning ENDAST för de rader Mikael uttryckligen märkt
-- som delade (investeringspropå-länken) - och bara den enskilda raden man
-- redan har länken (share_id) till, aldrig en lista av alla projekt.
create policy "public read when shared" on nya_projekt
  for select using (is_public = true);

alter publication supabase_realtime add table nya_projekt;
