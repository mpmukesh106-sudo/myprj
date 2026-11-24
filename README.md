# NetAssist – Network Troubleshooting and Automated Diagnostic Assistant
### An Integrated Academic Project Combining:
1. **Computer Networks (CN)**
2. **Formal Languages and Automata Theory (FLAT)**
3. **Full Stack Web Development (FSWD)**

---

## 1. Project Introduction

**NetAssist** is an intelligent, full-stack network diagnostics and automated troubleshooting assistant designed for network engineers, system administrators, and academic researchers. The system identifies, classifies, and remediates network connectivity impairments across physical, data link, network, transport, and application layers.

What distinguishes NetAssist is its formal academic integration:
- **Computer Networks (CN):** Direct kernel-level execution of ICMP Echo requests, DNS resolver queries (A/AAAA records), hop-by-hop Traceroute (TTL expired discovery), and subnet interface routing.
- **Formal Languages and Automata Theory (FLAT):** A mathematically defined **Deterministic Finite Automaton (DFA)** $M = (Q, \Sigma, \delta, q_0, F)$ and Regular Expression engine that categorizes unstructured network error streams into formal language states and detects unrecognized tokens in a designated dead/trap state.
- **Full Stack Web Development (FSWD):** A modern, responsive cyber-dark technology dashboard with interactive SVG state transition diagrams, real-time Canvas telemetry charts, an asynchronous Python FastAPI REST backend, SQLite relational persistence, and dynamic ReportLab PDF generation.

---

## 2. Problem Statement & Objectives

### Problem Statement
Modern enterprise networks encounter frequent impairments such as DNS resolution timeouts, gateway routing drops, packet loss from congestion, and misconfigured link-local APIPA addresses. Troubleshooting these issues typically requires running fragmented command-line utilities (`ping`, `nslookup`, `traceroute`, `ipconfig`) and manually correlating unstructured text error messages. Furthermore, computer science curricula often teach Computer Networks, Automata Theory, and Web Engineering in isolation, missing the opportunity to demonstrate how formal language theory directly powers network error classification.

### Project Objectives
- **Automated Root-Cause Diagnosis:** Implement a one-click automated diagnostic engine evaluating physical adapters, default gateway reachability, nameserver latency, and WAN routing.
- **Formal Language Error Recognition:** Model network failure modes as strings over an alphabet $\Sigma$ and execute a 6-state DFA $M = (Q, \Sigma, \delta, q_0, F)$ with step-by-step state playback.
- **Production-Grade Full Stack Platform:** Deliver an interactive web dashboard with zero mock buttons, full SQLite CRUD persistence, CSV export, and PDF generation.

---

## 3. Technology Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, CSS3, JavaScript (ES6+), React.js | Modern cyber-dark UI, responsive sidebar, stateful components |
| **Styling & Theme** | Cyber-Dark & Blue Palette (`#080d1a`, `#00f0ff`, `#3b82f6`) | High-tech visual aesthetics, glowing borders, status badges |
| **Visualizations** | HTML5 Canvas, SVG Vector Graphics | Real-time Latency Line Charts, Packet Loss Bars, DFA State Diagram |
| **Backend Server** | Python 3.10+, FastAPI, Uvicorn (ASGI) | Asynchronous RESTful API microservice with OpenAPI `/docs` |
| **Database** | SQLite 3 | Durable relational persistence for Users, Diagnostics, and Automata Logs |
| **Networking (CN)** | Python `socket`, `subprocess`, `platform`, `ipaddress` | ICMP Echo probes, DNS resolution, Traceroute TTL discovery |
| **Automata (FLAT)** | Deterministic Finite Automata (DFA), Python `re` | State transition functions, transition table $\delta$, RegEx matching |
| **Reporting** | ReportLab 5.x, Python `csv` | Binary PDF document generation and CSV telemetry export |

---

## 4. Academic Core Integration (CN + FLAT + FSWD)

### Pillar 1: Computer Networks (CN)
- **Layer 3 (Network):** ICMP Echo Probes (RFC 792) measuring Round Trip Time (RTT min/avg/max) and packet drop percentages. Detection of default gateway router reachability.
- **Layer 4 (Transport):** Detection of TCP connection timeouts, SYN-ACK packet drops, and port closed / connection refused signatures.
- **Layer 7 (Application):** DNS Resolution (RFC 1035) querying nameservers over UDP port 53, resolving IPv4 (A) and IPv6 (AAAA) records, and measuring resolver latency.
- **Layer 2 / Addressing:** Identification of valid private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) versus Automatic Private IP Addressing (APIPA `169.254.0.0/16`), signaling DHCP failure.

