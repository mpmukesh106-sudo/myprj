import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Table,
  Terminal,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Info
} from 'lucide-react';
import DFAGraph from '../components/DFAGraph';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

const PRESET_PATTERNS = [
  { label: 'DNS Failure', pattern: 'DNS_ERROR: NXDOMAIN Non-existent domain', state: 'q1' },
  { label: 'Connection Timeout', pattern: 'TIMEOUT: Request timed out after 4000ms', state: 'q2' },
  { label: 'Packet Loss', pattern: 'PACKET_LOSS: 40% frame drop detected', state: 'q3' },
  { label: 'Host Unreachable', pattern: 'HOST_UNREACHABLE: No route to host', state: 'q4' },
  { label: 'Connection Refused', pattern: 'CONNECTION_REFUSED: Port closed', state: 'q4' },
  { label: 'Network Unavailable', pattern: 'NETWORK_UNAVAILABLE: Interface link down', state: 'q4' },
  { label: 'Invalid / Trap Input', pattern: 'UNRECOGNIZED_NOISE_TOKEN_XYZ', state: 'q5' },
];

export default function DFASimulator() {
  const location = useLocation();
  const prefill = location.state?.prefillString || 'DNS_ERROR: NXDOMAIN';

  const [inputString, setInputString] = useState(prefill);
  const [loading, setLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [metadata, setMetadata] = useState(null);

  // Regex validation sub-tab
  const [regexInput, setRegexInput] = useState('192.168.1.1');
  const [regexType, setRegexType] = useState('ipv4');
  const [regexResult, setRegexResult] = useState(null);
  const [regexLoading, setRegexLoading] = useState(false);

  // Fetch DFA transition metadata
  useEffect(() => {
    api.getTransitions().then((res) => {
      setMetadata(res.data);
    }).catch(console.error);

    // Initial run
    handleRecognize(prefill);
  }, []);

  const handleRecognize = async (strToRecognize) => {
    const targetStr = strToRecognize !== undefined ? strToRecognize : inputString;
    if (!targetStr.trim()) return;

    setLoading(true);
    setAutoPlaying(false);
    try {
      const res = await api.recognizeAutomata(targetStr);
      setExecutionResult(res.data);
      setCurrentStepIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Step-by-step navigation
  const totalSteps = executionResult?.steps?.length || 0;
  const currentStep = executionResult?.steps?.[currentStepIndex] || null;
  const activeState = currentStep ? (currentStepIndex === 0 ? 'q0' : currentStep.next_state) : 'q0';

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleResetStepper = () => {
    setCurrentStepIndex(0);
    setAutoPlaying(false);
  };

  // Auto-play stepper effect
  useEffect(() => {
    let timer;
    if (autoPlaying && currentStepIndex < totalSteps - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 900);
    } else if (currentStepIndex >= totalSteps - 1) {
      setAutoPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [autoPlaying, currentStepIndex, totalSteps]);

  // Regex Validation handler
  const handleValidateRegex = async (e) => {
    e?.preventDefault();
    setRegexLoading(true);
    try {
      const res = await api.validateRegex(regexInput, regexType);
      setRegexResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRegexLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
          <Cpu size={15} />
          <span>Formal Languages and Automata Theory (FLAT) Module</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
          Deterministic Finite Automaton (DFA) Error Recognizer
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Formal language recognition for network failure patterns using 5-tuple DFA $M = (Q, \Sigma, \delta, q_0, F)$ and Regular Expressions.
        </p>
      </div>

      {/* Input Section & Presets */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
        <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Terminal size={16} className="text-purple-400" />
          <span>DFA String Recognition Input</span>
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputString}
            onChange={(e) => setInputString(e.target.value)}
            placeholder="e.g., DNS_ERROR: Non-existent domain or TIMEOUT"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={() => handleRecognize()}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:opacity-95 transition disabled:opacity-50"
          >
            <Play size={14} fill="currentColor" />
            <span>{loading ? 'Evaluating...' : 'Simulate DFA Execution'}</span>
          </button>
        </div>

        {/* Presets */}
        <div className="mt-3">
          <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Quick Test Patterns:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PATTERNS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputString(p.pattern);
                  handleRecognize(p.pattern);
                }}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-mono transition border ${
                  p.state === 'q5'
                    ? 'border-rose-900/50 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50'
                    : 'border-slate-800 bg-slate-900 text-purple-300 hover:bg-slate-800 hover:border-purple-500/40'
                }`}
              >
                {p.label} <span className="text-slate-500">({p.state})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive DFA Visualization */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* State Machine Diagram SVG */}
        <div className="lg:col-span-2 space-y-4">
          <DFAGraph
            currentState={activeState}
            activeTransition={currentStep}
            onSelectState={(stateKey) => {}}
          />

          {/* Stepper Controls Bar */}
          {executionResult && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0f172a]/90 p-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStepIndex === 0}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
                  title="Previous Step"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setAutoPlaying(!autoPlaying)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    autoPlaying
                      ? 'bg-amber-600 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
                  }`}
                >
                  <Play size={13} fill="currentColor" />
                  <span>{autoPlaying ? 'Pause' : 'Auto Play'}</span>
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={currentStepIndex >= totalSteps - 1}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
                  title="Next Step"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={handleResetStepper}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 transition"
                  title="Reset to Initial State q0"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Step indicator */}
              <div className="text-xs font-mono text-slate-300">
                Step <strong className="text-cyan-400">{currentStepIndex + 1}</strong> of{' '}
                <strong>{totalSteps}</strong> | Active: <strong className="text-purple-400">{activeState}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Execution Summary & Formal Math Definition */}
        <div className="space-y-4">
          {/* Formal Tuple Card */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info size={15} className="text-cyan-400" />
              <span>Formal DFA Definition</span>
            </h3>
            <p className="font-mono text-cyan-300 text-[11px] mb-2">$M = (Q, \Sigma, \delta, q_0, F)$</p>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
              <p><strong className="text-slate-200">Q (States):</strong> &#123;q0, q1, q2, q3, q4, q5&#125;</p>
              <p><strong className="text-slate-200">&#931; (Alphabet):</strong> Network error tokens</p>
              <p><strong className="text-slate-200">q0 (Initial):</strong> q0 (Awaiting input)</p>
              <p><strong className="text-slate-200">F (Accepting):</strong> &#123;q1, q2, q3, q4&#125;</p>
              <p><strong className="text-rose-400">Trap State:</strong> q5 (Absorbing dead state)</p>
            </div>
          </div>

          {/* Verdict Card */}
          {executionResult && (
            <div className={`rounded-xl border p-5 backdrop-blur-md ${
              executionResult.is_accepted
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-500/30 bg-rose-950/20 text-rose-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {executionResult.is_accepted ? (
                  <CheckCircle2 size={18} className="text-emerald-400" />
                ) : (
                  <XCircle size={18} className="text-rose-400" />
                )}
                <span className="font-bold text-sm text-white">
                  {executionResult.is_accepted ? 'LANGUAGE ACCEPTED' : 'STRING REJECTED'}
                </span>
              </div>
              <p className="text-xs leading-relaxed font-sans">{executionResult.verdict}</p>

              <div className="mt-3 border-t border-slate-800/80 pt-2 text-xs font-mono">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-sans">Final State:</span>
                  <strong className="text-white">{executionResult.final_state}</strong>
                </div>
                {executionResult.recognized_pattern && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-sans">Recognized Pattern:</span>
                    <strong className="text-cyan-400">{executionResult.recognized_pattern}</strong>
                  </div>
                )}
                {executionResult.pattern_info && (
                  <div className="mt-2 rounded bg-slate-900/60 p-2 text-[11px] text-slate-300 font-sans">
                    <strong>Layer:</strong> {executionResult.pattern_info.layer}<br />
                    <strong>Category:</strong> {executionResult.pattern_info.category}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step-by-Step Transition Trace Table */}
      {executionResult?.steps && (
        <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Table size={16} className="text-cyan-400" />
              <span>DFA State Transition Execution Trace</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              &#948;(current, input) &rarr; next
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 bg-slate-900/60 font-sans text-[11px] text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Step #</th>
                  <th className="py-2.5 px-3">Current State $q_i$</th>
                  <th className="py-2.5 px-3">Input Symbol Consumed</th>
                  <th className="py-2.5 px-3">Transition Action $\delta$</th>
                  <th className="py-2.5 px-3">Next State $q_j$</th>
                  <th className="py-2.5 px-3 text-right">Accepting?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {executionResult.steps.map((st, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`cursor-pointer transition ${
                        isCurrent
                          ? 'bg-purple-950/40 text-purple-200 border-l-2 border-purple-400'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-slate-400">{st.step}</td>
                      <td className="py-2 px-3 text-cyan-300 font-bold">{st.current_state}</td>
                      <td className="py-2 px-3 text-white font-bold">{st.input_consumed}</td>
                      <td className="py-2 px-3 text-slate-300 font-sans">{st.action}</td>
                      <td className="py-2 px-3 text-purple-300 font-bold">{st.next_state}</td>
                      <td className="py-2 px-3 text-right">
                        <StatusBadge
                          status={st.is_accepting ? 'ACCEPTED' : 'REJECTED'}
                          text={st.is_accepting ? 'F (Accept)' : 'Reject'}
                          size="xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transition Table & Regular Expression Validator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* DFA Transition Table δ */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Table size={15} className="text-purple-400" />
            <span>Formal DFA Transition Table $\delta(Q \times \Sigma)$</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono">
              <thead className="border-b border-slate-800 bg-slate-900 font-sans text-[11px] text-slate-400">
                <tr>
                  <th className="py-2 px-2 text-left">State</th>
                  <th className="py-2 px-2">DNS_ERROR</th>
                  <th className="py-2 px-2">TIMEOUT</th>
                  <th className="py-2 px-2">PACKET_LOSS</th>
                  <th className="py-2 px-2">HOST_UNREACH</th>
                  <th className="py-2 px-2">Other / Invalid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-2 px-2 text-left font-bold text-cyan-400">&rarr; q0 (Start)</td>
                  <td className="py-2 px-2 text-emerald-400">q1</td>
                  <td className="py-2 px-2 text-emerald-400">q2</td>
                  <td className="py-2 px-2 text-emerald-400">q3</td>
                  <td className="py-2 px-2 text-emerald-400">q4</td>
                  <td className="py-2 px-2 text-rose-400">q5 (Trap)</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 text-left font-bold text-emerald-400">* q1 (DNS Fail)</td>
                  <td className="py-2 px-2 text-emerald-400">q1</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-emerald-400">q1 (self)</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 text-left font-bold text-emerald-400">* q2 (Timeout)</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-emerald-400">q2</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-emerald-400">q2 (self)</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 text-left font-bold text-emerald-400">* q3 (Loss)</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-emerald-400">q3</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-emerald-400">q3 (self)</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 text-left font-bold text-emerald-400">* q4 (Unreach)</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-emerald-400">q4</td>
                  <td className="py-2 px-2 text-emerald-400">q4 (self)</td>
                </tr>
                <tr>
                  <td className="py-2 px-2 text-left font-bold text-rose-400">q5 (Trap / Dead)</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                  <td className="py-2 px-2 text-rose-400">q5</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 font-sans">
            * denotes accepting states ($F = \{q_1, q_2, q_3, q_4\}$); &rarr; denotes initial state $q_0$.
          </p>
        </div>

        {/* Regular Expression Validator */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShieldCheck size={15} className="text-cyan-400" />
            <span>Regular Expression Network Validator</span>
          </h3>

          <form onSubmit={handleValidateRegex} className="space-y-3">
            <div className="flex gap-2">
              <select
                value={regexType}
                onChange={(e) => setRegexType(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ipv4">IPv4 Address</option>
                <option value="ipv6">IPv6 Address</option>
                <option value="domain">Domain Name</option>
                <option value="error_pattern">Error Message</option>
              </select>

              <input
                type="text"
                value={regexInput}
                onChange={(e) => setRegexInput(e.target.value)}
                placeholder="Enter string to validate with regex"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={regexLoading}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition"
              >
                Test
              </button>
            </div>
          </form>

          {regexResult && (
            <div className={`mt-3 rounded-lg border p-3 text-xs font-mono ${
              regexResult.is_valid
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-500/30 bg-rose-950/20 text-rose-300'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">
                  {regexResult.is_valid ? 'MATCH: Valid Pattern' : 'NO MATCH: Invalid Format'}
                </span>
                <StatusBadge status={regexResult.is_valid ? 'SUCCESS' : 'FAILED'} size="xs" />
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">{regexResult.explanation}</p>
              <div className="mt-2 rounded bg-slate-900/60 p-2 text-[10px] text-slate-400 truncate">
                Regex: {regexResult.regex_pattern}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
