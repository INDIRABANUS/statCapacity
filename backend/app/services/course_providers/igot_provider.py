import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.services.course_providers.base import CourseProvider

DATA_FILE = Path(__file__).resolve().parent.parent.parent.parent.parent / "data" / "igot_courses.json"

class MockIGOTCourseProvider(CourseProvider):
    """
    Mock / Prototype Provider for iGOT Karmayogi civil service courses.
    Reads from seeded MongoDB 'courses' collection or falls back to 'data/igot_courses.json'.
    Prepares system for seamless upgrade to live REST/GraphQL iGOT APIs.
    """

    @property
    def provider_name(self) -> str:
        return "iGOT"

    @property
    def is_mock(self) -> bool:
        return True

    def _load_from_file(self) -> List[Dict[str, Any]]:
        try:
            if DATA_FILE.exists():
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return []

    def get_courses(self, db) -> List[Dict[str, Any]]:
        if db is not None:
            try:
                courses = list(db.courses.find({"source": "iGOT"}, {"_id": 0}))
                if courses and len(courses) > 0:
                    return courses
            except Exception:
                pass
        return self._load_from_file()

    def get_course_by_id(self, db, course_id: str) -> Optional[Dict[str, Any]]:
        if not course_id:
            return None
        if db is not None:
            try:
                course = db.courses.find_one({"course_id": course_id, "source": "iGOT"}, {"_id": 0})
                if course:
                    return course
            except Exception:
                pass
        for c in self._load_from_file():
            if c.get("course_id") == course_id:
                return c
        return None
