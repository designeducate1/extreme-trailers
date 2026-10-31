import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Loader2, Keyboard, Send } from 'lucide-react';
import type { RossInfo, RossPhase, RossMode, RossLine } from '../hooks/useRoss';

// The card that appears at the top of "Explore The Range" when someone
// clicks the AI Ross button. It explains what Ross is BEFORE asking for
// the microphone, then shows live status and captions during the chat.

interface Props {
  phase: RossPhase;
  info: RossInfo;
  agentState: string;
  caption: { speaker: string; text: string } | null;
  onStart: () => void;
  onStop: () => void;
  onClose: () => void;
  /** Typed rehearsal (test sites, ?rossRehearsal). */
  mode?: RossMode;
  rehearsalAvailable?: boolean;
  transcript?: RossLine[];
  onRehearse?: () => void;
  onSay?: (text: string) => void;
}

/** Text box for typing to Ross in a rehearsal. */
export function RehearsalInput({ onSay, busy, dark }: { onSay: (t: string) => void; busy?: boolean; dark?: boolean }) {
  const [text, setText] = useState('');
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!busy && text.trim()) { onSay(text); setText(''); } }}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your answer to Ross…" aria-label="Your answer"
        className={`flex-1 min-w-0 h-11 rounded-full px-4 text-[16px] outline-none border ${dark ? 'bg-white/10 border-white/25 text-white placeholder:text-white/50' : 'bg-white border-zinc-300 focus:border-[#13306b]'}`} />
      <button type="submit" disabled={busy || !text.trim()} aria-label="Send"
        className={`w-11 h-11 rounded-full grid place-items-center disabled:opacity-40 cursor-pointer ${dark ? 'bg-white text-[#13306b]' : 'bg-[#13306b] text-white'}`}>
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}

const Sparkle = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
    <path d="M10 2.5Q10.9 11.1 19 12Q10.9 12.9 10 21.5Q9.1 12.9 1 12Q9.1 11.1 10 2.5Z" />
    <path d="M19 1Q19.4 4.1 22.5 4.5Q19.4 4.9 19 8Q18.6 4.9 15.5 4.5Q18.6 4.1 19 1Z" />
  </svg>
);

const STATE_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  idle: 'Ready',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Ross is speaking',
};

