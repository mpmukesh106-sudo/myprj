import React, { useState } from 'react';
import {
  Terminal,
  Globe,
  Network,
  Cpu,
  Route,
  Activity,
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

export default function Diagnostics() {
  const [activeTab, setActiveTab] = useState('ping');

  // Ping State
  const [pingTarget, setPingTarget] = useState('8.8.8.8');
  const [pingCount, setPingCount] = useState(4);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  // DNS State
  const [dnsHost, setDnsHost] = useState('google.com');
  const [dnsLoading, setDnsLoading] = useState(false);
  const [dnsResult, setDnsResult] = useState(null);

  // Traceroute State
  const [traceTarget, setTraceTarget] = useState('8.8.8.8');
  const [traceHops, setTraceHops] = useState(12);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceResult, setTraceResult] = useState(null);

  // Live Gateway & Connectivity Test State
  const [connLoading, setConnLoading] = useState(false);
  const [connResult, setConnResult] = useState(null);

  // Handlers
  const handleRunPing = async (e) => {
    e.preventDefault();
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await api.ping(pingTarget, pingCount);
      setPingResult(res.data);
    } catch (err) {
      setPingResult({
        status: 'FAILED',
        target: pingTarget,
        error_message: err.message,
        packet_loss: 100,
        avg_latency_ms: 0,
      });
    } finally {
      setPingLoading(false);
    }
  };

  const handleRunDNS = async (e) => {
    e.preventDefault();
    setDnsLoading(true);
    setDnsResult(null);
    try {
      const res = await api.dns(dnsHost);
      setDnsResult(res.data);
    } catch (err) {
      setDnsResult({
        status: 'FAILED',
        query: dnsHost,
        error: err.message,
        resolved_ips: [],
      });
    } finally {
      setDnsLoading(false);
    }
  };

  const handleRunTraceroute = async (e) => {
    e.preventDefault();
    setTraceLoading(true);
    setTraceResult(null);
    try {
      const res = await api.traceroute(traceTarget, traceHops);
      setTraceResult(res.data);
    } catch (err) {
      setTraceResult({
        status: 'FAILED',
        target: traceTarget,
        error: err.message,
        hops: [],
      });
    } finally {
      setTraceLoading(false);
    }
  };

  const handleCheckConnectivity = async () => {
    setConnLoading(true);
    setConnResult(null);
    try {
      const res = await api.getNetworkStatus();
      setConnResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setConnLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
          <Network size={15} />
          <span>Computer Networks (CN) Diagnostics Console</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          Network Connectivity & Protocol Testing
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Direct execution of ICMP echo probes, DNS resolver lookups, and hop-by-hop traceroute paths on the host kernel.
        </p>
      </div>

      {/* Protocol Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ping')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'ping'
              ? 'bg-blue-600 text-white shadow-glow-blue'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity size={15} />
          <span>ICMP Ping Test</span>
        </button>

        <button
          onClick={() => setActiveTab('dns')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'dns'
              ? 'bg-cyan-600 text-white shadow-glow-cyan'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Globe size={15} />
          <span>DNS Name Resolution</span>
        </button>

        <button
          onClick={() => setActiveTab('traceroute')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'traceroute'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Route size={15} />
          <span>Path Traceroute</span>
        </button>

        <button
          onClick={() => setActiveTab('connectivity')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === 'connectivity'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers size={15} />
          <span>Gateway & Routing Check</span>
        </button>
      </div>

      {/* TAB 1: PING TESTING */}
      {activeTab === 'ping' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Controls Form */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Activity size={16} className="text-blue-400" />
              Configure Ping Diagnostic
            </h2>
            <form onSubmit={handleRunPing} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Host / IP Address</label>
                <input
                  type="text"
                  value={pingTarget}
                  onChange={(e) => setPingTarget(e.target.value)}
                  required
                  placeholder="8.8.8.8 or google.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Echo Packets Count (1 - 10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={pingCount}
                  onChange={(e) => setPingCount(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Preset Shortcuts */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Common Targets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['8.8.8.8', '1.1.1.1', 'google.com', '127.0.0.1'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPingTarget(preset)}
                      className="rounded bg-slate-800 px-2 py-1 text-[10px] font-mono text-cyan-300 hover:bg-slate-700 transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={pingLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-glow-blue hover:opacity-95 transition disabled:opacity-50"
              >
                {pingLoading ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    <span>Transmitting ICMP Probes...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Execute Ping Command</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                ICMP Diagnostic Output
              </span>
              {pingResult && <StatusBadge status={pingResult.status} />}
            </div>

            {pingResult ? (
              <div className="space-y-4">
                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400 block font-sans text-[11px]">Avg Latency</span>
                    <span className="text-base font-bold text-cyan-400">{pingResult.avg_latency_ms} ms</span>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400 block font-sans text-[11px]">Packet Loss</span>
                    <span className={`text-base font-bold ${pingResult.packet_loss > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {pingResult.packet_loss}%
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400 block font-sans text-[11px]">Sent / Received</span>
                    <span className="text-base font-bold text-slate-200">
                      {pingResult.packets_sent} / {pingResult.packets_received}
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400 block font-sans text-[11px]">Min / Max RTT</span>
                    <span className="text-xs font-bold text-slate-300">
                      {pingResult.min_latency_ms}ms / {pingResult.max_latency_ms}ms
                    </span>
                  </div>
                </div>

                {pingResult.error_message && (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
                    <span className="font-semibold block mb-0.5">Automata Detected Error:</span>
                    {pingResult.error_message}
                  </div>
                )}

                {/* Raw Terminal Output */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Raw Terminal Stream:</span>
                  <pre className="max-h-52 overflow-y-auto rounded-lg border border-slate-800 bg-black/60 p-3 text-xs font-mono text-cyan-300 whitespace-pre-wrap">
                    {pingResult.raw_output || 'No stdout output captured.'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center text-slate-500 text-xs">
                <Terminal size={32} className="mb-2 opacity-50" />
                <p>Awaiting ping command execution.</p>
                <p className="text-[11px] text-slate-600 mt-1">Target will receive ICMP Type 8 Echo Request frames.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DNS RESOLUTION */}
      {activeTab === 'dns' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" />
              DNS Resolver Query
            </h2>
            <form onSubmit={handleRunDNS} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Hostname (FQDN)</label>
                <input
                  type="text"
                  value={dnsHost}
                  onChange={(e) => setDnsHost(e.target.value)}
                  required
                  placeholder="google.com or wikipedia.org"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Preset Domains:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['google.com', 'cloudflare.com', 'github.com', 'wikipedia.org'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDnsHost(preset)}
                      className="rounded bg-slate-800 px-2 py-1 text-[10px] font-mono text-cyan-300 hover:bg-slate-700 transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={dnsLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-white shadow-glow-cyan hover:opacity-95 transition disabled:opacity-50"
              >
                {dnsLoading ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    <span>Resolving A/AAAA Records...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Resolve Hostname</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                DNS Resource Records Output
              </span>
              {dnsResult && <StatusBadge status={dnsResult.status} />}
            </div>

            {dnsResult ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400 block font-sans text-[11px]">Query Target</span>
                    <span className="text-sm font-bold text-white">{dnsResult.query}</span>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400 block font-sans text-[11px]">Resolution Time</span>
                    <span className="text-sm font-bold text-cyan-400">{dnsResult.latency_ms} ms</span>
                  </div>
                </div>

                {dnsResult.canonical_name && (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="text-slate-400 block font-sans text-[11px]">Canonical FQDN</span>
                    <span className="text-xs font-bold text-purple-300">{dnsResult.canonical_name}</span>
                  </div>
                )}

                {dnsResult.resolved_ips && dnsResult.resolved_ips.length > 0 ? (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-2 font-sans">
                      Resolved IP Addresses (A / AAAA Records):
                    </span>
                    <div className="space-y-1.5">
                      {dnsResult.resolved_ips.map((ip, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-2.5"
                        >
                          <span className="text-cyan-300 font-bold">{ip}</span>
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-700">
                            {ip.includes(':') ? 'IPv6 (AAAA)' : 'IPv4 (A)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-rose-300 font-sans">
                    <p className="font-bold">DNS Resolution Failed</p>
                    <p className="mt-1 text-xs">{dnsResult.error || 'NXDOMAIN: Domain could not be resolved by local DNS server.'}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center text-slate-500 text-xs">
                <Globe size={32} className="mb-2 opacity-50" />
                <p>Query a domain to inspect DNS response times and IP mappings.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TRACEROUTE */}
      {activeTab === 'traceroute' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Route size={16} className="text-purple-400" />
              Traceroute Configuration
            </h2>
            <form onSubmit={handleRunTraceroute} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Destination</label>
                <input
                  type="text"
                  value={traceTarget}
                  onChange={(e) => setTraceTarget(e.target.value)}
                  required
                  placeholder="8.8.8.8"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Max Hops (TTL 1 - 20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={traceHops}
                  onChange={(e) => setTraceHops(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={traceLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-2.5 text-xs font-bold text-white hover:opacity-95 transition disabled:opacity-50"
              >
                {traceLoading ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    <span>Tracing Path (TTL Probes)...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Execute Traceroute</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Hop-by-Hop Transmission Route
              </span>
              {traceResult && <StatusBadge status={traceResult.status} />}
            </div>

            {traceResult ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between text-slate-400 text-[11px] font-sans">
                  <span>Destination: <strong className="text-white">{traceResult.target}</strong></span>
                  <span>Total Hops: <strong className="text-cyan-400">{traceResult.total_hops}</strong></span>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                  {traceResult.hops?.length > 0 ? (
                    traceResult.hops.map((hop) => (
                      <div
                        key={hop.hop}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-300">
                            {hop.hop}
                          </span>
                          <span className="text-slate-200 font-bold">{hop.ip}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400">{hop.rtt}</span>
                          <StatusBadge status={hop.status} size="xs" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 font-sans">
                      No response from intermediate routers (ICMP TTL Exceeded disabled or filtered).
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center text-slate-500 text-xs">
                <Route size={32} className="mb-2 opacity-50" />
                <p>Run traceroute to discover intermediate Layer 3 router hops.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ROUTING & GATEWAY */}
      {activeTab === 'connectivity' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers size={16} className="text-emerald-400" />
              Routing Table & Gateway Diagnostic Suite
            </h2>
            <button
              onClick={handleCheckConnectivity}
              disabled={connLoading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
            >
              <RotateCw size={14} className={connLoading ? 'animate-spin' : ''} />
              <span>{connLoading ? 'Inspecting...' : 'Probe Local & Gateway Route'}</span>
            </button>
          </div>

          {connResult ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Local Adapter */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-3">
                  Local Network Interface Card (NIC)
                </span>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-800 py-1.5">
                    <span className="text-slate-400 font-sans">Host Machine:</span>
                    <span className="text-white">{connResult.local_adapter.hostname}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 py-1.5">
                    <span className="text-slate-400 font-sans">Local IPv4:</span>
                    <span className="text-cyan-300 font-bold">{connResult.local_adapter.local_ip}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 py-1.5">
                    <span className="text-slate-400 font-sans">Operating Platform:</span>
                    <span className="text-slate-200">{connResult.local_adapter.os} ({connResult.local_adapter.architecture})</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400 font-sans">Adapter Status:</span>
                    <StatusBadge status={connResult.local_adapter.is_apipa ? 'WARNING' : 'SUCCESS'} text={connResult.local_adapter.status} size="xs" />
                  </div>
                </div>
              </div>

              {/* Gateway & Internet Link */}
              <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-3">
                  Subnet Router & Internet Gateway
                </span>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-800 py-1.5">
                    <span className="text-slate-400 font-sans">Default Gateway IP:</span>
                    <span className="text-white font-bold">{connResult.default_gateway.gateway_ip}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 py-1.5">
                    <span className="text-slate-400 font-sans">Gateway Link:</span>
                    <StatusBadge status={connResult.default_gateway.detected ? 'SUCCESS' : 'FAILED'} text={connResult.default_gateway.detected ? 'Active Gateway' : 'Undetected'} size="xs" />
                  </div>
                  <div className="flex justify-between border-b border-slate-800 py-1.5">
                    <span className="text-slate-400 font-sans">WAN Internet Route:</span>
                    <StatusBadge status={connResult.internet.status} size="xs" />
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400 font-sans">Round-Trip Latency:</span>
                    <span className="text-cyan-300 font-bold">{connResult.internet.latency_ms} ms</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-8 text-center text-xs text-slate-400">
              Click <strong>"Probe Local & Gateway Route"</strong> to inspect interface configuration and default gateway state.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
