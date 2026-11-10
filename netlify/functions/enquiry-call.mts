// Test mode only: when the customer presses "Start the call" on the enquiry page, create AI Ross's browser call
// for the enquiry they just sent and hand back its joinUrl. Looks the enquiry up by id (rather than trusting text
// from the browser), refuses to run when real phone calls are configured, and rate-limits per visitor.
import { getStore } from '@netlify/blobs';
import { createEnquiryCall, callsEnabled, liveMode } from '../../src/ai/rossEnquiryCall';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const recent = new Map<string, number>();

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let b: any;
  try { b = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const id = (b?.enquiryId ?? '').toString();
  if (!id) return json({ error: 'Missing enquiryId' }, 400);
  if (!callsEnabled()) return json({ error: 'offline', message: 'AI Ross is switched off.' }, 403);

  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown';
  if (Date.now() - (recent.get(ip) ?? 0) < 20_000) return json({ error: 'too_soon', message: 'Please wait a moment before starting another call.' }, 429);

  let enq: any = null;
  try {
    const feed: any = await getStore({ name: 'enquiries', consistency: 'strong' }).get('feed', { type: 'json' });
    enq = ((feed && feed.enquiries) || []).find((e: any) => e.id === id);
  } catch { /* storage unavailable */ }
  if (!enq) return json({ error: 'not_found', message: 'We could not find that enquiry.' }, 404);
  if (liveMode(enq.phone)) return json({ error: 'live', message: 'AI Ross is calling this customer by phone.' }, 409);

  recent.set(ip, Date.now());
  const out = await createEnquiryCall(enq, false);
  if ('success' in out && out.mode === 'test') return json({ joinUrl: out.joinUrl });
  if ('skipped' in out) return json({ error: out.reason, message: out.detail || 'Could not start the call.' }, 502);
  return json({ error: 'unexpected', message: 'Could not start the call.' }, 502);
};
