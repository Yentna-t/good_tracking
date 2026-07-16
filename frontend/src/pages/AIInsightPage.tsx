import { AlertTriangle, CheckCircle2, Info, LoaderCircle, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getAIInsights, getFoodLog, getHealthDiary, getMacroPlan } from "../lib/featureApi";
import type { AIInsight, InsightContext } from "../types/feature";

const estimateDisclaimer =
  "AICT gives health estimates and behavior guidance only. It does not diagnose disease and does not replace a clinician.";

export function AIInsightPage({ context: providedContext }: { context?: InsightContext }) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const context = providedContext ?? (await loadContext());
      setInsights(await getAIInsights(context));
    } catch {
      setError("โหลด AI Insight ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [providedContext]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="state-card">
        <LoaderCircle className="spin" size={28} />
        <h1>Loading AI Insights</h1>
        <p>AICT กำลังสรุป pattern จากอาหาร การนอน และไดอารีสุขภาพ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-card">
        <h1>AI Insight unavailable</h1>
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
          <span className="eyebrow">AI INSIGHT MVP</span>
          <h1>AI Insights</h1>
          <p>การ์ดคำแนะนำแบบ actionable จากข้อมูลที่คุณบันทึกไว้ โดยไม่ใช้เพื่อวินิจฉัยโรค</p>
        </div>
        <div className="heading-badge">
          <Sparkles size={15} /> Rule-based guidance
        </div>
      </div>

      <div className="alert" style={{ display: "flex", gap: 9, color: "#5f5a38", background: "#fff9df" }}>
        <Info size={16} />
        <span>{estimateDisclaimer}</span>
      </div>

      <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}

async function loadContext(): Promise<InsightContext> {
  const [food, diary, macro] = await Promise.all([getFoodLog(), getHealthDiary(), getMacroPlan()]);
  return { food, diary: diary ?? undefined, macro };
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const Icon = insight.severity === "positive" ? CheckCircle2 : insight.severity === "attention" ? AlertTriangle : Info;
  const color = insight.severity === "positive" ? "#2f9e44" : insight.severity === "attention" ? "#c47a16" : "#6574cd";

  return (
    <article className="form-card" style={{ marginBottom: 0, borderLeft: `4px solid ${color}` }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Icon size={21} color={color} />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>{insight.title}</h2>
          <p style={{ margin: "8px 0 10px", color: "#687284", fontSize: 12, lineHeight: 1.5 }}>{insight.body}</p>
          <div style={{ padding: "10px 12px", borderRadius: 7, color: "#176b46", background: "#eef8ef", fontSize: 12 }}>
            <strong>ลองทำแบบนี้: </strong>
            {insight.action}
          </div>
          <small style={{ display: "block", marginTop: 11, color: "#9aa6b4", fontSize: 10 }}>{insight.disclaimer}</small>
        </div>
      </div>
    </article>
  );
}
