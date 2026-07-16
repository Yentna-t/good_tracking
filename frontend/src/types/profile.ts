export type Gender = "male" | "female" | "other";
export type HealthGoal = "lose_weight" | "maintain_weight" | "gain_weight" | "gain_muscle";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type DietType = "balanced" | "vegetarian" | "vegan" | "keto" | "halal" | "other";

export interface HealthProfile {
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  goal: HealthGoal;
  activity_level: ActivityLevel;
  diet_type: DietType;
  allergies: string[];
  avoided_foods: string[];
}
