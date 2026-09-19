import React from 'react';

interface VerilanceLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'cyan' | 'white' | 'mono';
  showBadge?: boolean;
  className?: string;
}

export const VerilanceLogo: React.FC<VerilanceLogoProps> = ({
  size = 'md',
  showText = true,
  variant = 'cyan',
  showBadge = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-sm tracking-[0.24em]',
    md: 'text-lg sm:text-xl tracking-[0.26em]',
    lg: 'text-2xl tracking-[0.3em]',
    xl: 'text-3xl tracking-[0.32em]',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Geometric VERILANCE Monogram Emblem (Exact Vector from Reference) */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center group`}>
        {/* Soft atmospheric ambient glow */}
        {variant === 'cyan' && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/25 via-teal-400/20 to-emerald-400/25 blur-lg group-hover:blur-xl transition-all duration-300" />
        )}

        {/* Crisp Geometric SVG Icon matching exact geometry from user image */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full drop-shadow-[0_2px_12px_rgba(6,182,212,0.45)]"
        >
          <defs>
            <linearGradient id="verilance-emblem-grad" x1="22" y1="15" x2="87" y2="78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="verilance-white-grad" x1="22" y1="15" x2="87" y2="78" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

          {/* Left Vertical Sheared Pillar (Beveled Parallel 45° Cuts) */}
          <polygon
            points="22,66 22,26 33,15 33,55"
            fill={variant === 'mono' ? '#0a0e17' : variant === 'white' ? 'url(#verilance-white-grad)' : 'url(#verilance-emblem-grad)'}
            className="transition-all duration-300 group-hover:brightness-110"
          />

          {/* Precision Angular Chevron & Base (Parallel 45° Dual-Terminus) */}
          <polygon
            points="22,78 78,22 87,22 40,69 87,69 78,78"
            fill={variant === 'mono' ? '#0a0e17' : variant === 'white' ? 'url(#verilance-white-grad)' : 'url(#verilance-emblem-grad)'}
            className="transition-all duration-300 group-hover:brightness-110"
          />
        </svg>

        {/* Live Escrow Protection Ping Dot */}
        {variant === 'cyan' && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
          </span>
        )}
      </div>

      {/* Official Typography: VERILΛNCE with Chevron 'Λ' */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span className={`${textSizes[size]} font-black text-white font-['Space_Grotesk'] flex items-center`}>
              <span>VERIL</span>
              <span className="text-cyan-400 inline-block mx-[0.04em] scale-y-95">Λ</span>
              <span>NCE</span>
            </span>

            {showBadge && (
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-extrabold hidden sm:inline-block">
                ESCROW
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-wider text-slate-400 font-medium hidden sm:block mt-0.5">
            Anti-Screen Capture • View Once Media
          </span>
        </div>
      )}
    </div>
  );
};
