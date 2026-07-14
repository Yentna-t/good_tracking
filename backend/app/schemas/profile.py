from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


HealthGoal = Literal[
    "lose_weight",
    "maintain_weight",
    "gain_weight",
    "gain_muscle",
]

ActivityLevel = Literal[
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
]

DietType = Literal[
    "balanced",
    "vegetarian",
    "vegan",
    "keto",
    "halal",
    "other",
]


class HealthProfile(BaseModel):
    age: int = Field(ge=13, le=100)
    height_cm: float = Field(ge=100, le=250)
    weight_kg: float = Field(ge=30, le=300)
    goal: HealthGoal
    activity_level: ActivityLevel
    diet_type: DietType
    allergies: list[str] = Field(default_factory=list)
    avoided_foods: list[str] = Field(default_factory=list)

    @field_validator("allergies", "avoided_foods", mode="before")
    @classmethod
    def normalize_string_list(cls, value: Any) -> Any:
        if not isinstance(value, list):
            return value

        normalized: list[str] = []
        seen: set[str] = set()
        for item in value:
            if not isinstance(item, str):
                raise ValueError("items must be strings")
            item = item.strip()
            if item and item not in seen:
                normalized.append(item)
                seen.add(item)
        return normalized
