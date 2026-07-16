import {
  Activity,
  Bell,
  ChevronDown,
  Flame,
  LayoutDashboard,
  LineChart,
  Search,
  Settings,
  UserRound,
  Utensils,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const primaryNavigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/food-log", label: "Food Log", icon: Utensils },
  { to: "/diary", label: "Health Diary", icon: Activity },
  { to: "/macro-planner", label: "Macro Planner", icon: LineChart },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/ai-insights", label: "AI Insights", icon: Flame },
  { to: "/profile", label: "Health Profile", icon: UserRound },
];

export function AppShell() {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const pageTitle = isDashboard ? "Dashboard" : location.pathname === "/progress" ? "Progress" : "Health Profile Setup";
  const pageSubtitle = isDashboard ? "Your health overview" : location.pathname === "/progress" ? "See your trends and consistency over time" : "Set your foundation for personalized tracking";

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Application sidebar">
        <div>
          <div className="brand">
            <span className="brand-mark" aria-hidden="true"><Activity size={24} strokeWidth={2.4} /></span>
            <div><strong>AICT</strong><span>AI Calorie Tracker<br />Health Diary &amp; Macro Planner</span></div>
          </div>

          <nav className="nav-list" aria-label="Primary navigation">
            {primaryNavigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Icon size={18} /><span>{label}</span></NavLink>)}
          </nav>
        </div>

        <div className="sidebar-footer">
          <article className="insight-card">
            <span className="eyebrow">AI POWERED</span>
            <h3>Build healthier habits with personalized guidance.</h3>
            <p>AI insights become more useful as you track your daily routine.</p>
            <button className="mini-btn" type="button">Explore AI Insights <span aria-hidden="true">→</span></button>
          </article>

          <article className="streak-card">
            <div className="streak-row"><strong>Daily Streak <Flame size={14} fill="currentColor" /></strong><span className="streak-days">5 days</span></div>
            <p>Keep showing up for your health.</p>
            <div className="week" aria-label="Weekly streak">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span className="day" key={`${day}-${index}`}><i className={`day-dot ${index < 5 ? "complete" : "empty"}`}>{index < 5 ? "✓" : ""}</i>{day}</span>)}
            </div>
          </article>

          <div className="sidebar-settings"><Settings size={16} /> Settings <span>Coming soon</span></div>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div className="topbar-context"><strong>{pageTitle}</strong><span>{pageSubtitle}</span></div>
          <div className="top-actions">
            <label className="search" aria-label="Global search">
              <Search size={17} aria-hidden="true" />
              <input aria-label="Search foods, meals, or anything" placeholder="Search foods, meals, or anything..." />
              <span className="key" aria-hidden="true">⌘ K</span>
            </label>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Bell size={18} aria-hidden="true" /><span className="notification-dot">3</span>
            </button>
            <div className="user-chip"><span className="avatar" aria-hidden="true">JD</span><span><strong>John Doe</strong><small>Premium</small></span><ChevronDown size={15} aria-hidden="true" /></div>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
