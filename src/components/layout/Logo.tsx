import React from 'react';

export const TradePilotLogo: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981] to-[#0D9488] text-white shadow-md shadow-[#10B981]/25">
        <svg
          viewBox="0 0 36 36"
          fill="none"
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Candlestick / Options Payoff Bars */}
          <rect
            x="5"
            y="19"
            width="3.5"
            height="10"
            rx="1"
            fill="#FFFFFF"
            fillOpacity="0.45"
          />
          <rect
            x="11.5"
            y="14"
            width="3.5"
            height="15"
            rx="1"
            fill="#FFFFFF"
            fillOpacity="0.7"
          />
          <rect
            x="18"
            y="10"
            width="3.5"
            height="19"
            rx="1"
            fill="#FFFFFF"
            fillOpacity="0.9"
          />
          {/* Dynamic Ascending Trajectory Arrow */}
          <path
            d="M4 24L12 16.5L18.5 19.5L30 7.5"
            stroke="#FFFFFF"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M23.5 7.5H30V14"
            stroke="#FFFFFF"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {!compact && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-white">
              Trade<span className="text-[#26D6A0]">Pilot</span>
            </span>
            <span className="rounded-md bg-[#26D6A0]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#26D6A0] border border-[#26D6A0]/30">
              SPX 0DTE
            </span>
          </div>
          <span className="text-xs font-medium text-[#9BAFC4]">
            Trade Smarter. Measure Everything.
          </span>
        </div>
      )}
    </div>
  );
};
