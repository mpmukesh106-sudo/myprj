from fastapi import APIRouter
from models.schemas import AutomataRecognizeRequest, RegexValidationRequest
from services.automata import (
    dfa_engine,
    get_dfa_metadata,
    validate_ipv4,
    validate_ipv6,
    validate_domain,
    validate_error_pattern
)
from database.db import add_automata_log, get_automata_logs

router = APIRouter()

@router.post("/automata/recognize")
async def recognize_pattern(req: AutomataRecognizeRequest):
    """
    Executes Deterministic Finite Automaton (DFA) on input error string.
    Traces transitions step-by-step from q0 to accepting/dead states.
    Logs execution to SQLite database.
    """
    result = dfa_engine.recognize(req.input_string)
    
    # Save log to SQLite
    log_id = add_automata_log(
        input_string=req.input_string,
        recognized_pattern=result.get("recognized_pattern"),
        final_state=result["final_state"],
        accepted=result["is_accepted"],
        transitions=result["steps"]
    )
    
    return {
        "status": "success",
        "log_id": log_id,
        "data": result
    }

@router.get("/automata/transitions")
async def get_transitions():
    """
    Returns full DFA mathematical specification:
    States Q, Alphabet Σ, Transition Table δ, Initial state q0, and Accepting States F.
    """
    metadata = get_dfa_metadata()
    return {
        "status": "success",
        "data": metadata
    }

@router.get("/automata/logs")
async def get_logs(limit: int = 25):
    """Returns recent DFA recognition history stored in SQLite."""
    logs = get_automata_logs(limit=limit)
    return {
        "status": "success",
        "count": len(logs),
        "data": logs
    }

@router.post("/automata/regex-validate")
async def regex_validate(req: RegexValidationRequest):
    """
    Validates network strings (IPv4, IPv6, Domain, Error pattern) using formal Regular Expressions.
    """
    vtype = req.validation_type.lower()
    val = req.input_value.strip()
    is_valid = False
    regex_pattern = ""
    explanation = ""
    
    if vtype == "ipv4":
        is_valid = validate_ipv4(val)
        regex_pattern = r"^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
        explanation = "Requires 4 octets separated by dots, each in range [0, 255]."
    elif vtype == "ipv6":
        is_valid = validate_ipv6(val)
        regex_pattern = "RFC 4291 Hex-colon IPv6 pattern"
        explanation = "Requires 8 groups of 4 hexadecimal digits, supporting zero-compression (::)."
    elif vtype == "domain":
        is_valid = validate_domain(val)
        regex_pattern = r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
        explanation = "RFC 1035 domain label and top-level domain specifications."
    elif vtype == "error_pattern":
        is_valid = validate_error_pattern(val)
        regex_pattern = r"^(DNS_ERROR|TIMEOUT|PACKET_LOSS|HOST_UNREACHABLE|CONNECTION_REFUSED|NETWORK_UNAVAILABLE)(:\s*.+)?$"
        explanation = "Requires valid network error token prefix followed by optional diagnostic description."
    else:
        is_valid = False
        explanation = "Unknown validation type."
        
    return {
        "status": "success",
        "data": {
            "input_value": val,
            "validation_type": vtype,
            "is_valid": is_valid,
            "regex_pattern": regex_pattern,
            "explanation": explanation
        }
    }
