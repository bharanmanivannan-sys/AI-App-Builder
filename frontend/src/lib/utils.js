export const SCORE_KEYS = [
  { key: "price_competitiveness", label: "Price", short: "Price" },
  { key: "feature_strength", label: "Features", short: "Features" },
  { key: "value_proposition", label: "Value", short: "Value" },
  { key: "market_position", label: "Market", short: "Market" },
  { key: "innovation", label: "Innovation", short: "Innovation" },
];

export const COLORS = ["#3B82F6", "#8B5CF6", "#06B6D4", "#F59E0B", "#10B981", "#EF4444", "#0EA5E9", "#EC4899"];

export function scoreColor(v) {
  if (v == null) return "#64748B";
  if (v >= 80) return "#10B981";
  if (v >= 65) return "#3B82F6";
  if (v >= 50) return "#F59E0B";
  return "#EF4444";
}

export function positionLabel(score) {
  if (score >= 78) return "Strong";
  if (score >= 60) return "Moderate";
  return "Weak";
}

// Build a normalized feature union across baseline + competitors
export function buildFeatureMatrix(baseline, competitors) {
  const entities = [];
  if (baseline) entities.push({ name: baseline.label, features: baseline.features || [] });
  competitors.forEach((c) => {
    const a = c.analysis || c;
    entities.push({ name: c.company_name, features: a.features || [] });
  });
  const featureMap = {};
  entities.forEach((e, idx) => {
    (e.features || []).forEach((f) => {
      const name = f.name;
      if (!featureMap[name]) featureMap[name] = { name, category: f.category || "Core", presence: {} };
      featureMap[name].presence[idx] = f.available ? "yes" : "no";
    });
  });
  const rows = Object.values(featureMap).map((row) => ({
    ...row,
    cells: entities.map((_, idx) => row.presence[idx] || "unknown"),
  }));
  const categories = Array.from(new Set(rows.map((r) => r.category)));
  return { entities: entities.map((e) => e.name), rows, categories };
}

export function priceNumber(pricing) {
  if (!pricing) return null;
  const s = pricing.starting_price;
  if (!s || /not publicly/i.test(s)) return null;
  const m = String(s).replace(/[, ]/g, "").match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

export function fmtStatus(s) {
  return { not_started: "Not Started", in_progress: "In Progress", completed: "Completed" }[s] || s;
}
