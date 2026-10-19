import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ScrollRevealShowcase } from '../ScrollRevealShowcase';
import { variationsData } from '../../data/sampleImages';
import { Play, Pause, RotateCcw, Sliders, ChevronDown } from 'lucide-react';
import { SlitherNavPanel } from '../SlitherNavPanel';

gsap.registerPlugin(ScrollTrigger);

export type VariationType = 'horizontal-blinds' | 'random-grid' | 'vertical-blinds' | 'column-grid';

interface SvgMaskTransitionsProps {
  initialVariation?: VariationType;
  onOpenTaskManager?: () => void;
  onTrailerRangeClick?: () => void;
}

export const SvgMaskTransitions: React.FC<SvgMaskTransitionsProps> = ({
  initialVariation = 'horizontal-blinds',
  onOpenTaskManager,
  onTrailerRangeClick,
}) => {
  const [variation, setVariation] = useState<VariationType>(initialVariation);
  const [blindCount, setBlindCount] = useState<number>(30);
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null);
  // Scopes buildEffect's own ScrollTriggers so rebuilding only reverts
  // ITS triggers, not every ScrollTrigger on the page -- a global
  // ScrollTrigger.getAll().kill() here would also wipe out any other
  // component's scroll animations mounted alongside this one (e.g.
  // ScrollRevealShowcase's pinned video), since ScrollTrigger has no
  // per-component awareness on its own.
  const stageCtxRef = useRef<gsap.Context | null>(null);
  const autoPlayTweenRef = useRef<gsap.core.Tween | null>(null);
  const fillsRef = useRef<(HTMLDivElement | null)[]>([]);
  const heroLogoRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);

  const currentData = variationsData[variation];
  const images = currentData.images;

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const lenis = new Lenis({
      lerp: 0.15,
      smoothWheel: true,
      syncTouch: !isTouch,
    });
    lenisRef.current = lenis;

    const onScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on('scroll', onScroll);

    const tickerCb = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCb);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      gsap.ticker.remove(tickerCb);
    };
  }, []);

  // Set default blind count based on variation
  useEffect(() => {
    if (variation === 'horizontal-blinds') setBlindCount(30);
    else if (variation === 'vertical-blinds') setBlindCount(14);
    else if (variation === 'random-grid' || variation === 'column-grid') setBlindCount(12);
  }, [variation]);

  // Master layout & animation builder
  const buildEffect = useCallback(() => {
    if (!stageRef.current) return;

    // Clean up previous master timeline and triggers
    if (masterTimelineRef.current) {
      masterTimelineRef.current.kill();
      masterTimelineRef.current = null;
    }
    if (stageCtxRef.current) {
      stageCtxRef.current.revert();
    }
    const stage = stageRef.current;
    stageCtxRef.current = gsap.context(() => {

    const svgNS = 'http://www.w3.org/2000/svg';
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Texts setup
    const textEls = stage.querySelectorAll<HTMLElement>('.txt');
    gsap.set(textEls, {
      clipPath: 'inset(100% 0 0 0)',
      y: 40,
      opacity: 1,
    });

    const layers = stage.querySelectorAll<SVGSVGElement>('.layer');

    // BUILD VARIATION 1: Horizontal Blinds
    if (variation === 'horizontal-blinds') {
      const vbWidth = 100;
      const vbHeight = (height / width) * 100;
      const count = blindCount || 30;
      const h = vbHeight / count;
      const blindsSets: Array<Array<{ top: SVGElement; bottom: SVGElement; y: number; h: number }>> = [];

      layers.forEach((svg) => {
        svg.setAttribute('viewBox', `0 0 ${vbWidth} ${vbHeight}`);
        const maskRect = svg.querySelector<SVGRectElement>('mask rect');
        if (maskRect) {
          maskRect.setAttribute('width', String(vbWidth));
          maskRect.setAttribute('height', String(vbHeight));
        }
        const img = svg.querySelector<SVGImageElement>('image');
        if (img) {
          img.setAttribute('width', String(vbWidth));
          img.setAttribute('height', String(vbHeight));
        }

        const g = svg.querySelector<SVGGElement>('g[id^="blinds"]');
        if (!g) return;
        g.innerHTML = '';

        const blinds: Array<{ top: SVGElement; bottom: SVGElement; y: number; h: number }> = [];
        let currentY = 0;

        for (let i = 0; i < count; i++) {
          const centerY = vbHeight - (currentY + h / 2);
          const rectTop = document.createElementNS(svgNS, 'rect');
          const rectBottom = document.createElementNS(svgNS, 'rect');

          [rectTop, rectBottom].forEach((r) => {
            r.setAttribute('x', '0');
            r.setAttribute('width', '100');
            r.setAttribute('height', '0');
            r.setAttribute('fill', 'white');
            r.setAttribute('shape-rendering', 'crispEdges');
            r.setAttribute('y', String(centerY));
          });

          g.appendChild(rectTop);
          g.appendChild(rectBottom);

          blinds.push({
            top: rectTop,
            bottom: rectBottom,
            y: centerY,
            h: h / 2,
          });
          currentY += h;
        }
        blindsSets.push(blinds);
      });

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      blindsSets.forEach((blinds, i) => {
        const blindsTimeline = gsap.timeline().to(
          blinds.flatMap((b) => [b.top, b.bottom]),
          {
            attr: {
              y: (idx) => {
                const b = blinds[Math.floor(idx / 2)];
                return idx % 2 === 0 ? b.y - b.h : b.y;
              },
              height: (idx) => {
                const b = blinds[Math.floor(idx / 2)];
                return b.h + 0.01;
              },
            },
            ease: 'power3.out',
            stagger: {
              each: 0.02,
              from: 'start',
            },
          }
        );

        if (i === 0) {
          if (heroLogoRef.current) {
            blindsTimeline.to(
              heroLogoRef.current,
              {
                opacity: 0,
                scale: 0.95,
                duration: 0.8,
                ease: 'power2.out',
              },
              0
            );
          }
          if (chevronRef.current) {
            blindsTimeline.to(
              chevronRef.current,
              {
                opacity: 0,
                duration: 0.4,
                ease: 'power2.out',
              },
              0
            );
          }
        }

        master.add(blindsTimeline);
        if (textEls[i]) {
          master.add(
            gsap.to(textEls[i], {
              clipPath: 'inset(0% 0% 0% 0%)',
              y: 0,
              duration: 1.5,
              ease: 'expo.out',
            }),
            '-=0.3'
          );
          master.add(
            gsap.to(textEls[i], {
              clipPath: 'inset(0% 0% 100% 0%)',
              y: -30,
              duration: 1.2,
              ease: 'power2.inOut',
            }),
            '+=0.8'
          );
        }
      });
      masterTimelineRef.current = master;
    }

    // BUILD VARIATION 2: Random Grid
    else if (variation === 'random-grid') {
      const vbWidth = 100;
      const vbHeight = (height / width) * 100;
      const cols = blindCount || (width <= 599 ? 6 : width <= 1024 ? 10 : 14);
      const rows = Math.round(cols * (vbHeight / vbWidth));
      const cellW = vbWidth / cols;
      const cellH = vbHeight / rows;

      const cellsSets: SVGElement[][] = [];

      layers.forEach((svg) => {
        svg.setAttribute('viewBox', `0 0 ${vbWidth} ${vbHeight}`);
        const maskRect = svg.querySelector<SVGRectElement>('mask rect');
        if (maskRect) {
          maskRect.setAttribute('width', String(vbWidth));
          maskRect.setAttribute('height', String(vbHeight));
        }
        const img = svg.querySelector<SVGImageElement>('image');
        if (img) {
          img.setAttribute('width', String(vbWidth));
          img.setAttribute('height', String(vbHeight));
        }

        const g = svg.querySelector<SVGGElement>('g[id^="blinds"]');
        if (!g) return;
        g.innerHTML = '';

        const cells: SVGElement[] = [];
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', String(x * cellW));
            rect.setAttribute('y', String(y * cellH));
            rect.setAttribute('width', String(cellW));
            rect.setAttribute('height', String(cellH));
            rect.setAttribute('fill', 'white');
            rect.setAttribute('shape-rendering', 'crispEdges');
            rect.setAttribute('opacity', '0');
            g.appendChild(rect);
            cells.push(rect);
          }
        }
        cellsSets.push(cells);
      });

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      cellsSets.forEach((cells, i) => {
        const shuffled = gsap.utils.shuffle([...cells]);
        const gridTl = gsap.timeline().to(shuffled, {
          opacity: 1,
          duration: 1.0,
          ease: 'power3.out',
          stagger: {
            each: 0.02,
          },
        });

        if (i === 0) {
          if (heroLogoRef.current) {
            gridTl.to(
              heroLogoRef.current,
              {
                opacity: 0,
                scale: 0.95,
                duration: 0.8,
                ease: 'power2.out',
              },
              0
            );
          }
          if (chevronRef.current) {
            gridTl.to(
              chevronRef.current,
              {
                opacity: 0,
                duration: 0.4,
                ease: 'power2.out',
              },
              0
            );
          }
        }

        master.add(gridTl);
        if (textEls[i]) {
          master.add(
            gsap.to(textEls[i], {
              clipPath: 'inset(0% 0% 0% 0%)',
              y: 0,
              duration: 2.2,
              ease: 'expo.out',
            }),
            '-=0.3'
          );
          master.add(
            gsap.to(textEls[i], {
              clipPath: 'inset(0% 0% 100% 0%)',
              y: 0,
              duration: 1.8,
              ease: 'power2.inOut',
            }),
            '+=0.8'
          );
        }
      });
      masterTimelineRef.current = master;
    }

    // BUILD VARIATION 3: Vertical Blinds
    else if (variation === 'vertical-blinds') {
      const vbWidth = (width / height) * 100;
      const vbHeight = 100;
      const count = blindCount || 12;
      const w = vbWidth / count;

      const blindsSets: Array<Array<{ left: SVGElement; right: SVGElement; x: number; w: number }>> = [];

      layers.forEach((svg, i) => {
        svg.setAttribute('viewBox', `0 0 ${vbWidth} ${vbHeight}`);
        const maskRect = svg.querySelector<SVGRectElement>('mask rect');
        if (maskRect) {
          maskRect.setAttribute('width', String(vbWidth));
          maskRect.setAttribute('height', String(vbHeight));
        }
        const img = svg.querySelector<SVGImageElement>('image');
        if (img) {
          img.setAttribute('width', String(vbWidth));
          img.setAttribute('height', String(vbHeight));
          img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        }

        const g = svg.querySelector<SVGGElement>('g[id^="blinds"]');
        if (!g) return;
        g.innerHTML = '';

        const blinds: Array<{ left: SVGElement; right: SVGElement; x: number; w: number }> = [];
        let currentX = 0;
        const isFirstLayer = i === 0;

        for (let j = 0; j < count; j++) {
          const centerX = currentX + w / 2;
          const rectLeft = document.createElementNS(svgNS, 'rect');
          const rectRight = document.createElementNS(svgNS, 'rect');

          [rectLeft, rectRight].forEach((r) => {
            r.setAttribute('y', '0');
            r.setAttribute('height', '100');
            r.setAttribute('width', isFirstLayer ? String(w / 2 + 0.1) : '0');
            r.setAttribute('fill', 'white');
            r.setAttribute('shape-rendering', 'crispEdges');
          });

          if (isFirstLayer) {
            rectLeft.setAttribute('x', String(centerX - w / 2));
            rectRight.setAttribute('x', String(centerX));
          } else {
            rectLeft.setAttribute('x', String(centerX));
            rectRight.setAttribute('x', String(centerX));
          }

          g.appendChild(rectLeft);
          g.appendChild(rectRight);

          blinds.push({ left: rectLeft, right: rectRight, x: centerX, w: w / 2 });
          currentX += w;
        }
        blindsSets.push(blinds);
      });

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      gsap.set(textEls, { clipPath: 'inset(0% 0% 100% 0%)', y: 40, opacity: 0 });
      if (textEls[0]) {
        gsap.set(textEls[0], { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1 });
      }

      blindsSets.forEach((blinds, i) => {
        if (i === 0) {
          if (heroLogoRef.current) master.to(heroLogoRef.current, { opacity: 0, scale: 0.95, duration: 0.8 }, 0);
          if (chevronRef.current) master.to(chevronRef.current, { opacity: 0, duration: 0.4 }, 0);
        }

        if (i > 0 && textEls[i - 1]) {
          master.to(
            textEls[i - 1],
            {
              clipPath: 'inset(0% 0% 100% 0%)',
              y: -40,
              opacity: 0,
              duration: 0.8,
            },
            '>'
          );
        }

        const openTl = gsap.to(
          blinds.flatMap((b) => [b.left, b.right]),
          {
            attr: {
              x: (idx) => {
                const b = blinds[Math.floor(idx / 2)];
                return idx % 2 === 0 ? b.x - b.w : b.x;
              },
              width: (idx) => {
                const b = blinds[Math.floor(idx / 2)];
                return b.w + 0.05;
              },
            },
            ease: 'none',
            stagger: { each: 0.02, from: 'start' },
          }
        );

        master.add(openTl, '-=0.3');

        if (textEls[i]) {
          master.to(
            textEls[i],
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              y: 0,
              opacity: 1,
              duration: 0.8,
            },
            '-=0.5'
          );
        }

        master.to({}, { duration: 1 });
      });
      masterTimelineRef.current = master;
    }

    // BUILD VARIATION 4: Column Grid
    else if (variation === 'column-grid') {
      const vbWidth = 100;
      const vbHeight = (height / width) * 100;
      const cols = blindCount || (width <= 599 ? 6 : width <= 1024 ? 10 : 14);
      const rows = Math.round(cols * (vbHeight / vbWidth));
      const cellW = vbWidth / cols;
      const cellH = vbHeight / rows;

      const columnGridSets: Array<{ cells: SVGElement[]; rows: number; cols: number }> = [];

      layers.forEach((svg) => {
        svg.setAttribute('viewBox', `0 0 ${vbWidth} ${vbHeight}`);
        const maskRect = svg.querySelector<SVGRectElement>('mask rect');
        if (maskRect) {
          maskRect.setAttribute('width', String(vbWidth));
          maskRect.setAttribute('height', String(vbHeight));
        }
        const img = svg.querySelector<SVGImageElement>('image');
        if (img) {
          img.setAttribute('width', String(vbWidth));
          img.setAttribute('height', String(vbHeight));
        }

        const g = svg.querySelector<SVGGElement>('g[id^="blinds"]');
        if (!g) return;
        g.innerHTML = '';

        const cells: SVGElement[] = [];
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', String(x * cellW));
            rect.setAttribute('y', String(y * cellH));
            rect.setAttribute('width', String(cellW));
            rect.setAttribute('height', String(cellH));
            rect.setAttribute('fill', 'white');
            rect.setAttribute('shape-rendering', 'crispEdges');
            rect.setAttribute('opacity', '0');
            g.appendChild(rect);
            cells.push(rect);
          }
        }
        columnGridSets.push({ cells, rows, cols });
      });

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      columnGridSets.forEach((set, i) => {
        const ordered: SVGElement[] = [];
        for (let x = 0; x < set.cols; x++) {
          const colCells: SVGElement[] = [];
          for (let y = 0; y < set.rows; y++) {
            colCells.push(set.cells[y * set.cols + x]);
          }
          const shuffledCol = gsap.utils.shuffle(colCells);
          ordered.push(...shuffledCol);
        }

        const colTl = gsap.timeline().to(ordered, {
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          stagger: {
            each: 0.02,
          },
        });

        if (i === 0) {
          if (heroLogoRef.current) colTl.to(heroLogoRef.current, { opacity: 0, scale: 0.95, duration: 0.8 }, 0);
          if (chevronRef.current) colTl.to(chevronRef.current, { opacity: 0, duration: 0.4 }, 0);
        }

        master.add(colTl);
        if (textEls[i]) {
          master.add(
            gsap.to(textEls[i], {
              clipPath: 'inset(0% 0% 0% 0%)',
              y: 0,
              duration: 2.2,
              ease: 'expo.out',
            }),
            '-=0.3'
          );
          master.add(
            gsap.to(textEls[i], {
              clipPath: 'inset(0% 0% 100% 0%)',
              y: 0,
              duration: 1.6,
              ease: 'power2.inOut',
            }),
            '+=0.8'
          );
        }
      });
      masterTimelineRef.current = master;
    }

    // Set up progress bar fill listener
    ScrollTrigger.create({
      trigger: stageRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.3,
      onUpdate: (self) => {
        const p = self.progress;
        const totalSteps = 3;
        fillsRef.current.forEach((fillEl, idx) => {
          if (!fillEl) return;
          let segmentP = (p - idx / totalSteps) * totalSteps;
          segmentP = Math.max(0, Math.min(1, segmentP));
          fillEl.style.width = `${segmentP * 100}%`;
        });
      },
    });

    ScrollTrigger.refresh();
    }, stageRef);
  }, [variation, blindCount]);

  // Rebuild on variation or blindCount change
  useEffect(() => {
    buildEffect();

    const handleResize = () => {
      buildEffect();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (stageCtxRef.current) {
        stageCtxRef.current.revert();
        stageCtxRef.current = null;
      }
    };
  }, [buildEffect]);

  // Handle auto-scroll preview
  const toggleAutoPlay = () => {
    if (!stageRef.current) return;
    if (isPlayingAuto) {
      if (autoPlayTweenRef.current) {
        autoPlayTweenRef.current.kill();
        autoPlayTweenRef.current = null;
      }
      setIsPlayingAuto(false);
    } else {
      setIsPlayingAuto(true);
      const stageRect = stageRef.current.getBoundingClientRect();
      const targetScroll = window.scrollY + stageRect.bottom - window.innerHeight;
      autoPlayTweenRef.current = gsap.to(window, {
        scrollTo: { y: targetScroll, autoKill: true },
        duration: 12,
        ease: 'none',
        onComplete: () => {
          setIsPlayingAuto(false);
        },
      });
    }
  };

  const scrollToStage = () => {
    if (!stageRef.current) return;
    const targetY = window.innerHeight * 0.9;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetY, { duration: 1.2 });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  const scrollToNextVariation = (nextVar: VariationType) => {
    setVariation(nextVar);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToNextRandomGrid = () => {
    if (variation !== 'horizontal-blinds') {
      setVariation('horizontal-blinds');
    }
    const el = document.getElementById('next-random-grid') || document.querySelector('.spacer-section');
    if (el) {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(el, { duration: 1.2 });
      } else {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full bg-black text-white font-editorial selection:bg-white selection:text-black">
      {/* STAGE: Full SVG Mask Venetian Blinds Transitions */}
      <section ref={stageRef} className="stage relative z-20">
        <div className="layers">
          {/* Base Background Image directly behind the logo */}
          <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
            <img
              src="https://i.postimg.cc/Y2vmZg5N/image-20261002-102200-replace-with-incredible-sunset-over-a-beach-with-e-remove-the-logo-and-trailer.jpg"
              alt="Sunset beach background"
              className="w-full h-full object-cover object-center pointer-events-none select-none"
            />
          </div>

          {images.map((img, idx) => (
            <svg
              key={`${variation}-layer-${idx}`}
              className="layer z-10"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <mask id={`mask${idx + 1}`} maskUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="100" height="100" fill="black" />
                  <g id={`blinds${idx + 1}`} />
                </mask>
              </defs>
              <image
                href={img.src}
                xlinkHref={img.src}
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMid slice"
                mask={`url(#mask${idx + 1})`}
              />
            </svg>
          ))}


          {/* Initial View: Extreme Brand Logo sitting on the Sunset Background Image */}
          <div
            ref={heroLogoRef}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none px-4 -translate-y-[2vh] sm:-translate-y-[3vh]"
          >
            <img
              src="https://i.postimg.cc/MTzH11pF/Extreme-logo.png"
              alt="Extreme Logo"
              referrerPolicy="no-referrer"
              className="w-full max-w-[420px] sm:max-w-[500px] md:max-w-[580px] lg:max-w-[665px] xl:max-w-[750px] 2xl:max-w-[800px] h-auto object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)] -translate-y-[20%]"
            />

            {/* Brand + location eyebrow, same pattern as Peter Leonard Marine's hero -- real
                on-page text (not an image), reinforcing the same brand/location keywords
                as the <title>/meta tags for consistency. */}
            {/* Width ladder here is the logo's own ladder scaled to ~76% --
                the logo PNG has sizeable transparent padding baked in, so
                its actual VISIBLE wordmark only fills about 76% of the
                <img>'s declared box (confirmed by sampling the PNG's alpha
                channel) -- matching this text to that real visible width,
                not the image tag's nominal one. */}
            {/* Negative margin here, not a small translate -- the logo PNG
                has ~114px of transparent padding below its visible
                wordmark (measured via alpha-channel sampling), so the
                real gap down to this text was ~200px even though the
                img tag's own box only implies ~85px. Pulled up to sit as
                a genuine tight subtitle under the visible logo, not the
                image file's padded box. */}
            <p className="font-sf w-full max-w-[320px] sm:max-w-[380px] md:max-w-[440px] lg:max-w-[505px] xl:max-w-[570px] 2xl:max-w-[610px] mx-auto mt-[-93px] sm:mt-[-111px] md:mt-[-130px] lg:mt-[-142px] xl:mt-[-173px] 2xl:mt-[-179px] text-center text-[15px] sm:text-[18px] md:text-[21px] lg:text-[23px] xl:text-[28px] 2xl:text-[29px] tracking-[0.08em] sm:tracking-[0.1em] font-semibold uppercase flex flex-nowrap items-baseline justify-center whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              <span className="text-white">Extreme Trailers</span>
              <span className="text-white/40 mx-3">&bull;</span>
              {/* Warm honey-gold, not the site's usual lime accent -- lime is
                  cool-leaning (chartreuse) and sits in near-clash against a
                  warm sunset photo's oranges; this warm gold is analogous
                  to the photo's own color temperature instead of fighting
                  it. Same reasoning Pete's site already uses its own gold
                  (#a8863f) for exactly this role -- a location word over a
                  photographic hero -- tuned brighter here since this is
                  always over a photo, not a plain background. */}
              <span className="text-[#E8B84B]">Southampton</span>
            </p>
          </div>

          {/* Scroll Down Prompt Chevron */}
          <div
            ref={chevronRef}
            className="absolute bottom-8 left-0 w-full z-30 flex flex-col items-center pointer-events-auto"
          >
            <button
              onClick={scrollToStage}
              aria-label="Scroll down to explore"
              className="group flex flex-col items-center text-white/80 hover:text-white transition-colors cursor-pointer drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            >
              <ChevronDown className="w-6 h-6 animate-bounce text-white/90" />
            </button>
          </div>

          {/* Three-segment progress bar at bottom */}
          <div className="progress-bar-container z-30">
            <div className="segment-track">
              <div
                ref={(el) => {
                  fillsRef.current[0] = el;
                }}
                className="segment-fill"
              />
            </div>
            <div className="segment-track">
              <div
                ref={(el) => {
                  fillsRef.current[1] = el;
                }}
                className="segment-fill"
              />
            </div>
            <div className="segment-track">
              <div
                ref={(el) => {
                  fillsRef.current[2] = el;
                }}
                className="segment-fill"
              />
            </div>
          </div>

          {/* Text reveal overlay for each layer */}
          <div className="texts z-20 font-sf">
            {images.map((img, idx) => (
              <div key={`txt-${idx}`} className="txt font-sf">
                <h1 className="whitespace-pre-line font-sf">{img.title}</h1>
                <h2 className="font-sf">{img.subtitle}</h2>
                <span className="font-sf">{img.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Space of White Background with 'Build The Right Trailer. First Time.' */}
      <section className="relative z-20 w-full bg-[#eef2f8] text-zinc-900 pt-[140px] sm:pt-[190px] md:pt-[220px] pb-0 px-6 flex flex-col items-center justify-center font-sf text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold tracking-tighter text-zinc-900 font-sf mb-5 leading-[1.05]">
            Build The Right Trailer.
            <br />
            First Time.
          </h2>
          <p className="max-w-3xl text-lg sm:text-xl md:text-2xl text-zinc-500 font-normal tracking-normal font-sf leading-relaxed mb-12">
            Trailers to suit RIBs, powerboats, sail boats, dinghies and jetskis — built live with AI Ross, our voice-cloned trailer builder that finds your exact spec in 60 seconds.
          </p>

          {/* Launch AI Trailer Builder lozenge just below the sentence */}
          <div className="w-full flex justify-center">
            <SlitherNavPanel
              idPrefix="interstitial"
              theme="glass-light"
              variant="button"
              chrome="line"
              onClick={onTrailerRangeClick}
              label="Launch AI Trailer Builder"
              width={460}
              height={78}
              fontSize={18}
            />
          </div>
        </div>
      </section>

      {/* Last Screen Panel: scroll-pinned video showcase. The trailer
          configurator that used to live here has moved to its own
          Trailer Range page (see TrailerRangePage.tsx / App.tsx), reached
          from the nav's TRAILER RANGE item. Text copy here is placeholder,
          to be replaced. */}
      <section id="next-random-grid" className="relative z-20 w-full bg-[#eef2f8]">
        <ScrollRevealShowcase />
      </section>

    </div>
  );
};
