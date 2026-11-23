from .dashboard_routes import router as dashboard_router
from .network_routes import router as network_router
from .diagnosis_routes import router as diagnosis_router
from .automata_routes import router as automata_router
from .history_routes import router as history_router
from .reports_routes import router as reports_router
from .auth_routes import router as auth_router

__all__ = [
    "dashboard_router",
    "network_router",
    "diagnosis_router",
    "automata_router",
    "history_router",
    "reports_router",
    "auth_router"
]
