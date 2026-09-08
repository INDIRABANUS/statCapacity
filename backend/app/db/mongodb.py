import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

class Database:
    client: MongoClient = None

db = Database()

def connect_to_mongo():
    try:
        db.client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Verify connection
        db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB at {settings.MONGODB_URI}: {e}")

def close_mongo_connection():
    if db.client:
        db.client.close()
        logger.info("Closed MongoDB connection.")

def get_database():
    if db.client:
        return db.client.get_default_database()
    return None

def check_db_health() -> bool:
    if not db.client:
        return False
    try:
        db.client.admin.command('ping')
        return True
    except ConnectionFailure:
        return False
