import { Calculator, Check, Download, LoaderCircle, ShoppingBasket, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMacroPlan, mealLabels, saveMacroPlan } from "../lib/featureApi";
import type { MacroPlan, MealDistribution } from "../types/feature";

const macroColors = {
  protein_g: "#2f9e44",
  carbs_g: "#e39b32",
  fat_g: "#6574cd",
} as const;

export function MacroPlannerPage() {
  const [plan, setPlan] = useState<MacroPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlan(await getMacroPlan());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const macroCalories = useMemo(() => {
    if (!plan) return 0;
    return plan.targets.protein_g * 4 + plan.targets.carbs_g * 4 + plan.targets.fat_g * 9;
  }, [plan]);

  function updateTargets(
    next: Partial<MacroPlan["targets"]>,
    options?: { recomputeFromCalories?: boolean; recomputeCaloriesFromMacros?: boolean },
  ) {
    setPlan((current) => {
      if (!current) return current;

      let targets = { ...current.targets, ...next };

      if (options?.recomputeFromCalories) {
        targets = {
          ...targets,
          protein_g: Math.round((targets.calories * targets.protein_percent) / 100 / 4),
          carbs_g: Math.round((targets.calories * targets.carbs_percent) / 100 / 4),
          fat_g: Math.round((targets.calories * targets.fat_percent) / 100 / 9),
        };
      }

      if (options?.recomputeCaloriesFromMacros) {
        targets = {
          ...targets,
          calories: Math.round(targets.protein_g * 4 + targets.carbs_g * 4 + targets.fat_g * 9),
        };
      }

      const distribution = current.distribution.map((meal, index) => {
        const ratios = [0.25, 0.35, 0.28, 0.12];
        return {
          ...meal,
          calories: Math.round(targets.calories * ratios[index]),
          protein_g: Math.round(targets.protein_g * ratios[index]),
          carbs_g: Math.round(targets.carbs_g * ratios[index]),
          fat_g: Math.round(targets.fat_g * ratios[index]),
        };
      });

      return { ...current, targets, distribution };
    });
  }

  function updateDistribution(index: number, key: keyof Omit<MealDistribution, "meal">, value: number) {
    setPlan((current) =>
      current
        ? {
            ...current,
            distribution: current.distribution.map((meal, itemIndex) =>
              itemIndex === index ? { ...meal, [key]: value } : meal,
            ),
          }
        : current,
    );
  }

  async function savePlan() {
    if (!plan) return;
    setSaving(true);
    setMessage("");

    try {
      const saved = await saveMacroPlan(plan);
      setPlan(saved);
      setMessage("บันทึก Macro Plan แล้ว");
    } finally {
      setSaving(false);
    }
  }

  function exportList() {
    if (!plan) return;
    const text = `AICT Shopping List (${plan.date})\n${plan.shopping_list.map((item) => `- ${item}`).join("\n")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aict-shopping-list.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !plan) {
    return (
      <div className="state-card">
        <LoaderCircle className="spin" size={28} />
        <h1>Loading Macro Planner</h1>
        <p>กำลังคำนวณเป้าหมายสารอาหาร...</p>
      </div>
    );
  }

  const percentTotal = plan.targets.protein_percent + plan.targets.carbs_percent + plan.targets.fat_percent;

  return (
    <div className="page-width">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MACRO PLANNER MVP</span>
          <h1>Plan your nutrition</h1>
          <p>ตั้ง calorie target, macro split และแผนกระจายแต่ละมื้อแบบใช้งานได้จริง</p>
        </div>
        <div className="heading-badge">
          <Sparkles size={15} /> {plan.targets.calories} kcal target
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="form-card">
          <div className="card-heading">
            <div className="card-number">
              <Calculator size={15} />
            </div>
            <div>
              <h2>Daily targets</h2>
              <p>4/4/9 rule: Protein 4 kcal/g • Carbs 4 kcal/g • Fat 9 kcal/g</p>
            </div>
          </div>

          <div className="form-grid four-columns">
            <TargetField
              label="Calories"
              value={plan.targets.calories}
              unit="kcal"
              onChange={(value) => updateTargets({ calories: value }, { recomputeFromCalories: true })}
            />
            <TargetField
              label="Protein"
              value={plan.targets.protein_g}
              unit="g"
              color={macroColors.protein_g}
              onChange={(value) => updateTargets({ protein_g: value }, { recomputeCaloriesFromMacros: true })}
            />
            <TargetField
              label="Carbs"
              value={plan.targets.carbs_g}
              unit="g"
              color={macroColors.carbs_g}
              onChange={(value) => updateTargets({ carbs_g: value }, { recomputeCaloriesFromMacros: true })}
            />
            <TargetField
              label="Fat"
              value={plan.targets.fat_g}
              unit="g"
              color={macroColors.fat_g}
              onChange={(value) => updateTargets({ fat_g: value }, { recomputeCaloriesFromMacros: true })}
            />
          </div>

          <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
            <div style={{ color: percentTotal === 100 ? "#176b46" : "#b36b00", fontSize: 11 }}>
              <Check size={15} style={{ verticalAlign: "text-bottom", marginRight: 6 }} />
              Macro split: {plan.targets.protein_percent}% / {plan.targets.carbs_percent}% / {plan.targets.fat_percent}% = {percentTotal}%
            </div>
            <div style={{ color: "#687284", fontSize: 11 }}>
              Calories from macros = {macroCalories} kcal
            </div>
          </div>

          <button className="button primary" style={{ marginTop: 18 }} onClick={() => void savePlan()} disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
            {saving ? "Saving..." : "Save plan"}
          </button>

          {message && (
            <div className="alert" style={{ color: "#176b46", background: "#e8f5ee" }} role="status">
              {message}
            </div>
          )}
        </section>

        <section className="form-card">
          <div className="card-heading">
            <div className="card-number">
              <Calculator size={15} />
            </div>
            <div>
              <h2>Meal distribution</h2>
              <p>แบ่งเป้าหมายเป็น 4 มื้อ: breakfast, lunch, dinner, snacks</p>
            </div>
          </div>

          {plan.distribution.map((meal, index) => (
            <DistributionRow key={meal.meal} meal={meal} index={index} onChange={updateDistribution} />
          ))}
        </section>
      </div>

      <section className="form-card">
        <div className="card-heading">
          <div className="card-number">
            <Sparkles size={15} />
          </div>
          <div>
            <h2>Suggested menu ideas</h2>
            <p>เมนูตัวอย่างเพื่อช่วยให้ถึงเป้า ไม่ใช่คำแนะนำทางการแพทย์</p>
          </div>
        </div>

        <div className="dashboard-grid">
          {plan.suggestions.map((suggestion) => (
            <article key={suggestion.id} style={{ padding: 15, border: "1px solid #e5e9ef", borderRadius: 8 }}>
              <span className="eyebrow">{mealLabels[suggestion.meal]}</span>
              <h3 style={{ margin: "8px 0 5px", fontSize: 14 }}>{suggestion.name}</h3>
              <p style={{ margin: 0, color: "#687284", fontSize: 11 }}>{suggestion.description}</p>
              <strong style={{ display: "block", marginTop: 12, color: "#176b46", fontSize: 12 }}>
                {suggestion.calories} kcal • {suggestion.protein_g} g protein
              </strong>
            </article>
          ))}
        </div>
      </section>

      <section className="form-card">
        <div className="card-heading">
          <div className="card-number">
            <ShoppingBasket size={15} />
          </div>
          <div>
            <h2>Shopping list</h2>
            <p>กด export ได้ทันทีจากเมนูตัวอย่าง</p>
          </div>
          <button
            className="button"
            style={{ marginLeft: "auto", borderColor: "#dfe7e2", background: "#fff", color: "#176b46" }}
            onClick={exportList}
          >
            <Download size={15} /> Export
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {plan.shopping_list.map((item) => (
            <span key={item} className="tag">
              {item}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function TargetField({
  label,
  value,
  unit,
  color,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  color?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className="field-label">
        {label} ({unit})
      </span>
      <input
        className="text-input"
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        style={{ borderTop: `3px solid ${color ?? "#2f9e44"}` }}
      />
    </label>
  );
}

function DistributionRow({
  meal,
  index,
  onChange,
}: {
  meal: MealDistribution;
  index: number;
  onChange: (index: number, key: keyof Omit<MealDistribution, "meal">, value: number) => void;
}) {
  return (
    <div style={{ padding: "11px 0", borderTop: "1px solid #eef1ee" }}>
      <strong style={{ display: "block", fontSize: 12, marginBottom: 8 }}>{mealLabels[meal.meal]}</strong>
      <div className="form-grid four-columns">
        <SmallNumber label="kcal" value={meal.calories} onChange={(value) => onChange(index, "calories", value)} />
        <SmallNumber label="Protein g" value={meal.protein_g} onChange={(value) => onChange(index, "protein_g", value)} />
        <SmallNumber label="Carbs g" value={meal.carbs_g} onChange={(value) => onChange(index, "carbs_g", value)} />
        <SmallNumber label="Fat g" value={meal.fat_g} onChange={(value) => onChange(index, "fat_g", value)} />
      </div>
    </div>
  );
}

function SmallNumber({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span style={{ display: "block", color: "#687284", fontSize: 10, marginBottom: 4 }}>{label}</span>
      <input
        className="text-input"
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
    </label>
  );
}
