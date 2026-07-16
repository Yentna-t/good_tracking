# Emoji Visual Cues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add moderate, accessible emoji cues to all seven AICT routes so health and nutrition categories are easier to recognize while the interface remains calm and professional.

**Architecture:** Introduce one presentation-only `EmojiCue` component that always marks emoji as decorative. Route components compose it beside unchanged text labels, while shared CSS provides section and inline variants. No API payloads, form values, or navigation icons change.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, CSS

## Global Constraints

- Keep existing Lucide icons in global navigation and utility controls.
- Emoji never replaces a label, value, warning, action, or severity color.
- Every decorative emoji must render with `aria-hidden="true"`.
- Preserve existing accessible names and label-to-control associations.
- Apply the approved placement map across Dashboard, Food Log, Health Diary, Macro Planner, Progress, AI Insights, and Health Profile.
- Frontend presentation only; do not change APIs or data models.
- Do not animate emoji or add emoji to every button, paragraph, or data value.

---

### Task 1: Shared accessible emoji primitive

**Files:**
- Create: `frontend/src/components/EmojiCue.tsx`
- Create: `frontend/src/components/EmojiCue.test.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: `EmojiCue({ symbol, variant?, className? }): JSX.Element`
- `variant` is `"inline" | "section"` and defaults to `"inline"`.
- Later tasks import `EmojiCue` from `../components/EmojiCue`.

- [ ] **Step 1: Write the failing component test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmojiCue } from "./EmojiCue";

describe("EmojiCue", () => {
  it("renders a decorative emoji without changing the accessible label", () => {
    render(<h2><EmojiCue symbol="⚡" variant="section" /><span>Energy balance</span></h2>);

    expect(screen.getByText("⚡")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("heading", { name: "Energy balance" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm.cmd test -- --run src/components/EmojiCue.test.tsx`

Expected: FAIL because `./EmojiCue` does not exist.

- [ ] **Step 3: Implement the shared component**

```tsx
type EmojiCueProps = {
  symbol: string;
  variant?: "inline" | "section";
  className?: string;
};

export function EmojiCue({ symbol, variant = "inline", className = "" }: EmojiCueProps) {
  const classes = ["emoji-cue", `emoji-cue--${variant}`, className].filter(Boolean).join(" ");
  return <span className={classes} aria-hidden="true">{symbol}</span>;
}
```

- [ ] **Step 4: Add shared visual styles at the end of the calm wellness section**

```css
.emoji-label {
  display: inline-flex;
  align-items: center;
  gap: .48em;
}

.emoji-cue {
  display: inline-grid;
  place-items: center;
  flex: none;
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  font-style: normal;
  font-weight: 400;
  line-height: 1;
}

.emoji-cue--inline { font-size: .98em; }

.emoji-cue--section {
  width: 30px;
  height: 30px;
  border: 1px solid #dce9df;
  border-radius: 10px;
  background: #eff7f1;
  font-size: 16px;
}

.field-label .emoji-cue,
.nutrition-metric .emoji-cue { margin-right: 5px; }

@media (max-width: 640px) {
  .emoji-cue--section { width: 28px; height: 28px; font-size: 15px; }
}
```

- [ ] **Step 5: Run the component test to verify it passes**

Run: `npm.cmd test -- --run src/components/EmojiCue.test.tsx`

Expected: 1 test file and 1 test pass.

- [ ] **Step 6: Commit the shared primitive**

```powershell
git add -- frontend/src/components/EmojiCue.tsx frontend/src/components/EmojiCue.test.tsx frontend/src/index.css
git commit -m "feat: add accessible emoji cue primitive"
```

---

### Task 2: Dashboard and Food Log cues

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/pages/FoodLogPage.tsx`
- Modify: `frontend/src/pages/FoodLogPage.test.tsx`

**Interfaces:**
- Consumes: `EmojiCue` from Task 1.
- Produces: Dashboard cue map and Food Log cue maps local to their route components.

- [ ] **Step 1: Extend the Food Log test with the approved meal cues**

Add this assertion after the meal headings are loaded:

```tsx
expect(screen.getByText("🌅")).toHaveAttribute("aria-hidden", "true");
expect(screen.getByText("🌙")).toHaveAttribute("aria-hidden", "true");
```

- [ ] **Step 2: Run the Food Log test to verify it fails**

Run: `npm.cmd test -- --run src/pages/FoodLogPage.test.tsx`

Expected: FAIL because the breakfast and dinner emoji are not rendered.

- [ ] **Step 3: Add Dashboard cues**

Import `EmojiCue`, then apply these exact mappings while keeping each text label in a separate `<span>`:

```tsx
<h1 className="emoji-label"><span>Good morning, John</span><EmojiCue symbol="👋" /></h1>

