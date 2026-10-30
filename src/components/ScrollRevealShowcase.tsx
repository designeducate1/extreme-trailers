import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import DepthCarousel, { type DepthCarouselItem } from './DepthCarousel';
import './ScrollRevealShowcase.css';

// "Walk with Ross" clips. Each has a short chapter label and a still
// poster (public/videos/posters/, captured from the clip) so only the
// playing clip and its neighbours load. Captions: add a WebVTT file and
// a `captions` path here and the CC button appears for that clip.
const SHOWCASE_CLIPS: (DepthCarouselItem & { label: string })[] = [
  { video: '/videos/why-buy-extreme.mp4', poster: '/videos/posters/why-buy-extreme.jpg', alt: 'Why Buy Extreme', label: 'Why Extreme' },
  { video: '/videos/01_Origin_2005.mp4', poster: '/videos/posters/01_Origin_2005.jpg', alt: 'Origin, 2005', label: 'Origin 2005' },
  { video: '/videos/02_MadeInSouthampton.mp4', poster: '/videos/posters/02_MadeInSouthampton.jpg', alt: 'Made In Southampton', label: 'Southampton' },
  { video: '/videos/03_CNC_vs_Welded_Injection.mp4', poster: '/videos/posters/03_CNC_vs_Welded_Injection.jpg', alt: 'CNC vs Welded Injection', label: 'CNC & Moulding' },
  { video: '/videos/04_Modular_PowderCoat.mp4', poster: '/videos/posters/04_Modular_PowderCoat.jpg', alt: 'Modular Powder Coat', label: 'Powder Coat' },
  { video: '/videos/05_Ubolt_Protection.mp4', poster: '/videos/posters/05_Ubolt_Protection.jpg', alt: 'U-Bolt Protection', label: 'U-Bolts' },
  { video: '/videos/06_DealerNetwork_IdealBoats.mp4', poster: '/videos/posters/06_DealerNetwork_IdealBoats.jpg', alt: 'Dealer Network: Ideal Boats', label: 'Dealers' },
];

// gsap.registerPlugin is idempotent -- already called once in
// SvgMaskTransitions.tsx, but harmless/cheap to ensure here too in case
// this component is ever used on its own.
gsap.registerPlugin(ScrollTrigger);

// Panel copy: customer hooks backed by Extreme's own facts (Trailer Range
// text, boat show profiles, Marine Industry News stainless launch article).
// `clip`: the video that tells the same story, turned to as the section
// scrolls into view.
const SECTIONS = [
  {
    id: 'section-1',
    accent: '#D5FF37',
    clip: 0,
    header: 'Your Boat Deserves Better Than Off The Shelf.',
    desc: 'Most trailers are built for any boat. Ours are set up for yours. With 75 years of combined marine experience behind one of the UK’s largest ranges, you tow safely on the road and launch stress-free at the slip.',
  },
  {
    id: 'section-2',
    accent: '#7DD6FF',
    clip: 3,
    header: 'Unique Boat? So Are We.',
    desc: 'We cut every frame on our own CNC laser and mould our own rollers, all under one roof in Southampton. We’re believed to be the only trailer maker in Europe that does both, so when your boat needs a part nobody stocks, we make it.',
  },
  {
    id: 'section-3',
    accent: '#FFA0B0',
    clip: 4,
    header: 'Want It Tough? Want It To Look Good?',
    desc: 'Why choose? Every Extreme is hot-dip galvanised to ISO 1461, with sealed bearings and parts from AL-KO, Knott, Bradley and Dutton Lainson. Pick your roller, snubber and strap colours as standard, or go all the way with Europe’s first 316 marine-grade stainless steel range.',
  },
  {
    id: 'section-4',
    accent: '#FFA17B',
    clip: 6,
    header: 'Hitch Up. Head Off. No Surprises.',
    desc: 'We set your trailer up to fit your boat and deliver it personally. Every model is type approved for the UK and Europe with a Certificate of Conformity, and if you ever need a spare, it ships next day.',
  },
];

const BG_COLORS = ['#EDF9FF', '#FFECF2', '#FFE8DB'];

interface Props {
  /** Opens AI Ross (the AI Trailer Builder). */
  onAskRoss?: () => void;
}

