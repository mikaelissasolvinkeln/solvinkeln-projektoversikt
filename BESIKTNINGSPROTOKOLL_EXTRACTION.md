# Läsa in besiktningsprotokoll automatiskt (Entreprenad → Besiktningsprotokoll)

Under Entreprenad finns nu en flik **Besiktningsprotokoll**. Den visar en lista
med alla lägenheter (LGH, projektnummer, adress, kund) - klicka på en
lägenhet för att komma till dess besiktningar.

Där finns en knapp **"📄 Läs in besiktningsprotokoll (PDF)"**. Ladda upp
protokollet så läser Claude (AI-modellen) av felförteckningen (t.ex. "Bilaga
1") och skriver upp varje fel som en egen rad med en kryssruta för
"Avhjälpt". Typ av besiktning och besiktningsdatum plockas också med som
rubrik. Rader utan verkligt fel (t.ex. "Ua") tas inte med.

Man kan ladda upp flera protokoll per lägenhet över tid (t.ex. både
slutbesiktning och efterbesiktning) - varje uppladdning läggs till som ett
eget avsnitt, den skriver aldrig över tidigare inlästa protokoll. Inget
sparas utöver det som skrivs upp, och **PDF-filen sparas aldrig**.

Detta kräver att du deployar **ännu en** Supabase Edge Function (samma sätt
som de tidigare extract-funktionerna):

## 1. Deploya funktionen

1. Supabase Dashboard → **Edge Functions** → **Deploy a new function** → **Via Editor**
2. Namn på funktionen: `extract-besiktningsprotokoll` (måste stavas exakt så)
3. Öppna [supabase-functions/extract-besiktningsprotokoll/index.ts](supabase-functions/extract-besiktningsprotokoll/index.ts)
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

Entreprenad → Besiktningsprotokoll → klicka på en lägenhet → **"📄 Läs in
besiktningsprotokoll (PDF)"** → välj ett riktigt protokoll. Kontrollera att
felen och antalet stämmer mot dokumentet.

## Om något går fel

Statusraden visar felmeddelandet direkt. Om det inte räcker: Supabase
Dashboard → Edge Functions → `extract-besiktningsprotokoll` → **Logs**.
