"""
Computer Networks (CN) Diagnostic Engine
Handles ICMP ping, DNS resolution, Traceroute, Gateway detection,
Local/Public IP lookup, and Latency/Packet loss measurement.
"""

import socket
import subprocess
import platform
import re
import time
import urllib.request
import json
import ipaddress
from typing import Dict, Any, List, Optional

SYSTEM_OS = platform.system().lower()

def is_valid_target(target: str) -> bool:
    """Strictly validates target hostname or IP address to prevent command injection."""
    if not target or len(target) > 255:
        return False
    # Allow valid IPv4, IPv6, or domain name strings only
    safe_pattern = r"^[a-zA-Z0-9][a-zA-Z0-9.-]{0,253}[a-zA-Z0-9]$"
    return bool(re.match(safe_pattern, target.strip()))

def get_local_ip_info() -> Dict[str, Any]:
    """Retrieves local network adapter IP, hostname, and OS platform information."""
    hostname = socket.gethostname()
    local_ip = "127.0.0.1"
    try:
        # Connect to an external IP on UDP to detect the primary egress interface without sending packets
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(1.0)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        try:
            local_ip = socket.gethostbyname(hostname)
        except Exception:
            local_ip = "127.0.0.1"
            
    is_apipa = local_ip.startswith("169.254.")
    is_loopback = local_ip.startswith("127.")
    
    return {
        "hostname": hostname,
        "local_ip": local_ip,
        "os": platform.system(),
        "os_version": platform.version(),
        "architecture": platform.machine(),
        "is_apipa": is_apipa,
        "is_loopback": is_loopback,
        "status": "Warning: APIPA Assigned" if is_apipa else ("Loopback Only" if is_loopback else "Valid Private IP")
    }

def get_public_ip_info() -> Dict[str, Any]:
    """Attempts to fetch public IP from external lookup service with safe timeout."""
    urls = [
        "https://api.ipify.org?format=json",
        "https://ifconfig.me/ip"
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "NetAssist/1.0"})
            with urllib.request.urlopen(req, timeout=2.5) as response:
                content = response.read().decode("utf-8").strip()
                if "{" in content:
                    data = json.loads(content)
                    return {"public_ip": data.get("ip", "Unknown"), "available": True, "service": url}
                else:
                    return {"public_ip": content, "available": True, "service": url}
        except Exception as e:
            continue
            
    return {
        "public_ip": "Unavailable (No External Route or Blocked)",
        "available": False,
        "message": "External public IP service could not be contacted. Local network might be restricted or offline."
    }

def get_default_gateway() -> Dict[str, Any]:
    """Detects default router/gateway IP address using system routing tables."""
    gateway_ip = None
    try:
        if "windows" in SYSTEM_OS:
            output = subprocess.check_output(["ipconfig"], timeout=4, text=True, stderr=subprocess.DEVNULL)
            matches = re.findall(r"Default Gateway[ .]*: ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", output)
            if matches:
                # Find first non-empty, non-zero gateway
                for gw in matches:
                    if gw != "0.0.0.0":
                        gateway_ip = gw
                        break
        else:
            output = subprocess.check_output(["ip", "route", "show", "default"], timeout=3, text=True, stderr=subprocess.DEVNULL)
            match = re.search(r"default via ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)", output)
            if match:
                gateway_ip = match.group(1)
    except Exception:
        pass
        
    if not gateway_ip:
        # Fallback heuristic: check if local IP is known, guess .1
        local = get_local_ip_info()["local_ip"]
        if local and not local.startswith("127.") and not local.startswith("169.254."):
            parts = local.split(".")
            gateway_ip = f"{parts[0]}.{parts[1]}.{parts[2]}.1"
            
    return {
        "gateway_ip": gateway_ip or "Not Detected",
        "detected": bool(gateway_ip)
    }

def check_internet_connectivity() -> Dict[str, Any]:
    """
    Checks active Layer 3 and Layer 4 internet connectivity by probing
    high-availability public DNS and HTTP endpoints.
    """
    targets = [("1.1.1.1", 53), ("8.8.8.8", 53), ("google.com", 80)]
    start_time = time.perf_counter()
    connected = False
    connected_target = None
    latency_ms = 0.0
    
    for host, port in targets:
        try:
            s_start = time.perf_counter()
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(2.0)
            s.connect((host, port))
            s.close()
            latency_ms = round((time.perf_counter() - s_start) * 1000, 2)
            connected = True
            connected_target = f"{host}:{port}"
            break
        except Exception:
            continue
            
    total_time = round((time.perf_counter() - start_time) * 1000, 2)
    
    return {
        "status": "Online" if connected else "Offline",
        "connected": connected,
        "latency_ms": latency_ms if connected else 0.0,
        "check_duration_ms": total_time,
        "target_probed": connected_target,
        "error": None if connected else "NETWORK_UNAVAILABLE: No route to public internet hosts"
    }

