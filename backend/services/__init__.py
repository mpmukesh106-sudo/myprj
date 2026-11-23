# Services package init
from .network_diagnostics import (
    get_local_ip_info,
    get_public_ip_info,
    get_default_gateway,
    check_internet_connectivity,
    test_dns_resolution,
    run_ping_test,
    run_traceroute_test,
    is_valid_target
)
from .troubleshooting import run_automated_diagnosis, TROUBLESHOOTING_KB
from .automata import (
    dfa_engine,
    get_dfa_metadata,
    validate_ipv4,
    validate_ipv6,
    validate_domain,
    validate_error_pattern
)
