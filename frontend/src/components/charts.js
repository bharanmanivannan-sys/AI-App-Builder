import React, { useState } from "react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  ScatterChart, Scatter, ZAxis, ReferenceLine, LabelList, Cell,
} from "recharts";
import { Card, Select, SectionHeader } from "./ui";
import { SCORE_KEYS, COLORS, scoreColor } from "../lib/utils";

export function entitiesFrom(dashboard) {
  if (!dashboard) return [];
  const list = [];
  if (dashboard.baseline) {
    const b = dashboard.baseline;
    list.push({ name: b.label, scores: b.scores || {}, overall: b.overall, isBaseline: true });
  }
  (dashboard.competitors || []).forEach((c) => {
    const a = c.analysis || {};
    list.push({ name: c.company_name, scores: a.scores || {}, overall: a.overall, isBaseline: false });
  });
  return list.map((e, i) => ({ ...e, color: e.isBaseline ? "#60A5FA" : COLORS[(i + 1) % COLORS.length] }));
}

const axisStyle = { fill: "#94A3B8", fontSize: 11 };

export function RadarChartCard({ dashboard }) {
  const entities = entitiesFrom(dashboard).slice(0, 5);
  const data = SCORE_KEYS.map((k) => {
    const row = { dimension: k.short };
    entities.forEach((e) => { row[e.name] = e.scores[k.key] ?? 0; });
    return row;
  });
  return (
    <Card className="p-5 animate-fade-up" data-testid="radar-chart">
      <SectionHeader label="Multi-dimensional" title="Competitive Radar" />
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#1E293B" />
          <PolarAngleAxis dataKey="dimension" tick={axisStyle} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} />
          {entities.map((e) => (
            <Radar key={e.name} name={e.name} dataKey={e.name} stroke={e.color} fill={e.color} fillOpacity={e.isBaseline ? 0.28 : 0.1} strokeWidth={2} />
          ))}
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <RTooltip contentStyle={{ background: "#121824", border: "1px solid #1E293B", borderRadius: 10 }} />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
}

const METRICS = [{ key: "overall", label: "Overall Score" }, ...SCORE_KEYS.map((k) => ({ key: k.key, label: k.label }))];

export function BarChartCard({ dashboard }) {
  const [metric, setMetric] = useState("overall");
  const entities = entitiesFrom(dashboard);
  const data = entities.map((e) => ({
    name: e.name.length > 14 ? e.name.slice(0, 13) + "…" : e.name,
    value: metric === "overall" ? e.overall ?? 0 : e.scores[metric] ?? 0,
    color: e.color,
  }));
  return (
    <Card className="p-5 animate-fade-up" data-testid="bar-chart">
      <SectionHeader label="Benchmark" title="Score Comparison"
        right={<Select value={metric} onChange={(e) => setMetric(e.target.value)} className="w-44" data-testid="bar-metric-select">
          {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </Select>} />
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis dataKey="name" tick={axisStyle} interval={0} angle={-18} textAnchor="end" height={54} />
          <YAxis domain={[0, 100]} tick={axisStyle} />
          <RTooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#121824", border: "1px solid #1E293B", borderRadius: 10 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            <LabelList dataKey="value" position="top" fill="#94A3B8" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

const QUADRANTS = [
  { x: "72%", y: "8%", label: "Leaders", t: "text-success" },
  { x: "8%", y: "8%", label: "Feature-rich / Pricey", t: "text-warning" },
  { x: "72%", y: "88%", label: "Value Players", t: "text-info" },
  { x: "8%", y: "88%", label: "Niche", t: "text-tmuted" },
];

export function PositioningChart({ dashboard }) {
  const [xKey, setXKey] = useState("price_competitiveness");
  const [yKey, setYKey] = useState("feature_strength");
  const entities = entitiesFrom(dashboard);
  const data = entities.map((e) => ({
    name: e.name, x: e.scores[xKey] ?? 0, y: e.scores[yKey] ?? 0, z: e.overall ?? 50, color: e.color, isBaseline: e.isBaseline,
  }));
  const xLabel = SCORE_KEYS.find((k) => k.key === xKey)?.label;
  const yLabel = SCORE_KEYS.find((k) => k.key === yKey)?.label;

  return (
    <Card className="p-5 animate-fade-up" data-testid="positioning-chart">
      <SectionHeader label="Strategic Map" title="Competitive Positioning"
        right={<div className="flex gap-2">
          <Select value={xKey} onChange={(e) => setXKey(e.target.value)} className="w-32" data-testid="pos-x-select">
            {SCORE_KEYS.map((k) => <option key={k.key} value={k.key}>X: {k.label}</option>)}
          </Select>
          <Select value={yKey} onChange={(e) => setYKey(e.target.value)} className="w-32" data-testid="pos-y-select">
            {SCORE_KEYS.map((k) => <option key={k.key} value={k.key}>Y: {k.label}</option>)}
          </Select>
        </div>} />
      <div className="relative">
        {QUADRANTS.map((q) => (
          <span key={q.label} className={`absolute caption ${q.t} pointer-events-none z-10`} style={{ left: q.x, top: q.y }}>{q.label}</span>
        ))}
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid stroke="#1E293B" />
            <XAxis type="number" dataKey="x" name={xLabel} domain={[0, 100]} tick={axisStyle} label={{ value: xLabel, position: "bottom", fill: "#64748B", fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name={yLabel} domain={[0, 100]} tick={axisStyle} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#64748B", fontSize: 11 }} />
            <ZAxis type="number" dataKey="z" range={[120, 520]} />
            <ReferenceLine x={50} stroke="#334155" strokeDasharray="4 4" />
            <ReferenceLine y={50} stroke="#334155" strokeDasharray="4 4" />
            <RTooltip cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ background: "#121824", border: "1px solid #1E293B", borderRadius: 10 }}
              formatter={(v, n) => [v, n]}
              labelFormatter={() => ""}
              content={({ payload }) => payload && payload[0] ? (
                <div className="card p-2.5 text-xs">
                  <div className="font-semibold mb-1" style={{ color: payload[0].payload.color }}>{payload[0].payload.name}</div>
                  <div className="text-tsecondary">{xLabel}: {payload[0].payload.x}</div>
                  <div className="text-tsecondary">{yLabel}: {payload[0].payload.y}</div>
                </div>
              ) : null} />
            <Scatter data={data}>
              {data.map((d, i) => <Cell key={i} fill={d.color} stroke={d.isBaseline ? "#fff" : "none"} strokeWidth={d.isBaseline ? 2 : 0} />)}
              <LabelList dataKey="name" position="top" fill="#94A3B8" fontSize={10} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
