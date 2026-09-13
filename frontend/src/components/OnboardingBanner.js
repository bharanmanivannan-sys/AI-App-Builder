import React from "react";
import { Sparkles, Users, LayoutDashboard, FileDown, ArrowRight, X } from "lucide-react";
import { Button } from "./ui";

export default function OnboardingBanner({ hasReal, onAnalyzeOwn, onAddCompetitor, onDismiss }) {
  const steps = [
    { icon: Sparkles, label: "Analyze your site", done: hasReal },
    { icon: Users, label: "Add competitors", done: false },
    { icon: LayoutDashboard, label: "Read intelligence", done: false },
    { icon: FileDown, label: "Export report", done: false },
  ];
  return (
    <div className="relative overflow-hidden rounded-xl border border-brand/30 bg-gradient-to-br from-brand/15 via-surface to-violet/10 p-5 sm:p-6 animate-fade-up grain" data-testid="onboarding-banner">
      <button onClick={onDismiss} className="absolute top-3 right-3 text-tmuted hover:text-tprimary" data-testid="dismiss-onboarding"><X size={18} /></button>
      <div className="caption mb-1 text-accent">Guided Setup</div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1">
        {hasReal ? "Add competitors to complete your intelligence view" : "Start by analyzing your own product"}
      </h2>
      <p className="text-sm text-tsecondary max-w-2xl mb-5">
        {hasReal
          ? "Your baseline is set. Add the competitors you care about and let GPT-5.4 benchmark them against you."
          : "We'll scan your website first to build your baseline. Everything is then measured against your product — not a generic demo."}
      </p>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${s.done ? "bg-success/15 text-success border-success/30" : "bg-surface-2 text-tsecondary border-line"}`}>
              <s.icon size={14} /> {s.label}
            </div>
            {i < steps.length - 1 && <ArrowRight size={14} className="text-tmuted hidden sm:block" />}
          </React.Fragment>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {!hasReal && <Button onClick={onAnalyzeOwn} data-testid="onboarding-analyze-own"><Sparkles size={16} /> Analyze My Site</Button>}
        <Button variant={hasReal ? "primary" : "secondary"} onClick={onAddCompetitor} data-testid="onboarding-add-competitor"><Users size={16} /> Add Competitor</Button>
      </div>
    </div>
  );
}