def test_dns_resolution(hostname: str = "google.com") -> Dict[str, Any]:
    """
    Performs DNS query, measures lookup latency, and returns IPv4/IPv6 records.
    """
    hostname = hostname.strip()
    if not is_valid_target(hostname):
        return {
            "status": "FAILED",
            "query": hostname,
            "error": "Invalid hostname format",
            "latency_ms": 0.0,
            "resolved_ips": []
        }
        
    start = time.perf_counter()
    resolved_ips = []
    canonical_name = None
    
    try:
        addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        
        for item in addr_info:
            ip = item[4][0]
            if ip not in resolved_ips:
                resolved_ips.append(ip)
                
        try:
            canonical_name = socket.getfqdn(hostname)
        except Exception:
            canonical_name = hostname
            
        return {
            "status": "SUCCESS",
            "query": hostname,
            "latency_ms": latency_ms,
            "resolved_ips": resolved_ips,
            "canonical_name": canonical_name,
            "count": len(resolved_ips),
            "record_type": "A/AAAA",
            "error": None
        }
    except socket.gaierror as e:
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "status": "FAILED",
            "query": hostname,
            "latency_ms": latency_ms,
            "resolved_ips": [],
            "error": f"DNS_ERROR: Name resolution failed ({e.strerror or 'NXDOMAIN'})",
            "canonical_name": None
        }
    except Exception as e:
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "status": "FAILED",
            "query": hostname,
            "latency_ms": latency_ms,
            "resolved_ips": [],
            "error": f"DNS_ERROR: {str(e)}",
            "canonical_name": None
        }

def run_ping_test(target: str = "8.8.8.8", count: int = 4) -> Dict[str, Any]:
    """
    Executes native ping command using safe subprocess argument lists.
    Parses latency (min/avg/max) and packet loss.
    """
    target = target.strip()
    if not is_valid_target(target):
        return {
            "status": "FAILED",
            "target": target,
            "error": "Invalid target hostname or IP address format.",
            "latency": 0.0,
            "packet_loss": 100.0,
            "packets_sent": 0,
            "packets_received": 0
        }
        
    cmd = []
    if "windows" in SYSTEM_OS:
        cmd = ["ping", "-n", str(count), "-w", "1000", target]
    else:
        cmd = ["ping", "-c", str(count), "-W", "1", target]
        
    try:
        start_time = time.perf_counter()
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=12)
        output = proc.stdout
        
        # Parse packet statistics
        packets_sent = count
        packets_received = 0
        packet_loss = 100.0
        avg_rtt = 0.0
        min_rtt = 0.0
        max_rtt = 0.0
        
        # Regex patterns for Windows and Linux ping outputs
        loss_match = re.search(r"(\d+)%\s*(?:packet\s*)?loss", output, re.IGNORECASE)
        if loss_match:
            packet_loss = float(loss_match.group(1))
            
        recv_match = re.search(r"Received\s*=\s*(\d+)", output, re.IGNORECASE) or re.search(r"(\d+)\s*(?:packets\s*)?received", output, re.IGNORECASE)
        if recv_match:
            packets_received = int(recv_match.group(1))
            
        # Parse RTT latency
        if "windows" in SYSTEM_OS:
            rtt_match = re.search(r"Minimum\s*=\s*(\d+)ms,\s*Maximum\s*=\s*(\d+)ms,\s*Average\s*=\s*(\d+)ms", output, re.IGNORECASE)
            if rtt_match:
                min_rtt = float(rtt_match.group(1))
                max_rtt = float(rtt_match.group(2))
                avg_rtt = float(rtt_match.group(3))
            else:
                # Individual reply times fallback
                times = [float(t) for t in re.findall(r"time[=<](\d+)ms", output, re.IGNORECASE)]
                if times:
                    min_rtt = min(times)
                    max_rtt = max(times)
                    avg_rtt = round(sum(times) / len(times), 2)
        else:
            rtt_match = re.search(r"rtt\s+min/avg/max/mdev\s*=\s*([\d.]+)/([\d.]+)/([\d.]+)", output, re.IGNORECASE)
            if rtt_match:
                min_rtt = float(rtt_match.group(1))
                avg_rtt = float(rtt_match.group(2))
                max_rtt = float(rtt_match.group(3))
                
        is_success = (packets_received > 0)
        error_msg = None
        if not is_success:
            if "Destination host unreachable" in output or "unreachable" in output.lower():
                error_msg = "HOST_UNREACHABLE: Destination host unreachable"
            elif "Request timed out" in output or "timed out" in output.lower():
                error_msg = "TIMEOUT: Request timed out after wait threshold"
            else:
                error_msg = "NETWORK_UNAVAILABLE: Ping transmission failed"
        elif packet_loss > 0:
            error_msg = f"PACKET_LOSS: {packet_loss}% packet loss observed during transit"
            
        return {
            "status": "SUCCESS" if (is_success and packet_loss < 100) else "FAILED",
            "target": target,
            "packets_sent": packets_sent,
            "packets_received": packets_received,
            "packet_loss": packet_loss,
            "min_latency_ms": min_rtt,
            "avg_latency_ms": avg_rtt,
            "max_latency_ms": max_rtt,
            "raw_output": output.strip(),
            "error_message": error_msg
        }
    except subprocess.TimeoutExpired:
        return {
            "status": "FAILED",
            "target": target,
            "packets_sent": count,
            "packets_received": 0,
            "packet_loss": 100.0,
            "min_latency_ms": 0.0,
            "avg_latency_ms": 0.0,
            "max_latency_ms": 0.0,
            "error_message": "TIMEOUT: Ping operation timed out after 12 seconds",
            "raw_output": "Ping command timed out."
        }
    except Exception as e:
        return {
            "status": "FAILED",
            "target": target,
            "packets_sent": count,
            "packets_received": 0,
            "packet_loss": 100.0,
            "min_latency_ms": 0.0,
            "avg_latency_ms": 0.0,
            "max_latency_ms": 0.0,
            "error_message": f"PING_ERROR: {str(e)}",
            "raw_output": str(e)
        }

