import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, GitCompareArrows, Lightbulb, Grid2x2Check, Settings, Radar } from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/competitors", label: "Competitors", icon: Users },
  { to: "/compare", label: "Compare", icon: GitCompareArrows },
  { to: "/insights", label: "Insights", icon: Lightbulb },
  { to: "/swot", label: "SWOT", icon: Grid2x2Check },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full w-[250px] shrink-0 border-r border-line bg-surface/60 glass flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        data-testid="sidebar"
      >
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-line">
          <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center">
            <Radar size={18} className="text-accent" />
          </div>
          <div className="leading-tight">
            <div className="font-heading font-bold text-sm">Competitor IQ</div>
            <div className="caption text-[9px]">Intelligence</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              onClick={onClose}
              data-testid={`nav-${it.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-brand/15 text-accent border border-brand/30" : "text-tsecondary hover:text-tprimary hover:bg-surfaceHover border border-transparent"
                }`
              }
            >
              <it.icon size={18} />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-brand/15 to-violet/10 border border-line">
          <div className="caption mb-1">AI Engine</div>
          <div className="text-sm font-medium">GPT-5.4</div>
          <div className="text-xs text-tsecondary mt-1">Powering analysis & insights</div>
        </div>
      </aside>
    </>
  );
}
