import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Cell, LabelList } from "recharts";
import { Card, Badge, SectionHeader, InfoDot } from "./ui";
import { entitiesFrom } from "./charts";
import { priceNumber, COLORS } from "../lib/utils";

export default function PricingComparison({ dashboard }) {
  const entities = entitiesFrom(dashboard);
  const rows = entities.map((e, i) => {
    const src = e.isBaseline ? dashboard.baseline : (dashboard.competitors.find((c) => c.company_name === e.name));
    const pricing = e.isBaseline ? dashboard.baseline?.pricing : src?.analysis?.pricing;
    return { name: e.name, isBaseline: e.isBaseline, color: e.color, pricing, num: priceNumber(pricing), display: pricing?.starting_price || "Not publicly available", confidence: pricing?.confidence };
  });
  const nums = rows.filter((r) => r.num != null).map((r) => r.num);
  const lowest = nums.length ? Math.min(...nums) : null;
  const highest = nums.length ? Math.max(...nums) : null;
  const chartData = rows.filter((r) => r.num != null).map((r) => ({ name: r.name.length > 12 ? r.name.slice(0, 11) + "…" : r.name, value: r.num, color: r.color }));

  const relPos = (num) => {
    if (num == null || lowest == null) return "—";
    if (num <= lowest * 1.02) return "Lowest";
    if (num >= highest * 0.98) return "Highest";
    return "Mid";
  };
  const relTone = { Lowest: "success", Highest: "danger", Mid: "warning", "—": "default" };

  return (
    <Card className="p-5 animate-fade-up" data-testid="pricing-comparison">
      <SectionHeader label="Pricing" title="Price Comparison"
        right={<InfoDot content="Prices reflect publicly listed starting prices only. Different pricing models (per-seat, one-time, ex-showroom) are not directly comparable — treat cross-model comparisons as approximate." />} />
      {nums.length > 1 && (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 16, right: 8, left: -18, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={40} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} />
            <RTooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#121824", border: "1px solid #1E293B", borderRadius: 10 }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
              <LabelList dataKey="value" position="top" fill="#94A3B8" fontSize={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-line">
              <th className="py-2.5 pr-4 caption font-normal">Company</th>
              <th className="py-2.5 pr-4 caption font-normal">Starting Price</th>
              <th className="py-2.5 pr-4 caption font-normal">Relative Position</th>
              <th className="py-2.5 caption font-normal">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-line/60 hover:bg-surfaceHover transition-colors" data-testid={`pricing-row-${r.name}`}>
                <td className="py-2.5 pr-4 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                  {r.name}{r.isBaseline && <Badge tone="brand">You</Badge>}
                </td>
                <td className={`py-2.5 pr-4 font-mono ${r.num == null ? "text-tmuted italic" : "text-tprimary"}`}>{r.display}</td>
                <td className="py-2.5 pr-4"><Badge tone={relTone[relPos(r.num)]}>{relPos(r.num)}</Badge></td>
                <td className="py-2.5 text-tsecondary text-xs">{r.confidence || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
