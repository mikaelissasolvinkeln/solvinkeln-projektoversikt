# Läsa in ekonomisk plan/kostnadskalkyl automatiskt (nya projekt)

I Checklistan, när ett projekt inte har några lägenheter tillagda än, finns nu
en knapp **"📄 Läs in ekonomisk plan/kostnadskalkyl (PDF)"**. Ladda upp
dokumentet så läser Claude (AI-modellen) av hela lägenhetsförteckningen
(lägenhetsnummer, area, avgift, totalpris, ev. adress) och skapar
lägenheterna åt dig automatiskt - istället för att någon behöver skriva in
dem för hand eller be mig lägga in dem i koden.

Om dokumentet anger föreningens beräknade fastighetslån visas det beloppet i
statustexten efter inläsningen, men det sparas **inte** automatiskt - fyll i
det manuellt under Ekonomi → Budget → Föreningslån (det ligger i ett annat,
privat datalager som bara du har tillgång till).

Knappen skriver aldrig över en redan ifylld lägenhetslista - den syns bara
när listan är helt tom. Inget sparas utöver lägenhetsuppgifterna, och
**PDF-filen sparas aldrig**.

Detta kräver att du deployar **ännu en** Supabase Edge Function (samma sätt
som de tidigare extract-funktionerna):

## 1. Deploya funktionen

1. Supabase Dashboard → **Edge Functions** → **Deploy a new function** → **Via Editor**
2. Namn på funktionen: `extract-kostnadskalkyl` (måste stavas exakt så)
3. Öppna [supabase-functions/extract-kostnadskalkyl/index.ts](supabase-functions/extract-kostnadskalkyl/index.ts)
   här hos mig, kopiera hela innehållet, klistra in i editorn (ersätt exempelkoden)
4. **Innan du klickar Deploy**, kolla vad funktionen faktiskt heter i namnfältet
   högst upp - om det står ett auto-genererat namn, **säg till mig vad den
   heter** så uppdaterar jag anropet i appen direkt
5. Klicka **Deploy**
6. Gå till funktionens **Settings** → stäng av **"Verify JWT"**

## 2. Secret

Ingen ny secret behövs - funktionen återanvänder samma `ANTHROPIC_API_KEY` som
redan finns satt för de tidigare extract-funktionerna.

## 3. Testa

Öppna ett projekt utan lägenheter i Checklistan → **"📄 Läs in ekonomisk
plan/kostnadskalkyl (PDF)"** → välj en riktig ekonomisk plan eller
kostnadskalkyl. Kontrollera att lägenheterna stämmer mot dokumentet (antal,
area, avgift, totalpris).

## Om något går fel

Statusraden visar felmeddelandet direkt. Om det inte räcker: Supabase
Dashboard → Edge Functions → `extract-kostnadskalkyl` → **Logs**.
