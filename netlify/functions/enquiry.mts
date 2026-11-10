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
import type { EnquiryForCall } from '../../src/ai/rossEnquiryBrain';
import { createEnquiryCall, callsEnabled, liveMode } from '../../src/ai/rossEnquiryCall';

const FEED_KEY = 'feed';
const MAX_ENQUIRIES = 200;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

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
    const store = getStore({ name: 'enquiries', consistency: 'strong' });
    const existing: any = await store.get(FEED_KEY, { type: 'json' });
    await store.setJSON(FEED_KEY, { enquiries: [record, ...((existing && existing.enquiries) || [])].slice(0, MAX_ENQUIRIES) });
  } catch (e) {
    stored = false;
    console.warn('[enquiry] could not store the enquiry:', e);
  }

  // 2. Best-effort follow-up call, only if they asked for one.
  //    LIVE: dial them now through Twilio.  TEST: nothing is created yet; the page asks for the call (enquiry-call)
  //    when the person presses Start, so unused test calls never tie up Ultravox's limited simultaneous-call slots.
  let call: Record<string, unknown> | null = null;
  if (contactPreference === 'call') {
    if (!callsEnabled()) call = { skipped: true, reason: 'not_configured' };
    else if (liveMode(enq.phone)) call = await createEnquiryCall(enq, true);
    else call = { mode: 'test', ready: true };
  }

  return json({ success: true, enquiryId: enq.id, stored, call });
};
