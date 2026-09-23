// Supabase Edge Function: extract-besiktningsprotokoll
//
// Läser ett uppladdat besiktningsprotokoll (PDF, skickat som base64 från
// klienten) för EN specifik lägenhet och ber Claude extrahera samtliga fel/
// bristfälligheter/anmärkningar ur felförteckningen (oftast en bilaga, t.ex.
// "Bilaga 1", med kolumnerna Del/Rum, Bet (E/B), Nr, Fel, Avhjälpt/signatur),
// samt vilken typ av besiktning det är och besiktningsdatumet. Sparar
// ingenting själv - filen och resultatet finns bara i det här anropet,
// sedan är de borta.
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
  name: 'extract_besiktningsprotokoll',
  description:
    'Felförteckningen ur ett besiktningsprotokoll för en lägenhet/hus (oftast en bilaga i slutet av dokumentet, ' +
    'med kolumnerna Del/Rum, Bet (E eller B), Nr, Fel, Avhjälpt/signatur), samt vilken typ av besiktning det är ' +
    '(t.ex. Förbesiktning, Slutbesiktning, Efterbesiktning, Garantibesiktning) och besiktningsdatumet. Hoppa över ' +
    'rader utan verkligt fel - t.ex. "Ua" (utan anmärkning), enbart bindestreck, eller helt tomma rader. Gissa aldrig.',
  input_schema: {
    type: 'object',
    properties: {
      typ: { type: 'string', description: 'Typ av besiktning, t.ex. "Slutbesiktning"' },
      datum: { type: 'string', description: 'Besiktningsdatum i formatet YYYY-MM-DD' },
      items: {
        type: 'array',
        description: 'En rad per verkligt fel/bristfällighet/anmärkning i felförteckningen, i dokumentets ordning.',
        items: {
          type: 'object',
          properties: {
            nr: { type: 'number', description: 'Ordningsnummer på felet, kolumnen "Nr"' },
            delRum: { type: 'string', description: 'Bygg- eller installationsdel / rum, kolumnen "Del/Rum"' },
            bet: { type: 'string', description: 'Beteckning E (entreprenören ansvarig) eller B (ej entreprenörens ansvar), om angivet' },
            fel: { type: 'string', description: 'Beskrivningen av felet/bristfälligheten/anmärkningen' },
          },
          required: ['fel'],
        },
      },
    },
    required: ['items'],
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

    const { pdfBase64, filename } = await req.json();
    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: 'Ingen fil skickades' }), {
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
        tool_choice: { type: 'tool', name: 'extract_besiktningsprotokoll' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
              {
                type: 'text',
                text:
                  'Det här är ett besiktningsprotokoll för en lägenhet/hus, filnamn "' +
                  (filename || 'okänd') +
                  '". Extrahera felförteckningen (bara raderna med verkliga fel), typ av besiktning och ' +
                  'besiktningsdatum med verktyget extract_besiktningsprotokoll.',
              },
            ],
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
        JSON.stringify({ error: 'Kunde inte tolka dokumentet (inget strukturerat svar från modellen)' }),
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
