import React from 'react';

export default function StatusBadge({ status, text, size = 'sm' }) {
  const normalized = (status || '').toUpperCase();
  
  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotClass = 'bg-slate-400';

  if (normalized === 'SUCCESS' || normalized === 'ONLINE' || normalized === 'HEALTHY' || normalized === 'ACCEPTED') {
    colorClasses = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
    dotClass = 'bg-emerald-400 animate-pulse';
  } else if (normalized === 'FAILED' || normalized === 'OFFLINE' || normalized === 'CRITICAL' || normalized === 'REJECTED') {
    colorClasses = 'bg-rose-950/60 text-rose-300 border-rose-500/30';
    dotClass = 'bg-rose-500';
  } else if (normalized === 'WARNING' || normalized === 'DEGRADED' || normalized === 'PARTIAL') {
    colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-500/30';
    dotClass = 'bg-amber-400';
  } else if (normalized === 'RUNNING' || normalized === 'INFO') {
    colorClasses = 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30';
    dotClass = 'bg-cyan-400 animate-ping';
  }

  const sizeClasses = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs md:text-sm font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses}`}>
      <span className={`w-2 h-2 rounded-full ${dotClass}`}></span>
      <span>{text || status}</span>
    </span>
  );
}
