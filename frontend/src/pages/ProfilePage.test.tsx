import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "./ProfilePage";

const profile = { age: 22, gender: "male", height_cm: 170, weight_kg: 72.5, goal: "lose_weight", activity_level: "moderate", diet_type: "balanced", allergies: ["peanut"], avoided_foods: [] };

describe("ProfilePage", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("shows an empty form when the profile is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 404 }));
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: /set up your health profile/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Age")).toHaveValue(null);
  });
  it("loads an existing profile into the form", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(profile), { status: 200 }));
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    expect(await screen.findByDisplayValue("22")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /update your health profile/i })).toBeInTheDocument();
    expect(screen.getByText("peanut")).toBeInTheDocument();
  });
  it("shows client validation errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 404 }));
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    await screen.findByRole("heading", { name: /set up your health profile/i });
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));
    expect(await screen.findByText("Enter your age")).toBeInTheDocument();
    expect(screen.getByText("Enter your height")).toBeInTheDocument();
  });
  it("submits a valid profile", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 404 })).mockResolvedValueOnce(new Response(JSON.stringify(profile), { status: 200 }));
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    await screen.findByRole("heading", { name: /set up your health profile/i });
    fireEvent.change(screen.getByLabelText("Age"), { target: { value: "22" } });
    fireEvent.change(screen.getByLabelText("Height (cm)"), { target: { value: "170" } });
    fireEvent.change(screen.getByLabelText("Weight (kg)"), { target: { value: "72.5" } });
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "PUT" });
  });
});