### Pillar 2: Formal Languages and Automata Theory (FLAT)
- **Formal 5-Tuple Specification:**
  $$M = (Q, \Sigma, \delta, q_0, F)$$
  - $Q = \{q_0, q_1, q_2, q_3, q_4, q_5\}$ (Finite set of states)
  - $\Sigma = \{\text{DNS\_ERROR}, \text{TIMEOUT}, \text{PACKET\_LOSS}, \text{HOST\_UNREACHABLE}, \text{CONNECTION\_REFUSED}, \text{NETWORK\_UNAVAILABLE}, \text{PAYLOAD}, \dots\}$
  - $q_0 = \text{Initial State (Awaiting Diagnostic Signal)}$
  - $F = \{q_1, q_2, q_3, q_4\}$ (Set of final accepting states)
  - $q_5 = \text{Dead / Trap State (Absorbing Unrecognized Tokens)}$

- **State Meanings:**
  - $q_0$: Initial state awaiting input stream.
  - $q_1$: Accepting state $\to$ Classified as **DNS Resolution Failure** (Layer 7).
  - $q_2$: Accepting state $\to$ Classified as **Connection / Request Timeout** (Layer 4/3).
  - $q_3$: Accepting state $\to$ Classified as **Packet Transmission Loss** (Layer 2/3).
  - $q_4$: Accepting state $\to$ Classified as **Host Unreachable / Refused** (Layer 3/4).
  - $q_5$: Dead / Trap state $\to$ Rejection of non-grammar tokens ($\delta(q_5, \sigma) = q_5, \forall \sigma \in \Sigma$).

- **Transition Table $\delta(Q \times \Sigma)$:**
  | State | DNS_ERROR | TIMEOUT | PACKET_LOSS | HOST_UNREACH / REFUSED | Payload / Other |
  | :--- | :---: | :---: | :---: | :---: | :---: |
  | **$\to q_0$ (Start)** | $q_1$ | $q_2$ | $q_3$ | $q_4$ | $q_5$ (Trap) |
  | **$* q_1$ (DNS)** | $q_1$ | $q_5$ | $q_5$ | $q_5$ | $q_1$ (Self-loop) |
  | **$* q_2$ (Timeout)** | $q_5$ | $q_2$ | $q_5$ | $q_5$ | $q_2$ (Self-loop) |
  | **$* q_3$ (Loss)** | $q_5$ | $q_5$ | $q_3$ | $q_5$ | $q_3$ (Self-loop) |
  | **$* q_4$ (Unreach)** | $q_5$ | $q_5$ | $q_5$ | $q_4$ | $q_4$ (Self-loop) |
  | **$q_5$ (Trap / Reject)**| $q_5$ | $q_5$ | $q_5$ | $q_5$ | $q_5$ (Trap) |

- **Kleene's Theorem & Regular Expressions:**
  Demonstrates that regular languages accepted by Finite Automata are equivalent to expressions over $\Sigma$:
  - IPv4 RegEx: `^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$`
  - Error Pattern RegEx: `^(DNS_ERROR|TIMEOUT|PACKET_LOSS|HOST_UNREACHABLE|CONNECTION_REFUSED|NETWORK_UNAVAILABLE)(:\s*[\w\s\.-]+)?$`

### Pillar 3: Full Stack Web Development (FSWD)
- **Client-Server Architecture:** Decoupled RESTful design where the frontend interacts with FastAPI backend endpoints using standard JSON schemas.
- **Interactive Data Visualization:** Custom HTML5 Canvas rendering of latency progression lines with gradient fills and packet drop bar charts.
- **Durable Persistence:** Parameterized SQLite operations preventing SQL injection with index-optimized query filters.
- **Binary Streaming:** Dynamic PDF generation using ReportLab flowable tables, paragraphs, and colored hex palettes streamed over HTTP.

---

## 5. System Architecture

