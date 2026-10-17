import React, { useState, useEffect, useRef } from 'react';
import { VariationType } from '../SvgMaskTransitions/SvgMaskTransitions';
import { variationsData } from '../../data/sampleImages';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import gsap from 'gsap';

interface MaskPreviewModalProps {
  variation: VariationType | null;
  onClose: () => void;
  onOpenFullExperience?: (v: VariationType) => void;
}

export const MaskPreviewModal: React.FC<MaskPreviewModalProps> = ({
  variation,
  onClose,
  onOpenFullExperience,
}) => {
  const [progress, setProgress] = useState(0.2);
  const [isPlaying, setIsPlaying] = useState(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  if (!variation) return null;
  const currentData = variationsData[variation];
  const images = currentData.images;

  // Animate progress when playing
  useEffect(() => {
    if (isPlaying) {
      const obj = { p: progress };
      tweenRef.current = gsap.to(obj, {
        p: 1,
        duration: 4 * (1 - progress),
        ease: 'power1.inOut',
        onUpdate: () => {
          setProgress(obj.p);
        },
        onComplete: () => {
          setIsPlaying(false);
        },
      });
    } else {
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
    }
    return () => {
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, [isPlaying]);

  const activeIndex = progress < 0.45 ? 0 : progress < 0.8 ? 1 : 2;
  const activeImg = images[activeIndex] || images[0];
  const nextImg = images[Math.min(activeIndex + 1, images.length - 1)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-zinc-950 border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/80">
          <div>
            <h3 className="text-base font-bold text-white font-editorial">
              {currentData.name} — Interactive Mask Scrub
            </h3>
            <p className="text-xs text-white/50">{currentData.scrollInstructions}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live SVG Stage Viewport */}
        <div className="relative aspect-video w-full bg-black overflow-hidden select-none">
          {/* Base Layer */}
          <div className="absolute inset-0">
            <img
              src={nextImg.src}
              alt={nextImg.alt}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover brightness-75"
            />
          </div>

          {/* Masked Transitioning Layer */}
          <div
            className="absolute inset-0 transition-opacity duration-75"
            style={{
              clipPath:
                variation === 'horizontal-blinds'
                  ? `polygon(0 0, 100% 0, 100% ${Math.max(0, 100 - progress * 100)}%, 0 ${Math.max(
                      0,
                      100 - progress * 100
                    )}%)`
                  : variation === 'vertical-blinds'
                  ? `polygon(0 0, ${Math.max(0, 100 - progress * 100)}% 0, ${Math.max(
                      0,
                      100 - progress * 100
                    )}% 100%, 0 100%)`
                  : undefined,
              opacity: variation.includes('grid') ? Math.max(0, 1 - progress * 1.2) : 1,
            }}
          >
            <img
              src={activeImg.src}
              alt={activeImg.alt}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Grid simulation overlay if grid mode */}
          {variation.includes('grid') && (
            <div
              className="absolute inset-0 pointer-events-none grid grid-cols-12 grid-rows-6 gap-0.5 mix-blend-overlay"
              style={{ opacity: 1 - progress }}
            >
              {Array.from({ length: 72 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white transition-opacity duration-300"
                  style={{
                    opacity: (i * 17) % 100 < progress * 100 ? 0 : 0.4,
                  }}
                />
              ))}
            </div>
          )}

          {/* Blind lines overlay if horizontal blinds */}
          {variation === 'horizontal-blinds' && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full bg-black/60 transition-all duration-100"
                  style={{
                    height: `${(1 - (progress % 0.33) * 3) * 6}px`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Caption */}
          <div className="absolute bottom-6 left-6 text-white max-w-md pointer-events-none font-editorial">
            <h4 className="text-2xl font-bold tracking-tight mb-1">{activeImg.title}</h4>
            <p className="text-xs text-white/70 line-clamp-2">{activeImg.description}</p>
          </div>
        </div>

        {/* Controls Footer */}
        <div className="p-5 border-t border-white/10 bg-zinc-900/60 flex items-center justify-between gap-6 text-xs text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold hover:bg-white/90"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setProgress(0);
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Scrub slider */}
          <div className="flex-1 flex items-center gap-3 max-w-md">
            <span className="text-white/50 text-[11px]">Scrub:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={progress}
              onChange={(e) => {
                setIsPlaying(false);
                setProgress(Number(e.target.value));
              }}
              className="w-full accent-white cursor-pointer"
            />
            <span className="font-mono text-white/80 tabular-nums">
              {Math.round(progress * 100)}%
            </span>
          </div>

          {onOpenFullExperience && (
            <button
              onClick={() => {
                onClose();
                onOpenFullExperience(variation);
              }}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-colors"
            >
              View Fullscreen Scroll →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
