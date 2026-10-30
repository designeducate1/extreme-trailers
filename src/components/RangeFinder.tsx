import React, { useEffect, useMemo, useState } from 'react';
import bunkImg from '../assets/categories/bunk.jpg';
import fixedKeelImg from '../assets/categories/fixed-keel.jpg';
import inflatableImg from '../assets/categories/inflatable.jpg';
import launcherImg from '../assets/categories/launcher.jpg';
import pwcImg from '../assets/categories/pwc.jpg';
import rollerImg from '../assets/categories/roller.jpg';
import sr1500 from '../assets/1500-sr.jpg';
import sr1800 from '../assets/1800-sr.jpg';
import sr1900 from '../assets/1900sr-blue.jpg';
import sr2600 from '../assets/2600sr-blue.jpg';
import sr3000 from '../assets/3000-sr.jpg';
import sr3500 from '../assets/3500srblue-ext.png';
import {
  EXTRAS, FAMILIES, MODELS, braked, fitFor, modelsIn,
  type FamilyId, type Fit, type RangeModel,
} from '../data/range';
import { SHOP, buyUrl } from '../data/shop';
import type { CategoryId } from '../data/trailers';
import type { RossPick } from '../hooks/useRoss';
import { CATEGORIES, CATEGORY_IMG, CategoryTank, RossPickCard } from './RangeOverview';
import { LaunchConditionsBar, useWind, DEFAULT_PLACE, type Place } from './LaunchConditions';

// "Explore The Range": the whole 2026 range (data/range.ts) for people
// choosing without AI Ross -- trailer-type buttons (with live sea tanks)
// filter one card per family, each with a size picker.
// Cards without a shop link show an "Add to basket" placeholder until
// the site's own basket is built (AddToBasket below).

// Photos: Super Rollers have their own; other families share their
// category photo until Ross supplies more.
const FAMILY_IMG: Partial<Record<FamilyId, string>> = {
  roller: rollerImg, swing: rollerImg, 'keel-roller': rollerImg, 'super-roller': sr1900, bunk: bunkImg,
  shrimper: fixedKeelImg, jet: pwcImg, 'double-jet': pwcImg, inflatable: inflatableImg, cat: inflatableImg,
  'kayak-sup': launcherImg, launcher: launcherImg,
};
const MODEL_IMG: Record<string, string> = {
  'ext1500-super-roller': sr1500, 'ext1800-super-roller': sr1800, 'ext1900-super-roller': sr1900,
  'ext2600-super-roller': sr2600, 'ext3000-super-roller': sr3000, 'ext3500-super-roller': sr3500,
};
const FIT_LABEL: Record<Fit, string> = { fits: 'Fits your boat', tight: 'Fits, close to the limit', 'too-small': 'Too small for your boat', unknown: '' };
const FIT_STYLE: Record<Fit, string> = {
  fits: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  tight: 'bg-amber-50 text-amber-800 ring-amber-200',
  'too-small': 'bg-rose-50 text-rose-700 ring-rose-200',
  unknown: '',
};
const gbp = (n: number) => '£' + n.toLocaleString('en-GB');
const short = (m: RangeModel) => m.name.replace(/^EXT(\d+)\s*/, 'EXT$1 ').replace(/ (Roller|Bunk|Super Roller|Shrimper|Inflatable|Swing)$/, '');

// The site's eight trailer categories, mapped onto the price list's families.
// Stainless and dollies aren't on the 2026 sheet: call to order.
const CATEGORY_FAMILIES: Record<CategoryId, FamilyId[]> = {
  bunk: ['bunk'], 'fixed-keel': ['shrimper'], inflatable: ['inflatable', 'cat', 'kayak-sup'], launcher: ['launcher'],
  pwc: ['jet', 'double-jet'], roller: ['roller', 'super-roller', 'swing', 'keel-roller'], dollies: [], stainless: [],
};
const CALL_TO_ORDER: Partial<Record<CategoryId, string>> = {
  stainless: '316 marine-grade stainless steel trailers, Europe\u2019s first, with a 10-year limited warranty. Built to order: call for a quote.',
  dollies: 'Showroom and workshop dollies for moving boats around indoors. Not for launching or road use. Call for sizes and prices.',
};

