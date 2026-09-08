import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Official Statistics Capacity Building Platform"
    API_V1_STR: str = "/api/v1"
    
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/sih2_db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-jwt-key")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

    class Config:
        case_sensitive = True

settings = Settings()
