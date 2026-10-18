import React from 'react';
import { LiquidGlassCard } from '@/components/ui/liquid-glass';

interface SlitherNavPanelProps {
  onBuilderClick?: () => void;
  onConciergeClick?: () => void;
  idPrefix?: string;
  theme?: 'glass' | 'dark' | 'glass-light';
  /** 'toggle' (default) is the original on/off switch, used where the
   *  lozenge genuinely represents a state (e.g. the Trailer Range page's
   *  future Ultravox assistant). 'button' drops the switch entirely and
   *  makes the whole lozenge a single clickable action -- for the
   *  homepage instance, which now navigates to Trailer Range rather
   *  than toggling anything. */
  variant?: 'toggle' | 'button';
  onClick?: () => void;
}

export const SlitherNavPanel: React.FC<SlitherNavPanelProps> = ({
  idPrefix = 'hero',
  theme = 'glass',
  variant = 'toggle',
  onClick,
}) => {
  const switchId = `${idPrefix}-switch`;
  const isButton = variant === 'button';

  const cardClassName = `w-full h-full px-5 py-2 flex flex-col items-center justify-center gap-1 transition-all text-center ${
    theme === 'dark'
      ? 'bg-zinc-950/90 border border-zinc-800 text-white shadow-[0_14px_38px_rgba(0,0,0,0.22)]'
      : theme === 'glass-light'
      ? 'bg-white/50 border border-black/10 text-zinc-900 backdrop-blur-xl hover:border-black/20 shadow-[0_8px_32px_rgba(15,23,42,0.1)]'
      : 'bg-white/[0.03] border border-white/25 text-white backdrop-blur-[4px] hover:border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
  } ${isButton ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`;

  const card = (
    <LiquidGlassCard
      borderRadius="24px"
      shadowIntensity={theme === 'dark' ? 'md' : theme === 'glass-light' ? 'sm' : 'xs'}
      glowIntensity="none"
      style={{
        fontFamily: 'Verdana, Geneva, sans-serif',
        textAlign: 'center',
        width: '100%',
        height: '100%',
      }}
      className={cardClassName}
    >
      {/* Words: Personal AI Concierge */}
      <div
        style={{ fontSize: '15px', fontFamily: 'Verdana, Geneva, sans-serif' }}
        className={`font-bold tracking-tight text-center select-none whitespace-nowrap leading-tight flex items-center gap-2 ${
          theme === 'glass-light'
            ? 'text-zinc-900'
            : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]'
        }`}
      >
        Personal AI Concierge
        {isButton && (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </div>

      {!isButton && (
        /* Centered on/off switch with accompanying words directly under Personal AI Concierge */
        <div
          className={`checkbox-wrapper-35 flex items-center justify-center ${theme === 'glass-light' ? 'checkbox-wrapper-35--light' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            value="private"
            name={switchId}
            id={switchId}
            type="checkbox"
            className="switch"
          />
          <label htmlFor={switchId} className="flex items-center justify-center m-0 cursor-pointer">
            <span className="switch-x-text" style={{ fontSize: '15px' }}>This is </span>
            <span className="switch-x-toggletext">
              <span className="switch-x-unchecked"><span className="switch-x-hiddenlabel">Unchecked: </span>Off</span>
              <span className="switch-x-checked"><span className="switch-x-hiddenlabel">Checked: </span>On</span>
            </span>
          </label>
        </div>
      )}
    </LiquidGlassCard>
  );

  return (
    <div
      style={{ width: '342px', height: '64.5px' }}
      className="max-w-full mx-auto pointer-events-auto flex justify-center items-center"
    >
      {isButton ? (
        <button
          type="button"
          onClick={onClick}
          aria-label="Personal AI Concierge -- go to Trailer Range"
          className="w-full h-full"
        >
          {card}
        </button>
      ) : (
        card
      )}
    </div>
  );
};

export default SlitherNavPanel;
