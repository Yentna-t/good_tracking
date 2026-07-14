from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.repositories.profile_repository import ProfileRepository
from app.schemas.profile import HealthProfile


router = APIRouter(prefix="/api/profile", tags=["profile"])
_profile_repository = ProfileRepository()


def get_profile_repository() -> ProfileRepository:
    return _profile_repository


Repository = Annotated[ProfileRepository, Depends(get_profile_repository)]


@router.get("", response_model=HealthProfile)
def get_profile(repository: Repository) -> HealthProfile:
    profile = repository.get()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile has not been created",
        )
    return profile


@router.put("", response_model=HealthProfile)
def put_profile(profile: HealthProfile, repository: Repository) -> HealthProfile:
    return repository.save(profile)
