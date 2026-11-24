import React from 'react';
import {
  BookOpen,
  Network,
  Cpu,
  Layers,
  Code2,
  Database,
  ShieldCheck,
  Activity,
  Globe,
  Route
} from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0b132b] to-[#131e36] p-8 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
          <BookOpen size={16} />
          <span>Academic Curriculum Integration</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-4xl">
          Theoretical & Architectural Foundations
        </h1>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-3xl">
          <strong>NetAssist</strong> demonstrates the deep synergy between <strong>Computer Networks (CN)</strong>,
          <strong>Formal Languages and Automata Theory (FLAT)</strong>, and <strong>Full Stack Web Development (FSWD)</strong>.
          Below is a comprehensive technical breakdown of how each discipline is implemented in this system.
        </p>
      </div>

      {/* DISCIPLINE 1: COMPUTER NETWORKS */}
      <section className="rounded-2xl border border-blue-500/30 bg-[#0f172a]/90 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="rounded-xl bg-blue-500/20 p-2.5 text-blue-400 border border-blue-500/30">
            <Network size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">1. Computer Networks (CN) Implementation</h2>
            <p className="text-xs text-blue-300">OSI Reference Model, TCP/IP Suite, ICMP, DNS & Routing Mechanics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Activity size={15} className="text-cyan-400" />
              ICMP Protocol (RFC 792) & Latency
            </h3>
            <p>
              NetAssist issues native ICMP Echo Requests (Type 8) and listens for Echo Replies (Type 0).
              Round Trip Time (RTT) is computed with microsecond precision, capturing minimum, average, and maximum latencies.
              Packet loss is calculated across packet batches to identify physical layer attenuation or queue saturation.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Globe size={15} className="text-cyan-400" />
              DNS Resolution (RFC 1035)
            </h3>
            <p>
              The DNS resolver module queries hierarchical nameservers over UDP port 53.
              It parses IPv4 Address (A) and IPv6 Address (AAAA) resource records, tracking name resolution
              latency in milliseconds and intercepting socket errors such as NXDOMAIN (Non-Existent Domain).
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Route size={15} className="text-purple-400" />
              Traceroute Path Discovery (TTL Mechanics)
            </h3>
            <p>
              By transmitting IP packets with incrementing Time-To-Live (TTL) values from 1 to 30,
              intermediate Layer 3 routers discard the packet upon TTL decrement to 0 and transmit ICMP
              Time Exceeded messages (Type 11), exposing the router IP address and hop delay.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Layers size={15} className="text-emerald-400" />
              Subnet Addressing & APIPA Detection
            </h3>
            <p>
              The system interrogates local network interface cards (NICs) to verify IPv4 class ranges,
              default gateway reachability, and detects Automatic Private IP Addressing (APIPA 169.254.0.0/16)
              indicating DHCP server starvation.
            </p>
          </div>
        </div>
      </section>

      {/* DISCIPLINE 2: FORMAL LANGUAGES & AUTOMATA THEORY */}
      <section className="rounded-2xl border border-purple-500/30 bg-[#0f172a]/90 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="rounded-xl bg-purple-500/20 p-2.5 text-purple-400 border border-purple-500/30">
            <Cpu size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">2. Formal Languages and Automata Theory (FLAT)</h2>
            <p className="text-xs text-purple-300">Deterministic Finite Automata (DFA), Chomsky Type 3 Languages, & Regular Grammars</p>
          </div>
        </div>

        <div className="text-xs leading-relaxed text-slate-300 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="font-bold text-white text-sm mb-2">Mathematical 5-Tuple Definition of the NetAssist DFA</h3>
            <p className="font-mono text-cyan-300 mb-2">
              $M = (Q, \Sigma, \delta, q_0, F)$
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px] text-slate-300">
              <div className="space-y-1">
                <p><strong>Q =</strong> &#123;q0, q1, q2, q3, q4, q5&#125; (Finite set of states)</p>
                <p><strong>&#931; =</strong> &#123;DNS_ERROR, TIMEOUT, PACKET_LOSS, HOST_UNREACH, REFUSED, PAYLOAD, ...&#125;</p>
                <p><strong>q0 =</strong> Initial state (Awaiting network signal)</p>
              </div>
              <div className="space-y-1">
                <p><strong>F =</strong> &#123;q1, q2, q3, q4&#125; (Set of final accepting states)</p>
                <p><strong>q5 =</strong> Dead / Trap state absorbing invalid string tokens</p>
                <p><strong>&#948;:</strong> Transition function $Q \times \Sigma \to Q$</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
              <span className="font-bold text-purple-300 block mb-1">State q1: DNS Failure</span>
              <p className="text-[11px] text-slate-400">
                Recognizes regular language $L_1 = &#123;\text&#123;DNS\_ERROR&#125; \cdot w \mid w \in \Sigma^*&#125;$.
                Correlates with Layer 7 domain resolution timeout or NXDOMAIN responses.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
              <span className="font-bold text-purple-300 block mb-1">State q2: Timeout</span>
              <p className="text-[11px] text-slate-400">
                Recognizes regular language $L_2 = &#123;\text&#123;TIMEOUT&#125; \cdot w \mid w \in \Sigma^*&#125;$.
                Transitions on dropped TCP SYN-ACK frames exceeding RTO thresholds.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
              <span className="font-bold text-purple-300 block mb-1">State q3: Packet Loss</span>
              <p className="text-[11px] text-slate-400">
                Recognizes regular language $L_3 = &#123;\text&#123;PACKET\_LOSS&#125; \cdot w \mid w \in \Sigma^*&#125;$.
                Classifies physical layer transmission attenuation and queue overflows.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="font-bold text-white text-sm mb-1">Equivalence of Regular Expressions and Finite Automata (Kleene's Theorem)</h3>
            <p className="text-slate-400 text-xs">
              Every pattern accepted by the NetAssist DFA corresponds directly to a regular expression over alphabet $\Sigma$.
              The system demonstrates this equivalence by executing parallel RegEx evaluators on IP addresses (IPv4 / IPv6)
              and structured syslog error prefixes, verifying Chomsky Type 3 grammar compliance.
            </p>
          </div>
        </div>
      </section>

      {/* DISCIPLINE 3: FULL STACK WEB DEVELOPMENT */}
      <section className="rounded-2xl border border-emerald-500/30 bg-[#0f172a]/90 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="rounded-xl bg-emerald-500/20 p-2.5 text-emerald-400 border border-emerald-500/30">
            <Code2 size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">3. Full Stack Web Development (FSWD) Architecture</h2>
            <p className="text-xs text-emerald-300">Modern React Client, Asynchronous Python Backend, REST APIs, & SQLite Database</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Code2 size={15} className="text-emerald-400" />
              Frontend: React + Vite + Tailwind CSS
            </h3>
            <p>
              Constructed with modern component-driven React architecture, React Router v6, Tailwind CSS cyber-dark theme,
              Lucide SVG iconography, Chart.js reactive telemetry canvases, and interactive SVG state transition diagrams.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Layers size={15} className="text-emerald-400" />
              Backend: FastAPI RESTful Microservice
            </h3>
            <p>
              High-throughput ASGI server with automated OpenAPI/Swagger documentation, Pydantic type validation,
              CORS middleware, and safe subprocess command invocation with injection defense.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Database size={15} className="text-emerald-400" />
              Database: SQLite Persistent Storage
            </h3>
            <p>
              Relational SQLite engine storing diagnostic runs, target metrics, latency times, packet losses,
              and DFA transition logs with indexed search queries and transactional integrity.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <h3 className="font-bold text-white flex items-center gap-1.5 text-sm">
              <ShieldCheck size={15} className="text-emerald-400" />
              ReportLab PDF & CSV Streaming
            </h3>
            <p>
              Dynamically constructs professional PDF documents with formatted tables, color-coded status badges,
              and academic citations streamed directly from Python memory buffers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