// Scroll-pinned showcase: the "Walk with Ross" clips, large on the right,
// stay pinned while the four sections scroll past on the left (on phones
// they sit sticky above the text). Each section turns the carousel to its
// matching clip; named chapter chips show what's there and how far through
// the clip is; "Hear Ross" plays it with sound from the start and carries
// on to the next; tapping the front clip opens it full screen.
export const ScrollRevealShowcase: React.FC<Props> = ({ onAskRoss }) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const archRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  // Muted until the visitor asks for sound (muted autoplay is never
  // blocked); "Hear Ross" restarts the front clip with sound.
  const [isMuted, setIsMuted] = useState(true);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [restartKey, setRestartKey] = useState(0);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [theatre, setTheatre] = useState<number | null>(null);
  const count = SHOWCASE_CLIPS.length;

  const goTo = useCallback((i: number) => {
    setActive(((i % count) + count) % count);
    setProgress(0);
  }, [count]);

  const hearRoss = () => {
    if (isMuted) { setIsMuted(false); setRestartKey((k) => k + 1); } else setIsMuted(true);
  };
  const askRoss = () => { setTheatre(null); onAskRoss?.(); };

  useEffect(() => {
    if (!rootRef.current || !archRef.current || !rightRef.current) return;

    // gsap.context scopes every tween/ScrollTrigger created inside it to
    // this component, so ctx.revert() on unmount cleanly tears all of it
    // down. Relies on the page-level Lenis + ScrollTrigger.update() loop
    // (SvgMaskTransitions) -- no second Lenis here.
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 769px)', () => {
        ScrollTrigger.create({
          trigger: archRef.current,
          start: 'top top',
          end: 'bottom bottom',
          pin: rightRef.current,
          scrub: true,
        });

        const sectionEls = gsap.utils.toArray<HTMLElement>(
          '.reveal-showcase .arch__info'
        );
        sectionEls.forEach((el, index) => {
          if (index === sectionEls.length - 1) return;
          gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          }).to(document.body, {
            backgroundColor: BG_COLORS[index % BG_COLORS.length],
            duration: 1.5,
            ease: 'power2.inOut',
          }, 0);
        });
      });

      return () => {
        mm.revert();
      };
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // The section crossing the middle of the screen picks the clip.
  useEffect(() => {
    const els = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('.arch__info') || []);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const section = SECTIONS.find((s) => s.id === e.target.id);
        if (section) goTo(section.clip);
      }
    }, { rootMargin: '-45% 0px -45% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [goTo]);

  const clip = SHOWCASE_CLIPS[active];
  const nearEnd = progress > 0.82;

  return (
    <div className="reveal-showcase" ref={rootRef}>
      <div className="container">
        <div className="arch" ref={archRef}>
          <div className="arch__left">
            {SECTIONS.map((section) => (
              <div className="arch__info" key={section.id} id={section.id}>
                <div className="content">
                  <h2 className="header">{section.header}</h2>
                  <p className="desc">{section.desc}</p>
                  <a className="link" href="#" style={{ backgroundColor: section.accent }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none">
                      <path
                        fill="#121212"
                        d="M5 2c0 1.105-1.895 2-3 2a2 2 0 1 1 0-4c1.105 0 3 .895 3 2ZM11 3.5c0 1.105-.895 3-2 3s-2-1.895-2-3a2 2 0 1 1 4 0ZM6 9a2 2 0 1 1-4 0c0-1.105.895-3 2-3s2 1.895 2 3Z"
                      />
                    </svg>
                    <span>Learn More</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="arch__right" ref={rightRef}>
            <div className="video-wrapper">
              <div className="showcase-stage">
                <DepthCarousel
                  items={SHOWCASE_CLIPS}
                  activeIndex={active}
                  onChange={(i) => goTo(i)}
                  activeMuted={isMuted}
                  loopActive={isMuted}
                  onActiveEnded={(i) => goTo(i + 1)}
                  onActiveTime={(_, t, d) => setProgress(d ? t / d : 0)}
                  onActiveClick={(i) => setTheatre(i)}
                  paused={theatre !== null}
                  captionsOn={captionsOn}
                  restartKey={restartKey}
                  enableWheel={false}
                  depth={120}
                  spread={44}
                  tilt={12}
                  tiltDirection="right"
                  perspective={1400}
                  visibleCards={3}
                  falloff={0.22}
                  blur={5}
                  autoplay={false}
                  loop
                  cardWidth={600}
                  cardHeight={338}
                  radius={18}
                  tint="#05060a"
                  duration={650}
                  ease="power3.out"
                  showControls
                  showIndicators={false}
                />
              </div>

              <div className="showcase-bar">
                <button type="button" className={`showcase-hear${isMuted ? '' : ' is-on'}`} onClick={hearRoss} aria-pressed={!isMuted} aria-label={isMuted ? 'Hear Ross (sound on)' : 'Mute'}>
                  {isMuted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M23 9l-6 6M17 9l6 6" />
                    </svg>
                  )}
                  <span className="showcase-hear__text">{isMuted ? 'Hear Ross' : 'Mute'}</span>
                </button>
                <button type="button" className="showcase-icon" onClick={() => setTheatre(active)} aria-label="Watch full screen" title="Watch full screen">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3" />
                  </svg>
                </button>
                <ChapterMenu active={active} progress={progress} onPick={goTo} />
                {clip.captions && (
                  <button type="button" className={`showcase-icon${captionsOn ? ' is-on' : ''}`} onClick={() => setCaptionsOn((c) => !c)} aria-pressed={captionsOn} aria-label="Captions" title="Captions">
                    CC
                  </button>
                )}
                <span className="showcase-spacer" />
                <button type="button" className={`showcase-ask${nearEnd ? ' is-lit' : ''}`} onClick={askRoss}>
                  <span>Ask Ross<span className="showcase-ask__long"> about this</span></span> <span aria-hidden="true">→</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        <div className="spacer" />
      </div>

      {/* Portalled to <body>: inside the page's stacked sections it would sit
          under the site's fixed nav whatever its z-index. */}
      {theatre !== null && createPortal(
        <ShowcaseTheatre
          index={theatre}
          onIndex={setTheatre}
          onClose={() => { if (theatre !== null) goTo(theatre); setTheatre(null); }}
          onAskRoss={askRoss}
        />,
        document.body
      )}
    </div>
  );
};

// Chapter menu: a navy button (three bars that turn into an X, after
// Uiverse.io, jerome_5148) showing the playing clip's name, unfolding a
// list of every clip. Picking one plays it; outside click or Esc closes.
function ChapterMenu({ active, progress, onPick }: { active: number; progress: number; onPick: (i: number) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className={`chapter-menu${open ? ' is-open' : ''}`} ref={rootRef}>
      <button type="button" className="chapter-menu__btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="chapter-menu__bars" aria-hidden="true"><span /><span /><span /></span>
        <span className="chapter-menu__current">{SHOWCASE_CLIPS[active].label}</span>
      </button>
      <div className="chapter-menu__list" role="menu" aria-label="Clips">
        {SHOWCASE_CLIPS.map((c, i) => (
          <button
            key={c.video}
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            className={`chapter-menu__item${i === active ? ' is-active' : ''}`}
            style={{ '--i': i } as React.CSSProperties}
            onClick={() => { onPick(i); setOpen(false); }}
          >
            <span className="chapter-menu__num">{String(i + 1).padStart(2, '0')}</span>
            {c.label}
            {i === active && <span className="chapter-menu__bar" style={{ transform: `scaleX(${progress})` }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// Full-screen player: sound on (the tap allows it), native controls, next
// clip when one ends, Esc / close returns to the same spot on the page.
function ShowcaseTheatre({ index, onIndex, onClose, onAskRoss }: {
  index: number; onIndex: (i: number) => void; onClose: () => void; onAskRoss: () => void;
}) {
  const clip = SHOWCASE_CLIPS[index];
  const n = SHOWCASE_CLIPS.length;
  const closeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % n);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + n) % n);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.documentElement.style.overflow = prev; };
  }, [index, n, onClose, onIndex]);

  return (
    <div className="showcase-theatre" role="dialog" aria-modal="true" aria-label={clip.alt} data-lenis-prevent onClick={onClose}>
      <div className="showcase-theatre__frame" onClick={(e) => e.stopPropagation()}>
        <div className="showcase-theatre__head">
          <span className="showcase-theatre__eyebrow">Walk with Ross · {index + 1} of {n}</span>
          <strong>{clip.alt}</strong>
          <button ref={closeRef} type="button" className="showcase-theatre__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <video
          key={clip.video}
          className="showcase-theatre__video"
          src={clip.video}
          poster={clip.poster}
          controls
          autoPlay
          playsInline
          onEnded={() => onIndex((index + 1) % n)}
        >
          {clip.captions && <track kind="captions" src={clip.captions} srcLang="en" label="English" default />}
        </video>
        <div className="showcase-theatre__foot">
          <button type="button" onClick={() => onIndex((index - 1 + n) % n)}>← {SHOWCASE_CLIPS[(index - 1 + n) % n].label}</button>
          <button type="button" className="showcase-ask is-lit" onClick={onAskRoss}>Ask Ross about this →</button>
          <button type="button" onClick={() => onIndex((index + 1) % n)}>{SHOWCASE_CLIPS[(index + 1) % n].label} →</button>
        </div>
      </div>
    </div>
  );
}
