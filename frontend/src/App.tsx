import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { AIInsightPage } from "./pages/AIInsightPage";
import { FoodLogPage } from "./pages/FoodLogPage";
import { HealthDiaryPage } from "./pages/HealthDiaryPage";
import { MacroPlannerPage } from "./pages/MacroPlannerPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProgressPage } from "./pages/ProgressPage";

export default function App() {
  return <Routes><Route element={<AppShell />}>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/food-log" element={<FoodLogPage />} />
    <Route path="/diary" element={<HealthDiaryPage />} />
    <Route path="/health-diary" element={<HealthDiaryPage />} />
    <Route path="/macro-planner" element={<MacroPlannerPage />} />
    <Route path="/progress" element={<ProgressPage />} />
    <Route path="/ai-insights" element={<AIInsightPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Route></Routes>;
}
