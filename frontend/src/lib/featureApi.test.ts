import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildRuleBasedInsights, getFoodLog, getHealthDiary, getMacroPlan } from "./featureApi";

describe("feature API fallback", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns deterministic fallback food, diary, and macro data when endpoints are unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const [foodA, foodB, diary, macro] = await Promise.all([
      getFoodLog("2026-07-16"),
      getFoodLog("2026-07-16"),
      getHealthDiary("2026-07-16"),
      getMacroPlan("2026-07-16"),
    ]);

    expect(foodA.entries).toEqual(foodB.entries);
    expect(foodA.totals.calories).toBeGreaterThan(0);
    expect(diary?.date).toBe("2026-07-16");
    expect(macro.targets.calories).toBeGreaterThanOrEqual(1800);
  });

  it("creates actionable insight cards for protein gap and short sleep", () => {
    const insights = buildRuleBasedInsights({
      food: {
        date: "2026-07-16",
        entries: [],
        totals: { calories: 1200, protein_g: 80, carbs_g: 240, fat_g: 45 },
      },
      macro: {
        date: "2026-07-16",
        targets: { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 67, protein_percent: 30, carbs_percent: 40, fat_percent: 30 },
        distribution: [],
        suggestions: [],
        shopping_list: [],
      },
      diary: { id: "d", date: "2026-07-16", sleep_hours: 5, water_liters: 1.2 },
    });

    expect(insights.map((item) => item.id)).toEqual(expect.arrayContaining(["protein-gap", "sleep", "carb-high", "hydration"]));
    expect(insights[0].action).toContain("โปรตีน");
    expect(insights[0].disclaimer).toContain("not a diagnosis");
  });
});
