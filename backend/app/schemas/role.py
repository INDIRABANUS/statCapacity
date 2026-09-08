from pydantic import BaseModel

class RoleResponse(BaseModel):
    role_id: str
    role_name: str
    department: str
    description: str
