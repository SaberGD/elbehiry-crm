import React from 'react';

interface ElBeheryLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  onClick?: () => void;
}

export const ElBeheryLogo: React.FC<ElBeheryLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  onClick,
}) => {
  const dimensions = {
    sm: 'w-8 h-8 text-[9px]',
    md: 'w-10 h-10 text-[11px]',
    lg: 'w-12 h-12 text-[13px]',
    xl: 'w-16 h-16 text-[17px]',
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
    >
      {/* Official ElBehery Paints & Decor Emblem matching uploaded reference */}
      <div
        className={`${dimensions[size]} shrink-0 rounded-[28%] overflow-hidden bg-[#0a0a0c] relative flex shadow-md border border-white/10 group transition-transform active:scale-95`}
        style={{ aspectRatio: '1/1' }}
      >
        {/* Left Half - Vibrant Red */}
        <div className="w-1/2 h-full bg-[#e51d24] relative">
          {/* Top-Left Light Reflection Accent */}
          <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/35 rounded-full blur-[0.2px]" />
        </div>

        {/* Right Half - Deep Black */}
        <div className="w-1/2 h-full bg-[#0b0b0d] relative" />

        {/* Crisp Center Text Overlay */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white font-bold leading-tight px-1 py-0.5 dir-rtl pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {/* Brand Name "البحيري" */}
          <span
            className="font-black tracking-tight text-white font-sans leading-none"
            style={{ fontSize: '115%', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
          >
            البحيري
          </span>

          {/* Subtext Line 1: "للدهانات" */}
          <span
            className="font-bold tracking-tighter text-white/95 leading-none mt-[2px]"
            style={{ fontSize: '46%' }}
          >
            للدهانات
          </span>

          {/* Subtext Line 2: "والديكور .." */}
          <span
            className="font-bold tracking-tighter text-white/90 leading-none mt-[1.5px]"
            style={{ fontSize: '42%' }}
          >
            والديكور ..
          </span>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-right transition-opacity duration-200">
          <div className="flex items-center gap-1.5 leading-tight dir-rtl">
            <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight font-sans">
              البحيري <span className="text-[#e51d24] font-black">CRM</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#e51d24]/10 border border-[#e51d24]/30 text-[#e51d24] dark:text-[#ff4d4d] text-[10px] font-extrabold font-mono tracking-wider">
              رسمي
            </span>
          </div>
          <span className="text-[10.5px] font-bold text-slate-500 dark:text-[#a0a6b2] tracking-wider font-sans">
            للدهانات والديكور ..
          </span>
        </div>
      )}
    </div>
  );
};
