import React, { memo } from 'react';

function LoomVisual({ status = 'running', rpm = 850, compact = false }) {
  const isRunning = status === 'running';
  const isIdle = status === 'idle';
  const isStopped = status === 'stopped';
  const isMaint = status === 'maintenance';

  // Determine accent color
  const statusColor = isRunning ? '#10b981' : isIdle ? '#f59e0b' : isMaint ? '#6366f1' : '#ef4444';
  const shuttleColor = isRunning ? '#0284c7' : isIdle ? '#f59e0b' : '#64748b';

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-slate-100/80 border border-slate-200/60 ${compact ? 'h-14 w-full' : 'h-24 w-full'}`}>
      <svg
        viewBox="0 0 100 60"
        className="h-full w-full max-w-[140px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Loom Outer Metal Frame */}
        <rect
          x="4"
          y="6"
          width="92"
          height="48"
          rx="4"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {/* Warp Roll / Cloth Beam Rollers */}
        <line x1="8" y1="12" x2="8" y2="48" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
        <line x1="92" y1="12" x2="92" y2="48" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />

        {/* Warp Threads (Tension Lines) */}
        <g opacity={isRunning ? 0.9 : 0.45}>
          {[18, 26, 34, 42, 50, 58, 66, 74, 82].map((x) => (
            <line
              key={x}
              x1={x}
              y1="14"
              x2={x}
              y2="46"
              stroke={isRunning ? '#38bdf8' : '#cbd5e1'}
              strokeWidth="1.2"
              strokeDasharray={isRunning ? '3,2' : 'none'}
            />
          ))}
        </g>

        {/* Reed / Beat Bar Guide */}
        <line
          x1="12"
          y1="30"
          x2="88"
          y2="30"
          stroke="#475569"
          strokeWidth="1.5"
          opacity={0.6}
        />

        {/* All running looms move 100% in sync in the exact same direction without sticking to edges */}
        <g
          className={
            isRunning
              ? 'animate-shuttle-fast'
              : isIdle
              ? 'animate-shuttle-slow'
              : ''
          }
          style={{ willChange: 'transform' }}
        >
          {/* Aerodynamic drop shadow */}
          <ellipse
            cx="50"
            cy="34"
            rx="10"
            ry="1.5"
            fill="rgba(0,0,0,0.12)"
          />

          {/* Symmetrical Central Shuttle Body */}
          <rect
            x="42"
            y="26.5"
            width="16"
            height="7"
            rx="2"
            fill={shuttleColor}
          />

          {/* Left Tapered Nose */}
          <polygon
            points="42,26.5 36,30 42,33.5"
            fill={shuttleColor}
          />

          {/* Right Tapered Nose */}
          <polygon
            points="58,26.5 64,30 58,33.5"
            fill={shuttleColor}
          />

          {/* Center Weft Thread Eyelet */}
          <circle cx="50" cy="30" r="1.5" fill="#ffffff" />
          <circle cx="50" cy="30" r="0.6" fill={shuttleColor} />
        </g>

        {/* Status indicator dot inside frame */}
        <circle
          cx="12"
          cy="14"
          r="2.5"
          fill={statusColor}
        />
      </svg>

      {/* Speed badge overlay */}
      {isRunning && (
        <span className="absolute bottom-1 right-2 text-[10px] font-mono font-semibold text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
          {rpm} RPM
        </span>
      )}
    </div>
  );
}

export default memo(LoomVisual);
