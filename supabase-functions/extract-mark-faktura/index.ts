// Supabase Edge Function: extract-mark-faktura
//
// Läser en uppladdad faktura (PDF, base64 från klienten) för gatukostnad eller
// vattenanslutning på en fastighet och ber Claude läsa ut typ, vilken
// fastighet den gäller och beloppet. Föreningen har inget momsavdrag, så
// beloppet som ska bokas är det som faktiskt betalas: totalbeloppet INKLUSIVE
// moms när moms debiteras, annars fakturabeloppet som det står (ingen moms
// läggs på). Sparar ingenting själv.
//
// DEPLOY: Supabase Dashboard -> Edge Functions -> "Deploy a new function" -> "Via Editor"
// -> döp funktionen till exakt "extract-mark-faktura" -> klistra in hela den här
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
  name: 'extract_mark_faktura',
  description:
    'Alla fakturor i en uppladdad PDF som gäller gatukostnad (gatukostnadsersättning, från kommunen) ' +
    'eller vattenanslutning (VA-anslutningsavgift, anläggningsavgift) för fastigheter. En PDF kan ' +
    'innehålla FLERA olika fakturor (t.ex. en per sida eller flera sidor per faktura) - ge en post per ' +
    'faktura, kännetecknad av eget fakturanummer/belopp, och slå aldrig ihop olika fakturor. En faktura ' +
    'som sträcker sig över flera sidor är fortfarande EN post. Mottagaren har INGET momsavdrag - beloppet ' +
    'som ska anges är därför exakt det som ska betalas: om fakturan debiterar moms är belopp = totalt att ' +
    'betala INKLUSIVE moms; om fakturan är helt utan moms (t.ex. momsfri gatukostnadsersättning) är ' +
    'belopp = fakturabeloppet som det står, utan att lägga på någon moms. Fastighetsbeteckningen är ' +
    'namnet på fastigheten (t.ex. "Gladö 76:5") om den anges. Gissa aldrig ett belopp - hoppa över ' +
    'fältet istället.',
  input_schema: {
    type: 'object',
    properties: {
      fakturor: {
        type: 'array',
        description: 'En post per faktura i dokumentet, i den ordning de förekommer.',
        items: {
          type: 'object',
          properties: {
            typ: { type: 'string', enum: ['gatukostnad', 'vattenanslutning', 'okant'], description: '"okant" om fakturan inte tydligt gäller någon av de två' },
            fastighetsbeteckning: { type: 'string' },
            leverantor: { type: 'string', description: 'Avsändare/leverantör, t.ex. kommunen eller VA-bolaget' },
            fakturanummer: { type: 'string' },
            fakturadatum: { type: 'string', description: 'Format YYYY-MM-DD' },
            belopp: { type: 'number', description: 'Beloppet att betala enligt momsregeln ovan, i kr' },
            momsDebiterad: { type: 'boolean', description: 'true om fakturan debiterar moms' },
          },
          required: ['typ', 'belopp'],
        },
      },
    },
    required: ['fakturor'],
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
        tool_choice: { type: 'tool', name: 'extract_mark_faktura' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
              {
                type: 'text',
                text:
                  'Det här är en PDF med en eller flera fakturor för gatukostnad eller vattenanslutning, filnamn "' +
                  (filename || 'okänd') +
                  '". Extrahera varje faktura som en egen post med verktyget extract_mark_faktura.',
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
        JSON.stringify({ error: 'Kunde inte tolka fakturan (inget strukturerat svar från modellen)' }),
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
// Supabase Edge Function: extract-mark-faktura
//
// Läser en uppladdad faktura (PDF, base64 från klienten) för gatukostnad eller
// vattenanslutning på en fastighet och ber Claude läsa ut typ, vilken
// fastighet den gäller och beloppet. Föreningen har inget momsavdrag, så
// beloppet som ska bokas är det som faktiskt betalas: totalbeloppet INKLUSIVE
// moms när moms debiteras, annars fakturabeloppet som det står (ingen moms
// läggs på). Sparar ingenting själv.
//
// DEPLOY: Supabase Dashboard -> Edge Functions -> "Deploy a new function" -> "Via Editor"
// -> döp funktionen till exakt "extract-mark-faktura" -> klistra in hela den här
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
  name: 'extract_mark_faktura',
  description:
    'Uppgifter ur en faktura som gäller gatukostnad (gatukostnadsersättning, från kommunen) eller ' +
    'vattenanslutning (VA-anslutningsavgift, anläggningsavgift) för en fastighet. Mottagaren har INGET ' +
    'momsavdrag - beloppet som ska anges är därför exakt det som ska betalas: om fakturan debiterar moms ' +
    'är belopp = totalt att betala INKLUSIVE moms; om fakturan är helt utan moms (t.ex. momsfri ' +
    'gatukostnadsersättning) är belopp = fakturabeloppet som det står, utan att lägga på någon moms. ' +
    'Fastighetsbeteckningen är namnet på fastigheten (t.ex. "Gladö 76:5") om den anges. Gissa aldrig ett ' +
    'belopp - hoppa över fältet istället.',
  input_schema: {
    type: 'object',
    properties: {
      typ: { type: 'string', enum: ['gatukostnad', 'vattenanslutning', 'okant'], description: '"okant" om fakturan inte tydligt gäller någon av de två' },
      fastighetsbeteckning: { type: 'string' },
      leverantor: { type: 'string', description: 'Avsändare/leverantör, t.ex. kommunen eller VA-bolaget' },
      fakturanummer: { type: 'string' },
      fakturadatum: { type: 'string', description: 'Format YYYY-MM-DD' },
      belopp: { type: 'number', description: 'Beloppet att betala enligt momsregeln ovan, i kr' },
      momsDebiterad: { type: 'boolean', description: 'true om fakturan debiterar moms' },
    },
    required: ['typ', 'belopp'],
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
        max_tokens: 1024,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'extract_mark_faktura' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
              {
                type: 'text',
                text:
                  'Det här är en faktura för gatukostnad eller vattenanslutning, filnamn "' +
                  (filename || 'okänd') +
                  '". Extrahera uppgifterna med verktyget extract_mark_faktura.',
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
        JSON.stringify({ error: 'Kunde inte tolka fakturan (inget strukturerat svar från modellen)' }),
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
