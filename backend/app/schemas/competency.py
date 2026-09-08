from pydantic import BaseModel, Field
from typing import Optional, Dict, List

class CompetencyResponse(BaseModel):
    competency_id: str
    name: str
    category: str
    description: str
    proficiency_levels: Optional[Dict[str, str]] = None

class UserCompetencyItem(BaseModel):
    competency_id: str
    current_level: int = Field(..., ge=0, le=100)

class UserCompetenciesUpdateRequest(BaseModel):
    competencies: List[UserCompetencyItem]

class UserCompetencyResponse(BaseModel):
    user_id: str
    competency_id: str
    current_level: int
    source: str = "self_assessment"
    updated_at: str

class SkillGapItem(BaseModel):
    competency_id: str
    competency: str
    category: str
    current_level: int
    required_level: int
    gap: int
    severity: str
    explanation: str
