// Server-side only (imported by netlify/functions/enquiry*.mts): creates AI Ross's follow-up call at Ultravox.
import { enquiryInstructions, enquiryGreeting, type EnquiryForCall } from './rossEnquiryBrain';

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
  | { skipped: true; reason: 'not_configured' | 'bad_phone_format' | 'ultravox_error' | 'network'; detail?: string };

/** live = Ultravox dials the customer through Twilio; otherwise a browser (WebRTC) call whose joinUrl the page joins. */
export async function createEnquiryCall(enq: EnquiryForCall, live: boolean): Promise<CallOutcome> {
  if (!callsEnabled()) return { skipped: true, reason: 'not_configured' };
  const from = env('TWILIO_FROM_NUMBER');
  let to: string | null = null;
  if (live) {
    to = toE164UK(enq.phone ?? '');
    if (!to) return { skipped: true, reason: 'bad_phone_format' };
  }
  const body: Record<string, unknown> = {
    systemPrompt: enquiryInstructions(enq),
    maxDuration: `${Math.min(Number(env('ROSS_MAX_SECONDS', '240')) || 240, 600)}s`,
    recordingEnabled: false,
    joinTimeout: '60s',
    firstSpeakerSettings: { agent: { text: enquiryGreeting(enq) } },
    metadata: enq.id ? { enquiryId: String(enq.id) } : undefined,
    medium: live ? { twilio: { outgoing: { to, from } } } : { webRtc: {} },
  };
  const voice = env('ROSS_VOICE');
  if (voice) body.voice = voice;
  try {
    const r = await fetch('https://api.ultravox.ai/api/calls', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-API-Key': env('ULTRAVOX_API_KEY') },
      body: JSON.stringify(body),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok) return { skipped: true, reason: 'ultravox_error', detail: data?.detail || data?.message || `status ${r.status}` };
    return live ? { success: true, mode: 'live' } : { success: true, mode: 'test', joinUrl: data.joinUrl as string };
  } catch {
    return { skipped: true, reason: 'network' };
  }
}
