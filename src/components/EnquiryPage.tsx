import React, { useEffect, useRef, useState } from 'react';
import { MODELS } from '../data/range';
import { useEnquiryCall } from '../hooks/useEnquiryCall';

// "Make an enquiry": name, email, optional phone and trailer of interest, a message, and how the customer would
// like to hear back. Choosing a call sends AI Ross to follow up. Until the Twilio number exists (test mode) the page
// itself becomes the call: Ross's voice plays in the browser and the transcript appears live as the conversation goes.

const NAVY = '#062e69';
const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

type Pref = 'email' | 'call';
interface CallResult { success?: boolean; mode?: 'test' | 'live'; ready?: boolean; skipped?: boolean; reason?: string }

const FIELD = 'w-full h-12 rounded-xl bg-white border border-zinc-300 px-4 text-[15px] text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-[#062e69] focus:ring-2 focus:ring-[#062e69]/20 transition';

const Field: React.FC<{ label: string; optional?: boolean; children: React.ReactNode; wide?: boolean }> = ({ label, optional, children, wide }) => (
  <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
    <span className="block text-sm font-semibold text-zinc-800 mb-2">{label}{optional && <em className="not-italic font-normal text-zinc-400"> (optional)</em>}</span>
    {children}
  </label>
);

function CallPanel({ enquiryId, name }: { enquiryId: string; name: string }) {
  const { phase, state, lines, start, end } = useEnquiryCall();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [lines.length, lines[lines.length - 1]?.text]);

  const [err, setErr] = useState('');
  const getJoinUrl = async () => {
    setErr('');
    const r = await fetch('/.netlify/functions/enquiry-call', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ enquiryId }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.joinUrl) { setErr(d?.message || 'We could not start the call just now. Please try again in a moment.'); throw new Error('no-call'); }
    return d.joinUrl as string;
  };
  const live = phase === 'live' || phase === 'connecting';
  const status =
    phase === 'asking-mic' ? 'Waiting for your microphone…'
    : phase === 'connecting' ? 'Connecting to AI Ross…'
    : phase === 'live' ? (state === 'speaking' ? 'AI Ross is speaking' : state === 'thinking' ? 'AI Ross is thinking…' : 'Listening to you')
    : phase === 'ended' ? 'Call finished'
    : phase === 'mic-blocked' ? 'Microphone blocked'
    : phase === 'error' ? 'Could not connect'
    : 'Ready';

  return (
    <div className="mt-8 rounded-3xl border border-zinc-200 bg-white shadow-[0_18px_50px_-24px_rgba(6,46,105,0.35)] overflow-hidden" aria-live="polite">
      <div className="px-6 sm:px-8 py-5 flex items-center justify-between gap-4" style={{ background: NAVY }}>
        <div className="flex items-center gap-3 text-white">
          <span className={`w-2.5 h-2.5 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'}`} aria-hidden="true" />
          <div>
            <p className="text-sm font-bold tracking-wide">AI Ross · live call</p>
            <p className="text-xs text-white/70">{status}</p>
          </div>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/80 border border-white/30 rounded-full px-3 py-1">Test mode</span>
      </div>

      <div className="px-6 sm:px-8 pt-5 text-sm text-zinc-600">
        In the live service AI Ross phones you on the number you gave. For this demo he talks to you here instead, so you can hear his voice and watch the transcript as it happens.
      </div>

      <div className="px-6 sm:px-8 py-5">
        <div className="h-[320px] overflow-y-auto rounded-2xl bg-[#eef2f8] p-4 space-y-3" role="log" aria-label="Call transcript">
          {!lines.length && <p className="text-sm text-zinc-500 text-center pt-24">{phase === 'idle' ? `Press Start, ${name.split(' ')[0] || 'there'}, and allow the microphone when asked.` : 'The transcript will appear here.'}</p>}
          {lines.map((l, i) => (
            <div key={i} className={`flex ${l.speaker === 'agent' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${l.speaker === 'agent' ? 'text-white rounded-bl-md' : 'bg-white text-zinc-900 border border-zinc-200 rounded-br-md'} ${l.final ? '' : 'opacity-70'}`}
                style={l.speaker === 'agent' ? { background: NAVY } : undefined}>
                <span className={`block text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5 ${l.speaker === 'agent' ? 'text-white/60' : 'text-zinc-400'}`}>{l.speaker === 'agent' ? 'AI Ross' : 'You'}</span>
                {l.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {(phase === 'idle' || phase === 'mic-blocked' || phase === 'error') && (
            <button type="button" onClick={() => start(getJoinUrl)}
              className="h-12 px-7 rounded-full text-white font-semibold hover:-translate-y-px transition-transform shadow-md cursor-pointer" style={{ background: NAVY }}>
              {phase === 'idle' ? 'Start the call' : 'Try again'}
            </button>
          )}
          {live && (
            <button type="button" onClick={end} className="h-12 px-7 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer">End call</button>
          )}
          {phase === 'mic-blocked' && <p className="text-sm text-red-700">Please allow the microphone in your browser&rsquo;s address bar, then try again.</p>}
          {phase === 'error' && <p className="text-sm text-red-700">{err || 'We couldn’t connect the call just now.'}</p>}
          {phase === 'ended' && <p className="text-sm text-zinc-600">Thanks for talking to AI Ross. The Extreme team will confirm price and availability by email.</p>}
        </div>
      </div>
    </div>
  );
}

export const EnquiryPage: React.FC = () => {
  const [f, setF] = useState({ name: '', email: '', phone: '', trailer: '', message: '' });
  const [pref, setPref] = useState<Pref>('call');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | { call: CallResult | null; enquiryId?: string }>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!f.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) || !f.message.trim()) { setError('Please add your name, a valid email and a message.'); return; }
    setBusy(true);
    try {
      const r = await fetch('/.netlify/functions/enquiry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: f.name, email: f.email, phone: f.phone, trailerOfInterest: f.trailer, message: f.message, contactPreference: pref }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d?.error || 'Something went wrong sending your enquiry. Please try again.'); return; }
      setDone({ call: d.call ?? null, enquiryId: d.enquiryId });
    } catch {
      setError('We couldn’t reach the server. Please check your connection and try again.');
    } finally { setBusy(false); }
  };

  const call = done?.call;
  const enquiryId = done?.enquiryId;
  const testCall = call?.mode === 'test' && call.ready && enquiryId;

  return (
    <div className="relative z-20 w-full min-h-screen bg-[#eef2f8] text-zinc-900" style={{ fontFamily: FONT }}>
      <section className="w-full text-white text-center px-6 pt-20 pb-36 sm:pt-24 sm:pb-40" style={{ background: NAVY }}>
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.28em]">
          Extreme Trailers <span className="mx-2 opacity-50">·</span> <span className="text-[#8fb4ff]">Make an enquiry</span>
        </p>
        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-[1.05]">Tell Ross<br />What You&rsquo;re After</h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-white/80 leading-relaxed">
          A trailer for your boat, a question about the range, or something bespoke: send it over and Ross&rsquo;s team will get back to you directly.
        </p>
      </section>

      <section className="px-5 sm:px-8 -mt-24 sm:-mt-28 pb-24">
        <div className="max-w-3xl mx-auto">
          {!done ? (
            <form onSubmit={submit} noValidate className="rounded-3xl bg-white border border-zinc-200 shadow-[0_24px_60px_-28px_rgba(6,46,105,0.45)] p-6 sm:p-10">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Name"><input className={FIELD} value={f.name} onChange={set('name')} autoComplete="name" required /></Field>
                <Field label="Email"><input type="email" className={FIELD} value={f.email} onChange={set('email')} autoComplete="email" required /></Field>
                <Field label="Phone" optional><input type="tel" className={FIELD} value={f.phone} onChange={set('phone')} autoComplete="tel" /></Field>
                <Field label="Trailer or boat of interest" optional>
                  <input className={FIELD} value={f.trailer} onChange={set('trailer')} list="trailer-models" placeholder="e.g. EXT750 Super Roller" />
                  <datalist id="trailer-models">{MODELS.map((m) => <option key={m.id} value={m.name} />)}</datalist>
                </Field>
                <Field label="Your message" wide>
                  <textarea className={`${FIELD} h-auto py-3 min-h-[140px] resize-y`} rows={5} value={f.message} onChange={set('message')} placeholder="What are you looking for, and any details that help us answer well…" required />
                </Field>
              </div>

              <fieldset className="mt-6">
                <legend className="text-sm font-semibold text-zinc-800 mb-2">How would you like to hear back?</legend>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-100">
                  {([['call', 'AI Ross rings me'], ['email', 'Email me']] as const).map(([id, label]) => (
                    <button key={id} type="button" aria-pressed={pref === id} onClick={() => setPref(id)}
                      className={`h-11 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${pref === id ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}`}>{label}</button>
                  ))}
                </div>
                {pref === 'call' && <p className="mt-2 text-xs text-zinc-500">AI Ross is an AI assistant with a voice based on Ross&rsquo;s. He&rsquo;ll ask a few quick questions about your boat so the team can reply with the right trailer. In this demo he talks to you in the browser after you send.</p>}
              </fieldset>

              <p className="mt-6 text-sm text-zinc-500">By sending this, your details will be used to reply to your enquiry{pref === 'call' ? ', including a call from AI Ross' : ''}.</p>
              {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
              <button type="submit" disabled={busy}
                className="mt-5 w-full h-14 rounded-full text-white text-[15px] font-bold uppercase tracking-[0.12em] shadow-[0_14px_30px_-12px_rgba(6,46,105,0.7)] hover:-translate-y-px transition-transform disabled:opacity-60 cursor-pointer" style={{ background: NAVY }}>
                {busy ? 'Sending…' : 'Send enquiry'}
              </button>
            </form>
          ) : (
            <div>
              <div className="rounded-3xl bg-white border border-zinc-200 shadow-[0_24px_60px_-28px_rgba(6,46,105,0.45)] p-8 sm:p-10 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: NAVY }}>Enquiry received</p>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">Thanks{f.name ? `, ${f.name.split(' ')[0]}` : ''}.</h2>
                <p className="mt-3 text-zinc-600 text-lg">
                  {testCall ? 'AI Ross is ready to talk about your enquiry. Press Start below.'
                    : call?.mode === 'live' ? 'AI Ross is calling you now. Please keep your phone close.'
                    : pref === 'call' && call?.reason === 'too_soon' ? 'We have your enquiry. A call from AI Ross was requested a moment ago, so please wait a minute before asking for another. The Extreme team will be in touch soon.'
                    : pref === 'call' ? 'We have your enquiry and the Extreme team will be in touch soon. AI Ross’s call isn’t available right now.'
                    : 'We have your enquiry and the Extreme team will be in touch by email soon.'}
                </p>
              </div>
              {testCall && <CallPanel enquiryId={enquiryId!} name={f.name} />}
              <div className="text-center mt-8">
                <button type="button" onClick={() => { setDone(null); setF({ name: '', email: '', phone: '', trailer: '', message: '' }); }}
                  className="text-sm font-semibold underline underline-offset-4 cursor-pointer" style={{ color: NAVY }}>Send another enquiry</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