```
+-----------------------------------------------------------------------------------+
|                            NETASSIST CLIENT BROWSER                               |
|   +-------------------+  +------------------------+  +------------------------+   |
|   | Dashboard & Cards |  | CN Network Diagnostics |  | FLAT DFA Visualizer    |   |
|   | (Canvas Charts)   |  | (Ping, DNS, Trace)     |  | (SVG State Graph)      |   |
|   +-------------------+  +------------------------+  +------------------------+   |
|   +-------------------+  +------------------------+  +------------------------+   |
|   | Troubleshooting   |  | History (Search/Filter)|  | Reports (PDF / CSV)    |   |
|   +-------------------+  +------------------------+  +------------------------+   |
+------------------------------------------+----------------------------------------+
                                           | HTTP REST API (/api/*)
                                           v
+-----------------------------------------------------------------------------------+
|                             FASTAPI ASGI BACKEND ENGINE                           |
|   +---------------------+  +----------------------+  +------------------------+   |
|   | Route Controllers   |  | Pydantic Schemas     |  | CORS Middleware        |   |
|   | /api/network/*      |  | Models & Validation  |  | Static File Server     |   |
|   | /api/automata/*     |  |                      |  |                        |   |
|   +---------------------+  +----------------------+  +------------------------+   |
|                                          |                                        |
|         +--------------------------------+-------------------------------+        |
|         v                                v                               v        |
|   +--------------------+       +--------------------+       +-----------------+   |
|   | Network Engine(CN) |       | FLAT DFA Engine    |       | ReportLab PDF   |   |
|   | ICMP, DNS, Trace   |       | States q0 - q5     |       | & CSV Generator |   |
|   +--------------------+       +--------------------+       +-----------------+   |
|                                          |                                        |
|                                          v                                        |
|                          +-------------------------------+                        |
|                          |     SQLite Database Engine    |                        |
|                          | Users | Diagnostics | Automata|                        |
|                          +-------------------------------+                        |
+-----------------------------------------------------------------------------------+
```

---

## 6. Database Schema

The application uses an SQLite database (`backend/database/netassist.db`):

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diagnostics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_type TEXT NOT NULL,          -- 'PING', 'DNS', 'TRACEROUTE', 'AUTO_DIAGNOSIS'
    target TEXT NOT NULL,             -- IP address or Hostname
    status TEXT NOT NULL,             -- 'SUCCESS', 'FAILED', 'WARNING'
    latency REAL DEFAULT 0.0,         -- Round trip latency in milliseconds
    packet_loss REAL DEFAULT 0.0,     -- Drop percentage (0.0 - 100.0)
    error_message TEXT,               -- Normalized error string
    details_json TEXT,                -- Full JSON telemetry payload
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS automata_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_string TEXT NOT NULL,
    recognized_pattern TEXT,
    final_state TEXT NOT NULL,        -- 'q1', 'q2', 'q3', 'q4', or 'q5'
    accepted INTEGER NOT NULL,        -- 1 = Accepted, 0 = Rejected
    transitions_json TEXT,            -- Step-by-step state sequence
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. REST API Documentation

| Method | Endpoint | Description | Sample Payload / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Aggregated telemetry, KPIs, latency trends | — |
| `GET` | `/api/network/status` | Link status, local adapter IP, gateway reachability | — |
| `GET` | `/api/network/ip` | Detailed IP addressing (local, public, gateway) | — |
| `POST` | `/api/network/ping` | Executes ICMP ping and logs to SQLite | `{"target": "8.8.8.8", "count": 4}` |
| `POST` | `/api/network/dns` | Executes DNS query and resolves A/AAAA records | `{"hostname": "google.com"}` |
| `POST` | `/api/network/traceroute` | Executes hop-by-hop traceroute | `{"target": "8.8.8.8", "max_hops": 15}` |
| `POST` | `/api/diagnosis/run` | Runs automated end-to-end multi-layer diagnosis | — |
| `POST` | `/api/automata/recognize` | Executes DFA state machine on error string | `{"input_string": "DNS_ERROR: NXDOMAIN"}` |
| `GET` | `/api/automata/transitions`| Returns DFA 5-tuple, alphabet, and $\delta$ table | — |
| `POST` | `/api/automata/regex-validate`| Validates IPv4, IPv6, domain, or error string | `{"input_value": "192.168.1.1", "validation_type": "ipv4"}` |
| `GET` | `/api/history` | Retrieves filtered diagnostic test history | `?test_type=PING&status=SUCCESS` |
| `DELETE`| `/api/history/{id}` | Deletes individual diagnostic record | — |
| `DELETE`| `/api/history` | Truncates all test history in SQLite | — |
| `GET` | `/api/reports/{id}` | Returns structured report metadata | — |
| `GET` | `/api/reports/{id}/pdf` | Streams official ReportLab PDF document | Direct browser download |
| `GET` | `/api/reports/export/csv` | Streams diagnostic history as downloadable CSV | Direct browser download |
| `POST` | `/api/auth/login` | Authenticates administrator or user | `{"username": "admin", "password": "admin123"}` |

