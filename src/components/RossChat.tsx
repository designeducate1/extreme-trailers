import React, { useEffect, useRef, useState } from 'react';
import './RossChat.css';

// "Ask Ross": the AI text chat on every page, after Pete's concierge on the
// Boats of Dreams site, in Extreme's navy and blues. Talks to
// netlify/functions/ross-chat.mts, which calls OpenAI with the key kept on
// Netlify.
//
// The conversation is only remembered across reloads (sessionStorage) once
// the visitor says yes to "remember this chat"; until then it lives in this
// component alone. Other parts of the site open it with openRossChat().

const ENDPOINT = '/.netlify/functions/ross-chat';
const STORAGE_KEY = 'rossChatHistory';
const STORAGE_CONSENT = 'rossChatOptIn';
const GREETING = "Hi, I'm Ross, Extreme's AI assistant. Tell me what you tow and I'll find the trailer for it.";
const FALLBACK = "Sorry, I'm having trouble connecting just now. Please try again in a moment, or call Extreme on [023 8063 2535](tel:+442380632535).";
const NOT_READY = "I'm not switched on yet: the site's OpenAI key still needs adding. In the meantime, call Extreme on [023 8063 2535](tel:+442380632535).";
const SUGGESTIONS = ['Which trailer for my RIB?', 'Do I need a braked trailer?', 'Show me the Super Roller'];
const OPEN_EVENT = 'ross-chat:open';

type Msg = { role: 'user' | 'bot'; text: string };

/** Opens the chat from anywhere, optionally with Ross saying something first. */
export function openRossChat(intro?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { intro } }));
}

const ss = {
  get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } },
};
const consented = () => ss.get(STORAGE_CONSENT) === '1';

// [label](url) links only; everything else is plain text.
function render(text: string, onInternal: (href: string) => void) {
  const out: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(\s*((?:https?:\/\/|\/|tel:)[^\s)]+)\s*\)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push(text.slice(last, m.index));
    const href = m[2];
    const internal = href.startsWith('/');
    out.push(
      <a key={m.index} href={href}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        onClick={internal ? (e) => { e.preventDefault(); onInternal(href); } : undefined}>
        {m[1]}
      </a>,
    );
    last = re.lastIndex;
  }
  out.push(text.slice(last));
  return out;
}

interface Props {
  /** Lift the launcher clear of a page's own bottom bar on phones. */
  raised?: boolean;
  /** In-site links (/?builder..., /?range) switch view without a reload. */
  onNavigate: (href: string) => void;
}

export default function RossChat({ raised, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Msg[]>(() => {
    if (!consented()) return [];
    try { return JSON.parse(ss.get(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [remember, setRemember] = useState(consented);
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => { if (remember) ss.set(STORAGE_KEY, JSON.stringify(history)); }, [history, remember]);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }); }, [history, sending, open]);
  useEffect(() => { if (open) field.current?.focus({ preventScroll: true }); }, [open]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const intro = (e as CustomEvent).detail?.intro as string | undefined;
      setOpen(true);
      if (intro) setHistory((h) => (h.at(-1)?.text === intro ? h : [...h, { role: 'bot', text: intro }]));
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener(OPEN_EVENT, onOpen); window.removeEventListener('keydown', onKey); };
  }, []);

  const send = async (text: string) => {
    text = text.trim();
    if (!text || sending) return;
    setInput('');
    setOfferDismissed(true);
    const before = history;
    setHistory([...before, { role: 'user', text }]);
    setSending(true);
    let reply = FALLBACK;
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: before }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.reply) reply = data.reply;
      else if (data?.error === 'not-configured') reply = NOT_READY;
    } catch { /* keep fallback */ }
    setHistory((h) => [...h, { role: 'bot', text: reply }]);
    setSending(false);
  };

  const go = (href: string) => {
    onNavigate(href);
    if (window.matchMedia('(max-width: 639px)').matches) setOpen(false);
  };

  const fresh = history.length === 0;

  return (
    <div className={`ross-chat${open ? ' is-open' : ''}${raised ? ' is-raised' : ''}`}>
      <section className="ross-chat__panel" role="dialog" aria-label="Chat with Ross, Extreme's AI assistant" aria-hidden={!open}>
        <header className="ross-chat__header">
          <div>
            <p className="ross-chat__title">Ross</p>
            <p className="ross-chat__subtitle">AI Trailer Expert</p>
          </div>
          <button type="button" className="ross-chat__close" aria-label="Close chat" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <div className="ross-chat__messages" ref={list} aria-live="polite" data-lenis-prevent>
          {fresh && <div className="ross-chat__msg ross-chat__msg--bot">{GREETING}</div>}
          {history.map((m, i) => (
            <div key={i} className={`ross-chat__msg ross-chat__msg--${m.role}`}>{render(m.text, go)}</div>
          ))}
          {sending && <div className="ross-chat__msg ross-chat__msg--bot ross-chat__typing" aria-label="Ross is typing"><i /><i /><i /></div>}

          {fresh && (
            <div className="ross-chat__chips">
              {SUGGESTIONS.map((s) => <button key={s} type="button" onClick={() => send(s)}>{s}</button>)}
            </div>
          )}
          {!remember && !offerDismissed && fresh && (
            <div className="ross-chat__remember">
              <span>Remember this chat as you browse the site?</span>
              <div>
                <button type="button" className="is-yes" onClick={() => { ss.set(STORAGE_CONSENT, '1'); setRemember(true); }}>Yes, remember it</button>
                <button type="button" onClick={() => setOfferDismissed(true)}>No thanks</button>
              </div>
            </div>
          )}
        </div>

        <form className="ross-chat__form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input ref={field} value={input} onChange={(e) => setInput(e.target.value)} maxLength={500}
            placeholder="Ask Ross anything…" autoComplete="off" aria-label="Your message" />
          <button type="submit" aria-label="Send message" disabled={sending || !input.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </form>
        <p className="ross-chat__note">AI assistant. Prices are from the 2026 list; call to confirm.</p>
      </section>

      <button type="button" className="ross-chat__launcher" onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat with Ross' : 'Chat with Ross, Extreme’s AI assistant'} aria-expanded={open}>
        <span className="ross-chat__ring" aria-hidden="true" />
        {open ? (
          <svg className="ross-chat__x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <span className="ross-chat__label" aria-hidden="true">
            {'AI'.split('').map((c, i) => <span key={i} style={{ animationDelay: `${i * 0.15}s` }}>{c}</span>)}
            <small>Ross</small>
          </span>
        )}
      </button>
    </div>
  );
}
