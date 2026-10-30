import React, { useCallback, useEffect, useRef, useState } from 'react';

// Live wind + sea -> vector "sea tanks" on the Explore The Range cards.
//
// Data comes through our own hidden helper (netlify/functions/wind.mts):
// MET Norway Locationforecast + Oceanforecast (free, commercial use permitted
// with credit) and OpenStreetMap place search. Gusts are only available from
// MET Norway in the Nordic area, so in the UK the bands use mean wind only.
// Wave height exists only at sea points; inland we estimate it from the wind
// and say so on screen.
//
// The rotating-blob water technique is adapted from the "e-card" by
// MikeAndrewDesigner on Uiverse.io (MIT licence).

export interface Place { name: string; lat: number; lon: number }
export interface Wind {
  windMph: number; gustMph: number | null; dirDeg: number; time: string;
  waveM?: number | null; seaTempC?: number | null; seaPoint?: { lat: number; lon: number } | null;
}
export type Band = 'good' | 'care' | 'challenging';

export const DEFAULT_PLACE: Place = { name: 'Southampton Water, UK', lat: 50.86, lon: -1.36 };

// ---- data (via our hidden helper) ------------------------------------------
async function fetchWind(p: Place): Promise<Wind> {
  const r = await fetch(`/.netlify/functions/wind?lat=${p.lat.toFixed(4)}&lon=${p.lon.toFixed(4)}`);
  if (!r.ok) throw new Error('wind ' + r.status);
  return r.json();
}

export async function geocode(q: string): Promise<Place | null> {
  const r = await fetch(`/.netlify/functions/wind?q=${encodeURIComponent(q)}`);
  if (!r.ok) return null;
  return r.json();
}

