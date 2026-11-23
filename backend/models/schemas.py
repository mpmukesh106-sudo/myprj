from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class PingRequest(BaseModel):
    target: str = Field(default="8.8.8.8", description="Target IP or hostname to ping")
    count: int = Field(default=4, ge=1, le=10, description="Number of ICMP echo requests")

class DNSRequest(BaseModel):
    hostname: str = Field(default="google.com", description="Domain name to resolve")

class TracerouteRequest(BaseModel):
    target: str = Field(default="8.8.8.8", description="Target destination to trace")
    max_hops: int = Field(default=15, ge=1, le=30, description="Max TTL / hops")

class AutomataRecognizeRequest(BaseModel):
    input_string: str = Field(..., description="Network error message to recognize using DFA")

class RegexValidationRequest(BaseModel):
    input_value: str = Field(..., description="String to validate")
    validation_type: str = Field(default="ipv4", description="Type: 'ipv4', 'ipv6', 'domain', 'error_pattern'")

class LoginRequest(BaseModel):
    username: str
    password: str
