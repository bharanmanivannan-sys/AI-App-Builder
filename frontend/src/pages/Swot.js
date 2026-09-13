import React, { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useData } from "../context/DataContext";
import SwotGrid from "../components/SwotGrid";
import { Button, Spinner } from "../components/ui";

export default function Swot() {
  const { insights, loading, generateInsights } = useData();
  const [gen, setGen] = useState(false);
  if (loading) return <div className="flex items-center justify-center h-[70vh]"><Spinner className="w-8 h-8 text-brand" /></div>;

  const doGenerate = async () => {
    setGen(true);
    try { await generateInsights(); toast.success("SWOT generated"); }
    catch (e) { toast.error(e.response?.data?.detail || "Analyze a competitor first"); }
    finally { setGen(false); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="caption mb-1">Analysis</div>
          <h1 className="text-2xl sm:text-3xl font-bold">SWOT Analysis</h1>
        </div>
        <Button variant="secondary" onClick={doGenerate} disabled={gen} data-testid="swot-generate-btn">
          {gen ? <Spinner className="w-4 h-4" /> : <Sparkles size={16} />} {insights ? "Regenerate" : "Generate"}
        </Button>
      </div>
      <SwotGrid insights={insights} />
    </div>
  );
}
