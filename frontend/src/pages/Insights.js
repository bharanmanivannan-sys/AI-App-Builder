import React, { useState } from "react";
import { toast } from "sonner";
import { useData } from "../context/DataContext";
import ExecutiveSummary from "../components/ExecutiveSummary";
import InsightsPanel from "../components/InsightsPanel";
import RecommendedActions from "../components/RecommendedActions";
import { Spinner } from "../components/ui";

export default function Insights() {
  const { insights, actions, loading, generateInsights, setActionStatus } = useData();
  const [gen, setGen] = useState(false);
  if (loading) return <div className="flex items-center justify-center h-[70vh]"><Spinner className="w-8 h-8 text-brand" /></div>;

  const doGenerate = async () => {
    setGen(true);
    try { await generateInsights(); toast.success("AI insights generated"); }
    catch (e) { toast.error(e.response?.data?.detail || "Analyze a competitor first"); }
    finally { setGen(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <div className="caption mb-1">Data → Comparison → Insight → Action</div>
        <h1 className="text-2xl sm:text-3xl font-bold">AI Competitive Insights</h1>
      </div>
      <ExecutiveSummary insights={insights} onGenerate={doGenerate} generating={gen} />
      <InsightsPanel insights={insights} />
      <RecommendedActions actions={actions} onStatus={setActionStatus} />
    </div>
  );
}
