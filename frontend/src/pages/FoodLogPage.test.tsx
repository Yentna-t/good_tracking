import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FoodLogPage } from "./FoodLogPage";

vi.mock("../lib/featureApi", async () => {
  const actual = await vi.importActual<typeof import("../lib/featureApi")>("../lib/featureApi");
  return {
    ...actual,
    getFoodLog: vi.fn().mockResolvedValue({
      date: "2026-07-16",
      entries: [
        {
          id: "1",
          date: "2026-07-16",
          meal: "breakfast",
          name: "Oatmeal",
          serving: "1 bowl",
          calories: 300,
          protein_g: 10,
          carbs_g: 50,
          fat_g: 8,
          source: "manual",
        },
      ],
      totals: { calories: 300, protein_g: 10, carbs_g: 50, fat_g: 8 },
    }),
    addFoodEntry: vi.fn(),
    updateFoodEntry: vi.fn(),
    deleteFoodEntry: vi.fn(),
  };
});

describe("FoodLogPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows meal sections and daily totals", async () => {
    render(<FoodLogPage />);

    expect(await screen.findByText("Oatmeal")).toBeInTheDocument();
    expect(screen.getByText("Breakfast / มื้อเช้า")).toBeInTheDocument();
    expect(screen.getByText("Dinner / มื้อเย็น")).toBeInTheDocument();
    expect(screen.getByText(/300 kcal today/)).toBeInTheDocument();
  });
});
