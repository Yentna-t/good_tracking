import json
import os
import sqlite3
from pathlib import Path

from app.schemas.profile import HealthProfile


DEFAULT_DATABASE_PATH = Path(__file__).resolve().parents[2] / "data" / "profile.db"


class ProfileRepository:
    """SQLite storage for the application's single health profile."""

    def __init__(self, database_path: str | Path | None = None) -> None:
        configured_path = database_path or os.getenv("PROFILE_DB_PATH")
        self._database_path = Path(configured_path or DEFAULT_DATABASE_PATH)
        self._database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_database()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._database_path, timeout=10)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize_database(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS profile (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    age INTEGER NOT NULL,
                    height_cm REAL NOT NULL,
                    weight_kg REAL NOT NULL,
                    goal TEXT NOT NULL,
                    activity_level TEXT NOT NULL,
                    diet_type TEXT NOT NULL,
                    allergies TEXT NOT NULL,
                    avoided_foods TEXT NOT NULL
                )
                """
            )

    def get(self) -> HealthProfile | None:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT age, height_cm, weight_kg, goal, activity_level,
                       diet_type, allergies, avoided_foods
                FROM profile
                WHERE id = 1
                """
            ).fetchone()

        if row is None:
            return None

        return HealthProfile(
            age=row["age"],
            height_cm=row["height_cm"],
            weight_kg=row["weight_kg"],
            goal=row["goal"],
            activity_level=row["activity_level"],
            diet_type=row["diet_type"],
            allergies=json.loads(row["allergies"]),
            avoided_foods=json.loads(row["avoided_foods"]),
        )

    def save(self, profile: HealthProfile) -> HealthProfile:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO profile (
                    id, age, height_cm, weight_kg, goal, activity_level,
                    diet_type, allergies, avoided_foods
                )
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    age = excluded.age,
                    height_cm = excluded.height_cm,
                    weight_kg = excluded.weight_kg,
                    goal = excluded.goal,
                    activity_level = excluded.activity_level,
                    diet_type = excluded.diet_type,
                    allergies = excluded.allergies,
                    avoided_foods = excluded.avoided_foods
                """,
                (
                    profile.age,
                    profile.height_cm,
                    profile.weight_kg,
                    profile.goal,
                    profile.activity_level,
                    profile.diet_type,
                    json.dumps(profile.allergies, ensure_ascii=False),
                    json.dumps(profile.avoided_foods, ensure_ascii=False),
                ),
            )
        return profile.model_copy(deep=True)

    def clear(self) -> None:
        """Remove the stored profile."""
        with self._connect() as connection:
            connection.execute("DELETE FROM profile WHERE id = 1")
