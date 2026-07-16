import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AIInsightPage } from "./AIInsightPage";

vi.mock("../lib/featureApi", () => ({
  getAIInsights: vi.fn().mockResolvedValue([
    {
      id: "protein-gap",
      title: "Protein ยังไม่ถึงเป้า / Protein gap",
      body: "วันนี้คุณได้โปรตีนประมาณ 80 g จากเป้า 150 g",
      action: "มื้อถัดไปเพิ่มโปรตีน 10–20 g",
      severity: "attention",
      disclaimer: "Health estimate only — not a diagnosis and not a replacement for medical care.",
    },
  ]),
}));

describe("AIInsightPage", () => {
  it("shows actionable advice and the estimate disclaimer", async () => {
    render(<AIInsightPage context={{}} />);

    expect(await screen.findByText("Protein ยังไม่ถึงเป้า / Protein gap")).toBeInTheDocument();
    expect(screen.getByText(/มื้อถัดไปเพิ่มโปรตีน/)).toBeInTheDocument();
    expect(screen.getByText(/does not diagnose disease/i)).toBeInTheDocument();
    expect(screen.getByText("✨")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("⚠️")).toHaveAttribute("aria-hidden", "true");
  });
});
