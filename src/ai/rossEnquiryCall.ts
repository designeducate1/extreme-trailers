// Server-side only (imported by netlify/functions/enquiry*.mts): creates AI Ross's follow-up call at Ultravox,
// from the dashboard agent "Ross" (voice, model and instructions are managed there).
import { resolveRossVoice } from './rossVoice';
import { enquiryTemplateContext, enquiryGreeting, enquiryPromptTemplate, type EnquiryForCall } from './rossEnquiryBrain';

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
  | { success: true; mode: 'live'; via: 'agent' | 'fallback' }
  | { success: true; mode: 'test'; joinUrl: string; via: 'agent' | 'fallback' }
  | { skipped: true; reason: 'not_configured' | 'bad_phone_format' | 'agent_not_found' | 'ultravox_error' | 'network'; detail?: string };

// The dashboard agent: ROSS_AGENT_ID if set, otherwise the agent named "Ross" in the account the API key belongs to.
let cachedAgentId = '';
async function rossAgentId(key: string): Promise<{ id: string | null; why?: string }> {
  const fixed = env('ROSS_AGENT_ID');
  if (fixed) return { id: fixed };
  if (cachedAgentId) return { id: cachedAgentId };
  const r = await fetch('https://api.ultravox.ai/api/agents?pageSize=100', { headers: { 'X-API-Key': key } });
  const d: any = await r.json().catch(() => ({}));
  if (!r.ok) return { id: null, why: `Ultravox answered ${r.status} when listing agents: ${JSON.stringify(d).slice(0, 120)}` };
  const names = (d.results ?? []).map((x: any) => String(x.name));
  const a = (d.results ?? []).find((x: any) => String(x.name).trim().toLowerCase() === 'ross');
  if (a?.agentId) cachedAgentId = a.agentId;
  return { id: a?.agentId ?? null, why: a ? undefined : `This Ultravox account has ${names.length} agent(s): ${names.join(', ') || 'none'}.` };
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
    const found = await rossAgentId(key);
    const common = {
      firstSpeakerSettings: { agent: { text: enquiryGreeting(enq) } },
      maxDuration: `${Math.min(Number(env('ROSS_MAX_SECONDS', '240')) || 240, 600)}s`,
      recordingEnabled: false,
      joinTimeout: '60s',
      metadata: enq.id ? { enquiryId: String(enq.id) } : undefined,
      medium: live ? { twilio: { outgoing: { to, from } } } : { webRtc: {} },
    };
    const ctx = enquiryTemplateContext(enq);
    let url: string, body: Record<string, unknown>;
    if (found.id) {
      // The dashboard agent supplies the voice, model and instructions; we only fill in the customer's details.
      url = `https://api.ultravox.ai/api/agents/${found.id}/calls`;
      body = { ...common, templateContext: ctx };
    } else {
      // No "Ross" agent in this Ultravox account: use exactly the same instructions text directly, so the call still works.
      console.warn('[enquiry] falling back to a direct call:', found.why);
      url = 'https://api.ultravox.ai/api/calls';
      const text = enquiryPromptTemplate().replace(/\{\{\{(\w+)\}\}\}/g, (_m, k: string) => (ctx as Record<string, string>)[k] ?? '');
      body = { ...common, systemPrompt: text };
      const voice = await resolveRossVoice(key);
      if (!voice) return { skipped: true, reason: 'agent_not_found', detail: "Ross's voice isn't available in this Ultravox account." };
      body.voice = voice;
    }
    const via = found.id ? ('agent' as const) : ('fallback' as const);
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'X-API-Key': key }, body: JSON.stringify(body) });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) return { skipped: true, reason: 'ultravox_error', detail: data?.detail || data?.message || `status ${r.status}` };
    return live ? { success: true, mode: 'live', via } : { success: true, mode: 'test', joinUrl: data.joinUrl as string, via };
  } catch {
    return { skipped: true, reason: 'network' };
  }
}
