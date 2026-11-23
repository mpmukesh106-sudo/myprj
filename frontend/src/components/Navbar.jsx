import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Shield, LogOut, Play, RefreshCw, Cpu, Server } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function Navbar({ networkStatus, onRefresh, isRunningDiag, user, onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#080d1a]/90 px-4 md:px-6 backdrop-blur-md">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-glow-cyan">
          <Activity className="h-5 w-5 text-white animate-cyber-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-white md:text-lg">
              Net<span className="text-cyan-400">Assist</span>
            </span>
            <span className="hidden rounded bg-blue-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300 border border-blue-500/30 sm:inline-block">
              v2.0 (CN + FLAT)
            </span>
          </div>
          <p className="hidden text-[11px] text-slate-400 sm:block">
            Network Troubleshooting & Diagnostic Assistant
          </p>
        </div>
      </div>

      {/* Right controls: Live Status, Quick Diagnostic Trigger, User profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Network Status indicator */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-xs text-slate-400">Link Status:</span>
          <StatusBadge status={networkStatus || 'ONLINE'} size="xs" />
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh network metrics"
            className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:border-slate-500 hover:text-white transition"
          >
            <RefreshCw size={16} />
          </button>
        )}

        {/* Run Auto Diagnosis shortcut button */}
        <button
          onClick={() => navigate('/troubleshooting')}
          disabled={isRunningDiag}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs md:text-sm font-semibold text-white shadow-glow-cyan hover:opacity-95 transition disabled:opacity-50"
        >
          {isRunningDiag ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" />
              <span className="hidden md:inline">Run Auto Diagnosis</span>
              <span className="md:hidden">Diagnose</span>
            </>
          )}
        </button>

        {/* User Badge / Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="hidden flex-col text-right sm:flex">
            <span className="text-xs font-medium text-slate-200">{user?.username || 'admin'}</span>
            <span className="text-[10px] text-cyan-400">{user?.role || 'Network Admin'}</span>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="rounded-lg border border-slate-700 bg-slate-800/80 p-2 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
