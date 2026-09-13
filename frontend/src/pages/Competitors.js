import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Play, RefreshCw, Trash2, Eye, Globe, Users, TrendingUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip } from "recharts";
import { useData } from "../context/DataContext";
import api, { formatApiErrorDetail } from "../lib/api";
import { Button, Badge, Card, Spinner, EmptyState, Modal, SectionHeader } from "../components/ui";
import AddCompetitorModal from "../components/AddCompetitorModal";
import { scoreColor, SCORE_KEYS } from "../lib/utils";

const statusTone = { analyzed: "success", pending: "warning", analyzing: "info", error: "danger" };

export default function Competitors() {
  const { competitors, loadAll } = useData();
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState({});
  const [view, setView] = useState(null);

  const run = async (id, fn, name, verb) => {
    setBusy((b) => ({ ...b, [id]: verb }));
    try { await fn(); await loadAll(); toast.success(`${name} ${verb === "delete" ? "deleted" : "analyzed"}`); }
    catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
    finally { setBusy((b) => ({ ...b, [id]: null })); }
  };

  const analyze = (c) => run(c.id, () => api.post(`/competitors/${c.id}/analyze`), c.company_name, "analyze");
  const del = (c) => run(c.id, () => api.delete(`/competitors/${c.id}`), c.company_name, "delete");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="caption mb-1">Manage</div>
          <h1 className="text-2xl sm:text-3xl font-bold">Competitors <span className="text-tmuted font-normal text-lg">({competitors.length})</span></h1>
        </div>
        <Button onClick={() => setAddOpen(true)} data-testid="add-competitor-btn"><Plus size={16} /> Add Competitor</Button>
      </div>

      {competitors.length === 0 ? (
        <Card className="p-6"><EmptyState icon={Users} title="No competitors yet" subtitle="Add a competitor and let GPT-5.4 analyze their website."
          action={<Button onClick={() => setAddOpen(true)}><Plus size={16} /> Add Competitor</Button>} /></Card>
      ) : (
        <Card className="overflow-hidden" data-testid="competitors-table">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2/40 text-left">
                  {["Competitor", "Industry", "Website", "Overall", "Status", "Last Analyzed", "Actions"].map((h) => (
                    <th key={h} className="py-3 px-4 caption font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr key={c.id} className="border-b border-line/60 hover:bg-surfaceHover transition-colors" data-testid={`competitor-row-${c.company_name}`}>
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-2">{c.company_name}{c.is_demo && <Badge tone="violet">Demo</Badge>}</div>
                      {c.product_name && <div className="text-xs text-tmuted">{c.product_name}</div>}
                    </td>
                    <td className="py-3 px-4 text-tsecondary">{c.industry}</td>
                    <td className="py-3 px-4"><a href={c.website} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1 text-xs"><Globe size={12} /> {c.website.replace(/^https?:\/\//, "").slice(0, 22)}</a></td>
                    <td className="py-3 px-4 font-mono font-semibold" style={{ color: scoreColor(c.analysis?.overall) }}>{c.analysis?.overall ?? "—"}</td>
                    <td className="py-3 px-4"><Badge tone={statusTone[c.status]}>{busy[c.id] === "analyze" ? "Analyzing…" : c.status}</Badge></td>
                    <td className="py-3 px-4 text-tsecondary text-xs">{c.last_analyzed || "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {c.status === "analyzed" && <IconBtn title="View" onClick={() => setView(c)} icon={Eye} testId={`view-${c.company_name}`} />}
                        <IconBtn title={c.status === "analyzed" ? "Refresh" : "Analyze"} onClick={() => analyze(c)} icon={c.status === "analyzed" ? RefreshCw : Play}
                          loading={busy[c.id] === "analyze"} testId={`analyze-${c.company_name}`} />
                        <IconBtn title="Delete" onClick={() => del(c)} icon={Trash2} danger loading={busy[c.id] === "delete"} testId={`delete-${c.company_name}`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AddCompetitorModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={loadAll} />
      <ViewModal comp={view} onClose={() => setView(null)} />
    </div>
  );
}

function IconBtn({ icon: Icon, title, onClick, danger, loading, testId }) {
  return (
    <button onClick={onClick} title={title} disabled={loading} data-testid={testId}
      className={`p-2 rounded-lg transition-colors ${danger ? "text-tmuted hover:text-danger hover:bg-danger/10" : "text-tmuted hover:text-accent hover:bg-surfaceHover"}`}>
      {loading ? <Spinner className="w-4 h-4" /> : <Icon size={16} />}
    </button>
  );
}

function ViewModal({ comp, onClose }) {
  const [history, setHistory] = useState(null);
  const [metric, setMetric] = useState("overall");
  useEffect(() => {
    if (comp) {
      setHistory(null);
      api.get(`/competitors/${comp.id}/history`).then((r) => setHistory(r.data)).catch(() => setHistory([]));
    }
  }, [comp]);
  if (!comp) return null;
  const a = comp.analysis || {};
  const metricOpts = [{ key: "overall", label: "Overall" }, ...SCORE_KEYS.map((k) => ({ key: k.key, label: k.label }))];
  const chartData = (history || []).map((h) => ({
    date: h.date?.slice(5), value: metric === "overall" ? h.overall : h.scores?.[metric] ?? 0,
  }));
  const first = history && history.length ? (metric === "overall" ? history[0].overall : history[0].scores?.[metric]) : null;
  const last = history && history.length ? (metric === "overall" ? history[history.length - 1].overall : history[history.length - 1].scores?.[metric]) : null;
  const trend = first != null && last != null ? last - first : null;

  return (
    <Modal open={!!comp} onClose={onClose} title={comp.company_name} maxWidth="max-w-2xl" testId="view-competitor-modal">
      <div className="space-y-5 text-sm">
        <p className="text-tsecondary">{a.description}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Info label="Target Customers" value={a.target_customers} />
          <Info label="Starting Price" value={a.pricing?.starting_price} mono />
        </div>
        <div>
          <div className="caption mb-2">Value Propositions</div>
          <ul className="space-y-1">{(a.value_propositions || []).map((v, i) => <li key={i} className="text-tsecondary flex gap-2"><span className="text-accent">•</span>{v}</li>)}</ul>
        </div>
        <div>
          <div className="caption mb-2">Features</div>
          <div className="flex flex-wrap gap-2">{(a.features || []).map((f, i) => <Badge key={i} tone="default">{f.name}</Badge>)}</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(a.scores || {}).map(([k, v]) => (
            <div key={k} className="p-3 rounded-lg bg-surface-2/60 border border-line">
              <div className="caption">{k.replace(/_/g, " ")}</div>
              <div className="text-lg font-mono font-bold" style={{ color: scoreColor(v) }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Analysis history timeline */}
        <div className="pt-4 border-t border-line" data-testid="analysis-history">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-accent" />
              <span className="caption">Analysis History</span>
              {trend != null && (
                <Badge tone={trend >= 0 ? "success" : "danger"}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend)} pts</Badge>
              )}
            </div>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}
              className="bg-surface-2 border border-line rounded-md text-xs px-2 py-1 text-tsecondary focus:outline-none focus:border-brand"
              data-testid="history-metric-select">
              {metricOpts.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
          {history === null ? (
            <div className="flex justify-center py-8"><Spinner className="w-5 h-5 text-brand" /></div>
          ) : history.length === 0 ? (
            <p className="text-xs text-tmuted py-4">No past scans yet. Re-analyze this competitor over time to build a trend.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                  <RTooltip contentStyle={{ background: "#121824", border: "1px solid #1E293B", borderRadius: 10 }} />
                  <Line type="monotone" dataKey="value" stroke="#60A5FA" strokeWidth={2} dot={{ r: 3, fill: "#60A5FA" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
                {[...history].reverse().map((h, i, arr) => {
                  const prev = arr[i + 1];
                  const cur = metric === "overall" ? h.overall : h.scores?.[metric];
                  const pv = prev ? (metric === "overall" ? prev.overall : prev.scores?.[metric]) : null;
                  const delta = pv != null ? cur - pv : null;
                  return (
                    <div key={h.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-surface-2/40" data-testid={`history-row-${i}`}>
                      <span className="text-tsecondary font-mono">{h.date}</span>
                      <div className="flex items-center gap-3">
                        <Badge tone="default">{h.confidence}</Badge>
                        <span className="font-mono font-semibold" style={{ color: scoreColor(cur) }}>{cur}</span>
                        {delta != null && delta !== 0 && (
                          <span className={`font-mono ${delta > 0 ? "text-success" : "text-danger"}`}>{delta > 0 ? "+" : ""}{delta}</span>
                        )}
                        {(delta === 0 || delta == null) && <span className="text-tmuted font-mono w-6 text-right">—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-tmuted pt-2 border-t border-line">
          <span>Source: <a href={a.source_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">{a.source_url}</a></span>
          <span>•</span><span>Confidence: {a.confidence}</span><span>•</span><span>Collected: {comp.last_analyzed}</span>
        </div>
      </div>
    </Modal>
  );
}

function Info({ label, value, mono }) {
  return (
    <div className="p-3 rounded-lg bg-surface-2/60 border border-line">
      <div className="caption mb-1">{label}</div>
      <div className={`${mono ? "font-mono" : ""} ${!value || /not publicly/i.test(value || "") ? "text-tmuted italic" : "text-tprimary"}`}>{value || "Not publicly available"}</div>
    </div>
  );
}
