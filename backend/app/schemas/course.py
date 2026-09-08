from pydantic import BaseModel
from typing import List, Optional

class CourseResponse(BaseModel):
    course_id: str
    source: str
    title: str
    description: str
    category: str
    skills: List[str]
    competencies: List[str]
    target_roles: List[str]
    difficulty: str
    duration_hours: float

class MatchedGapItem(BaseModel):
    competency_id: str
    competency: str
    gap: int
    severity: str

class CourseRecommendationItem(BaseModel):
    course_id: str
    title: str
    source: str
    description: str
    category: str
    difficulty: str
    duration_hours: float
    recommendation_score: float
    priority: str
    matched_competencies: List[str]
    matched_skills: List[str]
    matched_gaps: List[MatchedGapItem]
    reason: str

class RecommendationResponse(BaseModel):
    target_role_id: Optional[str] = None
    message: str
    count: int
    recommendations: List[CourseRecommendationItem]
