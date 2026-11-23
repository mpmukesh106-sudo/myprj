import React from 'react';

/**
 * Interactive SVG State Transition Diagram for DFA:
 * M = (Q, Σ, δ, q0, F)
 * States: q0 (Start), q1 (DNS), q2 (Timeout), q3 (Packet Loss), q4 (Unreachable/Refused), q5 (Trap/Reject)
 */
export default function DFAGraph({ currentState = 'q0', activeTransition, onSelectState }) {
  // Coordinated positions in SVG viewbox (800 x 420)
  const statePositions = {
    q0: { x: 120, y: 210, label: 'q0', sub: 'Initial', isAccepting: false },
    q1: { x: 380, y: 70, label: 'q1', sub: 'DNS Fail', isAccepting: true },
    q2: { x: 620, y: 90, label: 'q2', sub: 'Timeout', isAccepting: true },
    q3: { x: 640, y: 240, label: 'q3', sub: 'Packet Loss', isAccepting: true },
    q4: { x: 420, y: 350, label: 'q4', sub: 'Unreachable', isAccepting: true },
    q5: { x: 220, y: 350, label: 'q5', sub: 'Trap / Dead', isAccepting: false, isTrap: true },
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-[#070d1e] p-4 shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            DFA State Machine Diagram
          </span>
          <span className="text-[11px] text-slate-400">
            (Double circle = Accepting State $F$)
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-slate-300 font-mono">Current: {currentState}</span>
          </span>
        </div>
      </div>

      <svg viewBox="0 0 780 430" className="w-full h-auto select-none font-sans">
        <defs>
          {/* Arrow markers */}
          <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
          </marker>
          <marker id="arrow-trap" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
          </marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#00f0ff" />
          </marker>

          {/* Gradients */}
          <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="grad-accept" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#065f46" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="grad-trap" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#881337" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Start arrow into q0 */}
        <line x1="30" y1="210" x2="85" y2="210" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow)" />
        <text x="35" y="198" fill="#94a3b8" fontSize="11" fontWeight="600">Start</text>

        {/* Transitions from q0 to others */}
        {/* q0 -> q1 (DNS_ERROR) */}
        <path d="M 145 185 Q 240 100 345 78" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="none" markerEnd="url(#arrow)" />
        <rect x="210" y="105" width="85" height="18" rx="4" fill="#0f172a" stroke="#1e293b" />
        <text x="252" y="118" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="600">DNS_ERROR</text>

        {/* q0 -> q2 (TIMEOUT) */}
        <path d="M 155 195 Q 360 80 585 95" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
        <rect x="330" y="130" width="75" height="18" rx="4" fill="#0f172a" stroke="#1e293b" />
        <text x="367" y="143" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="600">TIMEOUT</text>

        {/* q0 -> q3 (PACKET_LOSS) */}
        <path d="M 160 215 Q 380 200 605 235" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
        <rect x="340" y="195" width="95" height="18" rx="4" fill="#0f172a" stroke="#1e293b" />
        <text x="387" y="208" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="600">PACKET_LOSS</text>

        {/* q0 -> q4 (HOST_UNREACHABLE / CONNECTION_REFUSED) */}
        <path d="M 150 235 Q 260 320 385 345" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />
        <rect x="235" y="280" width="135" height="18" rx="4" fill="#0f172a" stroke="#1e293b" />
        <text x="302" y="293" fill="#38bdf8" fontSize="9.5" textAnchor="middle" fontWeight="600">HOST_UNREACH / REFUSED</text>

        {/* q0 -> q5 (Trap / Invalid Symbol) */}
        <path d="M 135 245 Q 160 310 195 335" fill="none" stroke="#f43f5e" strokeWidth="2" markerEnd="url(#arrow-trap)" />
        <rect x="120" y="300" width="70" height="18" rx="4" fill="#0f172a" stroke="#1e293b" />
        <text x="155" y="313" fill="#f43f5e" fontSize="9.5" textAnchor="middle" fontWeight="600">Σ - Valid</text>

        {/* Self Loops on Accepting States (Payload / Detail characters) */}
        {/* q1 self-loop */}
        <path d="M 370 40 C 370 10 410 10 410 40" fill="none" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <text x="390" y="12" fill="#10b981" fontSize="9" textAnchor="middle">payload</text>

        {/* q2 self-loop */}
        <path d="M 610 60 C 610 30 650 30 650 60" fill="none" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <text x="630" y="32" fill="#10b981" fontSize="9" textAnchor="middle">payload</text>

        {/* q3 self-loop */}
        <path d="M 665 220 C 700 210 700 260 665 255" fill="none" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <text x="710" y="240" fill="#10b981" fontSize="9" textAnchor="start">payload</text>

        {/* q4 self-loop */}
        <path d="M 435 385 C 455 415 415 425 405 385" fill="none" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <text x="430" y="420" fill="#10b981" fontSize="9" textAnchor="middle">payload</text>

        {/* q5 Trap self-loop (absorbs all) */}
        <path d="M 235 385 C 255 420 200 425 205 385" fill="none" stroke="#f43f5e" strokeWidth="1.5" markerEnd="url(#arrow-trap)" />
        <text x="220" y="420" fill="#f43f5e" fontSize="9" textAnchor="middle">All (Σ)</text>

        {/* Render States */}
        {Object.entries(statePositions).map(([key, st]) => {
          const isActive = currentState === key;
          const isAccepting = st.isAccepting;
          const isTrap = st.isTrap;

          let nodeFill = '#131e36';
          let nodeStroke = '#334155';
          let textColor = '#e2e8f0';

          if (isActive) {
            nodeFill = 'url(#grad-active)';
            nodeStroke = '#00f0ff';
            textColor = '#ffffff';
          } else if (isAccepting) {
            nodeFill = 'url(#grad-accept)';
            nodeStroke = '#10b981';
          } else if (isTrap) {
            nodeFill = 'url(#grad-trap)';
            nodeStroke = '#f43f5e';
          }

          return (
            <g
              key={key}
              className="cursor-pointer transition-transform duration-200 hover:scale-105"
              onClick={() => onSelectState && onSelectState(key)}
            >
              {/* Outer circle for accepting state */}
              {isAccepting && (
                <circle
                  cx={st.x}
                  cy={st.y}
                  r="37"
                  fill="none"
                  stroke={isActive ? '#00f0ff' : '#10b981'}
                  strokeWidth={isActive ? '3' : '2'}
                  className={isActive ? 'animate-pulse' : ''}
                />
              )}

              {/* Active glow halo */}
              {isActive && (
                <circle
                  cx={st.x}
                  cy={st.y}
                  r={isAccepting ? '43' : '38'}
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
              )}

              {/* Main state circle */}
              <circle
                cx={st.x}
                cy={st.y}
                r="30"
                fill={nodeFill}
                stroke={nodeStroke}
                strokeWidth={isActive ? '3' : '2'}
              />

              {/* State Label */}
              <text
                x={st.x}
                y={st.y - 2}
                textAnchor="middle"
                fill={textColor}
                fontSize="15"
                fontWeight="700"
                fontFamily="JetBrains Mono"
              >
                {st.label}
              </text>
              <text
                x={st.x}
                y={st.y + 13}
                textAnchor="middle"
                fill={isActive ? '#00f0ff' : '#94a3b8'}
                fontSize="9"
                fontWeight="500"
              >
                {st.sub}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
