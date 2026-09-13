import React, { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Modal, Input, Select, Button, Spinner } from "./ui";

const INDUSTRIES = ["SaaS", "Electric Vehicles", "Consumer Electronics", "Banking", "E-commerce", "Fintech", "Healthcare", "Other"];

export default function AnalyzeOwnModal({ open, onClose, onDone }) {
  const { patchUser } = useAuth();
  const [form, setForm] = useState({ company_name: "", industry: "SaaS", website: "", product_name: "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.company_name || !form.website) { toast.error("Company name and website are required"); return; }
    setLoading(true);
    try {
      toast.message("Analyzing your website with GPT-5.4…");
      await api.post("/our-product/analyze", form);
      patchUser({ has_real_product: true, onboarding_completed: true });
      toast.success("Your product profile is ready");
      onDone && (await onDone());
      onClose();
    } catch (err) {
      toast.error(`Could not analyze: ${formatApiErrorDetail(err.response?.data?.detail)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Analyze Your Product" maxWidth="max-w-xl" testId="analyze-own-modal">
      <p className="text-sm text-tsecondary mb-5 flex items-start gap-2">
        <Sparkles size={16} className="text-violet mt-0.5 shrink-0" />
        We'll scan your website and build your baseline profile. Every competitor is then compared against this.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Company Name *" placeholder="Your company" value={form.company_name} onChange={set("company_name")} data-testid="own-company-name" />
          <Select label="Industry" value={form.industry} onChange={set("industry")} data-testid="own-industry">
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </Select>
        </div>
        <Input label="Website *" placeholder="https://yourproduct.com" value={form.website} onChange={set("website")} data-testid="own-website" />
        <Input label="Product Name" placeholder="This name becomes your baseline label" value={form.product_name} onChange={set("product_name")} data-testid="own-product-name" />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading} data-testid="submit-own-btn">
            {loading ? <><Spinner className="w-4 h-4" /> Analyzing…</> : "Analyze My Site"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
