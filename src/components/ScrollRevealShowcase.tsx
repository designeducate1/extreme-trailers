import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollRevealShowcase.css';

// gsap.registerPlugin is idempotent -- already called once in
// SvgMaskTransitions.tsx, but harmless/cheap to ensure here too in case
// this component is ever used on its own.
gsap.registerPlugin(ScrollTrigger);

// Placeholder copy -- to be replaced with real Extreme Trailers content.
// Kept as four sections (matching the original effect's structure) so
// swapping the text later is a straight content edit, not a restructure.
const SECTIONS = [
  {
    id: 'section-1',
    accent: '#D5FF37',
    header: 'Why Buy Extreme',
    desc: 'Placeholder copy -- to be replaced. This section pins against the video on the right as you scroll.',
  },
  {
    id: 'section-2',
    accent: '#7DD6FF',
    header: 'Built To Last',
    desc: 'Placeholder copy -- to be replaced.',
  },
  {
    id: 'section-3',
    accent: '#FFA0B0',
    header: 'Engineered For The Water',
    desc: 'Placeholder copy -- to be replaced.',
  },
  {
    id: 'section-4',
    accent: '#FFA17B',
    header: 'Trusted By Boaters',
    desc: 'Placeholder copy -- to be replaced.',
  },
];

const BG_COLORS = ['#EDF9FF', '#FFECF2', '#FFE8DB'];

// Scroll-pinned showcase: the video on the right stays pinned in view
// while the four (placeholder) text sections on the left scroll past,
// with the page background tinting between sections. Originally four
// separate images cross-faded between sections; with a single video
// asset for now, it just stays put in its pinned window -- the
// background-tint and pin behaviour are preserved since those don't
// depend on having multiple visuals.
export const ScrollRevealShowcase: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const archRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Muted by default here -- unlike boats-of-dreams' video banner
  // (js/boats.js), which tries sound-on first. This site's explicit
  // choice is the opposite: stay silent until the visitor deliberately
  // unmutes via the button below. Muted autoplay is never blocked by
  // browsers, so no play()/catch fallback dance is needed either.
  const [isMuted, setIsMuted] = React.useState(true);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  useEffect(() => {
    if (!rootRef.current || !archRef.current || !rightRef.current) return;

    // gsap.context scopes every tween/ScrollTrigger created inside it to
    // this component, so ctx.revert() on unmount cleanly tears all of it
    // down -- no manual bookkeeping, and no interference with the page's
    // other ScrollTriggers (SvgMaskTransitions' own hero animation).
    // This relies on the Lenis + ScrollTrigger.update() raf loop already
    // running at the page level (SvgMaskTransitions) -- deliberately NOT
    // creating a second Lenis instance here, which would fight the first.
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
              <video
                ref={videoRef}
                src="/videos/why-buy-extreme.mp4"
                autoPlay
                loop
                muted={isMuted}
                playsInline
                aria-label="Why Buy Extreme promotional video"
              />
              <button
                type="button"
                className="video-mute-btn"
                onClick={toggleMute}
                aria-pressed={isMuted}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M23 9l-6 6M17 9l6 6" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="spacer" />
      </div>
    </div>
  );
};
