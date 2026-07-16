from fastapi.testclient import TestClient


def test_food_log_crud(client: TestClient) -> None:
    for existing in client.get("/api/food-log?date=2026-07-13").json():
        client.delete(f"/api/food-log/{existing['id']}")
    payload = {"entry_date":"2026-07-13","name":"Oats","calories":300,"protein":15,"carbs":40,"fat":8,"meal_type":"breakfast","serving_size":"1 bowl"}
    response = client.post("/api/food-log", json=payload)
    assert response.status_code == 201
    item_id = response.json()["id"]
    assert len(client.get("/api/food-log?date=2026-07-13").json()) == 1
    assert client.put(f"/api/food-log/{item_id}", json={**payload,"calories":350}).json()["calories"] == 350
    assert client.delete(f"/api/food-log/{item_id}").status_code == 204


def test_diary_dashboard_and_targets(client: TestClient, valid_profile: dict[str, object]) -> None:
    client.put("/api/profile", json=valid_profile)
    assert client.get("/api/nutrition/targets").json()["is_estimate"] is True
    diary = {"date":"2026-07-13","weight_kg":72.4,"sleep_hours":6,"water_litres":1.8,"exercise_minutes":30,"steps":5000}
    assert client.put("/api/diary/2026-07-13", json=diary).status_code == 200
    assert client.get("/api/dashboard?date=2026-07-13").json()["calories_burned"] == 150
    assert len(client.get("/api/progress?start_date=2026-07-10&end_date=2026-07-13").json()["points"]) == 4
