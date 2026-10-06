"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PortfolioImage from "@/components/PortfolioImage";
import { api } from "@/lib/api";
import { priceRange } from "@/lib/format";
import { usePortfolio } from "@/lib/portfolio";
import { SERVICES_KEY, useServices } from "@/lib/services";
import ServiceEditor from "./ServiceEditor";
import { IconButton, errorText } from "./ui";

export default function ServicesManager() {
  const queryClient = useQueryClient();
  const { services, loading } = useServices();
  const { categories, gallery, heroOf, coverFor } = usePortfolio();
  const [editing, setEditing] = useState(null); // null, "new", or a service id

  const refresh = () => queryClient.invalidateQueries({ queryKey: SERVICES_KEY });

  const mutate = async (next, request, success) => {
    const previous = queryClient.getQueryData(SERVICES_KEY);
    if (next) queryClient.setQueryData(SERVICES_KEY, next);
    try {
      await request();
      if (success) toast.success(success);
    } catch (error) {
      queryClient.setQueryData(SERVICES_KEY, previous);
      toast.error(errorText(error));
    }
  };

  const toggleVisible = (service) =>
    mutate(
      services.map((s) => (s.id === service.id ? { ...s, visible: !s.visible } : s)),
      () => api.patch(`/services/${service.id}`, { visible: !service.visible }),
      service.visible ? `“${service.name}” hidden from the site` : `“${service.name}” is live`,
    );

  const move = (index, dir) => {
    const next = [...services];
    next.splice(index + dir, 0, next.splice(index, 1)[0]);
    mutate(next, () => api.put("/services/order", { ids: next.map((s) => s.id) }));
  };

  const remove = (service) => {
    if (!window.confirm(`Delete “${service.name}”? Past bookings keep the service name, but it will be removed from the site.`)) return;
    mutate(services.filter((s) => s.id !== service.id), () => api.delete(`/services/${service.id}`), "Service deleted");
  };

  const liveCount = services.filter((s) => s.visible).length;
  const editingService = editing && editing !== "new" ? services.find((s) => s.id === editing) : null;

  return (
    <div data-testid="services-manager">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Your services <span className="text-muted">({services.length})</span></h2>
          <p className="mt-1 text-sm text-muted">
            {liveCount} live on the site · order here is the order on the home page, Services page and booking form.
          </p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className="btn-primary !py-2.5" data-testid="add-service">
          <Plus size={16} /> Add service
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-surface" />)}
        {!loading && services.length === 0 && (
          <div className="card p-12 text-center">
            <p className="font-display text-xl font-bold">No services yet</p>
            <p className="mt-1 text-sm text-muted">Add your first package — it shows up on the site straight away.</p>
          </div>
        )}
        {services.map((s, index) => {
          const category = categories.find((c) => c.id === s.category_id);
          return (
            <div
              key={s.id}
              data-testid={`service-row-${s.slug}`}
              className={`card flex items-center gap-4 p-3 pr-4 transition-opacity ${s.visible ? "" : "opacity-60"}`}
            >
              <div className="flex flex-col gap-1">
                <IconButton label="Move up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={14} /></IconButton>
                <IconButton label="Move down" disabled={index === services.length - 1} onClick={() => move(index, 1)}><ArrowDown size={14} /></IconButton>
              </div>
              <div className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-surface-2">
                <PortfolioImage photo={coverFor(s)} width={300} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-display text-lg font-bold">{s.name}</h3>
                  {!s.visible && <span className="rounded-full bg-butter/20 px-2 py-0.5 text-[11px] font-semibold text-butter">Hidden</span>}
                </div>
                <p className="mt-1 text-sm font-semibold text-butter">{priceRange(s)}</p>
                <p className="mt-1 truncate text-xs text-muted">
                  {[s.duration, s.photos, s.people].filter(Boolean).join(" · ") || "No details yet"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Image: {s.image_photo_id && coverFor(s) ? <span className="text-ink/80">picked from gallery</span> : category ? <span className="text-ink/80">hero of {category.name}</span> : <span className="text-sun">none — pick a photo</span>}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                <IconButton label={s.visible ? "Hide from site" : "Show on site"} onClick={() => toggleVisible(s)} testid={`service-toggle-${s.slug}`}>
                  {s.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </IconButton>
                <IconButton label="Edit service" onClick={() => setEditing(s.id)} testid={`service-edit-${s.slug}`}><Pencil size={14} /></IconButton>
                <IconButton label="Delete service" danger onClick={() => remove(s)} testid={`service-delete-${s.slug}`}><Trash2 size={14} /></IconButton>
              </div>
            </div>
          );
        })}
      </div>

      {(editing === "new" || editingService) && (
        <ServiceEditor
          key={editing}
          service={editingService}
          categories={categories}
          heroOf={heroOf}
          gallery={gallery}
          onClose={() => setEditing(null)}
          onSaved={() => { refresh(); setEditing(null); }}
        />
      )}
    </div>
  );
}
