from threading import Lock

from app.schemas.profile import HealthProfile


class ProfileRepository:
    """Thread-safe in-memory storage for the application's single profile."""

    def __init__(self) -> None:
        self._profile: HealthProfile | None = None
        self._lock = Lock()

    def get(self) -> HealthProfile | None:
        with self._lock:
            if self._profile is None:
                return None
            return self._profile.model_copy(deep=True)

    def save(self, profile: HealthProfile) -> HealthProfile:
        with self._lock:
            self._profile = profile.model_copy(deep=True)
            return self._profile.model_copy(deep=True)

    def clear(self) -> None:
        """Remove the stored profile. Primarily useful for isolated tests."""
        with self._lock:
            self._profile = None
