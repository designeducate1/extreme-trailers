import React from 'react';
import { LiquidGlassCard } from '@/components/ui/liquid-glass';
import './SlitherNavPanel.css';

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
  /** Button-variant label text. Defaults to the original copy so the
   *  'toggle' variant (and any future caller that doesn't pass one) is
   *  unaffected. */
  label?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  /** 'glass' (default) is the original LiquidGlassCard look. 'expand'
   *  is the Uiverse-ported circular icon button that expands into a
   *  pill on hover, revealing its label -- only meaningful when
   *  variant="button"; ignored for the toggle, which always keeps its
   *  glass look. */
  chrome?: 'glass' | 'expand';
  /** chrome="expand" only: the revealed (hover) width in px. width/
   *  height double as the resting circle's diameter for this chrome. */
  expandedWidth?: number;
}

export const SlitherNavPanel: React.FC<SlitherNavPanelProps> = ({
  idPrefix = 'hero',
  theme = 'glass',
  variant = 'toggle',
  onClick,
  label = 'Personal AI Concierge',
  width = 342,
  height = 64.5,
  fontSize = 15,
  chrome = 'glass',
  expandedWidth = 340,
}) => {
  const switchId = `${idPrefix}-switch`;
  const isButton = variant === 'button';
  const iconSize = Math.round((fontSize / 15) * 14);
  const isExpandChrome = isButton && chrome === 'expand';

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
      {/* Button-variant label (or original toggle label) */}
      <div
        style={{ fontSize: `${fontSize}px`, fontFamily: 'Verdana, Geneva, sans-serif' }}
        className={`font-bold tracking-tight text-center select-none whitespace-nowrap leading-tight flex items-center gap-2 ${
          theme === 'glass-light'
            ? 'text-zinc-900'
            : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]'
        }`}
      >
        {label}
        {isButton && (
          <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      style={{ width: `${width}px`, height: `${height}px` }}
      className="max-w-full mx-auto pointer-events-auto flex justify-center items-center"
    >
      {isExpandChrome ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={`${label} -- go to Trailer Range`}
          className="brand-fab-btn"
          style={
            {
              '--fab-color': '#062e69',
              '--fab-size': `${height}px`,
              '--fab-icon-size': `${iconSize}px`,
              '--fab-hover-width': `${expandedWidth}px`,
              '--fab-hover-radius': `${height / 2}px`,
              fontFamily: 'Verdana, Geneva, sans-serif',
              fontSize: `${fontSize}px`,
            } as React.CSSProperties
          }
        >
          <span className="brand-fab-btn__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
            </svg>
          </span>
          <span className="brand-fab-btn__text">{label}</span>
        </button>
      ) : isButton ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={`${label} -- go to Trailer Range`}
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
