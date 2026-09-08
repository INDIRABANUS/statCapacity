import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

def ensure_user_indexes(db):
    if db is None:
        return
    db.users.create_index("email", unique=True)
    db.users.create_index("username", unique=True)

def format_user_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return None
    user = doc.copy()
    user["id"] = str(user.get("id") or user.get("_id"))
    user.pop("password_hash", None)
    user.setdefault("current_role_id", None)
    user.setdefault("target_role_id", None)
    return user

def create_user(db, username: str, email: str, password_hash: str, role: str = "USER") -> Dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    user_id = str(uuid.uuid4())
    
    # Enforce USER role for standard creation unless explicitly specified
    user_doc = {
        "id": user_id,
        "username": username.strip(),
        "email": email.strip().lower(),
        "password_hash": password_hash,
        "role": role if role in ["USER", "ADMIN"] else "USER",
        "current_role_id": None,
        "target_role_id": None,
        "created_at": now_iso,
        "updated_at": now_iso,
        "last_login": None
    }
    
    if db is not None:
        db.users.insert_one(user_doc)
    return format_user_doc(user_doc)

def get_user_by_email(db, email: str) -> Optional[Dict[str, Any]]:
    if db is None:
        return None
    return db.users.find_one({"email": email.strip().lower()})

def get_user_by_username(db, username: str) -> Optional[Dict[str, Any]]:
    if db is None:
        return None
    return db.users.find_one({"username": username.strip()})

def get_user_by_id(db, user_id: str) -> Optional[Dict[str, Any]]:
    if db is None:
        return None
    return db.users.find_one({"id": user_id})

def update_last_login(db, user_id: str) -> Optional[str]:
    now_iso = datetime.now(timezone.utc).isoformat()
    if db is not None:
        db.users.update_one({"id": user_id}, {"$set": {"last_login": now_iso, "updated_at": now_iso}})
    return now_iso

def update_user_profile(db, user_id: str, current_role_id: Optional[str] = None, target_role_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    now_iso = datetime.now(timezone.utc).isoformat()
    update_fields: Dict[str, Any] = {"updated_at": now_iso}
    update_fields["current_role_id"] = current_role_id
    update_fields["target_role_id"] = target_role_id
    
    if db is not None:
        db.users.update_one({"id": user_id}, {"$set": update_fields})
        updated = db.users.find_one({"id": user_id})
        return format_user_doc(updated)
    return None
