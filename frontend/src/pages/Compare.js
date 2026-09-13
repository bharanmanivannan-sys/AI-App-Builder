import React from "react";
import { GitCompareArrows } from "lucide-react";
import { useData } from "../context/DataContext";
import { Spinner, EmptyState, Card } from "../components/ui";
import { RadarChartCard, BarChartCard, PositioningChart } from "../components/charts";
import ComparisonTable from "../components/ComparisonTable";
import FeatureMatrix from "../components/FeatureMatrix";
import PricingComparison from "../components/PricingComparison";

export default function Compare() {
  const { dashboard, loading } = useData();
  if (loading || !dashboard) return <div className="flex items-center justify-center h-[70vh]"><Spinner className="w-8 h-8 text-brand" /></div>;
  const ready = dashboard.baseline && (dashboard.competitors || []).length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <div className="caption mb-1">Side by side</div>
        <h1 className="text-2xl sm:text-3xl font-bold">Compare</h1>
      </div>
      {!ready ? (
        <Card className="p-6"><EmptyState icon={GitCompareArrows} title="Nothing to compare yet" subtitle="Add and analyze at least one competitor to unlock comparisons." /></Card>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <RadarChartCard dashboard={dashboard} />
            <PositioningChart dashboard={dashboard} />
          </div>
          <BarChartCard dashboard={dashboard} />
          <ComparisonTable dashboard={dashboard} />
          <div className="grid lg:grid-cols-2 gap-6">
            <PricingComparison dashboard={dashboard} />
          </div>
          <FeatureMatrix dashboard={dashboard} />
        </>
      )}
    </div>
  );
}
