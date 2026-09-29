// Supabase Edge Function: extract-reskontra
//
// Läser en uppladdad leverantörsreskontra (PDF-export ur bokföringssystemet,
// skickad som base64 från klienten) och ber Claude läsa ut varje enskild
// fakturarad. Layouten är rörig - leverantörsgrupper med flera fakturarader
// under sig, och subtotalrader ("Antal fakturor"/"Summa i SEK") blandat med
// riktiga fakturarader - därför AI-inläsning istället för en egen textparser.
// Sparar ingenting själv - filen och resultatet finns bara i det här anropet,
// sedan är de borta.
//
// DEPLOY: Supabase Dashboard -> Edge Functions -> "Deploy a new function" -> "Via Editor"
// -> döp funktionen till exakt "extract-reskontra" -> klistra in hela den här filen -> Deploy.
// Stäng AV "Verify JWT" för funktionen (Function -> Settings) - annars blockerar Supabase
// webbläsarens CORS-förfrågan innan den ens når koden. Funktionen kollar istället
// inloggningen själv nedan, så bara inloggade användare (den delade koden) kan använda den.
//
// SECRET: ingen ny secret behövs - återanvänder samma ANTHROPIC_API_KEY som
// redan är satt för de tidigare extract-funktionerna.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOOL = {
  name: 'extract_reskontra',
  description:
    'Alla enskilda fakturarader ur en leverantörsreskontralista (PDF-export ur bokföringssystemet ' +
    'Fortnox, rubrik "Leverantörsreskontralista"). Tabellen har kolumnerna Löpnr | Leverantör | ' +
    'Fakturadatum | Förfallodatum | Vernr | Valuta | Belopp | Saldo, och är grupperad block för block - ' +
    'ETT BLOCK PER LEVERANTÖR. Leverantörens namn står bara EN gång per block, på SAMMA RAD som den ' +
    'FÖRSTA fakturan i blocket (inte på en egen rubrikrad ovanför) - varje rad efter det i samma block ' +
    'saknar ett namn i Leverantör-kolumnen men tillhör ändå samma leverantör, ända tills ett nytt ' +
    'Löpnr+Leverantör-par börjar nästa block. Ett nytt block känns igen på att BÅDE Löpnr-kolumnen ' +
    '(blockets egna interna radnummer, börjar om från en lägre siffra) OCH Leverantör-kolumnen har ett ' +
    'nytt värde samtidigt. Hoppa ALLTID över rena summerings-/delsummeringsrader (t.ex. "Antal ' +
    'fakturor" eller "Summa i SEK") - de avslutar varje block och är inga fakturor. Negativa belopp ' +
    '(kreditfakturor, minustecken) är giltiga och ska tas med som negativa tal. Om Fakturadatum eller ' +
    'Förfallodatum saknas för en rad, lämna fältet tomt men ta ändå med raden om löpnummer och belopp ' +
    'finns. Gissa aldrig ett löpnummer eller belopp du är osäker på - hoppa hellre över just den raden.',
  input_schema: {
    type: 'object',
    properties: {
      invoices: {
        type: 'array',
        description: 'En rad per faktura, i den ordning de förekommer i dokumentet.',
        items: {
          type: 'object',
          properties: {
            lopnr: { type: 'string', description: 'Fakturans löpnummer (kolumnen "Löpnr", unikt per faktura i hela listan)' },
            leverantor: { type: 'string', description: 'Leverantörens namn - samma för alla rader i blocket, även om namnet bara stod på blockets första rad' },
            fakturadatum: { type: 'string', description: 'Fakturadatum, format YYYY-MM-DD om möjligt' },
            forfallodatum: { type: 'string', description: 'Förfallodatum, format YYYY-MM-DD om möjligt' },
            belopp: { type: 'number', description: 'Fakturans belopp i kr, utan tusentalsavgränsare. Negativt för kreditfakturor.' },
          },
          required: ['lopnr', 'belopp'],
        },
      },
    },
    required: ['invoices'],
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
        tool_choice: { type: 'tool', name: 'extract_reskontra' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
              {
                type: 'text',
                text:
                  'Det här är en leverantörsreskontra (PDF), filnamn "' +
                  (filename || 'okänd') +
                  '". Extrahera alla enskilda fakturarader med verktyget extract_reskontra.',
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
        JSON.stringify({ error: 'Kunde inte tolka reskontran (inget strukturerat svar från modellen)' }),
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
