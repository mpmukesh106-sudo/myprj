"""
FLAT Module: Deterministic Finite Automaton (DFA) & Regular Expression Engine
Integrates Formal Languages and Automata Theory into Network Troubleshooting.

Formal 5-tuple Definition:
M = (Q, Σ, δ, q0, F)
- Q: Finite set of states {q0, q1, q2, q3, q4, q5}
- Σ: Input alphabet (Tokens and normalized error prefixes)
- δ: Transition function Q × Σ → Q
- q0: Initial state (q0)
- F: Set of accepting states {q1, q2, q3, q4}
- q5: Dead / Trap state (Rejected input)
"""

import re
from typing import Dict, List, Any, Tuple

# 1. Formal DFA Definition
DFA_STATES = {
    "q0": {"name": "Initial State", "type": "initial", "description": "Awaiting error pattern input"},
    "q1": {"name": "DNS Failure State", "type": "accepting", "description": "Accepted: DNS resolution error identified"},
    "q2": {"name": "Timeout State", "type": "accepting", "description": "Accepted: Connection / Request timeout identified"},
    "q3": {"name": "Packet Loss State", "type": "accepting", "description": "Accepted: Transmission packet loss identified"},
    "q4": {"name": "Host Unreachable State", "type": "accepting", "description": "Accepted: Routing or host unreachable / refused"},
    "q5": {"name": "Trap / Reject State", "type": "reject", "description": "Rejected: Unrecognized or invalid error pattern"}
}

DFA_ALPHABET = [
    "DNS_ERROR",
    "TIMEOUT",
    "PACKET_LOSS",
    "HOST_UNREACHABLE",
    "CONNECTION_REFUSED",
    "NETWORK_UNAVAILABLE",
    "ERROR_PAYLOAD",
    "OTHER_TOKEN"
]

# State Transition Function δ: Q × Σ -> Q
TRANSITION_TABLE: Dict[str, Dict[str, str]] = {
    "q0": {
        "DNS_ERROR": "q1",
        "TIMEOUT": "q2",
        "PACKET_LOSS": "q3",
        "HOST_UNREACHABLE": "q4",
        "CONNECTION_REFUSED": "q4",
        "NETWORK_UNAVAILABLE": "q4",
        "ERROR_PAYLOAD": "q5",
        "OTHER_TOKEN": "q5"
    },
    "q1": {
        "DNS_ERROR": "q1",
        "ERROR_PAYLOAD": "q1",
        "TIMEOUT": "q5",
        "PACKET_LOSS": "q5",
        "HOST_UNREACHABLE": "q5",
        "CONNECTION_REFUSED": "q5",
        "NETWORK_UNAVAILABLE": "q5",
        "OTHER_TOKEN": "q1"
    },
    "q2": {
        "TIMEOUT": "q2",
        "ERROR_PAYLOAD": "q2",
        "DNS_ERROR": "q5",
        "PACKET_LOSS": "q5",
        "HOST_UNREACHABLE": "q5",
        "CONNECTION_REFUSED": "q5",
        "NETWORK_UNAVAILABLE": "q5",
        "OTHER_TOKEN": "q2"
    },
    "q3": {
        "PACKET_LOSS": "q3",
        "ERROR_PAYLOAD": "q3",
        "DNS_ERROR": "q5",
        "TIMEOUT": "q5",
        "HOST_UNREACHABLE": "q5",
        "CONNECTION_REFUSED": "q5",
        "NETWORK_UNAVAILABLE": "q5",
        "OTHER_TOKEN": "q3"
    },
    "q4": {
        "HOST_UNREACHABLE": "q4",
        "CONNECTION_REFUSED": "q4",
        "NETWORK_UNAVAILABLE": "q4",
        "ERROR_PAYLOAD": "q4",
        "DNS_ERROR": "q5",
        "TIMEOUT": "q5",
        "PACKET_LOSS": "q5",
        "OTHER_TOKEN": "q4"
    },
    "q5": {k: "q5" for k in DFA_ALPHABET} # Dead / Trap state absorbs all inputs
}

ACCEPTING_STATES = {"q1", "q2", "q3", "q4"}

