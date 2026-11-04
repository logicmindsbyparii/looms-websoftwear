import React from 'react';

export default function StatCard({
  title,
  value,
  unit = '',
  subtitle,
  icon: Icon,
  variant = 'blue',
  trend = null
}) {
  const variantStyles = {
    blue: {
      border: 'border-slate-200/90',
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
      valueColor: 'text-slate-900',
      accentGlow: 'hover:border-sky-300'
    },
    green: {
      border: 'border-slate-200/90',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      valueColor: 'text-emerald-700',
      accentGlow: 'hover:border-emerald-300'
    },
    amber: {
      border: 'border-slate-200/90',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      valueColor: 'text-amber-700',
      accentGlow: 'hover:border-amber-300'
    },
    rose: {
      border: 'border-slate-200/90',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      valueColor: 'text-rose-700',
      accentGlow: 'hover:border-rose-300'
    },
    indigo: {
      border: 'border-slate-200/90',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      valueColor: 'text-indigo-900',
      accentGlow: 'hover:border-indigo-300'
    }
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div className={`heavy-card rounded-2xl p-4 sm:p-5 ${style.border} ${style.accentGlow} relative overflow-hidden group`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            {title}
          </span>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-display ${style.valueColor}`}>
              {value}
            </span>
            {unit && (
              <span className="text-sm font-semibold text-slate-500">
                {unit}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${style.iconBg} shadow-xs group-hover:scale-105 transition-transform`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>{subtitle}</span>
        {trend && (
          <span className={`inline-flex items-center gap-1 font-semibold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.text}
          </span>
        )}
      </div>
    </div>
  );
}

