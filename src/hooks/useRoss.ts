import { useCallback, useEffect, useRef, useState } from 'react';
import { UltravoxSession } from 'ultravox-client';
import type { CategoryId } from '../data/trailers';
import { ROSS_GREETING as GREETING } from '../ai/rossBrain';

// Everything the page needs to run an AI Ross conversation.
const HELPER = '/.netlify/functions/ross-start-call';
const REHEARSE = '/.netlify/functions/ross-rehearse';

// Typed rehearsal (test sites only): add ?rossRehearsal to the address once;
// it's remembered for the rest of the visit.
function rehearsalWanted(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('rossRehearsal')) sessionStorage.setItem('rossRehearsal', '1');
    return sessionStorage.getItem('rossRehearsal') === '1';
  } catch { return false; }
}

export type RossMode = 'voice' | 'rehearsal';
export interface RossLine { speaker: 'agent' | 'user'; text: string }

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
  const [mode, setMode] = useState<RossMode>('voice');
  const [rehearsalAvailable] = useState(rehearsalWanted);
  const [transcript, setTranscript] = useState<RossLine[]>([]);
  const chat = useRef<any[]>([]);   // rehearsal history, OpenAI format

  // What Ross's tools do on screen. One implementation for both the voice
  // call and the typed rehearsal; each returns what Ross is told back.
  const runTool = useCallback((name: string, p: any): string => {
    if (name === 'highlightCategories') {
      setHighlighted(Array.isArray(p.categories) ? p.categories : null);
      return 'Those categories are now highlighted on screen.';
    }
    if (name === 'showTrailer') {
      setPick({ trailerId: String(p.trailerId), reason: String(p.reason ?? '') });
      setTimeout(
        () => document.getElementById('ross-pick')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        200,
      );
      return 'The trailer is now showing on screen below the categories.';
    }
    return `Unknown tool ${name}.`;
  }, []);

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
    const q = new URLSearchParams(window.location.search);
    // ?rossCallPreview: pretend a call is running, to check the call bar.
    if (q.has('rossCallPreview')) {
      setPhase('live');
      setAgentState('speaking');
      setCaption({ speaker: 'agent', text: "Here's the Launcher 3 in the builder. Does that look about right for your dinghy?" });
    }
    const id = q.get('rossPreview');
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
    setMode('voice');
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
    for (const name of ['highlightCategories', 'showTrailer']) {
      s.registerToolImplementation(name, (p) => runTool(name, p));
    }
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
  }, [refresh, runTool]);

  // ---- typed rehearsal: same brain and tools, OpenAI instead of Ultravox ----
  const startRehearsal = useCallback(() => {
    session.current?.leaveCall();
    chat.current = [{ role: 'assistant', content: GREETING }];
    setMode('rehearsal');
    setTranscript([{ speaker: 'agent', text: GREETING }]);
    setCaption({ speaker: 'agent', text: GREETING });
    setAgentState('listening');
    setPhase('live');
  }, []);

  const say = useCallback(async (text: string) => {
    text = text.trim();
    if (!text) return;
    chat.current.push({ role: 'user', content: text });
    setTranscript((t) => [...t, { speaker: 'user', text }]);
    setCaption({ speaker: 'user', text });
    setAgentState('thinking');
    try {
      // Ross may use a tool or two before answering; run them and carry on.
      for (let turn = 0; turn < 4; turn++) {
        const r = await fetch(REHEARSE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: chat.current }),
        });
        const d = await r.json();
        if (!r.ok || !d.message) throw new Error(d.error || `status ${r.status}`);
        const m = d.message;
        chat.current.push(m);
        if (m.content) {
          setTranscript((t) => [...t, { speaker: 'agent', text: m.content }]);
          setCaption({ speaker: 'agent', text: m.content });
        }
        if (!m.tool_calls?.length) break;
        for (const call of m.tool_calls) {
          let args: any = {};
          try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* empty */ }
          const result = runTool(call.function.name, args);
          setTranscript((t) => [...t, { speaker: 'agent', text: `[on screen: ${call.function.name}${args.trailerId ? ' ' + args.trailerId : args.categories ? ' ' + args.categories.join(', ') : ''}]` }]);
          chat.current.push({ role: 'tool', tool_call_id: call.id, content: result });
        }
      }
      setAgentState('listening');
    } catch (e: any) {
      setInfo({ error: 'rehearsal', message: e?.message === 'not-configured' ? 'No OpenAI key on this site.' : 'Could not reach the rehearsal helper.' });
      setAgentState('listening');
      setTranscript((t) => [...t, { speaker: 'agent', text: '(Rehearsal error: please try again.)' }]);
    }
  }, [runTool]);

  const stop = useCallback(async () => {
    if (mode === 'rehearsal') { setPhase('ended'); setAgentState(''); return; }
    await session.current?.leaveCall();
  }, [mode]);

  return { phase, info, agentState, caption, highlighted, pick, start, stop, refresh, setPick, mode, rehearsalAvailable, transcript, startRehearsal, say };
}
