import {
  ArrowRight,
  BedDouble,
  Droplets,
  Footprints,
  Scale,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { EmojiCue } from "../components/EmojiCue";
import { getDashboard, type DashboardData } from "../lib/featureApi";
import type { HealthProfile } from "../types/profile";

type Macro = { label: string; consumed: number; target: number; unit: string; color: string };
type DashboardView = {
  calories: { consumed: number; burned: number; target: number };
  macros: { protein: Macro; carbs: Macro; fat: Macro };
  water: { consumed: number; target: number };
  sleep: { consumed: number; target: number };
  weight: number;
  steps: number;
  exercise: string;
};

const seedDashboard: DashboardView = {
  calories: { consumed: 1500, burned: 300, target: 2000 },
  macros: {
    protein: { label: "Protein", consumed: 95, target: 150, unit: "g", color: "#1f8a5b" },
    carbs: { label: "Carbs", consumed: 210, target: 200, unit: "g", color: "#647269" },
    fat: { label: "Fat", consumed: 61, target: 67, unit: "g", color: "#9aa49e" },
  },
  water: { consumed: 2.1, target: 2.5 },
  sleep: { consumed: 6.2, target: 8 },
  weight: 72.4,
  steps: 6842,
  exercise: "30 min",
};

function MacroRow({ macro }: { macro: Macro }) {
  const percentage = Math.round((macro.consumed / Math.max(macro.target, 1)) * 100);
  return (
    <div className={`ledger-macro-row ${percentage > 100 ? "is-over" : ""}`}>
      <span className="ledger-macro-name">
        <i style={{ background: macro.color }} aria-hidden="true" />
        {macro.label}
      </span>
      <div className="ledger-progress" aria-label={`${macro.label}: ${macro.consumed} of ${macro.target}`}>
        <span style={{ width: `${Math.min(percentage, 100)}%`, background: macro.color }} />
      </div>
      <strong>{Math.round(macro.consumed)}<small> / {Math.round(macro.target)}{macro.unit}</small></strong>
      <span className="ledger-macro-percent">{percentage}%</span>
    </div>
  );
}

function toView(data: DashboardData): DashboardView {
  return {
    calories: { consumed: data.calories_consumed, burned: data.calories_burned, target: data.calories_target },
    macros: {
      protein: { label: "Protein", consumed: data.protein.consumed, target: data.protein.target, unit: "g", color: "#1f8a5b" },
      carbs: { label: "Carbs", consumed: data.carbs.consumed, target: data.carbs.target, unit: "g", color: "#647269" },
      fat: { label: "Fat", consumed: data.fat.consumed, target: data.fat.target, unit: "g", color: "#9aa49e" },
    },
    water: { consumed: data.water_litres ?? 0, target: 2.5 },
    sleep: { consumed: data.sleep_hours ?? 0, target: 8 },
    weight: data.weight_kg ?? 0,
    steps: data.steps ?? 0,
    exercise: `${data.exercise_minutes} min`,
  };
}

export function DashboardPage() {
  const location = useLocation();
  const savedProfile = (location.state as { profile?: HealthProfile } | null)?.profile;
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getDashboard()
      .then((value) => { if (mounted) setDashboard(value); })
      .catch(() => undefined)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const data = dashboard ? toView(dashboard) : seedDashboard;
  const remaining = data.calories.target - data.calories.consumed + data.calories.burned;
  const consumedPercentage = Math.min((data.calories.consumed / Math.max(data.calories.target, 1)) * 100, 100);
  const proteinGap = Math.max(Math.round(data.macros.protein.target - data.macros.protein.consumed), 0);
  const carbsOver = Math.max(Math.round(data.macros.carbs.consumed - data.macros.carbs.target), 0);
  const coachTitle = proteinGap > 0 ? "Build dinner around protein." : "Keep the evening meal balanced.";
  const coachCopy = proteinGap > 0
    ? `Protein is ${proteinGap}g below target${carbsOver ? ` while carbs are already ${carbsOver}g over` : ""}. A lean protein and vegetables would close the most important gap.`
    : "Your protein target is covered. Use the remaining energy budget for a balanced meal and keep the portion comfortable.";

  const mealFor = (type: string) => dashboard?.meal_summary.find(
    (meal) => meal.meal_type === type || (type === "snack" && meal.meal_type === "snacks"),
  );
  const meal = (name: string, type: string) => {
    const item = mealFor(type);
    return (
      <Meal
        name={name}
        detail={item ? `${item.count} item(s)` : "Nothing logged"}
        kcal={item ? `${Math.round(item.calories)} kcal` : "--"}
        done={Boolean(item)}
      />
    );
  };
  const dateLabel = dashboard?.date
    ? new Date(`${dashboard.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()
    : "WEDNESDAY, 15 JULY 2026";

  return (
    <div className="page-width wellness-page dashboard-page ledger-dashboard">
      <header className="ledger-hero">
        <div>
          <span className="ledger-date">{dateLabel}</span>
          <h1 className="emoji-label"><span>Good morning, John</span><EmojiCue symbol="👋" /></h1>
          <p>You have <strong>{remaining.toLocaleString()} kcal</strong> available today. Take it one healthy choice at a time.</p>
        </div>
        <div className="ledger-hero-meta">
          <span className="ledger-data-status"><i aria-hidden="true" />{loading ? "Syncing" : dashboard ? "Live data" : "Preview data"}</span>
          <Link className="ledger-settings-link" to="/profile"><Settings size={14} /> Profile settings</Link>
        </div>
      </header>

      <nav className="ledger-actions" aria-label="Quick actions">
        <Link className="ledger-action" to="/food-log"><span className="ledger-action-index"><EmojiCue symbol="🍽️" /></span><span><strong>Log a meal</strong><small>Food log</small></span><ArrowRight size={15} /></Link>
        <Link className="ledger-action" to="/diary"><span className="ledger-action-index"><EmojiCue symbol="📝" /></span><span><strong>Daily check-in</strong><small>Sleep, mood, water</small></span><ArrowRight size={15} /></Link>
        <Link className="ledger-action" to="/progress"><span className="ledger-action-index"><EmojiCue symbol="📈" /></span><span><strong>Review progress</strong><small>Trends and consistency</small></span><ArrowRight size={15} /></Link>
      </nav>

      <div className="ledger-primary-grid">
        <section className="energy-panel" aria-labelledby="energy-heading">
          <div className="ledger-section-heading">
            <div><span>TODAY&apos;S ENERGY</span><h2 id="energy-heading" className="emoji-label"><EmojiCue symbol="⚡" /><span>Energy balance</span></h2></div>
            <small>{data.exercise} activity logged</small>
          </div>

          <div className="energy-figures">
            <div className="energy-consumed"><span>Consumed</span><strong>{data.calories.consumed.toLocaleString()}</strong><small>kcal of {data.calories.target.toLocaleString()}</small></div>
            <dl className="energy-secondary">
              <div><dt>Activity credit</dt><dd>+{data.calories.burned.toLocaleString()}<small> kcal</small></dd></div>
              <div><dt>Remaining</dt><dd>{remaining.toLocaleString()}<small> kcal</small></dd></div>
            </dl>
          </div>

          <div className="energy-scale">
            <div className="energy-scale-labels"><span>0</span><span>{data.calories.target.toLocaleString()} kcal target</span></div>
            <div className="energy-track" role="img" aria-label={`${Math.round(consumedPercentage)} percent of calorie target consumed`}><span style={{ width: `${consumedPercentage}%` }} /></div>
          </div>

          <div className="energy-equation" aria-label="Energy balance calculation">
            <span><b>{data.calories.target.toLocaleString()}</b> target</span>
            <i>+</i>
            <span><b>{data.calories.burned.toLocaleString()}</b> activity</span>
            <i>-</i>
            <span><b>{data.calories.consumed.toLocaleString()}</b> consumed</span>
            <i>=</i>
            <span className="energy-result"><b>{remaining.toLocaleString()}</b> available</span>
          </div>
        </section>

        <aside className="coach-note" aria-labelledby="coach-heading">
          <span>COACH SUGGESTION</span>
          <h2 id="coach-heading" className="emoji-label"><EmojiCue symbol="✨" /><span>{coachTitle}</span></h2>
          <p>{coachCopy}</p>
          <div className="coach-evidence"><span>Protein gap</span><strong>{proteinGap}g</strong><span>Carb variance</span><strong>{carbsOver ? `+${carbsOver}g` : "On target"}</strong></div>
          <Link to="/ai-insights">Read the full analysis <ArrowRight size={15} /></Link>
        </aside>
      </div>

      <div className="ledger-secondary-grid">
        <section className="macro-ledger" aria-labelledby="macro-heading">
          <div className="ledger-section-heading">
            <div><span>NUTRITION</span><h2 id="macro-heading" className="emoji-label"><EmojiCue symbol="🥗" /><span>Macro progress</span></h2></div>
            <Link to="/macro-planner">Adjust targets <ArrowRight size={14} /></Link>
          </div>
          <div className="ledger-macro-list"><MacroRow macro={data.macros.protein} /><MacroRow macro={data.macros.carbs} /><MacroRow macro={data.macros.fat} /></div>
        </section>

        <section className="vitals-ledger" aria-labelledby="vitals-heading">
          <div className="ledger-section-heading">
            <div><span>HEALTH SIGNALS</span><h2 id="vitals-heading" className="emoji-label"><EmojiCue symbol="💧" /><span>Today&apos;s check-in</span></h2></div>
            <Link to="/diary">Add entry <ArrowRight size={14} /></Link>
          </div>
          <div className="vitals-list">
            <Vital icon={<Droplets size={15} />} label="Water" value={`${data.water.consumed} L`} target={`of ${data.water.target} L`} />
            <Vital icon={<BedDouble size={15} />} label="Sleep" value={`${data.sleep.consumed} h`} target={`of ${data.sleep.target} h`} />
            <Vital icon={<Scale size={15} />} label="Weight" value={`${data.weight} kg`} target="this morning" />
            <Vital icon={<Footprints size={15} />} label="Steps" value={data.steps.toLocaleString()} target="of 10,000" />
          </div>
        </section>
      </div>

      <section className="meals-ledger" aria-labelledby="meals-heading">
        <div className="ledger-section-heading">
          <div><span>FOOD LOG</span><h2 id="meals-heading" className="emoji-label"><EmojiCue symbol="🍽️" /><span>Today&apos;s meals</span></h2></div>
          <Link to="/food-log">Open food log <ArrowRight size={14} /></Link>
        </div>
        <div className="ledger-meal-list">{meal("Breakfast", "breakfast")}{meal("Lunch", "lunch")}{meal("Dinner", "dinner")}{meal("Snack", "snack")}</div>
      </section>

      <footer className="ledger-status-line">
        <span>{dashboard || savedProfile ? "Profile connected" : "Preview mode"}</span>
        <p>{dashboard || savedProfile ? "Targets are calculated from your saved health profile." : "Create a profile and add entries to replace the preview values."}</p>
        <Link to="/progress">View progress <ArrowRight size={14} /></Link>
      </footer>
    </div>
  );
}

function Vital({ icon, label, value, target }: { icon: React.ReactNode; label: string; value: string; target: string }) {
  return <div className="vital-row"><span className="vital-icon" aria-hidden="true">{icon}</span><span>{label}</span><strong>{value}</strong><small>{target}</small></div>;
}

function Meal({ name, detail, kcal, done = false }: { name: string; detail: string; kcal: string; done?: boolean }) {
  return <div className="ledger-meal-row"><span className={`ledger-meal-state ${done ? "is-logged" : ""}`}>{done ? "Logged" : "Open"}</span><strong>{name}</strong><small>{detail}</small><b>{kcal}</b></div>;
}
