import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Play,
  RotateCw,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import TroubleshootingCard from '../components/TroubleshootingCard';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';
import confetti from 'canvas-confetti';

export default function Troubleshooting() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunDiagnosis = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await api.runDiagnosis();
      setResult(res.data);
      if (res.data.health_score >= 80) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      setError(err.message || 'Automated diagnosis execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleTestInDFA = (problem) => {
    // Navigate to automata simulator with the error pattern pre-filled
    const pattern = problem.problem_name.includes('DNS')
      ? 'DNS_ERROR: NXDOMAIN'
      : problem.problem_name.includes('Timeout')
      ? 'TIMEOUT: Request timed out'
      : problem.problem_name.includes('Loss')
      ? 'PACKET_LOSS: Dropped packets'
      : problem.problem_name.includes('Unreachable')
      ? 'HOST_UNREACHABLE: Destination unreachable'
      : 'CONNECTION_REFUSED: Port closed';
    navigate('/automata', { state: { prefillString: pattern } });
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary CTA */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <Wrench size={15} />
            <span>Intelligent Root-Cause Engine</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Automated Network Troubleshooting
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Multi-layer protocol verification, failure pattern extraction, and step-by-step remediation plans.
          </p>
        </div>

        <button
          onClick={handleRunDiagnosis}
          disabled={running}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-glow-cyan hover:opacity-95 transition disabled:opacity-50 self-start md:self-auto"
        >
          {running ? (
            <>
              <RotateCw size={16} className="animate-spin" />
              <span>Scanning All Network Layers...</span>
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              <span>Run Automatic Diagnosis</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-300">
          <span className="font-bold">Execution Error: </span>
          {error}
        </div>
      )}

      {/* When no diagnosis has been run yet */}
      {!result && !running && (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-[#0f172a]/60 p-12 text-center backdrop-blur-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 mb-4">
            <Sparkles size={32} />
          </div>
          <h2 className="text-lg font-bold text-white">Automated Troubleshooting Engine Idle</h2>
          <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            NetAssist performs automatic health checks across local IP configuration, default gateway reachability,
            DNS name servers, and public WAN latency. Click the button above to begin.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-[11px] text-slate-500">
            <span className="rounded bg-slate-900 px-2 py-1 border border-slate-800">DHCP / APIPA Detection</span>
            <span className="rounded bg-slate-900 px-2 py-1 border border-slate-800">Gateway ICMP Probe</span>
            <span className="rounded bg-slate-900 px-2 py-1 border border-slate-800">DNS Resolution</span>
            <span className="rounded bg-slate-900 px-2 py-1 border border-slate-800">FLAT Automata Token Matching</span>
          </div>
        </div>
      )}

      {/* Diagnosis Results */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Health Card */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0f172a] to-[#131e36] p-6 backdrop-blur-md">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Overall Network Health Rating
                  </span>
                  <StatusBadge status={result.status} />
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className={`text-4xl font-extrabold font-mono ${
                    result.health_score >= 80 ? 'text-emerald-400' : result.health_score >= 50 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {result.health_score}/100
                  </span>
                  <span className="text-xs text-slate-400">
                    {result.problems_count === 0 ? 'Optimal Link State' : `${result.problems_count} Issue(s) Correlated`}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-300 max-w-xl leading-relaxed">
                  {result.summary_message}
                </p>
              </div>

              {/* Progress bar visual */}
              <div className="w-full md:w-64">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Stability Index</span>
                  <span>{result.health_score}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-700 rounded-full ${
                      result.health_score >= 80 ? 'bg-emerald-500 shadow-glow-green' : result.health_score >= 50 ? 'bg-amber-500' : 'bg-rose-500 shadow-glow-red'
                    }`}
                    style={{ width: `${result.health_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Problems List */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <span>Diagnostic Findings & Action Plans ({result.problems.length})</span>
            </h2>

            {result.problems.length > 0 ? (
              result.problems.map((problem, idx) => (
                <TroubleshootingCard
                  key={idx}
                  problem={problem}
                  onTestDFA={handleTestInDFA}
                />
              ))
            ) : (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center text-emerald-300">
                <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-400" />
                <h3 className="text-base font-bold text-white">All Subsystems Functioning Within Parameters</h3>
                <p className="mt-1 text-xs text-emerald-300/80 max-w-md mx-auto">
                  Local interface has acquired a valid IP, default gateway is responsive, DNS resolution is operational,
                  and public internet routes are open with low latency.
                </p>
              </div>
            )}
          </div>

          {/* FLAT Automata Integration Section */}
          {result.automata_classifications && result.automata_classifications.length > 0 && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Cpu size={18} className="text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    FLAT DFA Error Recognition Classifications
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/automata')}
                  className="flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-white transition"
                >
                  <span>Open DFA Simulator</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="space-y-2">
                {result.automata_classifications.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-purple-800/40 bg-slate-900/60 p-3 text-xs font-mono"
                  >
                    <div>
                      <span className="text-slate-400 block font-sans text-[11px]">Input Error Token:</span>
                      <span className="font-bold text-purple-300">{item.input_string}</span>
                    </div>
                    <div className="mt-2 sm:mt-0 flex items-center gap-3">
                      <span className="text-slate-300">
                        Final State: <strong className="text-cyan-400">{item.final_state}</strong>
                      </span>
                      <StatusBadge status={item.is_accepted ? 'ACCEPTED' : 'REJECTED'} size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
