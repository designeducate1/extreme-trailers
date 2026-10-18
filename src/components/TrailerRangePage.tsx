import React from 'react';
import { TrailerConfiguratorPanel } from './TrailerConfiguratorPanel';
import { SlitherNavPanel } from './SlitherNavPanel';
import bannerLogo from '../assets/extreme-logo-banner.png';

interface TrailerRangePageProps {
  onBackHome?: () => void;
}

// The dedicated Trailer Range page -- previously the configurator lived
// inline at the bottom of the homepage's long scroll (SvgMaskTransitions'
// "next-random-grid" section); it now lives here as its own page, reached
// from the nav's TRAILER RANGE item and every other "view trailers" CTA
// in the app (Online Shop / Gallery modal buttons in MenuBanner all share
// the same onTrailerRangeClick handler).
export const TrailerRangePage: React.FC<TrailerRangePageProps> = ({ onBackHome }) => {
  return (
    <div className="relative z-20 w-full min-h-screen bg-white">
      {/* Page header: logo, then the lozenge in its original toggle form
          -- this one is a genuine on/off state (unlike the homepage's
          button variant), reserved for the real Ultravox "Ross" voice
          assistant once it's built. Switching it on does nothing yet. */}
      <div className="w-full flex flex-col items-center gap-4 pt-16 pb-10 px-6 bg-white">
        <img
          src={bannerLogo}
          alt="Extreme Marine"
          className="h-[48px] sm:h-[56px] md:h-[64px] w-auto object-contain"
        />
        <SlitherNavPanel idPrefix="trailer-range" theme="glass-light" />
      </div>

      <TrailerConfiguratorPanel />
      <div className="w-full flex justify-center py-6 bg-white border-t border-zinc-200">
        <button
          onClick={onBackHome}
          className="text-xs font-sans-ui text-zinc-500 hover:text-black underline cursor-pointer transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};
