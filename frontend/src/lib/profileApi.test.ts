import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProfile, ProfileApiError, saveProfile } from "./profileApi";
import type { HealthProfile } from "../types/profile";

const profile: HealthProfile = { age: 22, gender: "male", height_cm: 170, weight_kg: 72.5, goal: "lose_weight", activity_level: "moderate", diet_type: "balanced", allergies: [], avoided_foods: [] };

describe("profile API", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("returns null when no profile exists", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 404 }));
    await expect(getProfile()).resolves.toBeNull();
  });
  it("maps FastAPI field errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ detail: [{ loc: ["body", "age"], msg: "Input should be greater than or equal to 13" }] }), { status: 422 }));
    await expect(getProfile()).rejects.toMatchObject({ status: 422, fieldErrors: { age: "Input should be greater than or equal to 13" } } satisfies Partial<ProfileApiError>);
  });
  it("saves the profile with PUT", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(profile), { status: 200 }));
    await expect(saveProfile(profile)).resolves.toEqual(profile);
    expect(fetchMock).toHaveBeenCalledWith("/api/profile", expect.objectContaining({ method: "PUT", body: JSON.stringify(profile) }));
  });
});
