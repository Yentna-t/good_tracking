export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export type EntrySource = "manual" | "photo_scan";
export type Mood = "great" | "good" | "okay" | "low" | "stressed";
export type Level = "low" | "medium" | "high";
export type InsightSeverity = "positive" | "attention" | "info";

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface FoodEntry {
  id: string;
  date: string;
  meal: MealType;
  name: string;
  serving: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source: EntrySource;
  confidence?: number;
}

export interface FoodEntryInput {
  date?: string;
  meal: MealType;
  name: string;
  serving: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source?: EntrySource;
  confidence?: number;
}

export interface FoodLog {
  date: string;
  entries: FoodEntry[];
  totals: NutritionTotals;
}

export interface HealthDiaryEntry {
  id: string;
  date: string;
  weight_kg?: number;
  sleep_hours?: number;
  water_liters?: number;
  mood?: Mood;
  hunger?: Level;
  energy?: Level;
  stress?: Level;
  exercise?: string;
  symptoms?: string;
  bowel_movement?: string;
  menstrual_cycle?: string;
  medications_supplements?: string;
  notes?: string;
}

export type HealthDiaryInput = Omit<HealthDiaryEntry, "id">;

export interface MacroTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  protein_percent: number;
  carbs_percent: number;
  fat_percent: number;
}

export interface MealDistribution {
  meal: MealType;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealSuggestion {
  id: string;
  meal: MealType;
  name: string;
  description: string;
  calories: number;
  protein_g: number;
}

export interface MacroPlan {
  date: string;
  targets: MacroTargets;
  distribution: MealDistribution[];
  suggestions: MealSuggestion[];
  shopping_list: string[];
}

export interface AIInsight {
  id: string;
  title: string;
  body: string;
  action: string;
  severity: InsightSeverity;
  disclaimer: string;
}

export interface InsightContext {
  food?: FoodLog;
  diary?: HealthDiaryEntry;
  macro?: MacroPlan;
}
