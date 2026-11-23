import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'blue', badge }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      glow: 'hover:border-blue-500/40',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      glow: 'hover:border-cyan-500/40',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'hover:border-emerald-500/40',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      glow: 'hover:border-rose-500/40',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: 'hover:border-amber-500/40',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className={`rounded-xl border ${scheme.border} bg-[#0f172a]/80 p-5 backdrop-blur-md transition-all duration-300 ${scheme.glow} hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`rounded-lg p-2 ${scheme.bg} ${scheme.text}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white md:text-3xl font-mono">{value}</span>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {badge}
          </span>
        )}
      </div>
      {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
    </div>
  );
}
