"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const LINKS = [
  ["/dashboard", "Dashboard", "grid"],
  ["/regression", "Regression", "chart"],
  ["/hypothesis", "Hypothesis test", "flask"],
  ["/data-explorer", "Data explorer", "table"],
  ["/history", "Reports", "file"],
  ["/learning", "Learning", "book"],
  ["/settings", "Settings", "settings"],
] as const;

function NavIcon({ name }: { name: (typeof LINKS)[number][2] }) {
  const paths: Record<(typeof LINKS)[number][2], React.ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 4-5 3 2 5-7" /><circle cx="19" cy="5" r="1" /></>,
    flask: <><path d="M9 3h6M10 3v6l-5.2 8.2A2.5 2.5 0 0 0 6.9 21h10.2a2.5 2.5 0 0 0 2.1-3.8L14 9V3" /><path d="M8 15h8" /></>,
    table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16M15 10v10" /></>,
    file: <><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M14 3.5V8h4M9 13h6M9 17h6" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 16.5A2.5 2.5 0 0 1 6.5 14H20M8 7h7M8 10h7" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.1.8-1.2 2.1-1.3-.5a7.7 7.7 0 0 1-1.8 1l-.2 1.4h-2.4l-.2-1.4a7.7 7.7 0 0 1-1.8-1l-1.3.5-1.2-2.1 1.1-.8a7.2 7.2 0 0 1 0-2l-1.1-.8 1.2-2.1 1.3.5a7.7 7.7 0 0 1 1.8-1l.2-1.4h2.4l.2 1.4a7.7 7.7 0 0 1 1.8 1l1.3-.5 1.2 2.1-1.1.8a7.2 7.2 0 0 1 0 2Z" transform="translate(-1 -1)" /></>,
  };
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function Sidebar() {
  const path = usePathname();
  const { user, logout } = useAuth();
  return (
    <aside>
      <Link href="/dashboard" className="sidebar-brand"><span className="brand-mark">S</span><span>Stat<span>Verse</span></span></Link>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {LINKS.map(([href, label, icon]) => (
          <Link key={href} href={href} className={"nv" + (path === href ? " on" : "")} aria-current={path === href ? "page" : undefined}>
            <NavIcon name={icon} /><span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-help">
        <span className="help-mark">?</span>
        <span><b>Need a hand?</b><small>Explore the Learning Center</small></span>
        <Link href="/learning" aria-label="Open Learning Center">›</Link>
      </div>
      <div className="sp" />
      <ThemeToggle />
      <div className="sidebar-user">
        <span className="user-avatar">{user?.name.slice(0, 1).toUpperCase()}</span>
        <span className="user-copy"><b>{user?.name}</b><small>{user?.email}</small></span>
        <button type="button" className="logout-button" onClick={() => { void logout(); }} aria-label="Log out">↗</button>
      </div>
    </aside>
  );
}
