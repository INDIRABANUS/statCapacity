from fastapi import APIRouter, Depends
from app.api.deps import get_current_user, require_admin

router = APIRouter()

@router.get("/user-only")
def user_only_endpoint(current_user: dict = Depends(get_current_user)):
    return {
        "message": "User access granted",
        "user": current_user
    }

@router.get("/admin-only")
def admin_only_endpoint(current_user: dict = Depends(require_admin)):
    return {
        "message": "Admin access granted",
        "user": current_user
    }
