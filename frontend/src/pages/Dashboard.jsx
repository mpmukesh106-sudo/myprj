import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  Server,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Terminal,
  Cpu,
  Layers
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LatencyChart from '../charts/LatencyChart';
import TestDistributionChart from '../charts/TestDistributionChart';
import Modal from '../components/Modal';
import api from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [ipInfo, setIpInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, ipRes] = await Promise.all([
        api.getDashboard(),
        api.getIpDetails()
      ]);
      setStats(dashRes.data);
      setIpInfo(ipRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Fetching real-time network telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Network Operations Dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time telemetry, automated problem correlation, and automata-based diagnostic recognition.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </button>
          <button
            onClick={() => navigate('/diagnostics')}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-glow-cyan hover:opacity-95 transition"
          >
            <Terminal size={14} />
            <span>Launch Tests</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Diagnostics"
          value={stats?.total_tests || 0}
          subtext="Executed tests recorded in SQLite"
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Successful Tests"
          value={stats?.successful_connections || 0}
          subtext={`${stats?.success_rate || 0}% overall reachability rate`}
          icon={CheckCircle}
          color="emerald"
          badge={`${stats?.success_rate || 0}%`}
        />
        <StatCard
          title="Failed / Impaired"
          value={stats?.failed_connections || 0}
          subtext="Dropouts, timeouts & DNS errors"
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="Average Latency"
          value={`${stats?.average_latency_ms || 0} ms`}
          subtext={`Current link status: ${stats?.network_status || 'Online'}`}
          icon={Clock}
          color="cyan"
          badge={stats?.network_status}
        />
      </div>

      {/* Network Interface & Layer 3 Info Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Local Interface & Routing Parameters (CN Layer 3)
            </h2>
          </div>
          <StatusBadge status={ipInfo?.adapter_status?.includes('Warning') ? 'WARNING' : 'ONLINE'} text={ipInfo?.adapter_status || 'Active'} size="xs" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 text-xs font-mono">
          <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
            <span className="text-[11px] font-medium text-slate-400 block font-sans">Local IPv4 Address</span>
            <span className="mt-1 text-sm font-bold text-cyan-300 block">{ipInfo?.local_ip || 'Detecting...'}</span>
            <span className="text-[10px] text-slate-500 font-sans">Host: {ipInfo?.hostname}</span>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
            <span className="text-[11px] font-medium text-slate-400 block font-sans">Default Gateway</span>
            <span className="mt-1 text-sm font-bold text-slate-200 block">{ipInfo?.gateway_ip || '192.168.1.1'}</span>
            <span className="text-[10px] text-emerald-400 font-sans">
              {ipInfo?.gateway_detected ? '✓ Subnet Gateway Active' : 'Fallback Route'}
            </span>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
            <span className="text-[11px] font-medium text-slate-400 block font-sans">Public WAN IP</span>
            <span className="mt-1 text-sm font-bold text-blue-300 block truncate" title={ipInfo?.public_ip}>
              {ipInfo?.public_ip || 'Resolving...'}
            </span>
            <span className="text-[10px] text-slate-500 font-sans">External Service Route</span>
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
            <span className="text-[11px] font-medium text-slate-400 block font-sans">Operating Platform</span>
            <span className="mt-1 text-sm font-bold text-purple-300 block truncate">{ipInfo?.os || 'System Host'}</span>
            <span className="text-[10px] text-slate-500 font-sans">Kernel Diagnostic APIs</span>
          </div>
        </div>
      </div>

      {/* Performance Visualizations Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Latency Trend Line Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-cyan-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Network Latency Progression (ms)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Last 15 Probes</span>
          </div>
          <LatencyChart data={stats?.latency_trend || []} />
        </div>

        {/* Diagnostic Distribution Doughnut Chart */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers size={18} className="text-purple-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Test Protocol Distribution
              </h2>
            </div>
            <TestDistributionChart distribution={stats?.type_distribution || {}} />
          </div>
          <div className="mt-4 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400 flex justify-between">
            <span>FLAT DFA Classifier: <span className="text-purple-400 font-semibold">Active</span></span>
            <span>Database: <span className="text-emerald-400 font-semibold">SQLite3</span></span>
          </div>
        </div>
      </div>

      {/* Recent Diagnostic Activities Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Recent Diagnostic Executions
            </h2>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
          >
            <span>View Full History</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-800 bg-slate-900/60 font-sans text-[11px] text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Test ID</th>
                <th className="py-2.5 px-3">Protocol / Type</th>
                <th className="py-2.5 px-3">Target Host</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Packet Loss</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {stats?.recent_activities?.length > 0 ? (
                stats.recent_activities.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-400">#{item.id}</td>
                    <td className="py-2.5 px-3">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-slate-700">
                        {item.test_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">{item.target}</td>
                    <td className="py-2.5 px-3">{item.latency > 0 ? `${item.latency} ms` : '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={item.packet_loss > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {item.packet_loss}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={item.status} size="xs" />
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">{item.timestamp}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-500 font-sans">
                    No diagnostic records found. Run a test to begin recording metrics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Preview Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Diagnostic Record #${selectedRecord?.id} – ${selectedRecord?.test_type}`}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-400 block font-sans">Target:</span>
                <span className="font-bold text-white text-sm">{selectedRecord.target}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-400 block font-sans">Result Status:</span>
                <StatusBadge status={selectedRecord.status} size="sm" />
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-400 block font-sans">Recorded Latency:</span>
                <span className="font-bold text-cyan-400 text-sm">{selectedRecord.latency} ms</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-400 block font-sans">Packet Loss:</span>
                <span className="font-bold text-rose-400 text-sm">{selectedRecord.packet_loss}%</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  navigate(`/reports`);
                }}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition"
              >
                Go to Reports & Download PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
