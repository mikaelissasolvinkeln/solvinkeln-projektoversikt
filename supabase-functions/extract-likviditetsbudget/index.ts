// Supabase Edge Function: extract-likviditetsbudget
//
// Läser en uppladdad likviditetsbudget (Excel, läst in och omvandlad till text
// på klientsidan - INTE PDF). En likviditetsbudget har rader (t.ex. "Byggnadskreditiv",
// "Entreprenadkostnad", "Insatser") och en kolumn per kalendermånad över hela
// projektets löptid, ofta uppdelat i flera år på egna rubrikrader ovanför
// månadsraden. Ber Claude läsa av varje rad och lägga varje månads belopp under
// rätt YYYY-MM. Sparar ingenting själv - texten och resultatet finns bara i det
// här anropet, sedan är de borta.
//
// DEPLOY: Supabase Dashboard -> Edge Functions -> "Deploy a new function" -> "Via Editor"
// -> döp funktionen till exakt "extract-likviditetsbudget" -> klistra in hela den här
// filen -> Deploy. Stäng AV "Verify JWT" för funktionen (Function -> Settings) - annars
// blockerar Supabase webbläsarens CORS-förfrågan innan den ens når koden. Funktionen
// kollar istället inloggningen själv nedan.
//
// SECRET: ingen ny secret behövs - återanvänder samma ANTHROPIC_API_KEY som
// redan är satt för de tidigare extract-funktionerna.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOOL = {
  name: 'extract_likviditetsbudget',
  description:
    'Rader och månadsbelopp ur en likviditetsbudget (Excel) för ett bostadsprojekt. Budgeten har en rad ' +
    'per post (t.ex. "Byggnadskreditiv", "Entreprenadkostnad", "Markförvärv", "Insatser", "Tillträde", ' +
    '"Föreningslån") och en kolumn per kalendermånad över hela projektets löptid - månaderna står ofta som ' +
    'en egen rad med bara månadsnamn (t.ex. "Januari", "Februari"), med årtalen på en RUBRIKRAD ovanför ' +
    '(t.ex. "2025", "2026", "2027") som gäller för flera månadskolumner i följd tills nästa årtal. Räkna ' +
    'ut varje kolumns riktiga år genom att kombinera månadsnamnet med det årtal som står ovanför just den ' +
    'kolumnen. Hoppa ALLTID över summerings-/delsummeringsrader (t.ex. "Summa inbetalningar", "Summa ' +
    'utbetalningar", "Månadens saldo", "Kassa", "IB", "Försäljningsgrad") - de räknas ut automatiskt av ' +
    'mottagaren. Hoppa även över en eventuell separat sidotabell om finansiering av anskaffningen som inte ' +
    'är en del av månadsrutnätet. Gissa aldrig ett belopp eller en månad du är osäker på - hoppa över den ' +
    'cellen istället.',
  input_schema: {
    type: 'object',
    properties: {
      rader: {
        type: 'array',
        description: 'En rad per budgetpost.',
        items: {
          type: 'object',
          properties: {
            namn: { type: 'string', description: 'Postens namn, t.ex. "Byggnadskreditiv" eller "Insatser"' },
            typ: { type: 'string', enum: ['intakt', 'kostnad'], description: '"intakt" om raden står under en rubrik som Intäkter/Inbetalningar, annars "kostnad"' },
            manader: {
              type: 'array',
              description: 'En post per månad där raden har ett belopp (utelämna månader utan värde).',
              items: {
                type: 'object',
                properties: {
                  manad: { type: 'string', description: 'Format YYYY-MM, t.ex. "2026-05"' },
                  belopp: { type: 'number', description: 'Belopp i kr för just den månaden. Negativa tal (utbetalningar skrivna med minus) skrivs som positiva - typ avgör riktningen.' },
                },
                required: ['manad', 'belopp'],
              },
            },
          },
          required: ['namn', 'typ', 'manader'],
        },
      },
    },
    required: ['rader'],
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
      return new Response(JSON.stringify({ error: 'Inget budgetinnehåll skickades' }), {
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
        max_tokens: 16000,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'extract_likviditetsbudget' },
        messages: [
          {
            role: 'user',
            content:
              'Det här är innehållet i en likviditetsbudget (Excel), filnamn "' +
              (filename || 'okänd') +
              '", ett kalkylblad i taget separerat med "=== Blad: <namn> ===" och varje rad som "radnummer | cell1<TAB>cell2<TAB>...". ' +
              'Extrahera alla rader och deras månadsbelopp med verktyget extract_likviditetsbudget.\n\n' +
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
        JSON.stringify({ error: 'Kunde inte tolka budgeten (inget strukturerat svar från modellen)' }),
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
