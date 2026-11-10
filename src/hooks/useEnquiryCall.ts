import { useCallback, useEffect, useRef, useState } from 'react';
import { UltravoxSession } from 'ultravox-client';

// Joins one AI Ross follow-up call in the browser (test mode): asks for the microphone, connects to the
// Ultravox call the enquiry function created, and keeps the live transcript. Ross's voice plays through the
// browser's audio automatically.

export interface CallLine { speaker: 'agent' | 'user'; text: string; final: boolean }
export type CallPhase = 'idle' | 'asking-mic' | 'mic-blocked' | 'connecting' | 'live' | 'ended' | 'error';

export function useEnquiryCall() {
  const [phase, setPhase] = useState<CallPhase>('idle');
  const [state, setState] = useState('');                 // idle | listening | thinking | speaking
  const [lines, setLines] = useState<CallLine[]>([]);
  const session = useRef<UltravoxSession | null>(null);

  useEffect(() => () => { session.current?.leaveCall(); }, []);

  const start = useCallback(async (getJoinUrl: () => Promise<string>) => {
    setLines([]);
    setPhase('asking-mic');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setPhase('mic-blocked');
      return;
    }
    setPhase('connecting');
    try {
      const joinUrl = await getJoinUrl();
      const s = new UltravoxSession();
      session.current = s;
      s.addEventListener('status', () => {
        const st = s.status as string;
        setState(st);
        if (['idle', 'listening', 'thinking', 'speaking'].includes(st)) setPhase('live');
        if (st === 'disconnected') { setPhase('ended'); session.current = null; }
      });
      s.addEventListener('transcripts', () => {
        setLines(
          s.transcripts
            .filter((t) => t && t.text)
            .map((t) => ({ speaker: (t.speaker as string) === 'agent' ? 'agent' : 'user', text: t.text, final: !!t.isFinal } as CallLine)),
        );
      });
      s.joinCall(joinUrl);
    } catch {
      setPhase('error');
    }
  }, []);

  const end = useCallback(async () => { await session.current?.leaveCall(); }, []);

  return { phase, state, lines, start, end };
}
