import React, { memo } from 'react';

// Symmetrical, GPU-accelerated shuttle projectile memoized strictly to prevent telemetry restarts
const SynchronizedShuttle = memo(function SynchronizedShuttle({ isRunning, isIdle, shuttleColor }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className={`flex items-center justify-center ${
          isRunning
            ? 'animate-sync-shuttle'
            : isIdle
            ? 'animate-sync-shuttle-slow'
            : ''
        }`}
      >
        <svg width="34" height="14" viewBox="0 0 34 14" className="drop-shadow-xs">
          {/* Symmetrical aerodynamic shuttle body */}
          <rect x="7" y="2" width="20" height="10" rx="3" fill={shuttleColor} />
          {/* Left tapered nose */}
          <polygon points="7,2 0,7 7,12" fill={shuttleColor} />
          {/* Right tapered nose */}
          <polygon points="27,2 34,7 27,12" fill={shuttleColor} />
          {/* Center weft thread eyelet */}
          <circle cx="17" cy="7" r="2" fill="#ffffff" />
          <circle cx="17" cy="7" r="1" fill={shuttleColor} />
        </svg>
      </div>
    </div>
  );
});

function LoomVisual({ status = 'running', rpm = 850, compact = false }) {
  const isRunning = status === 'running';
  const isIdle = status === 'idle';
  const isStopped = status === 'stopped';
  const isMaint = status === 'maintenance';

  // Accent colors
  const statusColor = isRunning ? '#10b981' : isIdle ? '#f59e0b' : isMaint ? '#6366f1' : '#ef4444';
  const shuttleColor = isRunning ? '#0284c7' : isIdle ? '#f59e0b' : '#64748b';

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-slate-100/80 border border-slate-200/60 select-none ${compact ? 'h-14 w-full' : 'h-24 w-full'}`}>
      {/* 1. Static Loom Background SVG (Rendered once, 0% CPU overhead, GPU cached) */}
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

        {/* Status indicator dot inside frame */}
        <circle
          cx="12"
          cy="14"
          r="2.5"
          fill={statusColor}
        />
      </svg>

      {/* 2. Isolated Hardware-Accelerated Shuttle Layer: 100% In-Sync Across All Rows */}
      <SynchronizedShuttle
        isRunning={isRunning}
        isIdle={isIdle}
        shuttleColor={shuttleColor}
      />

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
