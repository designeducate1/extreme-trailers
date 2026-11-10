import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWind, DEFAULT_PLACE, beaufort, seaHs, seaState, bandFor, BAND_STYLE } from './LaunchConditions';
import { TIDE, heightAt, depthOverToe, usable, usableSpans, nextFlip, nextHighLow, groundAt, rampLength } from '../lib/slipwayTide';

// "Know before you launch": a contained two-card cluster at the foot of the home page.
//   Left  - the answer (can I launch, and until when?), today's wind / waves / sea, and the tide with the launch window.
//   Right - the slipway in section, driven by the same tide and sea state, with the live 3D water behind a tab.
// One time scrubber drives the tide chart and the cross-section, so they always agree.

const NAVY = '#12306b';
const SCENE_SRC = '/ultra-water/index.html?coast=lepe&embed=1';
const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const compass = (d: number) => DIRS[Math.round(((d % 360) + 360) / 22.5) % 16];
const hhmm = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
const sign = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1);

const CARD = 'bg-white rounded-[28px] border border-zinc-200/70 shadow-[0_18px_50px_-24px_rgba(18,48,107,0.35)] overflow-hidden flex flex-col';

const EXPAND_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
  </svg>
);

const Stat: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="text-center px-2">
    <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: NAVY }}>{label}</div>
    <div className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900">{value}</div>
    {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
  </div>
);

// ---- tide chart: today's curve, the launch window shaded, a draggable marker ------------------------------------------
function TideChart({ dayStart, t, onScrub }: { dayStart: number; t: number; onScrub: (t: number) => void }) {
  const W = 560, H = 140, PT = 10, PB = 6;
  const day = 86400000;
  const y = (h: number) => PT + ((TIDE.AMP - h) / (2 * TIDE.AMP)) * (H - PT - PB);
  const x = (tt: number) => ((tt - dayStart) / day) * W;
  const pts: string[] = [];
  for (let i = 0; i <= 144; i++) { const tt = dayStart + (i / 144) * day; pts.push(`${x(tt).toFixed(1)},${y(heightAt(tt)).toFixed(1)}`); }
  const line = 'M' + pts.join(' L');
  const spans = usableSpans(dayStart, dayStart + day);
  const ref = useRef<SVGSVGElement>(null);
  const setFromEvent = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    onScrub(dayStart + Math.round((f * day) / 300000) * 300000);
  };
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-none cursor-ew-resize select-none" role="img"
      aria-label="Tide curve for today with the launch window shaded. Drag to change the time."
      onPointerDown={(e) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); setFromEvent(e); }}
      onPointerMove={(e) => { if (e.buttons) setFromEvent(e); }}>
      {spans.map(([a, b], i) => <rect key={i} x={x(a)} y={PT - 4} width={x(b) - x(a)} height={H - PT - PB + 4} fill="#16a34a" opacity="0.10" />)}
      <line x1="0" x2={W} y1={y(TIDE.TOE + TIDE.NEED)} y2={y(TIDE.TOE + TIDE.NEED)} stroke="#16a34a" strokeOpacity="0.55" strokeDasharray="4 4" />
      <path d={`${line} L${W},${H} L0,${H} Z`} fill="#eef2f8" />
      <path d={line} fill="none" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round" />
      <line x1={x(t)} x2={x(t)} y1={PT - 4} y2={H} stroke={NAVY} strokeOpacity="0.3" />
      <circle cx={x(t)} cy={y(heightAt(t))} r="6" fill="#fff" stroke={NAVY} strokeWidth="2.6" />
    </svg>
  );
}