<span className="ledger-action-index"><EmojiCue symbol="🍽️" /></span>
<span className="ledger-action-index"><EmojiCue symbol="📝" /></span>
<span className="ledger-action-index"><EmojiCue symbol="📈" /></span>

<h2 id="energy-heading" className="emoji-label"><EmojiCue symbol="⚡" /><span>Energy balance</span></h2>
<h2 id="coach-heading" className="emoji-label"><EmojiCue symbol="✨" /><span>{coachTitle}</span></h2>
<h2 id="macro-heading" className="emoji-label"><EmojiCue symbol="🥗" /><span>Macro progress</span></h2>
<h2 id="vitals-heading" className="emoji-label"><EmojiCue symbol="💧" /><span>Today's check-in</span></h2>
<h2 id="meals-heading" className="emoji-label"><EmojiCue symbol="🍽️" /><span>Today's meals</span></h2>
```

- [ ] **Step 4: Add Food Log cue maps and render them**

```tsx
const mealEmoji: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

const nutritionEmoji = {
  Calories: "🔥",
  Protein: "🥩",
  Carbs: "🌾",
  Fat: "🥑",
} as const;
```

Update `Metric` to accept `emoji: string` and render `<EmojiCue symbol={emoji} />` beside its label. Pass the four approved mappings from the nutrition totals. Add `🥗` to the page heading, each `mealEmoji[meal]` to its meal heading, and `✍️` to the add/edit form heading. Keep `mealLabels[meal]` inside its own `<span>` so existing exact-text tests continue to work.

```tsx
function Metric({ label, value, unit, emoji }: { label: keyof typeof nutritionEmoji; value: number; unit: string; emoji: string }) {
  return (
    <div className="nutrition-metric">
      <span className="emoji-label"><EmojiCue symbol={emoji} /><span>{label}</span></span>
      <strong>{value}</strong> <small>{unit}</small>
    </div>
  );
}

<h2 className="emoji-label">
  <EmojiCue symbol={mealEmoji[meal]} />
  <span>{mealLabels[meal]}</span>
</h2>
```

- [ ] **Step 5: Run focused tests**

Run: `npm.cmd test -- --run src/pages/FoodLogPage.test.tsx src/components/EmojiCue.test.tsx`

Expected: 2 test files pass.

- [ ] **Step 6: Commit Dashboard and Food Log cues**

```powershell
git add -- frontend/src/pages/DashboardPage.tsx frontend/src/pages/FoodLogPage.tsx frontend/src/pages/FoodLogPage.test.tsx
git commit -m "feat: add dashboard and food log emoji cues"
```

---

### Task 3: Health Diary and Macro Planner cues

**Files:**
- Modify: `frontend/src/pages/HealthDiaryPage.tsx`
- Modify: `frontend/src/pages/HealthDiaryPage.test.tsx`
- Modify: `frontend/src/pages/MacroPlannerPage.tsx`
- Modify: `frontend/src/pages/MacroPlannerPage.test.tsx`

**Interfaces:**
- Consumes: `EmojiCue` from Task 1.
- Produces: Local diary and macro cue maps.

- [ ] **Step 1: Add failing route-level assertions**

In `HealthDiaryPage.test.tsx`:

```tsx
expect(screen.getByText("😴")).toHaveAttribute("aria-hidden", "true");
expect(screen.getByText("💧")).toHaveAttribute("aria-hidden", "true");
```

In `MacroPlannerPage.test.tsx`:

```tsx
expect(screen.getByText("🎯")).toHaveAttribute("aria-hidden", "true");
expect(screen.getByText("🛒")).toHaveAttribute("aria-hidden", "true");
```

- [ ] **Step 2: Run both tests to verify they fail**

Run: `npm.cmd test -- --run src/pages/HealthDiaryPage.test.tsx src/pages/MacroPlannerPage.test.tsx`

Expected: FAIL because the approved cues are absent.

- [ ] **Step 3: Add Health Diary mappings**

```tsx
const metricEmoji = {
  "Weight (kg)": "⚖️",
  "Sleep (hours)": "😴",
  "Water (liters)": "💧",
} as const;

