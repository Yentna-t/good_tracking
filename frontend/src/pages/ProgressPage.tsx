import { ArrowDownRight, CheckCircle2, Info, TrendingDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmojiCue } from "../components/EmojiCue";
import { CalorieAdherenceChart, MacroAdherenceChart } from "../components/charts/AdherenceCharts";
import { WeightTrendChart } from "../components/charts/WeightTrendChart";
import { getProgress, type ProgressData, type ProgressPoint } from "../lib/featureApi";

type Range = "7D" | "30D" | "90D";
const seedPoints = [{ label: "Jul 09", value: 72.9 }, { label: "Jul 10", value: 72.8 }, { label: "Jul 11", value: 72.6 }, { label: "Jul 12", value: 72.6 }, { label: "Jul 13", value: 72.4 }, { label: "Jul 14", value: 72.5 }, { label: "Today", value: 72.4 }];
const formatDate = (date: Date) => date.toISOString().slice(0, 10);
const rangeDays = (range: Range) => range === "7D" ? 7 : range === "30D" ? 30 : 90;

function dateLabel(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function pointsWithWeight(points: ProgressPoint[]) { return points.filter((point) => point.weight_kg != null).map((point) => ({ label: dateLabel(point.date), value: point.weight_kg as number })); }

export function ProgressPage() {
  const [range, setRange] = useState<Range>("7D");
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const end = new Date(); const start = new Date(end); start.setDate(end.getDate() - rangeDays(range) + 1);
    let mounted = true;
    setLoading(true);
    getProgress(formatDate(start), formatDate(end)).then((value) => { if (mounted) setProgress(value); }).catch(() => { if (mounted) setProgress(null); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [range]);

  const points = progress?.points ?? [];
  const weightPoints = useMemo(() => pointsWithWeight(points), [points]);
  const chartWeightPoints = weightPoints.length > 1 ? weightPoints : seedPoints;
  const calorieValues = points.length ? points.map((point) => Math.round(point.calories_consumed / 2000 * 100)) : [96, 88, 102, 93, 97, 82, 95];
  const calorieLabels = points.length ? points.map((point) => dateLabel(point.date)) : undefined;
  const macroPoints = points.length ? points.map((point) => ({ label: dateLabel(point.date), protein: Math.round(point.protein / 150 * 100), carbs: Math.round(point.carbs / 200 * 100), fat: Math.round(point.fat / 67 * 100) })) : undefined;
  const firstWeight = chartWeightPoints[0]?.value ?? 0; const lastWeight = chartWeightPoints[chartWeightPoints.length - 1]?.value ?? 0;
  const change = lastWeight - firstWeight; const avgCalories = points.length ? points.reduce((sum, point) => sum + point.calories_consumed, 0) / points.length : 1942;
  const daysWithCalories = points.filter((point) => point.calories_consumed > 0).length;
  const rangeLabel = range === "7D" ? "Last 7 days" : range === "30D" ? "Last 30 days" : "Last 90 days";

  return <div className="page-width wellness-page progress-page">
    <div className="page-heading progress-heading"><div><span className="eyebrow">YOUR JOURNEY</span><h1 className="emoji-label"><EmojiCue symbol="📈" /><span>Progress overview</span></h1><p>Track your trends, consistency, and the habits moving you forward.</p></div><div className="range-selector" aria-label="Progress time range">{(["7D", "30D", "90D"] as Range[]).map((option) => <button key={option} className={range === option ? "active" : ""} type="button" aria-pressed={range === option} onClick={() => setRange(option)}>{option}</button>)}</div></div>

    <section className="progress-summary" aria-label={`${rangeLabel} progress summary`}><div className="progress-summary-item"><span>Weight change</span><strong>{change > 0 ? "+" : ""}{change.toFixed(1)} kg</strong><small><ArrowDownRight size={11} /> {firstWeight ? `${Math.abs(change / firstWeight * 100).toFixed(1)}% change` : "No entries yet"}</small></div><div className="progress-summary-item"><span>Average calories</span><strong>{Math.round(avgCalories).toLocaleString()} kcal</strong><small>{points.length ? `${Math.round(avgCalories / 2000 * 100)}% of estimate` : "Preview estimate"}</small></div><div className="progress-summary-item"><span>Goal days</span><strong>{daysWithCalories} / {points.length || 7}</strong><small>{points.length ? `${Math.round(daysWithCalories / points.length * 100)}% consistency` : "Start logging"}</small></div><div className="progress-summary-item"><span>Data status</span><strong>{loading ? "Loading" : progress ? "Live" : "Preview"}</strong><small>{progress ? "API connected" : "No profile data yet"}</small></div></section>

    <div className="charts-grid"><section className="dashboard-card chart-card chart-card-wide"><div className="section-heading"><div><span className="eyebrow">BODY COMPOSITION</span><h2 className="emoji-label"><EmojiCue symbol="⚖️" /><span>Weight trend</span></h2></div><div className="chart-legend"><span><i className="legend-dot" style={{ background: "#2f9e44" }} /> Weight</span><strong>{lastWeight.toFixed(1)} kg</strong></div></div><WeightTrendChart points={chartWeightPoints} /></section><section className="dashboard-card chart-card"><div className="section-heading"><div><span className="eyebrow">CALORIE TRACKING</span><h2 className="emoji-label"><EmojiCue symbol="🔥" /><span>Calorie adherence</span></h2></div><div className="chart-legend"><span><i className="legend-dot" style={{ background: "#f0a43c" }} /> Daily target</span></div></div><CalorieAdherenceChart values={calorieValues} labels={calorieLabels} /></section><section className="dashboard-card chart-card"><div className="section-heading"><div><span className="eyebrow">MACRO TRACKING</span><h2 className="emoji-label"><EmojiCue symbol="🥗" /><span>Macro adherence</span></h2></div><div className="chart-legend"><span><i className="legend-dot" style={{ background: "#2f9e44" }} /> P</span><span><i className="legend-dot" style={{ background: "#f0a43c" }} /> C</span><span><i className="legend-dot" style={{ background: "#7c72d8" }} /> F</span></div></div><MacroAdherenceChart points={macroPoints} /></section></div>

    <div className="progress-note"><TrendingDown size={17} /><span><strong>{change <= 0 ? "Nice progress." : "Keep tracking."}</strong> {change <= 0 ? "Your weight is trending down steadily. Stay close to your protein target to protect lean muscle." : "Keep logging consistently so the next trend is based on a clearer pattern."}</span><Info size={15} /></div><div className="today-note"><CheckCircle2 size={18} /><div><strong>{progress ? "Live progress data" : "Preview data"}</strong><p>{progress ? "Charts are calculated from your diary and food log entries." : "Create a profile and add diary or food entries to populate the progress charts."}</p></div></div>
  </div>;
}
