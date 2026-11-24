import sqlite3
import json
import os
import hashlib
from datetime import datetime, timedelta
import random

DB_PATH = os.environ.get(
    "NETASSIST_DB_PATH",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "netassist.db")
)
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")
POSTGRES_SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "postgres_schema.sql")


class _PostgresCursor:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, parameters=()):
        return self._cursor.execute(query.replace("?", "%s"), parameters)

    def __getattr__(self, name):
        return getattr(self._cursor, name)


class _PostgresConnection:
    def __init__(self, connection):
        self._connection = connection

    def cursor(self):
        return _PostgresCursor(self._connection.cursor())

    def __getattr__(self, name):
        return getattr(self._connection, name)


def get_connection():
    database_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    if database_url:
        import psycopg
        from psycopg.rows import dict_row

        return _PostgresConnection(psycopg.connect(database_url, row_factory=dict_row))
    if os.environ.get("VERCEL"):
        raise RuntimeError("Configure DATABASE_URL or POSTGRES_URL with a persistent PostgreSQL database")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def init_db():
    conn = get_connection()
    try:
        is_postgres = isinstance(conn, _PostgresConnection)
        if is_postgres:
            with open(POSTGRES_SCHEMA_PATH, "r", encoding="utf-8") as schema_file:
                for statement in schema_file.read().split(";"):
                    if statement.strip():
                        conn.cursor().execute(statement)
        else:
            with open(SCHEMA_PATH, "r", encoding="utf-8") as schema_file:
                conn.executescript(schema_file.read())
        conn.commit()

        cursor = conn.cursor()
        if not is_postgres:
            cursor.execute("SELECT COUNT(*) as count FROM users")
            if cursor.fetchone()["count"] == 0:
                cursor.execute(
                    "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
                    ("admin", "admin@netassist.local", hash_password("admin123"))
                )
                cursor.execute(
                    "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
                    ("network_engineer", "engineer@netassist.local", hash_password("netpass123"))
                )

        cursor.execute("SELECT COUNT(*) as count FROM diagnostics")
        if cursor.fetchone()["count"] == 0:
            seed_sample_diagnostics(conn)

        cursor.execute("SELECT COUNT(*) as count FROM automata_logs")
        if cursor.fetchone()["count"] == 0:
            seed_automata_logs(conn)

        conn.commit()
    finally:
        conn.close()

