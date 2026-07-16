import { BookOpen, LoaderCircle, Save, Sparkles } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { EmojiCue } from "../components/EmojiCue";
import { getHealthDiary, getHealthDiaryHistory, saveHealthDiary } from "../lib/featureApi";
import type { HealthDiaryEntry, HealthDiaryInput, Level, Mood } from "../types/feature";

const levels: Level[] = ["low", "medium", "high"];
const levelLabels: Record<Level, string> = { low: "ต่ำ / low", medium: "กลาง / medium", high: "สูง / high" };
const moods: Mood[] = ["great", "good", "okay", "low", "stressed"];
const moodLabels: Record<Mood, string> = {
  great: "ดีมาก / great",
  good: "ดี / good",
  okay: "ปกติ / okay",
  low: "แผ่ว / low",
  stressed: "เครียด / stressed",
};

const createInitial = (date: string): HealthDiaryInput => ({
  date,
  weight_kg: undefined,
  sleep_hours: undefined,
  water_liters: undefined,
  mood: "okay",
  hunger: "medium",
  energy: "medium",
  stress: "medium",
  exercise: "",
  symptoms: "",
  bowel_movement: "",
  menstrual_cycle: "",
  medications_supplements: "",
  notes: "",
});

const longFields = [
  ["exercise", "Exercise / การออกกำลังกาย"],
  ["symptoms", "Symptoms / อาการ"],
  ["bowel_movement", "Bowel movement / การขับถ่าย"],
  ["menstrual_cycle", "Menstrual cycle / รอบเดือน"],
  ["medications_supplements", "Medications & supplements / ยาและอาหารเสริม"],
  ["notes", "Notes / บันทึกเพิ่มเติม"],
] as const satisfies ReadonlyArray<[keyof HealthDiaryInput, string]>;

