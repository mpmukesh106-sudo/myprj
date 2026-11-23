"""
Automated Troubleshooting and Diagnostic Engine
Correlates findings across physical, network, transport, and application layers.
Maps network anomalies to root causes, severity ratings, actionable solutions,
and links directly with FLAT DFA error classification.
"""

from typing import Dict, Any, List
from .network_diagnostics import (
    get_local_ip_info,
    get_public_ip_info,
    get_default_gateway,
    check_internet_connectivity,
    test_dns_resolution,
    run_ping_test
)
from .automata import dfa_engine

TROUBLESHOOTING_KB = {
    "NO_INTERNET": {
        "problem_name": "No Internet Connectivity",
        "severity": "Critical",
        "category": "Layer 3/4 WAN Connectivity",
        "possible_cause": "WAN link down, modem/ONT disconnected, ISP outage, or missing default gateway route.",
        "recommended_solution": "Verify physical/Wi-Fi connection to router, restart CPE/modem, and verify ISP WAN status.",
        "steps": [
            "1. Inspect Ethernet cable connection or Wi-Fi signal strength.",
            "2. Power cycle modem/router: unplug power for 30 seconds and reconnect.",
            "3. Run 'ipconfig /renew' (Windows) or 'sudo dhclient -r' (Linux) to refresh DHCP lease.",
            "4. Verify router WAN status light (Internet/Globe LED should be solid green/white).",
            "5. Contact ISP network operations center if upstream WAN remains down."
        ]
    },
    "DNS_FAILURE": {
        "problem_name": "DNS Resolution Failure",
        "severity": "High",
        "category": "Layer 7 Name Resolution",
        "possible_cause": "Configured DNS server is unreachable, DNS cache is corrupted, or domain NXDOMAIN.",
        "recommended_solution": "Flush DNS resolver cache and switch primary DNS to reliable public servers (1.1.1.1 or 8.8.8.8).",
        "steps": [
            "1. Flush local DNS resolver cache: run 'ipconfig /flushdns' in terminal.",
            "2. Test DNS reachability directly using 'nslookup google.com 8.8.8.8'.",
            "3. Update network adapter IPv4 DNS settings to Cloudflare (1.1.1.1) and Google (8.8.8.8).",
            "4. Check for corporate VPN, Pi-hole, or proxy intercepting port 53 UDP traffic.",
            "5. Verify system hosts file (C:\\Windows\\System32\\drivers\\etc\\hosts) for invalid overrides."
        ]
    },
    "INVALID_IP": {
        "problem_name": "Invalid IP Configuration (APIPA Assigned)",
        "severity": "Critical",
        "category": "Layer 3 Addressing / DHCP",
        "possible_cause": "DHCP server unreachable. System assigned automatic 169.254.x.x link-local address.",
        "recommended_solution": "Ensure DHCP server or router LAN is operational; request a fresh DHCP lease.",
        "steps": [
            "1. Run 'ipconfig /release' followed by 'ipconfig /renew'.",
            "2. Restart DHCP Client service via services.msc.",
            "3. Check router LAN port link light and verify router DHCP pool is not exhausted.",
            "4. Temporarily configure a static IP within your subnet (e.g., 192.168.1.50 / 255.255.255.0)."
        ]
    },
    "HIGH_LATENCY": {
        "problem_name": "High Network Latency (>100ms)",
        "severity": "Medium",
        "category": "Layer 3 Performance / Congestion",
        "possible_cause": "Bufferbloat, Wi-Fi interference, high bandwidth utilization (downloads/backups), or routing sub-optimal paths.",
        "recommended_solution": "Switch from 2.4GHz to 5GHz Wi-Fi or Ethernet; enable Quality of Service (QoS) on router.",
        "steps": [
            "1. Switch to a wired Cat6 Gigabit Ethernet cable to eliminate RF interference.",
            "2. Pause high-bandwidth applications, torrents, or cloud uploads.",
            "3. Run traceroute to pinpoint which intermediate hop introduces the latency spike.",
            "4. Enable SQM / FQ-CoDel QoS on your edge router to mitigate bufferbloat."
        ]
    },
    "PACKET_LOSS": {
        "problem_name": "Packet Loss Detected",
        "severity": "High",
        "category": "Layer 2/3 Transmission Reliability",
        "possible_cause": "Failing network cable, duplex mismatch, Wi-Fi channel collision, or upstream carrier link degradation.",
        "recommended_solution": "Inspect physical cabling, check Wi-Fi signal-to-noise ratio, and test alternative gateways.",
        "steps": [
            "1. Replace Ethernet patch cable with a verified functional Cat5e/Cat6 cable.",
            "2. Use Wi-Fi analyzer tool to select an uncongested wireless channel (1, 6, or 11 on 2.4GHz).",
            "3. Ping default gateway with 50 packets to verify if loss originates on LAN vs WAN.",
            "4. Update network interface card (NIC) drivers."
        ]
    },
    "HOST_UNREACHABLE": {
        "problem_name": "Host Unreachable",
        "severity": "High",
        "category": "Layer 3 Routing / Firewall",
        "possible_cause": "Intermediate gateway missing route to destination, or target host is powered off / firewalled.",
        "recommended_solution": "Check target IP validity, check subnet routing tables, and verify firewall rules.",
        "steps": [
            "1. Verify target IP address and verify it is not blocked by local Windows Defender Firewall.",
            "2. Run traceroute to identify the last responding hop before the route termination.",
            "3. Verify router static routes and subnet masks.",
            "4. Check if target server allows ICMP echo requests."
        ]
    },
    "CONNECTION_TIMEOUT": {
        "problem_name": "Connection Timeout",
        "severity": "High",
        "category": "Layer 4 Transport / TCP Handshake",
        "possible_cause": "SYN packets dropped by firewall, server overloaded, or asymmetric routing.",
        "recommended_solution": "Check port connectivity (e.g. test-netconnection / curl) and verify remote service status.",
        "steps": [
            "1. Verify if remote port is open using TCP ping or telnet.",
            "2. Ensure outbound TCP ports (80, 443) are not blocked by corporate firewall.",
            "3. Check for MTU size mismatch; test ping with 'ping -f -l 1472 <target>'."
        ]
    },
    "SERVER_UNAVAILABLE": {
        "problem_name": "Server Unavailable / Connection Refused",
        "severity": "Medium",
        "category": "Layer 7 Service / Layer 4 Port Closed",
        "possible_cause": "Target web or database service is stopped or port is not listening.",
        "recommended_solution": "Verify server daemon is running and bound to 0.0.0.0 / target interface.",
        "steps": [
            "1. Check if the backend application service is active and listening on the designated port.",
            "2. Inspect server firewall rules (ufw, iptables, or Windows Advanced Firewall).",
            "3. Review application server error logs for fatal exceptions."
        ]
    }
}

