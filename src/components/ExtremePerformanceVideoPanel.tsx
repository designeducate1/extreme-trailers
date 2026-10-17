import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Video, Sparkles, ExternalLink } from 'lucide-react';

interface ExtremePerformanceVideoPanelProps {
  className?: string;
}

export const ExtremePerformanceVideoPanel: React.FC<ExtremePerformanceVideoPanelProps> = ({
  className = '',
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isExpandedModal, setIsExpandedModal] = useState<boolean>(false);

  // Video embed parameters
  const videoId = 'b3eJS_P3J8c';
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=1&playsinline=1&modestbranding=1&rel=0`;

  return (
    <>
      <div
        className={`pointer-events-auto transition-all duration-300 ${
          isMinimized ? 'w-auto' : 'w-full max-w-[340px] sm:max-w-[420px]'
        } ${className}`}
      >
        <div className="rounded-2xl bg-black/85 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden transition-all">
          {/* Header Bar */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-blue-950/80 to-slate-900/80 border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                    Engineering Video
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white/70">
                    NEC BoatLife
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">
                  Why Buy Extreme? · Ross Knight
                </div>
              </div>
            </div>

            {/* Header controls */}
            <div className="flex items-center gap-1 shrink-0 text-white/70">
              <button
                type="button"
                onClick={() => setIsExpandedModal(true)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Fullscreen Theater View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? 'Expand panel' : 'Minimize panel'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Collapsible Content */}
          {!isMinimized && (
            <div>
              {/* Video Player Canvas */}
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden group">
                <iframe
                  src={embedUrl}
                  title="Why Buy Extreme Trailers - Ross Knight NEC BoatLife"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Bottom Details & Sound Guide */}
              <div className="p-3 bg-black/60 border-t border-white/10 text-left">
                <div className="flex items-center justify-between text-[11px] text-white/80 font-medium mb-1.5">
                  <span className="text-blue-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    In-House UK Manufacturing
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-3 h-3 text-amber-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
                    <span>{isMuted ? 'Unmute' : 'Muted'}</span>
                  </button>
                </div>

                <p className="text-[10px] text-white/60 leading-relaxed font-sans normal-case">
                  Ross Knight demonstrates our 6mm laser-cut fold winch posts (no welding), CNC polyurethane wobble rollers in 6 colors, and diamond-cut alloy wheels.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Theater View Modal */}
      {isExpandedModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-4xl bg-slate-950 border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Extreme Trailers Showcase Video
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Why Buy Extreme? — In-House UK Manufacturing Walkthrough
                </h3>
                <p className="text-xs text-white/50">
                  Presented by Ross Knight, Sales Director at NEC BoatLife
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpandedModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 mb-4 shadow-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0`}
                title="Extreme Trailers NEC Walkthrough"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Shot on location at the NEC BoatLife Show</span>
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 underline"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExtremePerformanceVideoPanel;
