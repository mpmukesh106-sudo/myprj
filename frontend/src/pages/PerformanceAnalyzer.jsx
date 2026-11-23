import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Gauge,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import LatencyChart from '../charts/LatencyChart';
import PacketLossChart from '../charts/PacketLossChart';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

export default function PerformanceAnalyzer() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [dashRes, histRes] = await Promise.all([
        api.getDashboard(),
        api.getHistory({ limit: 25 })
      ]);
      setStats(dashRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute performance metrics
  const validLatencies = history.filter((h) => h.latency > 0).map((h) => h.latency);
  const avgLatency = validLatencies.length > 0
    ? round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length, 1)
    : 0;

  // Jitter estimation (mean deviation between consecutive packets)
  let jitter = 0;
  if (validLatencies.length > 1) {
    let diffSum = 0;
    for (let i = 1; i < validLatencies.length; i++) {
      diffSum += Math.abs(validLatencies[i] - validLatencies[i - 1]);
    }
    jitter = round(diffSum / (validLatencies.length - 1), 2);
  }

  // Availability rating
  const successCount = history.filter((h) => h.status === 'SUCCESS').length;
  const totalCount = history.length;
  const availabilityPct = totalCount > 0 ? round((successCount / totalCount) * 100, 1) : 100;

  function round(val, dec) {
    return Number(Math.round(val + 'e' + dec) + 'e-' + dec);
  }

  // Health Rating: Green, Yellow, Red
  let healthColor = 'text-emerald-400';
  let healthBg = 'bg-emerald-500/10 border-emerald-500/30';
  let healthLabel = 'Good (Optimal Link)';
  if (availabilityPct < 70 || avgLatency > 120) {
    healthColor = 'text-rose-400';
    healthBg = 'bg-rose-500/10 border-rose-500/30';
    healthLabel = 'Poor (Severe Impairment)';
  } else if (availabilityPct < 90 || avgLatency > 60) {
    healthColor = 'text-amber-400';
    healthBg = 'bg-amber-500/10 border-amber-500/30';
    healthLabel = 'Moderate (Minor Degradation)';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <BarChart3 size={15} />
            <span>Network Performance & Telemetry Engine</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Performance & Latency Analyzer
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Statistical distribution of packet loss, round-trip times (RTT), and transmission jitter.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition self-start"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* SLA & Health Status Indicators */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
        {/* Availability Rating */}
        <div className={`rounded-xl border p-5 backdrop-blur-md ${healthBg}`}>
          <div className="flex items-center justify-between text-slate-400 font-sans">
            <span>Network Availability</span>
            <Activity size={18} className={healthColor} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${healthColor}`}>{availabilityPct}%</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-sans">SLA Status: {healthLabel}</p>
        </div>

        {/* Average Latency */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 font-sans">
            <span>Mean Latency (RTT)</span>
            <Clock size={18} className="text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{avgLatency} ms</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-sans">Threshold: &lt; 50ms (Optimal)</p>
        </div>

        {/* Jitter */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 font-sans">
            <span>Latency Variance (Jitter)</span>
            <TrendingUp size={18} className="text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-300">{jitter} ms</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-sans">Packet delay variation</p>
        </div>

        {/* Quality Rating */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 font-sans">
            <span>Overall Link Grade</span>
            <Gauge size={18} className="text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${healthColor}`}>
              {availabilityPct >= 90 ? 'Grade A' : availabilityPct >= 70 ? 'Grade B' : 'Grade C'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-sans">Based on packet delivery %</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Latency Trends */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-400" />
              <span>Ping Response Time Over Time</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">Chart.js Engine</span>
          </div>
          <LatencyChart data={stats?.latency_trend || []} />
        </div>

        {/* Packet Loss Chart */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-400" />
              <span>Packet Loss Percentage By Probe</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">Packets Dropped (%)</span>
          </div>
          <PacketLossChart data={history} />
        </div>
      </div>

      {/* Health Band Indicator */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md text-xs">
        <h3 className="font-bold text-white uppercase tracking-wider mb-3">
          Network Performance Standard Bands (RFC 2544 Benchmarks)
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <span>Green: Good (Optimal)</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Latency &lt; 50ms, 0% Packet Loss, Jitter &lt; 5ms. Suitable for real-time VoIP and video streams.
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
              <span>Yellow: Moderate</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Latency 50ms – 120ms, Packet Loss &lt; 5%. Tolerable for standard web browsing and downloads.
            </p>
          </div>

          <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400"></span>
              <span>Red: Poor (Impaired)</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Latency &gt; 120ms, Packet Loss &gt; 5%, or Host Unreachable. Immediate troubleshooting required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
