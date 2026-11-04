import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useApp();

  if (!toast.show) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-200 bg-white/95 text-slate-800 shadow-emerald-500/10',
    warning: 'border-amber-200 bg-white/95 text-slate-800 shadow-amber-500/10',
    error: 'border-rose-300 bg-rose-50/95 text-rose-950 shadow-rose-500/20',
    info: 'border-sky-200 bg-white/95 text-slate-800 shadow-sky-500/10'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md max-w-md ${borders[toast.type] || borders.info}`}>
        {icons[toast.type] || icons.info}
        <p className="text-sm font-semibold tracking-tight">{toast.message}</p>
      </div>
    </div>
  );
}

