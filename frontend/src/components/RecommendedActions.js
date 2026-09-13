import React from "react";
import { ListChecks, Circle, CircleDot, CheckCircle2 } from "lucide-react";
import { Card, Badge, SectionHeader, EmptyState } from "./ui";
import { fmtStatus } from "../lib/utils";

const prioTone = { P0: "danger", P1: "warning", P2: "info" };
const statusIcon = { not_started: Circle, in_progress: CircleDot, completed: CheckCircle2 };
const statusTone = { not_started: "text-tmuted", in_progress: "text-warning", completed: "text-success" };
const STATUSES = ["not_started", "in_progress", "completed"];

export default function RecommendedActions({ actions, onStatus }) {
  if (!actions || actions.length === 0) {
    return <Card className="p-5"><EmptyState icon={ListChecks} title="No recommended actions" subtitle="Generate AI insights and we'll turn them into a prioritized action list." /></Card>;
  }
  return (
    <Card className="p-5 animate-fade-up" data-testid="recommended-actions">
      <SectionHeader label="Do next" title="Recommended Actions" />
      <div className="space-y-2.5">
        {actions.map((a) => {
          const Icon = statusIcon[a.status] || Circle;
          return (
            <div key={a.id} className="flex items-start gap-3 p-3.5 rounded-lg bg-surface-2/60 border border-line hover:bg-surfaceHover transition-colors" data-testid={`action-${a.id}`}>
              <Badge tone={prioTone[a.priority] || "default"} className="mt-0.5">{a.priority}</Badge>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{a.action}</div>
                <div className="text-xs text-tsecondary mt-0.5">{a.reason}</div>
                <div className="mt-1"><Badge tone="default">Impact: {a.impact}</Badge></div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Icon size={16} className={statusTone[a.status]} />
                <select
                  value={a.status}
                  onChange={(e) => onStatus(a.id, e.target.value)}
                  className="bg-surface border border-line rounded-md text-xs px-2 py-1 text-tsecondary focus:outline-none focus:border-brand"
                  data-testid={`action-status-${a.id}`}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{fmtStatus(s)}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
