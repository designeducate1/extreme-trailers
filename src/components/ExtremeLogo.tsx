import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'hero';
}

export const ExtremeLogo: React.FC<LogoProps> = ({
  className = 'w-full max-w-2xl',
  variant = 'hero',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 780 200"
        className="w-full h-auto drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] filter"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="skewX(-13) translate(25, 10)">
          {/* Deep navy backplate angled banner */}
          <path
            d="M15 15L740 15L700 135L0 135Z"
            fill="#06224c"
            stroke="#2563eb"
            strokeWidth="4"
            opacity="0.95"
          />
          <path
            d="M20 20L735 20L698 130L5 130Z"
            stroke="#ffffff"
            strokeWidth="2.5"
            opacity="0.85"
          />

          {/* Base EXTREME wordmark */}
          <text
            x="35"
            y="112"
            fontFamily="'Arial Black', Impact, 'PP Neue Corp Wide', sans-serif"
            fontWeight="900"
            fontSize="125"
            fill="#ffffff"
            letterSpacing="-4"
          >
            E<tspan fill="transparent">__</tspan>TREME
          </text>

          {/* Signature Dynamic Slanted Cut 'X' */}
          <g transform="translate(45, 0)">
            <path
              d="M95 10L165 10L208 68L252 10L322 10L245 102L328 140L258 140L205 108L148 140L78 140L162 94Z"
              fill="#ffffff"
              stroke="#06224c"
              strokeWidth="10"
              strokeLinejoin="miter"
            />
            <path
              d="M95 10L165 10L208 68L252 10L322 10L245 102L328 140L258 140L205 108L148 140L78 140L162 94Z"
              fill="#ffffff"
            />
          </g>

          {/* MARINE tracked descriptor */}
          <text
            x="360"
            y="172"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="40"
            fill="#ffffff"
            letterSpacing="18"
            fontStyle="italic"
          >
            MARINE
          </text>
        </g>
      </svg>
    </div>
  );
};
