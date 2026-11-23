import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Wrench,
  Cpu,
  BarChart3,
  History,
  FileText,
  BookOpen,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Network Diagnostics', path: '/diagnostics', icon: Network, badge: 'CN' },
  { name: 'Automated Troubleshooting', path: '/troubleshooting', icon: Wrench, badge: 'Auto' },
  { name: 'FLAT – DFA Simulator', path: '/automata', icon: Cpu, badge: 'FLAT' },
  { name: 'Performance Analyzer', path: '/performance', icon: BarChart3 },
  { name: 'Diagnostic History', path: '/history', icon: History },
  { name: 'Reports & Export', path: '/reports', icon: FileText },
  { name: 'Academic Concepts', path: '/about', icon: BookOpen, badge: 'Theory' },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-slate-800 bg-[#0b132b]/95 p-4 lg:flex justify-between">
      <div>
        {/* Navigation Section */}
        <div className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Core Modules
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-glow-cyan'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={isActive ? 'text-cyan-400' : 'text-slate-400'}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          item.badge === 'FLAT'
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30'
                            : item.badge === 'CN'
                            ? 'bg-blue-900/60 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Academic Integration Footer Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <Layers size={14} className="text-cyan-400" />
          <span>Curriculum Triad</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
          Integrating Computer Networks (L1-L7), Formal Automata (DFA $M$), and Modern Full Stack Architecture.
        </p>
        <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            REST API Active
          </span>
          <span>Port 8000</span>
        </div>
      </div>
    </aside>
  );
}
