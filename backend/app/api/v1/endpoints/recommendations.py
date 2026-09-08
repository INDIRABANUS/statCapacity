from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.api.deps import get_current_user
from app.db.mongodb import get_database
from app.db.roles_db import get_all_roles
from app.db.competencies_db import get_all_competencies, get_role_competencies_for_role
from app.db.user_competencies_db import get_user_competencies
from app.services.course_providers.registry import course_registry
from app.services.recommendation_service import generate_recommendations
from app.schemas.course import RecommendationResponse

router = APIRouter()

@router.get("/me/recommendations", response_model=RecommendationResponse)
def get_my_recommendations(
    source: Optional[str] = Query(None, description="Filter by course provider source ('iGOT' or 'NSSSTA')"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of recommendations to return"),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    target_role_id = current_user.get("target_role_id")
    current_role_id = current_user.get("current_role_id")

    # Load context
    all_roles = get_all_roles(db)
    roles_map = {r["role_id"]: r for r in all_roles}

    all_comps = get_all_competencies(db)
    competencies_map = {c["competency_id"]: c for c in all_comps}

    role_competencies = get_role_competencies_for_role(db, target_role_id) if target_role_id else []
    user_competencies = get_user_competencies(db, current_user["id"])
    all_courses = course_registry.get_all_courses(db)

    return generate_recommendations(
        target_role_id=target_role_id,
        current_role_id=current_role_id,
        user_competencies=user_competencies,
        role_competencies=role_competencies,
        competencies_map=competencies_map,
        roles_map=roles_map,
        all_courses=all_courses,
        source=source,
        limit=limit
    )
