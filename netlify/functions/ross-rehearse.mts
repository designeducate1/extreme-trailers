// Hidden helper: a typed rehearsal of voice Ross, for testing without
// using Ultravox minutes. Same instructions and on-screen tools as the
// voice call (src/ai/rossBrain.ts), answered by OpenAI instead.
//
// Test sites only (localhost and Netlify draft/branch addresses, which
// contain "--"); the live site refuses it.
//
//   POST { messages } -> { message }   (OpenAI chat format; the page runs
//   any tool calls itself and sends the results back as "tool" messages)

import { rossInstructions, ROSS_TOOLS } from '../../src/ai/rossBrain';

const MODEL = 'gpt-4.1-mini';
const MAX_MESSAGES = 40;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const REHEARSAL_NOTE = `

TYPED REHEARSAL
This conversation is typed, to test you before real voice calls. Reply exactly as you would speak on a call: same short sentences, same order of questions, and use your tools at the same moments.`;

const tools = ROSS_TOOLS.map((t) => ({
  type: 'function',
  function: {
    name: t.name,
    description: t.description,
    parameters: {
      type: 'object',
      properties: Object.fromEntries(t.params.map((p) => [p.name, p.schema])),
      required: t.params.filter((p) => p.required).map((p) => p.name),
    },
  },
}));

export default async (req: Request) => {
  const host = new URL(req.url).hostname;
  if (!(host === 'localhost' || host.includes('--'))) return json({ error: 'test-sites-only' }, 403);
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = (process.env.USER_OPENAI_API_KEY ?? '').trim();
  if (!apiKey) return json({ error: 'not-configured' }, 503);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m: any) => m && ['user', 'assistant', 'tool'].includes(m.role))
    .slice(-MAX_MESSAGES);
  // A trimmed history mustn't start with a tool result whose call was cut off.
  while (messages.length && messages[0].role === 'tool') messages.shift();

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: rossInstructions() + REHEARSAL_NOTE }, ...messages],
        tools,
        temperature: 0.5,
        max_tokens: 300,
      }),
    });
    if (!res.ok) {
      console.error('OpenAI error:', res.status, await res.text());
      return json({ error: 'Upstream OpenAI request failed' }, 502);
    }
    const data = await res.json();
    const msg = data?.choices?.[0]?.message ?? {};
    return json({ message: { role: 'assistant', content: msg.content ?? null, tool_calls: msg.tool_calls } });
  } catch (err) {
    console.error('ross-rehearse error:', err);
    return json({ error: 'Something went wrong talking to OpenAI' }, 500);
  }
};
