import json
from pathlib import Path
from typing import List, Dict, Any, Optional

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"
COMPETENCIES_FILE = DATA_DIR / "competencies.json"
ROLE_COMPETENCIES_FILE = DATA_DIR / "role_competencies.json"

def get_competencies_from_file() -> List[Dict[str, Any]]:
    try:
        if COMPETENCIES_FILE.exists():
            with open(COMPETENCIES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return []

def get_role_competencies_from_file() -> List[Dict[str, Any]]:
    try:
        if ROLE_COMPETENCIES_FILE.exists():
            with open(ROLE_COMPETENCIES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return []

def get_all_competencies(db) -> List[Dict[str, Any]]:
    if db is not None:
        try:
            comps = list(db.competencies.find({}, {"_id": 0}))
            if comps and len(comps) > 0:
                return comps
        except Exception:
            pass
    return get_competencies_from_file()

def get_competency_by_id(db, competency_id: str) -> Optional[Dict[str, Any]]:
    if not competency_id:
        return None
    if db is not None:
        try:
            comp = db.competencies.find_one({"competency_id": competency_id}, {"_id": 0})
            if comp:
                return comp
        except Exception:
            pass
    comps = get_competencies_from_file()
    for c in comps:
        if c.get("competency_id") == competency_id:
            return c
    return None

def is_valid_competency_id(db, competency_id: str) -> bool:
    if not competency_id:
        return False
    return get_competency_by_id(db, competency_id) is not None

def get_role_competencies_for_role(db, role_id: str) -> List[Dict[str, Any]]:
    if not role_id:
        return []
    if db is not None:
        try:
            rc_list = list(db.role_competencies.find({"role_id": role_id}, {"_id": 0}))
            if rc_list and len(rc_list) > 0:
                return rc_list
        except Exception:
            pass
    all_rc = get_role_competencies_from_file()
    return [rc for rc in all_rc if rc.get("role_id") == role_id]
