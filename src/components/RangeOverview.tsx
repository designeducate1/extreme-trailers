import React, { useState } from 'react';
import bunk from '../assets/categories/bunk.jpg';
import fixedKeel from '../assets/categories/fixed-keel.jpg';
import inflatable from '../assets/categories/inflatable.jpg';
import launcher from '../assets/categories/launcher.jpg';
import pwc from '../assets/categories/pwc.jpg';
import roller from '../assets/categories/roller.jpg';
import dollies from '../assets/categories/showroom-dollies.jpg';
import stainless from '../assets/categories/stainless-steel.jpg';
import { findTrailer, CATEGORY_NAMES, type CategoryId } from '../data/trailers';
import type { RossPick } from '../hooks/useRoss';
import { Trailer3DViewer } from './Trailer3DViewer';
import { LaunchConditionsBar, SeaTank, useWind, severity, seaLine, BAND_STYLE, SEA_BAND, DEFAULT_PLACE, LAUNCH_LIMITS, trailerBand, TRAILER_BAND_LABEL, hsToTop, type Place } from './LaunchConditions';

// Trailer Range page: short "about the range" passage, then the eight
// trailer categories. Category photos are cropped from Extreme's current
// site as placeholders -- swap in Ross's full-size originals when available.

interface Props {
  /** Called when a category with a live 3D model is chosen (Roller -> EXT750). */
  onOpenBuilder?: () => void;
  /** The AI Ross card, shown at the top of Explore The Range when open. */
  rossPanel?: React.ReactNode;
  /** Categories Ross has shortlisted (null = no filtering). */
  highlighted?: CategoryId[] | null;
  /** The trailer Ross has recommended. */
  pick?: RossPick | null;
}

const FACTS = [
  { value: '75 years', label: 'Combined marine experience' },
  { value: 'ISO 1461', label: 'Hot-dip galvanised, sealed bearings' },
  { value: 'UK & Europe', label: 'Fully type approved' },
  { value: 'Next day', label: 'Parts delivery from stock' },
];

const CATEGORIES: { id: CategoryId; name: string; img: string; live?: boolean }[] = [
  { id: 'bunk', name: 'Bunk', img: bunk },
  { id: 'fixed-keel', name: 'Fixed Keel', img: fixedKeel },
  { id: 'inflatable', name: 'Inflatable', img: inflatable },
  { id: 'launcher', name: 'Launcher', img: launcher },
  { id: 'pwc', name: 'PWC', img: pwc },
  { id: 'roller', name: 'Roller', img: roller, live: true },
  { id: 'dollies', name: 'Showroom & Workshop Dollies', img: dollies },
  { id: 'stainless', name: 'Stainless Steel', img: stainless },
];

const CATEGORY_IMG = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.img;