---

## 8. Installation & Setup Guide

### Prerequisites
- **Python 3.10+** (Tested on Python 3.14)
- **Web Browser** (Google Chrome, Microsoft Edge, Firefox, or Safari)
- Standard system network binaries (`ping`, `tracert` / `traceroute`)

### Step 1: Clone or Navigate to the Project
```bash
cd network-diagnostic-assistant
```

### Step 2: Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```
*(Dependencies: `fastapi`, `uvicorn`, `pydantic`, `reportlab`, `pillow`)*

### Step 3: Run the Application
Start the full-stack server with one simple command:
```bash
python backend/app.py
```

### Step 4: Access NetAssist in Your Browser
Open your browser to:
- **Web Dashboard:** `http://127.0.0.1:8000`
- **Interactive Swagger API Docs:** `http://127.0.0.1:8000/docs`
- **Alternative Redoc API Docs:** `http://127.0.0.1:8000/redoc`

**Default Admin Credentials:**
- **Username:** `admin`
- **Password:** `admin123`
- These demo credentials are for local development only.

## Vercel Deployment

The root `vercel.json` builds the React frontend, and FastAPI serves its assets and API. Configure these environment variables in the Vercel project before deploying:

- `DATABASE_URL` (or `POSTGRES_URL`): a persistent PostgreSQL connection string.
- `NETASSIST_ADMIN_USERNAME`: the deployment administrator username.
- `NETASSIST_ADMIN_PASSWORD`: a strong administrator password.
- `NETASSIST_AUTH_SECRET`: a randomly generated secret used to sign API access tokens.

The Vercel backend rejects unauthenticated API requests. Do not use the local demo credentials in production. Network checks run from Vercel's serverless environment, not from a visitor's device or local network; ICMP ping and traceroute availability depends on the runtime.

---

## 9. Verification & Automated Test Suite

NetAssist includes an automated integration test suite that tests all critical modules:

To execute the test suite:
```bash
python backend/test_app.py
```

### Test Suite Output:
```text
============================================================
  RUNNING NETASSIST COMPREHENSIVE INTEGRATION TEST SUITE
============================================================
  [PASS] Protected API rejects unauthenticated requests
  [PASS] Protected API rejects invalid tokens
  [PASS] User Authentication (admin / admin123)
  [PASS] API Health Check
  [PASS] Frontend Static Index Served
  [PASS] Frontend client-side routes are served
  [PASS] Dashboard Telemetry API
  [PASS] Network Status & Routing API
  [PASS] ICMP Ping Execution (127.0.0.1)
  [PASS] DNS Resolver API (localhost)
  [PASS] Automated Diagnosis Engine
  [PASS] FLAT DFA Recognition (DNS_ERROR -> q1 accepted)
  [PASS] FLAT DFA Recognition (TIMEOUT -> q2 accepted)
  [PASS] FLAT DFA Rejection (Unrecognized string -> q5 Trap)
  [PASS] DFA Mathematical 5-Tuple & Transition Table
  [PASS] RegEx IPv4 Validator (Valid IP)
  [PASS] RegEx IPv4 Validator (Invalid IP Rejection)
  [PASS] SQLite Diagnostic History Retrieval
  [PASS] ReportLab PDF Report Generation
  [PASS] CSV Telemetry Export
============================================================
  TEST RESULTS: 20 / 20 PASSED (100% Success Rate)
============================================================
```

---

## 10. Future Enhancements
- **LLM Diagnostic Summarization:** Integration of local LLM models (e.g. Ollama Llama 3) for natural language post-mortems.
- **SNMP Telemetry Probing:** Automated MIB polling for enterprise core switches and routers.
- **WebSocket Streaming:** Real-time push notifications of packet drops and link flapping events.
- **Pushdown Automata (PDA):** Extending FLAT theory into Context-Free Grammars (CFGs) for nested HTTP protocol parsing.

---

## 11. Academic Evaluation Sign-Off
- **Course Titles:** Computer Networks (CN) • Formal Languages & Automata Theory (FLAT) • Full Stack Web Development (FSWD)
- **Project Title:** NetAssist – Network Troubleshooting & Automated Diagnostic Assistant
- **Architecture:** Fast Asynchronous Python Microservice + Deterministic Finite Automata + Cyber-Dark Reactive Dashboard
- **License:** Educational / Academic MIT License
