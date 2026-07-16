import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HealthDiaryPage } from "./HealthDiaryPage";

vi.mock("../lib/featureApi", () => ({
  getHealthDiary: vi.fn().mockResolvedValue(null),
  getHealthDiaryHistory: vi.fn().mockResolvedValue([]),
  saveHealthDiary: vi.fn(),
}));

describe("HealthDiaryPage", () => {
  it("renders the daily health check-in fields", async () => {
    render(<HealthDiaryPage />);

    expect(await screen.findByText("วันนี้เป็นอย่างไรบ้าง? / How are you today?")).toBeInTheDocument();
    expect(screen.getByLabelText("Weight (kg)")).toBeInTheDocument();
    expect(screen.getByLabelText("Sleep (hours)")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes / บันทึกเพิ่มเติม")).toBeInTheDocument();
  });
});