const cacheKey = (p: Place) => `et-wind3:${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
const CACHE_MS = 15 * 60 * 1000;

export function useWind(place: Place) {
  const [wind, setWind] = useState<Wind | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    try {
      const raw = localStorage.getItem(cacheKey(place));
      if (raw) {
        const c = JSON.parse(raw);
        if (Date.now() - c.at < CACHE_MS) { setWind(c.wind); setError(false); return; }
      }
    } catch { /* storage unavailable -- just fetch */ }
    try {
      const w = await fetchWind(place);
      setWind(w); setError(false);
      try { localStorage.setItem(cacheKey(place), JSON.stringify({ at: Date.now(), wind: w })); } catch { /* ignore */ }
    } catch { setError(true); }
  }, [place]);
  useEffect(() => {
    setWind(null);
    load();
    const t = setInterval(load, CACHE_MS);
    return () => clearInterval(t);
  }, [load]);
  return { wind, error };
}

// ---- general launch-condition bands (a guide only; Ross to confirm) -----
export function beaufort(mph: number) {
  const t = [1, 4, 8, 13, 19, 25, 32, 39, 47, 55, 64, 73];
  let f = 0; while (f < t.length && mph >= t[f]) f++; return f;
}
// Significant wave height (Hs): measured where MET has sea data, otherwise
// the Beaufort "probable wave height" (open sea, so it over-states sheltered water).
const BF_WAVE = [0, 0.1, 0.2, 0.6, 1, 2, 3, 4, 5.5, 7, 9, 11.5, 14];
export function seaHs(w: Wind): { hs: number; estimated: boolean } {
  if (typeof w.waveM === 'number') return { hs: w.waveM, estimated: false };
  return { hs: BF_WAVE[beaufort(w.windMph)], estimated: true };
}
// WMO sea-state code (Douglas scale) from Hs.
const WMO: [number, string][] = [[0.1, 'Calm (rippled)'], [0.5, 'Smooth'], [1.25, 'Slight'], [2.5, 'Moderate'], [4, 'Rough'], [6, 'Very rough'], [9, 'High'], [14, 'Very high']];
export function seaState(hs: number): { code: number; name: string } {
  if (hs <= 0) return { code: 0, name: 'Calm (glassy)' };
  for (let i = 0; i < WMO.length; i++) if (hs < WMO[i][0]) return { code: i + 1, name: WMO[i][1] };
  return { code: 9, name: 'Phenomenal' };
}
/** 0 = flat calm, 1 = dangerous (Force 6+ / Hs 2.5 m+ and beyond). */
export function severity(w: Wind): number {
  const { hs } = seaHs(w);
  return Math.max(0, Math.min(1, Math.max(w.windMph / 30, hs / 3)));
}
export function bandFor(w: Wind): Band {
  const g = w.gustMph ?? 0; // gusts only where the source provides them
  const hs = typeof w.waveM === 'number' ? w.waveM : 0; // measured sea only; estimates follow the wind anyway
  if (w.windMph >= 25 || g >= 38 || hs >= 2.5) return 'challenging'; // Force 6+, strong gusts, rough sea
  if (w.windMph >= 13 || g >= 25 || hs >= 1.25) return 'care';        // Force 4-5, gusty, moderate sea
  return 'good';                                                        // Force 0-3, slight sea or less
}
export const BAND_STYLE: Record<Band, { label: string; hex: string; soft: string }> = {
  good: { label: 'Good conditions', hex: '#16a34a', soft: 'rgba(22,163,74,0.14)' },
  care: { label: 'Take care', hex: '#d97706', soft: 'rgba(217,119,6,0.14)' },
  challenging: { label: 'Challenging', hex: '#dc2626', soft: 'rgba(220,38,38,0.14)' },
};
// ---- per-trailer guide (EXAMPLE limits for the pitch -- Ross to confirm) --
// calm / rough = significant wave height in metres; windCare = mean wind (mph)
// at which that trailer type moves to "take care". Force 6+ is rough for all.
export interface LaunchLimit { calm: number; rough: number; windCare: number }
export const LAUNCH_LIMITS: Record<string, LaunchLimit | null> = {
  'fixed-keel': { calm: 0.3, rough: 0.75, windCare: 19 },
  launcher: { calm: 0.3, rough: 0.75, windCare: 13 },
  inflatable: { calm: 0.4, rough: 0.9, windCare: 13 },
  pwc: { calm: 0.5, rough: 1.0, windCare: 13 },
  bunk: { calm: 0.5, rough: 1.0, windCare: 19 },
  roller: { calm: 0.6, rough: 1.25, windCare: 19 },
  stainless: { calm: 0.6, rough: 1.25, windCare: 19 },
  dollies: null, // workshop / showroom only -- never launched
};
export function trailerBand(w: Wind, lim: LaunchLimit): Band {
  const g = w.gustMph ?? 0;
  const { hs } = seaHs(w);
  if (w.windMph >= 25 || g >= 38 || hs >= lim.rough) return 'challenging';
  if (w.windMph >= lim.windCare || hs > lim.calm) return 'care';
  return 'good';
}
export const TRAILER_BAND_LABEL: Record<Band, string> = {
  good: 'Suits today',
  care: 'Take care today',
  challenging: 'Too rough today',
};
/** Card tank scale: 0 m at 80% down the tank, 1.5 m+ at 16%. */
export const hsToTop = (hs: number) => 80 - (Math.min(Math.max(hs, 0), 1.5) / 1.5) * 64;

// Water colours: [surface, depth]
export const SEA_CALM: [string, string] = ['#67e8f9', '#0891b2'];   // reference: flat calm (teal)
export const SEA_DANGER: [string, string] = ['#ff3b3b', '#9f1239']; // reference: dangerous (harsh red)
export const SEA_BAND: Record<Band, [string, string]> = {
  good: ['#38bdf8', '#1d4ed8'],
  care: ['#fcd34d', '#d97706'],
  challenging: ['#f87171', '#b91c1c'],
};

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const compass = (deg: number) => COMPASS[Math.round(deg / 45) % 8];


// ---- vector sea tank -----------------------------------------------------
// Three large, softly-rounded squares rotate behind a window; their top edges
// form the water surface. Rounder = flatter water, squarer = bigger swell,
// faster = choppier, higher = more sea. Driven by one severity value 0..1.
export const SeaTank: React.FC<{
  s: number; colors: [string, string]; className?: string; markers?: boolean; label?: string;
  /** Water line as % from the top (overrides the level worked out from s). */
  surface?: number;
  /** Per-trailer calm / rough lines and today's dot, as % from the top. */
  marks?: { calm: number; rough: number; dot: number };
}> = ({ s, colors, className = '', markers = false, label, surface, marks }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current; if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  const v = Math.max(0, Math.min(1, s));
  const style = {
    '--surface': `${surface ?? 72 - v * 44}%`,  // water line, from the top of the tank
    '--r': `${50 - v * 12}%`,                   // 50% = circle (glassy) -> 38% (steep crests)
    '--size': `${240 - v * 140}%`,              // big slow blobs (long swell) -> small ones (short, steep chop)
    '--op': (0.5 + v * 0.25).toFixed(2),        // rough water reads denser
    '--dur': `${(40 - v * 36.5).toFixed(1)}s`,  // 40s lazy turn -> 3.5s churning
    '--c1': colors[0], '--c2': colors[1],
  } as React.CSSProperties;
  return (
    <div ref={ref} className={`sea-tank ${visible ? '' : 'is-paused'} ${className}`} style={style} role="img" aria-label={label}>
      <div className="sea-wave" /><div className="sea-wave" /><div className="sea-wave" />
      {markers && !marks && (
        <>
          <div className="sea-mark" style={{ top: '72%' }}><span>calm</span></div>
          <div className="sea-mark sea-mark-danger" style={{ top: '28%' }}><span>rough</span></div>
        </>
      )}
      {marks && (
        <>
          <div className="sea-mark sea-mark-calm" style={{ top: `${marks.calm}%` }}><span>calm</span></div>
          <div className="sea-mark sea-mark-danger" style={{ top: `${marks.rough}%` }}><span>rough</span></div>
          <div className="sea-dot" style={{ top: `${marks.dot}%` }} aria-hidden="true" />
        </>
      )}
    </div>
  );
};

/** One-line technical summary used on cards and in the scale. */
export function seaLine(w: Wind) {
  const { hs, estimated } = seaHs(w);
  const st = seaState(hs);
  return { st, hs, estimated, text: `Sea state ${st.code} · ${st.name} · Hs ${hs.toFixed(1)} m${estimated ? ' (est.)' : ''}` };
}

const SeaScale: React.FC<{ wind: Wind; band: Band }> = ({ wind, band }) => {
  const sl = seaLine(wind);
  // Three short lines per tank so they never break mid-phrase on a 360px phone.
  // [shown everywhere, extra shown from tablet size up]
  const seaT = typeof wind.seaTempC === 'number' ? ` · Sea ${wind.seaTempC.toFixed(0)}°C` : '';
  const items: { key: string; s: number; colors: [string, string]; title: string; lines: [string, string][] }[] = [
    { key: 'calm', s: 0, colors: SEA_CALM, title: 'Flat calm', lines: [['Calm', ' · state 0–1'], ['Hs < 0.1 m', ''], ['Force 0–1', '']] },
    {
      key: 'today', s: severity(wind), colors: SEA_BAND[band], title: 'Today, live',
      lines: [
        [sl.st.name, ` · state ${sl.st.code}`],
        [`Hs ${sl.hs.toFixed(1)} m${sl.estimated ? ' (est.)' : ''}`, ''],
        [`Force ${beaufort(wind.windMph)} ${compass(wind.dirDeg)}`, seaT],
      ],
    },
    { key: 'danger', s: 1, colors: SEA_DANGER, title: 'Dangerous', lines: [['Rough', ' · state 5+'], ['Hs > 2.5 m', ''], ['Force 6+', '']] },
  ];
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
      {items.map((it) => (
        <figure key={it.key} className={`m-0 ${it.key === 'today' ? '' : 'opacity-90'}`}>
          <SeaTank s={it.s} colors={it.colors} className={`h-16 sm:h-20 ${it.key === 'today' ? 'ring-2 ring-zinc-900/25 ring-offset-1' : ''}`}
            label={`${it.title}: ${it.lines.map((l) => l[0] + l[1]).join(', ')}`} />
          <figcaption className="mt-1.5 leading-tight">
            <div className="text-xs font-bold" style={{ color: it.key === 'today' ? BAND_STYLE[band].hex : it.key === 'danger' ? '#be123c' : '#0e7490' }}>{it.title}</div>
            {it.lines.map(([main, extra]) => (
              <div key={main} className="text-[11px] text-zinc-500">{main}{extra && <span className="hidden sm:inline">{extra}</span>}</div>
            ))}
          </figcaption>
        </figure>
      ))}
    </div>
  );
};

// ---- location bar ---------------------------------------------------------
export const LaunchConditionsBar: React.FC<{
  place: Place; wind: Wind | null; error: boolean; onPlace: (p: Place) => void;
}> = ({ place, wind, error, onPlace }) => {
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const find = async (e?: React.FormEvent) => {
    e?.preventDefault(); if (!q.trim()) return;
    setMsg('Searching…');
    const p = await geocode(q.trim()).catch(() => null);
    if (p) { onPlace(p); setMsg(''); setQ(''); } else setMsg('Couldn’t find that place — try a town or harbour name.');
  };
  const mine = () => {
    if (!navigator.geolocation) { setMsg('Location isn’t available on this device.'); return; }
    setMsg('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => { onPlace({ name: 'Your location', lat: pos.coords.latitude, lon: pos.coords.longitude }); setMsg(''); },
      () => setMsg('Location permission was declined.'),
      { timeout: 10000, maximumAge: 600000 },
    );
  };
  const band = wind ? bandFor(wind) : null;
  const time = wind ? new Date(wind.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <div className="max-w-4xl mx-auto mb-10 sm:mb-12 rounded-3xl bg-white border border-zinc-200 shadow-sm px-5 sm:px-7 py-5 font-sf">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Today’s launch conditions · live wind & sea</div>
          <div className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-zinc-900 truncate">{place.name}</div>
          <div className="mt-0.5 text-sm text-zinc-600">
            {error && 'Live wind is unavailable right now.'}
            {!error && !wind && 'Loading live wind…'}
            {wind && band && (
              <>
                <span className="font-semibold" style={{ color: BAND_STYLE[band].hex }}>{BAND_STYLE[band].label}</span>
                {' · '}Force {beaufort(wind.windMph)} {compass(wind.dirDeg)} · {Math.round(wind.windMph)}mph{wind.gustMph !== null ? `, gusts ${Math.round(wind.gustMph)}mph` : ''} · {time}
              </>
            )}
          </div>
        </div>
        <form onSubmit={find} className="flex flex-wrap items-center gap-2">
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a place or harbour"
            className="w-48 sm:w-56 px-3.5 py-2 rounded-full bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:border-zinc-400"
          />
          <button type="submit" className="px-4 py-2 rounded-full bg-[#13306b] text-white text-sm font-semibold cursor-pointer hover:bg-[#0d2350]">Find</button>
          <button type="button" onClick={mine} className="px-4 py-2 rounded-full border border-zinc-300 text-sm font-semibold text-zinc-700 cursor-pointer hover:border-zinc-500">Use my location</button>
        </form>
      </div>
      {msg && <p className="mt-2 text-xs text-zinc-500">{msg}</p>}
      {wind && band && <SeaScale wind={wind} band={band} />}
      <p className="mt-4 text-xs text-zinc-500">
        A general guide from live wind and sea, with live day-to-day readings. Each trailer below is compared with example limits for its type, to be confirmed by Extreme. Always check local conditions, tides and your slipway before launching.
      </p>
    </div>
  );
};