interface Props {
  onAskRoss?: () => void;
  /** The AI Ross card, shown at the top when open. */
  rossPanel?: React.ReactNode;
  /** Categories Ross has shortlisted (null = none). */
  highlighted?: CategoryId[] | null;
  /** The trailer Ross has recommended. */
  pick?: RossPick | null;
}

export const RangeFinder: React.FC<Props> = ({ rossPanel, highlighted, pick }) => {
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const { wind, error } = useWind(place);
  // The boat and fit-check rows were removed to keep this simple; cards
  // still accept sizes if they come back.
  const L: number | undefined = undefined, W: number | undefined = undefined, T: number | undefined = undefined;

  const families = useMemo(() => {
    const allowed = category ? CATEGORY_FAMILIES[category] : FAMILIES.map((f) => f.id);
    return allowed.map((id) => FAMILIES.find((f) => f.id === id)!);
  }, [category]);
  const modelCount = families.reduce((n, f) => n + modelsIn(f.id).length, 0);

  return (
    <section id="find-your-trailer" className="w-full bg-white text-zinc-900 font-sf px-6 pt-20 sm:pt-28 pb-20 sm:pb-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-4xl sm:text-5xl font-bold tracking-tighter leading-[1.05] mb-4">Explore The Range.</h2>
        <p className="text-center text-lg sm:text-xl text-zinc-500 mb-3">
          All {MODELS.length} trailers in the 2026 range, each set up for the way you launch.
        </p>
        <p className="max-w-3xl mx-auto text-center text-sm sm:text-base text-zinc-500 mb-12">
          Tap a trailer type to see its trailers. Each type shows today&rsquo;s water at your launch spot against that
          trailer&rsquo;s example limits, live.
        </p>

        {rossPanel}

        {/* Today's launch conditions (live wind + sea at the chosen spot) */}
        <LaunchConditionsBar place={place} wind={wind} error={error} onPlace={setPlace} />

        {/* 1. Trailer type, each with its live sea tank */}
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400 mb-3">Trailer type</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
          {CATEGORIES.map((c) => {
            const on = category === c.id;
            const shortlisted = highlighted ? highlighted.includes(c.id) : false;
            return (
              <button key={c.id} type="button" aria-pressed={on} onClick={() => setCategory(on ? null : c.id)}
                className={`text-left rounded-2xl border p-3 transition-all ${on ? 'border-zinc-900 ring-2 ring-zinc-900/15 bg-white' : 'border-zinc-200 bg-white hover:border-zinc-400'} ${shortlisted ? 'ring-2 ring-[#13306b]/40 border-[#13306b]' : ''} ${highlighted && !shortlisted && !on ? 'opacity-45' : ''}`}>
                <span className={`block text-sm sm:text-base font-bold tracking-tight mb-2 ${on ? 'text-zinc-900' : 'text-zinc-700'}`}>{c.name}</span>
                <CategoryTank id={c.id} name={c.name} wind={wind} error={error} />
              </button>
            );
          })}
        </div>

        <RossPickCard pick={pick} />

        <p className="mt-8 text-sm text-zinc-400 mb-10">
          {category && CALL_TO_ORDER[category]
            ? `${CATEGORIES.find((c) => c.id === category)!.name} is built to order: details below.`
            : `Showing ${families.length} ${families.length === 1 ? 'family' : 'families'} · ${modelCount} trailers.`}
        </p>

        {/* 3. The range */}
        {category && CALL_TO_ORDER[category] && (
          <article className="mb-5 rounded-2xl border border-zinc-200 bg-white overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_1.4fr]">
            <div className="bg-[#f6f8fb] flex items-center justify-center p-6">
              <img src={CATEGORY_IMG(category)} alt={`Extreme ${CATEGORIES.find((c) => c.id === category)!.name} trailer`} className="max-h-56 object-contain" loading="lazy" />
            </div>
            <div className="p-6 flex flex-col">
              <h3 className="text-xl font-bold tracking-tight">{CATEGORIES.find((c) => c.id === category)!.name}</h3>
              <p className="mt-2 text-zinc-600">{CALL_TO_ORDER[category]}</p>
              <div className="mt-auto pt-5 flex gap-2">
                <AddToBasket name={CATEGORIES.find((c) => c.id === category)!.name} />
                <a href="tel:+442380632535" className="h-11 px-4 rounded-full border border-zinc-200 text-sm font-semibold inline-flex items-center hover:border-zinc-400">Call to order</a>
              </div>
            </div>
          </article>
        )}
        {families.length === 0 && category && !CALL_TO_ORDER[category] && (
          <p className="mb-5 text-zinc-500">No {CATEGORIES.find((c) => c.id === category)!.name} trailers listed yet. Tap it again to see the whole range.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {families.map((f) => (
            <FamilyCard key={f.id} family={f.id} L={L} W={W} T={T} />
          ))}
        </div>

        {/* Support and extras */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="rounded-2xl bg-[#eef2f8] p-6">
            <h3 className="text-xl font-bold tracking-tight mb-3">Every Extreme comes with</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-zinc-600">
              <li>✓ Built in Southampton</li>
              <li>✓ Hot-dip galvanised to ISO 1461</li>
              <li>✓ UK &amp; EU type approval</li>
              <li>✓ Set up to fit your boat</li>
              <li>✓ Next-day spares from stock</li>
              <li>✓ A stockist near you</li>
            </ul>
            <a href="tel:+442380632535" className="mt-5 inline-flex items-center gap-2 font-semibold text-[#12306b] hover:underline">Call Extreme: 023 8063 2535</a>
          </div>
          <div className="rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-xl font-bold tracking-tight mb-3">Popular extras</h3>
            <ul className="text-sm text-zinc-600 divide-y divide-zinc-100">
              {EXTRAS.map((x) => (
                <li key={x.name} className="flex justify-between gap-4 py-1.5"><span>{x.name}</span><span className="font-semibold text-zinc-800 whitespace-nowrap">{x.priceIncVat}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-6 text-xs text-zinc-400">
          Prices are RRP including VAT from Extreme&rsquo;s 1 January 2026 specification sheet; specification and price subject to change. Max boat length is bow eye to transom. Launchers are not for road use.
        </p>
      </div>
    </section>
  );
};

function FamilyCard({ family, L, W, T }: { family: FamilyId; L?: number; W?: number; T?: number }) {
  const f = FAMILIES.find((x) => x.id === family)!;
  const models = modelsIn(family);
  // With a boat entered, start on the smallest size that fits.
  const best = (L || W) ? models.find((m) => fitFor(m, L, W) !== 'too-small') : undefined;
  const [picked, setPicked] = useState<string | null>(null);
  // New boat details: back to the best-fitting size.
  useEffect(() => { setPicked(null); }, [L, W]);
  const model = models.find((m) => m.id === picked) || best || models[0];
  const fit = fitFor(model, L, W);
  const noneFit = (L || W) && !best;
  const towOk = T ? model.grossKg <= T : null;
  const img = MODEL_IMG[model.id] || FAMILY_IMG[family];
  const listing = SHOP[model.id];
  const [colour, setColour] = useState<string | undefined>(undefined);
  const chosen = colour && listing?.colours?.includes(colour) ? colour : listing?.colours?.[0];

  return (
    <article className={`rounded-2xl border border-zinc-200 bg-white overflow-hidden flex flex-col transition-opacity ${noneFit ? 'opacity-55' : ''}`}>
      <div className="aspect-[4/3] bg-[#f6f8fb] flex items-center justify-center p-5">
        {img && <img src={img} alt={`Extreme ${model.name}`} className="max-w-full max-h-full object-contain" loading="lazy" />}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-xl font-bold tracking-tight">{f.name}</h3>
        <p className="text-sm text-zinc-500 mt-1">{f.blurb}</p>

        {models.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`${f.name} sizes`}>
            {models.map((m) => {
              const mf = fitFor(m, L, W);
              return (
                <button key={m.id} type="button" role="radio" aria-checked={m.id === model.id} onClick={() => setPicked(m.id)}
                  className={`h-8 px-2.5 rounded-full text-xs font-semibold border transition-colors ${
                    m.id === model.id ? 'bg-[#12306b] text-white border-[#12306b]'
                      : mf === 'too-small' ? 'border-zinc-100 text-zinc-300' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}>
                  {models.filter((o) => short(o) === short(m)).length > 1 ? m.name : short(m)}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <span className="font-semibold">{model.name}</span>
          <span className="text-right"><span className="text-lg font-bold">{gbp(model.priceIncVat)}</span><span className="block text-[11px] text-zinc-400">inc VAT · {gbp(model.priceExVat)} ex</span></span>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-zinc-500">Boat up to</dt><dd className="font-medium text-right">{model.maxBoatM.toFixed(2)} m</dd>
          <dt className="text-zinc-500">Carries</dt><dd className="font-medium text-right">{model.capacityKg} kg</dd>
          <dt className="text-zinc-500">Gross weight</dt><dd className="font-medium text-right">{model.grossKg} kg · {braked(model) ? 'braked' : 'unbraked'}</dd>
          <dt className="text-zinc-500">Tyres</dt><dd className="font-medium text-right">{model.tyre}</dd>
          {model.supports !== null && (<><dt className="text-zinc-500">Rollers / bunks</dt><dd className="font-medium text-right">{model.supports}{model.keelRollers ? ` + ${model.keelRollers} keel` : ''}</dd></>)}
          <dt className="text-zinc-500">Trailer size</dt><dd className="font-medium text-right">{model.lengthM.toFixed(2)} × {model.widthM.toFixed(2)} m</dd>
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5 min-h-[28px]">
          {fit !== 'unknown' && <span className={`inline-flex items-center h-7 px-2.5 rounded-full text-xs font-semibold ring-1 ${FIT_STYLE[fit]}`}>{noneFit ? 'No size fits your boat' : FIT_LABEL[fit]}</span>}
          {towOk !== null && (
            <span className={`inline-flex items-center h-7 px-2.5 rounded-full text-xs font-semibold ring-1 ${towOk ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}>
              {towOk ? 'Within your towing limit' : 'Over your towing limit'}
            </span>
          )}
          {listing && <span className="inline-flex items-center h-7 px-2.5 rounded-full text-xs font-semibold ring-1 bg-zinc-50 text-zinc-600 ring-zinc-200">Final price confirmed in the basket</span>}
          {!model.roadLegal && <span className="inline-flex items-center h-7 px-2.5 rounded-full text-xs font-semibold ring-1 bg-zinc-50 text-zinc-600 ring-zinc-200">Not for road use</span>}
        </div>

        {listing && listing.colours && listing.colours.length > 1 && (
          <div className="mt-4 flex items-center gap-1.5 flex-wrap" role="radiogroup" aria-label="Colour">
            <span className="text-sm text-zinc-500 mr-1">Colour</span>
            {listing.colours.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={c === chosen} onClick={() => setColour(c)}
                className={`h-8 px-3 rounded-full text-xs font-semibold border ${c === chosen ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}>
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto pt-5 flex flex-wrap gap-2">
          {listing && (
            <a href={buyUrl(listing, chosen)}
              className="w-full h-11 rounded-full bg-[#D5FF37] text-[#121212] text-sm font-bold inline-flex items-center justify-center gap-2 hover:-translate-y-px transition-transform"
              title={`Add the ${listing.shopName || model.name}${chosen ? ` (${chosen})` : ''} to your basket on extrememarine.co.uk`}>
              Buy{chosen ? ` in ${chosen}` : ''} · add to basket <span aria-hidden="true">→</span>
            </a>
          )}
          {!listing && <AddToBasket name={model.name} />}
          {/* Phone number from Extreme's own price list. */}
          <a href="tel:+442380632535" title={`Call Extreme about the ${model.name}`}
            className="h-11 px-4 rounded-full border border-zinc-200 text-sm font-semibold inline-flex items-center hover:border-zinc-400">
            Call
          </a>
        </div>
      </div>
    </article>
  );
}

// Placeholder until the basket and checkout are built: says so on tap.
function AddToBasket({ name }: { name: string }) {
  const [soon, setSoon] = useState(false);
  return (
    <button type="button" title={`Add the ${name} to your basket`}
      onClick={() => { setSoon(true); setTimeout(() => setSoon(false), 2200); }}
      className="flex-1 h-11 rounded-full bg-[#12306b] text-white text-sm font-semibold hover:-translate-y-px transition-transform">
      {soon ? 'Basket coming soon' : 'Add to basket'}
    </button>
  );
}
