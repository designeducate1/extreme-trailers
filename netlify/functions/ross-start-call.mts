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
import { rossInstructions, ROSS_GREETING, ROSS_TOOLS } from '../../src/ai/rossBrain';

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
    firstSpeakerSettings: { agent: { text: ROSS_GREETING } },
    selectedTools: ROSS_TOOLS.map((t) => ({
      temporaryTool: {
        modelToolName: t.name,
        description: t.description,
        dynamicParameters: t.params.map((p) => ({ name: p.name, location: 'PARAMETER_LOCATION_BODY', required: p.required, schema: p.schema })),
        client: {},
      },
    })),
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
