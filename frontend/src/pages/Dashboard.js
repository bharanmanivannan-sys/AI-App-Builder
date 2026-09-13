import React, { useState } from "react";
import { toast } from "sonner";
import { Trophy, DollarSign, Layers, Gem, Crosshair, Sparkles, FileDown, Plus, BarChart3 } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Button, Spinner, Badge, EmptyState, SectionHeader } from "../components/ui";
import ScoreCard from "../components/ScoreCard";
import ExecutiveSummary from "../components/ExecutiveSummary";
import PricingComparison from "../components/PricingComparison";
import FeatureMatrix from "../components/FeatureMatrix";
import { RadarChartCard, BarChartCard, PositioningChart } from "../components/charts";
import SwotGrid from "../components/SwotGrid";
import InsightsPanel from "../components/InsightsPanel";
import RecommendedActions from "../components/RecommendedActions";
import ComparisonTable from "../components/ComparisonTable";
import OnboardingBanner from "../components/OnboardingBanner";
import AddCompetitorModal from "../components/AddCompetitorModal";
import AnalyzeOwnModal from "../components/AnalyzeOwnModal";
import { exportDashboardPdf } from "../lib/pdf";

const METHODOLOGY = "AI-derived competitive scores (0–100). Overall = Price×20% + Features×25% + Value×20% + Market×20% + Innovation×15%. Sub-scores are GPT-5.4 estimates from public website data — directional guidance, not objective facts.";

export default function Dashboard() {
  const { dashboard, insights, actions, loading, demoVisible, generateInsights, setActionStatus, loadAll } = useData();
  const { user } = useAuth();
  const [gen, setGen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [ownOpen, setOwnOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (loading || !dashboard) {
    return <div className="flex items-center justify-center h-[70vh]"><Spinner className="w-8 h-8 text-brand" /></div>;
  }

  const b = dashboard.baseline;
  const comps = dashboard.competitors || [];
  const showingDemo = demoVisible === null ? !dashboard.has_real_product : demoVisible;
  const hasReal = dashboard.has_real_product;

  const avg = (key) => {
    const vals = comps.map((c) => c.analysis?.scores?.[key]).filter((v) => v != null);
    return vals.length ? Math.round(vals.reduce((a, x) => a + x, 0) / vals.length) : null;
  };
  const delta = (key, val) => { const a = avg(key); return a == null || val == null ? null : val - a; };

  const cards = b ? [
    { label: "Overall Score", value: b.overall, icon: Trophy, key: "overall" },
    { label: "Price Competitiveness", value: b.scores?.price_competitiveness, icon: DollarSign, key: "price_competitiveness" },
    { label: "Feature Strength", value: b.scores?.feature_strength, icon: Layers, key: "feature_strength" },
    { label: "Value Proposition", value: b.scores?.value_proposition, icon: Gem, key: "value_proposition" },
    { label: "Market Position", value: b.scores?.market_position, icon: Crosshair, key: "market_position" },
    { label: "Innovation / AI", value: b.scores?.innovation, icon: Sparkles, key: "innovation" },
  ] : [];

  const doGenerate = async () => {
    setGen(true);
    try { await generateInsights(); toast.success("AI insights generated"); }
    catch (e) { toast.error(e.response?.data?.detail || "Analyze a competitor first"); }
    finally { setGen(false); }
  };

  const doExport = async () => {
    setExporting(true);
    try { await exportDashboardPdf("dashboard-capture"); toast.success("PDF exported"); }
    catch (e) { toast.error("Export failed"); }
    finally { setExporting(false); }
  };

  const showOnboarding = !dismissed && (!hasReal || comps.length === 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap no-print">
        <div>
          <div className="caption mb-1 flex items-center gap-2">
            AI Competitor Intelligence
            {showingDemo && !hasReal && <Badge tone="violet">Demo Data</Badge>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {b ? b.label : "Your Dashboard"}
            <span className="text-tmuted font-normal text-lg"> vs {comps.length} competitor{comps.length !== 1 ? "s" : ""}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setAddOpen(true)} data-testid="add-competitor-btn"><Plus size={16} /> Add Competitor</Button>
          <Button onClick={doExport} disabled={exporting} data-testid="export-pdf-btn">
            {exporting ? <Spinner className="w-4 h-4" /> : <FileDown size={16} />} Export PDF
          </Button>
        </div>
      </div>

      {showOnboarding && (
        <OnboardingBanner hasReal={hasReal}
          onAnalyzeOwn={() => setOwnOpen(true)}
          onAddCompetitor={() => setAddOpen(true)}
          onDismiss={() => setDismissed(true)} />
      )}

      <div id="dashboard-capture" className="space-y-6 dashboard-capture">
        {!b ? (
          <EmptyState icon={BarChart3} title="No baseline product yet" subtitle="Analyze your own website to create your baseline, then add competitors to benchmark against."
            action={<Button onClick={() => setOwnOpen(true)}><Sparkles size={16} /> Analyze My Site</Button>} />
        ) : (
          <>
            <div>
              <SectionHeader label="Competitive Overview" title="Score Cards"
                right={<Badge tone="violet"><Sparkles size={12} /> AI-derived scores</Badge>} />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {cards.map((c) => (
                  <ScoreCard key={c.label} label={c.label} value={c.value} icon={c.icon}
                    delta={delta(c.key === "overall" ? "overall" : c.key, c.value)}
                    hint={METHODOLOGY} testId={`score-${c.key}`} />
                ))}
              </div>
            </div>

            <ExecutiveSummary insights={insights} onGenerate={doGenerate} generating={gen} />

            {comps.length === 0 ? (
              <EmptyState icon={Plus} title="Add competitors to unlock comparisons" subtitle="Charts, pricing, features and SWOT appear once you've analyzed at least one competitor."
                action={<Button onClick={() => setAddOpen(true)}><Plus size={16} /> Add Competitor</Button>} />
            ) : (
              <>
                <div className="grid lg:grid-cols-2 gap-6">
                  <PricingComparison dashboard={dashboard} />
                  <BarChartCard dashboard={dashboard} />
                </div>
                <FeatureMatrix dashboard={dashboard} />
                <div className="grid lg:grid-cols-2 gap-6">
                  <RadarChartCard dashboard={dashboard} />
                  <PositioningChart dashboard={dashboard} />
                </div>
                <ComparisonTable dashboard={dashboard} />
                <SwotGrid insights={insights} />
                <InsightsPanel insights={insights} />
                <RecommendedActions actions={actions} onStatus={setActionStatus} />
              </>
            )}
          </>
        )}
      </div>

      <AddCompetitorModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={loadAll} />
      <AnalyzeOwnModal open={ownOpen} onClose={() => setOwnOpen(false)} onDone={loadAll} />
    </div>
  );
}
