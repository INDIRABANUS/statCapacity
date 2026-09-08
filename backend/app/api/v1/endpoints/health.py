from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.db.mongodb import check_db_health

router = APIRouter()

@router.get("/health")
def health_check():
    db_connected = check_db_health()
    return {
        "status": "healthy" if db_connected else "degraded (db offline)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database_connected": db_connected,
        "project": settings.PROJECT_NAME,
        "environment": "development"
    }
