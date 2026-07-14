from copy import deepcopy
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.repositories.profile_repository import ProfileRepository
from app.schemas.profile import HealthProfile


def test_missing_profile_returns_404(client: TestClient) -> None:
    response = client.get("/api/profile")

    assert response.status_code == 404
    assert response.json() == {"detail": "Profile has not been created"}


def test_create_profile(client: TestClient, valid_profile: dict[str, object]) -> None:
    response = client.put("/api/profile", json=valid_profile)

    assert response.status_code == 200
    assert response.json() == valid_profile


def test_retrieve_saved_profile(
    client: TestClient, valid_profile: dict[str, object]
) -> None:
    client.put("/api/profile", json=valid_profile)

    response = client.get("/api/profile")

    assert response.status_code == 200
    assert response.json() == valid_profile


def test_profile_persists_when_repository_is_recreated(
    database_path: Path, valid_profile: dict[str, object]
) -> None:
    first_repository = ProfileRepository(database_path)
    first_repository.save(HealthProfile.model_validate(valid_profile))

    reopened_repository = ProfileRepository(database_path)

    assert reopened_repository.get() == HealthProfile.model_validate(valid_profile)


def test_put_replaces_entire_profile(
    client: TestClient, valid_profile: dict[str, object]
) -> None:
    client.put("/api/profile", json=valid_profile)
    replacement = {
        **valid_profile,
        "age": 35,
        "goal": "gain_muscle",
        "allergies": [],
        "avoided_foods": [],
    }

    client.put("/api/profile", json=replacement)

    assert client.get("/api/profile").json() == replacement


@pytest.mark.parametrize(
    ("field", "invalid_value"),
    [
        ("age", 10),
        ("height_cm", 300),
        ("weight_kg", 20),
        ("goal", "be_healthy"),
        ("activity_level", "sometimes"),
        ("diet_type", "anything"),
    ],
)
def test_invalid_profile_returns_422(
    client: TestClient,
    valid_profile: dict[str, object],
    field: str,
    invalid_value: object,
) -> None:
    payload = deepcopy(valid_profile)
    payload[field] = invalid_value

    response = client.put("/api/profile", json=payload)

    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/json")


def test_string_lists_are_normalized(
    client: TestClient, valid_profile: dict[str, object]
) -> None:
    payload = deepcopy(valid_profile)
    payload["allergies"] = [" peanut ", "", "peanut", " shrimp"]
    payload["avoided_foods"] = ["  ", "pork ", "pork"]

    response = client.put("/api/profile", json=payload)

    assert response.status_code == 200
    assert response.json()["allergies"] == ["peanut", "shrimp"]
    assert response.json()["avoided_foods"] == ["pork"]


def test_non_string_list_item_returns_422(
    client: TestClient, valid_profile: dict[str, object]
) -> None:
    payload = deepcopy(valid_profile)
    payload["allergies"] = ["peanut", 123]

    assert client.put("/api/profile", json=payload).status_code == 422


def test_cors_allows_frontend_origin(client: TestClient) -> None:
    response = client.options(
        "/api/profile",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "PUT",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:5173"
    )
