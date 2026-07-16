import {
  ArrowRight, BedDouble, CheckCircle2, ChevronRight, Droplets, Dumbbell,
  Flame, Footprints, Info, Plus, Scale, Settings, Sparkles, Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
    protein: { label: "Protein", consumed: 95, target: 150, unit: "g", color: "#2f9e44" },
    carbs: { label: "Carbs", consumed: 210, target: 200, unit: "g", color: "#f0a43c" },
    fat: { label: "Fat", consumed: 61, target: 67, unit: "g", color: "#7c72d8" },
  },
  water: { consumed: 2.1, target: 2.5 }, sleep: { consumed: 6.2, target: 8 },
  weight: 72.4, steps: 6842, exercise: "30 min",
};

function ProgressBar({ value, target, color, label }: { value: number; target: number; color: string; label: string }) {
  const percentage = Math.min((value / Math.max(target, 1)) * 100, 100);
  return <div className="metric-progress" aria-label={`${label}: ${value} of ${target}`}>
    <div className="metric-progress-track"><span style={{ width: `${percentage}%`, background: color }} /></div>
    <span className="metric-progress-percent">{Math.round((value / Math.max(target, 1)) * 100)}%</span>
  </div>;
}

function MetricCard({ icon, label, value, detail, tone = "green", children }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: string; children?: React.ReactNode }) {
  return <article className={`metric-card metric-${tone}`}>
    <div className="metric-card-top"><span className="metric-icon">{icon}</span><span className="metric-label">{label}</span><button className="card-more" aria-label={`More details about ${label}`} type="button">...</button></div>
    <div className="metric-value">{value}</div><div className="metric-detail">{detail}</div>{children}
  </article>;
}

function MacroRow({ macro }: { macro: Macro }) {
  return <div className="macro-row"><div className="macro-row-header"><span><i className="macro-dot" style={{ background: macro.color }} />{macro.label}</span><strong>{Math.round(macro.consumed)}<small> / {Math.round(macro.target)}{macro.unit}</small></strong></div><ProgressBar value={macro.consumed} target={macro.target} color={macro.color} label={macro.label} /></div>;
}

function toView(data: DashboardData): DashboardView {
  return {
    calories: { consumed: data.calories_consumed, burned: data.calories_burned, target: data.calories_target },
    macros: {
      protein: { label: "Protein", consumed: data.protein.consumed, target: data.protein.target, unit: "g", color: "#2f9e44" },
      carbs: { label: "Carbs", consumed: data.carbs.consumed, target: data.carbs.target, unit: "g", color: "#f0a43c" },
      fat: { label: "Fat", consumed: data.fat.consumed, target: data.fat.target, unit: "g", color: "#7c72d8" },
    },
    water: { consumed: data.water_litres ?? 0, target: 2.5 },
    sleep: { consumed: data.sleep_hours ?? 0, target: 8 },
    weight: data.weight_kg ?? 0, steps: data.steps ?? 0, exercise: `${data.exercise_minutes} min`,
  };
}

