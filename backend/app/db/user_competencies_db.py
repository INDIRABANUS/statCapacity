from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

def ensure_user_competency_indexes(db):
    if db is None:
        return
    try:
        db.user_competencies.create_index([("user_id", 1), ("competency_id", 1)], unique=True)
        db.user_competencies.create_index("user_id")
    except Exception:
        pass

def get_user_competencies(db, user_id: str) -> List[Dict[str, Any]]:
    if not user_id:
        return []
    if db is not None:
        try:
            return list(db.user_competencies.find({"user_id": user_id}, {"_id": 0}))
        except Exception:
            pass
    return []

def get_user_competency(db, user_id: str, competency_id: str) -> Optional[Dict[str, Any]]:
    if not user_id or not competency_id:
        return None
    if db is not None:
        try:
            return db.user_competencies.find_one(
                {"user_id": user_id, "competency_id": competency_id},
                {"_id": 0}
            )
        except Exception:
            pass
    return None

def save_user_competency(
    db,
    user_id: str,
    competency_id: str,
    current_level: int,
    source: str = "self_assessment"
) -> Dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "user_id": user_id,
        "competency_id": competency_id,
        "current_level": int(current_level),
        "source": source,
        "updated_at": now_iso
    }
    if db is not None:
        db.user_competencies.update_one(
            {"user_id": user_id, "competency_id": competency_id},
            {"$set": record},
            upsert=True
        )
    return record
