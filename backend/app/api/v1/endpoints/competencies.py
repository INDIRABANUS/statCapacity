from fastapi import APIRouter
from typing import List
from app.db.mongodb import get_database
from app.db.competencies_db import get_all_competencies
from app.schemas.competency import CompetencyResponse

router = APIRouter()

@router.get("", response_model=List[CompetencyResponse])
@router.get("/", response_model=List[CompetencyResponse], include_in_schema=False)
def list_competencies():
    db = get_database()
    return get_all_competencies(db)
