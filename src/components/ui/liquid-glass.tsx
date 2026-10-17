import React from 'react';

export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  shadowIntensity?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  glowIntensity?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  borderRadius?: string;
  style?: React.CSSProperties;
}

const shadowMap: Record<string, string> = {
  none: 'shadow-none',
  xs: 'shadow-[0_4px_24px_-2px_rgba(0,0,0,0.35)]',
  sm: 'shadow-[0_8px_30px_rgba(0,0,0,0.45)]',
  md: 'shadow-[0_14px_40px_rgba(0,0,0,0.55)]',
  lg: 'shadow-[0_20px_50px_rgba(0,0,0,0.65)]',
  xl: 'shadow-[0_28px_65px_rgba(0,0,0,0.75)]',
};

const glowMap: Record<string, string> = {
  none: '',
  xs: 'shadow-[0_0_15px_rgba(255,255,255,0.12)]',
  sm: 'shadow-[0_0_25px_rgba(255,255,255,0.22)]',
  md: 'shadow-[0_0_35px_rgba(255,255,255,0.35)]',
  lg: 'shadow-[0_0_50px_rgba(255,255,255,0.5)]',
};

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  shadowIntensity = 'xs',
  glowIntensity = 'none',
  borderRadius = '16px',
  style,
  ...props
}) => {
  const shadowClass = shadowMap[shadowIntensity] || shadowMap.xs;
  const glowClass = glowMap[glowIntensity] || '';

  return (
    <div
      {...props}
      style={{
        borderRadius,
        ...style,
      }}
      className={`relative overflow-hidden backdrop-blur-[4px] bg-white/[0.02] border border-white/20 transition-all duration-300 ${shadowClass} ${glowClass} ${className}`}
    >
      {/* Specular Top Reflection / Liquid Light Sheen */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-25"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.03) 25%, transparent 60%)',
          borderRadius,
        }}
      />
      {/* Refraction Bottom Highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 z-10 opacity-15"
        style={{
          background:
            'linear-gradient(to top, rgba(255,255,255,0.08) 0%, transparent 100%)',
          borderRadius,
        }}
      />
      <div className="relative z-20 h-full w-full">{children}</div>
    </div>
  );
};

export default LiquidGlassCard;
