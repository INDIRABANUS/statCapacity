import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

DATA_FILE = Path(__file__).resolve().parent.parent.parent.parent / "data" / "roles.json"

def get_roles_from_file() -> List[Dict[str, Any]]:
    try:
        if DATA_FILE.exists():
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return []

def get_all_roles(db) -> List[Dict[str, Any]]:
    if db is not None:
        try:
            roles = list(db.roles.find({}, {"_id": 0}))
            if roles and len(roles) > 0:
                return roles
        except Exception:
            pass
    return get_roles_from_file()

def get_role_by_id(db, role_id: str) -> Optional[Dict[str, Any]]:
    if not role_id:
        return None
    if db is not None:
        try:
            role = db.roles.find_one({"role_id": role_id}, {"_id": 0})
            if role:
                return role
        except Exception:
            pass
    roles = get_roles_from_file()
    for r in roles:
        if r.get("role_id") == role_id:
            return r
    return None

def is_valid_role_id(db, role_id: str) -> bool:
    if not role_id:
        return True
    return get_role_by_id(db, role_id) is not None
