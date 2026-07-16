import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.profile import router as profile_router
from app.mvp_backend import router as mvp_router


app = FastAPI(title="Health Profile API")

default_frontend_origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
}
configured_origins = os.getenv("CORS_ALLOW_ORIGINS")
allowed_origins = (
    [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
    if configured_origins
    else sorted(default_frontend_origins)
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_router)
app.include_router(mvp_router)
