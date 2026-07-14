import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories.profile_repository import ProfileRepository
from app.routers.profile import get_profile_repository


@pytest.fixture
def repository() -> ProfileRepository:
    return ProfileRepository()


@pytest.fixture
def client(repository: ProfileRepository) -> TestClient:
    app.dependency_overrides[get_profile_repository] = lambda: repository
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def valid_profile() -> dict[str, object]:
    return {
        "age": 22,
        "height_cm": 170,
        "weight_kg": 72.5,
        "goal": "lose_weight",
        "activity_level": "moderate",
        "diet_type": "balanced",
        "allergies": ["peanut", "shrimp"],
        "avoided_foods": ["pork"],
    }
