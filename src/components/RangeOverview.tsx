import React from 'react';
import bunk from '../assets/categories/bunk.jpg';
import fixedKeel from '../assets/categories/fixed-keel.jpg';
import inflatable from '../assets/categories/inflatable.jpg';
import launcher from '../assets/categories/launcher.jpg';
import pwc from '../assets/categories/pwc.jpg';
import roller from '../assets/categories/roller.jpg';
import dollies from '../assets/categories/showroom-dollies.jpg';
import stainless from '../assets/categories/stainless-steel.jpg';
import { findTrailer, CATEGORY_NAMES, type CategoryId } from '../data/trailers';
import { findModel, FAMILIES, FAMILY_CATEGORY, builderLinkFor } from '../data/range';
import type { RossPick } from '../hooks/useRoss';
import { useRossContext } from '../hooks/RossContext';
import { Trailer3DViewer } from './Trailer3DViewer';
import { SeaTank, severity, seaLine, BAND_STYLE, SEA_BAND, LAUNCH_LIMITS, trailerBand, TRAILER_BAND_LABEL, hsToTop, type Wind } from './LaunchConditions';

// Trailer Range page: short "about the range" passage; the eight
// trailer categories are shared with RangeFinder. Category photos are cropped from Extreme's current
// site as placeholders -- swap in Ross's full-size originals when available.


const FACTS = [
  { value: '75 years', label: 'Combined marine experience' },
  { value: 'ISO 1461', label: 'Hot-dip galvanised, sealed bearings' },
  { value: 'UK & Europe', label: 'Fully type approved' },
  { value: 'Next day', label: 'Parts delivery from stock' },
];

export const CATEGORIES: { id: CategoryId; name: string; img: string; live?: boolean }[] = [
  { id: 'bunk', name: 'Bunk', img: bunk },
  { id: 'fixed-keel', name: 'Fixed Keel', img: fixedKeel },
  { id: 'inflatable', name: 'Inflatable', img: inflatable },
  { id: 'launcher', name: 'Launcher', img: launcher },
  { id: 'pwc', name: 'PWC', img: pwc },
  { id: 'roller', name: 'Roller', img: roller, live: true },
  { id: 'dollies', name: 'Showroom & Workshop Dollies', img: dollies },
  { id: 'stainless', name: 'Stainless Steel', img: stainless },
];

export const CATEGORY_IMG = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.img;

