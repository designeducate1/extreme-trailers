import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MODELS, FAMILIES, BOAT_TYPES, builderLinkFor, type FamilyId } from '../data/range';

// Site search: one input that finds pages, trailer types, boat types and every model in the range.
// Opens as a panel under the header (as on the Peter Leonard Marine site's search button).

interface Hit { key: string; kind: 'Page' | 'Trailer type' | 'Boat' | 'Model'; title: string; sub: string; run: () => void }

interface Props {
  open: boolean;
  onClose: () => void;
  goPage: (section: string) => void;      // HOME, TRAILER RANGE, TRAILER BUILDER, ONLINE SHOP ...
  goRange: () => void;
  goHref: (href: string) => void;          // in-site link, e.g. /?builder&product=...
}

const PAGES: { title: string; section: string; words: string }[] = [
  { title: 'Home', section: 'HOME', words: 'home start main' },
  { title: 'Trailer Range', section: 'TRAILER RANGE', words: 'range all trailers models explore prices rrp' },
  { title: 'Trailer Builder', section: 'TRAILER BUILDER', words: 'builder configure colour build customise 3d ar' },
  { title: 'Online Shop', section: 'ONLINE SHOP', words: 'shop buy spares parts rollers bearings winch lights' },
  { title: 'Info', section: 'INFO', words: 'info about type approval galvanised manufacturer' },
  { title: 'Stockist', section: 'STOCKIST', words: 'stockist dealer dealers find near' },
  { title: 'Gallery', section: 'GALLERY', words: 'gallery photos videos showcase' },
  { title: 'Contact', section: 'CONTACT', words: 'contact phone email call address southampton' },
];

const gbp = (n: number) => '£' + n.toLocaleString('en-GB');

export const SiteSearch: React.FC<Props> = ({ open, onClose, goPage, goRange, goHref }) => {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const famName = useMemo(() => Object.fromEntries(FAMILIES.map((f) => [f.id, f.name])) as Record<FamilyId, string>, []);

  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

  const index = useMemo<(Hit & { hay: string })[]>(() => {
    const out: (Hit & { hay: string })[] = [];
    PAGES.forEach((p) => out.push({ key: 'p-' + p.section, kind: 'Page', title: p.title, sub: 'Go to this page', hay: `${p.title} ${p.words}`.toLowerCase(), run: () => goPage(p.section) }));
    FAMILIES.forEach((f) => out.push({ key: 'f-' + f.id, kind: 'Trailer type', title: f.name, sub: f.blurb, hay: `${f.name} ${f.blurb} trailer`.toLowerCase(), run: goRange }));
    BOAT_TYPES.forEach((b) => out.push({
      key: 'b-' + b.id, kind: 'Boat', title: b.name, sub: 'Suits: ' + b.families.map((f) => famName[f]).join(', '),
      hay: `${b.name} boat ${b.families.map((f) => famName[f]).join(' ')}`.toLowerCase(), run: goRange,
    }));
    MODELS.forEach((m) => {
      const link = builderLinkFor(m.id);
      out.push({
        key: 'm-' + m.id, kind: 'Model', title: m.name,
        sub: `${famName[m.family]} · boats to ${m.maxBoatM} m · ${gbp(m.priceIncVat)} inc VAT${link ? ' · open in builder' : ''}`,
        hay: `${m.name} ${famName[m.family]} ${m.maxBoatM}m ${m.tyre} ${m.grossKg}kg`.toLowerCase(),
        run: () => (link ? goHref(link) : goRange()),
      });
    });
    return out;
  }, [famName, goPage, goRange, goHref]);

  const hits = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [] as Hit[];
    return index
      .filter((e) => terms.every((t) => e.hay.includes(t)))
      .map((e) => ({ e, score: (e.title.toLowerCase().startsWith(terms[0]) ? 0 : e.title.toLowerCase().includes(terms[0]) ? 1 : 2) + (e.kind === 'Model' ? 0.3 : 0) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 8)
      .map((x) => x.e);
  }, [q, index]);

  useEffect(() => { setActive(0); }, [q]);

  if (!open) return null;
  const choose = (h: Hit) => { onClose(); h.run(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(hits.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); choose(hits[active]); }
    else if (e.key === 'Escape') onClose();
  };

  return (
    <div className="absolute right-3 sm:right-6 top-full mt-2 w-[min(460px,calc(100vw-24px))] rounded-2xl bg-white text-zinc-900 shadow-[0_24px_60px_-18px_rgba(6,46,105,0.55)] border border-zinc-200 overflow-hidden" role="dialog" aria-label="Search the site">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-zinc-100">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#062e69" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search trailers, boat types, pages…"
          aria-label="Search" className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-zinc-400" />
        <button type="button" onClick={onClose} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 px-2 py-1 rounded-md border border-zinc-200">Esc</button>
      </div>
      <div className="max-h-[56vh] overflow-y-auto">
        {!q.trim() && (
          <div className="px-4 py-4 text-sm text-zinc-500">
            <p className="font-semibold text-zinc-700 mb-2">Try</p>
            <div className="flex flex-wrap gap-2">
              {['RIB', 'Jetski', 'Roller', 'Super Roller', 'Launching trolley', 'Kayak'].map((s) => (
                <button key={s} type="button" onClick={() => setQ(s)} className="px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-[13px] font-medium text-zinc-700">{s}</button>
              ))}
            </div>
          </div>
        )}
        {q.trim() && !hits.length && <p className="px-4 py-5 text-sm text-zinc-500">Nothing found for &ldquo;{q}&rdquo;. Try a trailer type, boat type or model name.</p>}
        <ul role="listbox">
          {hits.map((h, i) => (
            <li key={h.key} role="option" aria-selected={i === active}>
              <button type="button" onMouseEnter={() => setActive(i)} onClick={() => choose(h)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-zinc-50 last:border-0 ${i === active ? 'bg-[#eef2f8]' : ''}`}>
                <span className="mt-0.5 shrink-0 w-[86px] text-[10px] font-bold uppercase tracking-[0.1em] text-[#062e69]">{h.kind}</span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-snug">{h.title}</span>
                  <span className="block text-xs text-zinc-500 leading-snug truncate">{h.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
