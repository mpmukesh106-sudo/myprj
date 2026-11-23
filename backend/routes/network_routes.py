from fastapi import APIRouter, HTTPException
from models.schemas import PingRequest, DNSRequest, TracerouteRequest
from services.network_diagnostics import (
    run_ping_test,
    test_dns_resolution,
    run_traceroute_test,
    check_internet_connectivity,
    get_local_ip_info,
    get_public_ip_info,
    get_default_gateway
)
from database.db import add_diagnostic

router = APIRouter()

@router.get("/network/status")
async def get_network_status():
    """Returns real-time network connectivity status, local interface, and gateway reachability."""
    conn = check_internet_connectivity()
    local = get_local_ip_info()
    gw = get_default_gateway()
    pub = get_public_ip_info()
    
    return {
        "status": "success",
        "data": {
            "internet": conn,
            "local_adapter": local,
            "default_gateway": gw,
            "public_ip": pub
        }
    }

@router.get("/network/ip")
async def get_ip_details():
    """Returns detailed IP addressing information (local, public, gateway, subnet classification)."""
    local = get_local_ip_info()
    pub = get_public_ip_info()
    gw = get_default_gateway()
    
    return {
        "status": "success",
        "data": {
            "local_ip": local["local_ip"],
            "hostname": local["hostname"],
            "os": f"{local['os']} ({local['architecture']})",
            "is_apipa": local["is_apipa"],
            "adapter_status": local["status"],
            "gateway_ip": gw["gateway_ip"],
            "gateway_detected": gw["detected"],
            "public_ip": pub["public_ip"],
            "public_service_reachable": pub["available"]
        }
    }

@router.post("/network/ping")
async def ping_endpoint(req: PingRequest):
    """Executes ICMP ping diagnostic to target host and saves result to SQLite database."""
    res = run_ping_test(req.target, req.count)
    
    # Persist in SQLite
    diag_id = add_diagnostic(
        test_type="PING",
        target=req.target,
        status=res["status"],
        latency=res["avg_latency_ms"],
        packet_loss=res["packet_loss"],
        error_message=res.get("error_message"),
        details=res
    )
    
    return {
        "status": "success",
        "diagnostic_id": diag_id,
        "data": res
    }

@router.post("/network/dns")
async def dns_endpoint(req: DNSRequest):
    """Executes DNS lookup on target domain and saves record into database."""
    res = test_dns_resolution(req.hostname)
    
    diag_id = add_diagnostic(
        test_type="DNS",
        target=req.hostname,
        status=res["status"],
        latency=res["latency_ms"],
        packet_loss=0.0 if res["status"] == "SUCCESS" else 100.0,
        error_message=res.get("error"),
        details=res
    )
    
    return {
        "status": "success",
        "diagnostic_id": diag_id,
        "data": res
    }

@router.post("/network/traceroute")
async def traceroute_endpoint(req: TracerouteRequest):
    """Executes traceroute to analyze hop-by-hop path to destination."""
    res = run_traceroute_test(req.target, req.max_hops)
    
    diag_id = add_diagnostic(
        test_type="TRACEROUTE",
        target=req.target,
        status=res["status"],
        latency=0.0,
        packet_loss=0.0 if res["status"] == "SUCCESS" else 100.0,
        error_message=res.get("error"),
        details=res
    )
    
    return {
        "status": "success",
        "diagnostic_id": diag_id,
        "data": res
    }
