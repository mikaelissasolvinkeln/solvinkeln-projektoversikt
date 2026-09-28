// Supabase Edge Function: extract-kalkyl
//
// Läser en uppladdad projektkalkyl (Excel, läst in och omvandlad till text
// per kalkylblad på klientsidan - INTE PDF, alla kalkyler har olika layout
// från blad till blad) och ber Claude tolka ut nyckeltalen, intäkterna,
// kostnaderna (grupperade) och ett förslag till finansieringsplan till ett
// förutsägbart format. Sparar ingenting själv - texten och resultatet finns
// bara i det här anropet, sedan är de borta.
//
// DEPLOY: Supabase Dashboard -> Edge Functions -> "Deploy a new function" -> "Via Editor"
// -> klistra in hela den här filen -> Deploy. Stäng AV "Verify JWT" för funktionen
// (Function -> Settings) - annars blockerar Supabase webbläsarens CORS-förfrågan
// innan den ens når koden. Funktionen kollar istället inloggningen själv nedan.
//
// SECRET: ingen ny secret behövs - återanvänder samma ANTHROPIC_API_KEY som
// redan är satt för de tidigare extract-funktionerna.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOOL = {
  name: 'extract_kalkyl',
  description:
    'Nyckeltalen, intäkterna, de grupperade kostnaderna och ett förslag till finansieringsplan ur en ' +
    'projektkalkyl (Excel) för ett bostadsprojekt under utvärdering. Kalkylbladens layout varierar mellan ' +
    'projekt (radantal, hustypnamn, etc). Gruppera kostnaderna under rubriker som normalt förekommer i den här ' +
    'sortens kalkyl, t.ex. "Anskaffningskostnad mark", "Byggherrekostnader", "Entreprenad" och "Finansiering" - ' +
    'använd samma gruppnamn när du känner igen dem, annars gruppens egen rubrik i kalkylen. Hoppa ALLTID över ' +
    'en rad som heter "Buffert aktier" under Entreprenad-gruppen - ta aldrig med den. Hoppa även över rena ' +
    'summerings-/delsummeringsrader (de räknas ut automatiskt av mottagaren). Gissa aldrig ett belopp du är ' +
    'osäker på - hoppa över raden istället.',
  input_schema: {
    type: 'object',
    properties: {
      projektnamn: { type: 'string', description: 'Projektets/föreningens namn, t.ex. "Brf Glömstahöjden" eller "glömsta 22 lgh"' },
      antalBostader: { type: 'number', description: 'Antal bostäder/lägenheter totalt' },
      boaTotal: { type: 'number', description: 'Total boarea (BOA) i kvadratmeter' },
      avkastningEgetKapital: { type: 'number', description: 'Beräknad avkastning på eget kapital per år som andel (t.ex. 0.15 för 15%), om ett giltigt numeriskt värde finns (hoppa över om t.ex. "#VALUE!" eller liknande felvärde)' },
      intakter: {
        type: 'array',
        description: 'En rad per intäktspost (t.ex. Insatser, BRF-lån/Föreningslån), i kr.',
        items: {
          type: 'object',
          properties: {
            namn: { type: 'string' },
            belopp: { type: 'number' },
          },
          required: ['namn', 'belopp'],
        },
      },
      kostnadsgrupper: {
        type: 'array',
        description: 'Kostnaderna grupperade under rubriker (se beskrivningen ovan för vilka gruppnamn som ska användas när de finns).',
        items: {
          type: 'object',
          properties: {
            grupp: { type: 'string', description: 'Rubriken på kostnadsgruppen' },
            poster: {
              type: 'array',
              description: 'Enskilda kostnadsposter i gruppen, i kr.',
              items: {
                type: 'object',
                properties: {
                  namn: { type: 'string' },
                  belopp: { type: 'number' },
                },
                required: ['namn', 'belopp'],
              },
            },
          },
          required: ['grupp', 'poster'],
        },
      },
      finansieringsforslag: {
        type: 'array',
        description: 'Förslag till finansieringsplan om kalkylen innehåller ett avsnitt om finansiering/byggkreditiv/insats/eget kapital, i kr. Får lämnas tom.',
        items: {
          type: 'object',
          properties: {
            namn: { type: 'string' },
            belopp: { type: 'number' },
          },
          required: ['namn', 'belopp'],
        },
      },
    },
    required: ['projektnamn'],
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Inte inloggad' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      });
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Ogiltig eller utgången inloggning' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      });
    }

    const { gridText, filename } = await req.json();
    if (!gridText) {
      return new Response(JSON.stringify({ error: 'Inget kalkylinnehåll skickades' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY är inte satt som secret för den här funktionen' }),
        { status: 500, headers: { ...CORS_HEADERS, 'content-type': 'application/json' } }
      );
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 4096,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'extract_kalkyl' },
        messages: [
          {
            role: 'user',
            content:
              'Det här är innehållet i en projektkalkyl (Excel), filnamn "' +
              (filename || 'okänd') +
              '", ett kalkylblad i taget separerat med "=== Blad: <namn> ===" och varje rad som "radnummer | cell1<TAB>cell2<TAB>...". ' +
              'Extrahera nyckeltalen, intäkterna, de grupperade kostnaderna och ett ev. förslag till ' +
              'finansieringsplan med verktyget extract_kalkyl.\n\n' +
              gridText,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(JSON.stringify({ error: 'Anthropic API-fel: ' + errText }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      });
    }

    const json = await anthropicRes.json();
    const toolUse = (json.content || []).find((b: any) => b.type === 'tool_use');
    if (!toolUse) {
      return new Response(
        JSON.stringify({ error: 'Kunde inte tolka kalkylen (inget strukturerat svar från modellen)' }),
        { status: 502, headers: { ...CORS_HEADERS, 'content-type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(toolUse.input), {
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
    });
  }
});
