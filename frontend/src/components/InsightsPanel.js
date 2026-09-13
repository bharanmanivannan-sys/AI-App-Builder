import React from "react";
import { TrendingDown, Swords, Lightbulb, ArrowRight } from "lucide-react";
import { Card, Badge, SectionHeader, EmptyState } from "./ui";

const impactTone = { High: "danger", Medium: "warning", Low: "info" };
const prioTone = { P0: "danger", P1: "warning", P2: "info" };

export default function InsightsPanel({ insights }) {
  const ins = insights?.insights;
  if (!ins) {
    return <Card className="p-5"><EmptyState icon={Lightbulb} title="No insights yet" subtitle="Generate AI insights to see where you're weaker, where competitors lead, and opportunities to pursue." /></Card>;
  }
  return (
    <div className="space-y-5">
      <div>
        <SectionHeader label="Where we are weaker" title="Our Gaps" />
        <div className="grid md:grid-cols-2 gap-4">
          {(ins.where_we_are_weaker || []).map((w, i) => (
            <Card key={i} className="p-4 border-danger/20 animate-fade-up" data-testid={`insight-weaker-${i}`}>
              <div className="flex items-start gap-2 mb-2">
                <TrendingDown size={16} className="text-danger mt-0.5 shrink-0" />
                <div className="font-medium text-sm">{w.issue}</div>
              </div>
              <div className="text-xs text-tsecondary mb-2 leading-relaxed"><span className="caption">Evidence</span><br />{w.evidence}</div>
              <Badge tone="danger">Impact: {w.impact}</Badge>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader label="Where competitors are better" title="Competitor Advantages" />
        <div className="grid md:grid-cols-2 gap-4">
          {(ins.where_competitors_are_better || []).map((c, i) => (
            <Card key={i} className="p-4 border-warning/20 animate-fade-up" data-testid={`insight-competitor-${i}`}>
              <div className="flex items-center gap-2 mb-2">
                <Swords size={16} className="text-warning shrink-0" />
                <span className="font-semibold text-sm">{c.competitor}</span>
              </div>
              <div className="text-sm text-tprimary mb-2">{c.advantage}</div>
              <div className="text-xs text-tsecondary mb-2 leading-relaxed"><span className="caption">Evidence</span><br />{c.evidence}</div>
              <Badge tone="warning">Impact: {c.impact}</Badge>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader label="Opportunities to pursue" title="Where We Can Win" />
        <div className="space-y-3">
          {(ins.opportunities || []).map((o, i) => (
            <Card key={i} className="p-4 border-info/20 animate-fade-up" data-testid={`insight-opportunity-${i}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2 flex-1 min-w-[200px]">
                  <Lightbulb size={16} className="text-info mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm mb-1">{o.opportunity}</div>
                    <div className="text-xs text-tsecondary leading-relaxed mb-1"><span className="text-tmuted">Why:</span> {o.why}</div>
                    <div className="text-xs text-tsecondary leading-relaxed"><span className="text-tmuted">Evidence:</span> {o.evidence}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={impactTone[o.impact] || "default"}>{o.impact} impact</Badge>
                  <Badge tone={prioTone[o.priority] || "default"}>{o.priority}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
