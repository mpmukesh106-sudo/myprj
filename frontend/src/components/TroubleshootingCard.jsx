import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Cpu, Wrench, ShieldAlert } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function TroubleshootingCard({ problem, onTestDFA }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedSteps, setCompletedSteps] = useState({});

  const toggleStep = (index) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const severityColor = {
    Critical: 'border-rose-500/40 bg-rose-950/20 text-rose-300',
    High: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
    Medium: 'border-yellow-500/40 bg-yellow-950/20 text-yellow-300',
    Low: 'border-blue-500/40 bg-blue-950/20 text-blue-300',
  }[problem.severity] || 'border-slate-700 bg-slate-900 text-slate-300';

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 backdrop-blur-md shadow-lg transition-all hover:border-slate-700">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-lg border p-2 ${severityColor}`}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white">{problem.problem_name}</h3>
              <StatusBadge status={problem.severity} size="xs" />
              {problem.category && (
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700">
                  {problem.category}
                </span>
              )}
            </div>
            {problem.detected_value && (
              <p className="mt-1 text-xs text-rose-400 font-mono">
                Trigger: {problem.detected_value}
              </p>
            )}
          </div>
        </div>

        {/* Action shortcut to test in DFA */}
        {onTestDFA && (
          <button
            onClick={() => onTestDFA(problem)}
            className="flex items-center gap-1.5 self-start rounded-lg border border-purple-500/30 bg-purple-950/40 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-900/50 transition"
          >
            <Cpu size={14} />
            <span>Verify in DFA</span>
          </button>
        )}
      </div>

      {/* Cause & Recommended Solution */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 text-xs">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <span className="font-semibold text-slate-300">Root Cause:</span>
          <p className="mt-1 text-slate-400 leading-relaxed">{problem.possible_cause}</p>
        </div>
        <div className="rounded-lg border border-cyan-900/30 bg-cyan-950/20 p-3">
          <span className="font-semibold text-cyan-300">Recommended Solution:</span>
          <p className="mt-1 text-slate-300 leading-relaxed">{problem.recommended_solution}</p>
        </div>
      </div>

      {/* Step by Step Remediation Instructions */}
      {problem.steps && problem.steps.length > 0 && (
        <div className="mt-4 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
          >
            <span className="flex items-center gap-1.5">
              <Wrench size={13} className="text-cyan-400" />
              Remediation Action Checklist ({problem.steps.length} Steps)
            </span>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              {problem.steps.map((step, idx) => {
                const isChecked = !!completedSteps[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-xs transition ${
                      isChecked
                        ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300 line-through'
                        : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="flex-1 font-mono">{step}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