# Pattern Metadata
PATTERN_MEANINGS = {
    "DNS_ERROR": {
        "category": "DNS Failure",
        "final_state": "q1",
        "description": "Domain Name System resolution failed. The client could not resolve the hostname to an IP address.",
        "layer": "Application Layer (Layer 7)"
    },
    "TIMEOUT": {
        "category": "Connection Timeout",
        "final_state": "q2",
        "description": "Network operation exceeded wait threshold. Host did not respond within TCP/ICMP timeout window.",
        "layer": "Transport / Network Layer (Layer 4 / 3)"
    },
    "PACKET_LOSS": {
        "category": "Packet Loss",
        "final_state": "q3",
        "description": "Packets dropped during transit due to congestion, faulty links, or MTU misconfiguration.",
        "layer": "Network Layer / Data Link (Layer 3 / 2)"
    },
    "HOST_UNREACHABLE": {
        "category": "Host Unreachable",
        "final_state": "q4",
        "description": "Routing failure or intermediate gateway reported ICMP Type 3 (Destination Unreachable).",
        "layer": "Network Layer (Layer 3)"
    },
    "CONNECTION_REFUSED": {
        "category": "Connection Refused",
        "final_state": "q4",
        "description": "Target host received connection attempt but rejected it (TCP RST packet or closed port).",
        "layer": "Transport Layer (Layer 4)"
    },
    "NETWORK_UNAVAILABLE": {
        "category": "Network Unavailable",
        "final_state": "q4",
        "description": "Local adapter disconnected, default gateway missing, or no default route in routing table.",
        "layer": "Physical / Data Link Layer (Layer 1 / 2)"
    }
}

# 2. Regular Expressions for Network Validation
IPV4_REGEX = r"^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
IPV6_REGEX = r"^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$"
DOMAIN_REGEX = r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
ERROR_MESSAGE_REGEX = r"^(DNS_ERROR|TIMEOUT|PACKET_LOSS|HOST_UNREACHABLE|CONNECTION_REFUSED|NETWORK_UNAVAILABLE)(:\s*[\w\s\.-]+)?$"

def validate_ipv4(ip: str) -> bool:
    return bool(re.match(IPV4_REGEX, ip.strip()))

def validate_ipv6(ip: str) -> bool:
    return bool(re.match(IPV6_REGEX, ip.strip()))

def validate_domain(domain: str) -> bool:
    return bool(re.match(DOMAIN_REGEX, domain.strip()))

def validate_error_pattern(pattern: str) -> bool:
    return bool(re.match(ERROR_MESSAGE_REGEX, pattern.strip(), re.IGNORECASE))

