import React, { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import { Card, Badge, SectionHeader } from "./ui";
import { entitiesFrom } from "./charts";
import { scoreColor } from "../lib/utils";

export default function ComparisonTable({ dashboard }) {
  const [sortKey, setSortKey] = useState("overall");
  const [dir, setDir] = useState("desc");

  const rows = useMemo(() => {
    const entities = entitiesFrom(dashboard);
    return entities.map((e) => {
      const src = e.isBaseline ? dashboard.baseline : dashboard.competitors.find((c) => c.company_name === e.name);
      const a = e.isBaseline ? dashboard.baseline : src?.analysis;
      return {
        name: e.name, isBaseline: e.isBaseline, color: e.color, overall: e.overall ?? 0,
        price: e.scores.price_competitiveness ?? 0, feature: e.scores.feature_strength ?? 0,
        innovation: e.scores.innovation ?? 0, value: e.scores.value_proposition ?? 0,
        strength: a?.key_strength || "—", weakness: a?.key_weakness || "—",
      };
    });
  }, [dashboard]);

  const sorted = useMemo(() => {
    const s = [...rows].sort((a, b) => (typeof a[sortKey] === "number" ? a[sortKey] - b[sortKey] : String(a[sortKey]).localeCompare(String(b[sortKey]))));
    return dir === "desc" ? s.reverse() : s;
  }, [rows, sortKey, dir]);

  const toggle = (k) => { if (sortKey === k) setDir(dir === "asc" ? "desc" : "asc"); else { setSortKey(k); setDir("desc"); } };

  const cols = [
    { k: "name", label: "Company", num: false },
    { k: "overall", label: "Overall", num: true },
    { k: "price", label: "Price", num: true },
    { k: "feature", label: "Feature", num: true },
    { k: "innovation", label: "Innovation", num: true },
    { k: "value", label: "Value", num: true },
  ];

  return (
    <Card className="p-5 animate-fade-up" data-testid="comparison-table">
      <SectionHeader label="Consolidated" title="Comparison Table" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              {cols.map((c) => (
                <th key={c.k} className="text-left py-2.5 px-3">
                  <button onClick={() => toggle(c.k)} className="caption font-normal flex items-center gap-1 hover:text-tprimary" data-testid={`sort-${c.k}`}>
                    {c.label} <ArrowUpDown size={11} className={sortKey === c.k ? "text-accent" : "text-tmuted"} />
                  </button>
                </th>
              ))}
              <th className="text-left py-2.5 px-3 caption font-normal">Key Strength</th>
              <th className="text-left py-2.5 px-3 caption font-normal">Key Weakness</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.name} className="border-b border-line/60 hover:bg-surfaceHover transition-colors" data-testid={`compare-row-${r.name}`}>
                <td className="py-3 px-3 font-medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                    {r.name}{r.isBaseline && <Badge tone="brand">You</Badge>}
                  </span>
                </td>
                {["overall", "price", "feature", "innovation", "value"].map((k) => (
                  <td key={k} className="py-3 px-3 font-mono font-semibold" style={{ color: scoreColor(r[k]) }}>{r[k]}</td>
                ))}
                <td className="py-3 px-3 text-xs text-tsecondary max-w-[220px]">{r.strength}</td>
                <td className="py-3 px-3 text-xs text-tsecondary max-w-[220px]">{r.weakness}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
