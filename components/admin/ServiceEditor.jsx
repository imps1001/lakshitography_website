"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Eye, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import PortfolioImage from "@/components/PortfolioImage";
import { api } from "@/lib/api";
import { priceRange, shortPrice } from "@/lib/format";
import { Modal, errorText } from "./ui";

const BLANK = {
  name: "", tag: "", blurb: "", price_min: "", price_max: "",
  duration: "", photos: "", people: "", add_on: "", category_id: null, visible: true,
};

export default function ServiceEditor({ service, categories, heroOf, onClose, onSaved }) {
  const [form, setForm] = useState(() => (service ? {
    ...BLANK,
    ...Object.fromEntries(Object.keys(BLANK).map((k) => [k, service[k] ?? BLANK[k]])),
    price_min: String(service.price_min ?? ""),
    price_max: service.price_max == null ? "" : String(service.price_max),
  } : BLANK));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toNumber = (value) => (value.trim() === "" ? null : Math.round(Number(value)));
  const preview = { ...form, price_min: toNumber(form.price_min), price_max: toNumber(form.price_max) };
  const category = categories.find((c) => c.id === form.category_id);

  const save = async (e) => {
    e.preventDefault();
    if (preview.price_min == null || Number.isNaN(preview.price_min)) {
      toast.error("Add a starting price.");
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, price_min: preview.price_min, price_max: preview.price_max };
      if (service) await api.patch(`/services/${service.id}`, body);
      else await api.post("/services", body);
      toast.success(service ? "Service updated" : "Service added");
      onSaved();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} busy={saving} labelledBy="service-editor-title" className="max-w-5xl">
      <form onSubmit={save} className="grid md:grid-cols-[1.4fr_1fr]" data-testid="service-editor">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="service-editor-title" className="font-display text-2xl font-bold">{service ? "Edit service" : "New service"}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-muted hover:text-ink md:hidden">
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-1">
            <Field label="Service name" required>
              <input required maxLength={60} value={form.name} onChange={set("name")} placeholder="e.g. Maternity Shoot" className="input !py-2.5" data-testid="service-name" />
            </Field>
          </div>

          <Field label="Description" className="mt-4" hint={`${form.blurb.length}/300`}>
            <textarea rows={3} maxLength={300} value={form.blurb} onChange={set("blurb")} placeholder="What the session feels like, in a sentence or two." className="input resize-none !py-2.5" data-testid="service-blurb" />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Starting price (₹)" required>
              <input required type="number" min={1} step={1} inputMode="numeric" value={form.price_min} onChange={set("price_min")} placeholder="6500" className="input !py-2.5" data-testid="service-price-min" />
            </Field>
            <Field label="Up to (₹)" hint="Leave empty for a single price">
              <input type="number" min={1} step={1} inputMode="numeric" value={form.price_max} onChange={set("price_max")} placeholder="9500" className="input !py-2.5" data-testid="service-price-max" />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Duration"><input maxLength={60} value={form.duration} onChange={set("duration")} placeholder="60–90 mins" className="input !py-2.5" /></Field>
            <Field label="Delivery"><input maxLength={60} value={form.photos} onChange={set("photos")} placeholder="20–30 edited photos" className="input !py-2.5" /></Field>
            <Field label="Group size"><input maxLength={60} value={form.people} onChange={set("people")} placeholder="Just the two of you" className="input !py-2.5" /></Field>
            <Field label="Add-on"><input maxLength={80} value={form.add_on} onChange={set("add_on")} placeholder="Optional 30-sec reel" className="input !py-2.5" /></Field>
          </div>

          <Field label="Card image" className="mt-4" hint="The card uses this category's hero image — change the hero in the Portfolio tab">
            <select
              value={form.category_id || ""}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value || null }))}
              className="input !py-2.5"
              data-testid="service-category"
            >
              <option value="">No image</option>
              {categories.map((c) => <option key={c.id} value={c.id}>Hero of “{c.name}”</option>)}
            </select>
          </Field>

          <button
            type="button"
            role="switch"
            aria-checked={form.visible}
            onClick={() => setForm((f) => ({ ...f, visible: !f.visible }))}
            className={`mt-4 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${form.visible ? "border-mint/40 bg-mint/10" : "border-line"}`}
            data-testid="service-visible"
          >
            <Eye size={16} className={form.visible ? "text-mint" : "text-muted"} />
            <span className="flex-1">
              <span className="block text-sm font-semibold">Show on website</span>
              <span className="block text-xs text-muted">Hidden services stay here but disappear from the site and booking form.</span>
            </span>
            <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${form.visible ? "bg-mint" : "bg-ink/15"}`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-bg transition-all ${form.visible ? "left-5" : "left-1"}`} />
            </span>
          </button>

          <div className="mt-6 flex justify-end gap-2 border-t border-line pt-5">
            <button type="button" onClick={onClose} disabled={saving} className="btn-ghost !py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary !py-2.5 disabled:opacity-60" data-testid="service-save">
              {saving && <Loader2 size={16} className="animate-spin" />} {saving ? "Saving…" : service ? "Save changes" : "Add service"}
            </button>
          </div>
        </div>

        {/* Live preview of the home page card */}
        <div className="hidden flex-col bg-surface-2 p-6 md:flex">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Live preview</p>
            <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-muted hover:text-ink">
              <X size={18} />
            </button>
          </div>
          <div className="relative mx-auto mt-4 aspect-[2/3] w-full max-w-[16rem] overflow-hidden rounded-[1.75rem] bg-surface">
            <PortfolioImage photo={category ? heroOf(category) : null} width={600} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/20" />
            <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-1.5">
              <span className="rounded-full bg-bg/60 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md">{form.name || "Service"}</span>
              {preview.price_min != null && !Number.isNaN(preview.price_min) && (
                <span className="rounded-full bg-butter px-2.5 py-1 text-[11px] font-bold text-bg">from {shortPrice(preview.price_min)}</span>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3 className="font-display text-xl font-bold leading-tight text-white">{form.name || "Service name"}</h3>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/70">{form.blurb || "Your description appears here."}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-butter">Explore <ArrowRight size={14} /></span>
            </div>
          </div>
          {preview.price_min != null && !Number.isNaN(preview.price_min) && (
            <p className="mt-4 text-center text-sm text-muted">Services page price: <span className="font-semibold text-ink">{priceRange(preview)}</span></p>
          )}
          {!form.visible && <p className="mt-2 text-center text-xs text-butter">Hidden — not shown on the site</p>}
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, required, hint, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium">
        <span>{label}{required && <span className="ml-1 text-sun">*</span>}</span>
        {hint && <span className="text-right text-[11px] font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
