# Emoji Visual Cues Design

## Goal

Add a moderate, friendly layer of emoji cues across AICT so users can recognize health and nutrition categories faster without making the product feel childish, noisy, or less professional.

## Approved Direction

Use a hybrid system:

- Keep the existing Lucide icons in global navigation and utility controls.
- Add small emoji cues to content headings, category labels, meal sections, and choice groups where recognition speed matters.
- Keep all existing text. Emoji never replaces a label, value, warning, or action.
- Use emoji sparingly and consistently across all seven routes.

## Placement Map

### Dashboard

- Greeting: `👋`
- Energy balance: `⚡`
- Coach suggestion: `✨`
- Macro progress: `🥗`
- Health check-in: `💧`
- Today's meals: `🍽️`
- Quick actions: `🍽️`, `📝`, and `📈`

### Food Log

- Page context: `🥗`
- Nutrition totals: `🔥` Calories, `🥩` Protein, `🌾` Carbs, `🥑` Fat
- Meal sections: `🌅` Breakfast, `☀️` Lunch, `🌙` Dinner, `🍎` Snacks
- Add and edit food forms: `✍️`

### Health Diary

- Page and check-in context: `🌿`
- Weight: `⚖️`
- Sleep: `😴`
- Water: `💧`
- Mood: `🙂`
- Hunger: `🍽️`
- Energy: `⚡`
- Stress: `🧘`
- Mood choices may use distinct emoji while retaining their bilingual text labels.

### Macro Planner

- Daily targets: `🎯`
- Meal distribution: `🍽️`
- Suggested menu ideas: `💡`
- Shopping list: `🛒`
- Macro fields reuse `🔥`, `🥩`, `🌾`, and `🥑`.

### Progress

- Page context: `📈`
- Weight trend: `⚖️`
- Calorie adherence: `🔥`
- Macro adherence: `🥗`
- Summary metrics use cues only when they improve scanning and do not compete with chart legends.

### AI Insights

- Page context: `✨`
- Insight severity: `✅` positive, `⚠️` attention, `ℹ️` informational
- Existing severity colors and accessible text remain the primary status indicators.

### Health Profile

- Personal information: `👤`
- Health goal: `🎯`
- Daily preferences: `🏃`
- Food preferences: `🥗`
- Goal options: `🌱` lose weight, `⚖️` maintain weight, `⬆️` gain weight, `💪` gain muscle

## Component Pattern

Render emoji in a dedicated element such as:

```tsx
<span className="emoji-cue" aria-hidden="true">⚡</span>
```

The visible text remains a separate node. This keeps tests and accessible names stable. Shared CSS controls sizing, alignment, background, and spacing. Smaller inline variants may be used for form labels and metric names.

## Visual Rules

- Default cue size: 16–18 px.
- Use a soft sage or warm-neutral container only for prominent section headings.
- Inline field and metric cues remain unboxed to avoid visual clutter.
- Do not animate emoji.
- Do not place emoji in every button, paragraph, navigation item, or data value.
- Maintain the existing calm wellness color system and spacing rhythm.

## Accessibility

- Decorative emoji use `aria-hidden="true"`.
- Text labels remain present and unchanged in meaning.
- Severity, validation, and status never rely on emoji alone.
- Form labels keep valid label-to-control associations.
- Emoji are not added to input values or API data.

## Implementation Boundaries

- Frontend presentation only; no API or data model changes.
- Update the shared emoji styles in `frontend/src/index.css`.
- Apply the placement map to the seven route components.
- Preserve the existing Lucide navigation icons.
- Avoid unrelated component refactors.

## Verification

- Run the existing Vitest suite and production build.
- Visually inspect representative desktop and mobile routes.
- Confirm no horizontal overflow or layout shifts.
- Confirm emoji do not alter accessible labels used by tests.
- Confirm no browser console errors.