export const RossPanel: React.FC<Props> = ({ phase, info, agentState, caption, onStart, onStop, onClose, mode, rehearsalAvailable, transcript = [], onRehearse, onSay }) => {
  const minutes = Math.round((info.maxSeconds ?? 180) / 60);
  const btn = 'px-5 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer';
  const primary = `${btn} bg-[#13306b] text-white hover:bg-[#0d2350] inline-flex items-center gap-2`;
  const quiet = `${btn} text-zinc-600 hover:text-black`;

  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }); }, [transcript.length, agentState]);

  const rehearseBtn = rehearsalAvailable && onRehearse ? (
    <button onClick={onRehearse} className={`${btn} border border-[#13306b] text-[#13306b] hover:bg-[#13306b]/5 inline-flex items-center gap-2`}>
      <Keyboard className="w-4 h-4" /> Typed rehearsal (no minutes)
    </button>
  ) : null;

  let body: React.ReactNode;
  switch (phase) {
    case 'checking':
      body = <p className="text-zinc-500">Checking whether AI Ross is available…</p>;
      break;
    case 'offline':
      body = (
        <>
          <p className="text-zinc-700">AI Ross is offline at the moment. Browse the range below and choose yourself.</p>
          <p className="mt-2 text-xs text-zinc-400">
            Draft status: {info.message || 'switched off'}
            {info.maxTests ? ` · ${info.used ?? 0} of ${info.maxTests} test calls used` : ''}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{rehearseBtn}<button onClick={onClose} className={quiet}>Close</button></div>
        </>
      );
      break;
    case 'ready':
    case 'mic-blocked':
    case 'error':
    case 'ended':
      body = (
        <>
          {phase === 'ended' && <p className="mb-3 font-semibold text-zinc-900">Chat ended.</p>}
          {phase === 'mic-blocked' && (
            <p className="mb-3 text-red-700 inline-flex items-center gap-2">
              <MicOff className="w-4 h-4" /> Microphone blocked. Allow it from the icon in your browser's address bar, then try again.
            </p>
          )}
          {phase === 'error' && <p className="mb-3 text-red-700">Something went wrong: {info.message || 'please try again.'}</p>}
          <p className="text-zinc-700 leading-relaxed">
            <strong>AI Ross is an AI assistant</strong> with a voice based on Ross, the owner of Extreme Trailers. He'll ask a few
            quick questions and show you the trailer that suits your boat.
          </p>
          <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
            He needs your microphone to hear you. Your voice is processed by our voice partner, Ultravox, to run the chat, and
            the chat isn't recorded. Each chat lasts up to {minutes} minutes.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button onClick={onStart} className={primary}>
              <Mic className="w-4 h-4" /> {phase === 'ended' ? 'Chat again' : 'Allow microphone & start'}
            </button>
            {rehearseBtn}
            <button onClick={onClose} className={quiet}>No thanks, I'll browse</button>
          </div>
        </>
      );
      break;
    case 'asking-mic':
      body = <p className="text-zinc-700">Your browser is asking to use your microphone. Choose <strong>Allow</strong> to talk to AI Ross.</p>;
      break;
    case 'connecting':
      body = <p className="text-zinc-700 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Connecting to AI Ross…</p>;
      break;
    case 'live':
      if (mode === 'rehearsal') {
        body = (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Typed rehearsal · same Ross, no Ultravox minutes</p>
            <div ref={log} className="mt-4 max-h-72 overflow-y-auto text-left space-y-2">
              {transcript.slice(-12).map((l, i) => (
                <p key={i} className={l.text.startsWith('[on screen') ? 'text-xs text-emerald-700 font-mono' : l.speaker === 'agent' ? 'text-zinc-800' : 'text-zinc-500 text-right'}>
                  {!l.text.startsWith('[on screen') && <span className="text-zinc-400 text-xs font-semibold mr-2">{l.speaker === 'agent' ? 'Ross' : 'You'}</span>}
                  {l.text}
                </p>
              ))}
              {agentState === 'thinking' && <p className="text-zinc-400 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Ross is thinking…</p>}
            </div>
            <div className="mt-4">{onSay && <RehearsalInput onSay={onSay} busy={agentState === 'thinking'} />}</div>
            <div className="mt-3"><button onClick={onStop} className={quiet}>End rehearsal</button></div>
          </>
        );
        break;
      }
      body = (
        <>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#13306b]">
            <span className={`w-2.5 h-2.5 rounded-full bg-emerald-500 ${agentState === 'speaking' ? 'animate-pulse' : ''}`} />
            {STATE_LABEL[agentState] ?? 'Live'}
          </div>
          <p className="mt-4 min-h-[3.5rem] text-lg sm:text-xl text-zinc-800 leading-snug">
            {caption ? (
              <>
                <span className="text-zinc-400 text-sm font-semibold mr-2">{caption.speaker === 'agent' ? 'Ross' : 'You'}</span>
                {caption.text}
              </>
            ) : (
              <span className="text-zinc-400">…</span>
            )}
          </p>
          <div className="mt-5">
            <button onClick={onStop} className={`${btn} bg-zinc-900 text-white hover:bg-black inline-flex items-center gap-2`}>
              <PhoneOff className="w-4 h-4" /> End chat
            </button>
          </div>
        </>
      );
      break;
  }

  return (
    <div className="max-w-2xl mx-auto mb-12 sm:mb-16 rounded-3xl bg-white border border-zinc-200 shadow-xl px-6 sm:px-10 py-7 text-center font-sf">
      <div className="flex items-center justify-center gap-2 mb-4 text-[#13306b]">
        <Sparkle />
        <span className="text-sm font-bold tracking-wide uppercase">AI Ross · Trailer Concierge</span>
      </div>
      {body}
    </div>
  );
};