// ---- the slipway in section -------------------------------------------------------------------------------------------------
function SlipwaySection({ t, hs, windMph }: { t: number; hs: number; windMph: number }) {
  const W = 640, H = 330;
  const X0 = -10, X1 = 74;                  // metres along the section shown
  const E_TOP = 4.0, E_BOT = -2.7;          // metres of height shown
  const px = (m: number) => ((m - X0) / (X1 - X0)) * W;
  const py = (e: number) => 14 + ((E_TOP - e) / (E_TOP - E_BOT)) * (H - 44);
  const level = heightAt(t);
  const ok = usable(t);
  const over = depthOverToe(t);
  const rampEnd = rampLength;

  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (now: number) => { setPhase((p) => p + (now - last) * 0.0016); last = now; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const amp = Math.max(0.03, Math.min(1.2, hs)) / 2;                // metres, half the significant wave height
  const lambda = 14 + Math.min(20, windMph);                          // wavelength, metres (stylised)
  const surf: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const m = X0 + (i / 80) * (X1 - X0);
    const e = level + amp * Math.sin((2 * Math.PI * m) / lambda - phase);
    surf.push(`${px(m).toFixed(1)},${py(e).toFixed(1)}`);
  }
  const waterPath = `M${surf.join(' L')} L${W},${H} L0,${H} Z`;
  const ground: string[] = [];
  for (let i = 0; i <= 120; i++) { const m = X0 + (i / 120) * (X1 - X0); ground.push(`${px(m).toFixed(1)},${py(groundAt(m)).toFixed(1)}`); }
  const groundPath = `M${ground.join(' L')} L${W},${H} L0,${H} Z`;
  const rampPts = [0, rampEnd].map((m) => `${px(m).toFixed(1)},${py(groundAt(m)).toFixed(1)}`);
  const toeX = px(rampEnd), toeY = py(TIDE.TOE);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img"
      aria-label={`Cross-section of a 1 in 10 slipway. Water level ${sign(level)} metres, ${over >= 0 ? over.toFixed(1) + ' metres of water over the end of the ramp' : 'the end of the ramp is dry'}.`}>
      <defs>
        <linearGradient id="uw-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6fb0dc" stopOpacity="0.95" /><stop offset="1" stopColor="#2f6fa8" stopOpacity="0.95" /></linearGradient>
        <linearGradient id="uw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4f7fc" /><stop offset="1" stopColor="#e6edf7" /></linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#uw-sky)" />
      {[2, 0, -2].map((e) => (
        <g key={e}>
          <line x1="0" x2={W} y1={py(e)} y2={py(e)} stroke={NAVY} strokeOpacity={e === 0 ? 0.18 : 0.1} strokeDasharray={e === 0 ? '0' : '3 5'} />
          <text x={W - 6} y={py(e) - 5} textAnchor="end" fontSize="11" fill="#64748b">{e === 2 ? 'High water' : e === -2 ? 'Low water' : 'Mean sea level'} {sign(e)} m</text>
        </g>
      ))}
      <path d={waterPath} fill="url(#uw-water)" />
      <path d={groundPath} fill="#e4dccb" />
      <polyline points={`${px(X0)},${py(TIDE.RAMP_TOP)} ${rampPts.join(' ')}`} fill="none" stroke="#9aa3ad" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={ground.slice(Math.round(((rampEnd - X0) / (X1 - X0)) * 120)).join(' ')} fill="none" stroke="#b9ad92" strokeWidth="2" />
      <text x={px(0) + 8} y={py(TIDE.RAMP_TOP) - 10} fontSize="11.5" fill="#475569">Top of ramp</text>
      <g transform={`translate(${px(rampEnd / 2) + 6},${py(groundAt(rampEnd / 2)) - 12}) rotate(${(Math.atan2(py(TIDE.TOE) - py(TIDE.RAMP_TOP), px(rampEnd) - px(0)) * 180) / Math.PI})`}>
        <text fontSize="11.5" fill="#475569">1 : 10 concrete ramp</text>
      </g>
      <circle cx={toeX} cy={toeY} r="4.5" fill="#fff" stroke="#475569" strokeWidth="2" />
      <text x={toeX + 9} y={toeY + 18} fontSize="11.5" fill="#475569">Ramp end</text>
      {over > 0.02 && (
        <g stroke={ok ? '#16a34a' : '#d97706'} strokeWidth="2">
          <line x1={toeX + 34} x2={toeX + 34} y1={py(level)} y2={toeY} />
          <line x1={toeX + 28} x2={toeX + 40} y1={py(level)} y2={py(level)} />
          <line x1={toeX + 28} x2={toeX + 40} y1={toeY} y2={toeY} />
          <text x={toeX + 46} y={(py(level) + toeY) / 2 + 4} fontSize="12.5" fontWeight="700" fill={ok ? '#15803d' : '#b45309'} stroke="none">{over.toFixed(1)} m over the ramp end</text>
        </g>
      )}
      {over <= 0.02 && <text x={toeX + 12} y={toeY - 14} fontSize="12.5" fontWeight="700" fill="#b45309">Ramp end is dry</text>}
      <g>
        <line x1={0} x2={34} y1={py(level)} y2={py(level)} stroke={NAVY} strokeWidth="1.5" />
        <rect x={34} y={py(level) - 11} width="86" height="22" rx="11" fill={NAVY} />
        <text x={77} y={py(level) + 4.5} fontSize="12" fontWeight="700" textAnchor="middle" fill="#fff">{sign(level)} m</text>
      </g>
    </svg>
  );
}

