from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.profile import router as profile_router


app = FastAPI(title="Health Profile API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_router)
