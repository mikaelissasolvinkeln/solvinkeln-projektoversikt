// Supabase Edge Function: extract-mark-fastigheter
//
// Läser en uppladdad Excel-lista med fastigheter (läst in och omvandlad till
// text på klientsidan) och ber Claude läsa ut en rad per fastighet:
// fastighetsbeteckning, ort, anskaffningsbelopp/förvärvspris, vattenanslutning
// och gatukostnad. Sparar ingenting själv.
//
// DEPLOY: Supabase Dashboard -> Edge Functions -> "Deploy a new function" -> "Via Editor"
// -> döp funktionen till exakt "extract-mark-fastigheter" -> klistra in hela den här
// filen -> Deploy. Stäng AV "Verify JWT" (Function -> Settings) - funktionen kollar
// inloggningen själv nedan.
//
// SECRET: ingen ny secret behövs - återanvänder ANTHROPIC_API_KEY.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOOL = {
  name: 'extract_mark_fastigheter',
  description:
    'Fastigheterna ur en Excel-lista för ett markförvärv - en rad per fastighet. Kolumnrubrikerna ' +
    'varierar: förvärvspriset kan heta t.ex. "Anskaffningsbelopp", "Förvärvspris", "Köpeskilling" eller ' +
    '"Pris"; ett eventuellt aktieköp (marken köps ibland uppdelat i köp av fastighet och köp av aktier) ' +
    '"Aktieköp", "Aktier" eller "Köpeskilling aktier"; vattenanslutningen "Vattenanslutning", "VA", ' +
    '"VA-anslutning" eller "Anslutningsavgift"; gatukostnaden "Gatukostnad" eller ' +
    '"Gatukostnadsersättning". Fastighetsbeteckningen är namnet på ' +
    'fastigheten (t.ex. "Gladö 76:5"). Hoppa över rubrikrader och summeringsrader (t.ex. "Summa", ' +
    '"Totalt"). Belopp i kr utan tusentalsavgränsare. Gissa aldrig ett belopp - lämna fältet tomt istället.',
  input_schema: {
    type: 'object',
    properties: {
      fastigheter: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            fastighetsbeteckning: { type: 'string' },
            ort: { type: 'string' },
            forvarvspris: { type: 'number', description: 'Anskaffningsbelopp/förvärvspris för själva fastigheten i kr' },
            aktiekop: { type: 'number', description: 'Belopp för aktieköp i kr, om förvärvet delvis sker via aktier' },
            vattenanslutning: { type: 'number', description: 'Vattenanslutningsbelopp i kr' },
            gatukostnad: { type: 'number', description: 'Gatukostnad i kr' },
          },
          required: ['fastighetsbeteckning'],
        },
      },
    },
    required: ['fastigheter'],
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
      return new Response(JSON.stringify({ error: 'Inget innehåll skickades' }), {
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
        max_tokens: 8192,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'extract_mark_fastigheter' },
        messages: [
          {
            role: 'user',
            content:
              'Det här är innehållet i en Excel-lista med fastigheter, filnamn "' +
              (filename || 'okänd') +
              '", ett kalkylblad i taget separerat med "=== Blad: <namn> ===" och varje rad som "radnummer | cell1<TAB>cell2<TAB>...". ' +
              'Extrahera en rad per fastighet med verktyget extract_mark_fastigheter.\n\n' +
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
        JSON.stringify({ error: 'Kunde inte tolka listan (inget strukturerat svar från modellen)' }),
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