def run_automated_diagnosis() -> Dict[str, Any]:
    """
    Executes a comprehensive, automated end-to-end network diagnostic suite:
    1. Local IP configuration check
    2. Default Gateway reachability
    3. DNS resolution capability
    4. External internet connectivity & latency
    5. FLAT Automata pattern recognition on any identified anomalies
    6. Root cause analysis with step-by-step resolution advice
    """
    problems_detected = []
    tests_summary = {}
    automata_classifications = []
    
    # Step 1: Adapter & Local IP
    local_info = get_local_ip_info()
    tests_summary["local_ip"] = local_info
    
    if local_info["is_apipa"]:
        prob = dict(TROUBLESHOOTING_KB["INVALID_IP"])
        prob["detected_value"] = local_info["local_ip"]
        problems_detected.append(prob)
        # Classify with DFA
        dfa_res = dfa_engine.recognize("NETWORK_UNAVAILABLE: APIPA 169.254 detected")
        automata_classifications.append(dfa_res)
        
    # Step 2: Gateway check
    gw_info = get_default_gateway()
    tests_summary["gateway"] = gw_info
    
    gw_ping = None
    if gw_info["detected"]:
        gw_ping = run_ping_test(gw_info["gateway_ip"], count=2)
        tests_summary["gateway_ping"] = gw_ping
        if gw_ping["status"] == "FAILED":
            prob = dict(TROUBLESHOOTING_KB["HOST_UNREACHABLE"])
            prob["detected_value"] = f"Gateway {gw_info['gateway_ip']} unreachable"
            problems_detected.append(prob)
            dfa_res = dfa_engine.recognize("HOST_UNREACHABLE: Gateway not responding")
            automata_classifications.append(dfa_res)
            
    # Step 3: DNS Resolution
    dns_res = test_dns_resolution("google.com")
    tests_summary["dns_test"] = dns_res
    if dns_res["status"] == "FAILED":
        prob = dict(TROUBLESHOOTING_KB["DNS_FAILURE"])
        prob["detected_value"] = dns_res.get("error", "DNS resolution failed")
        problems_detected.append(prob)
        dfa_res = dfa_engine.recognize("DNS_ERROR: Resolution failed for google.com")
        automata_classifications.append(dfa_res)
        
    # Step 4: Internet Connectivity & Latency
    internet_res = check_internet_connectivity()
    tests_summary["internet_check"] = internet_res
    
    if not internet_res["connected"]:
        prob = dict(TROUBLESHOOTING_KB["NO_INTERNET"])
        prob["detected_value"] = "Zero external reachability"
        problems_detected.append(prob)
        dfa_res = dfa_engine.recognize("NETWORK_UNAVAILABLE: No internet route")
        automata_classifications.append(dfa_res)
    else:
        # Check latency and packet loss to reliable target
        ping_res = run_ping_test("8.8.8.8", count=4)
        tests_summary["public_ping"] = ping_res
        
        if ping_res["packet_loss"] > 0:
            prob = dict(TROUBLESHOOTING_KB["PACKET_LOSS"])
            prob["detected_value"] = f"{ping_res['packet_loss']}% packet loss to 8.8.8.8"
            problems_detected.append(prob)
            dfa_res = dfa_engine.recognize(f"PACKET_LOSS: {ping_res['packet_loss']}% to 8.8.8.8")
            automata_classifications.append(dfa_res)
            
        if ping_res["avg_latency_ms"] > 100:
            prob = dict(TROUBLESHOOTING_KB["HIGH_LATENCY"])
            prob["detected_value"] = f"{ping_res['avg_latency_ms']} ms average latency"
            problems_detected.append(prob)
            dfa_res = dfa_engine.recognize("TIMEOUT: Excessive latency above 100ms")
            automata_classifications.append(dfa_res)
            
    # Step 5: Public IP
    pub_info = get_public_ip_info()
    tests_summary["public_ip"] = pub_info
    
    # Calculate health score (0 - 100)
    score = 100
    for p in problems_detected:
        if p["severity"] == "Critical":
            score -= 40
        elif p["severity"] == "High":
            score -= 20
        elif p["severity"] == "Medium":
            score -= 10
    score = max(0, min(100, score))
    
    status_summary = "Healthy" if score >= 85 else ("Degraded" if score >= 50 else "Critical Failure")
    
    return {
        "status": status_summary,
        "health_score": score,
        "problems_count": len(problems_detected),
        "problems": problems_detected,
        "automata_classifications": automata_classifications,
        "diagnostic_details": tests_summary,
        "summary_message": (
            f"Automated diagnosis completed. System health evaluated at {score}/100. "
            f"{len(problems_detected)} potential issue(s) identified and analyzed."
        )
    }