export function HealthDiaryPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState<HealthDiaryInput>(createInitial(date));
  const [history, setHistory] = useState<HealthDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [entry, entries] = await Promise.all([getHealthDiary(date), getHealthDiaryHistory(date)]);
      setForm(entry ? { ...createInitial(date), ...entry } : createInitial(date));
      setHistory(entries);
    } catch {
      setError("โหลด Health Diary ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  function update<K extends keyof HealthDiaryInput>(key: K, value: HealthDiaryInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSavedMessage("");
    setError("");

    try {
      const entry = await saveHealthDiary({ ...form, date });
      setForm({ ...createInitial(date), ...entry });
      setHistory((current) => [entry, ...current.filter((item) => item.date !== date)]);
      setSavedMessage("บันทึกแล้ว / Health diary saved.");
    } catch {
      setError("บันทึก Health Diary ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="state-card">
        <LoaderCircle className="spin" size={28} />
        <h1>Loading Health Diary</h1>
        <p>กำลังเตรียมแบบบันทึกสุขภาพประจำวัน...</p>
      </div>
    );
  }

  return (
    <div className="page-width wellness-page health-diary-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DAILY WELLBEING</span>
          <h1 className="emoji-label"><EmojiCue symbol="🌿" /><span>Daily check-in</span></h1>
          <p>ติดตามน้ำหนัก การนอน น้ำ อารมณ์ ความหิว พลังงาน ความเครียด และอาการรายวัน</p>
        </div>
        <div className="heading-badge">
          <Sparkles size={15} /> Your private space
        </div>
      </div>

      <div className="profile-layout">
        <div>
          <form className="form-card" onSubmit={(event) => void submit(event)}>
            <div className="card-heading">
              <div className="card-number">
                <BookOpen size={15} />
              </div>
              <div>
                <h2 className="emoji-label"><EmojiCue symbol="🌿" /><span>วันนี้เป็นอย่างไรบ้าง? / How are you today?</span></h2>
                <p>ช่องที่ไม่สะดวกกรอกสามารถเว้นได้</p>
              </div>
            </div>

            <label className="field-label" htmlFor="diary-date">
              Date
            </label>
            <input
              id="diary-date"
              className="text-input"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />

            <div className="form-grid three-columns" style={{ marginTop: 18 }}>
              <NumberField
                id="diary-weight"
                label="Weight (kg)"
                emoji="⚖️"
                value={form.weight_kg}
                onChange={(value) => update("weight_kg", value)}
              />
              <NumberField
                id="diary-sleep"
                label="Sleep (hours)"
                emoji="😴"
                value={form.sleep_hours}
                onChange={(value) => update("sleep_hours", value)}
              />
              <NumberField
                id="diary-water"
                label="Water (liters)"
                emoji="💧"
                value={form.water_liters}
                onChange={(value) => update("water_liters", value)}
              />
            </div>

            <Choice
              label="Mood / อารมณ์"
              emoji="🙂"
              value={form.mood}
              options={moods.map((value) => [value, moodLabels[value]])}
              onChange={(value) => update("mood", value as Mood)}
            />

            <div className="form-grid three-columns">
              <Choice
                label="Hunger / ความหิว"
                emoji="🍽️"
                value={form.hunger}
                options={levels.map((value) => [value, levelLabels[value]])}
                onChange={(value) => update("hunger", value as Level)}
              />
              <Choice
                label="Energy / พลังงาน"
                emoji="⚡"
                value={form.energy}
                options={levels.map((value) => [value, levelLabels[value]])}
                onChange={(value) => update("energy", value as Level)}
              />
              <Choice
                label="Stress / ความเครียด"
                emoji="🧘"
                value={form.stress}
                options={levels.map((value) => [value, levelLabels[value]])}
                onChange={(value) => update("stress", value as Level)}
              />
            </div>

            {longFields.map(([field, label]) => (
              <div key={field} style={{ marginTop: 15 }}>
                <label className="field-label" htmlFor={`diary-${field}`}>
                  {label}
                </label>
                <textarea
                  id={`diary-${field}`}
                  className="text-input"
                  style={{ paddingTop: 10, minHeight: 68, resize: "vertical" }}
                  value={form[field] ?? ""}
                  onChange={(event) => update(field, event.target.value)}
                  placeholder="เขียนสั้น ๆ ได้เลย..."
                />
              </div>
            ))}

            {error && (
              <div className="alert error-alert" role="alert">
                {error}
              </div>
            )}

            {savedMessage && (
              <div className="alert" style={{ color: "#176b46", background: "#e8f5ee" }} role="status">
                {savedMessage}
              </div>
            )}

            <button className="button primary" style={{ marginTop: 18 }} disabled={saving}>
              {saving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
              {saving ? "Saving..." : "Save Health Diary"}
            </button>
          </form>
        </div>

        <aside className="profile-sidebar">
          <section className="profile-side-card green-side-card">
            <span className="eyebrow">HISTORY</span>
            <h2>Recent check-ins</h2>
            {history.length ? (
              history.slice(0, 6).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setDate(entry.date);
                    setForm({ ...createInitial(entry.date), ...entry });
                  }}
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    marginTop: 12,
                    padding: "9px 0",
                    border: 0,
                    borderTop: "1px solid #cfe5d1",
                    color: "#31433a",
                    background: "transparent",
                    fontSize: 11,
                  }}
                >
                  <span>{entry.date}</span>
                  <span>{entry.sleep_hours ? `${entry.sleep_hours} h sleep` : "Open"}</span>
                </button>
              ))
            ) : (
              <p style={{ marginTop: 14 }}>ยังไม่มีประวัติ ลองบันทึกวันนี้เป็นรายการแรก</p>
            )}
          </section>

          <section className="profile-side-card">
            <strong style={{ fontSize: 13 }}>AI note</strong>
            <p style={{ marginTop: 8 }}>
              ยิ่งบันทึกต่อเนื่อง AI ยิ่งช่วยมองเห็น pattern ระหว่างการนอน ความหิว พลังงาน และอาหารได้ดีขึ้น
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  emoji,
  value,
  onChange,
}: {
  id: string;
  label: string;
  emoji: string;
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        <EmojiCue symbol={emoji} /><span>{label}</span>
      </label>
      <input
        id={id}
        aria-label={label}
        className="text-input"
        type="number"
        min="0"
        step="0.1"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}
      />
    </div>
  );
}

function Choice({
  label,
  emoji,
  value,
  options,
  onChange,
}: {
  label: string;
  emoji: string;
  value?: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: "18px 0 0" }}>
      <legend className="field-label"><EmojiCue symbol={emoji} /><span>{label}</span></legend>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map(([option, text]) => (
          <label
            key={option}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 10px",
              border: "1px solid #e5e9ef",
              borderRadius: 7,
              background: value === option ? "#eef8ef" : "#fff",
              color: value === option ? "#16702a" : "#687284",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            <input type="radio" name={label} value={option} checked={value === option} onChange={() => onChange(option)} />
            {text}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