const levelEmoji = {
  "Mood / อารมณ์": "🙂",
  "Hunger / ความหิว": "🍽️",
  "Energy / พลังงาน": "⚡",
  "Stress / ความเครียด": "🧘",
} as const;
```

Add `🌿` to the page and check-in headings. Extend the local field helpers with an `emoji` prop and render `<EmojiCue symbol={emoji} />` inside `.field-label` before a separate text span. Preserve each input's existing `id`, `htmlFor`, and accessible label.

```tsx
<h1 className="emoji-label"><EmojiCue symbol="🌿" /><span>Daily check-in</span></h1>

<label className="field-label" htmlFor={id}>
  <EmojiCue symbol={emoji} />
  <span>{label}</span>
</label>

<legend className="field-label">
  <EmojiCue symbol={emoji} />
  <span>{label}</span>
</legend>
```

- [ ] **Step 4: Add Macro Planner mappings**

Use `🎯` for Daily targets, `🍽️` for Meal distribution, `💡` for Suggested menu ideas, and `🛒` for Shopping list. Extend the numeric field helpers with optional `emoji` and use `🔥`, `🥩`, `🌾`, and `🥑` for Calories, Protein, Carbs, and Fat. Keep all field text unchanged.

```tsx
<h2 className="emoji-label"><EmojiCue symbol="🎯" variant="section" /><span>Daily targets</span></h2>
<h2 className="emoji-label"><EmojiCue symbol="🍽️" variant="section" /><span>Meal distribution</span></h2>
<h2 className="emoji-label"><EmojiCue symbol="💡" variant="section" /><span>Suggested menu ideas</span></h2>
<h2 className="emoji-label"><EmojiCue symbol="🛒" variant="section" /><span>Shopping list</span></h2>

<span className="field-label">
  {emoji ? <EmojiCue symbol={emoji} /> : null}
  <span>{label}</span>