export function DashboardPage() {
  const location = useLocation();
  const savedProfile = (location.state as { profile?: HealthProfile } | null)?.profile;
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    getDashboard().then((value) => { if (mounted) setDashboard(value); }).catch(() => undefined).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const data = dashboard ? toView(dashboard) : seedDashboard;
  const remaining = data.calories.target - data.calories.consumed + data.calories.burned;
  const mealFor = (type: string) => dashboard?.meal_summary.find((meal) => meal.meal_type === type || (type === "snack" && meal.meal_type === "snacks"));
  const meal = (name: string, type: string) => { const item = mealFor(type); return <Meal name={name} detail={item ? `${item.count} item(s)` : "Not logged yet"} kcal={item ? `${Math.round(item.calories)} kcal` : "-"} done={Boolean(item)} />; };
  const dateLabel = dashboard?.date ? new Date(`${dashboard.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase() : "WEDNESDAY, 15 JULY 2026";

  return <div className="page-width dashboard-page">
    <div className="dashboard-heading"><div><span className="eyebrow">{dateLabel}</span><h1>Good morning, John <span aria-hidden="true">👋</span></h1><p>Here&apos;s your health overview for today.</p></div><div className="dashboard-heading-actions"><span className="seed-badge"><Info size={13} /> {loading ? "Loading" : dashboard ? "Live data" : "Demo data"}</span><Link className="button button-outline" to="/profile"><Settings size={14} /> Edit profile</Link></div></div>

    <section className="kpi-grid" aria-label="Daily calorie summary">
      <MetricCard icon={<Flame size={17} />} label="Calories Consumed" value={`${data.calories.consumed.toLocaleString()} kcal`} detail={`of ${data.calories.target.toLocaleString()} kcal goal`}><div className="kpi-line"><span style={{ width: `${Math.min(data.calories.consumed / Math.max(data.calories.target, 1) * 100, 100)}%` }} /></div></MetricCard>
      <MetricCard icon={<Dumbbell size={17} />} label="Calories Burned" value={`${data.calories.burned} kcal`} detail="from exercise today" tone="orange"><div className="metric-trend positive">{data.exercise} <span>exercise logged</span></div></MetricCard>
      <MetricCard icon={<ChevronRight size={17} />} label="Calories Remaining" value={`${remaining.toLocaleString()} kcal`} detail="available for today" tone="purple"><div className="metric-trend">On track <span>for your goal</span></div></MetricCard>
    </section>

    <div className="dashboard-main-grid"><section className="dashboard-card macro-card"><div className="section-heading"><div><span className="eyebrow">MACRONUTRIENTS</span><h2>Today&apos;s Macro Progress</h2></div><Link className="text-button" to="/macro-planner">View details <ArrowRight size={14} /></Link></div><div className="macro-list"><MacroRow macro={data.macros.protein} /><MacroRow macro={data.macros.carbs} /><MacroRow macro={data.macros.fat} /></div><div className="macro-footer"><span><i className="macro-dot" style={{ background: "#2f9e44" }} /> Protein</span><span><i className="macro-dot" style={{ background: "#f0a43c" }} /> Carbs</span><span><i className="macro-dot" style={{ background: "#7c72d8" }} /> Fat</span></div></section>
      <section className="dashboard-card ai-card"><div className="ai-orb"><Sparkles size={19} /></div><div className="section-heading ai-heading"><div><span className="eyebrow">AI INSIGHT</span><h2>Your daily recommendation</h2></div><span className="ai-live">● Live</span></div><p className="ai-copy">Your dashboard combines calories, macros, diary habits, and activity to help you make one practical change today.</p><div className="ai-suggestion"><Utensils size={16} /><span><strong>Log a meal or health habit</strong><small>More entries give AI better pattern signals</small></span><ChevronRight size={16} /></div><Link to="/ai-insights" className="button button-soft">Ask AI Coach <ArrowRight size={14} /></Link></section></div>

    <div className="dashboard-secondary-grid"><section className="dashboard-card detail-card"><div className="section-heading"><div><span className="eyebrow">DAILY HABITS</span><h2>Health snapshot</h2></div><Link className="icon-button small" to="/diary" aria-label="Add health entry"><Plus size={16} /></Link></div><div className="habit-grid"><Habit icon={<Droplets size={17} />} label="Water" value={`${data.water.consumed} L`} target={`${data.water.target} L`} tone="blue" /><Habit icon={<BedDouble size={17} />} label="Sleep" value={`${data.sleep.consumed} h`} target={`${data.sleep.target} h`} tone="purple" /><Habit icon={<Scale size={17} />} label="Weight" value={`${data.weight} kg`} target="this morning" tone="green" /><Habit icon={<Footprints size={17} />} label="Steps" value={data.steps.toLocaleString()} target="of 10,000" tone="orange" /></div></section>
      <section className="dashboard-card meals-card"><div className="section-heading"><div><span className="eyebrow">FOOD LOG</span><h2>Meal summary</h2></div><Link className="text-button" to="/food-log">View all <ArrowRight size={14} /></Link></div><div className="meal-list">{meal("Breakfast", "breakfast")}{meal("Lunch", "lunch")}{meal("Dinner", "dinner")}{meal("Snack", "snack")}</div></section></div>

    <section className="dashboard-card today-note"><CheckCircle2 size={18} /><div><strong>{dashboard || savedProfile ? "Profile connected" : "Demo dashboard"}</strong><p>{dashboard || savedProfile ? "Your saved health profile is ready for personalized targets." : "Create a health profile and start logging to replace the preview with your data."}</p></div><Link className="text-button" to="/progress">See progress <ArrowRight size={14} /></Link></section>
  </div>;
}

function Habit({ icon, label, value, target, tone }: { icon: React.ReactNode; label: string; value: string; target: string; tone: string }) { return <div className={`habit-item habit-${tone}`}><span className="habit-icon">{icon}</span><span><small>{label}</small><strong>{value}</strong><em>{target}</em></span></div>; }
function Meal({ name, detail, kcal, done = false }: { name: string; detail: string; kcal: string; done?: boolean }) { return <div className="meal-row"><span className={`meal-status ${done ? "done" : ""}`}>{done && <CheckCircle2 size={13} />}</span><span className="meal-copy"><strong>{name}</strong><small>{detail}</small></span><b>{kcal}</b><ChevronRight size={15} className="meal-arrow" /></div>; }
