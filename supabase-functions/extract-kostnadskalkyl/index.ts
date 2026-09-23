// Supabase Edge Function: extract-kostnadskalkyl
//
// Läser en uppladdad ekonomisk plan eller kostnadskalkyl (PDF, skickad som
// base64 från klienten) för ett HELT NYTT projekt utan lägenheter ännu, och
// ber Claude extrahera lägenhetsförteckningen (samma avsnitt som tidigare
// lästs in för hand: lgh nr, area kvm, årsavgift kr/mån, totalpris kr, ev.
// adress) samt föreningens beräknade fastighetslån. Sparar ingenting själv -
// filen och resultatet finns bara i det här anropet, sedan är de borta.
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
  name: 'extract_kostnadskalkyl',
  description:
    'Lägenhetsförteckningen och föreningslånet från en ekonomisk plan eller kostnadskalkyl för en bostadsrättsförening. ' +
    'Lägenhetsförteckningen finns oftast i ett avsnitt om lägenheter/lokaler (ofta avsnitt 6) som en tabell med en rad ' +
    'per lägenhet. Föreningens beräknade fastighetslån (även kallat föreningslån) finns oftast i ett avsnitt om ' +
    'finansiering/lån (ofta avsnitt 4). Fyll bara i värden du hittar tydligt angivna. Gissa aldrig.',
  input_schema: {
    type: 'object',
    properties: {
      apartments: {
        type: 'array',
        description: 'En rad per lägenhet/lokal i förteckningen, i den ordning de står i dokumentet.',
        items: {
          type: 'object',
          properties: {
            lgh: { type: 'string', description: 'Lägenhetsnummer, exakt som i dokumentet' },
            area: { type: 'number', description: 'Boarea i kvadratmeter' },
            avgift: { type: 'number', description: 'Årsavgift eller månadsavgift i kr - ange samma enhet som dokumentet anger' },
            totalpris: { type: 'number', description: 'Totalt pris/insats i kr' },
            address: { type: 'string', description: 'Adress för lägenheten, om det finns angivet i dokumentet' },
          },
        },
      },
      foreningslan: { type: 'number', description: 'Föreningens totala beräknade fastighetslån i kr, om det anges i dokumentet' },
    },
    required: ['apartments'],
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
        tool_choice: { type: 'tool', name: 'extract_kostnadskalkyl' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
              {
                type: 'text',
                text:
                  'Det här är en ekonomisk plan eller kostnadskalkyl för en bostadsrättsförening, filnamn "' +
                  (filename || 'okänd') +
                  '". Extrahera hela lägenhetsförteckningen (alla rader) och föreningens beräknade fastighetslån ' +
                  'med verktyget extract_kostnadskalkyl.',
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
