"""Full MVP data API: food log, diary, macro targets, dashboard and insights."""
import json
import sqlite3
from datetime import date, datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field, field_validator

from app.repositories.profile_repository import DEFAULT_DATABASE_PATH, ProfileRepository

MealType = Literal["breakfast", "lunch", "dinner", "snack"]
Mood = Literal["great", "good", "okay", "tired", "stressed", "sad"]

class FoodLog(BaseModel):
    id: int | None = None
    entry_date: date = Field(default_factory=date.today)
    name: str = Field(min_length=1, max_length=120)
    calories: float = Field(ge=0, le=10000)
    protein: float = Field(ge=0, le=1000)
    carbs: float = Field(ge=0, le=1000)
    fat: float = Field(ge=0, le=1000)
    fiber: float = Field(default=0, ge=0, le=500)
    sugar: float = Field(default=0, ge=0, le=500)
    sodium: float = Field(default=0, ge=0, le=100000)
    meal_type: MealType
    serving_size: str = Field(min_length=1, max_length=80)
    created_at: datetime | None = None

    @field_validator("name", "serving_size")
    @classmethod
    def clean(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

class Diary(BaseModel):
    date: date
    weight_kg: float | None = Field(default=None, ge=0, le=500)
    sleep_hours: float | None = Field(default=None, ge=0, le=24)
    water_litres: float | None = Field(default=None, ge=0, le=30)
    mood: Mood | None = None
    hunger: int | None = Field(default=None, ge=1, le=10)
    energy_level: int | None = Field(default=None, ge=1, le=10)
    stress_level: int | None = Field(default=None, ge=1, le=10)
    exercise_minutes: int | None = Field(default=None, ge=0, le=1440)
    steps: int | None = Field(default=None, ge=0, le=200000)
    symptoms: list[str] = Field(default_factory=list)
    bowel_movement: bool | None = None
    menstrual_cycle: str | None = Field(default=None, max_length=80)
    medications_supplements: list[str] = Field(default_factory=list)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("symptoms", "medications_supplements", mode="before")
    @classmethod
    def clean_lists(cls, value: object) -> object:
        if not isinstance(value, list): return value
        result, seen = [], set()
        for item in value:
            if not isinstance(item, str): raise ValueError("items must be strings")
            item = item.strip()
            if item and item not in seen: result.append(item); seen.add(item)
        return result

class MealAllocation(BaseModel):
    meal_type: MealType
    calories: float = Field(ge=0)
    protein: float = Field(ge=0)
    carbs: float = Field(ge=0)
    fat: float = Field(ge=0)

class MacroPlan(BaseModel):
    calorie_target: float = Field(ge=800, le=10000)
    protein_target: float = Field(ge=0, le=1000)
    carbs_target: float = Field(ge=0, le=1000)
    fat_target: float = Field(ge=0, le=1000)
    meal_allocations: list[MealAllocation] = Field(default_factory=list)
    updated_at: datetime | None = None

def now() -> datetime: return datetime.now(timezone.utc).replace(microsecond=0)
def db(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, timeout=10); conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS food_log (id INTEGER PRIMARY KEY AUTOINCREMENT, entry_date TEXT NOT NULL, name TEXT NOT NULL, calories REAL NOT NULL, protein REAL NOT NULL, carbs REAL NOT NULL, fat REAL NOT NULL, fiber REAL NOT NULL DEFAULT 0, sugar REAL NOT NULL DEFAULT 0, sodium REAL NOT NULL DEFAULT 0, meal_type TEXT NOT NULL, serving_size TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS health_diary (id INTEGER PRIMARY KEY AUTOINCREMENT, entry_date TEXT NOT NULL UNIQUE, weight_kg REAL, sleep_hours REAL, water_litres REAL, mood TEXT, hunger INTEGER, energy_level INTEGER, stress_level INTEGER, exercise_minutes INTEGER, steps INTEGER, symptoms TEXT NOT NULL DEFAULT '[]', bowel_movement INTEGER, menstrual_cycle TEXT, medications_supplements TEXT NOT NULL DEFAULT '[]', notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS macro_plan (id INTEGER PRIMARY KEY CHECK(id=1), calorie_target REAL NOT NULL, protein_target REAL NOT NULL, carbs_target REAL NOT NULL, fat_target REAL NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS meal_allocations (id INTEGER PRIMARY KEY AUTOINCREMENT, macro_plan_id INTEGER NOT NULL DEFAULT 1, meal_type TEXT NOT NULL, calories REAL NOT NULL, protein REAL NOT NULL, carbs REAL NOT NULL, fat REAL NOT NULL, UNIQUE(macro_plan_id, meal_type), FOREIGN KEY(macro_plan_id) REFERENCES macro_plan(id) ON DELETE CASCADE);
    """)
    return conn

def food_dict(row: sqlite3.Row) -> dict:
    value = dict(row); value["entry_date"] = date.fromisoformat(value["entry_date"]); return value
def diary_dict(row: sqlite3.Row) -> dict:
    value = dict(row); value["date"] = date.fromisoformat(value.pop("entry_date")); value["symptoms"] = json.loads(value["symptoms"] or "[]"); value["medications_supplements"] = json.loads(value["medications_supplements"] or "[]"); value["bowel_movement"] = None if value["bowel_movement"] is None else bool(value["bowel_movement"]); return value

def targets(profile):
    factor = {"sedentary":1.2,"light":1.375,"moderate":1.55,"active":1.725,"very_active":1.9}[profile.activity_level]
    bmr = 10*profile.weight_kg + 6.25*profile.height_cm - 5*profile.age + (-161 if profile.gender == "female" else 5)
    tdee = bmr * factor; adjustment = {"lose_weight":-500,"maintain_weight":0,"gain_weight":300,"gain_muscle":200}[profile.goal]
    calories = max(800, round(tdee + adjustment)); protein = round(profile.weight_kg * (2 if profile.goal in {"lose_weight","gain_muscle"} else 1.6), 1); fat = round(calories*.3/9, 1); carbs = round(max(0,(calories-protein*4-fat*9)/4),1)
    allocations = [{"meal_type":m,"calories":round(calories*w),"protein":round(protein*w,1),"carbs":round(carbs*w,1),"fat":round(fat*w,1)} for m,w in (("breakfast",.25),("lunch",.35),("dinner",.3),("snack",.1))]
    return {"bmr":round(bmr,1),"tdee":round(tdee,1),"calorie_adjustment":adjustment,"calorie_target":calories,"protein_target":protein,"carbs_target":carbs,"fat_target":fat,"meal_allocations":allocations,"is_estimate":True,"estimate_note":"Estimates only; actual needs vary."}

router = APIRouter(tags=["MVP data"])
@lru_cache
def food_repo(): return DEFAULT_DATABASE_PATH
def food_path(): return food_repo()

@router.get("/api/food-log", response_model=list[FoodLog])
def list_food(date_: date | None = Query(None, alias="date")):
    with db(food_path()) as conn:
        rows=conn.execute("SELECT * FROM food_log WHERE entry_date=? ORDER BY created_at,id",((date_ or date.today()).isoformat(),)).fetchall()
    return [food_dict(r) for r in rows]

@router.post("/api/food-log", response_model=FoodLog, status_code=201)
def add_food(item: FoodLog):
    created=item.created_at or now()
    with db(food_path()) as conn:
        cur=conn.execute("INSERT INTO food_log(entry_date,name,calories,protein,carbs,fat,fiber,sugar,sodium,meal_type,serving_size,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(item.entry_date.isoformat(),item.name,item.calories,item.protein,item.carbs,item.fat,item.fiber,item.sugar,item.sodium,item.meal_type,item.serving_size,created.isoformat())); item_id=cur.lastrowid
        row=conn.execute("SELECT * FROM food_log WHERE id=?",(item_id,)).fetchone()
    return food_dict(row)

@router.put("/api/food-log/{item_id}", response_model=FoodLog)
def edit_food(item_id: int, item: FoodLog):
    with db(food_path()) as conn:
        if not conn.execute("SELECT 1 FROM food_log WHERE id=?",(item_id,)).fetchone(): raise HTTPException(404,"Food log entry not found")
        created=item.created_at or now(); conn.execute("UPDATE food_log SET entry_date=?,name=?,calories=?,protein=?,carbs=?,fat=?,fiber=?,sugar=?,sodium=?,meal_type=?,serving_size=?,created_at=? WHERE id=?",(item.entry_date.isoformat(),item.name,item.calories,item.protein,item.carbs,item.fat,item.fiber,item.sugar,item.sodium,item.meal_type,item.serving_size,created.isoformat(),item_id)); row=conn.execute("SELECT * FROM food_log WHERE id=?",(item_id,)).fetchone()
    return food_dict(row)

@router.delete("/api/food-log/{item_id}", status_code=204)
def remove_food(item_id: int):
    with db(food_path()) as conn:
        if conn.execute("DELETE FROM food_log WHERE id=?",(item_id,)).rowcount == 0: raise HTTPException(404,"Food log entry not found")
    return Response(status_code=204)

@router.get("/api/diary/{entry_date}", response_model=Diary)
def get_diary(entry_date: date):
    with db(food_path()) as conn: row=conn.execute("SELECT * FROM health_diary WHERE entry_date=?",(entry_date.isoformat(),)).fetchone()
    if row is None: raise HTTPException(404,"Health diary entry not found")
    return diary_dict(row)

@router.get("/api/diary", response_model=list[Diary])
def list_diary():
    with db(food_path()) as conn:
        rows = conn.execute("SELECT * FROM health_diary ORDER BY entry_date DESC").fetchall()
    return [diary_dict(row) for row in rows]

@router.put("/api/diary/{entry_date}", response_model=Diary)
def save_diary(entry_date: date, item: Diary):
    if item.date != entry_date: raise HTTPException(422,"Body date must match path date")
    stamp=now(); values=(item.date.isoformat(),item.weight_kg,item.sleep_hours,item.water_litres,item.mood,item.hunger,item.energy_level,item.stress_level,item.exercise_minutes,item.steps,json.dumps(item.symptoms),None if item.bowel_movement is None else int(item.bowel_movement),item.menstrual_cycle,json.dumps(item.medications_supplements),item.notes,stamp.isoformat(),stamp.isoformat())
    with db(food_path()) as conn:
        old=conn.execute("SELECT created_at FROM health_diary WHERE entry_date=?",(item.date.isoformat(),)).fetchone(); values=(*values[:-2],old["created_at"] if old else stamp.isoformat(),stamp.isoformat())
        conn.execute("INSERT INTO health_diary(entry_date,weight_kg,sleep_hours,water_litres,mood,hunger,energy_level,stress_level,exercise_minutes,steps,symptoms,bowel_movement,menstrual_cycle,medications_supplements,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(entry_date) DO UPDATE SET weight_kg=excluded.weight_kg,sleep_hours=excluded.sleep_hours,water_litres=excluded.water_litres,mood=excluded.mood,hunger=excluded.hunger,energy_level=excluded.energy_level,stress_level=excluded.stress_level,exercise_minutes=excluded.exercise_minutes,steps=excluded.steps,symptoms=excluded.symptoms,bowel_movement=excluded.bowel_movement,menstrual_cycle=excluded.menstrual_cycle,medications_supplements=excluded.medications_supplements,notes=excluded.notes,updated_at=excluded.updated_at",values); row=conn.execute("SELECT * FROM health_diary WHERE entry_date=?",(item.date.isoformat(),)).fetchone()
    return diary_dict(row)

@router.get("/api/nutrition/targets")
def get_targets(profile: Annotated[ProfileRepository, Depends(ProfileRepository)]):
    value=profile.get()
    if value is None: raise HTTPException(404,"Profile has not been created")
    return targets(value)

@router.get("/api/macro-plan")
def get_macro(profile: Annotated[ProfileRepository, Depends(ProfileRepository)]):
    value=profile.get()
    if value is None: raise HTTPException(404,"Profile has not been created")
    with db(food_path()) as conn:
        plan=conn.execute("SELECT * FROM macro_plan WHERE id=1").fetchone(); allocations=conn.execute("SELECT meal_type,calories,protein,carbs,fat FROM meal_allocations WHERE macro_plan_id=1").fetchall()
    if plan is None: return {k:v for k,v in targets(value).items() if k not in {"bmr","tdee","calorie_adjustment","is_estimate","estimate_note"}}
    result=dict(plan); result["meal_allocations"]=[dict(x) for x in allocations]; return result

@router.put("/api/macro-plan", response_model=MacroPlan)
def save_macro(plan: MacroPlan):
    stamp=plan.updated_at or now()
    with db(food_path()) as conn:
        conn.execute("INSERT INTO macro_plan VALUES(1,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET calorie_target=excluded.calorie_target,protein_target=excluded.protein_target,carbs_target=excluded.carbs_target,fat_target=excluded.fat_target,updated_at=excluded.updated_at",(plan.calorie_target,plan.protein_target,plan.carbs_target,plan.fat_target,stamp.isoformat())); conn.execute("DELETE FROM meal_allocations WHERE macro_plan_id=1"); conn.executemany("INSERT INTO meal_allocations(macro_plan_id,meal_type,calories,protein,carbs,fat) VALUES(1,?,?,?,?,?)",[(a.meal_type,a.calories,a.protein,a.carbs,a.fat) for a in plan.meal_allocations])
    return {**plan.model_dump(),"updated_at":stamp}

def totals(conn, day: date):
    row=conn.execute("SELECT COALESCE(SUM(calories),0) calories,COALESCE(SUM(protein),0) protein,COALESCE(SUM(carbs),0) carbs,COALESCE(SUM(fat),0) fat FROM food_log WHERE entry_date=?",(day.isoformat(),)).fetchone(); return {k:round(float(row[k]),1) for k in ("calories","protein","carbs","fat")}

@router.get("/api/dashboard")
def dashboard(date_: date | None=Query(None,alias="date"), profile: Annotated[ProfileRepository, Depends(ProfileRepository)]=None):
    value=profile.get()
    if value is None: raise HTTPException(404,"Profile has not been created")
    day=date_ or date.today()
    with db(food_path()) as conn:
        t=targets(value); x=totals(conn,day); d=conn.execute("SELECT * FROM health_diary WHERE entry_date=?",(day.isoformat(),)).fetchone(); meals=conn.execute("SELECT meal_type,SUM(calories) calories,COUNT(*) count FROM food_log WHERE entry_date=? GROUP BY meal_type",(day.isoformat(),)).fetchall()
    burned=(d["exercise_minutes"] or 0)*5 if d else 0
    return {"date":day,"calories_target":t["calorie_target"],"calories_consumed":x["calories"],"calories_burned":burned,"calories_remaining":round(t["calorie_target"]-x["calories"]+burned,1),"protein":{"consumed":x["protein"],"target":t["protein_target"],"remaining":round(t["protein_target"]-x["protein"],1)},"carbs":{"consumed":x["carbs"],"target":t["carbs_target"],"remaining":round(t["carbs_target"]-x["carbs"],1)},"fat":{"consumed":x["fat"],"target":t["fat_target"],"remaining":round(t["fat_target"]-x["fat"],1)},"water_litres":d["water_litres"] if d else None,"sleep_hours":d["sleep_hours"] if d else None,"weight_kg":d["weight_kg"] if d else None,"steps":d["steps"] if d else None,"exercise_minutes":d["exercise_minutes"] or 0 if d else 0,"meal_summary":[dict(m) for m in meals]}

@router.get("/api/progress")
def progress(start_date: date|None=None,end_date: date|None=None):
    end=end_date or date.today(); start=start_date or end-timedelta(days=6)
    if start>end: raise HTTPException(422,"start_date must be before or equal to end_date")
    with db(food_path()) as conn:
        points=[]; day=start
        while day<=end:
            d=conn.execute("SELECT * FROM health_diary WHERE entry_date=?",(day.isoformat(),)).fetchone(); x=totals(conn,day); points.append({"date":day,"weight_kg":d["weight_kg"] if d else None,"calories_consumed":x["calories"],"protein":x["protein"],"carbs":x["carbs"],"fat":x["fat"],"sleep_hours":d["sleep_hours"] if d else None,"water_litres":d["water_litres"] if d else None,"exercise_minutes":d["exercise_minutes"] or 0 if d else 0}); day+=timedelta(days=1)
    return {"start_date":start,"end_date":end,"points":points}

@router.get("/api/insights")
def insights(date_: date|None=Query(None,alias="date"), profile: Annotated[ProfileRepository, Depends(ProfileRepository)]=None):
    value=profile.get()
    if value is None: raise HTTPException(404,"Profile has not been created")
    day=date_ or date.today()
    with db(food_path()) as conn: x=totals(conn,day); d=conn.execute("SELECT * FROM health_diary WHERE entry_date=?",(day.isoformat(),)).fetchone()
    t=targets(value); result=[]
    result.append({"type":"warning" if x["calories"]>t["calorie_target"] else "positive","title":"Calories above target" if x["calories"]>t["calorie_target"] else "Calories on track","message":f"You have {round(t['calorie_target']-x['calories'])} kcal remaining in today's estimate.","metric":"calories"})
    if x["protein"]<t["protein_target"]: result.append({"type":"info","title":"Add more protein","message":f"Protein is {round(t['protein_target']-x['protein'])} g below the daily estimate.","metric":"protein"})
    if d and d["sleep_hours"] is not None and d["sleep_hours"]<6: result.append({"type":"warning","title":"Sleep is low","message":"Short sleep can make hunger harder to manage.","metric":"sleep_hours"})
    return {"date":day,"insights":result,"disclaimer":"AI insights are rule-based estimates, not medical advice."}
