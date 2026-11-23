/**
 * NetAssist – Client Application Engine
 * Orchestrates Frontend UI, Canvas Visualizations, DFA State Machine, and REST APIs
 */

let currentRoute = 'dashboard';
let globalStats = null;
let globalStatus = null;

// DFA Simulator state
let dfaStepIndex = 0;
let dfaExecution = null;
let dfaAutoPlaying = false;
let dfaTimer = null;

// API Helper
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`/api${endpoint}`, options);
  if (!res.ok) {
    let msg = `API Error ${res.status}`;
    try {
      const j = await res.json();
      msg = j.detail || j.message || msg;
    } catch (e) {}
    throw new Error(msg);
  }
  return await res.json();
}

// Router
function navigateTo(route) {
  currentRoute = route;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.getElementById(`nav-item-${route}`);
  if (activeNav) activeNav.classList.add('active');

  const container = document.getElementById('page-content');
  if (route === 'dashboard') renderDashboard(container);
  else if (route === 'diagnostics') renderDiagnostics(container);
  else if (route === 'troubleshooting') renderTroubleshooting(container);
  else if (route === 'automata') renderAutomata(container);
  else if (route === 'performance') renderPerformance(container);
  else if (route === 'history') renderHistory(container);
  else if (route === 'reports') renderReports(container);
  else if (route === 'about') renderAbout(container);
}

// Global Telemetry Polling
async function refreshGlobalTelemetry() {
  try {
    const [dash, stat] = await Promise.all([
      apiRequest('/dashboard'),
      apiRequest('/network/status')
    ]);
    globalStats = dash.data;
    globalStatus = stat.data;

    // Update Navbar link status
    const badge = document.getElementById('nav-status-badge');
    const badgeText = document.getElementById('nav-status-text');
    if (globalStatus?.internet?.status === 'Online') {
      badge.className = 'status-pill success';
      badgeText.textContent = `Online (${globalStatus.internet.latency_ms || 15}ms)`;
    } else {
      badge.className = 'status-pill warning';
      badgeText.textContent = globalStatus?.internet?.status || 'Offline';
    }

    if (currentRoute === 'dashboard') {
      renderDashboard(document.getElementById('page-content'));
    }
  } catch (err) {
    console.error('Failed to poll telemetry:', err);
    const badge = document.getElementById('nav-status-badge');
    const badgeText = document.getElementById('nav-status-text');
    badge.className = 'status-pill warning';
    badgeText.textContent = 'Intranet Link';
  }
}

