import React from "react";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Target, RefreshCw } from "lucide-react";
import { Card, Badge, Button, Spinner } from "./ui";

export default function ExecutiveSummary({ insights, onGenerate, generating }) {
  const s = insights?.executive_summary;
  const posTone = { Strong: "success", Moderate: "warning", Weak: "danger" }[s?.competitive_position] || "brand";
  return (
    <Card className="p-6 relative overflow-hidden animate-fade-up border-brand/30" data-testid="executive-summary">
      <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-violet/10 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Badge tone="violet"><Sparkles size={12} /> AI Executive Summary</Badge>
            {s && <Badge tone={posTone}>Position: {s.competitive_position}</Badge>}
          </div>
          <Button size="sm" variant="secondary" onClick={onGenerate} disabled={generating} data-testid="generate-insights-btn">
            {generating ? <><Spinner className="w-3.5 h-3.5" /> Analyzing…</> : <><RefreshCw size={14} /> {insights ? "Regenerate" : "Generate Insights"}</>}
          </Button>
        </div>
        {!s ? (
          <p className="text-sm text-tsecondary">Generate AI insights to see your executive summary, SWOT and recommended actions — reasoned from your competitive data.</p>
        ) : (
          <>
            <p className="text-base leading-relaxed text-tprimary mb-5">{s.narrative}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Item icon={TrendingUp} tone="text-success" label="Biggest advantage" text={s.biggest_advantage} />
              <Item icon={TrendingDown} tone="text-danger" label="Biggest weakness" text={s.biggest_weakness} />
              <Item icon={AlertTriangle} tone="text-warning" label="Biggest threat" text={s.biggest_threat} />
              <Item icon={Target} tone="text-accent" label="Biggest opportunity" text={s.biggest_opportunity} />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function Item({ icon: Icon, tone, label, text }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-surface-2/60 border border-line">
      <Icon size={18} className={`${tone} mt-0.5 shrink-0`} />
      <div>
        <div className="caption mb-0.5">{label}</div>
        <div className="text-sm text-tprimary leading-snug">{text}</div>
      </div>
    </div>
  );
}
