// Public "Make an Enquiry" endpoint for Extreme Trailers.
//
//   POST { name, email, phone?, trailerOfInterest?, message, contactPreference: 'email' | 'call' }
//     -> stores the enquiry, then (if the customer asked for a call back) starts AI Ross's follow-up call.
//
// Two call modes, chosen by what is configured (same design as the follow-up system built for another client site):
//   * LIVE  - TWILIO_FROM_NUMBER is set and the customer gave a phone number: Ultravox dials them through Twilio.
//   * TEST  - otherwise: a browser (WebRTC) call is created and its joinUrl is returned, so the page can show the
//             live transcript and play Ross's voice. This is what we use to demo before the Twilio number exists.
// Every failure on the call side is caught: the enquiry is always stored first and the customer's response never fails
// because of the call.
//
// Env (Netlify): ULTRAVOX_API_KEY, ROSS_VOICE, ROSS_ENABLED=true (master switch), ROSS_MAX_SECONDS (default 240),
//                TWILIO_FROM_NUMBER (live mode only, E.164, linked to the Twilio account inside Ultravox).

import { getStore } from '@netlify/blobs';
import { enquiryInstructions, enquiryGreeting, type EnquiryForCall } from '../../src/ai/rossEnquiryBrain';

const FEED_KEY = 'feed';
const MAX_ENQUIRIES = 200;
const env = (k: string, fallback = '') => (process.env[k] ?? fallback).trim();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// UK numbers as typed on a form ("07123 456789", "+44 7123 456789") -> strict E.164 for Twilio.
function toE164UK(raw: string): string | null {
  const d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  if (d.startsWith('0')) return '+44' + d.slice(1);
  if (d.startsWith('44')) return '+' + d;
  return null;
}

// A light brake on repeated calls from one place (per running instance; Ultravox's own plan limits are the real cap).
const recent = new Map<string, number>();

async function startCall(enq: EnquiryForCall, ip: string) {
  const key = env('ULTRAVOX_API_KEY');
  const enabled = env('ROSS_ENABLED', 'false').toLowerCase() === 'true';
  if (!enabled || !key) return { skipped: true, reason: 'not_configured' as const };

  const last = recent.get(ip) ?? 0;
  if (Date.now() - last < 30_000) return { skipped: true, reason: 'too_soon' as const };

  const from = env('TWILIO_FROM_NUMBER');
  const live = !!from && !!enq.phone;
  let to: string | null = null;
  if (live) {
    to = toE164UK(enq.phone!);
    if (!to) return { skipped: true, reason: 'bad_phone_format' as const };
  }

  const body: Record<string, unknown> = {
    systemPrompt: enquiryInstructions(enq),
    maxDuration: `${Math.min(Number(env('ROSS_MAX_SECONDS', '240')) || 240, 600)}s`,
    recordingEnabled: false,
    joinTimeout: '300s',   // the customer needs time to press Start after sending the form (test mode)
    firstSpeakerSettings: { agent: { text: enquiryGreeting(enq) } },
    metadata: enq.id ? { enquiryId: String(enq.id) } : undefined,
    medium: live ? { twilio: { outgoing: { to, from } } } : { webRtc: {} },
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
    if (!r.ok) return { skipped: true, reason: 'ultravox_error' as const, detail: data?.detail || data?.message || `status ${r.status}` };
    recent.set(ip, Date.now());
    return live ? { success: true, mode: 'live' as const } : { success: true, mode: 'test' as const, joinUrl: data.joinUrl as string };
  } catch {
    return { skipped: true, reason: 'network' as const };
  }
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }

  const str = (v: unknown, max: number) => (v ?? '').toString().trim().slice(0, max);
  const enq: EnquiryForCall = {
    name: str(b.name, 120),
    email: str(b.email, 200).toLowerCase(),
    phone: str(b.phone, 40) || undefined,
    trailerOfInterest: str(b.trailerOfInterest, 160) || undefined,
    message: str(b.message, 4000),
  };
  const contactPreference = b.contactPreference === 'call' ? 'call' : 'email';

  if (!enq.name || !isEmail(enq.email) || !enq.message) {
    return json({ error: 'Name, a valid email and a message are required.' }, 400);
  }

  enq.id = crypto.randomUUID();
  const record = { ...enq, contactPreference, createdAt: new Date().toISOString() };

  // 1. Always store the enquiry first. If storage is unavailable (for example a local preview without Blobs)
  //    we carry on: the customer's enquiry has still been received by the server.
  let stored = true;
  try {
    const store = getStore('enquiries');
    const existing: any = await store.get(FEED_KEY, { type: 'json' });
    await store.setJSON(FEED_KEY, { enquiries: [record, ...((existing && existing.enquiries) || [])].slice(0, MAX_ENQUIRIES) });
  } catch (e) {
    stored = false;
    console.warn('[enquiry] could not store the enquiry:', e);
  }

  // 2. Best-effort follow-up call, only if they asked for one.
  let call: Record<string, unknown> | null = null;
  if (contactPreference === 'call') {
    const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    call = await startCall(enq, ip);
  }

  return json({ success: true, enquiryId: enq.id, stored, call });
};
