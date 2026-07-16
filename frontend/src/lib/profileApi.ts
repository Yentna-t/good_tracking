import type { HealthProfile } from "../types/profile";

// In development, route API calls through Vite so the browser only talks to
// the frontend origin. A direct URL can still be supplied for deployed builds.
const API_URL = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : "http://localhost:8000")
).replace(/\/$/, "");

export class ProfileApiError extends Error {
  constructor(public message: string, public status: number, public fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ProfileApiError";
  }
}

function getFieldErrors(detail: unknown): Record<string, string> {
  if (!Array.isArray(detail)) return {};
  return detail.reduce<Record<string, string>>((errors, item) => {
    if (!item || typeof item !== "object") return errors;
    const entry = item as { loc?: unknown; msg?: unknown };
    const field = Array.isArray(entry.loc) ? entry.loc.at(-1) : undefined;
    if (typeof field === "string" && typeof entry.msg === "string") errors[field] = entry.msg;
    return errors;
  }, {});
}

async function parseError(response: Response): Promise<ProfileApiError> {
  let body: { detail?: unknown } = {};
  try { body = await response.json(); } catch { /* The status is still useful to the UI. */ }
  const message = typeof body.detail === "string" ? body.detail : response.status === 422 ? "Please check the highlighted fields." : "Unable to complete the profile request.";
  return new ProfileApiError(message, response.status, getFieldErrors(body.detail));
}

export async function getProfile(): Promise<HealthProfile | null> {
  const response = await fetch(`${API_URL}/api/profile`);
  if (response.status === 404) return null;
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<HealthProfile>;
}

export async function saveProfile(profile: HealthProfile): Promise<HealthProfile> {
  const response = await fetch(`${API_URL}/api/profile`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<HealthProfile>;
}
