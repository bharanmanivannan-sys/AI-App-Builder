import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Play, RefreshCw, Trash2, Eye, Globe, Users } from "lucide-react";
import { useData } from "../context/DataContext";
import api, { formatApiErrorDetail } from "../lib/api";
import { Button, Badge, Card, Spinner, EmptyState, Modal, SectionHeader } from "../components/ui";
import AddCompetitorModal from "../components/AddCompetitorModal";
import { scoreColor } from "../lib/utils";

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
  if (!comp) return null;
  const a = comp.analysis || {};
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
