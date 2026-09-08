from typing import List, Dict, Any, Optional
from app.services.course_providers.base import CourseProvider
from app.services.course_providers.igot_provider import MockIGOTCourseProvider
from app.services.course_providers.nssta_provider import MockNSSSTACourseProvider

class CourseProviderRegistry:
    def __init__(self):
        self._providers: Dict[str, CourseProvider] = {
            "iGOT": MockIGOTCourseProvider(),
            "NSSSTA": MockNSSSTACourseProvider()
        }

    def register_provider(self, provider: CourseProvider):
        self._providers[provider.provider_name] = provider

    def get_provider(self, name: str) -> Optional[CourseProvider]:
        return self._providers.get(name)

    def get_all_courses(self, db, source: Optional[str] = None) -> List[Dict[str, Any]]:
        if source and source.strip():
            src = source.strip()
            # Case-insensitive provider match
            for prov_name, prov in self._providers.items():
                if prov_name.lower() == src.lower():
                    return prov.get_courses(db)
            return []
        
        all_courses = []
        for provider in self._providers.values():
            all_courses.extend(provider.get_courses(db))
        return all_courses

course_registry = CourseProviderRegistry()
