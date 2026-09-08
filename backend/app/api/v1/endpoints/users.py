from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Union, Dict
from app.api.deps import get_current_user
from app.schemas.user import UserResponse, UserProfileUpdate
from app.schemas.competency import (
    UserCompetencyResponse,
    UserCompetenciesUpdateRequest,
    UserCompetencyItem,
    SkillGapItem
)
from app.db.mongodb import get_database
from app.db.roles_db import is_valid_role_id
from app.db.users_db import update_user_profile
from app.db.competencies_db import (
    get_all_competencies,
    is_valid_competency_id,
    get_role_competencies_for_role
)
from app.db.user_competencies_db import (
    get_user_competencies,
    save_user_competency
)
from app.core.skill_gap import calculate_skill_gaps

router = APIRouter()

@router.put("/me/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user["id"]

    # Validate current_role_id
    if profile_in.current_role_id:
        if not is_valid_role_id(db, profile_in.current_role_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid current_role_id '{profile_in.current_role_id}'. Role does not exist."
            )

    # Validate target_role_id
    if profile_in.target_role_id:
        if not is_valid_role_id(db, profile_in.target_role_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid target_role_id '{profile_in.target_role_id}'. Role does not exist."
            )

    curr_role = profile_in.current_role_id if profile_in.current_role_id != "" else None
    tgt_role = profile_in.target_role_id if profile_in.target_role_id != "" else None

    updated = update_user_profile(
        db,
        user_id=user_id,
        current_role_id=curr_role,
        target_role_id=tgt_role
    )

    if not updated:
        current_user["current_role_id"] = curr_role
        current_user["target_role_id"] = tgt_role
        return current_user

    return updated

@router.get("/me/competencies", response_model=List[UserCompetencyResponse])
def get_my_competencies(current_user: dict = Depends(get_current_user)):
    db = get_database()
    return get_user_competencies(db, current_user["id"])

@router.put("/me/competencies", response_model=List[UserCompetencyResponse])
def update_my_competencies(
    payload: Union[UserCompetenciesUpdateRequest, List[UserCompetencyItem]],
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = current_user["id"]

    items = payload.competencies if isinstance(payload, UserCompetenciesUpdateRequest) else payload

    # Validate each competency_id
    for item in items:
        if not is_valid_competency_id(db, item.competency_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid competency_id '{item.competency_id}'. Competency does not exist."
            )
        if item.current_level < 0 or item.current_level > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Competency level must be between 0 and 100. Got {item.current_level}."
            )

    # Save all items
    for item in items:
        save_user_competency(
            db,
            user_id=user_id,
            competency_id=item.competency_id,
            current_level=item.current_level,
            source="self_assessment"
        )

    return get_user_competencies(db, user_id)

@router.get("/me/skill-gaps", response_model=List[SkillGapItem])
def get_my_skill_gaps(current_user: dict = Depends(get_current_user)):
    db = get_database()
    target_role_id = current_user.get("target_role_id")

    if not target_role_id:
        return []

    # Get role requirements for target role
    role_reqs = get_role_competencies_for_role(db, target_role_id)
    if not role_reqs:
        return []

    # Get user assessed competencies
    user_comps = get_user_competencies(db, current_user["id"])

    # Get all competency metadata
    all_comps = get_all_competencies(db)
    comp_map = {c["competency_id"]: c for c in all_comps}

    # Calculate gaps
    return calculate_skill_gaps(
        target_role_id=target_role_id,
        role_competencies=role_reqs,
        user_competencies=user_comps,
        competencies_map=comp_map
    )
