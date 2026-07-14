# Health Profile API

FastAPI backend for storing and retrieving the current Health Profile. The profile
is persisted in a local SQLite database and remains available after server restarts.

## Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## Run

```powershell
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000` and its interactive documentation
is available at `http://localhost:8000/docs`.

By default, the SQLite database is created at `backend/data/profile.db`. Set the
`PROFILE_DB_PATH` environment variable before starting the server to use another
location.

## Test

```powershell
pytest
```

## Endpoints

- `GET /api/profile` returns the current profile, or `404` when none exists.
- `PUT /api/profile` creates or completely replaces the current profile.