# 3. DFA Execution Engine
class DFAEngine:
    def __init__(self):
        self.states = DFA_STATES
        self.alphabet = DFA_ALPHABET
        self.transitions = TRANSITION_TABLE
        self.initial_state = "q0"
        self.accepting_states = ACCEPTING_STATES

    def tokenize_input(self, input_string: str) -> List[Tuple[str, str]]:
        """
        Tokenizes the input string into alphabet symbols and classified tokens.
        Returns list of (token_string, alphabet_symbol).
        """
        clean_input = input_string.strip()
        tokens = []
        normalized = clean_input.upper()
        
        found_token = None
        for pattern_token in [
            "DNS_ERROR",
            "TIMEOUT",
            "PACKET_LOSS",
            "HOST_UNREACHABLE",
            "CONNECTION_REFUSED",
            "NETWORK_UNAVAILABLE"
        ]:
            if normalized.startswith(pattern_token):
                found_token = pattern_token
                break
                
        if found_token:
            tokens.append((found_token, found_token))
            remainder = clean_input[len(found_token):].strip()
            if remainder:
                tokens.append((remainder, "ERROR_PAYLOAD"))
        else:
            # Tokenize arbitrary input to demonstrate state transitions and rejection in trap state q5
            parts = [p for p in re.split(r"[\s,:;]+", clean_input) if p]
            if not parts:
                tokens.append(("", "OTHER_TOKEN"))
            for part in parts:
                part_upper = part.upper()
                if part_upper in self.alphabet:
                    tokens.append((part, part_upper))
                else:
                    tokens.append((part, "OTHER_TOKEN"))
                    
        return tokens

    def recognize(self, input_string: str) -> Dict[str, Any]:
        """
        Simulates step-by-step state transitions of the DFA on the input string.
        Returns full trace, states visited, acceptance, and explanation.
        """
        clean_str = input_string.strip()
        tokens = self.tokenize_input(clean_str)
        
        current_state = self.initial_state
        history: List[Dict[str, Any]] = []
        recognized_pattern = None
        
        history.append({
            "step": 0,
            "current_state": current_state,
            "state_name": self.states[current_state]["name"],
            "input_consumed": "λ (Start)",
            "token_symbol": "START",
            "next_state": current_state,
            "action": f"DFA initialized at {current_state}",
            "is_accepting": current_state in self.accepting_states
        })
        
        for step_idx, (token_str, token_sym) in enumerate(tokens, start=1):
            from_state = current_state
            next_state = self.transitions.get(from_state, {}).get(token_sym, "q5")
            
            if token_sym in PATTERN_MEANINGS and next_state in self.accepting_states:
                recognized_pattern = token_sym
                action_desc = f"Matched error token '{token_sym}' -> transition δ({from_state}, {token_sym}) = {next_state}"
            elif token_sym == "ERROR_PAYLOAD" and from_state in self.accepting_states:
                action_desc = f"Processed error message payload '{token_str}' -> self-loop δ({from_state}, PAYLOAD) = {next_state}"
            elif next_state == "q5":
                action_desc = f"Unrecognized symbol '{token_str}' -> transition to trap state {next_state}"
            else:
                action_desc = f"Transition δ({from_state}, {token_sym}) = {next_state}"
                
            history.append({
                "step": step_idx,
                "current_state": from_state,
                "state_name": self.states[from_state]["name"],
                "input_consumed": token_str,
                "token_symbol": token_sym,
                "next_state": next_state,
                "action": action_desc,
                "is_accepting": next_state in self.accepting_states
            })
            
            current_state = next_state
            
        is_accepted = current_state in self.accepting_states
        pattern_info = PATTERN_MEANINGS.get(recognized_pattern, None) if recognized_pattern else None
        
        # Character-level prefix trace for animated visualization
        char_trace = self.generate_character_trace(clean_str)
        
        return {
            "input_string": input_string,
            "initial_state": self.initial_state,
            "final_state": current_state,
            "is_accepted": is_accepted,
            "recognized_pattern": recognized_pattern,
            "pattern_info": pattern_info,
            "steps": history,
            "character_trace": char_trace,
            "verdict": f"String '{input_string}' is {'ACCEPTED' if is_accepted else 'REJECTED'} by the DFA.",
            "theoretical_tuple": {
                "Q": list(self.states.keys()),
                "Sigma": self.alphabet,
                "q0": self.initial_state,
                "F": list(self.accepting_states),
                "trap_state": "q5"
            }
        }

    def generate_character_trace(self, input_string: str) -> List[Dict[str, Any]]:
        trace = []
        state = "q0"
        accumulated = ""
        
        target_pattern = None
        for pat in DFA_ALPHABET:
            if pat != "OTHER_TOKEN" and pat != "ERROR_PAYLOAD" and input_string.upper().startswith(pat):
                target_pattern = pat
                break
                
        for i, char in enumerate(input_string):
            accumulated += char
            acc_upper = accumulated.upper()
            
            if target_pattern and acc_upper == target_pattern:
                next_state = self.transitions["q0"].get(target_pattern, "q5")
            elif target_pattern and target_pattern.startswith(acc_upper):
                next_state = "q0"
            elif target_pattern and len(accumulated) > len(target_pattern):
                next_state = self.transitions["q0"].get(target_pattern, "q5")
            elif not target_pattern:
                next_state = "q5"
            else:
                next_state = state
                
            trace.append({
                "index": i,
                "char": char,
                "accumulated": accumulated,
                "state": next_state,
                "is_accepting": next_state in self.accepting_states
            })
            state = next_state
            
        return trace

dfa_engine = DFAEngine()

def get_dfa_metadata():
    return {
        "formal_definition": "M = (Q, Σ, δ, q0, F)",
        "states": DFA_STATES,
        "alphabet": DFA_ALPHABET,
        "initial_state": "q0",
        "accepting_states": list(ACCEPTING_STATES),
        "trap_state": "q5",
        "transition_table": TRANSITION_TABLE,
        "patterns": PATTERN_MEANINGS,
        "regex_validators": {
            "ipv4": IPV4_REGEX,
            "ipv6": IPV6_REGEX,
            "domain": DOMAIN_REGEX,
            "error_pattern": ERROR_MESSAGE_REGEX
        }
    }
