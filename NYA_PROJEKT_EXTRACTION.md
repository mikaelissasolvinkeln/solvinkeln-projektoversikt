# Läsa in projektkalkyler automatiskt (Ekonomi → Nya projekt)

Under Ekonomi finns nu en flik **Nya projekt** - för projektkalkyler ni
"räknar på" innan ni bestämt er för att gå vidare. Klicka **"📄 Läs in
projektkalkyl (Excel)"** och ladda upp kalkylfilen (samma sorts Excel-fil som
används idag, t.ex. "glömsta med 22 lgh.xlsx"). Claude läser av kalkylbladen
och skriver upp nyckeltalen (antal bostäder, BOA, intäkter/kostnad/resultat,
projektmarginal, avkastning eget kapital) samt kostnadsfördelningen i en fast
mall - oavsett hur just den kalkylen råkar vara upplagd.

Man kan ladda upp hur många kalkyler som helst - de hamnar bara i listan tills
man antingen klickar **"✓ Gör till projekt"** (skapar det som ett riktigt
projekt i Projektöversikt, med status "Kommande") eller tar bort dem.

Alla siffror går att klicka på och ändra direkt, både i nyckeltalen och i
kostnadsfördelningen - även efter att kalkylen lästs in.

**"Dela med investerare"** skapar en länk som visar en ren investeringspropå
med samma fasta mall, som går att öppna av vem som helst **utan inloggning**.
Länken visar bara det enskilda projektet den pekar på - inga andra projekt
eller privat information är synlig via den. "Sluta dela" stänger länken igen.

Ingen Excel-fil sparas - bara de siffror Claude läser ut.

## 1. Deploya funktionen

1. Supabase Dashboard → **Edge Functions** → **Deploy a new function** → **Via Editor**
2. Namn på funktionen: `extract-kalkyl` (måste stavas exakt så)
3. Öppna [supabase-functions/extract-kalkyl/index.ts](supabase-functions/extract-kalkyl/index.ts)
   här hos mig, kopiera hela innehållet, klistra in i editorn (ersätt exempelkoden)
4. **Innan du klickar Deploy**, kolla vad funktionen faktiskt heter i namnfältet
   högst upp - om det står ett auto-genererat namn, **säg till mig vad den
   heter** så uppdaterar jag anropet i appen direkt
5. Klicka **Deploy**
6. Gå till funktionens **Settings** → stäng av **"Verify JWT"**

## 2. Secret

Ingen ny secret behövs - funktionen återanvänder samma `ANTHROPIC_API_KEY` som
redan finns satt för de tidigare extract-funktionerna.

## 3. Databas

En ny tabell `nya_projekt` med egen behörighet (se
[schema-nya-projekt.sql](schema-nya-projekt.sql)) - den enda tabellen i appen
där en enskild rad kan bli läsbar utan inloggning, just för att
investeringspropå-länken ska fungera. Redan körd i er databas.

## 4. Testa

Ekonomi → Nya projekt → **"📄 Läs in projektkalkyl (Excel)"** → välj en
riktig kalkylfil. Kontrollera att nyckeltalen stämmer mot filen, testa att
ändra en siffra, och testa "Dela med investerare" i en privat/inkognitoflik
för att se att länken fungerar utan att vara inloggad.

## Om något går fel

Statusraden visar felmeddelandet direkt. Om det inte räcker: Supabase
Dashboard → Edge Functions → `extract-kalkyl` → **Logs**.
