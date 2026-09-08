from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, protected, roles, users, competencies

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles"])
api_router.include_router(competencies.router, prefix="/competencies", tags=["Competencies"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(protected.router, prefix="/protected", tags=["Protected RBAC"])
