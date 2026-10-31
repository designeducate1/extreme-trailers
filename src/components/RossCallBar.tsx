import React from 'react';
import { PhoneOff, Loader2 } from 'lucide-react';
import { useRossContext, inCall } from '../hooks/RossContext';

// While a voice call is running and the customer is away from the AI Ross
// card (e.g. Ross has opened the Trailer Builder), a small bar in the corner
// keeps the call visible: who's talking, the latest caption, and End.

const STATE_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  idle: 'Ready',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking',
};

export default function RossCallBar({ hidden, raised }: { hidden?: boolean; raised?: boolean }) {
  const { phase, agentState, caption, stop } = useRossContext();
  if (hidden || !inCall(phase)) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed z-[46] left-4 sm:left-5 right-[92px] sm:right-auto sm:w-[380px] ${raised ? 'bottom-[92px] lg:bottom-5' : 'bottom-4 sm:bottom-5'} rounded-2xl bg-gradient-to-br from-[#12306b] to-[#0d2352] text-white shadow-[0_18px_40px_-12px_rgba(13,35,82,0.6)] px-4 py-3 font-sf`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#5cc8ff]">
        {phase === 'connecting'
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <span className={`w-2 h-2 rounded-full bg-emerald-400 ${agentState === 'speaking' ? 'animate-pulse' : ''}`} />}
        AI Ross · {phase === 'connecting' ? 'Connecting…' : STATE_LABEL[agentState] ?? 'Live'}
        <button
          type="button"
          onClick={() => stop()}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/12 hover:bg-white/20 px-3 py-1.5 text-[11px] font-semibold normal-case tracking-normal text-white cursor-pointer"
        >
          <PhoneOff className="w-3.5 h-3.5" /> End
        </button>
      </div>
      <p className="mt-2 text-[15px] leading-snug line-clamp-2 min-h-[1.4em]">
        {caption ? (
          <>
            <span className="text-white/50 text-xs font-semibold mr-1.5">{caption.speaker === 'agent' ? 'Ross' : 'You'}</span>
            {caption.text}
          </>
        ) : (
          <span className="text-white/40">…</span>
        )}
      </p>
    </div>
  );
}
