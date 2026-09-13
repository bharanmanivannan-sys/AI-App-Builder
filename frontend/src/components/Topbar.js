import React, { useRef, useState } from "react";
import { Menu, LogOut, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { Button, useDropdownClose } from "./ui";

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { dashboard, demoVisible, setDemoVisible } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef();
  useDropdownClose(ref, () => setMenuOpen(false));

  const hasReal = dashboard?.has_real_product;
  const showingDemo = demoVisible === null ? !hasReal : demoVisible;

  return (
    <header className="h-16 shrink-0 border-b border-line glass sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 no-print">
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-tsecondary" onClick={onMenu} data-testid="menu-toggle"><Menu size={22} /></button>
        <div className="hidden sm:block">
          <h1 className="text-base font-heading font-bold">AI Competitor Intelligence</h1>
          <p className="text-[11px] text-tsecondary">Understand where you win, where competitors lead, and where to act next.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDemoVisible(showingDemo ? false : true)}
          data-testid="toggle-demo-btn"
          title={showingDemo ? "Hide demo data" : "Show demo data"}
        >
          {showingDemo ? <Eye size={15} /> : <EyeOff size={15} />}
          <span className="hidden sm:inline">{showingDemo ? "Demo On" : "Demo Off"}</span>
        </Button>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surfaceHover transition-colors"
            data-testid="user-menu-btn"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-violet flex items-center justify-center text-xs font-bold uppercase">
              {(user?.name || user?.email || "U")[0]}
            </div>
            <ChevronDown size={16} className="text-tmuted hidden sm:block" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 card glass p-2 animate-fade-in">
              <div className="px-3 py-2 border-b border-line mb-1">
                <div className="text-sm font-medium truncate">{user?.name}</div>
                <div className="text-xs text-tmuted truncate">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-tsecondary hover:text-danger hover:bg-danger/10 transition-colors"
                data-testid="logout-btn"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
