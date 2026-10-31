import React, { useEffect } from 'react';
import AiAssistantButton from './AiAssistantButton';
import { RangeOverview } from './RangeOverview';
import { RangeFinder } from './RangeFinder';
import { RossPanel } from './RossPanel';
import { useRossContext } from '../hooks/RossContext';

interface TrailerRangePageProps {
  onBackHome?: () => void;
  /** Bumped by the homepage orb: open voice Ross and jump to him. */
  rossRequest?: number;
  onRossShown?: () => void;
}

// The dedicated Trailer Range page -- previously the configurator lived
// inline at the bottom of the homepage's long scroll (SvgMaskTransitions'
// "next-random-grid" section); it now lives here as its own page, reached
// from the nav's TRAILER RANGE item and every other "view trailers" CTA
// in the app (Online Shop / Gallery modal buttons in MenuBanner all share
// the same onTrailerRangeClick handler).
const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export const TrailerRangePage: React.FC<TrailerRangePageProps> = ({ onBackHome, rossRequest = 0, onRossShown }) => {
  // The orb starts voice Ross (Ultravox); the corner icon on every page is
  // the typed chat (RossChat, OpenAI).
  // Ross himself lives at app level (RossContext) so a call carries on
  // into the Trailer Builder.
  const ross = useRossContext();
  const { panelOpen: rossOpen, setPanelOpen: setRossOpen } = ross;

  const openRoss = () => {
    setRossOpen(true);
    ross.refresh();
    setTimeout(() => scrollTo('find-your-trailer'), 50);
  };
  useEffect(() => {
    if (!rossRequest) return;
    onRossShown?.();
    setRossOpen(true);
    ross.refresh();
    // Wait for the page to lay out, then jump (no long smooth scroll from the top).
    setTimeout(() => document.getElementById('find-your-trailer')?.scrollIntoView({ block: 'start' }), 80);
  }, [rossRequest]);

  const closeRoss = () => {
    ross.stop();
    setRossOpen(false);
  };

  return (
    <div className="relative z-20 w-full min-h-screen bg-white">
      {/* Intro: same style as the homepage interstitial, with Trailer Range copy.
          The round button scrolls down to the configurator. */}
      <section className="relative overflow-hidden isolate w-full bg-[#eef2f8] text-zinc-900 pt-[120px] sm:pt-[150px] md:pt-[170px] pb-16 sm:pb-20 px-6 flex flex-col items-center justify-center font-sf text-center">
        {/* Background: a car reversing a boat down a slipway, softly blurred
            under a pale wash so the heading and copy stay easy to read. */}
        <video
          className="absolute inset-0 -z-10 w-full h-full object-cover scale-110 blur-[6px]"
          src="/videos/slipway-bg.mp4"
          poster="/videos/posters/slipway-bg.jpg"
          autoPlay muted loop playsInline preload="metadata" aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-[#eef2f8]/70" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto flex flex-col items-center justify-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold tracking-tighter text-zinc-900 font-sf mb-5 leading-[1.05]">
            Matched To Your Boat.
            <br />
            Built To Last.
          </h2>
          <p className="max-w-3xl text-lg sm:text-xl md:text-2xl text-zinc-600 font-normal tracking-normal font-sf leading-relaxed mb-12">
            Every Extreme is built in Southampton. Let AI Ross ask a few quick questions, what you tow, where you launch, beach or slip and show you the exact trailer to buy.
          </p>
          <div className="w-full flex justify-center">
            <AiAssistantButton onClick={openRoss} label="Build Your Trailer With AI Ross" />
          </div>

          {/* Second route for people who'd rather choose without Ross */}
          <button
            onClick={() => scrollTo('find-your-trailer')}
            className="mt-8 text-sm sm:text-base font-medium text-zinc-700 hover:text-black underline underline-offset-4 decoration-zinc-300 hover:decoration-black transition-colors cursor-pointer"
          >
            Or browse the range and choose yourself
          </button>
        </div>
      </section>

      <RangeOverview />

      {/* Explore The Range: AI Ross, live launch conditions, trailer types,
          shop by boat, fit check and the whole 2026 range. */}
      <RangeFinder
        onAskRoss={openRoss}
        highlighted={rossOpen || ross.pick ? ross.highlighted : null}
        pick={ross.pick}
        rossPanel={
          rossOpen ? (
            <RossPanel
              phase={ross.phase}
              info={ross.info}
              agentState={ross.agentState}
              caption={ross.caption}
              onStart={ross.start}
              onStop={ross.stop}
              onClose={closeRoss}
              mode={ross.mode}
              rehearsalAvailable={ross.rehearsalAvailable}
              transcript={ross.transcript}
              onRehearse={ross.startRehearsal}
              onSay={ross.say}
            />
          ) : null
        }
      />

    </div>
  );
};