export const RangeOverview: React.FC<Props> = ({ onOpenBuilder, rossPanel, highlighted, pick }) => {
  const picked = pick ? findTrailer(pick.trailerId) : undefined;
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const { wind, error } = useWind(place);
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

      {/* The range */}
      <section id="trailer-categories" className="w-full bg-[#eef2f8] text-zinc-900 font-sf px-6 pt-20 sm:pt-28 pb-20 sm:pb-28 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-4xl sm:text-5xl font-bold tracking-tighter leading-[1.05] mb-4">
            Explore The Range.
          </h2>
          <p className="text-center text-lg sm:text-xl text-zinc-500 mb-12 sm:mb-16">
            Eight families of trailer, each set up for the way you launch.
          </p>

          {rossPanel}

          <LaunchConditionsBar place={place} wind={wind} error={error} onPlace={setPlace} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {CATEGORIES.map((c) => {
              const title = (
                <>
                    <h3 className="mt-1 text-base sm:text-lg font-bold tracking-tight leading-snug">{c.name}</h3>
                    <span className={`mt-1 inline-block text-sm ${c.live ? 'text-[#13306b] font-semibold' : 'text-zinc-400'}`}>
                      {c.live ? 'View EXT750 in 3D ›' : 'Coming soon'}
                    </span>
                </>
              );
              const card = (
                <>
                  <div className="relative aspect-[4/3] w-full flex items-center justify-center p-4 sm:p-6">
                    <img
                      src={c.img}
                      alt={`Extreme ${c.name} trailer`}
                      className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    {c.live && (
                      <span className="absolute top-3 right-3 bg-zinc-900 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full">
                        3D
                      </span>
                    )}
                  </div>
                  {/* Live sea tank: today's water against THIS trailer's example limits */}
                  {(() => {
                    const lim = LAUNCH_LIMITS[c.id];
                    const tb = wind && lim ? trailerBand(wind, lim) : null;
                    const sl = wind ? seaLine(wind) : null;
                    if (lim === null) {
                      return (
                        <>
                          <div className="px-3 sm:px-4 -mt-1">
                            <div className="sea-tank h-16 sm:h-20 flex items-center justify-center text-[11px] font-semibold text-zinc-400">Not for launching</div>
                          </div>
                          <div className="px-4 sm:px-5 pb-5 pt-2 text-left">
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                              <span className="w-2 h-2 rounded-full bg-zinc-300" />Workshop &amp; showroom
                            </div>
                            <div className="mt-0.5 text-[11px] text-zinc-500 leading-tight">Any weather</div>
                            {title}
                          </div>
                        </>
                      );
                    }
                    return (
                      <>
                        <div className="px-3 sm:px-4 -mt-1">
                          {wind && sl && tb && lim ? (
                            <SeaTank
                              s={severity(wind)} colors={SEA_BAND[tb]} className="h-16 sm:h-20"
                              surface={hsToTop(sl.hs)}
                              marks={{ calm: hsToTop(lim.calm), rough: hsToTop(lim.rough), dot: hsToTop(sl.hs) }}
                              label={`${c.name}: ${TRAILER_BAND_LABEL[tb]}. Today Hs ${sl.hs.toFixed(1)} m; example calm limit ${lim.calm} m, rough ${lim.rough} m.`}
                            />
                          ) : (
                            <div className="sea-tank h-16 sm:h-20" />
                          )}
                        </div>
                        <div className="px-4 sm:px-5 pb-5 pt-2 text-left">
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide" style={{ color: tb ? BAND_STYLE[tb].hex : '#a1a1aa' }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: tb ? BAND_STYLE[tb].hex : '#d4d4d8' }} />
                            {tb ? TRAILER_BAND_LABEL[tb] : error ? 'Wind unavailable' : 'Loading wind…'}
                          </div>
                          {sl && lim && (
                            <div className="mt-0.5 text-[11px] text-zinc-500 leading-tight">
                              Hs {sl.hs.toFixed(1)} m{sl.estimated ? '*' : ''} · calm ≤{lim.calm} m
                            </div>
                          )}
                          {title}
                        </div>
                      </>
                    );
                  })()}
                </>
              );
              const inShortlist = !highlighted || highlighted.includes(c.id);
              const base = `group rounded-2xl sm:rounded-3xl bg-white border overflow-hidden text-left transition-all duration-500 ${
                highlighted && inShortlist ? 'border-[#13306b] ring-2 ring-[#13306b]/40 scale-[1.02]' : 'border-zinc-200/80'
              } ${inShortlist ? '' : 'opacity-35 grayscale'}`;
              return c.live ? (
                <button
                  key={c.id}
                  onClick={onOpenBuilder}
                  className={`${base} cursor-pointer shadow-sm hover:shadow-xl transition-shadow`}
                >
                  {card}
                </button>
              ) : (
                <div key={c.id} className={base}>
                  {card}
                </div>
              );
            })}
          </div>

          {/* Ross's recommendation, directly below the categories */}
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
                {picked.has3D && (
                  <button onClick={onOpenBuilder} className="mt-6 self-start px-5 py-2.5 rounded-full bg-[#13306b] text-white text-sm font-semibold hover:bg-[#0d2350] cursor-pointer">
                    Customise this trailer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
