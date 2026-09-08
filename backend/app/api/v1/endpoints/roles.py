from fastapi import APIRouter
from typing import List
from app.db.mongodb import get_database
from app.db.roles_db import get_all_roles
from app.schemas.role import RoleResponse

router = APIRouter()

@router.get("", response_model=List[RoleResponse])
@router.get("/", response_model=List[RoleResponse], include_in_schema=False)
def list_roles():
    db = get_database()
    return get_all_roles(db)
