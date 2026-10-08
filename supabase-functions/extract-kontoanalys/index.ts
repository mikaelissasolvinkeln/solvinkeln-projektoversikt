// Supabase Edge Function: extract-kontoanalys
//
// Läser en kontoanalys/huvudbok (PDF-export ur bokföringssystemet, skickad som
// base64 från klienten) och ber Claude läsa ut varje enskild transaktionsrad:
// verifikationsnummer (t.ex. "A 123"), datum, text och debet/kredit. Klienten
// behåller sedan bara A-serien och lägger raderna som kostnader utanför reskontran.
// Sparar ingenting själv - filen och resultatet finns bara i det här anropet.
//
// DEPLOY: Supabase Dashboard -> Edge Functions -> "Deploy a new function" -> "Via Editor"
// -> döp funktionen till exakt "extract-kontoanalys" -> klistra in hela den här filen -> Deploy.
// Stäng AV "Verify JWT" för funktionen (Function -> Settings). Funktionen kollar
// inloggningen själv nedan. Återanvänder secret ANTHROPIC_API_KEY.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOOL = {
  name: 'extract_kontoanalys',
  description:
    'Alla enskilda transaktionsrader ur en kontoanalys eller huvudbok (PDF-export ur bokföringssystemet, ' +
    't.ex. Fortnox "Kontoanalys" eller "Huvudbok"). Dokumentet är grupperat per konto: en kontorubrik ' +
    '(kontonummer + namn), sedan en rad per transaktion med kolumner som Vernr | Datum | Text | Debet | ' +
    'Kredit | Saldo, och sist en summerings-/saldorad per konto ("Summa", "Utgående saldo", "Ingående saldo"). ' +
    'Ta med VARJE transaktionsrad, en per rad, och ange vilket konto den tillhör. Hoppa ALLTID över ' +
    'ingående/utgående saldo och summeringsrader - de är inga transaktioner. Verifikationsnumret skrivs ' +
    'med serie och nummer, t.ex. "A 123", "A123", "B 45" - behåll serien och numret exakt som de står ' +
    '(normalisera till "SERIE NUMMER", t.ex. "A 123"). Debet och kredit anges som positiva tal i kr utan ' +
    'tusentalsavgränsare; lämna 0 om kolumnen är tom på raden. Gissa aldrig ett belopp eller nummer du är ' +
    'osäker på - hoppa hellre över just den raden.',
  input_schema: {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        description: 'En rad per transaktion, i den ordning de förekommer i dokumentet.',
        items: {
          type: 'object',
          properties: {
            konto: { type: 'string', description: 'Kontonummer transaktionen står under (t.ex. "4010")' },
            kontonamn: { type: 'string', description: 'Kontots namn (t.ex. "Entreprenad")' },
            vernr: { type: 'string', description: 'Verifikationsnummer med serie, t.ex. "A 123"' },
            datum: { type: 'string', description: 'Transaktionsdatum, format YYYY-MM-DD om möjligt' },
            text: { type: 'string', description: 'Transaktionstext / beskrivning' },
            debet: { type: 'number', description: 'Debetbelopp i kr (0 om tomt)' },
            kredit: { type: 'number', description: 'Kreditbelopp i kr (0 om tomt)' },
          },
          required: ['vernr'],
        },
      },
    },
    required: ['rows'],
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
        max_tokens: 16000,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'extract_kontoanalys' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
              {
                type: 'text',
                text:
                  'Det här är en kontoanalys/huvudbok (PDF), filnamn "' +
                  (filename || 'okänd') +
                  '". Extrahera alla enskilda transaktionsrader med verktyget extract_kontoanalys.',
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
        JSON.stringify({ error: 'Kunde inte tolka kontoanalysen (inget strukturerat svar från modellen)' }),
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
