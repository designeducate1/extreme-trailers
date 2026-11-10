import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWind, DEFAULT_PLACE, beaufort, seaHs, seaState, bandFor, BAND_STYLE } from './LaunchConditions';

// "Know before you launch": a contained two-card cluster at the foot of the home page.
// Left: today's launch conditions + tide. Right: the live Ultra Water slipway scene (loaded on demand, with a
// full-screen mode). The scene itself is the static build in /public/ultra-water.

const NAVY = '#12306b';
const SCENE_SRC = '/ultra-water/index.html?coast=lepe&embed=1';
const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const compass = (d: number) => DIRS[Math.round(((d % 360) + 360) / 22.5) % 16];
const hhmm = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });

// Rough harmonic tide model for Lepe (12h25 cycle, high water ~65 min after Portsmouth). A guide only.
const REF_HW = Date.parse('2026-11-04T06:17:00Z') + 65 * 60000;
const CYCLE = 745 * 60000;
const level = (t: number) => Math.cos((2 * Math.PI * (t - REF_HW)) / CYCLE); // +1 high water, -1 low water

function tideInfo(now: number) {
  const phase = (((now - REF_HW) % CYCLE) + CYCLE) % CYCLE;
  const toHigh = (CYCLE - phase) % CYCLE;
  const toLow = (CYCLE / 2 - phase + CYCLE) % CYCLE;
  const rising = phase > CYCLE / 2;
  return { rising, nextHigh: now + toHigh, nextLow: now + toLow };
}

const WAVE_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" /><path d="M2 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" /><path d="M8 11a4 4 0 118 0" />
  </svg>
);
const EXPAND_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
  </svg>
);

function TideCurve({ now }: { now: number }) {
  const W = 560, H = 130, PAD = 6;
  const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
  const start = d0.getTime();
  const pts: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const t = start + (i / 96) * 86400000;
    pts.push(`${(i / 96) * W},${PAD + ((1 - level(t)) / 2) * (H - 2 * PAD)}`);
  }
  const line = 'M' + pts.join(' L');
  const nx = ((now - start) / 86400000) * W;
  const ny = PAD + ((1 - level(now)) / 2) * (H - 2 * PAD);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Tide curve for today at Lepe">
      <path d={`${line} L${W},${H} L0,${H} Z`} fill="#eef2f8" />
      <path d={line} fill="none" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round" />
      <line x1={nx} x2={nx} y1={ny} y2={H} stroke={NAVY} strokeOpacity="0.25" strokeDasharray="3 3" />
      <circle cx={nx} cy={ny} r="5.5" fill="#fff" stroke={NAVY} strokeWidth="2.5" />
    </svg>
  );
}

const Stat: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="text-center px-2">
    <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: NAVY }}>{label}</div>
    <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900">{value}</div>
    {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
  </div>
);

