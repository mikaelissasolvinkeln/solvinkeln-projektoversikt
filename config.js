// ---------------------------------------------------------------------------
// Konfiguration för Projektöversikt.
// Så länge SUPABASE_URL nedan börjar med "YOUR_" körs appen i LOKALT TESTLÄGE:
// all data sparas bara i din egen webbläsare (localStorage), ingen delning mellan
// användare. Det gör att appen går att testa direkt utan något Supabase-konto.
//
// När ni skapat ert Supabase-projekt (se MIGRATION.md), klistra in de riktiga
// värdena här. Ingen annan kod behöver ändras - appen växlar automatiskt över
// till att spara/dela data via Supabase istället.
// ---------------------------------------------------------------------------

window.SUPABASE_URL = 'https://nntrsltognfkfsmmvbss.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udHJzbHRvZ25ma2ZzbW12YnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDM3NjcsImV4cCI6MjEwMjcxOTc2N30.RR2vAezNa9fc7UJbO02IngfLaArZPtlAZgfjXBeYYBE';

// Den delade koden alla fyra loggar in med (byt till något ni själva väljer).
// I lokalt testläge jämförs koden direkt mot detta värde.
// I Supabase-läge loggar koden in mot ett delat Auth-konto - se MIGRATION.md
// för hur ni skapar det kontot (SHARED_AUTH_EMAIL nedan måste matcha).
window.ACCESS_CODE = '1234';
window.SHARED_AUTH_EMAIL = 'mikael.issa@solvinkeln.se';
