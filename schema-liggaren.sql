-- ---------------------------------------------------------------------------
-- Liggaren - ärenden som går att tilldela en kollega, med riktig
-- databasbehörighet: en rad syns ENDAST för den som skapade den och den den
-- är tilldelad till - ingen annan (inte ens via en bugg i appens UI, eftersom
-- detta styrs av Postgres self, inte av JavaScript-koden).
--
-- Körs EN gång i Supabase SQL Editor. Rör inte kv_store eller personal_data.
-- ---------------------------------------------------------------------------

create table if not exists liggaren_tasks (
  id uuid primary key default gen_random_uuid(),
  case_number text not null,
  title text not null,
  description text,
  comment text,
  project text,
  deadline date,
  priority int not null default 3,
  status text not null default 'oppet',
  created_by uuid not null references auth.users(id),
  created_by_name text not null,
  assigned_to uuid not null references auth.users(id),
  assigned_to_name text not null,
  notify_email boolean not null default false,
  notify_address text,
  mail_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table liggaren_tasks enable row level security;

create policy "read own or assigned tasks" on liggaren_tasks
  for select using (auth.uid() = created_by or auth.uid() = assigned_to);

create policy "insert as creator" on liggaren_tasks
  for insert with check (auth.uid() = created_by);

create policy "update own or assigned tasks" on liggaren_tasks
  for update using (auth.uid() = created_by or auth.uid() = assigned_to);

create policy "delete own tasks" on liggaren_tasks
  for delete using (auth.uid() = created_by);

-- Samma lärdom som personal_data: en tabell skapad via SQL Editor får inte
-- automatiskt de rättigheter PostgREST kräver - måste ges explicit.
grant select, insert, update, delete on liggaren_tasks to authenticated;

-- Tillagt senare: beskrivning (sätts vid skapande) och kommentar (kan skrivas
-- när som helst oavsett status, syns för båda parter eftersom det ligger på
-- samma rad). Ingår redan i create table-satsen ovan för nya installationer -
-- den här raden är bara för att uppdatera en databas som redan kört den gamla
-- versionen av detta script.
alter table liggaren_tasks add column if not exists description text;
alter table liggaren_tasks add column if not exists comment text;

-- Från 2026-10-30 (Supabase slutar auto-granta nya tabeller i "public"):
grant select, insert, update, delete on liggaren_tasks to service_role;
