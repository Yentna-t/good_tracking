import type {
  AIInsight,
  FoodEntry,
  FoodEntryInput,
  FoodLog,
  HealthDiaryEntry,
  HealthDiaryInput,
  InsightContext,
  MacroPlan,
  MealDistribution,
  MealSuggestion,
  MealType,
  Level,
  Mood,
  NutritionTotals,
} from "../types/feature";

const API_URL = (import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : "http://localhost:8000")).replace(/\/$/, "");
const STORAGE_PREFIX = "aict.features.";
const FALLBACK_HISTORY_DAYS = 6;

const today = () => new Date().toISOString().slice(0, 10);
const meals: MealType[] = ["breakfast", "lunch", "dinner", "snacks"];

const baseFoodCatalog = {
  breakfast: [
    { name: "ข้าวต้มหมู + boiled egg", serving: "1 bowl", calories: 320, protein_g: 20, carbs_g: 35, fat_g: 10 },
    { name: "Overnight oats + banana", serving: "1 jar", calories: 360, protein_g: 16, carbs_g: 54, fat_g: 9 },
    { name: "Greek yogurt & berries", serving: "1 bowl", calories: 300, protein_g: 22, carbs_g: 34, fat_g: 8 },
  ],
  lunch: [
    { name: "กะเพราไก่ไข่ดาว", serving: "1 plate", calories: 720, protein_g: 36, carbs_g: 74, fat_g: 30 },
    { name: "Chicken rice + cucumber", serving: "1 plate", calories: 630, protein_g: 32, carbs_g: 78, fat_g: 19 },
    { name: "Salmon rice bowl", serving: "1 bowl", calories: 610, protein_g: 34, carbs_g: 60, fat_g: 24 },
  ],
  dinner: [
    { name: "Tofu stir-fry + brown rice", serving: "1 plate", calories: 520, protein_g: 28, carbs_g: 50, fat_g: 20 },
    { name: "ต้มยำปลา + rice", serving: "1 set", calories: 460, protein_g: 35, carbs_g: 42, fat_g: 16 },
    { name: "Chicken salad wrap", serving: "1 wrap", calories: 430, protein_g: 30, carbs_g: 34, fat_g: 18 },
  ],
  snacks: [
    { name: "Protein shake", serving: "1 bottle", calories: 180, protein_g: 24, carbs_g: 8, fat_g: 5 },
    { name: "Apple + peanut butter", serving: "1 snack set", calories: 210, protein_g: 6, carbs_g: 24, fat_g: 11 },
    { name: "Mixed nuts", serving: "30 g", calories: 170, protein_g: 5, carbs_g: 6, fat_g: 14 },
  ],
} satisfies Record<MealType, Omit<FoodEntry, "id" | "date" | "meal" | "source">[]>;

const disclaimerText = "Health estimate only — not a diagnosis and not a replacement for medical care.";

export class FeatureApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "FeatureApiError";
  }
}

function seedFromString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pseudo(seed: number, offset = 0): number {
  const next = Math.sin(seed + offset * 12.9898) * 43758.5453;
  return next - Math.floor(next);
}

function pickOne<T>(items: readonly T[], seed: number, offset = 0): T {
  return items[Math.floor(pseudo(seed, offset) * items.length) % items.length];
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function toDateOffset(date: string, offset: number): string {
  const current = new Date(`${date}T00:00:00`);
  current.setDate(current.getDate() + offset);
  return current.toISOString().slice(0, 10);
}

function makeId(prefix: string, stableKey: string) {
  return `${prefix}-${seedFromString(stableKey).toString(36)}`;
}

function getStored<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_PREFIX + key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function setStored(key: string, value: unknown) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  }
}