def seed_sample_diagnostics(conn):
    sample_tests = [
        ("PING", "8.8.8.8", "SUCCESS", 14.2, 0.0, None, {"packets_sent": 4, "packets_received": 4, "min_rtt": 12.1, "avg_rtt": 14.2, "max_rtt": 16.5}),
        ("PING", "1.1.1.1", "SUCCESS", 11.5, 0.0, None, {"packets_sent": 4, "packets_received": 4, "min_rtt": 10.2, "avg_rtt": 11.5, "max_rtt": 13.0}),
        ("DNS", "google.com", "SUCCESS", 18.4, 0.0, None, {"query": "google.com", "resolved_ips": ["142.250.190.46"], "query_time_ms": 18.4}),
        ("DNS", "internal-portal.corp", "FAILED", 0.0, 100.0, "DNS_ERROR: Non-existent domain (NXDOMAIN)", {"query": "internal-portal.corp", "error": "NXDOMAIN"}),
        ("PING", "192.168.1.1", "SUCCESS", 2.1, 0.0, None, {"packets_sent": 4, "packets_received": 4, "min_rtt": 1.5, "avg_rtt": 2.1, "max_rtt": 2.8}),
        ("PING", "10.254.254.1", "FAILED", 0.0, 100.0, "TIMEOUT: Request timed out after 4000ms", {"packets_sent": 4, "packets_received": 0}),
        ("TRACEROUTE", "8.8.8.8", "SUCCESS", 22.8, 0.0, None, {"hops": [{"hop": 1, "ip": "192.168.1.1", "rtt": "2.1ms"}, {"hop": 2, "ip": "10.100.0.1", "rtt": "8.4ms"}, {"hop": 3, "ip": "8.8.8.8", "rtt": "22.8ms"}]}),
        ("CONNECTIVITY", "internet", "SUCCESS", 15.0, 0.0, None, {"gateway": "192.168.1.1", "dns": "8.8.8.8", "status": "Online", "mode": "Direct"}),
        ("PING", "198.51.100.25", "FAILED", 0.0, 100.0, "HOST_UNREACHABLE: Destination host unreachable", {"packets_sent": 4, "packets_received": 0}),
        ("DNS", "github.com", "SUCCESS", 24.1, 0.0, None, {"query": "github.com", "resolved_ips": ["140.82.121.4"], "query_time_ms": 24.1}),
        ("PING", "gateway.local", "SUCCESS", 1.8, 0.0, None, {"packets_sent": 4, "packets_received": 4, "avg_rtt": 1.8}),
        ("PING", "backup-dns.corp", "FAILED", 145.0, 50.0, "PACKET_LOSS: 50% packet loss detected", {"packets_sent": 4, "packets_received": 2, "avg_rtt": 145.0}),
    ]
    
    cursor = conn.cursor()
    now = datetime.now()
    for idx, (ttype, target, status, lat, loss, err, details) in enumerate(sample_tests):
        ts = now - timedelta(minutes=(len(sample_tests) - idx) * 15)
        cursor.execute(
            """INSERT INTO diagnostics 
               (test_type, target, status, latency, packet_loss, error_message, details_json, timestamp) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (ttype, target, status, lat, loss, err, json.dumps(details), ts)
        )

def seed_automata_logs(conn):
    logs = [
        ("DNS_ERROR", "DNS_ERROR", "q1", 1, [("q0", "DNS", "q1")]),
        ("TIMEOUT", "TIMEOUT", "q2", 1, [("q0", "TIMEOUT", "q2")]),
        ("PACKET_LOSS", "PACKET_LOSS", "q3", 1, [("q0", "PACKET", "q3")]),
        ("UNKNOWN_SIGNAL_xyz", None, "q5", 0, [("q0", "UNKNOWN", "q5")]),
        ("HOST_UNREACHABLE", "HOST_UNREACHABLE", "q4", 1, [("q0", "HOST", "q4")]),
    ]
    cursor = conn.cursor()
    now = datetime.now()
    for idx, (inp, pat, fstate, acc, trans) in enumerate(logs):
        ts = now - timedelta(minutes=(len(logs) - idx) * 20)
        cursor.execute(
            """INSERT INTO automata_logs 
               (input_string, recognized_pattern, final_state, accepted, transitions_json, timestamp) 
               VALUES (?, ?, ?, ?, ?, ?)""",
            (inp, pat, fstate, acc, json.dumps(trans), ts)
        )

# Database CRUD functions
def add_diagnostic(test_type: str, target: str, status: str, latency: float, packet_loss: float, error_message: str = None, details: dict = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    query = """INSERT INTO diagnostics
               (test_type, target, status, latency, packet_loss, error_message, details_json)
               VALUES (?, ?, ?, ?, ?, ?, ?)"""
    if isinstance(conn, _PostgresConnection):
        cursor.execute(
            query + " RETURNING id",
            (test_type, target, status, latency, packet_loss, error_message, json.dumps(details) if details else None)
        )
        new_id = cursor.fetchone()["id"]
    else:
        cursor.execute(
            query,
            (test_type, target, status, latency, packet_loss, error_message, json.dumps(details) if details else None)
        )
        new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def get_diagnostics(limit: int = 100, test_type: str = None, status: str = None, search: str = None):
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM diagnostics WHERE 1=1"
    params = []
    
    if test_type and test_type.upper() != "ALL":
        query += " AND test_type = ?"
        params.append(test_type.upper())
        
    if status and status.upper() != "ALL":
        query += " AND status = ?"
        params.append(status.upper())
        
    if search:
        query += " AND (target LIKE ? OR error_message LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term])
        
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    for row in rows:
        if row.get("details_json"):
            try:
                row["details"] = json.loads(row["details_json"])
            except Exception:
                row["details"] = {}
        else:
            row["details"] = {}
    return rows

def get_diagnostic_by_id(diag_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM diagnostics WHERE id = ?", (diag_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        if d.get("details_json"):
            try:
                d["details"] = json.loads(d["details_json"])
            except Exception:
                d["details"] = {}
        else:
            d["details"] = {}
        return d
    return None

def delete_diagnostic(diag_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM diagnostics WHERE id = ?", (diag_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def clear_all_diagnostics() -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM diagnostics")
    conn.commit()
    conn.close()
    return True

def get_dashboard_stats():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as total FROM diagnostics")
    total = cursor.fetchone()["total"]
    
    cursor.execute("SELECT COUNT(*) as success FROM diagnostics WHERE status = 'SUCCESS'")
    success = cursor.fetchone()["success"]
    
    cursor.execute("SELECT COUNT(*) as failed FROM diagnostics WHERE status = 'FAILED'")
    failed = cursor.fetchone()["failed"]
    
    cursor.execute("SELECT AVG(latency) as avg_lat FROM diagnostics WHERE latency > 0")
    row_lat = cursor.fetchone()["avg_lat"]
    avg_latency = round(row_lat, 2) if row_lat else 0.0
    
    # Recent 10 tests for timeline/chart
    cursor.execute("SELECT id, test_type, target, status, latency, packet_loss, timestamp FROM diagnostics ORDER BY id DESC LIMIT 10")
    recent = [dict(r) for r in cursor.fetchall()]
    
    # Latency trend (last 15 tests where latency > 0)
    cursor.execute("SELECT id, target, latency, timestamp FROM diagnostics WHERE latency > 0 ORDER BY id DESC LIMIT 15")
    latency_trend = [dict(r) for r in cursor.fetchall()]
    latency_trend.reverse() # chronological order
    
    # Test type breakdown
    cursor.execute("SELECT test_type, COUNT(*) as count FROM diagnostics GROUP BY test_type")
    type_distribution = {r["test_type"]: r["count"] for r in cursor.fetchall()}
    
    conn.close()
    
    success_rate = round((success / total * 100), 1) if total > 0 else 100.0
    
    return {
        "total_tests": total,
        "successful_connections": success,
        "failed_connections": failed,
        "success_rate": success_rate,
        "average_latency_ms": avg_latency,
        "network_status": "Online" if (success >= failed or total == 0) else "Degraded",
        "recent_activities": recent,
        "latency_trend": latency_trend,
        "type_distribution": type_distribution
    }

def add_automata_log(input_string: str, recognized_pattern: str, final_state: str, accepted: bool, transitions: list) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    query = """INSERT INTO automata_logs
               (input_string, recognized_pattern, final_state, accepted, transitions_json)
               VALUES (?, ?, ?, ?, ?)"""
    if isinstance(conn, _PostgresConnection):
        cursor.execute(
            query + " RETURNING id",
            (input_string, recognized_pattern, final_state, 1 if accepted else 0, json.dumps(transitions))
        )
        new_id = cursor.fetchone()["id"]
    else:
        cursor.execute(
            query,
            (input_string, recognized_pattern, final_state, 1 if accepted else 0, json.dumps(transitions))
        )
        new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def get_automata_logs(limit: int = 20):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM automata_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    for row in rows:
        row["accepted"] = bool(row["accepted"])
        if row.get("transitions_json"):
            try:
                row["transitions"] = json.loads(row["transitions_json"])
            except Exception:
                row["transitions"] = []
    return rows
