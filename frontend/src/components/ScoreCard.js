import React from "react";
import { Card, InfoDot } from "./ui";
import { scoreColor } from "../lib/utils";

export default function ScoreCard({ label, value, icon: Icon, hint, delta, testId }) {
  const color = scoreColor(value);
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <Card className="p-5 relative overflow-hidden card-hover animate-fade-up" data-testid={testId}>
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-25" style={{ background: color }} />
      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-2">
          {Icon && <div className="p-1.5 rounded-lg bg-surface-2 border border-line"><Icon size={15} className="text-accent" /></div>}
          <span className="caption">{label}</span>
        </div>
        {hint && <InfoDot content={hint} />}
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-heading font-bold tabular-nums" style={{ color }}>{value ?? "—"}</span>
        <span className="text-sm text-tmuted mb-1">/100</span>
        {delta != null && (
          <span className={`text-xs font-medium mb-1.5 ml-auto ${delta >= 0 ? "text-success" : "text-danger"}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} vs avg
          </span>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </Card>
  );
}
