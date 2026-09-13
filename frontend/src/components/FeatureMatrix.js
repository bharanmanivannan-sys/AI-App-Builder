import React, { useState, useMemo } from "react";
import { Check, X, Minus } from "lucide-react";
import { Card, Badge, SectionHeader } from "./ui";
import { buildFeatureMatrix, scoreColor } from "../lib/utils";
import { entitiesFrom } from "./charts";

export default function FeatureMatrix({ dashboard }) {
  const matrix = useMemo(() => buildFeatureMatrix(dashboard.baseline, dashboard.competitors || []), [dashboard]);
  const entities = entitiesFrom(dashboard);
  const [cat, setCat] = useState("All");
  const cats = ["All", ...matrix.categories];
  const rows = cat === "All" ? matrix.rows : matrix.rows.filter((r) => r.category === cat);

  const featScores = entities.map((e) => e.scores.feature_strength ?? null);

  const Icon = ({ v }) => {
    if (v === "yes") return <Check size={16} className="text-success mx-auto" />;
    if (v === "no") return <X size={16} className="text-danger mx-auto" />;
    return <Minus size={16} className="text-tmuted mx-auto" />;
  };

  return (
    <Card className="p-5 animate-fade-up" data-testid="feature-matrix">
      <SectionHeader label="Capabilities" title="Feature Comparison" />
      <div className="flex flex-wrap gap-2 mb-4">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} data-testid={`feature-cat-${c}`}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${cat === c ? "bg-brand/15 text-accent border-brand/30" : "bg-surface-2 text-tsecondary border-line hover:text-tprimary"}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left py-2.5 pr-4 caption font-normal sticky left-0 bg-surface">Feature</th>
              {matrix.entities.map((n, i) => (
                <th key={n} className="py-2.5 px-2 text-center min-w-[90px]">
                  <div className="caption font-normal">{n.length > 12 ? n.slice(0, 11) + "…" : n}</div>
                  {featScores[i] != null && (
                    <div className="text-xs font-mono mt-1" style={{ color: scoreColor(featScores[i]) }}>{featScores[i]}/100</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-line/60 hover:bg-surfaceHover transition-colors" data-testid={`feature-row-${r.name}`}>
                <td className="py-2.5 pr-4 sticky left-0 bg-surface">
                  <div className="font-medium text-tprimary">{r.name}</div>
                  <div className="text-[10px] text-tmuted">{r.category}</div>
                </td>
                {r.cells.map((v, i) => <td key={i} className="py-2.5 px-2 text-center"><Icon v={v} /></td>)}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={99} className="py-8 text-center text-tmuted">No features in this category.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-tsecondary">
        <span className="flex items-center gap-1"><Check size={14} className="text-success" /> Available</span>
        <span className="flex items-center gap-1"><X size={14} className="text-danger" /> Not available</span>
        <span className="flex items-center gap-1"><Minus size={14} className="text-tmuted" /> Unknown / not publicly available</span>
      </div>
    </Card>
  );
}
