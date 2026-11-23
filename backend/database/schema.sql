-- Database Schema for NetAssist Network Troubleshooting & Diagnostic Assistant

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diagnostics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_type TEXT NOT NULL,
    target TEXT NOT NULL,
    status TEXT NOT NULL,
    latency REAL DEFAULT 0.0,
    packet_loss REAL DEFAULT 0.0,
    error_message TEXT,
    details_json TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS automata_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_string TEXT NOT NULL,
    recognized_pattern TEXT,
    final_state TEXT NOT NULL,
    accepted INTEGER NOT NULL,
    transitions_json TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diagnostics_type ON diagnostics(test_type);
CREATE INDEX IF NOT EXISTS idx_diagnostics_status ON diagnostics(status);
CREATE INDEX IF NOT EXISTS idx_diagnostics_timestamp ON diagnostics(timestamp DESC);