export const UltraWaterCluster: React.FC = () => {
  const { wind, error } = useWind(DEFAULT_PLACE);
  const [now, setNow] = useState(() => Date.now());
  const [live, setLive] = useState(false);
  const [full, setFull] = useState(false);
  const inlineRef = useRef<HTMLIFrameElement>(null);
  const fullRef = useRef<HTMLIFrameElement>(null);

  // Hand the scene the exact reading this card shows, so the card, the HUD and the wave simulation share one source.
  const send = useCallback((el: HTMLIFrameElement | null) => {
    if (el?.contentWindow && wind) el.contentWindow.postMessage({ type: 'et-wind', wind }, window.location.origin);
  }, [wind]);
  useEffect(() => { send(inlineRef.current); send(fullRef.current); }, [send, live, full]);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [full]);

  const tide = useMemo(() => tideInfo(now), [now]);
  const band = wind ? bandFor(wind) : null;
  const style = band ? BAND_STYLE[band] : null;
  const hs = wind ? seaHs(wind) : null;
  const state = hs ? seaState(hs.hs) : null;
  const ms = wind ? wind.windMph * 0.44704 : null;
  const advice = band === 'good' ? 'Easy water — a good day to launch.'
    : band === 'care' ? 'Manageable sea — check locally before heading out.'
    : band === 'challenging' ? 'Rough water — most launches should wait.' : '';
  const nextLabel = tide.rising ? `Next high water ${hhmm(tide.nextHigh)}` : `Next low water ${hhmm(tide.nextLow)}`;

  return (
    <section className="relative z-20 w-full pointer-events-auto bg-[#eef2f8] text-zinc-900 font-sf px-5 sm:px-8 pt-24 pb-24 sm:pb-28 -mt-[calc(25vh+32px)]" aria-labelledby="uw-title">
      <div className="max-w-[1120px] mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: NAVY }}>Live launch conditions</p>
          <h2 id="uw-title" className="mt-3 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-[1.05]">Know Before You Launch.</h2>
          <p className="mt-4 text-lg text-zinc-500 max-w-2xl mx-auto">Live wind, waves and tide for your slipway, and the water itself, moving with today&rsquo;s real conditions.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          {/* ---- Weather + tide ---- */}
          <article className="bg-white rounded-[28px] border border-zinc-200/70 shadow-[0_18px_50px_-24px_rgba(18,48,107,0.35)] overflow-hidden flex flex-col">
            <div className="px-6 sm:px-8 pt-7 pb-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Today&rsquo;s launch conditions · live wind &amp; sea</p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">{DEFAULT_PLACE.name}</h3>
              {wind && style ? (
                <p className="mt-1.5 text-[15px]">
                  <span className="font-semibold" style={{ color: style.hex }}>{style.label}</span>
                  <span className="text-zinc-600"> · Force {beaufort(wind.windMph)} {compass(wind.dirDeg)} · {Math.round(wind.windMph)} mph · {hhmm(Date.parse(wind.time))}</span>
                </p>
              ) : (
                <p className="mt-1.5 text-[15px] text-zinc-500">{error ? 'Live data unavailable right now.' : 'Reading the sea…'}</p>
              )}
            </div>

            <div className="border-t border-zinc-100 px-4 sm:px-6 py-6 grid grid-cols-3 gap-2">
              <Stat label="Wind" value={wind ? `${Math.round(wind.windMph)} mph` : '—'} sub={wind ? `from ${compass(wind.dirDeg)}` : ''} />
              <Stat label="Waves" value={hs ? `${hs.hs.toFixed(1)} m` : '—'} sub={state ? `${state.name}${hs?.estimated ? ' (est.)' : ''}` : ''} />
              <Stat label="Sea temp" value={wind && typeof wind.seaTempC === 'number' ? `${Math.round(wind.seaTempC)}°C` : '—'} sub="surface" />
            </div>

            <div className="border-t border-zinc-100 px-6 sm:px-8 py-6 text-center">
              {advice && <p className="text-xl italic font-medium" style={{ color: NAVY }}>{advice}</p>}
              <p className="mt-2 text-sm text-zinc-500">A rough guide from wind &amp; sea data, not a safety check — always confirm real conditions before heading out.</p>
            </div>

            <div className="border-t border-zinc-100 px-6 sm:px-8 pt-6 pb-7 mt-auto">
              <h4 className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: NAVY }}>Tide — Lepe slipway</h4>
              <div className="mt-4"><TideCurve now={now} /></div>
              <div className="mt-1 flex justify-between text-xs text-zinc-400"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
              <div className="mt-4 flex flex-wrap justify-between gap-x-6 gap-y-1 text-[15px] font-semibold">
                <span>Now: {tide.rising ? 'rising' : 'falling'}</span>
                <span style={{ color: NAVY }}>{nextLabel}</span>
              </div>
              <p className="mt-2 text-[11px] text-zinc-400">Tide times are an approximate model — check local tide tables.</p>
            </div>
          </article>

          {/* ---- The water, in real time ---- */}
          <article className="bg-white rounded-[28px] border border-zinc-200/70 shadow-[0_18px_50px_-24px_rgba(18,48,107,0.35)] overflow-hidden flex flex-col">
            <header className="flex items-center justify-between gap-3 px-6 sm:px-8 py-5">
              <span className="w-10 flex justify-start">{WAVE_ICON}</span>
              <h3 className="text-[13px] sm:text-sm font-bold uppercase tracking-[0.16em] text-center">The water, in real time</h3>
              <button type="button" onClick={() => setFull(true)} aria-label="View the live water full screen" title="Full screen"
                className="w-10 h-10 rounded-full text-white grid place-items-center hover:-translate-y-px transition-transform shadow-md" style={{ background: NAVY }}>
                {EXPAND_ICON}
              </button>
            </header>

            <div className="relative flex-1 min-h-[360px] sm:min-h-[460px] bg-zinc-900 overflow-hidden">
              {live && !full ? (
                <iframe ref={inlineRef} onLoad={() => send(inlineRef.current)} src={SCENE_SRC} title="Live slipway and water simulation" className="absolute inset-0 w-full h-full border-0" allow="fullscreen" />
              ) : (
                <>
                  <img src="/ultra-water-poster.jpg" alt="Low over the Solent, looking along a slipway and its timber piles" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                  <div className="absolute inset-0 grid place-items-center">
                    <button type="button" onClick={() => setLive(true)}
                      className="inline-flex items-center gap-2.5 h-12 px-6 rounded-full bg-white/95 text-zinc-900 font-semibold shadow-xl hover:-translate-y-px transition-transform">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={NAVY} aria-hidden="true"><path d="M6 4l14 8-14 8z" /></svg>
                      {full ? 'Playing full screen' : 'Explore the live slipway'}
                    </button>
                  </div>
                  {wind && ms !== null && hs && (
                    <div className="absolute right-4 bottom-4 px-4 py-2 rounded-full bg-black/55 backdrop-blur text-white text-sm font-medium">
                      Right now: {ms.toFixed(1)} m/s · {hs.hs.toFixed(1)} m waves
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="px-6 sm:px-8 py-5 text-center text-sm text-zinc-500">
              Drag to look around · slipway modelled on Lepe · wind &amp; sea data: MET Norway (CC BY 4.0)
            </p>
          </article>
        </div>
      </div>

      {full && createPortal(
        <div className="fixed inset-0 z-[10000] bg-black" role="dialog" aria-modal="true" aria-label="Live water, full screen">
          <iframe ref={fullRef} onLoad={() => send(fullRef.current)} src={SCENE_SRC} title="Live slipway and water simulation, full screen" className="absolute inset-0 w-full h-full border-0" allow="fullscreen" />
          <button type="button" onClick={() => setFull(false)} aria-label="Close full screen"
            className="absolute right-4 top-4 h-11 px-5 rounded-full bg-white text-zinc-900 font-semibold shadow-xl hover:-translate-y-px transition-transform">
            Close ✕
          </button>
        </div>,
        document.body
      )}
    </section>
  );
};
