from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class CourseProvider(ABC):
    """
    Abstract base provider class for course catalogs.
    Enables pluggable integration between prototype static seeds
    and future live iGOT Karmayogi API adapters without breaking
    downstream recommendation services.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """The source identity identifier (e.g. 'iGOT', 'NSSSTA')."""
        pass

    @property
    @abstractmethod
    def is_mock(self) -> bool:
        """Indicates whether this provider yields prototype/mock demonstration data."""
        pass

    @abstractmethod
    def get_courses(self, db) -> List[Dict[str, Any]]:
        """Retrieve all courses for this provider."""
        pass

    @abstractmethod
    def get_course_by_id(self, db, course_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific course by its unique course_id."""
        pass
