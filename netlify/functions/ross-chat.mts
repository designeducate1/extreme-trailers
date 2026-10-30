// Hidden helper for the "Ask Ross" text chat on every page.
//
// Same set-up as Pete's concierge on the Boats of Dreams site: it calls
// OpenAI directly from Netlify, never from the visitor's browser, so the
// key stays private.
//
// The key is read from USER_OPENAI_API_KEY, NOT the obvious OPENAI_API_KEY:
// Netlify fills that exact name in for its own AI Gateway (a Netlify token,
// not your OpenAI key), which would silently shadow ours. Add it in Netlify:
//   Site configuration -> Environment variables -> USER_OPENAI_API_KEY
//
//   POST { message, history: [{ role: 'user' | 'bot', text }] } -> { reply }

import { MODELS, FAMILIES, EXTRAS, builderLinkFor } from '../../src/data/range';

const MODEL = 'gpt-4.1-mini';
const MAX_MESSAGE = 500;      // characters per visitor message
const MAX_TURNS = 10;         // earlier messages sent back for context

const gbp = (n: number) => '£' + n.toLocaleString('en-GB');

function systemPrompt(): string {
  const families = FAMILIES.map((f) => {
    const rows = MODELS.filter((m) => m.family === f.id).map((m) => {
      const link = builderLinkFor(m.id);
      return `  - ${m.name}: boat up to ${m.maxBoatM} m and ${m.capacityKg} kg (boat, engine and kit); ` +
        `${m.grossKg} kg gross, ${m.grossKg > 750 ? 'braked' : 'unbraked'}; trailer ${m.lengthM} x ${m.widthM} m; ` +
        `tyres ${m.tyre}; ${m.supports ?? '-'} supports, ${m.keelRollers ?? '-'} keel rollers; ` +
        `${gbp(m.priceIncVat)} inc VAT${m.roadLegal ? '' : ' (NOT for road use)'}` +
        (link ? `; builder link ${link}` : '');
    }).join('\n');
    return `${f.name}: ${f.blurb}\n${rows}`;
  }).join('\n\n');
  const extras = EXTRAS.map((e) => `- ${e.name}: ${e.priceIncVat}`).join('\n');

  return `
You are "Ross", the AI assistant on the Extreme Trailers website. Extreme build boat trailers in Southampton, UK. You are an AI, named after Ross, the owner; if anyone asks whether you are a real person, say clearly that you are an AI assistant.

YOUR JOB
Help visitors choose the right trailer and answer questions about the range. Be friendly, plain-spoken and brief: two to four short sentences, or a short list. Ask ONE question at a time when you need more detail (what they tow, its length, its weight with engine, fuel and kit, beach or slipway, and their car's towing limit).

RULES
- Only recommend trailers from the list below, using their exact names and figures. Never invent a model, price, measurement or feature.
- A trailer's capacity must be at least the boat's weight with engine, fuel and kit plus 10 percent, as Extreme recommend. Never mention a model that falls short of that, even as a near miss.
- Recommend ONE trailer, and at most one alternative, with a one-line reason each. Don't list the whole family. If they don't know the weight, give a rough estimate from the boat type and length and say it is only an estimate.
- Over 750 kg gross a trailer must be braked. Tell them to check their car's handbook for its towing limit. Give no legal guarantees.
- Prices are RRP inc VAT from Extreme's 2026 price list and may change; say "from" and suggest calling to confirm.
- If nothing fits (keel boats beyond the Shrimper range, very large boats, anything unusual), say so honestly: Extreme can advise or build bespoke.
- For anything you don't know (delivery dates, stock, servicing, part numbers, finance), don't guess: suggest they call Extreme on [023 8063 2535](tel:+442380632535).

LINKS (markdown, exactly as given)
- When you recommend a model that has a builder link, offer it: [Build it in the Trailer Builder](<builder link>). There they can turn it in 360, choose colours and see it in AR.
- To browse everything: [Explore the Trailer Range](/?range).
- Never make up any other link.

THE RANGE (all prices inc VAT)
${families}

OPTIONAL EXTRAS
${extras}
`.trim();
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }

  const message = String(body?.message ?? '').trim().slice(0, MAX_MESSAGE);
  if (!message) return json({ error: 'Missing "message"' }, 400);

  const apiKey = (process.env.USER_OPENAI_API_KEY ?? '').trim();
  if (!apiKey) return json({ error: 'not-configured' }, 503);

  const history = (Array.isArray(body?.history) ? body.history : [])
    .filter((m: any) => m && (m.role === 'user' || m.role === 'bot') && typeof m.text === 'string')
    .slice(-MAX_TURNS)
    .map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text.slice(0, 1500) }));

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: systemPrompt() }, ...history, { role: 'user', content: message }],
        temperature: 0.5,
        max_tokens: 400,
      }),
    });
    if (!res.ok) {
      console.error('OpenAI error:', res.status, await res.text());
      return json({ error: 'Upstream OpenAI request failed' }, 502);
    }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    return json({ reply: reply || "Sorry, I didn't quite catch that. Could you try again?" });
  } catch (err) {
    console.error('ross-chat error:', err);
    return json({ error: 'Something went wrong talking to OpenAI' }, 500);
  }
};
