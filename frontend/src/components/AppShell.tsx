import {
  Activity,
  ArrowUpRight,
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
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

const primaryNavigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/food-log", label: "Food Log", icon: Utensils },
  { to: "/diary", label: "Health Diary", icon: Activity },
  { to: "/macro-planner", label: "Macro Planner", icon: LineChart },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/ai-insights", label: "AI Insights", icon: Flame },
  { to: "/profile", label: "Health Profile", icon: UserRound },
];

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Today", subtitle: "Your health at a glance" },
  "/food-log": { title: "Food Log", subtitle: "Meals and daily nutrition" },
  "/diary": { title: "Health Diary", subtitle: "How your day feels" },
  "/health-diary": { title: "Health Diary", subtitle: "How your day feels" },
  "/macro-planner": { title: "Macro Planner", subtitle: "Targets that fit your routine" },
  "/progress": { title: "Progress", subtitle: "Your trends over time" },
  "/ai-insights": { title: "Insights", subtitle: "Helpful patterns from your entries" },
  "/profile": { title: "Health Profile", subtitle: "Your personal starting point" },
};

export function AppShell() {
  const location = useLocation();
  const meta = pageMeta[location.pathname] ?? pageMeta["/dashboard"];

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Application sidebar">
        <div>
          <div className="brand">
            <span className="brand-mark" aria-hidden="true"><Activity size={24} strokeWidth={2.4} /></span>
            <div><strong>AICT</strong><span>AI Calorie Tracker<br />Your everyday wellness space</span></div>
          </div>

          <nav className="nav-list" aria-label="Primary navigation">
            {primaryNavigation.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <section className="tracking-status" aria-label="Current tracking streak">
            <span className="tracking-status-label">THIS WEEK</span>
            <div className="tracking-status-value"><strong>5</strong><span>day<br />streak</span></div>
            <div className="ledger-week" aria-label="Five of seven days complete">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                <span key={`${day}-${index}`} className={index < 5 ? "complete" : ""}><i aria-hidden="true" />{day}</span>
              ))}
            </div>
            <Link to="/progress">Weekly review <ArrowUpRight size={13} /></Link>
          </section>

          <div className="sidebar-settings"><Settings size={16} /> Settings <span>Coming soon</span></div>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div className="topbar-context"><strong>{meta.title}</strong><span>{meta.subtitle}</span></div>
          <div className="top-actions">
            <label className="search" aria-label="Global search">
              <Search size={17} aria-hidden="true" />
              <input aria-label="Search entries or foods" placeholder="Search entries or foods..." />
              <span className="key" aria-hidden="true">Ctrl K</span>
            </label>
            <button className="icon-button" type="button" aria-label="Notifications">
              <Bell size={18} aria-hidden="true" /><span className="notification-dot">3</span>
            </button>
            <div className="user-chip"><span className="avatar" aria-hidden="true">JD</span><span><strong>John Doe</strong><small>Personal profile</small></span><ChevronDown size={15} aria-hidden="true" /></div>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
