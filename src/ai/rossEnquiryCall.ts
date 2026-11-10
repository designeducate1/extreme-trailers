// Server-side only (imported by netlify/functions/enquiry*.mts): creates AI Ross's follow-up call at Ultravox,
// from the dashboard agent "Ross" (voice, model and instructions are managed there).
import { enquiryTemplateContext, enquiryGreeting, type EnquiryForCall } from './rossEnquiryBrain';

const env = (k: string, fallback = '') => (process.env[k] ?? fallback).trim();

// UK numbers as typed on a form ("07123 456789", "+44 7123 456789") -> strict E.164 for Twilio.
export function toE164UK(raw: string): string | null {
  const d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  if (d.startsWith('0')) return '+44' + d.slice(1);
  if (d.startsWith('44')) return '+' + d;
  return null;
}

export const callsEnabled = () => env('ROSS_ENABLED', 'false').toLowerCase() === 'true' && !!env('ULTRAVOX_API_KEY');
export const liveMode = (phone?: string) => !!env('TWILIO_FROM_NUMBER') && !!phone;

export type CallOutcome =
  | { success: true; mode: 'live' }
  | { success: true; mode: 'test'; joinUrl: string }
  | { skipped: true; reason: 'not_configured' | 'bad_phone_format' | 'agent_not_found' | 'ultravox_error' | 'network'; detail?: string };

// The dashboard agent: ROSS_AGENT_ID if set, otherwise the agent named "Ross" in the account the API key belongs to.
let cachedAgentId = '';
async function rossAgentId(key: string): Promise<string | null> {
  const fixed = env('ROSS_AGENT_ID');
  if (fixed) return fixed;
  if (cachedAgentId) return cachedAgentId;
  const r = await fetch('https://api.ultravox.ai/api/agents?pageSize=100', { headers: { 'X-API-Key': key } });
  const d: any = await r.json().catch(() => ({}));
  const a = (d.results ?? []).find((x: any) => String(x.name).trim().toLowerCase() === 'ross');
  if (a?.agentId) cachedAgentId = a.agentId;
  return a?.agentId ?? null;
}

/** live = Ultravox dials the customer through Twilio; otherwise a browser (WebRTC) call whose joinUrl the page joins. */
export async function createEnquiryCall(enq: EnquiryForCall, live: boolean): Promise<CallOutcome> {
  if (!callsEnabled()) return { skipped: true, reason: 'not_configured' };
  const key = env('ULTRAVOX_API_KEY');
  const from = env('TWILIO_FROM_NUMBER');
  let to: string | null = null;
  if (live) {
    to = toE164UK(enq.phone ?? '');
    if (!to) return { skipped: true, reason: 'bad_phone_format' };
  }
  try {
    const agentId = await rossAgentId(key);
    if (!agentId) return { skipped: true, reason: 'agent_not_found', detail: 'No agent named "Ross" in the Ultravox account.' };
    const body = {
      templateContext: enquiryTemplateContext(enq),
      firstSpeakerSettings: { agent: { text: enquiryGreeting(enq) } },
      maxDuration: `${Math.min(Number(env('ROSS_MAX_SECONDS', '240')) || 240, 600)}s`,
      recordingEnabled: false,
      joinTimeout: '60s',
      metadata: enq.id ? { enquiryId: String(enq.id) } : undefined,
      medium: live ? { twilio: { outgoing: { to, from } } } : { webRtc: {} },
    };
    const r = await fetch(`https://api.ultravox.ai/api/agents/${agentId}/calls`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify(body),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) return { skipped: true, reason: 'ultravox_error', detail: data?.detail || data?.message || `status ${r.status}` };
    return live ? { success: true, mode: 'live' } : { success: true, mode: 'test', joinUrl: data.joinUrl as string };
  } catch {
    return { skipped: true, reason: 'network' };
  }
}
