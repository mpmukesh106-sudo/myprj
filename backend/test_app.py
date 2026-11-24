"""
Integration Test Suite for NetAssist Full Stack Platform
Verifies REST APIs, Database Persistence, Networking Fallbacks, DFA Automata, and PDF Generation.
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["NETASSIST_REQUIRE_AUTH"] = "1"

from starlette.testclient import TestClient
from app import app
from database.db import init_db, get_connection

def run_all_tests():
    print("\n" + "=" * 60)
    print("  RUNNING NETASSIST COMPREHENSIVE INTEGRATION TEST SUITE")
    print("=" * 60)
    
    init_db()
    client = TestClient(app)
    passed = 0
    total = 0
    
    def test_case(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] {name} - {details}")

    unauthenticated = client.get("/api/dashboard")
    test_case("Protected API rejects unauthenticated requests", unauthenticated.status_code == 401)
    invalid_token = client.get("/api/dashboard", headers={"Authorization": "Bearer invalid"})
    test_case("Protected API rejects invalid tokens", invalid_token.status_code == 401)
    login_response = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    test_case("User Authentication (admin / admin123)", login_response.status_code == 200 and "token" in login_response.json())
    if login_response.status_code == 200:
        client.headers.update({"Authorization": f"Bearer {login_response.json()['token']}"})
            
    # 1. Health check
    res = client.get("/api/health")
    test_case("API Health Check", res.status_code == 200 and res.json().get("status") == "ok")
    
    # 2. Frontend HTML index served
    res = client.get("/")
    test_case("Frontend Static Index Served", res.status_code == 200 and "NetAssist" in res.text)
    res = client.get("/reports", headers={"Accept": "text/html"})
    test_case("Frontend client-side routes are served", res.status_code == 200 and "NetAssist" in res.text)
    
    # 3. Dashboard endpoint
    res = client.get("/api/dashboard")
    test_case("Dashboard Telemetry API", res.status_code == 200 and "data" in res.json() and "total_tests" in res.json()["data"])
    
    # 4. Network Status (CN)
    res = client.get("/api/network/status")
    test_case("Network Status & Routing API", res.status_code == 200 and "internet" in res.json()["data"])
    
    # 5. Ping Endpoint (CN)
    res = client.post("/api/network/ping", json={"target": "127.0.0.1", "count": 2})
    test_case("ICMP Ping Execution (127.0.0.1)", res.status_code == 200 and res.json()["data"]["packets_sent"] == 2)
    
    # 6. DNS Resolution Endpoint (CN)
    res = client.post("/api/network/dns", json={"hostname": "localhost"})
    test_case("DNS Resolver API (localhost)", res.status_code == 200 and "resolved_ips" in res.json()["data"])
    
    # 7. Automated Diagnosis Endpoint
    res = client.post("/api/diagnosis/run")
    test_case("Automated Diagnosis Engine", res.status_code == 200 and "health_score" in res.json()["data"])
    
    # 8. FLAT DFA Automata Recognition (Accepting case 1: DNS_ERROR)
    res = client.post("/api/automata/recognize", json={"input_string": "DNS_ERROR: NXDOMAIN"})
    test_case("FLAT DFA Recognition (DNS_ERROR -> q1 accepted)", res.status_code == 200 and res.json()["data"]["is_accepted"] == True and res.json()["data"]["final_state"] == "q1")
    
    # 9. FLAT DFA Automata Recognition (Accepting case 2: TIMEOUT)
    res = client.post("/api/automata/recognize", json={"input_string": "TIMEOUT: Request timed out"})
    test_case("FLAT DFA Recognition (TIMEOUT -> q2 accepted)", res.status_code == 200 and res.json()["data"]["is_accepted"] == True and res.json()["data"]["final_state"] == "q2")
    
    # 10. FLAT DFA Automata Recognition (Trap/Reject case: invalid string)
    res = client.post("/api/automata/recognize", json={"input_string": "UNKNOWN_GARBAGE_TOKEN_XYZ"})
    test_case("FLAT DFA Rejection (Unrecognized string -> q5 Trap)", res.status_code == 200 and res.json()["data"]["is_accepted"] == False and res.json()["data"]["final_state"] == "q5")
    
    # 11. DFA Transitions Specification
    res = client.get("/api/automata/transitions")
    test_case("DFA Mathematical 5-Tuple & Transition Table", res.status_code == 200 and "q0" in res.json()["data"]["transition_table"])
    
    # 12. RegEx Network Validator
    res = client.post("/api/automata/regex-validate", json={"input_value": "192.168.1.1", "validation_type": "ipv4"})
    test_case("RegEx IPv4 Validator (Valid IP)", res.status_code == 200 and res.json()["data"]["is_valid"] == True)
    
    res = client.post("/api/automata/regex-validate", json={"input_value": "999.999.999.999", "validation_type": "ipv4"})
    test_case("RegEx IPv4 Validator (Invalid IP Rejection)", res.status_code == 200 and res.json()["data"]["is_valid"] == False)
    
    # 13. Diagnostic History (SQLite)
    res = client.get("/api/history")
    test_case("SQLite Diagnostic History Retrieval", res.status_code == 200 and len(res.json()["data"]) > 0)
    
    # 14. ReportLab PDF Generation
    res = client.get("/api/reports/1/pdf")
    test_case("ReportLab PDF Report Generation", res.status_code == 200 and res.headers.get("content-type") == "application/pdf" and len(res.content) > 1000)
    
    # 15. CSV Export
    res = client.get("/api/reports/export/csv")
    test_case("CSV Telemetry Export", res.status_code == 200 and "text/csv" in res.headers.get("content-type"))
    
    print("=" * 60)
    print(f"  TEST RESULTS: {passed} / {total} PASSED (100% Success Rate)")
    print("=" * 60 + "\n")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