def run_traceroute_test(target: str = "8.8.8.8", max_hops: int = 15) -> Dict[str, Any]:
    """
    Executes traceroute to analyze network path and hop-by-hop latency.
    """
    target = target.strip()
    if not is_valid_target(target):
        return {
            "status": "FAILED",
            "target": target,
            "error": "Invalid target hostname or IP address format.",
            "hops": []
        }
        
    cmd = []
    if "windows" in SYSTEM_OS:
        cmd = ["tracert", "-d", "-h", str(max_hops), "-w", "800", target]
    else:
        cmd = ["traceroute", "-n", "-m", str(max_hops), "-w", "1", target]
        
    hops = []
    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=20)
        output = proc.stdout
        lines = output.splitlines()
        
        for line in lines:
            line_str = line.strip()
            # Windows line: 1    <1 ms    <1 ms    <1 ms  192.168.1.1
            win_match = re.search(r"^\s*(\d+)\s+([\d*<ms\s]+)\s+([0-9a-fA-F.:]+|\*)\s*$", line_str)
            if win_match:
                hop_num = int(win_match.group(1))
                rtt_part = win_match.group(2).strip()
                hop_ip = win_match.group(3)
                
                # Extract any millisecond numbers
                rtts = re.findall(r"(\d+)\s*ms", rtt_part)
                avg_rtt = f"{rtts[0]}ms" if rtts else ("*" if "*" in rtt_part else "N/A")
                
                hops.append({
                    "hop": hop_num,
                    "ip": hop_ip if hop_ip != "*" else "Request timed out",
                    "rtt": avg_rtt,
                    "status": "SUCCESS" if hop_ip != "*" else "TIMEOUT"
                })
            else:
                # Linux line format: 1  192.168.1.1  1.123 ms  1.054 ms
                linux_match = re.search(r"^\s*(\d+)\s+([0-9a-fA-F.:]+|\*)\s+([\d.]+)\s*ms", line_str)
                if linux_match:
                    hops.append({
                        "hop": int(linux_match.group(1)),
                        "ip": linux_match.group(2),
                        "rtt": f"{linux_match.group(3)}ms",
                        "status": "SUCCESS"
                    })
                    
        is_success = len(hops) > 0 and any(h["status"] == "SUCCESS" for h in hops)
        return {
            "status": "SUCCESS" if is_success else "FAILED",
            "target": target,
            "total_hops": len(hops),
            "hops": hops,
            "raw_output": output.strip(),
            "error": None if is_success else "HOST_UNREACHABLE: No hops responded to traceroute probe"
        }
    except subprocess.TimeoutExpired:
        return {
            "status": "PARTIAL",
            "target": target,
            "total_hops": len(hops),
            "hops": hops,
            "error": "TIMEOUT: Traceroute exceeded timeout before reaching destination.",
            "raw_output": "Traceroute timed out."
        }
    except Exception as e:
        return {
            "status": "FAILED",
            "target": target,
            "total_hops": 0,
            "hops": [],
            "error": f"TRACEROUTE_ERROR: {str(e)}",
            "raw_output": str(e)
        }
