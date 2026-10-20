import { useCallback, useEffect, useRef, useState } from 'react';
import { UltravoxSession } from 'ultravox-client';
import type { CategoryId } from '../data/trailers';

// Everything the page needs to run an AI Ross conversation.
const HELPER = '/.netlify/functions/ross-start-call';

export type RossPhase =
  | 'checking'    // asking the helper whether Ross is switched on
  | 'offline'     // switched off, no key, or test limit reached
  | 'ready'       // can start
  | 'asking-mic'  // browser microphone prompt is showing
  | 'mic-blocked' // visitor said no to the microphone
  | 'connecting'
  | 'live'
  | 'ended'
  | 'error';

export interface RossInfo {
  enabled?: boolean;
  configured?: boolean;
  used?: number;
  maxTests?: number;
  maxSeconds?: number;
  error?: string;
  message?: string;
}

export interface RossPick {
  trailerId: string;
  reason: string;
}

export function useRoss() {
  const [phase, setPhase] = useState<RossPhase>('checking');
  const [info, setInfo] = useState<RossInfo>({});
  const [agentState, setAgentState] = useState('');
  const [caption, setCaption] = useState<{ speaker: string; text: string } | null>(null);
  const [highlighted, setHighlighted] = useState<CategoryId[] | null>(null);
  const [pick, setPick] = useState<RossPick | null>(null);
  const session = useRef<UltravoxSession | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(HELPER);
      const s: RossInfo = await r.json();
      setInfo(s);
      const canStart = s.enabled && s.configured && (s.used ?? 0) < (s.maxTests ?? 0);
      setPhase((p) => (p === 'checking' || p === 'offline' || p === 'ready' ? (canStart ? 'ready' : 'offline') : p));
      return canStart;
    } catch {
      setInfo({ error: 'no-helper', message: 'The Ross helper is not running.' });
      setPhase('offline');
      return false;
    }
  }, []);

  // Practice mode (your Mac only, never on the live site): add
  // ?rossPreview=ext750-maxi-roller to the address to see what happens
  // on screen when Ross recommends a trailer -- no call, no minutes used.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const id = new URLSearchParams(window.location.search).get('rossPreview');
    if (!id) return;
    setHighlighted(['roller', 'inflatable']);
    setPick({ trailerId: id, reason: 'Practice mode: this is how a recommendation from Ross will look.' });
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      session.current?.leaveCall();
    };
  }, [refresh]);

  const start = useCallback(async () => {
    // 1. Microphone first, so the visitor sees the browser prompt right after our explanation.
    setPhase('asking-mic');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setPhase('mic-blocked');
      return;
    }

    // 2. Ask the hidden helper to start a call (it checks the switch, limit and key).
    setPhase('connecting');
    setCaption(null);
    let d: any;
    try {
      const r = await fetch(HELPER, { method: 'POST' });
      d = await r.json();
      if (!r.ok || !d.joinUrl) {
        setInfo(d);
        setPhase(['offline', 'no-key', 'limit'].includes(d.error) ? 'offline' : 'error');
        return;
      }
    } catch {
      setInfo({ error: 'network', message: 'Could not reach the Ross helper.' });
      setPhase('error');
      return;
    }
    setInfo((i) => ({ ...i, used: d.used, maxTests: d.maxTests, maxSeconds: d.maxSeconds }));

    // 3. Connect, and give Ross his two on-screen actions.
    const s = new UltravoxSession();
    session.current = s;
    s.registerToolImplementation('highlightCategories', (p) => {
      setHighlighted(Array.isArray(p.categories) ? p.categories : null);
      return 'Those categories are now highlighted on screen.';
    });
    s.registerToolImplementation('showTrailer', (p) => {
      setPick({ trailerId: String(p.trailerId), reason: String(p.reason ?? '') });
      setTimeout(
        () => document.getElementById('ross-pick')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        200,
      );
      return 'The trailer is now showing on screen below the categories.';
    });
    s.addEventListener('status', () => {
      const st = s.status as string;
      setAgentState(st);
      if (['idle', 'listening', 'thinking', 'speaking'].includes(st)) setPhase('live');
      if (st === 'disconnected') {
        setPhase('ended');
        session.current = null;
        refresh();
      }
    });
    s.addEventListener('transcripts', () => {
      const all = s.transcripts.filter(Boolean);
      const last = all[all.length - 1];
      if (last?.text) setCaption({ speaker: last.speaker as string, text: last.text });
    });
    s.joinCall(d.joinUrl);
  }, [refresh]);

  const stop = useCallback(async () => {
    await session.current?.leaveCall();
  }, []);

  return { phase, info, agentState, caption, highlighted, pick, start, stop, refresh, setPick };
}
