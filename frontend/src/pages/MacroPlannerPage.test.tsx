import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MacroPlannerPage } from "./MacroPlannerPage";

vi.mock("../lib/featureApi", async () => {
  const actual = await vi.importActual<typeof import("../lib/featureApi")>("../lib/featureApi");
  return {
    ...actual,
    getMacroPlan: vi.fn().mockResolvedValue({
      date: "2026-07-16",
      targets: { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 67, protein_percent: 30, carbs_percent: 40, fat_percent: 30 },
      distribution: [
        { meal: "breakfast", calories: 500, protein_g: 38, carbs_g: 50, fat_g: 17 },
        { meal: "lunch", calories: 650, protein_g: 48, carbs_g: 65, fat_g: 22 },
        { meal: "dinner", calories: 600, protein_g: 45, carbs_g: 60, fat_g: 20 },
        { meal: "snacks", calories: 250, protein_g: 19, carbs_g: 25, fat_g: 8 },
      ],
      suggestions: [],
      shopping_list: ["Chicken breast"],
    }),
    saveMacroPlan: vi.fn(),
  };
});

describe("MacroPlannerPage", () => {
  it("renders 4/4/9 targets and meal distribution", async () => {
    render(<MacroPlannerPage />);

    expect(await screen.findByText("Plan your nutrition")).toBeInTheDocument();
    expect(screen.getByText(/Protein 4 kcal\/g/)).toBeInTheDocument();
    expect(screen.getByText("Breakfast / มื้อเช้า")).toBeInTheDocument();
    expect(screen.getByText("Shopping list")).toBeInTheDocument();
    expect(screen.getAllByText("🎯")[0]).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("🛒")).toHaveAttribute("aria-hidden", "true");
  });
});