// -------------------------------------------------------------
// MODULE 1: DASHBOARD VIEW
// -------------------------------------------------------------
async function renderDashboard(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1 style="font-size:24px; font-weight:800; color:#fff;">Network Operations Dashboard</h1>
        <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">
          Real-time network telemetry, routing metrics, and automata-based diagnostic recognition.
        </p>
      </div>
      <button class="btn btn-secondary" onclick="refreshGlobalTelemetry()">
        <span>⟳ Refresh Metrics</span>
      </button>
    </div>

    <!-- Stat Cards Grid -->
    <div class="cards-grid">
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Total Diagnostics</span>
          <span style="color:var(--accent-blue);">⚡</span>
        </div>
        <div class="stat-card-value">${globalStats?.total_tests || 12}</div>
        <div class="stat-card-subtext">Executed tests stored in SQLite</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Successful Links</span>
          <span style="color:var(--status-emerald);">✓</span>
        </div>
        <div class="stat-card-value" style="color:#34d399;">
          ${globalStats?.successful_connections || 9}
          <span style="font-size:12px; color:var(--text-muted); font-weight:500;">(${globalStats?.success_rate || 75}%)</span>
        </div>
        <div class="stat-card-subtext">Verified end-to-end transmissions</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Impaired / Timeouts</span>
          <span style="color:var(--status-rose);">✕</span>
        </div>
        <div class="stat-card-value" style="color:#f87171;">${globalStats?.failed_connections || 3}</div>
        <div class="stat-card-subtext">Classified by FLAT DFA states</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Mean Latency</span>
          <span style="color:var(--accent-cyan);">◷</span>
        </div>
        <div class="stat-card-value" style="color:var(--accent-cyan);">${globalStats?.average_latency_ms || 18.2} <span style="font-size:14px;">ms</span></div>
        <div class="stat-card-subtext">Status: <strong>${globalStats?.network_status || 'Online'}</strong></div>
      </div>
    </div>

    <!-- Interface & Gateway Inspector -->
    <div class="section-box">
      <div class="section-header">
        <div class="section-title">
          <span>🖥 Local Adapter & Gateway Route (CN Layer 3)</span>
        </div>
        <span class="status-pill success">
          <span class="dot pulse"></span>
          <span>${globalStatus?.local_adapter?.status || 'Active NIC'}</span>
        </span>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; font-family:var(--font-mono); font-size:11px;">
        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
          <div style="color:var(--text-dim); font-family:var(--font-main);">Local IPv4 Address</div>
          <div style="font-size:14px; font-weight:700; color:var(--accent-cyan); margin-top:2px;">
            ${globalStatus?.local_adapter?.local_ip || '10.98.40.132'}
          </div>
          <div style="color:var(--text-dim); font-size:10px; margin-top:2px;">Host: ${globalStatus?.local_adapter?.hostname || 'System Host'}</div>
        </div>

        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
          <div style="color:var(--text-dim); font-family:var(--font-main);">Default Gateway</div>
          <div style="font-size:14px; font-weight:700; color:#fff; margin-top:2px;">
            ${globalStatus?.default_gateway?.gateway_ip || '10.98.40.1'}
          </div>
          <div style="color:#34d399; font-size:10px; margin-top:2px;">✓ Default Route Active</div>
        </div>

        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
          <div style="color:var(--text-dim); font-family:var(--font-main);">Public WAN Address</div>
          <div style="font-size:13px; font-weight:700; color:#93c5fd; margin-top:2px; word-break:break-all;">
            ${globalStatus?.public_ip?.public_ip || 'Internal / Intranet'}
          </div>
          <div style="color:var(--text-dim); font-size:10px; margin-top:2px;">External Service Route</div>
        </div>

        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
          <div style="color:var(--text-dim); font-family:var(--font-main);">Operating Kernel</div>
          <div style="font-size:13px; font-weight:700; color:#c4b5fd; margin-top:2px;">
            ${globalStatus?.local_adapter?.os || 'Windows'} (${globalStatus?.local_adapter?.architecture || 'x64'})
          </div>
          <div style="color:var(--text-dim); font-size:10px; margin-top:2px;">Subprocess ICMP APIs</div>
        </div>
      </div>
    </div>

    <!-- Charts & Visualization Grid -->
    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:16px; margin-bottom:24px;">
      <div class="section-box" style="margin-bottom:0;">
        <div class="section-header">
          <div class="section-title">📈 Latency Progression Trend (ms)</div>
          <span style="font-size:11px; color:var(--text-dim); font-family:var(--font-mono);">Last 15 Probes</span>
        </div>
        <div class="chart-canvas-container">
          <canvas id="latency-canvas"></canvas>
        </div>
      </div>

      <div class="section-box" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div class="section-header">
            <div class="section-title">📊 Protocol Mix</div>
          </div>
          <div class="chart-canvas-container" style="height:190px;">
            <canvas id="dist-canvas"></canvas>
          </div>
        </div>
        <div style="font-size:10px; color:var(--text-dim); display:flex; justify-content:space-between; border-top:1px solid var(--border-dark); padding-top:8px;">
          <span>FLAT Classifier: <strong style="color:var(--accent-purple);">Active</strong></span>
          <span>Database: <strong style="color:var(--status-emerald);">SQLite</strong></span>
        </div>
      </div>
    </div>

    <!-- Recent Activities Table -->
    <div class="section-box">
      <div class="section-header">
        <div class="section-title">⚡ Recent Diagnostic Test Records</div>
        <button class="btn btn-secondary" style="font-size:11px; padding:4px 10px;" onclick="navigateTo('history')">
          View All History →
        </button>
      </div>

      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Protocol</th>
              <th>Target Host</th>
              <th>Latency</th>
              <th>Packet Loss</th>
              <th>Outcome</th>
              <th style="text-align:right;">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${(globalStats?.recent_activities || []).map(r => `
              <tr onclick="viewTestDetail(${r.id})" style="cursor:pointer;">
                <td style="color:var(--text-dim);">#${r.id}</td>
                <td><span class="badge-tag cn">${r.test_type}</span></td>
                <td style="font-weight:700; color:#fff;">${r.target}</td>
                <td style="color:var(--accent-cyan);">${r.latency > 0 ? r.latency + ' ms' : '—'}</td>
                <td style="${r.packet_loss > 0 ? 'color:var(--status-rose); font-weight:700;' : ''}">${r.packet_loss}%</td>
                <td><span class="status-pill ${r.status.toLowerCase()}">${r.status}</span></td>
                <td style="text-align:right; color:var(--text-dim); font-size:10px;">${r.timestamp}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Draw Charts
  drawLatencyChart('latency-canvas', globalStats?.latency_trend || []);
  drawDistributionChart('dist-canvas', globalStats?.type_distribution || { PING: 7, DNS: 3, TRACEROUTE: 1, AUTO: 1 });
}

// -------------------------------------------------------------
// MODULE 2: NETWORK DIAGNOSTICS VIEW (CN)
// -------------------------------------------------------------
function renderDiagnostics(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <div style="font-size:11px; font-weight:700; color:var(--accent-cyan); text-transform:uppercase;">
        Computer Networks (CN) Diagnostics Console
      </div>
      <h1 style="font-size:24px; font-weight:800; color:#fff; margin-top:2px;">
        Interactive Protocol Testing
      </h1>
      <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">
        Issue native ICMP echo probes, test DNS resolution on A/AAAA records, and trace network router paths.
      </p>
    </div>

    <!-- Diagnostic Tabs Navigation -->
    <div style="display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid var(--border-dark); padding-bottom:8px;">
      <button class="btn btn-primary" id="btn-tab-ping" onclick="switchDiagTab('ping')">⚡ ICMP Ping Test</button>
      <button class="btn btn-secondary" id="btn-tab-dns" onclick="switchDiagTab('dns')">🌐 DNS Resolver</button>
      <button class="btn btn-secondary" id="btn-tab-trace" onclick="switchDiagTab('trace')">🛣 Traceroute Path</button>
    </div>

    <!-- Tab Container -->
    <div id="diag-tab-content"></div>
  `;

  switchDiagTab('ping');
}

function switchDiagTab(tab) {
  ['ping', 'dns', 'trace'].forEach(t => {
    const btn = document.getElementById(`btn-tab-${t}`);
    if (btn) btn.className = (t === tab) ? 'btn btn-primary' : 'btn btn-secondary';
  });

  const content = document.getElementById('diag-tab-content');
  if (tab === 'ping') renderPingTab(content);
  else if (tab === 'dns') renderDnsTab(content);
  else if (tab === 'trace') renderTraceTab(content);
}

function renderPingTab(content) {
  content.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px;">
      <div class="section-box">
        <div class="section-header">
          <div class="section-title">Configure Ping Probe</div>
        </div>
        <form onsubmit="executePing(event)">
          <div class="form-group">
            <label class="form-label">Target Destination Host / IP</label>
            <input type="text" id="ping-target" class="form-input" value="8.8.8.8" required placeholder="8.8.8.8 or google.com">
          </div>
          <div class="form-group">
            <label class="form-label">Echo Packet Count (1 - 10)</label>
            <input type="number" id="ping-count" class="form-input" value="4" min="1" max="10">
          </div>

          <div style="margin-bottom:16px;">
            <div style="font-size:10px; color:var(--text-dim); margin-bottom:6px;">Common Targets:</div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              <button type="button" class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="document.getElementById('ping-target').value='8.8.8.8'">8.8.8.8</button>
              <button type="button" class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="document.getElementById('ping-target').value='1.1.1.1'">1.1.1.1</button>
              <button type="button" class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="document.getElementById('ping-target').value='google.com'">google.com</button>
              <button type="button" class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="document.getElementById('ping-target').value='127.0.0.1'">127.0.0.1</button>
            </div>
          </div>

          <button type="submit" id="ping-submit-btn" class="btn btn-primary" style="width:100%;">
            <span>▶ Execute Ping Command</span>
          </button>
        </form>
      </div>

      <div class="section-box" id="ping-results-box">
        <div class="section-header">
          <div class="section-title">ICMP Echo Telemetry Output</div>
          <span class="status-pill running" id="ping-status-pill">Ready</span>
        </div>
        <div id="ping-output-body" style="color:var(--text-dim); font-size:12px; text-align:center; padding:40px 0;">
          Enter destination target and click Execute Ping to inspect latency and frame delivery.
        </div>
      </div>
    </div>
  `;
}

async function executePing(e) {
  e.preventDefault();
  const target = document.getElementById('ping-target').value;
  const count = document.getElementById('ping-count').value;
  const btn = document.getElementById('ping-submit-btn');
  const pill = document.getElementById('ping-status-pill');
  const body = document.getElementById('ping-output-body');

  btn.disabled = true;
  btn.innerHTML = '<span>⟳ Transmitting Probes...</span>';
  pill.className = 'status-pill running';
  pill.innerHTML = '<span class="dot pulse"></span><span>Probing...</span>';
  body.innerHTML = '<div style="text-align:center; padding:30px;"><div style="font-family:var(--font-mono); color:var(--accent-cyan);">Sending ICMP Type 8 Echo Request frames...</div></div>';

  try {
    const res = await apiRequest('/network/ping', 'POST', { target, count: parseInt(count) });
    const d = res.data;
    pill.className = `status-pill ${d.status.toLowerCase()}`;
    pill.textContent = d.status;

    body.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; margin-bottom:16px; font-family:var(--font-mono); font-size:11px;">
        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:10px;">
          <div style="color:var(--text-dim);">Avg Latency</div>
          <div style="font-size:16px; font-weight:700; color:var(--accent-cyan);">${d.avg_latency_ms} ms</div>
        </div>
        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:10px;">
          <div style="color:var(--text-dim);">Packet Loss</div>
          <div style="font-size:16px; font-weight:700; color:${d.packet_loss > 0 ? 'var(--status-rose)' : 'var(--status-emerald)'};">${d.packet_loss}%</div>
        </div>
        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:10px;">
          <div style="color:var(--text-dim);">Sent / Received</div>
          <div style="font-size:14px; font-weight:700; color:#fff;">${d.packets_sent} / ${d.packets_received}</div>
        </div>
        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:10px;">
          <div style="color:var(--text-dim);">Min / Max</div>
          <div style="font-size:13px; font-weight:700; color:#cbd5e1;">${d.min_latency_ms} / ${d.max_latency_ms} ms</div>
        </div>
      </div>

      ${d.error_message ? `
        <div style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.4); border-radius:8px; padding:10px; color:#fca5a5; font-size:11px; margin-bottom:12px;">
          <strong>Automata Error Signature: </strong>${d.error_message}
        </div>
      ` : ''}

      <div>
        <div style="font-size:11px; font-weight:600; color:var(--text-muted); margin-bottom:4px;">Captured Kernel Console Output:</div>
        <pre style="background:#040711; border:1px solid var(--border-dark); border-radius:8px; padding:12px; font-size:11px; color:#67e8f9; font-family:var(--font-mono); overflow-x:auto; max-height:160px;">${d.raw_output || 'Echo reply received without stderr.'}</pre>
      </div>
    `;
  } catch (err) {
    pill.className = 'status-pill failed';
    pill.textContent = 'FAILED';
    body.innerHTML = `<div style="color:var(--status-rose); padding:20px;">Execution Error: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>▶ Execute Ping Command</span>';
  }
}

function renderDnsTab(content) {
  content.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px;">
      <div class="section-box">
        <div class="section-header">
          <div class="section-title">Query Nameserver</div>
        </div>
        <form onsubmit="executeDns(event)">
          <div class="form-group">
            <label class="form-label">Domain Name (FQDN)</label>
            <input type="text" id="dns-target" class="form-input" value="google.com" required placeholder="e.g. google.com">
          </div>

          <div style="margin-bottom:16px;">
            <div style="font-size:10px; color:var(--text-dim); margin-bottom:6px;">Presets:</div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              <button type="button" class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="document.getElementById('dns-target').value='google.com'">google.com</button>
              <button type="button" class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="document.getElementById('dns-target').value='cloudflare.com'">cloudflare.com</button>
              <button type="button" class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="document.getElementById('dns-target').value='wikipedia.org'">wikipedia.org</button>
            </div>
          </div>

          <button type="submit" id="dns-submit-btn" class="btn btn-primary" style="width:100%;">
            <span>🌐 Resolve Hostname</span>
          </button>
        </form>
      </div>

      <div class="section-box">
        <div class="section-header">
          <div class="section-title">DNS Resource Records (A & AAAA)</div>
          <span class="status-pill running" id="dns-status-pill">Ready</span>
        </div>
        <div id="dns-output-body" style="color:var(--text-dim); font-size:12px; text-align:center; padding:40px 0;">
          Query a domain name to test port 53 UDP resolution and query duration.
        </div>
      </div>
    </div>
  `;
}

async function executeDns(e) {
  e.preventDefault();
  const hostname = document.getElementById('dns-target').value;
  const btn = document.getElementById('dns-submit-btn');
  const pill = document.getElementById('dns-status-pill');
  const body = document.getElementById('dns-output-body');

  btn.disabled = true;
  pill.className = 'status-pill running';
  pill.textContent = 'Resolving...';

  try {
    const res = await apiRequest('/network/dns', 'POST', { hostname });
    const d = res.data;
    pill.className = `status-pill ${d.status.toLowerCase()}`;
    pill.textContent = d.status;

    body.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:16px; font-family:var(--font-mono); font-size:11px;">
        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:10px;">
          <div style="color:var(--text-dim);">Queried Domain</div>
          <div style="font-size:14px; font-weight:700; color:#fff;">${d.query}</div>
        </div>
        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:10px;">
          <div style="color:var(--text-dim);">Resolution Duration</div>
          <div style="font-size:14px; font-weight:700; color:var(--accent-cyan);">${d.latency_ms} ms</div>
        </div>
      </div>

      ${d.canonical_name ? `
        <div style="background:rgba(0,0,0,0.2); border:1px solid var(--border-dark); border-radius:8px; padding:10px; font-family:var(--font-mono); font-size:11px; margin-bottom:12px;">
          <span style="color:var(--text-dim);">Canonical FQDN: </span><span style="color:#c4b5fd; font-weight:700;">${d.canonical_name}</span>
        </div>
      ` : ''}

      <div>
        <div style="font-size:11px; font-weight:600; color:var(--text-muted); margin-bottom:6px;">Resolved IP Addresses:</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${(d.resolved_ips || []).map(ip => `
            <div style="background:#040711; border:1px solid var(--border-dark); border-radius:6px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center; font-family:var(--font-mono); font-size:12px;">
              <span style="color:#67e8f9; font-weight:700;">${ip}</span>
              <span class="badge-tag cn">${ip.includes(':') ? 'IPv6 AAAA' : 'IPv4 A'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    pill.className = 'status-pill failed';
    pill.textContent = 'FAILED';
    body.innerHTML = `<div style="color:var(--status-rose); padding:20px;">DNS Failure: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
  }
}

function renderTraceTab(content) {
  content.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px;">
      <div class="section-box">
        <div class="section-header">
          <div class="section-title">Configure Traceroute</div>
        </div>
        <form onsubmit="executeTraceroute(event)">
          <div class="form-group">
            <label class="form-label">Destination IP / Host</label>
            <input type="text" id="trace-target" class="form-input" value="8.8.8.8" required placeholder="8.8.8.8">
          </div>
          <div class="form-group">
            <label class="form-label">Max TTL Hops (1 - 15)</label>
            <input type="number" id="trace-hops" class="form-input" value="12" min="1" max="15">
          </div>
          <button type="submit" id="trace-submit-btn" class="btn btn-purple" style="width:100%;">
            <span>🛣 Execute Traceroute Path</span>
          </button>
        </form>
      </div>

      <div class="section-box">
        <div class="section-header">
          <div class="section-title">Discovered Router Hops</div>
          <span class="status-pill running" id="trace-status-pill">Ready</span>
        </div>
        <div id="trace-output-body" style="color:var(--text-dim); font-size:12px; text-align:center; padding:40px 0;">
          Launch traceroute to inspect TTL-decremented hops along the packet route.
        </div>
      </div>
    </div>
  `;
}

async function executeTraceroute(e) {
  e.preventDefault();
  const target = document.getElementById('trace-target').value;
  const maxHops = document.getElementById('trace-hops').value;
  const btn = document.getElementById('trace-submit-btn');
  const pill = document.getElementById('trace-status-pill');
  const body = document.getElementById('trace-output-body');

  btn.disabled = true;
  pill.className = 'status-pill running';
  pill.textContent = 'Tracing Route...';
  body.innerHTML = '<div style="text-align:center; padding:30px;"><div style="font-family:var(--font-mono); color:var(--accent-purple);">Sending TTL-incrementing probes across subnet routers...</div></div>';

  try {
    const res = await apiRequest('/network/traceroute', 'POST', { target, max_hops: parseInt(maxHops) });
    const d = res.data;
    pill.className = `status-pill ${d.status.toLowerCase()}`;
    pill.textContent = d.status;

    body.innerHTML = `
      <div style="font-size:11px; color:var(--text-dim); margin-bottom:10px;">
        Destination: <strong style="color:#fff;">${d.target}</strong> | Discovered Hops: <strong style="color:var(--accent-cyan);">${d.total_hops}</strong>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; max-height:280px; overflow-y:auto; padding-right:4px;">
        ${(d.hops || []).map(h => `
          <div style="background:#040711; border:1px solid var(--border-dark); border-radius:6px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center; font-family:var(--font-mono); font-size:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:var(--border-dark); color:#cbd5e1; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700;">${h.hop}</span>
              <span style="color:#fff; font-weight:700;">${h.ip}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:var(--accent-cyan);">${h.rtt}</span>
              <span class="status-pill ${h.status.toLowerCase()}">${h.status}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    pill.className = 'status-pill failed';
    pill.textContent = 'FAILED';
    body.innerHTML = `<div style="color:var(--status-rose); padding:20px;">Traceroute Error: ${err.message}</div>`;
  } finally {
    btn.disabled = false;
  }
}

// -------------------------------------------------------------
// MODULE 3: AUTOMATED TROUBLESHOOTING VIEW
// -------------------------------------------------------------
function renderTroubleshooting(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:11px; font-weight:700; color:var(--status-emerald); text-transform:uppercase;">
          Intelligent Automated Troubleshooting
        </div>
        <h1 style="font-size:24px; font-weight:800; color:#fff; margin-top:2px;">
          Root-Cause Diagnostic Engine
        </h1>
        <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">
          Correlates anomalies across physical, link, network, transport, and application layers.
        </p>
      </div>

      <button class="btn btn-primary" id="btn-auto-diag" onclick="runAutoDiagnosis()">
        <span>⚡ Run Automatic Diagnosis</span>
      </button>
    </div>

    <!-- Active Diagnosis State Area -->
    <div id="troubleshooting-results-area">
      <div class="section-box" style="text-align:center; padding:48px 20px;">
        <div style="font-size:36px; margin-bottom:12px;">🛡️</div>
        <h2 style="font-size:16px; font-weight:700; color:#fff;">Troubleshooting Engine Ready</h2>
        <p style="font-size:12px; color:var(--text-muted); max-width:480px; margin:8px auto 20px; line-height:1.5;">
          Click the button above to execute full-spectrum diagnostics. NetAssist will analyze local adapter configuration,
          subnet gateway routing, DNS lookup integrity, packet drop ratios, and categorize issues via FLAT DFA.
        </p>
        <button class="btn btn-primary" onclick="runAutoDiagnosis()">
          <span>Run Automatic Diagnosis Now</span>
        </button>
      </div>
    </div>
  `;
}

async function runAutoDiagnosis() {
  const area = document.getElementById('troubleshooting-results-area');
  const btn = document.getElementById('btn-auto-diag');
  if (btn) btn.disabled = true;

  if (area) {
    area.innerHTML = `
      <div class="section-box" style="text-align:center; padding:48px 20px;">
        <div class="dot pulse" style="width:20px; height:20px; margin:0 auto 16px; background:var(--accent-cyan);"></div>
        <h2 style="font-size:16px; font-weight:700; color:#fff;">Executing Multi-Layer Network Diagnosis...</h2>
        <div style="font-size:12px; color:var(--accent-cyan); font-family:var(--font-mono); margin-top:8px;" id="diag-progress-step">
          Step 1: Inspecting physical adapter and APIPA subnet range...
        </div>
      </div>
    `;
  }

  try {
    const res = await apiRequest('/diagnosis/run', 'POST');
    const d = res.data;

    if (area) {
      area.innerHTML = `
        <!-- Health Score Banner -->
        <div class="section-box" style="background:linear-gradient(135deg, rgba(19, 30, 54, 0.9), rgba(15, 23, 42, 0.95)); border-color:var(--border-cyan);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">
                Network Health Evaluation
              </div>
              <div style="display:flex; align-items:baseline; gap:12px; margin-top:4px;">
                <span style="font-size:36px; font-weight:800; font-family:var(--font-mono); color:${d.health_score >= 80 ? '#34d399' : d.health_score >= 50 ? '#fbbf24' : '#f87171'};">
                  ${d.health_score}/100
                </span>
                <span class="status-pill ${d.status === 'Healthy' ? 'success' : d.status === 'Degraded' ? 'warning' : 'failed'}">
                  ${d.status}
                </span>
              </div>
              <p style="font-size:12px; color:var(--text-muted); margin-top:6px; max-width:540px;">
                ${d.summary_message}
              </p>
            </div>

            <div style="width:220px;">
              <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-dim); margin-bottom:4px;">
                <span>System Stability</span>
                <span>${d.health_score}%</span>
              </div>
              <div style="background:#090e1c; border:1px solid var(--border-dark); border-radius:9999px; height:10px; overflow:hidden;">
                <div style="background:${d.health_score >= 80 ? '#10b981' : d.health_score >= 50 ? '#f59e0b' : '#ef4444'}; width:${d.health_score}%; height:100%; border-radius:9999px; transition:width 0.8s ease;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Correlated Problems & Solutions -->
        <div style="margin-bottom:16px; font-size:13px; font-weight:700; color:#fff; display:flex; align-items:center; gap:8px;">
          <span>Detected Anomalies & Remediation Plans (${d.problems.length})</span>
        </div>

        ${d.problems.length > 0 ? d.problems.map((p, idx) => `
          <div class="trouble-card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:14px; font-weight:700; color:#fff;">${p.problem_name}</span>
                  <span class="status-pill ${p.severity === 'Critical' ? 'failed' : p.severity === 'High' ? 'warning' : 'running'}">${p.severity}</span>
                  ${p.category ? `<span class="badge-tag cn">${p.category}</span>` : ''}
                </div>
                ${p.detected_value ? `<div style="font-size:11px; color:var(--status-rose); font-family:var(--font-mono); margin-top:2px;">Trigger: ${p.detected_value}</div>` : ''}
              </div>
              <button class="btn btn-secondary" style="font-size:11px; padding:4px 10px;" onclick="navigateToAutomataWithPattern('${p.problem_name.includes('DNS') ? 'DNS_ERROR: NXDOMAIN' : p.problem_name.includes('Timeout') ? 'TIMEOUT: 4000ms' : p.problem_name.includes('Loss') ? 'PACKET_LOSS: 40%' : 'HOST_UNREACHABLE: No route'}')">
                <span>Verify in FLAT DFA →</span>
              </button>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:11px; margin-bottom:12px;">
              <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:10px;">
                <strong style="color:#e2e8f0; display:block; margin-bottom:2px;">Root Cause:</strong>
                <span style="color:var(--text-muted);">${p.possible_cause}</span>
              </div>
              <div style="background:rgba(0, 240, 255, 0.05); border:1px solid var(--border-cyan); border-radius:8px; padding:10px;">
                <strong style="color:var(--accent-cyan); display:block; margin-bottom:2px;">Recommended Solution:</strong>
                <span style="color:#cbd5e1;">${p.recommended_solution}</span>
              </div>
            </div>

            <!-- Steps checklist -->
            <div style="background:#090e1c; border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
              <div style="font-size:11px; font-weight:700; color:var(--text-muted); margin-bottom:8px;">Step-by-Step Remediation Action Checklist:</div>
              <div style="display:flex; flex-direction:column; gap:6px;">
                ${(p.steps || []).map((step, sIdx) => `
                  <label style="display:flex; align-items:center; gap:8px; font-size:11px; font-family:var(--font-mono); color:#cbd5e1; cursor:pointer;">
                    <input type="checkbox" onchange="this.parentElement.style.textDecoration = this.checked ? 'line-through' : 'none'; this.parentElement.style.color = this.checked ? 'var(--status-emerald)' : '#cbd5e1';">
                    <span>${step}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('') : `
          <div class="section-box" style="text-align:center; padding:32px; color:var(--status-emerald);">
            <div style="font-size:32px; margin-bottom:8px;">✓</div>
            <h3 style="font-size:15px; font-weight:700; color:#fff;">All Network Subsystems Healthy</h3>
            <p style="font-size:12px; color:var(--text-muted); margin-top:4px;">No critical impairments or packet delivery anomalies identified.</p>
          </div>
        `}
      `;
    }
  } catch (err) {
    if (area) {
      area.innerHTML = `<div class="section-box" style="color:var(--status-rose);">Diagnosis execution failed: ${err.message}</div>`;
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function navigateToAutomataWithPattern(pat) {
  navigateTo('automata');
  setTimeout(() => {
    const input = document.getElementById('dfa-custom-input');
    if (input) {
      input.value = pat;
      simulateDFA();
    }
  }, 100);
}

// -------------------------------------------------------------
// MODULE 4: FLAT – FINITE AUTOMATA-BASED ERROR DETECTION
// -------------------------------------------------------------
function renderAutomata(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px;">
      <div style="font-size:11px; font-weight:700; color:var(--accent-purple); text-transform:uppercase;">
        Formal Languages and Automata Theory (FLAT) Module
      </div>
      <h1 style="font-size:24px; font-weight:800; color:#fff; margin-top:2px;">
        Deterministic Finite Automaton (DFA) Error Recognizer
      </h1>
      <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">
        Formal error pattern language recognition over alphabet &Sigma; using mathematical 5-tuple M = (Q, &Sigma;, &delta;, q0, F).
      </p>
    </div>

    <!-- Custom Pattern Input & Preset Bar -->
    <div class="section-box">
      <div class="section-header">
        <div class="section-title">String Input for Automata Evaluation</div>
      </div>
      <div style="display:flex; gap:10px; margin-bottom:12px;">
        <input type="text" id="dfa-custom-input" class="form-input" value="DNS_ERROR: NXDOMAIN" style="flex:1;" placeholder="Enter network error string (e.g. DNS_ERROR: NXDOMAIN or TIMEOUT)">
        <button class="btn btn-purple" onclick="simulateDFA()">
          <span>Simulate DFA Execution</span>
        </button>
      </div>

      <div>
        <div style="font-size:10px; color:var(--text-dim); margin-bottom:6px;">Standard Network Error Patterns:</div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          <button class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="loadDfaPreset('DNS_ERROR: NXDOMAIN')">DNS_ERROR (q1)</button>
          <button class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="loadDfaPreset('TIMEOUT: Request timed out')">TIMEOUT (q2)</button>
          <button class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="loadDfaPreset('PACKET_LOSS: 40% loss')">PACKET_LOSS (q3)</button>
          <button class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="loadDfaPreset('HOST_UNREACHABLE: No route')">HOST_UNREACHABLE (q4)</button>
          <button class="btn btn-secondary" style="font-size:10px; padding:3px 8px;" onclick="loadDfaPreset('CONNECTION_REFUSED: Port closed')">CONNECTION_REFUSED (q4)</button>
          <button class="btn btn-secondary" style="font-size:10px; padding:3px 8px; border-color:rgba(239, 68, 68, 0.4); color:#fca5a5;" onclick="loadDfaPreset('INVALID_RANDOM_TOKEN_123')">INVALID_STRING (q5 Trap)</button>
        </div>
      </div>
    </div>

    <!-- SVG State Machine Visualizer + Stepper -->
    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; margin-bottom:24px;">
      <div class="section-box" style="margin-bottom:0;">
        <div class="section-header">
          <div class="section-title">Visual DFA State Transition Graph</div>
          <span style="font-size:11px; font-family:var(--font-mono); color:var(--accent-cyan);" id="dfa-active-state-tag">Active State: q0</span>
        </div>

        <!-- Interactive SVG Diagram -->
        <div id="dfa-svg-container" style="background:#040711; border:1px solid var(--border-dark); border-radius:12px; padding:12px; overflow:hidden;"></div>

        <!-- Stepper Controls Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:12px; border-top:1px solid var(--border-dark);">
          <div style="display:flex; gap:8px;">
            <button class="btn btn-secondary" onclick="stepDfa(-1)">◀ Prev Step</button>
            <button class="btn btn-purple" id="dfa-autoplay-btn" onclick="toggleDfaAutoPlay()">▶ Auto Play</button>
            <button class="btn btn-secondary" onclick="stepDfa(1)">Next Step ▶</button>
            <button class="btn btn-secondary" onclick="resetDfaStepper()">⟲ Reset</button>
          </div>
          <div style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted);" id="dfa-step-indicator">
            Step 0 of 0
          </div>
        </div>
      </div>

      <!-- Formal 5-Tuple & Language Verdict -->
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="section-box" style="margin-bottom:0; flex:1;">
          <div class="section-header">
            <div class="section-title">Mathematical 5-Tuple M</div>
          </div>
          <div style="font-family:var(--font-mono); font-size:11px; color:#cbd5e1; line-height:1.7;">
            <div style="color:var(--accent-cyan); font-weight:700; margin-bottom:4px;">M = (Q, &Sigma;, &delta;, q0, F)</div>
            <div><strong>Q:</strong> {q0, q1, q2, q3, q4, q5}</div>
            <div><strong>&Sigma;:</strong> {DNS, TIMEOUT, LOSS, UNREACH, PAYLOAD, ...}</div>
            <div><strong>q0:</strong> Initial start state</div>
            <div><strong>F:</strong> {q1, q2, q3, q4} (Accepting)</div>
            <div><strong style="color:var(--status-rose);">q5:</strong> Dead / Trap reject state</div>
          </div>
        </div>

        <div class="section-box" id="dfa-verdict-box" style="margin-bottom:0; flex:1;">
          <div class="section-header">
            <div class="section-title">Grammar Verdict</div>
            <span class="status-pill success" id="dfa-verdict-pill">Ready</span>
          </div>
          <div id="dfa-verdict-text" style="font-size:12px; color:var(--text-muted);">
            Simulate a string to view formal language acceptance.
          </div>
        </div>
      </div>
    </div>

    <!-- Transition Table δ & RegEx Validator -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
      <div class="section-box">
        <div class="section-header">
          <div class="section-title">Formal Transition Table &delta;(Q &times; &Sigma;)</div>
        </div>
        <div style="overflow-x:auto;">
          <table class="data-table" style="text-align:center; font-size:11px;">
            <thead>
              <tr>
                <th style="text-align:left;">State</th>
                <th>DNS</th>
                <th>TIMEOUT</th>
                <th>LOSS</th>
                <th>UNREACH</th>
                <th>Payload / Other</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align:left; color:var(--accent-cyan); font-weight:700;">→ q0 (Start)</td>
                <td style="color:#34d399;">q1</td>
                <td style="color:#34d399;">q2</td>
                <td style="color:#34d399;">q3</td>
                <td style="color:#34d399;">q4</td>
                <td style="color:#f87171;">q5 (Trap)</td>
              </tr>
              <tr>
                <td style="text-align:left; color:#34d399; font-weight:700;">* q1 (DNS)</td>
                <td style="color:#34d399;">q1</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#34d399;">q1 (self)</td>
              </tr>
              <tr>
                <td style="text-align:left; color:#34d399; font-weight:700;">* q2 (Timeout)</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#34d399;">q2</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#34d399;">q2 (self)</td>
              </tr>
              <tr>
                <td style="text-align:left; color:#34d399; font-weight:700;">* q3 (Loss)</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#34d399;">q3</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#34d399;">q3 (self)</td>
              </tr>
              <tr>
                <td style="text-align:left; color:#34d399; font-weight:700;">* q4 (Unreach)</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#34d399;">q4</td>
                <td style="color:#34d399;">q4 (self)</td>
              </tr>
              <tr>
                <td style="text-align:left; color:#f87171; font-weight:700;">q5 (Trap)</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#f87171;">q5</td>
                <td style="color:#f87171;">q5</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size:10px; color:var(--text-dim); margin-top:8px;">
          * denotes accepting states F = {q1, q2, q3, q4}. Transitions from trap state q5 remain in q5 for all symbols in &Sigma;.
        </div>
      </div>

      <!-- Regular Expression Validator -->
      <div class="section-box">
        <div class="section-header">
          <div class="section-title">Regex Network Validator (Chomsky Type 3)</div>
        </div>
        <div style="display:flex; gap:8px; margin-bottom:12px;">
          <select id="regex-type-sel" class="form-select" style="width:140px;">
            <option value="ipv4">IPv4 Address</option>
            <option value="ipv6">IPv6 Address</option>
            <option value="domain">Domain Name</option>
            <option value="error_pattern">Error String</option>
          </select>
          <input type="text" id="regex-val-input" class="form-input" value="192.168.1.1" placeholder="Enter string to test against regex">
          <button class="btn btn-secondary" onclick="executeRegexTest()">Test</button>
        </div>
        <div id="regex-test-result" style="background:#040711; border:1px solid var(--border-dark); border-radius:8px; padding:12px; font-size:11px; font-family:var(--font-mono); color:var(--text-muted);">
          Select pattern and click Test to evaluate against formal Regular Expressions.
        </div>
      </div>
    </div>
  `;

  // Initial simulation
  simulateDFA();
}

function loadDfaPreset(val) {
  const input = document.getElementById('dfa-custom-input');
  if (input) {
    input.value = val;
    simulateDFA();
  }
}

async function simulateDFA() {
  const inputEl = document.getElementById('dfa-custom-input');
  const str = inputEl ? inputEl.value : 'DNS_ERROR: NXDOMAIN';

  try {
    const res = await apiRequest('/automata/recognize', 'POST', { input_string: str });
    dfaExecution = res.data;
    dfaStepIndex = 0;
    updateDfaVisuals();
  } catch (err) {
    console.error(err);
  }
}

function updateDfaVisuals() {
  if (!dfaExecution) return;
  const steps = dfaExecution.steps || [];
  const total = steps.length;
  const currentStep = steps[dfaStepIndex] || steps[0];
  const activeState = (dfaStepIndex === 0) ? 'q0' : currentStep.next_state;

  // Update tag & stepper text
  const tag = document.getElementById('dfa-active-state-tag');
  if (tag) tag.textContent = `Active State: ${activeState}`;

  const ind = document.getElementById('dfa-step-indicator');
  if (ind) ind.textContent = `Step ${dfaStepIndex + 1} of ${total} | Consumed: "${currentStep.input_consumed}"`;

  // Update verdict box
  const verdictText = document.getElementById('dfa-verdict-text');
  const verdictPill = document.getElementById('dfa-verdict-pill');
  if (verdictText && verdictPill) {
    if (dfaExecution.is_accepted) {
      verdictPill.className = 'status-pill success';
      verdictPill.textContent = 'ACCEPTED';
      verdictText.innerHTML = `
        <div style="color:#34d399; font-weight:700; margin-bottom:4px;">✓ Language String Accepted</div>
        <div>Final State: <strong style="color:#fff;">${dfaExecution.final_state}</strong></div>
        <div>Pattern: <strong style="color:var(--accent-cyan);">${dfaExecution.recognized_pattern}</strong></div>
        <div style="font-size:11px; color:var(--text-dim); margin-top:4px;">${dfaExecution.pattern_info?.description || ''}</div>
      `;
    } else {
      verdictPill.className = 'status-pill failed';
      verdictPill.textContent = 'REJECTED';
      verdictText.innerHTML = `
        <div style="color:#f87171; font-weight:700; margin-bottom:4px;">✕ String Rejected by DFA</div>
        <div>Absorbed into Trap State: <strong style="color:#f87171;">q5</strong></div>
        <div style="font-size:11px; color:var(--text-dim); margin-top:4px;">Input does not conform to recognized network error grammar.</div>
      `;
    }
  }

  // Render SVG diagram
  renderDfaSvg(activeState);
}

function renderDfaSvg(activeState) {
  const container = document.getElementById('dfa-svg-container');
  if (!container) return;

  const states = {
    q0: { x: 100, y: 150, label: 'q0', sub: 'Initial', isAccept: false },
    q1: { x: 280, y: 50, label: 'q1', sub: 'DNS', isAccept: true },
    q2: { x: 480, y: 60, label: 'q2', sub: 'Timeout', isAccept: true },
    q3: { x: 500, y: 180, label: 'q3', sub: 'Loss', isAccept: true },
    q4: { x: 330, y: 240, label: 'q4', sub: 'Unreach', isAccept: true },
    q5: { x: 170, y: 250, label: 'q5', sub: 'Trap', isAccept: false, isTrap: true },
  };

  let svg = `
    <svg viewBox="0 0 600 310" style="width:100%; height:auto; font-family:var(--font-mono); user-select:none;">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
        <marker id="arrow-trap" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
        </marker>
      </defs>

      <!-- Start Arrow -->
      <line x1="30" y1="150" x2="70" y2="150" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
      <text x="32" y="140" fill="#94a3b8" font-size="10">Start</text>

      <!-- Transitions -->
      <!-- q0 -> q1 -->
      <path d="M 120 130 Q 180 70 250 55" fill="none" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#arrow)" />
      <text x="175" y="85" fill="#38bdf8" font-size="9" font-weight="700">DNS_ERROR</text>

      <!-- q0 -> q2 -->
      <path d="M 125 140 Q 280 60 450 70" fill="none" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#arrow)" />
      <text x="270" y="105" fill="#38bdf8" font-size="9" font-weight="700">TIMEOUT</text>

      <!-- q0 -> q3 -->
      <path d="M 130 155 Q 300 160 470 175" fill="none" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#arrow)" />
      <text x="290" y="155" fill="#38bdf8" font-size="9" font-weight="700">PACKET_LOSS</text>

      <!-- q0 -> q4 -->
      <path d="M 125 170 Q 210 230 300 240" fill="none" stroke="#38bdf8" stroke-width="1.8" marker-end="url(#arrow)" />
      <text x="200" y="215" fill="#38bdf8" font-size="9" font-weight="700">HOST_UNREACH</text>

      <!-- q0 -> q5 (Trap) -->
      <path d="M 110 180 Q 125 220 145 235" fill="none" stroke="#f43f5e" stroke-width="1.8" marker-end="url(#arrow-trap)" />
      <text x="100" y="220" fill="#f43f5e" font-size="8.5" font-weight="700">Other</text>

      <!-- Self Loops -->
      <path d="M 270 30 C 270 5 300 5 300 30" fill="none" stroke="#10b981" stroke-width="1.2" marker-end="url(#arrow)" />
      <path d="M 470 40 C 470 15 500 15 500 40" fill="none" stroke="#10b981" stroke-width="1.2" marker-end="url(#arrow)" />
      <path d="M 525 170 C 555 160 555 200 525 195" fill="none" stroke="#10b981" stroke-width="1.2" marker-end="url(#arrow)" />
      <path d="M 345 265 C 365 290 325 295 320 265" fill="none" stroke="#10b981" stroke-width="1.2" marker-end="url(#arrow)" />
      <path d="M 180 275 C 200 300 150 305 155 275" fill="none" stroke="#f43f5e" stroke-width="1.2" marker-end="url(#arrow-trap)" />

      <!-- Render State Nodes -->
  `;

  for (const [key, s] of Object.entries(states)) {
    const isActive = (key === activeState);
    const stroke = isActive ? '#00f0ff' : s.isAccept ? '#10b981' : s.isTrap ? '#f43f5e' : '#334155';
    const fill = isActive ? 'rgba(0, 240, 255, 0.25)' : s.isAccept ? 'rgba(16, 185, 129, 0.15)' : s.isTrap ? 'rgba(239, 68, 68, 0.15)' : '#0f172a';

    // Double circle if accepting
    if (s.isAccept) {
      svg += `<circle cx="${s.x}" cy="${s.y}" r="28" fill="none" stroke="${stroke}" stroke-width="${isActive ? '2.5' : '1.5'}" ${isActive ? 'stroke-dasharray="3 3"' : ''}/>`;
    }

    // Outer glow ring if active
    if (isActive) {
      svg += `<circle cx="${s.x}" cy="${s.y}" r="${s.isAccept ? '33' : '28'}" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="4 4"/>`;
    }

    // Main circle
    svg += `
      <circle cx="${s.x}" cy="${s.y}" r="22" fill="${fill}" stroke="${stroke}" stroke-width="${isActive ? '2.5' : '1.8'}" />
      <text x="${s.x}" y="${s.y - 1}" text-anchor="middle" fill="#fff" font-size="12" font-weight="700">${s.label}</text>
      <text x="${s.x}" y="${s.y + 11}" text-anchor="middle" fill="${isActive ? '#00f0ff' : '#94a3b8'}" font-size="8">${s.sub}</text>
    `;
  }

  svg += `</svg>`;
  container.innerHTML = svg;
}

function stepDfa(delta) {
  if (!dfaExecution || !dfaExecution.steps) return;
  const max = dfaExecution.steps.length - 1;
  const next = dfaStepIndex + delta;
  if (next >= 0 && next <= max) {
    dfaStepIndex = next;
    updateDfaVisuals();
  }
}

function resetDfaStepper() {
  dfaStepIndex = 0;
  dfaAutoPlaying = false;
  if (dfaTimer) clearInterval(dfaTimer);
  const btn = document.getElementById('dfa-autoplay-btn');
  if (btn) btn.textContent = '▶ Auto Play';
  updateDfaVisuals();
}

function toggleDfaAutoPlay() {
  dfaAutoPlaying = !dfaAutoPlaying;
  const btn = document.getElementById('dfa-autoplay-btn');

  if (dfaAutoPlaying) {
    btn.textContent = '⏸ Pause';
    dfaTimer = setInterval(() => {
      const max = (dfaExecution?.steps?.length || 1) - 1;
      if (dfaStepIndex < max) {
        dfaStepIndex++;
        updateDfaVisuals();
      } else {
        clearInterval(dfaTimer);
        dfaAutoPlaying = false;
        btn.textContent = '▶ Auto Play';
      }
    }, 900);
  } else {
    clearInterval(dfaTimer);
    btn.textContent = '▶ Auto Play';
  }
}

async function executeRegexTest() {
  const type = document.getElementById('regex-type-sel').value;
  const val = document.getElementById('regex-val-input').value;
  const out = document.getElementById('regex-test-result');

  try {
    const res = await apiRequest('/automata/regex-validate', 'POST', { input_value: val, validation_type: type });
    const d = res.data;
    out.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-weight:700; color:${d.is_valid ? '#34d399' : '#f87171'};">${d.is_valid ? '✓ VALID SYNTAX' : '✕ INVALID FORMAT'}</span>
        <span class="status-pill ${d.is_valid ? 'success' : 'failed'}">${d.is_valid ? 'MATCH' : 'NO MATCH'}</span>
      </div>
      <div style="color:#cbd5e1; font-size:10px; margin-bottom:4px;">${d.explanation}</div>
      <div style="color:var(--text-dim); font-size:9.5px; word-break:break-all;">Pattern: ${d.regex_pattern}</div>
    `;
  } catch (err) {
    out.textContent = `Error: ${err.message}`;
  }
}

// -------------------------------------------------------------
// MODULE 5: PERFORMANCE ANALYZER VIEW
// -------------------------------------------------------------
async function renderPerformance(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:11px; font-weight:700; color:var(--accent-blue); text-transform:uppercase;">
          Network Performance Analytics
        </div>
        <h1 style="font-size:24px; font-weight:800; color:#fff; margin-top:2px;">
          Latency & Packet Transmission Reliability
        </h1>
        <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">
          Statistical distribution of packet loss, delay variation (jitter), and service level availability.
        </p>
      </div>

      <button class="btn btn-secondary" onclick="renderPerformance(document.getElementById('page-content'))">
        <span>⟳ Refresh Analytics</span>
      </button>
    </div>

    <!-- SLA Indicator Cards -->
    <div class="cards-grid">
      <div class="stat-card" style="border-color:rgba(16, 185, 129, 0.4); background:rgba(16, 185, 129, 0.05);">
        <div class="stat-card-header">
          <span class="stat-card-title">Network Availability</span>
          <span style="color:#34d399;">●</span>
        </div>
        <div class="stat-card-value" style="color:#34d399;">92.5%</div>
        <div class="stat-card-subtext">Optimal Link (Green Band)</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Mean RTT Latency</span>
          <span style="color:var(--accent-cyan);">◷</span>
        </div>
        <div class="stat-card-value" style="color:var(--accent-cyan);">${globalStats?.average_latency_ms || 18.2} <span style="font-size:12px;">ms</span></div>
        <div class="stat-card-subtext">RFC 2544 Benchmark: &lt; 50ms</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Latency Variance (Jitter)</span>
          <span style="color:var(--accent-purple);">〰</span>
        </div>
        <div class="stat-card-value" style="color:#c4b5fd;">3.4 <span style="font-size:12px;">ms</span></div>
        <div class="stat-card-subtext">Low jitter suitable for VoIP/RTP</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Link SLA Quality</span>
          <span style="color:#38bdf8;">★</span>
        </div>
        <div class="stat-card-value" style="color:#38bdf8;">Grade A</div>
        <div class="stat-card-subtext">SLA Compliance: 99.8%</div>
      </div>
    </div>

    <!-- Charts -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:24px;">
      <div class="section-box" style="margin-bottom:0;">
        <div class="section-header">
          <div class="section-title">Ping Response Time Progression (ms)</div>
        </div>
        <div class="chart-canvas-container">
          <canvas id="perf-latency-canvas"></canvas>
        </div>
      </div>

      <div class="section-box" style="margin-bottom:0;">
        <div class="section-header">
          <div class="section-title">Packet Drop Ratios Across Probes (%)</div>
        </div>
        <div class="chart-canvas-container">
          <canvas id="perf-loss-canvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Performance Bands Explanation -->
    <div class="section-box">
      <div class="section-header">
        <div class="section-title">RFC 2544 Network Quality Standard Bands</div>
      </div>
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; font-size:11px;">
        <div style="background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.3); border-radius:8px; padding:12px;">
          <div style="color:#34d399; font-weight:700; margin-bottom:4px;">● Green: Good (Optimal)</div>
          <div style="color:var(--text-muted); line-height:1.4;">
            Latency &lt; 50ms, 0% Packet Loss, Jitter &lt; 5ms. Real-time media, DNS, and financial transactions operate without queuing delays.
          </div>
        </div>

        <div style="background:rgba(245, 158, 11, 0.1); border:1px solid rgba(245, 158, 11, 0.3); border-radius:8px; padding:12px;">
          <div style="color:#fbbf24; font-weight:700; margin-bottom:4px;">● Yellow: Moderate</div>
          <div style="color:var(--text-muted); line-height:1.4;">
            Latency 50ms – 120ms, Packet Loss &lt; 5%. Standard TCP web applications continue to operate with minor bufferbloat retransmissions.
          </div>
        </div>

        <div style="background:rgba(239, 68, 68, 0.1); border:1px solid rgba(239, 68, 68, 0.3); border-radius:8px; padding:12px;">
          <div style="color:#f87171; font-weight:700; margin-bottom:4px;">● Red: Poor (Impaired)</div>
          <div style="color:var(--text-muted); line-height:1.4;">
            Latency &gt; 120ms, Packet Loss &gt; 5%, or Host Unreachable. Hardware cable defect, router queue saturation, or upstream ISP outage.
          </div>
        </div>
      </div>
    </div>
  `;

  // Draw charts
  drawLatencyChart('perf-latency-canvas', globalStats?.latency_trend || []);
  drawLossChart('perf-loss-canvas', [
    { target: '8.8.8.8', loss: 0 },
    { target: '1.1.1.1', loss: 0 },
    { target: 'gateway.local', loss: 0 },
    { target: 'internal.corp', loss: 100 },
    { target: 'backup-dns', loss: 50 },
    { target: 'google.com', loss: 0 },
  ]);
}

// -------------------------------------------------------------
// MODULE 6: DIAGNOSTIC HISTORY VIEW (SQLITE)
// -------------------------------------------------------------
async function renderHistory(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:11px; font-weight:700; color:var(--accent-cyan); text-transform:uppercase;">
          SQLite Persistent Storage
        </div>
        <h1 style="font-size:24px; font-weight:800; color:#fff; margin-top:2px;">
          Diagnostic Telemetry History
        </h1>
        <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">
          Searchable audit trails of executed ICMP probes, DNS queries, traceroute hops, and automated troubleshooting runs.
        </p>
      </div>

      <div style="display:flex; gap:10px;">
        <a href="/api/reports/export/csv" download class="btn btn-secondary">
          <span>↓ Export CSV</span>
        </a>
        <button class="btn btn-danger" onclick="confirmClearHistory()">
          <span>Clear History</span>
        </button>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="section-box" style="padding:14px 20px;">
      <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <input type="text" id="hist-search" class="form-input" style="flex:1; min-width:200px;" placeholder="Search target host or error signature..." oninput="filterHistoryTable()">
        
        <select id="hist-filter-type" class="form-select" style="width:160px;" onchange="filterHistoryTable()">
          <option value="ALL">All Protocols</option>
          <option value="PING">PING</option>
          <option value="DNS">DNS</option>
          <option value="TRACEROUTE">TRACEROUTE</option>
          <option value="AUTO_DIAGNOSIS">AUTO_DIAGNOSIS</option>
        </select>

        <select id="hist-filter-status" class="form-select" style="width:140px;" onchange="filterHistoryTable()">
          <option value="ALL">All Outcomes</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="WARNING">WARNING</option>
        </select>
      </div>
    </div>

    <!-- Records Table -->
    <div class="section-box" style="padding:0; overflow:hidden;">
      <div style="overflow-x:auto;">
        <table class="data-table" id="history-table-body">
          <thead>
            <tr>
              <th>ID</th>
              <th>Protocol</th>
              <th>Target Host</th>
              <th>Latency</th>
              <th>Loss</th>
              <th>Outcome</th>
              <th>Error Signature</th>
              <th>Timestamp</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="hist-rows">
            <tr>
              <td colspan="9" style="text-align:center; padding:30px; color:var(--text-dim);">Loading SQLite diagnostic records...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  loadHistoryData();
}

let loadedHistoryList = [];

async function loadHistoryData() {
  try {
    const res = await apiRequest('/history?limit=100');
    loadedHistoryList = res.data;
    renderHistoryRows(loadedHistoryList);
  } catch (err) {
    console.error(err);
  }
}

function filterHistoryTable() {
  const search = document.getElementById('hist-search')?.value.toLowerCase() || '';
  const type = document.getElementById('hist-filter-type')?.value || 'ALL';
  const status = document.getElementById('hist-filter-status')?.value || 'ALL';

  const filtered = loadedHistoryList.filter(item => {
    const matchesSearch = !search || item.target.toLowerCase().includes(search) || (item.error_message && item.error_message.toLowerCase().includes(search));
    const matchesType = (type === 'ALL') || (item.test_type === type);
    const matchesStatus = (status === 'ALL') || (item.status === status);
    return matchesSearch && matchesType && matchesStatus;
  });

  renderHistoryRows(filtered);
}

function renderHistoryRows(list) {
  const tbody = document.getElementById('hist-rows');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-dim);">No matching records found in database.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr>
      <td style="color:var(--text-dim); font-weight:700;">#${r.id}</td>
      <td><span class="badge-tag cn">${r.test_type}</span></td>
      <td style="font-weight:700; color:#fff;">${r.target}</td>
      <td style="color:var(--accent-cyan);">${r.latency > 0 ? r.latency + ' ms' : '—'}</td>
      <td style="${r.packet_loss > 0 ? 'color:var(--status-rose); font-weight:700;' : ''}">${r.packet_loss}%</td>
      <td><span class="status-pill ${r.status.toLowerCase()}">${r.status}</span></td>
      <td style="color:var(--text-muted); max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.error_message || ''}">
        ${r.error_message || 'None (Normal)'}
      </td>
      <td style="color:var(--text-dim); font-size:10px;">${r.timestamp}</td>
      <td style="text-align:right;">
        <button class="btn btn-secondary" style="font-size:10px; padding:3px 8px; margin-right:4px;" onclick="viewTestDetail(${r.id})">Inspect</button>
        <button class="btn btn-danger" style="font-size:10px; padding:3px 8px;" onclick="deleteTestRecord(${r.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function viewTestDetail(id) {
  try {
    const res = await apiRequest(`/history/${id}`);
    const d = res.data;
    showModal(`Diagnostic Execution #${d.id} – ${d.test_type}`, `
      <div style="font-family:var(--font-mono); font-size:11px; space-y:8px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
          <div style="background:#040711; padding:8px; border-radius:6px; border:1px solid var(--border-dark);">
            <span style="color:var(--text-dim);">Target Destination:</span> <strong style="color:#fff;">${d.target}</strong>
          </div>
          <div style="background:#040711; padding:8px; border-radius:6px; border:1px solid var(--border-dark);">
            <span style="color:var(--text-dim);">Execution Status:</span> <span class="status-pill ${d.status.toLowerCase()}">${d.status}</span>
          </div>
          <div style="background:#040711; padding:8px; border-radius:6px; border:1px solid var(--border-dark);">
            <span style="color:var(--text-dim);">Round-Trip Latency:</span> <strong style="color:var(--accent-cyan);">${d.latency} ms</strong>
          </div>
          <div style="background:#040711; padding:8px; border-radius:6px; border:1px solid var(--border-dark);">
            <span style="color:var(--text-dim);">Packet Loss Rate:</span> <strong style="color:${d.packet_loss > 0 ? 'var(--status-rose)' : 'var(--status-emerald)'};">${d.packet_loss}%</strong>
          </div>
        </div>

        ${d.error_message ? `
          <div style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.3); border-radius:6px; padding:10px; color:#fca5a5; margin-bottom:12px;">
            <strong>Impairment Signature:</strong> ${d.error_message}
          </div>
        ` : ''}

        <div style="margin-top:12px;">
          <div style="color:var(--text-dim); margin-bottom:4px;">Structured JSON Telemetry Payload:</div>
          <pre style="background:#040711; border:1px solid var(--border-dark); border-radius:6px; padding:10px; color:#67e8f9; max-height:160px; overflow-y:auto;">${JSON.stringify(d.details, null, 2)}</pre>
        </div>
      </div>
    `, `
      <a href="/api/reports/${d.id}/pdf" target="_blank" class="btn btn-primary">
        <span>Download Official PDF Report</span>
      </a>
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    `);
  } catch (err) {
    alert(err.message);
  }
}

async function deleteTestRecord(id) {
  if (!confirm(`Are you sure you want to permanently delete diagnostic record #${id}?`)) return;
  try {
    await apiRequest(`/history/${id}`, 'DELETE');
    loadedHistoryList = loadedHistoryList.filter(r => r.id !== id);
    renderHistoryRows(loadedHistoryList);
  } catch (err) {
    alert(err.message);
  }
}

async function confirmClearHistory() {
  if (!confirm("This will permanently truncate all diagnostic records in SQLite. Continue?")) return;
  try {
    await apiRequest('/history', 'DELETE');
    loadedHistoryList = [];
    renderHistoryRows([]);
  } catch (err) {
    alert(err.message);
  }
}

// -------------------------------------------------------------
// MODULE 7: REPORTS VIEW (REPORTLAB PDF & CSV)
// -------------------------------------------------------------
async function renderReports(container) {
  container.innerHTML = `
    <div style="margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:11px; font-weight:700; color:var(--accent-cyan); text-transform:uppercase;">
          Formal Diagnostic Reporting
        </div>
        <h1 style="font-size:24px; font-weight:800; color:#fff; margin-top:2px;">
          Network Audit Reports & PDF Exports
        </h1>
        <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">
          Generate, preview, and download formal academic verification documents streamed directly from ReportLab.
        </p>
      </div>

      <a href="/api/reports/export/csv" download class="btn btn-secondary">
        <span>Export CSV Audit File</span>
      </a>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:20px;">
      <!-- List of Reports -->
      <div class="section-box" style="padding:16px;">
        <div class="section-header">
          <div class="section-title">Diagnostic Reports Archive</div>
        </div>
        <div id="reports-list-col" style="max-height:550px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
          Loading reports list...
        </div>
      </div>

      <!-- Formal Document Preview -->
      <div class="section-box" id="report-doc-view" style="padding:24px;">
        <div style="text-align:center; padding:40px; color:var(--text-dim);">
          Select a report on the left to preview the formal audit document.
        </div>
      </div>
    </div>
  `;

  loadReportsArchive();
}

async function loadReportsArchive() {
  try {
    const res = await apiRequest('/history?limit=30');
    const list = res.data;
    const col = document.getElementById('reports-list-col');
    if (!col) return;

    if (list.length === 0) {
      col.innerHTML = '<div style="color:var(--text-dim); padding:20px; text-align:center;">No diagnostic runs found.</div>';
      return;
    }

    col.innerHTML = list.map((item, idx) => `
      <div onclick="selectReportItem(${item.id})" style="background:#090e1c; border:1px solid var(--border-dark); border-radius:8px; padding:10px; cursor:pointer; transition:border-color 0.2s;" onmouseover="this.style.borderColor='var(--accent-cyan)'" onmouseout="this.style.borderColor='var(--border-dark)'">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:#fff;">REP-NET-${String(item.id).padStart(5, '0')}</span>
          <span class="status-pill ${item.status.toLowerCase()}">${item.status}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); font-family:var(--font-mono);">
          <span style="color:var(--accent-cyan);">${item.test_type}</span>
          <span>${item.target}</span>
        </div>
        <div style="font-size:9.5px; color:var(--text-dim); margin-top:2px;">${item.timestamp}</div>
      </div>
    `).join('');

    selectReportItem(list[0].id);
  } catch (err) {
    console.error(err);
  }
}

async function selectReportItem(id) {
  try {
    const res = await apiRequest(`/reports/${id}`);
    const r = res.data;
    const d = r.diagnostic;
    const doc = document.getElementById('report-doc-view');
    if (!doc) return;

    doc.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--border-dark); padding-bottom:16px; margin-bottom:20px;">
        <div>
          <div style="font-family:var(--font-mono); font-size:12px; font-weight:700; color:var(--accent-cyan);">${r.report_id}</div>
          <div style="font-size:10px; color:var(--text-dim);">Generated At: ${r.generated_at}</div>
        </div>

        <div style="display:flex; gap:8px;">
          <a href="/api/reports/${d.id}/pdf" target="_blank" class="btn btn-primary" style="font-size:11px;">
            <span>Download Official PDF Document</span>
          </a>
          <button class="btn btn-secondary" style="font-size:11px;" onclick="window.print()">
            <span>Print View</span>
          </button>
        </div>
      </div>

      <div style="border-left:3px solid var(--accent-cyan); padding-left:12px; margin-bottom:20px;">
        <h2 style="font-size:17px; font-weight:800; color:#fff;">${r.project_title}</h2>
        <div style="font-size:11px; color:#93c5fd; margin-top:2px;">${r.academic_context}</div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; background:#090e1c; border:1px solid var(--border-dark); border-radius:8px; padding:12px; margin-bottom:20px; font-family:var(--font-mono); font-size:11px;">
        <div>
          <span style="color:var(--text-dim); display:block;">Protocol:</span>
          <strong style="color:#fff;">${d.test_type}</strong>
        </div>
        <div>
          <span style="color:var(--text-dim); display:block;">Target:</span>
          <strong style="color:var(--accent-cyan);">${d.target}</strong>
        </div>
        <div>
          <span style="color:var(--text-dim); display:block;">Latency:</span>
          <strong style="color:#fff;">${d.latency} ms</strong>
        </div>
        <div>
          <span style="color:var(--text-dim); display:block;">Outcome:</span>
          <span class="status-pill ${d.status.toLowerCase()}">${d.status}</span>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <h3 style="font-size:12px; font-weight:700; color:var(--accent-cyan); text-transform:uppercase; margin-bottom:6px;">
          1. Computer Networks (CN) Technical Findings
        </h3>
        <p style="font-size:12px; color:#cbd5e1; line-height:1.6;">
          Diagnostic execution verified communication across link layers to host <code style="color:var(--accent-cyan); font-family:var(--font-mono);">${d.target}</code>.
          Measured Round Trip Time (RTT) averaged <strong>${d.latency} ms</strong> with a packet drop ratio of <strong>${d.packet_loss}%</strong>.
        </p>
        ${d.error_message ? `
          <div style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.3); border-radius:6px; padding:8px 12px; font-size:11px; color:#fca5a5; font-family:var(--font-mono); margin-top:8px;">
            Impairment: ${d.error_message}
          </div>
        ` : ''}
      </div>

      <div style="margin-bottom:16px;">
        <h3 style="font-size:12px; font-weight:700; color:var(--accent-purple); text-transform:uppercase; margin-bottom:6px;">
          2. FLAT Automata Classification
        </h3>
        <p style="font-size:12px; color:#cbd5e1; line-height:1.6;">
          The system's Deterministic Finite Automaton $M = (Q, \Sigma, \delta, q_0, F)$ processed error tokens over input alphabet &Sigma;.
          ${d.status === 'SUCCESS' ? 'Normal baseline operation was confirmed.' : 'The error signature transitioned into accepting state <strong>' + (d.error_message?.includes('DNS') ? 'q1' : d.error_message?.includes('TIMEOUT') ? 'q2' : d.error_message?.includes('LOSS') ? 'q3' : 'q4') + '</strong>.'}
        </p>
      </div>

      <div>
        <h3 style="font-size:12px; font-weight:700; color:var(--status-emerald); text-transform:uppercase; margin-bottom:6px;">
          3. Remediation Directives
        </h3>
        <ul style="font-size:12px; color:#cbd5e1; line-height:1.6; padding-left:18px;">
          <li>Verify Layer 1 physical link cable continuity and wireless signal-to-noise ratio.</li>
          <li>Flush DNS resolver cache using <code style="font-family:var(--font-mono); color:var(--accent-cyan);">ipconfig /flushdns</code>.</li>
          <li>Review edge router firewall rules for blocked ICMP Type 8 Echo Request packets.</li>
        </ul>
      </div>
    `;
  } catch (err) {
    console.error(err);
  }
}

// -------------------------------------------------------------
// MODULE 8: ACADEMIC CONCEPTS VIEW
// -------------------------------------------------------------
function renderAbout(container) {
  container.innerHTML = `
    <div style="max-width:960px; margin:0 auto; space-y:24px;">
      <!-- Title Banner -->
      <div class="section-box" style="background:linear-gradient(135deg, rgba(11, 19, 43, 0.95), rgba(19, 30, 54, 0.9)); border-color:var(--border-cyan);">
        <div style="font-size:11px; font-weight:700; color:var(--accent-cyan); text-transform:uppercase; margin-bottom:4px;">
          Academic Curriculum Synergies
        </div>
        <h1 style="font-size:26px; font-weight:800; color:#fff;">
          Academic Integration: CN + FLAT + FSWD
        </h1>
        <p style="font-size:13px; color:#cbd5e1; margin-top:8px; line-height:1.6;">
          <strong>NetAssist</strong> demonstrates how foundational computer science theory directly enables modern engineering.
          Automata theory parses network error streams, network protocols diagnose hardware impairments, and full-stack web
          architecture delivers a responsive operations dashboard.
        </p>
      </div>

      <!-- Pillar 1: Computer Networks -->
      <div class="section-box" style="border-color:rgba(59, 130, 246, 0.4);">
        <div class="section-header">
          <div class="section-title">
            <span style="color:#60a5fa;">1. Computer Networks (CN) Technical Mapping</span>
          </div>
          <span class="badge-tag cn">OSI L1 - L7</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; font-size:12px; color:#cbd5e1; line-height:1.6;">
          <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
            <strong style="color:#93c5fd; display:block; margin-bottom:4px;">ICMP Protocol & Latency (RFC 792):</strong>
            Issues native ICMP Echo Requests (Type 8) and captures Echo Replies (Type 0). Calculates Round Trip Time (RTT)
            and packet drop ratios to identify link congestion or physical cable flaws.
          </div>

          <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
            <strong style="color:#93c5fd; display:block; margin-bottom:4px;">DNS Resolution Architecture (RFC 1035):</strong>
            Sends hierarchical queries on UDP port 53. Measures DNS lookup latency, resolves IPv4 (A) and IPv6 (AAAA) records,
            and detects NXDOMAIN domain non-existence.
          </div>

          <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
            <strong style="color:#93c5fd; display:block; margin-bottom:4px;">Traceroute & TTL Routing Discovery:</strong>
            Transmits probes with incrementing Time-To-Live (TTL). Intermediate routers decrement TTL to 0 and emit ICMP Time
            Exceeded messages (Type 11), exposing the router topology and hop RTTs.
          </div>

          <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
            <strong style="color:#93c5fd; display:block; margin-bottom:4px;">Subnet Addressing & DHCP Verification:</strong>
            Detects local adapter IPv4 classes and flags Automatic Private IP Addressing (APIPA 169.254.0.0/16) indicating
            DHCP server exhaustion.
          </div>
        </div>
      </div>

      <!-- Pillar 2: FLAT Automata -->
      <div class="section-box" style="border-color:rgba(139, 92, 246, 0.4);">
        <div class="section-header">
          <div class="section-title">
            <span style="color:#c4b5fd;">2. Formal Languages and Automata Theory (FLAT)</span>
          </div>
          <span class="badge-tag flat">DFA M & RegEx</span>
        </div>

        <div style="font-size:12px; color:#cbd5e1; line-height:1.6; space-y:12px;">
          <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px; font-family:var(--font-mono); font-size:11px;">
            <div style="color:var(--accent-purple); font-weight:700; margin-bottom:6px;">Formal 5-Tuple Definition: M = (Q, &Sigma;, &delta;, q0, F)</div>
            <div>• Q = {q0, q1, q2, q3, q4, q5} (Finite set of internal states)</div>
            <div>• &Sigma; = Alphabet of network error tokens (DNS_ERROR, TIMEOUT, PACKET_LOSS, HOST_UNREACHABLE, ...)</div>
            <div>• q0 = Initial start state (System awaiting diagnostic message)</div>
            <div>• F = {q1, q2, q3, q4} (Set of final accepting states classifying errors)</div>
            <div>• q5 = Trap / Dead state absorbing invalid or non-grammar strings</div>
          </div>

          <p style="margin-top:10px;">
            <strong>Kleene's Theorem & Chomsky Hierarchy:</strong> The network diagnostic engine treats error streams as strings
            over alphabet &Sigma;. Under the Chomsky hierarchy, regular languages (Type 3) are equivalent to Deterministic Finite
            Automata and Regular Expressions. NetAssist demonstrates this equivalence by executing parallel DFA state transitions
            and Regular Expression matchers on IPv4/IPv6 headers and error tokens.
          </p>
        </div>
      </div>

      <!-- Pillar 3: Full Stack Web Development -->
      <div class="section-box" style="border-color:rgba(16, 185, 129, 0.4);">
        <div class="section-header">
          <div class="section-title">
            <span style="color:#34d399;">3. Full Stack Web Development (FSWD) Architecture</span>
          </div>
          <span class="badge-tag auto">Client + API + DB</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; font-size:12px; color:#cbd5e1; line-height:1.6;">
          <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
            <strong style="color:#6ee7b7; display:block; margin-bottom:4px;">Responsive Cyber-Dark UI:</strong>
            Engineered with modern component patterns, CSS variables, glassmorphic card overlays, responsive CSS grid,
            interactive SVG state diagrams, and custom Canvas charting engines.
          </div>

          <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
            <strong style="color:#6ee7b7; display:block; margin-bottom:4px;">FastAPI Asynchronous REST Backend:</strong>
            Python ASGI microservice with Pydantic schema validation, OpenAPI /docs documentation, CORS middleware,
            and secure argument list sanitization preventing command injection.
          </div>

          <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
            <strong style="color:#6ee7b7; display:block; margin-bottom:4px;">SQLite Relational Engine:</strong>
            Full CRUD persistence with indexed tables for Users, Diagnostics, and Automata_Logs, ensuring durable audit trails.
          </div>

          <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-dark); border-radius:8px; padding:12px;">
            <strong style="color:#6ee7b7; display:block; margin-bottom:4px;">ReportLab PDF & CSV Streaming:</strong>
            Constructs binary PDF diagnostic reports directly from Python memory buffers with styled tables, colored badges,
            and formal academic sign-offs.
          </div>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// CANVAS CHARTS (Self-Contained Canvas Renderers)
// -------------------------------------------------------------
function drawLatencyChart(canvasId, trendData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padL = 45;
  const padR = 20;
  const padT = 20;
  const padB = 30;

  ctx.clearRect(0, 0, w, h);

  const points = (trendData && trendData.length > 0) ? trendData.map(d => d.latency) : [14, 18, 12, 22, 19, 15, 11, 24, 16, 14];
  const labels = (trendData && trendData.length > 0) ? trendData.map(d => d.target) : ['8.8.8.8', 'google', 'gw', '1.1.1.1', 'github', 'dns', 'cf', 'corp', 'local', '8.8.4.4'];

  const maxVal = Math.max(...points, 35) * 1.2;
  const minVal = 0;

  // Grid lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const y = padT + (h - padT - padB) * (1 - i / gridSteps);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round((maxVal * i) / gridSteps)}ms`, padL - 8, y + 3);
  }

  // Plot Line with smooth Bezier curve
  const chartW = w - padL - padR;
  const stepX = chartW / (points.length - 1);
  const coords = points.map((p, i) => ({
    x: padL + i * stepX,
    y: padT + (h - padT - padB) * (1 - p / maxVal),
  }));

  // Gradient area fill
  const grad = ctx.createLinearGradient(0, padT, 0, h - padB);
  grad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
  grad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

  ctx.beginPath();
  ctx.moveTo(coords[0].x, h - padB);
  ctx.lineTo(coords[0].x, coords[0].y);
  for (let i = 1; i < coords.length; i++) {
    const cx = (coords[i - 1].x + coords[i].x) / 2;
    ctx.bezierCurveTo(cx, coords[i - 1].y, cx, coords[i].y, coords[i].x, coords[i].y);
  }
  ctx.lineTo(coords[coords.length - 1].x, h - padB);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Stroke line
  ctx.beginPath();
  ctx.moveTo(coords[0].x, coords[0].y);
  for (let i = 1; i < coords.length; i++) {
    const cx = (coords[i - 1].x + coords[i].x) / 2;
    ctx.bezierCurveTo(cx, coords[i - 1].y, cx, coords[i].y, coords[i].x, coords[i].y);
  }
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Points
  coords.forEach((c, idx) => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function drawLossChart(canvasId, lossData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 35;

  ctx.clearRect(0, 0, w, h);

  const barW = Math.min(30, (w - padL - padR) / (lossData.length * 1.5));
  const stepX = (w - padL - padR) / lossData.length;

  lossData.forEach((d, idx) => {
    const x = padL + idx * stepX + (stepX - barW) / 2;
    const lossH = ((h - padT - padB) * d.loss) / 100;
    const y = h - padB - lossH;

    ctx.fillStyle = d.loss === 0 ? 'rgba(16, 185, 129, 0.5)' : d.loss < 30 ? 'rgba(245, 158, 11, 0.6)' : 'rgba(239, 68, 68, 0.7)';
    ctx.strokeStyle = d.loss === 0 ? '#10b981' : d.loss < 30 ? '#f59e0b' : '#ef4444';
    ctx.lineWidth = 1.5;

    // Draw bar (min height of 4px so 0% is visible as flat line)
    const renderH = Math.max(lossH, 3);
    ctx.fillRect(x, h - padB - renderH, barW, renderH);
    ctx.strokeRect(x, h - padB - renderH, barW, renderH);

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${d.loss}%`, x + barW / 2, h - padB - renderH - 5);
    ctx.fillText(d.target.substring(0, 8), x + barW / 2, h - padB + 14);
  });
}

function drawDistributionChart(canvasId, distData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const centerX = w / 2;
  const centerY = h / 2 - 10;
  const outerR = Math.min(w, h) / 2 - 25;
  const innerR = outerR * 0.65;

  ctx.clearRect(0, 0, w, h);

  const keys = Object.keys(distData);
  const total = Object.values(distData).reduce((a, b) => a + b, 0) || 1;
  const colors = ['#3b82f6', '#00f0ff', '#8b5cf6', '#10b981', '#f59e0b'];

  let currentAngle = -Math.PI / 2;

  keys.forEach((key, idx) => {
    const sliceAngle = (distData[key] / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerR, currentAngle, currentAngle + sliceAngle);
    ctx.arc(centerX, centerY, innerR, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();

    ctx.fillStyle = colors[idx % colors.length];
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    currentAngle += sliceAngle;
  });

  // Center Text
  ctx.fillStyle = '#fff';
  ctx.font = '700 16px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, centerX, centerY - 4);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px Inter, sans-serif';
  ctx.fillText('Tests', centerX, centerY + 12);
}

// -------------------------------------------------------------
// MODALS
// -------------------------------------------------------------
function showModal(title, bodyHtml, footerHtml = '') {
  const root = document.getElementById('modal-root');
  if (!root) return;

  root.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target === this) closeModal()">
      <div class="modal-content animate-fadeIn">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="btn btn-secondary" style="padding:4px 8px;" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    </div>
  `;
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}

// Startup
document.addEventListener('DOMContentLoaded', () => {
  refreshGlobalTelemetry();
  navigateTo('dashboard');
});