</span>
```

- [ ] **Step 5: Run focused tests**

Run: `npm.cmd test -- --run src/pages/HealthDiaryPage.test.tsx src/pages/MacroPlannerPage.test.tsx src/components/EmojiCue.test.tsx`

Expected: 3 test files pass.

- [ ] **Step 6: Commit Diary and Macro Planner cues**

```powershell
git add -- frontend/src/pages/HealthDiaryPage.tsx frontend/src/pages/HealthDiaryPage.test.tsx frontend/src/pages/MacroPlannerPage.tsx frontend/src/pages/MacroPlannerPage.test.tsx
git commit -m "feat: add diary and macro planner emoji cues"
```

---

### Task 4: Progress, AI Insights, and Health Profile cues

**Files:**
- Modify: `frontend/src/pages/ProgressPage.tsx`
- Modify: `frontend/src/pages/AIInsightPage.tsx`
- Modify: `frontend/src/pages/AIInsightPage.test.tsx`
- Modify: `frontend/src/pages/ProfilePage.tsx`
- Modify: `frontend/src/pages/ProfilePage.test.tsx`

**Interfaces:**
- Consumes: `EmojiCue` from Task 1.
- Produces: Local progress, severity, profile-section, and profile-goal mappings.

- [ ] **Step 1: Add failing Insights and Profile assertions**

In `AIInsightPage.test.tsx`:

```tsx
expect(screen.getByText("✨")).toHaveAttribute("aria-hidden", "true");
expect(screen.getByText("⚠️")).toHaveAttribute("aria-hidden", "true");
```

In `ProfilePage.test.tsx` after the form loads:

```tsx
expect(screen.getByText("👤")).toHaveAttribute("aria-hidden", "true");
expect(screen.getByText("🎯")).toHaveAttribute("aria-hidden", "true");
```

- [ ] **Step 2: Run both tests to verify they fail**

Run: `npm.cmd test -- --run src/pages/AIInsightPage.test.tsx src/pages/ProfilePage.test.tsx`

Expected: FAIL because the approved cues are absent.

- [ ] **Step 3: Add Progress cues without competing with legends**

Add `📈` to Progress overview, `⚖️` to Weight trend, `🔥` to Calorie adherence, and `🥗` to Macro adherence. Do not add emoji to chart legends or numeric values.

```tsx
<h1 className="emoji-label"><EmojiCue symbol="📈" /><span>Progress overview</span></h1>
<h2 className="emoji-label"><EmojiCue symbol="⚖️" /><span>Weight trend</span></h2>
<h2 className="emoji-label"><EmojiCue symbol="🔥" /><span>Calorie adherence</span></h2>
<h2 className="emoji-label"><EmojiCue symbol="🥗" /><span>Macro adherence</span></h2>
```

- [ ] **Step 4: Add severity-aware AI Insight cues**

```tsx
const severityEmoji = {
  positive: "✅",
  attention: "⚠️",
  info: "ℹ️",
} as const;
```

Add `✨` to the page heading. Render `<EmojiCue symbol={severityEmoji[insight.severity]} variant="section" />` beside each insight title while retaining the existing Lucide status icon, border color, title, disclaimer, and action text.

- [ ] **Step 5: Add Health Profile section and goal cues**

```tsx
const goalEmoji = {
  lose_weight: "🌱",
  maintain_weight: "⚖️",
  gain_weight: "⬆️",
  gain_muscle: "💪",
} as const;
```

Add `👤` to Personal information, `🎯` to Health goal, `🏃` to Daily preferences, and `🥗` to Food preferences. Render the goal emoji before each goal label while retaining the radio control, label text, description, and validation behavior.

```tsx
<h2 className="emoji-label"><EmojiCue symbol="👤" variant="section" /><span>Personal information</span></h2>
<h2 className="emoji-label"><EmojiCue symbol="🎯" variant="section" /><span>Health goal</span></h2>
<h2 className="emoji-label"><EmojiCue symbol="🏃" variant="section" /><span>Daily preferences</span></h2>
<h2 className="emoji-label"><EmojiCue symbol="🥗" variant="section" /><span>Food preferences</span></h2>

<span className="emoji-label">
  <EmojiCue symbol={goalEmoji[value]} />
  <strong>{label}</strong>
</span>
```

- [ ] **Step 6: Run focused tests**

Run: `npm.cmd test -- --run src/pages/AIInsightPage.test.tsx src/pages/ProfilePage.test.tsx src/components/EmojiCue.test.tsx`

Expected: 3 test files pass.

- [ ] **Step 7: Commit the remaining route cues**

```powershell
git add -- frontend/src/pages/ProgressPage.tsx frontend/src/pages/AIInsightPage.tsx frontend/src/pages/AIInsightPage.test.tsx frontend/src/pages/ProfilePage.tsx frontend/src/pages/ProfilePage.test.tsx
git commit -m "feat: add progress insights and profile emoji cues"
```

---

### Task 5: Full regression and visual verification

**Files:**
- Verify only; modify route or CSS files only if verification exposes a concrete defect.

**Interfaces:**
- Consumes: All route changes from Tasks 1–4.
- Produces: Verified desktop and mobile emoji cue system.

- [ ] **Step 1: Run the complete test suite**

Run: `npm.cmd test -- --run`

Expected: all existing tests plus `EmojiCue.test.tsx` pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: TypeScript and Vite build complete with exit code 0.

- [ ] **Step 3: Inspect all seven routes in the browser at desktop width**

Open `/dashboard`, `/food-log`, `/diary`, `/macro-planner`, `/progress`, `/ai-insights`, and `/profile`. Confirm each route contains its approved cues, headings remain readable, repeated emoji are not visually dominant, and the browser console has no errors.

- [ ] **Step 4: Inspect representative routes at 390 × 844**

Check Dashboard, Food Log, Health Diary, and Profile. Confirm `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`, emoji align with text, and no cue causes wrapping or clipped controls.

- [ ] **Step 5: Review the final diff**

Run: `git diff --check`

Expected: no whitespace errors. Confirm no API, schema, navigation-icon, or unrelated refactor changes are present.
