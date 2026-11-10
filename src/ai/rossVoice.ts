// Server-side only. Finds Ross's cloned Ultravox voice, so a call can never quietly start in a default voice.
// Order: ROSS_VOICE if set; otherwise the voice on the dashboard agent named "Ross"; otherwise a private voice named "Ross".
const env = (k: string, fallback = '') => (process.env[k] ?? fallback).trim();

let cached = '';

export async function resolveRossVoice(key: string): Promise<string | null> {
  const fixed = env('ROSS_VOICE');
  if (fixed) return fixed;
  if (cached) return cached;
  const get = async (path: string) => {
    const r = await fetch(`https://api.ultravox.ai/api/${path}`, { headers: { 'X-API-Key': key } });
    return r.ok ? ((await r.json().catch(() => null)) as any) : null;
  };
  try {
    const agents = await get('agents?pageSize=100');
    const a = (agents?.results ?? []).find((x: any) => String(x.name).trim().toLowerCase() === 'ross');
    if (a?.agentId) {
      const full = await get(`agents/${a.agentId}`);
      const v = full?.callTemplate?.voice;
      if (v) return (cached = String(v));
    }
    const voices = await get('voices?ownership=private&pageSize=100');
    const v = (voices?.results ?? []).find((x: any) => String(x.name).trim().toLowerCase() === 'ross');
    if (v?.voiceId) return (cached = String(v.voiceId));
  } catch { /* fall through */ }
  return null;
}
