import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, Terminal, Cpu, ArrowRight, Lock, User } from 'lucide-react';
import api from '../services/api';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(username, password);
      if (res.status === 'success') {
        onLoginSuccess(res.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    onLoginSuccess({
      id: 1,
      username: 'admin',
      email: 'admin@netassist.local',
      role: 'Lead Network Engineer',
    });
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080d1a] px-4 py-12">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>

      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0f172a]/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-glow-cyan">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            Net<span className="text-cyan-400">Assist</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Network Troubleshooting & Automated Diagnostic Assistant
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300">
            <span>CN • FLAT • FSWD Academic Project</span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Username</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Password</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-glow-cyan hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to NetAssist'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Access Button */}
        <div className="mt-5 border-t border-slate-800 pt-4 text-center">
          <p className="text-[11px] text-slate-400">Academic Evaluation Shortcut:</p>
          <button
            onClick={handleQuickDemo}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2 text-xs font-medium text-cyan-300 hover:bg-slate-800 hover:border-cyan-500/40 transition"
          >
            Launch Instant Demo Session (Admin)
          </button>
        </div>

        {/* Feature Badges */}
        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-4 text-center text-[10px] text-slate-400">
          <div className="flex flex-col items-center gap-1">
            <Terminal size={14} className="text-cyan-400" />
            <span>Real Ping & DNS</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Cpu size={14} className="text-purple-400" />
            <span>FLAT DFA Engine</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>SQLite & Reports</span>
          </div>
        </div>
      </div>
    </div>
  );
}
