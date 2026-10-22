import React, { useState } from 'react';
import { TrailerConfiguratorPanel } from './TrailerConfiguratorPanel';
import { SlitherNavPanel } from './SlitherNavPanel';
import { RangeOverview } from './RangeOverview';
import { RossPanel } from './RossPanel';
import { useRoss } from '../hooks/useRoss';

interface TrailerRangePageProps {
  onBackHome?: () => void;
}

// The dedicated Trailer Range page -- previously the configurator lived
// inline at the bottom of the homepage's long scroll (SvgMaskTransitions'
// "next-random-grid" section); it now lives here as its own page, reached
// from the nav's TRAILER RANGE item and every other "view trailers" CTA
// in the app (Online Shop / Gallery modal buttons in MenuBanner all share
// the same onTrailerRangeClick handler).
const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export const TrailerRangePage: React.FC<TrailerRangePageProps> = ({ onBackHome }) => {
  const ross = useRoss();
  const [rossOpen, setRossOpen] = useState(false);

  const openRoss = () => {
    setRossOpen(true);
    ross.refresh();
    setTimeout(() => scrollTo('trailer-categories'), 50);
  };
  const closeRoss = () => {
    ross.stop();
    setRossOpen(false);
  };

  return (
    <div className="relative z-20 w-full min-h-screen bg-white">
      {/* Intro: same style as the homepage interstitial, with Trailer Range copy.
          The round button scrolls down to the configurator. */}
      <section className="relative w-full bg-[#eef2f8] text-zinc-900 pt-[120px] sm:pt-[150px] md:pt-[170px] pb-16 sm:pb-20 px-6 flex flex-col items-center justify-center font-sf text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold tracking-tighter text-zinc-900 font-sf mb-5 leading-[1.05]">
            Matched To Your Boat.
            <br />
            Built To Last.
          </h2>
          <p className="max-w-3xl text-lg sm:text-xl md:text-2xl text-zinc-500 font-normal tracking-normal font-sf leading-relaxed mb-12">
            Every Extreme is built in Southampton. Let AI Ross ask a few quick questions, what you tow, where you launch, beach or slip and show you the exact trailer to buy.
          </p>
          <div className="w-full flex justify-center">
            <SlitherNavPanel
              idPrefix="range-intro"
              theme="glass-light"
              variant="button"
              chrome="expand"
              onClick={openRoss}
              label="Build Your Trailer With AI Ross"
              width={88}
              height={88}
              expandedWidth={430}
              fontSize={17}
            />
          </div>

          {/* Second route for people who'd rather choose without Ross */}
          <button
            onClick={() => scrollTo('trailer-categories')}
            className="mt-8 text-sm sm:text-base font-medium text-zinc-600 hover:text-black underline underline-offset-4 decoration-zinc-300 hover:decoration-black transition-colors cursor-pointer"
          >
            Or browse the range and choose yourself
          </button>
        </div>
      </section>

      <RangeOverview
        onOpenBuilder={() => scrollTo('trailer-builder')}
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
            />
          ) : null
        }
      />

      <div id="trailer-builder" className="scroll-mt-24">
        <TrailerConfiguratorPanel />
      </div>
    </div>
  );
};
