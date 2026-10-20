// Hidden helper: starts one AI Ross conversation with Ultravox.
//
// Runs on Netlify (or on your Mac during `npm run dev`), never in the
// visitor's browser, so the Ultravox key stays private.
//
//   GET  -> is Ross switched on? how many tests are left?
//   POST -> start a call, returns { joinUrl } for the page to connect to
//
// Safety limits (set in .env.local / Netlify settings):
//   ROSS_ENABLED=false     master switch, off by default
//   ROSS_MAX_SECONDS=180   each call ends after this long
//   ROSS_MAX_TESTS=10      stops starting calls after this many

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TRAILERS, CATEGORY_NAMES } from '../../src/data/trailers';

const env = (k: string, fallback = '') => (process.env[k] ?? fallback).trim();

// ---- simple test counter (a small file) ----
const counterPaths = [path.join(process.cwd(), '.ross-tests.json'), path.join(os.tmpdir(), 'ross-tests.json')];
function readCount(): number {
  for (const p of counterPaths) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')).count ?? 0; } catch { /* try next */ }
  }
  return 0;
}
function writeCount(count: number) {
  for (const p of counterPaths) {
    try { fs.writeFileSync(p, JSON.stringify({ count, updated: new Date().toISOString() })); return; } catch { /* try next */ }
  }
}

// ---- what Ross knows and how he behaves ----
function rossInstructions(): string {
  const list = TRAILERS.map((t) =>
    `- id "${t.id}": ${t.name} (${CATEGORY_NAMES[t.category]}). Carries a boat of up to ${t.maxBoatKg}kg ` +
    `(${t.grossKg}kg gross${t.braked ? ', braked' : ', unbraked'}, ${t.axles === 2 ? 'twin' : 'single'} axle). ` +
    `Hull support: ${t.support}. Suits: ${t.suits.join('; ')}.`
  ).join('\n');

  return `
You are "AI Ross", the voice assistant on the Extreme Trailers website. Extreme Trailers builds boat trailers in Southampton, UK.
You are an AI. Your voice is based on Ross, the owner, but you are not him. If anyone asks whether you are a real person, say clearly that you are an AI assistant.

YOUR JOB
Find the right trailer for the visitor by asking short questions, ONE at a time, then show them the best match on screen.

ASK IN THIS ORDER (skip anything they've already told you)
1. What do they tow? (RIB, powerboat, sailing boat, dinghy, jetski / PWC, or fully inflatable boat). As soon as you know, call highlightCategories with the categories that could suit.
2. How long is the boat? Accept feet or metres.
3. Roughly how heavy is it, including the engine, fuel and kit? Add 10 percent for safety, as Extreme recommends. If they don't know, give a rough estimate from the type and length and say clearly it is only an estimate.
4. Where do they launch: a beach or a slipway? Rollers make launching and recovery easier on shallow slips; bunks or a launcher can suit other boats. Keep this general.
5. What can their car tow? If the boat and trailer together are under 750kg, an unbraked trailer may be fine. Over 750kg the trailer must be braked. Tell them to check their car's handbook for its towing limit. Do not give legal guarantees.
Then recommend ONE trailer, and at most one alternative. Call showTrailer with its id and a one-sentence reason, then explain your choice in a sentence or two.

STRICT RULES
- Only recommend trailers from the list below, using their exact names. Never invent a model, a measurement or a feature.
- The trailer's boat limit must be at least the boat weight plus 10 percent. If nothing on the list fits (for example jetskis, keel boats, or very large boats), say so honestly and suggest they call the Extreme team, who can advise or build bespoke.
- Do not quote prices. If asked, say the team will confirm current prices.
- Keep every reply short: one or two sentences, friendly and plain British English. No lists read aloud.
- This is a short call. After recommending, ask if there's anything else, then say goodbye.

TRAILERS YOU MAY RECOMMEND (draft list)
${list}

CATEGORY NAMES for highlightCategories: ${Object.keys(CATEGORY_NAMES).join(', ')}
`.trim();
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export default async (req: Request) => {
  const key = env('ULTRAVOX_API_KEY');
  const enabled = env('ROSS_ENABLED', 'false').toLowerCase() === 'true';
  const maxTests = Number(env('ROSS_MAX_TESTS', '10')) || 10;
  const maxSeconds = Math.min(Number(env('ROSS_MAX_SECONDS', '180')) || 180, 600);
  const used = readCount();
  const status = { enabled, configured: key.length > 0, used, maxTests, maxSeconds };

  if (req.method === 'GET') return json(status);
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  if (!enabled) return json({ ...status, error: 'offline', message: 'Ross is switched off.' }, 403);
  if (!key) return json({ ...status, error: 'no-key', message: 'No Ultravox key in the settings file yet.' }, 503);
  if (used >= maxTests) return json({ ...status, error: 'limit', message: `Test limit of ${maxTests} reached.` }, 429);

  const body: Record<string, unknown> = {
    systemPrompt: rossInstructions(),
    maxDuration: `${maxSeconds}s`,
    recordingEnabled: false,
    medium: { webRtc: {} },
    firstSpeakerSettings: {
      agent: {
        text: "Hi, I'm AI Ross from Extreme Trailers, an AI assistant with a voice based on Ross's. I'll ask a few quick questions to find your trailer. What are you looking to tow?",
      },
    },
    selectedTools: [
      {
        temporaryTool: {
          modelToolName: 'highlightCategories',
          description: 'Highlight the trailer categories on screen that could suit the visitor. Call again whenever the shortlist changes.',
          dynamicParameters: [{
            name: 'categories', location: 'PARAMETER_LOCATION_BODY', required: true,
            schema: { type: 'array', items: { type: 'string', enum: Object.keys(CATEGORY_NAMES) } },
          }],
          client: {},
        },
      },
      {
        temporaryTool: {
          modelToolName: 'showTrailer',
          description: 'Show the recommended trailer in the panel on screen. Use only an id from the list.',
          dynamicParameters: [
            { name: 'trailerId', location: 'PARAMETER_LOCATION_BODY', required: true, schema: { type: 'string', enum: TRAILERS.map((t) => t.id) } },
            { name: 'reason', location: 'PARAMETER_LOCATION_BODY', required: true, schema: { type: 'string', description: 'One short sentence on why it suits them.' } },
          ],
          client: {},
        },
      },
    ],
  };
  const voice = env('ROSS_VOICE');
  if (voice) body.voice = voice;

  try {
    const r = await fetch('https://api.ultravox.ai/api/calls', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify(body),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok || !data.joinUrl) {
      return json({ ...status, error: 'ultravox', message: data?.detail || data?.message || `Ultravox said ${r.status}` }, 502);
    }
    writeCount(used + 1);
    return json({ joinUrl: data.joinUrl, used: used + 1, maxTests, maxSeconds });
  } catch (e) {
    return json({ ...status, error: 'network', message: 'Could not reach Ultravox.' }, 502);
  }
};
