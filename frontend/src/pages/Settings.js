import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Save, Database, Trash2, Info } from "lucide-react";
import { useData } from "../context/DataContext";
import api, { formatApiErrorDetail } from "../lib/api";
import { Card, Button, Input, Select, Spinner, Badge, SectionHeader } from "../components/ui";
import AnalyzeOwnModal from "../components/AnalyzeOwnModal";

const INDUSTRIES = ["SaaS", "Electric Vehicles", "Consumer Electronics", "Banking", "E-commerce", "Fintech", "Healthcare", "Other"];

export default function Settings() {
  const { loadAll, dashboard } = useData();
  const [op, setOp] = useState(null);
  const [company, setCompany] = useState({});
  const [product, setProduct] = useState({});
  const [saving, setSaving] = useState(false);
  const [ownOpen, setOwnOpen] = useState(false);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    const { data } = await api.get("/our-product");
    setOp(data);
    setCompany(data.company || {});
    setProduct(data.product || {});
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try { await api.put("/our-product", { company, product }); toast.success("Product profile saved"); await load(); await loadAll(); }
    catch (err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const demo = async (action) => {
    setBusy(action);
    try {
      if (action === "load") { await api.post("/demo/load"); toast.success("Demo data loaded"); }
      else { await api.delete("/demo/clear"); toast.success("Demo data cleared"); }
      await loadAll();
    } catch (e) { toast.error("Action failed"); }
    finally { setBusy(null); }
  };

  if (!op) return <div className="flex items-center justify-center h-[70vh]"><Spinner className="w-8 h-8 text-brand" /></div>;

  const setC = (k) => (e) => setCompany((c) => ({ ...c, [k]: e.target.value }));
  const setP = (k) => (e) => setProduct((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="caption mb-1">Configuration</div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        </div>
        <Button variant="secondary" onClick={() => setOwnOpen(true)} data-testid="reanalyze-btn"><Sparkles size={16} /> Analyze / Re-analyze My Site</Button>
      </div>

      <Card className="p-6" data-testid="our-product-settings">
        <SectionHeader label="Baseline" title="Our Product"
          right={op.is_demo ? <Badge tone="violet">Demo Baseline</Badge> : <Badge tone="success">Live Profile</Badge>} />
        <p className="text-sm text-tsecondary mb-5">This profile is the baseline every competitor is measured against. The <b>Product Name</b> becomes your label across the dashboard.</p>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Company Name" value={company.name || ""} onChange={setC("name")} data-testid="set-company-name" />
            <Select label="Industry" value={company.industry || "SaaS"} onChange={setC("industry")}>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
          </div>
          <Input label="Website" value={company.website || ""} onChange={setC("website")} data-testid="set-website" />
          <Input label="Company Description" value={company.description || ""} onChange={setC("description")} />
          <div className="h-px bg-line my-2" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Product Name" value={product.name || ""} onChange={setP("name")} data-testid="set-product-name" />
            <Input label="Product URL" value={product.url || ""} onChange={setP("url")} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Category" value={product.category || ""} onChange={setP("category")} />
            <Input label="Target Customers" value={product.target_customers || ""} onChange={setP("target_customers")} />
          </div>
          <Input label="Value Proposition" value={product.value_proposition || ""} onChange={setP("value_proposition")} />
          <Input label="Differentiators" value={product.differentiators || ""} onChange={setP("differentiators")} />
          <Input label="Use Cases" value={product.use_cases || ""} onChange={setP("use_cases")} />
          <Input label="Competitive Goals" value={product.competitive_goals || ""} onChange={setP("competitive_goals")} />
        </div>
        <div className="flex justify-end mt-5">
          <Button onClick={save} disabled={saving} data-testid="save-product-btn">{saving ? <Spinner className="w-4 h-4" /> : <Save size={16} />} Save Profile</Button>
        </div>
      </Card>

      <Card className="p-6" data-testid="demo-controls">
        <SectionHeader label="Sample dataset" title="Demo Data" />
        <p className="text-sm text-tsecondary mb-4">Demo competitors (EV / SaaS / Consumer Electronics) are clearly labeled and auto-hidden once you add your own real product or competitors. You can re-load or clear them anytime.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => demo("load")} disabled={busy}>{busy === "load" ? <Spinner className="w-4 h-4" /> : <Database size={16} />} Load Demo Data</Button>
          <Button variant="danger" onClick={() => demo("clear")} disabled={busy}>{busy === "clear" ? <Spinner className="w-4 h-4" /> : <Trash2 size={16} />} Clear Demo Data</Button>
        </div>
      </Card>

      <Card className="p-6">
        <SectionHeader label="Transparency" title="Scoring Methodology" />
        <div className="flex items-start gap-2 text-sm text-tsecondary leading-relaxed">
          <Info size={16} className="text-accent mt-0.5 shrink-0" />
          <div>
            All scores are <b>AI-derived (GPT-5.4)</b> estimates from public website data, on a 0–100 scale — directional guidance, not objective facts.
            <div className="mt-2 font-mono text-xs text-tprimary bg-surface-2/60 border border-line rounded-lg p-3">
              Overall = Price×20% + Features×25% + Value×20% + Market×20% + Innovation×15%
            </div>
            Every data point carries a source URL, collection date and confidence level. Unavailable data shows as “Not publicly available” — never fabricated.
          </div>
        </div>
      </Card>

      <AnalyzeOwnModal open={ownOpen} onClose={() => setOwnOpen(false)} onDone={async () => { await load(); await loadAll(); }} />
    </div>
  );
}
