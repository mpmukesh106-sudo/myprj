import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Cpu,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

export default function Reports() {
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsList();
  }, []);

  const loadReportsList = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory({ limit: 50 });
      setHistory(res.data);
      if (res.data.length > 0) {
        setSelectedId(res.data[0].id);
        loadReportDetail(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadReportDetail = async (id) => {
    try {
      const res = await api.getReport(id);
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectReport = (id) => {
    setSelectedId(id);
    loadReportDetail(id);
  };

  const diag = reportData?.diagnostic;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <FileText size={15} />
            <span>Formal Diagnostic Reporting System</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Network Audit Reports & Exports
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Generate, inspect, and export academic diagnostic summaries in PDF and CSV format.
          </p>
        </div>

        {/* Global CSV export */}
        <a
          href={api.getCsvExportUrl()}
          download
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition self-start"
        >
          <Download size={14} />
          <span>Export All History as CSV</span>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: List of Diagnostic Runs */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Diagnostic Executions ({history.length})
            </h2>
            <button
              onClick={loadReportsList}
              className="text-slate-400 hover:text-cyan-400 transition"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
            {history.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectReport(item.id)}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    isSelected
                      ? 'border-cyan-500/40 bg-cyan-950/20 shadow-glow-cyan'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">
                      REP-NET-{String(item.id).padStart(5, '0')}
                    </span>
                    <StatusBadge status={item.status} size="xs" />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="text-cyan-300">{item.test_type}</span>
                    <span>{item.target}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{item.timestamp}</span>
                    <span>{item.latency > 0 ? `${item.latency}ms` : '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Full Report Document Preview */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#0f172a]/95 p-6 backdrop-blur-md">
          {reportData && diag ? (
            <div className="space-y-6">
              {/* Document Header Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-cyan-400 font-bold block">
                    {reportData.report_id}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Generated: {reportData.generated_at}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={api.getPdfDownloadUrl(diag.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow-cyan hover:opacity-95 transition"
                  >
                    <Download size={13} />
                    <span>Download Official PDF</span>
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition"
                  >
                    <Printer size={13} />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                </div>
              </div>

              {/* Title Section */}
              <div className="border-l-4 border-cyan-500 pl-4 py-1">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {reportData.project_title}
                </h2>
                <p className="text-xs text-blue-300 mt-0.5">
                  {reportData.academic_context}
                </p>
              </div>

              {/* Metadata Key-Value Grid */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block font-sans text-[11px]">Protocol</span>
                  <span className="font-bold text-white mt-1 block">{diag.test_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans text-[11px]">Target Destination</span>
                  <span className="font-bold text-cyan-300 mt-1 block truncate" title={diag.target}>
                    {diag.target}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans text-[11px]">Round-Trip Latency</span>
                  <span className="font-bold text-white mt-1 block">{diag.latency} ms</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans text-[11px]">Packet Loss</span>
                  <span className={`font-bold mt-1 block ${diag.packet_loss > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {diag.packet_loss}%
                  </span>
                </div>
              </div>

              {/* Section 1: Computer Networks Technical Evaluation */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Server size={14} />
                  <span>1. Computer Networks (CN) Technical Findings</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The automated diagnostic engine issued diagnostic synchronization frames targeting{' '}
                  <strong className="text-white font-mono">{diag.target}</strong> under protocol{' '}
                  <strong className="text-white font-mono">{diag.test_type}</strong>. The resulting link condition is classified as{' '}
                  <strong className="text-white">{diag.status}</strong> with an average latency of{' '}
                  <strong className="text-cyan-400 font-mono">{diag.latency} ms</strong> and a packet loss rate of{' '}
                  <strong className="text-rose-400 font-mono">{diag.packet_loss}%</strong>.
                </p>
                {diag.error_message && (
                  <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs text-rose-300 font-mono">
                    <strong>Impairment Signature: </strong>
                    {diag.error_message}
                  </div>
                )}
              </div>

              {/* Section 2: FLAT Automata Pattern Classification */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Cpu size={14} />
                  <span>2. Formal Languages & Automata Theory (FLAT) Classification</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The captured diagnostic tokens were evaluated by Deterministic Finite Automaton $M = (Q, \Sigma, \delta, q_0, F)$.
                  Input string was tokenized and transitioned from initial state $q_0$ to accepting state{' '}
                  <strong className="text-purple-300 font-mono">
                    {diag.error_message?.includes('DNS') ? 'q1' : diag.error_message?.includes('TIMEOUT') ? 'q2' : diag.error_message?.includes('LOSS') ? 'q3' : 'q4'}
                  </strong>.
                </p>
              </div>

              {/* Section 3: Recommended Remediation */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>3. Engineering Recommendations</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 font-sans leading-relaxed">
                  {diag.status === 'SUCCESS' ? (
                    <li>All transmission parameters meet operational SLAs. Routine monitoring recommended.</li>
                  ) : (
                    <>
                      <li>Flush operating system DNS resolver cache with <code className="font-mono text-cyan-400">ipconfig /flushdns</code>.</li>
                      <li>Verify physical Layer 1 Ethernet link and wireless RF interference levels.</li>
                      <li>Run continuous ICMP probe on the subnet gateway router (<code className="font-mono text-cyan-400">192.168.1.1</code>).</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center text-slate-500 text-xs">
              <FileText size={36} className="mb-2 opacity-50" />
              <p>Select a diagnostic execution from the left to view the formal report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