export const UltraWaterCluster: React.FC = () => {
  const { wind, error } = useWind(DEFAULT_PLACE);
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<'section' | 'live'>('section');
  const [full, setFull] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);   // null = follow the clock
  const inlineRef = useRef<HTMLIFrameElement>(null);
  const fullRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(i); }, []);
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [full]);

  // The live scene gets the exact reading this card shows, so card, overlay and wave simulation share one source.
  const send = useCallback((el: HTMLIFrameElement | null) => {
    if (el?.contentWindow && wind) el.contentWindow.postMessage({ type: 'et-wind', wind }, window.location.origin);
  }, [wind]);
  useEffect(() => { send(inlineRef.current); send(fullRef.current); }, [send, tab, full]);

  const t = scrub ?? now;
  const dayStart = useMemo(() => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime(); }, [now]);
  const hs = wind ? seaHs(wind) : null;
  const state = hs ? seaState(hs.hs) : null;
  const band = wind ? bandFor(wind) : null;
  const tideOk = usable(now);
  const flip = nextFlip(now);
  const tideNow = nextHighLow(now);

  // The headline answer: sea state and the tide window, in plain words.
  let verdict = 'Reading the sea…', detail = '', color = '#64748b';
  if (wind && band) {
    if (band === 'challenging') { verdict = 'Not recommended today'; detail = 'Rough water: most launches should wait.'; color = BAND_STYLE.challenging.hex; }
    else if (!tideOk) { verdict = 'Wait for the tide'; detail = flip ? `The slipway is usable from ${hhmm(flip)}.` : 'Check the tide table.'; color = '#d97706'; }
    else { verdict = band === 'care' ? 'Launch with care' : 'Good to launch'; detail = flip ? `Slipway usable until ${hhmm(flip)}.` : 'Slipway usable.'; color = BAND_STYLE[band].hex; }
  } else if (error) { verdict = 'Live data unavailable'; detail = 'Try again in a moment.'; }

  const minutes = Math.round((t - dayStart) / 60000);
  const scrubbing = scrub !== null;
  const spans = usableSpans(dayStart, dayStart + 86400000);
  const levelT = heightAt(t), overT = depthOverToe(t), okT = usable(t);

  return (
    <section className="relative z-20 w-full pointer-events-auto bg-[#eef2f8] text-zinc-900 font-sf px-5 sm:px-8 pt-24 pb-24 sm:pb-28 -mt-[calc(25vh+32px)]" aria-labelledby="uw-title">
      <div className="max-w-[1120px] mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: NAVY }}>Live launch conditions</p>
          <h2 id="uw-title" className="mt-3 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-[1.05]">Know Before You Launch.</h2>
          <p className="mt-4 text-lg text-zinc-500 max-w-2xl mx-auto">Live wind, waves and tide for your slipway: whether you can launch, and for how long.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          {/* ---- the answer, the sea, the tide ---- */}
          <article className={CARD}>
            <div className="px-6 sm:px-8 pt-7 pb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">Today&rsquo;s launch conditions · live wind &amp; sea</p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">{DEFAULT_PLACE.name}</h3>
              <div className="mt-4 flex items-start gap-3">
                <span className="mt-1.5 w-3 h-3 rounded-full shrink-0" style={{ background: color }} aria-hidden="true" />
                <div>
                  <p className="text-2xl sm:text-[28px] font-bold tracking-tight leading-tight" style={{ color }}>{verdict}</p>
                  <p className="text-[15px] text-zinc-600 mt-0.5">{detail}</p>
                </div>
              </div>
              {wind && <p className="mt-3 text-sm text-zinc-500">Force {beaufort(wind.windMph)} {compass(wind.dirDeg)} · {Math.round(wind.windMph)} mph · reading for {hhmm(Date.parse(wind.time))}</p>}
            </div>

            <div className="border-t border-zinc-100 px-4 sm:px-6 py-6 grid grid-cols-3 gap-2">
              <Stat label="Wind" value={wind ? `${Math.round(wind.windMph)} mph` : '—'} sub={wind ? `from ${compass(wind.dirDeg)}` : ''} />
              <Stat label="Waves" value={hs ? `${hs.hs.toFixed(1)} m` : '—'} sub={state ? `${state.name}${hs?.estimated ? ' (est.)' : ''}` : ''} />
              <Stat label="Sea temp" value={wind && typeof wind.seaTempC === 'number' ? `${Math.round(wind.seaTempC)}°C` : '—'} sub="surface" />
            </div>

            <div className="border-t border-zinc-100 px-6 sm:px-8 pt-6 pb-7 mt-auto">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="text-[12px] font-bold uppercase tracking-[0.14em]" style={{ color: NAVY }}>Tide — Lepe slipway</h4>
                <span className="text-xs text-zinc-400">Drag to change the time</span>
              </div>
              <div className="mt-4"><TideChart dayStart={dayStart} t={t} onScrub={setScrub} /></div>
              <div className="mt-1 flex justify-between text-xs text-zinc-400"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
              <div className="mt-4 flex flex-wrap justify-between gap-x-6 gap-y-1 text-[15px] font-semibold">
                <span>{scrubbing ? hhmm(t) : 'Now'}: {sign(levelT)} m · {okT ? 'usable' : 'too low'}</span>
                <span style={{ color: NAVY }}>{tideNow.rising ? `Next high water ${hhmm(tideNow.nextHigh)}` : `Next low water ${hhmm(tideNow.nextLow)}`}</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                Launch window{spans.length ? `: ${spans.map(([a, b]) => `${hhmm(a)}–${hhmm(b)}`).join(', ')}` : ''}. Assumes about {TIDE.NEED.toFixed(1)} m of water over the end of the ramp. Tide times and heights are an approximate model: check local tide tables.
              </p>
            </div>
          </article>

          {/* ---- the slipway ---- */}
          <article className={CARD}>
            <header className="flex items-center justify-between gap-3 px-6 sm:px-8 pt-6 pb-4">
              <h3 className="text-[13px] sm:text-sm font-bold uppercase tracking-[0.16em]">The slipway, right now</h3>
              {tab === 'live' && (
                <button type="button" onClick={() => setFull(true)} aria-label="View the live water full screen" title="Full screen"
                  className="w-10 h-10 rounded-full text-white grid place-items-center hover:-translate-y-px transition-transform shadow-md" style={{ background: NAVY }}>
                  {EXPAND_ICON}
                </button>
              )}
            </header>
            <div className="px-6 sm:px-8 pb-4">
              <div role="tablist" aria-label="View" className="inline-grid grid-cols-2 gap-1 p-1 rounded-full bg-zinc-100">
                {([['section', 'Cross-section'], ['live', 'Live view']] as const).map(([id, label]) => (
                  <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                    className={`h-9 px-5 rounded-full text-sm font-semibold transition-colors ${tab === id ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}`}>{label}</button>
                ))}
              </div>
            </div>

            {tab === 'section' ? (
              <div className="flex-1 flex flex-col">
                <div className="px-3 sm:px-4">
                  <div className="rounded-2xl overflow-hidden border border-zinc-100">
                    <SlipwaySection t={t} hs={hs?.hs ?? 0.3} windMph={wind?.windMph ?? 8} />
                  </div>
                </div>
                <div className="px-6 sm:px-8 pt-5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">{scrubbing ? hhmm(t) : 'Now'}</span>
                    <span className="font-semibold" style={{ color: okT ? '#15803d' : '#b45309' }}>
                      {okT ? `Boat floats off: ${overT.toFixed(1)} m over the ramp end` : overT > 0 ? `Only ${overT.toFixed(1)} m: too shallow yet` : 'Ramp end is dry'}
                    </span>
                  </div>
                  <input type="range" min={0} max={1440} step={5} value={Math.min(1440, Math.max(0, minutes))}
                    onChange={(e) => setScrub(dayStart + Number(e.target.value) * 60000)}
                    aria-label="Time of day" className="mt-3 w-full accent-[#12306b]" />
                  <div className="mt-1 flex justify-between text-xs text-zinc-400"><span>00:00</span><span>12:00</span><span>24:00</span></div>
                  {scrubbing && <button type="button" onClick={() => setScrub(null)} className="mt-2 text-sm font-semibold underline underline-offset-4" style={{ color: NAVY }}>Back to now</button>}
                </div>
                <p className="px-6 sm:px-8 py-5 mt-auto text-center text-xs leading-relaxed text-zinc-400">
                  Example 1:10 slipway, vertical scale exaggerated · waves drawn at today&rsquo;s live height · tide and ramp heights are illustrative · wind &amp; sea data: MET Norway (CC BY 4.0)
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="relative flex-1 min-h-[360px] sm:min-h-[430px] bg-zinc-100 overflow-hidden">
                  {full ? (
                    <div className="absolute inset-0 grid place-items-center text-sm text-zinc-500">Viewing full screen</div>
                  ) : (
                    <iframe ref={inlineRef} onLoad={() => send(inlineRef.current)} src={SCENE_SRC} title="Live slipway and water simulation" className="absolute inset-0 w-full h-full border-0" allow="fullscreen" />
                  )}
                </div>
                <p className="px-6 sm:px-8 py-5 text-center text-xs leading-relaxed text-zinc-400">
                  The same live reading drives these waves · drag to look around · slipway modelled on Lepe · wind &amp; sea data: MET Norway (CC BY 4.0)
                </p>
              </div>
            )}
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