// The "One Of The UK's Largest Trailer Ranges" intro. The categories,
// launch conditions and AI Ross's pick now live in RangeFinder's merged
// "Explore The Range" section, using CategoryTank and RossPickCard below.
export const RangeOverview: React.FC = () => {
  return (
    <>
      {/* About the range */}
      <section className="w-full bg-white text-zinc-900 font-sf text-center px-6 pt-24 sm:pt-32 pb-20 sm:pb-28">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-[1.05] mb-6">
            One Of The UK's
            <br />
            Largest Trailer Ranges.
          </h2>
          <p className="max-w-3xl text-lg sm:text-xl md:text-2xl text-zinc-500 leading-relaxed">
            For RIBs, powerboats, sail boats, dinghies, jetskis and inflatables of every size. Made with parts from
            AL-KO, Knott, Bradley and Dutton Lainson, and built to suit your boat, with bespoke parts cut on our own
            CNC laser when it needs them.
          </p>

          <div className="mt-14 sm:mt-16 w-full grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6">
            {FACTS.map((f) => (
              <div key={f.value} className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#13306b]">{f.value}</span>
                <span className="mt-1.5 text-sm sm:text-base text-zinc-500 leading-snug max-w-[14rem]">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

// Live sea tank for one category: today's water against that trailer's
// example launch limits (LaunchConditions.tsx), with its band label.
export function CategoryTank({ id, name, wind, error }: { id: CategoryId; name: string; wind: Wind | null; error: boolean }) {
  const lim = LAUNCH_LIMITS[id];
  if (lim === null) {
    return (
      <>
        <div className="sea-tank h-12 sm:h-14 flex items-center justify-center text-[11px] font-semibold text-zinc-400">Not for launching</div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-zinc-300" />Workshop &amp; showroom
        </div>
      </>
    );
  }
  const tb = wind && lim ? trailerBand(wind, lim) : null;
  const sl = wind ? seaLine(wind) : null;
  return (
    <>
      {wind && sl && tb && lim ? (
        <SeaTank
          s={severity(wind)} colors={SEA_BAND[tb]} className="h-12 sm:h-14"
          surface={hsToTop(sl.hs)}
          marks={{ calm: hsToTop(lim.calm), rough: hsToTop(lim.rough), dot: hsToTop(sl.hs) }}
          label={`${name}: ${TRAILER_BAND_LABEL[tb]}. Today Hs ${sl.hs.toFixed(1)} m; example calm limit ${lim.calm} m, rough ${lim.rough} m.`}
        />
      ) : (
        <div className="sea-tank h-12 sm:h-14" />
      )}
      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: tb ? BAND_STYLE[tb].hex : '#a1a1aa' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: tb ? BAND_STYLE[tb].hex : '#d4d4d8' }} />
        {tb ? TRAILER_BAND_LABEL[tb] : error ? 'Wind unavailable' : 'Loading wind…'}
      </div>
      {sl && lim && <div className="mt-0.5 text-[11px] text-zinc-500 leading-tight">Hs {sl.hs.toFixed(1)} m{sl.estimated ? '*' : ''} · calm ≤{lim.calm} m</div>}
    </>
  );
}

// AI Ross's recommendation card.
export function RossPickCard({ pick }: { pick?: RossPick | null }) {
  // Voice Ross picks from the 2026 range (data/range.ts); older picks may
  // still be ids from the draft list in data/trailers.ts.
  const { navigate } = useRossContext();
  const model = pick ? findModel(pick.trailerId) : undefined;
  const picked = pick && !model ? findTrailer(pick.trailerId) : undefined;
  if (model) {
    const link = builderLinkFor(model.id);
    const family = FAMILIES.find((f) => f.id === model.family)!;
    return (
      <div id="ross-pick" className="mt-14 sm:mt-20 rounded-3xl bg-white border border-zinc-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="relative lg:col-span-7 aspect-[4/3] lg:aspect-auto lg:min-h-[420px] bg-gradient-to-b from-white to-zinc-100">
          {model.id === 'ext750-maxi-roller' ? (
            <Trailer3DViewer finishId="galv-iso" />
          ) : (
            <img src={CATEGORY_IMG(FAMILY_CATEGORY[model.family])} alt={model.name} className="absolute inset-0 w-full h-full object-contain p-8" />
          )}
        </div>
        <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wide text-[#13306b]">AI Ross recommends</span>
          <h3 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tighter">{model.name}</h3>
          <p className="mt-1 text-sm text-zinc-500">{family.name} trailer</p>
          {pick?.reason && <p className="mt-5 text-lg text-zinc-700 leading-snug">“{pick.reason}”</p>}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-zinc-500">Boat up to</dt><dd className="font-semibold">{model.maxBoatM} m · {model.capacityKg.toLocaleString('en-GB')} kg</dd></div>
            <div><dt className="text-zinc-500">Gross weight</dt><dd className="font-semibold">{model.grossKg.toLocaleString('en-GB')} kg</dd></div>
            <div><dt className="text-zinc-500">Brakes</dt><dd className="font-semibold">{model.grossKg > 750 ? 'Braked' : 'Unbraked'}</dd></div>
            <div><dt className="text-zinc-500">From</dt><dd className="font-semibold">£{model.priceIncVat.toLocaleString('en-GB')} inc VAT</dd></div>
          </dl>
          {!model.roadLegal && <p className="mt-4 text-sm text-zinc-600">Launching trolley: not for road use.</p>}
          {link && (
            <a href={link} onClick={(e) => { e.preventDefault(); navigate(link); }} className="mt-6 self-start px-5 py-2.5 rounded-full bg-[#13306b] text-white text-sm font-semibold hover:bg-[#0d2350]">
              Build it in the Trailer Builder
            </a>
          )}
          <p className="mt-auto pt-5 text-xs text-zinc-400">RRP from Extreme&rsquo;s 2026 price list. Ross to confirm.</p>
        </div>
      </div>
    );
  }
  return (
    <>
          {picked && (
            <div id="ross-pick" className="mt-14 sm:mt-20 rounded-3xl bg-white border border-zinc-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
              <div className="relative lg:col-span-7 aspect-[4/3] lg:aspect-auto lg:min-h-[420px] bg-gradient-to-b from-white to-zinc-100">
                {picked.has3D ? (
                  <Trailer3DViewer finishId="galv-iso" />
                ) : (
                  <img src={CATEGORY_IMG(picked.category)} alt={picked.name} className="absolute inset-0 w-full h-full object-contain p-8" />
                )}
              </div>
              <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wide text-[#13306b]">AI Ross recommends</span>
                <h3 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tighter">{picked.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{CATEGORY_NAMES[picked.category]} trailer</p>
                {pick?.reason && <p className="mt-5 text-lg text-zinc-700 leading-snug">“{pick.reason}”</p>}
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><dt className="text-zinc-500">Boat up to</dt><dd className="font-semibold">{picked.maxBoatKg}kg</dd></div>
                  <div><dt className="text-zinc-500">Gross weight</dt><dd className="font-semibold">{picked.grossKg}kg</dd></div>
                  <div><dt className="text-zinc-500">Brakes</dt><dd className="font-semibold">{picked.braked ? 'Braked' : 'Unbraked'}</dd></div>
                  <div><dt className="text-zinc-500">Axles</dt><dd className="font-semibold">{picked.axles === 2 ? 'Twin' : 'Single'}</dd></div>
                </dl>
                <p className="mt-5 text-sm text-zinc-600"><span className="font-semibold">Hull support:</span> {picked.support}</p>
                <ul className="mt-3 text-sm text-zinc-600 list-disc pl-5 space-y-1">
                  {picked.suits.map((s) => <li key={s}>{s}</li>)}
                </ul>
                {!picked.confirmed && (
                  <p className="mt-5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Draft: specifications still to be confirmed by Extreme.
                  </p>
                )}
              </div>
            </div>
          )}
    </>
  );
}
