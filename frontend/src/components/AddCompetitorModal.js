import React, { useState } from "react";
import { toast } from "sonner";
import api, { formatApiErrorDetail } from "../lib/api";
import { Modal, Input, Select, Button, Spinner } from "./ui";

const INDUSTRIES = ["SaaS", "Electric Vehicles", "Consumer Electronics", "Banking", "E-commerce", "Fintech", "Healthcare", "Other"];

export default function AddCompetitorModal({ open, onClose, onAdded, autoAnalyze = true }) {
  const [form, setForm] = useState({ company_name: "", industry: "SaaS", website: "", product_name: "", product_category: "", target_market: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.company_name || !form.website) { toast.error("Company name and website are required"); return; }
    setSaving(true);
    try {
      const { data } = await api.post("/competitors", form);
      toast.success(`${data.company_name} added`);
      if (autoAnalyze) {
        toast.message("Analyzing website with GPT-5.4…");
        try {
          await api.post(`/competitors/${data.id}/analyze`);
          toast.success(`${data.company_name} analyzed`);
        } catch (err) {
          toast.error(`Analysis failed: ${formatApiErrorDetail(err.response?.data?.detail)}`);
        }
      }
      setForm({ company_name: "", industry: "SaaS", website: "", product_name: "", product_category: "", target_market: "", notes: "" });
      onAdded && (await onAdded());
      onClose();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Competitor" maxWidth="max-w-xl" testId="add-competitor-modal">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Company Name *" placeholder="Ather Energy" value={form.company_name} onChange={set("company_name")} data-testid="input-company-name" />
          <Select label="Industry" value={form.industry} onChange={set("industry")} data-testid="select-industry">
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </Select>
        </div>
        <Input label="Website *" placeholder="https://www.atherenergy.com" value={form.website} onChange={set("website")} data-testid="input-website" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Product Name" placeholder="Optional" value={form.product_name} onChange={set("product_name")} data-testid="input-product-name" />
          <Input label="Product Category" placeholder="Optional" value={form.product_category} onChange={set("product_category")} />
        </div>
        <Input label="Target Market" placeholder="Optional" value={form.target_market} onChange={set("target_market")} />
        <Input label="Notes" placeholder="Optional" value={form.notes} onChange={set("notes")} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving} data-testid="submit-competitor-btn">
            {saving ? <><Spinner className="w-4 h-4" /> Working…</> : autoAnalyze ? "Add & Analyze" : "Add"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
