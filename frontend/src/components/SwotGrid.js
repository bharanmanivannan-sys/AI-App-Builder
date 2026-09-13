import React from "react";
import { TrendingUp, TrendingDown, Target, ShieldAlert } from "lucide-react";
import { Card, Badge, SectionHeader, EmptyState } from "./ui";
import { Grid2x2Check } from "lucide-react";

const QUAD = [
  { key: "strengths", title: "Strengths", icon: TrendingUp, tone: "success", ring: "border-success/30 bg-success/5" },
  { key: "weaknesses", title: "Weaknesses", icon: TrendingDown, tone: "warning", ring: "border-warning/30 bg-warning/5" },
  { key: "opportunities", title: "Opportunities", icon: Target, tone: "info", ring: "border-info/30 bg-info/5" },
  { key: "threats", title: "Threats", icon: ShieldAlert, tone: "danger", ring: "border-danger/30 bg-danger/5" },
];

export default function SwotGrid({ insights }) {
  const swot = insights?.swot;
  if (!swot) {
    return <Card className="p-5"><EmptyState icon={Grid2x2Check} title="No SWOT yet" subtitle="Generate AI insights to build an evidence-based SWOT analysis." /></Card>;
  }
  return (
    <div>
      <SectionHeader label="Analysis" title="SWOT" />
      <div className="grid sm:grid-cols-2 gap-4">
        {QUAD.map((q) => (
          <Card key={q.key} className={`p-5 border ${q.ring} animate-fade-up`} data-testid={`swot-${q.key}`}>
            <div className="flex items-center gap-2 mb-3">
              <q.icon size={18} className={`text-${q.tone}`} />
              <h3 className="font-semibold">{q.title}</h3>
              <Badge tone={q.tone} className="ml-auto">{(swot[q.key] || []).length}</Badge>
            </div>
            <ul className="space-y-2.5">
              {(swot[q.key] || []).map((t, i) => (
                <li key={i} className="text-sm text-tsecondary leading-snug flex gap-2">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-${q.tone}`} />{t}
                </li>
              ))}
              {(swot[q.key] || []).length === 0 && <li className="text-sm text-tmuted italic">None identified.</li>}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