function totals(entries: FoodEntry[]): NutritionTotals {
  return entries.reduce<NutritionTotals>(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      protein_g: sum.protein_g + entry.protein_g,
      carbs_g: sum.carbs_g + entry.carbs_g,
      fat_g: sum.fat_g + entry.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

function makeFallbackFoodEntries(date: string): FoodEntry[] {
  const seed = seedFromString(date);
  return meals.map((meal, index) => {
    const choice = pickOne(baseFoodCatalog[meal], seed, index + 1);
    const photoSource = meal === "lunch" && pseudo(seed, index + 50) > 0.45;

    return {
      ...choice,
      id: makeId(`food-${meal}`, `${date}-${meal}`),
      date,
      meal,
      source: photoSource ? "photo_scan" : "manual",
      confidence: photoSource ? Number((0.74 + pseudo(seed, index + 90) * 0.2).toFixed(2)) : undefined,
    };
  });
}

function fallbackFoodLog(date: string): FoodLog {
  const stored = getStored<FoodEntry[]>(`food.${date}`);
  const entries = stored ?? makeFallbackFoodEntries(date);
  return { date, entries, totals: totals(entries) };
}

function fallbackDiaryEntry(date: string): HealthDiaryEntry {
  const seed = seedFromString(`diary-${date}`);
  const moods: HealthDiaryEntry["mood"][] = ["good", "okay", "great", "low"];
  const levels: NonNullable<HealthDiaryEntry["energy"]>[] = ["low", "medium", "high"];

  return {
    id: makeId("diary", date),
    date,
    weight_kg: Number((57 + pseudo(seed, 1) * 8).toFixed(1)),
    sleep_hours: Number((5.8 + pseudo(seed, 2) * 2.4).toFixed(1)),
    water_liters: Number((1.4 + pseudo(seed, 3) * 1.5).toFixed(1)),
    mood: pickOne(moods, seed, 4),
    hunger: pickOne(levels, seed, 5),
    energy: pickOne(levels, seed, 6),
    stress: pickOne(levels, seed, 7),
    exercise: pseudo(seed, 8) > 0.5 ? "เดินเร็ว 25 นาที + stretch" : "Rest day / active recovery",
    symptoms: pseudo(seed, 9) > 0.7 ? "ท้องอืดเล็กน้อยช่วงบ่าย" : "",
    bowel_movement: pseudo(seed, 10) > 0.35 ? "ปกติ / normal" : "ยังไม่ได้ถ่าย",
    menstrual_cycle: pseudo(seed, 11) > 0.82 ? "Period day 2" : "",
    medications_supplements: "Fish oil, vitamin D",
    notes: pseudo(seed, 12) > 0.5 ? "วันนี้หิวเร็วหลังนอนน้อย" : "Overall okay, focus on water and protein.",
  };
}

function mergeHistoryWithFallback(storedEntries: HealthDiaryEntry[], referenceDate: string): HealthDiaryEntry[] {
  const byDate = new Map(storedEntries.map((entry) => [entry.date, entry]));
  for (let offset = 0; offset < FALLBACK_HISTORY_DAYS; offset += 1) {
    const date = toDateOffset(referenceDate, -offset);
    if (!byDate.has(date)) {
      byDate.set(date, fallbackDiaryEntry(date));
    }
  }
  return [...byDate.values()].sort((left, right) => right.date.localeCompare(left.date));
}

function buildMacroTargets(calories: number) {
  const protein_percent = 30;
  const carbs_percent = 40;
  const fat_percent = 30;

  return {
    calories,
    protein_g: Math.round((calories * protein_percent) / 100 / 4),
    carbs_g: Math.round((calories * carbs_percent) / 100 / 4),
    fat_g: Math.round((calories * fat_percent) / 100 / 9),
    protein_percent,
    carbs_percent,
    fat_percent,
  };
}

function buildDistribution(targets: MacroPlan["targets"]): MealDistribution[] {
  const percents = [0.25, 0.35, 0.28, 0.12];

  return meals.map((meal, index) => ({
    meal,
    calories: Math.round(targets.calories * percents[index]),
    protein_g: Math.round(targets.protein_g * percents[index]),
    carbs_g: Math.round(targets.carbs_g * percents[index]),
    fat_g: Math.round(targets.fat_g * percents[index]),
  }));
}

function buildSuggestions(targets: MacroPlan["targets"], date: string): MealSuggestion[] {
  const seed = seedFromString(`macro-suggestion-${date}`);
  const ideas: Record<MealType, Array<Omit<MealSuggestion, "id" | "meal">>> = {
    breakfast: [
      { name: "Egg wrap + soy milk", description: "โปรตีนดี เริ่มวันง่าย", calories: 420, protein_g: 28 },
      { name: "Greek yogurt bowl", description: "คุมแคลได้และอิ่มนาน", calories: 380, protein_g: 24 },
    ],
    lunch: [
      { name: "Chicken basil rice", description: "Thai comfort food with extra protein", calories: 560, protein_g: 38 },
      { name: "Grilled chicken + brown rice", description: "บาลานซ์ดีสำหรับ workday", calories: 540, protein_g: 42 },
    ],
    dinner: [
      { name: "Salmon + roasted vegetables", description: "Omega-3 and lighter carbs", calories: 520, protein_g: 34 },
      { name: "Tofu veggie stir-fry", description: "เพิ่มไฟเบอร์และอิ่มสบาย", calories: 450, protein_g: 26 },
    ],
    snacks: [
      { name: "Protein yogurt cup", description: "แก้หิวช่วงบ่ายแบบไม่หลุดเป้า", calories: 190, protein_g: 18 },
      { name: "Edamame + fruit", description: "คาร์บไม่สูงมากและมีไฟเบอร์", calories: 210, protein_g: 14 },
    ],
  };

  return meals.map((meal, index) => {
    const picked = pickOne(ideas[meal], seed, index + 1);
    return {
      id: makeId(`suggestion-${meal}`, `${date}-${meal}-${picked.name}`),
      meal,
      ...picked,
      calories: clamp(picked.calories, 120, Math.round(targets.calories * 0.4)),
    };
  });
}

function fallbackMacroPlan(date: string): MacroPlan {
  const stored = getStored<MacroPlan>(`macro.${date}`);
  if (stored) return stored;

  const seed = seedFromString(`macro-${date}`);
  const calories = 1800 + Math.round(pseudo(seed, 1) * 5) * 100;
  const targets = buildMacroTargets(calories);
  const suggestions = buildSuggestions(targets, date);

  return {
    date,
    targets,
    distribution: buildDistribution(targets),
    suggestions,
    shopping_list: [
      "Chicken breast",
      "ไข่ / eggs",
      "Brown rice",
      "Greek yogurt",
      "Salmon or tofu",
      "Leafy greens",
      "Fruit for snacks",
    ],
  };
}

const parseResponse = async (response: Response) => {
  let detail: unknown;
  try {
    detail = (await response.json()).detail;
  } catch {
    detail = undefined;
  }

  return new FeatureApiError(
    typeof detail === "string" ? detail : "Unable to complete this request.",
    response.status,
  );
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    throw await parseResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function shouldFallback(error: unknown) {
  return !(error instanceof FeatureApiError) || [404, 405, 500].includes(error.status);
}

type BackendFoodEntry = {
  id?: number;
  entry_date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  serving_size: string;
  created_at?: string;
};

const toBackendMeal = (meal: MealType) => meal === "snacks" ? "snack" : meal;
const fromBackendMeal = (meal: BackendFoodEntry["meal_type"]): MealType => meal === "snack" ? "snacks" : meal;

function fromBackendFood(entry: BackendFoodEntry): FoodEntry {
  return { id: String(entry.id ?? makeId("food", `${entry.entry_date}-${entry.name}`)), date: entry.entry_date, name: entry.name, serving: entry.serving_size, calories: entry.calories, protein_g: entry.protein, carbs_g: entry.carbs, fat_g: entry.fat, meal: fromBackendMeal(entry.meal_type), source: "manual" };
}

function toBackendFood(input: FoodEntryInput): BackendFoodEntry {
  return { entry_date: input.date ?? today(), name: input.name, calories: input.calories, protein: input.protein_g, carbs: input.carbs_g, fat: input.fat_g, meal_type: toBackendMeal(input.meal) as BackendFoodEntry["meal_type"], serving_size: input.serving };
}

function totalsFromEntries(entries: FoodEntry[]): NutritionTotals {
  return entries.reduce<NutritionTotals>((sum, entry) => ({ calories: sum.calories + entry.calories, protein_g: sum.protein_g + entry.protein_g, carbs_g: sum.carbs_g + entry.carbs_g, fat_g: sum.fat_g + entry.fat_g }), { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
}

type BackendDiaryEntry = { date: string; weight_kg?: number; sleep_hours?: number; water_litres?: number; mood?: "great" | "good" | "okay" | "tired" | "stressed" | "sad"; hunger?: number; energy_level?: number; stress_level?: number; exercise_minutes?: number; steps?: number; symptoms?: string[]; bowel_movement?: boolean; menstrual_cycle?: string; medications_supplements?: string[]; notes?: string };
const toLevel = (value?: number): Level | undefined => value === undefined ? undefined : value <= 3 ? "low" : value >= 7 ? "high" : "medium";
const fromLevel = (value?: Level): number | undefined => value === undefined ? undefined : value === "low" ? 3 : value === "high" ? 8 : 5;
function fromBackendDiary(entry: BackendDiaryEntry): HealthDiaryEntry { return { id: makeId("diary", entry.date), date: entry.date, weight_kg: entry.weight_kg, sleep_hours: entry.sleep_hours, water_liters: entry.water_litres, mood: entry.mood === "tired" || entry.mood === "sad" ? "low" : entry.mood, hunger: toLevel(entry.hunger), energy: toLevel(entry.energy_level), stress: toLevel(entry.stress_level), exercise: entry.exercise_minutes ? `${entry.exercise_minutes} minutes` : "", symptoms: entry.symptoms?.join(", ") ?? "", bowel_movement: entry.bowel_movement === true ? "Normal" : entry.bowel_movement === false ? "Not recorded" : "", menstrual_cycle: entry.menstrual_cycle ?? "", medications_supplements: entry.medications_supplements?.join(", ") ?? "", notes: entry.notes ?? "" }; }
function toBackendDiary(input: HealthDiaryInput): BackendDiaryEntry { return { date: input.date, weight_kg: input.weight_kg, sleep_hours: input.sleep_hours, water_litres: input.water_liters, mood: input.mood === "low" ? "tired" : input.mood, hunger: fromLevel(input.hunger), energy_level: fromLevel(input.energy), stress_level: fromLevel(input.stress), exercise_minutes: input.exercise ? Number(input.exercise.match(/\d+/)?.[0] ?? 0) : 0, symptoms: input.symptoms ? input.symptoms.split(",").map((item) => item.trim()).filter(Boolean) : [], bowel_movement: input.bowel_movement ? input.bowel_movement.toLowerCase().includes("normal") : undefined, menstrual_cycle: input.menstrual_cycle, medications_supplements: input.medications_supplements ? input.medications_supplements.split(",").map((item) => item.trim()).filter(Boolean) : [], notes: input.notes }; }

type BackendMacroPlan = { calorie_target: number; protein_target: number; carbs_target: number; fat_target: number; meal_allocations?: Array<{ meal_type: "breakfast" | "lunch" | "dinner" | "snack"; calories: number; protein: number; carbs: number; fat: number }>; };
function fromBackendMacro(raw: BackendMacroPlan, date: string): MacroPlan { const targets = { calories: raw.calorie_target, protein_g: raw.protein_target, carbs_g: raw.carbs_target, fat_g: raw.fat_target, protein_percent: Math.round(raw.protein_target * 4 / raw.calorie_target * 100), carbs_percent: Math.round(raw.carbs_target * 4 / raw.calorie_target * 100), fat_percent: Math.round(raw.fat_target * 9 / raw.calorie_target * 100) }; const distribution = (raw.meal_allocations ?? []).map((item) => ({ meal: fromBackendMeal(item.meal_type), calories: item.calories, protein_g: item.protein, carbs_g: item.carbs, fat_g: item.fat })); return { date, targets, distribution: distribution.length ? distribution : buildDistribution(targets), suggestions: buildSuggestions(targets, date), shopping_list: ["Chicken breast", "Eggs", "Greek yogurt", "Brown rice", "Leafy greens"] }; }

export type DashboardData = {
  date: string;
  calories_target: number;
  calories_consumed: number;
  calories_burned: number;
  calories_remaining: number;
  protein: { consumed: number; target: number; remaining: number };
  carbs: { consumed: number; target: number; remaining: number };
  fat: { consumed: number; target: number; remaining: number };
  water_litres?: number | null;
  sleep_hours?: number | null;
  weight_kg?: number | null;
  steps?: number | null;
  exercise_minutes: number;
  meal_summary: Array<{ meal_type: string; calories: number; count: number }>;
};

export type ProgressPoint = {
  date: string;
  weight_kg?: number | null;
  calories_consumed: number;
  protein: number;
  carbs: number;
  fat: number;
  sleep_hours?: number | null;
  water_litres?: number | null;
  exercise_minutes: number;
};

export type ProgressData = { start_date: string; end_date: string; points: ProgressPoint[] };

export async function getDashboard(date = today()): Promise<DashboardData> {
  return request<DashboardData>(`/api/dashboard?date=${encodeURIComponent(date)}`);
}

export async function getProgress(startDate: string, endDate: string): Promise<ProgressData> {
  return request<ProgressData>(`/api/progress?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`);
}

export async function getFoodLog(date = today()): Promise<FoodLog> {
  try {
    const entries = (await request<BackendFoodEntry[]>(`/api/food-log?date=${encodeURIComponent(date)}`)).map(fromBackendFood);
    return { date, entries, totals: totalsFromEntries(entries) };
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    return fallbackFoodLog(date);
  }
}

export async function addFoodEntry(input: FoodEntryInput): Promise<FoodEntry> {
  try {
    return fromBackendFood(await request<BackendFoodEntry>("/api/food-log", { method: "POST", body: JSON.stringify(toBackendFood(input)) }));
  } catch (error) {
    if (!shouldFallback(error)) throw error;

    const date = input.date ?? today();
    const current = getStored<FoodEntry[]>(`food.${date}`) ?? fallbackFoodLog(date).entries;
    const entry: FoodEntry = {
      ...input,
      id: makeId("food", `${date}-${input.meal}-${input.name}-${current.length}`),
      date,
      source: input.source ?? "manual",
      confidence: input.source === "photo_scan" ? input.confidence ?? 0.82 : undefined,
    };

    const next = [...current, entry];
    setStored(`food.${date}`, next);
    return entry;
  }
}

export async function updateFoodEntry(entryId: string, input: FoodEntryInput): Promise<FoodEntry> {
  try {
    return fromBackendFood(await request<BackendFoodEntry>(`/api/food-log/${encodeURIComponent(entryId)}`, {
      method: "PUT",
      body: JSON.stringify(toBackendFood(input)),
    }));
  } catch (error) {
    if (!shouldFallback(error)) throw error;

    const date = input.date ?? today();
    const current = getStored<FoodEntry[]>(`food.${date}`) ?? fallbackFoodLog(date).entries;
    const updated: FoodEntry = {
      ...input,
      id: entryId,
      date,
      source: input.source ?? "manual",
      confidence: input.source === "photo_scan" ? input.confidence ?? 0.82 : undefined,
    };

    const next = current.map((item) => (item.id === entryId ? updated : item));
    setStored(`food.${date}`, next);
    return updated;
  }
}

export async function deleteFoodEntry(entryId: string, date = today()): Promise<void> {
  try {
    await request<void>(`/api/food-log/${encodeURIComponent(entryId)}?date=${encodeURIComponent(date)}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    const current = getStored<FoodEntry[]>(`food.${date}`) ?? fallbackFoodLog(date).entries;
    setStored(
      `food.${date}`,
      current.filter((item) => item.id !== entryId),
    );
  }
}

export async function getHealthDiary(date = today()): Promise<HealthDiaryEntry | null> {
  try {
    return fromBackendDiary(await request<BackendDiaryEntry>(`/api/diary/${encodeURIComponent(date)}`));
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    return getStored<HealthDiaryEntry>(`diary.${date}`) ?? fallbackDiaryEntry(date);
  }
}

export async function getHealthDiaryHistory(referenceDate = today()): Promise<HealthDiaryEntry[]> {
  try {
    return (await request<BackendDiaryEntry[]>("/api/diary")).map(fromBackendDiary);
  } catch (error) {
    if (!shouldFallback(error)) throw error;

    const storedEntries =
      typeof window === "undefined"
        ? []
        : Object.keys(window.localStorage)
            .filter((key) => key.startsWith(STORAGE_PREFIX + "diary."))
            .map((key) => window.localStorage.getItem(key))
            .filter((value): value is string => Boolean(value))
            .map((value) => JSON.parse(value) as HealthDiaryEntry);

    return mergeHistoryWithFallback(storedEntries, referenceDate);
  }
}

export async function saveHealthDiary(input: HealthDiaryInput): Promise<HealthDiaryEntry> {
  try {
    return fromBackendDiary(await request<BackendDiaryEntry>(`/api/diary/${encodeURIComponent(input.date)}`, {
      method: "PUT",
      body: JSON.stringify(toBackendDiary(input)),
    }));
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    const entry: HealthDiaryEntry = { ...input, id: makeId("diary", input.date) };
    setStored(`diary.${input.date}`, entry);
    return entry;
  }
}

export async function getMacroPlan(date = today()): Promise<MacroPlan> {
  try {
    return fromBackendMacro(await request<BackendMacroPlan>(`/api/macro-plan?date=${encodeURIComponent(date)}`), date);
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    return fallbackMacroPlan(date);
  }
}

export async function saveMacroPlan(plan: MacroPlan): Promise<MacroPlan> {
  try {
    const payload = { calorie_target: plan.targets.calories, protein_target: plan.targets.protein_g, carbs_target: plan.targets.carbs_g, fat_target: plan.targets.fat_g, meal_allocations: plan.distribution.map((item) => ({ meal_type: toBackendMeal(item.meal), calories: item.calories, protein: item.protein_g, carbs: item.carbs_g, fat: item.fat_g })) };
    return fromBackendMacro(await request<BackendMacroPlan>("/api/macro-plan", { method: "PUT", body: JSON.stringify(payload) }), plan.date);
  } catch (error) {
    if (!shouldFallback(error)) throw error;

    const caloriesFromMacros = Math.round(plan.targets.protein_g * 4 + plan.targets.carbs_g * 4 + plan.targets.fat_g * 9);
    const normalized = {
      ...plan,
      targets: {
        ...plan.targets,
        calories: caloriesFromMacros || plan.targets.calories,
      },
      distribution: buildDistribution({
        ...plan.targets,
        calories: caloriesFromMacros || plan.targets.calories,
      }),
    };

    setStored(`macro.${plan.date}`, normalized);
    return normalized;
  }
}

export function buildRuleBasedInsights(context: InsightContext): AIInsight[] {
  const insights: AIInsight[] = [];
  const food = context.food;
  const diary = context.diary;
  const macro = context.macro;

  if (food && macro) {
    const proteinGap = macro.targets.protein_g - food.totals.protein_g;
    if (proteinGap > 12) {
      insights.push({
        id: "protein-gap",
        title: "Protein ยังไม่ถึงเป้า / Protein gap",
        body: `วันนี้คุณได้โปรตีนประมาณ ${Math.round(food.totals.protein_g)} g จากเป้า ${Math.round(macro.targets.protein_g)} g`,
        action: "มื้อถัดไปเพิ่มโปรตีน 10–20 g เช่น Greek yogurt, ไข่ต้ม, chicken breast หรือ tofu.",
        severity: "attention",
        disclaimer: disclaimerText,
      });
    }

    const carbOver = food.totals.carbs_g - macro.targets.carbs_g;
    if (carbOver > 20) {
      insights.push({
        id: "carb-high",
        title: "Carbs สูงกว่าแผนเล็กน้อย",
        body: `คาร์บวันนี้ประมาณ ${Math.round(food.totals.carbs_g)} g สูงกว่าเป้า ${Math.round(macro.targets.carbs_g)} g`,
        action: "มื้อถัดไปลองลด sugary drinks หรือแป้ง portion ให้น้อยลง แล้วเพิ่มผักแทน.",
        severity: "info",
        disclaimer: disclaimerText,
      });
    }

    const calorieGap = macro.targets.calories - food.totals.calories;
    if (calorieGap > 450) {
      insights.push({
        id: "under-fueled",
        title: "กินน้อยกว่าแผน / Energy may be low",
        body: `ตอนนี้รับพลังงานประมาณ ${Math.round(food.totals.calories)} kcal จากเป้า ${Math.round(macro.targets.calories)} kcal`,
        action: "ถ้ายังไม่อิ่ม ลองเติม balanced snack เช่น yogurt + fruit หรือไข่ + ขนมปังโฮลวีต.",
        severity: "info",
        disclaimer: disclaimerText,
      });
    }
  }

  if (diary) {
    if (typeof diary.sleep_hours === "number" && diary.sleep_hours < 6) {
      insights.push({
        id: "sleep",
        title: "พักผ่อนน้อย / Short sleep",
        body: `เมื่อคืนคุณนอน ${diary.sleep_hours} ชั่วโมง ซึ่งอาจมีผลต่อความหิว พลังงาน และการเลือกอาหาร`,
        action: "คืนนี้ลองเข้านอนเร็วขึ้น 30 นาที และเตรียม snack โปรตีนไว้กันหิวหลุดแผน.",
        severity: "attention",
        disclaimer: disclaimerText,
      });
    }

    if (typeof diary.water_liters === "number" && diary.water_liters < 1.8) {
      insights.push({
        id: "hydration",
        title: "น้ำอาจยังไม่พอ / Hydration check",
        body: `วันนี้ดื่มน้ำประมาณ ${diary.water_liters} ลิตร ซึ่งอาจยังต่ำสำหรับบางวัน`,
        action: "ตั้งเป้าเพิ่มอีก 1–2 แก้วในช่วงบ่าย โดยเฉพาะถ้ามีออกกำลังกายหรืออากาศร้อน.",
        severity: "info",
        disclaimer: disclaimerText,
      });
    }

    if (diary.stress === "high" || diary.mood === "stressed") {
      insights.push({
        id: "stress-support",
        title: "Stress signal detected",
        body: "ระดับความเครียดวันนี้ค่อนข้างสูง อาจทำให้หิวเร็วหรือกินตามอารมณ์ได้ง่ายขึ้น",
        action: "ให้เริ่มจาก step เล็ก ๆ: water break, 5-minute walk, หรือ meal ที่คาดเดาได้และโปรตีนพอ.",
        severity: "attention",
        disclaimer: disclaimerText,
      });
    }
  }

  if (!insights.length) {
    insights.push({
      id: "on-track",
      title: "วันนี้ค่อนข้าง on track",
      body: "ข้อมูลที่บันทึกยังไม่เห็น red flag ชัดเจน และพฤติกรรมโดยรวมดูสมดุลพอใช้",
      action: "บันทึกต่อเนื่องอีก 3–7 วันเพื่อให้ AI เห็น pattern เรื่องอาหาร การนอน และพลังงานชัดขึ้น.",
      severity: "positive",
      disclaimer: disclaimerText,
    });
  }

  return insights;
}

export async function getAIInsights(context: InsightContext = {}): Promise<AIInsight[]> {
  try {
    const date = context.food?.date ?? context.diary?.date ?? today();
    const response = await request<{ insights: Array<{ type: string; title: string; message: string }>; disclaimer: string }>(`/api/insights?date=${encodeURIComponent(date)}`);
    return response.insights.map((item, index) => ({ id: `api-insight-${index}`, title: item.title, body: item.message, action: "Review today's log and make one small adjustment.", severity: item.type === "warning" ? "attention" : item.type === "positive" ? "positive" : "info", disclaimer: response.disclaimer }));
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    return buildRuleBasedInsights(context);
  }
}

export const mealLabels: Record<MealType, string> = {
  breakfast: "Breakfast / มื้อเช้า",
  lunch: "Lunch / มื้อกลางวัน",
  dinner: "Dinner / มื้อเย็น",
  snacks: "Snacks / ของว่าง",
};
