import { Camera, Check, Edit3, Flame, LoaderCircle, Plus, Trash2, Utensils, X } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { addFoodEntry, deleteFoodEntry, getFoodLog, mealLabels, updateFoodEntry } from "../lib/featureApi";
import type { FoodEntry, FoodEntryInput, FoodLog, MealType, NutritionTotals } from "../types/feature";

const meals: MealType[] = ["breakfast", "lunch", "dinner", "snacks"];

const blankEntry = (meal: MealType): FoodEntryInput => ({
  meal,
  name: "",
  serving: "1 serving",
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  source: "manual",
});

const emptyTotals: NutritionTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

function sumTotals(entries: FoodEntry[]) {
  return entries.reduce<NutritionTotals>(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      protein_g: sum.protein_g + entry.protein_g,
      carbs_g: sum.carbs_g + entry.carbs_g,
      fat_g: sum.fat_g + entry.fat_g,
    }),
    emptyTotals,
  );
}

function toNumber(value: string) {
  return Number(value) || 0;
}

export function FoodLogPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [log, setLog] = useState<FoodLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FoodEntryInput | null>(null);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setLog(await getFoodLog(date));
    } catch {
      setError("โหลด Food Log ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = log?.totals ?? emptyTotals;
  const grouped = useMemo(
    () =>
      Object.fromEntries(
        meals.map((meal) => [meal, log?.entries.filter((entry) => entry.meal === meal) ?? []]),
      ) as Record<MealType, FoodEntry[]>,
    [log],
  );

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !form.name.trim() || form.calories <= 0) return;

    setSaving(true);
    try {
      const payload: FoodEntryInput = { ...form, date };
      const saved = editing ? await updateFoodEntry(editing.id, payload) : await addFoodEntry(payload);

      setLog((current) => {
        const baseEntries = current?.entries ?? [];
        const entries = editing
          ? baseEntries.map((entry) => (entry.id === saved.id ? saved : entry))
          : [...baseEntries, saved];

        return { date, entries, totals: sumTotals(entries) };
      });

      setForm(null);
      setEditing(null);
      setScanMessage(editing ? "อัปเดตรายการแล้ว / Food entry updated." : "เพิ่มรายการแล้ว / Food added.");
    } finally {
      setSaving(false);
    }
  }

  function simulatePhotoScan() {
    setScanMessage("AI scan preview: พบเมนูคล้าย กะเพราไก่ไข่ดาว 1 จาน ประมาณ 780 kcal — กรุณายืนยันหรือแก้ไขก่อนบันทึก");
    setEditing(null);
    setForm({
      meal: "lunch",
      name: "กะเพราไก่ไข่ดาว (AI estimate)",
      serving: "1 plate",
      calories: 780,
      protein_g: 40,
      carbs_g: 78,
      fat_g: 28,
      source: "photo_scan",
      confidence: 0.82,
    });
  }

  async function removeEntry(entry: FoodEntry) {
    await deleteFoodEntry(entry.id, entry.date);
    setLog((current) => {
      if (!current) return current;
      const entries = current.entries.filter((item) => item.id !== entry.id);
      return { ...current, entries, totals: sumTotals(entries) };
    });
  }

  if (loading) {
    return (
      <div className="state-card">
        <LoaderCircle className="spin" size={28} />
        <h1>Loading Food Log</h1>
        <p>กำลังโหลดบันทึกอาหารของคุณ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-card">
        <h1>Food Log unavailable</h1>
        <p>{error}</p>
        <button className="button primary" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page-width">
      <div className="page-heading">
        <div>
          <span className="eyebrow">FOOD LOG MVP</span>
          <h1>Food Log</h1>
          <p>บันทึก Breakfast, Lunch, Dinner, Snacks พร้อมโภชนาการรวมรายวัน</p>
        </div>
        <div className="heading-badge">
          <Flame size={15} /> {Math.round(totals.calories)} kcal today
        </div>
      </div>

      <section className="form-card">
        <div className="card-heading">
          <div className="card-number">
            <Flame size={16} />
          </div>
          <div>
            <h2>Daily nutrition totals</h2>
            <p>ภาพสแกนเป็นการประเมินเบื้องต้น / estimate only</p>
          </div>
        </div>
        <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Metric label="Calories" value={Math.round(totals.calories)} unit="kcal" />
          <Metric label="Protein" value={Math.round(totals.protein_g)} unit="g" />
          <Metric label="Carbs" value={Math.round(totals.carbs_g)} unit="g" />
          <Metric label="Fat" value={Math.round(totals.fat_g)} unit="g" />
        </div>
      </section>

      <div className="form-actions" style={{ justifyContent: "flex-start", marginBottom: 18 }}>
        <div>
          <label className="field-label" htmlFor="food-date">
            Date
          </label>
          <input
            id="food-date"
            className="text-input"
            style={{ width: 170 }}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <button className="button primary" onClick={() => { setEditing(null); setForm(blankEntry("breakfast")); }}>
          <Plus size={16} /> Add food
        </button>
        <button
          className="button"
          style={{ borderColor: "#dfe7e2", background: "#fff", color: "#176b46" }}
          onClick={simulatePhotoScan}
        >
          <Camera size={16} /> Scan photo
        </button>
      </div>

      {scanMessage && (
        <div className="alert" style={{ color: "#176b46", background: "#e8f5ee" }} role="status">
          {scanMessage}
        </div>
      )}

      {meals.map((meal) => (
        <section className="form-card" key={meal}>
          <div className="card-heading">
            <div className="card-number">
              <Utensils size={15} />
            </div>
            <div>
              <h2>{mealLabels[meal]}</h2>
              <p>{grouped[meal].length ? `${grouped[meal].length} item(s) logged` : "ยังไม่มีรายการในมื้อนี้"}</p>
            </div>
            <button
              className="icon-button"
              style={{ marginLeft: "auto" }}
              aria-label={`Add ${meal}`}
              onClick={() => {
                setEditing(null);
                setForm(blankEntry(meal));
              }}
            >
              <Plus size={18} />
            </button>
          </div>

          {grouped[meal].map((entry) => (
            <FoodRow
              key={entry.id}
              entry={entry}
              onEdit={() => {
                setEditing(entry);
                setForm({
                  meal: entry.meal,
                  name: entry.name,
                  serving: entry.serving,
                  calories: entry.calories,
                  protein_g: entry.protein_g,
                  carbs_g: entry.carbs_g,
                  fat_g: entry.fat_g,
                  source: entry.source,
                  confidence: entry.confidence,
                });
              }}
              onDelete={() => void removeEntry(entry)}
            />
          ))}
        </section>
      ))}

      {form && (
        <div className="form-card" style={{ borderColor: "#b8dcbc" }}>
          <div className="card-heading">
            <div className="card-number">{editing ? <Edit3 size={15} /> : <Plus size={15} />}</div>
            <div>
              <h2>{editing ? "Edit food entry" : "Add food manually"}</h2>
              <p>เพิ่มเอง แก้เอง หรือตรวจผลจาก simulated photo scan ก่อนบันทึก</p>
            </div>
            <button
              className="icon-button"
              style={{ marginLeft: "auto" }}
              aria-label="Close form"
              onClick={() => {
                setForm(null);
                setEditing(null);
              }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={(event) => void saveEntry(event)}>
            <div className="form-grid two-columns">
              <label>
                <span className="field-label">Meal</span>
                <select
                  className="text-input"
                  value={form.meal}
                  onChange={(event) => setForm({ ...form, meal: event.target.value as MealType })}
                >
                  {meals.map((meal) => (
                    <option key={meal} value={meal}>
                      {mealLabels[meal]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="field-label">Serving</span>
                <input
                  className="text-input"
                  value={form.serving}
                  onChange={(event) => setForm({ ...form, serving: event.target.value })}
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                <span className="field-label">Food name</span>
                <input
                  autoFocus
                  className="text-input"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="เช่น ข้าวมันไก่ / chicken rice"
                />
              </label>

              {(["calories", "protein_g", "carbs_g", "fat_g"] as const).map((field) => (
                <label key={field}>
                  <span className="field-label">
                    {field === "calories" ? "Calories (kcal)" : `${field.replace("_g", "")} (g)`}
                  </span>
                  <input
                    className="text-input"
                    type="number"
                    min="0"
                    value={form[field]}
                    onChange={(event) => setForm({ ...form, [field]: toNumber(event.target.value) })}
                  />
                </label>
              ))}
            </div>

            {form.source === "photo_scan" && (
              <div className="alert" style={{ marginTop: 16, background: "#fff9df", color: "#5f5a38" }}>
                Scan confidence: {Math.round((form.confidence ?? 0) * 100)}% — please confirm before saving.
              </div>
            )}

            <button className="button primary" style={{ marginTop: 18 }} disabled={saving}>
              {saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
              {saving ? "Saving..." : "Save food"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 8, background: "#f4f7f5" }}>
      <span style={{ display: "block", color: "#687284", fontSize: 11 }}>{label}</span>
      <strong style={{ display: "block", marginTop: 5, fontSize: 18 }}>
        {value} <small style={{ color: "#687284", fontSize: 10 }}>{unit}</small>
      </strong>
    </div>
  );
}

function FoodRow({ entry, onEdit, onDelete }: { entry: FoodEntry; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: "1px solid #eef1ee" }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <strong style={{ fontSize: 13 }}>{entry.name}</strong>
        <span style={{ display: "block", color: "#687284", fontSize: 11, marginTop: 3 }}>
          {entry.serving} • {entry.source === "photo_scan" ? "Photo scan estimate" : "Manual entry"}
        </span>
      </div>
      <span style={{ color: "#176b46", fontSize: 12, fontWeight: 700 }}>{Math.round(entry.calories)} kcal</span>
      <button className="icon-button" aria-label={`Edit ${entry.name}`} onClick={onEdit}>
        <Edit3 size={15} />
      </button>
      <button className="icon-button" aria-label={`Delete ${entry.name}`} onClick={onDelete}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}
