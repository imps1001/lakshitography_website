"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, Inbox, Check, Clock, Trash2, Phone, Mail, MapPin, Calendar, Users, RefreshCw, Images, BriefcaseBusiness } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiErrorDetail } from "@/lib/api";
import PortfolioManager from "@/components/admin/PortfolioManager";
import { formatPhone } from "@/lib/validation/booking";
import ServicesManager from "@/components/admin/ServicesManager";
import { SERVICES_KEY, useServices } from "@/lib/services";
import { PORTFOLIO_KEY } from "@/lib/portfolio";

const STATUS_OPTIONS = [
  { value: "new",       label: "New",        color: "bg-sun text-bg" },
  { value: "contacted", label: "Contacted",  color: "bg-lilac text-bg" },
  { value: "confirmed", label: "Confirmed",  color: "bg-butter text-bg" },
  { value: "completed", label: "Completed",  color: "bg-mint text-bg" },
  { value: "cancelled", label: "Cancelled",  color: "bg-[#3a1f1f] text-[#f0a0a0]" },
];


export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { bySlug } = useServices();
  // Bookings store the service name at the time of booking; older ones only have the slug.
  const serviceName = (booking) => booking.service_name || bySlug(booking.service)?.name || booking.service;
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, confirmed: 0, completed: 0 });
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("bookings");

  // Keep the active tab in the URL hash so a refresh stays on Portfolio.
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (fromHash === "portfolio" || fromHash === "services") setTab(fromHash);
  }, []);
  const switchTab = (next) => {
    setTab(next);
    window.history.replaceState(null, "", next === "bookings" ? window.location.pathname : `#${next}`);
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.replace("/admin/login");
  }, [user, loading, router]);

  const load = async () => {
    setRefreshing(true);
    try {
      const [bRes, sRes] = await Promise.all([api.get("/bookings"), api.get("/admin/stats")]);
      setBookings(bRes.data);
      setStats(sRes.data);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed to load");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}`, { status });
      toast.success(`Marked as ${status}`);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  const removeBooking = async (id) => {
    if (!window.confirm("Delete this booking permanently?")) return;
    try {
      await api.delete(`/bookings/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    }
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  if (loading || !user) {
    return <div className="min-h-screen bg-bg flex items-center justify-center text-muted">Loading…</div>;
  }

  return (
    <div data-testid="page-admin-dashboard" className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="border-b border-white/5 bg-bg/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display font-bold text-2xl text-ink">Lakshit<span className="italic text-sun">ography</span></Link>
            <span className="hidden sm:inline text-xs tracking-[0.2em] uppercase text-muted border-l border-white/10 pl-4">Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { load(); queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEY }); queryClient.invalidateQueries({ queryKey: SERVICES_KEY }); }} data-testid="refresh-btn" className="text-muted hover:text-sun transition-colors" aria-label="Refresh">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
            <span className="hidden sm:block text-sm text-muted">{user.email}</span>
            <button onClick={() => { logout(); router.push("/admin/login"); }} data-testid="logout-btn" className="btn-ghost py-2 px-4 text-xs">
              <LogOut size={14}/> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div>
          <p className="eyebrow mb-4">Dashboard</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-ink">Welcome back.</h1>
          <p className="mt-3 text-muted">
            {{
              bookings: "Every booking that comes through the site lands here.",
              portfolio: "Every photo on the site lives here — upload, place, reorder and remove.",
              services: "Your packages and prices — edit them here and the site updates instantly.",
            }[tab]}
          </p>
        </div>

        <div role="tablist" className="mt-8 inline-flex max-w-full overflow-x-auto rounded-full border border-line bg-surface p-1">
          {[
            { value: "bookings", label: "Bookings", icon: Inbox },
            { value: "portfolio", label: "Portfolio", icon: Images },
            { value: "services", label: "Services", icon: BriefcaseBusiness },
          ].map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              data-testid={`tab-${t.value}`}
              onClick={() => switchTab(t.value)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                tab === t.value ? "bg-ink text-bg" : "text-muted hover:text-ink"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "portfolio" ? (
          <div className="mt-10"><PortfolioManager /></div>
        ) : tab === "services" ? (
          <div className="mt-10"><ServicesManager /></div>
        ) : (
        <>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Total"     value={stats.total}     icon={Inbox} />
          <Stat label="New"       value={stats.new}       icon={Clock} accent />
          <Stat label="Confirmed" value={stats.confirmed} icon={Check} />
          <Stat label="Completed" value={stats.completed} icon={Check} />
        </div>

        {/* Filters */}
        <div className="mt-12 flex flex-wrap gap-3" data-testid="status-filters">
          {["all", ...STATUS_OPTIONS.map((s) => s.value)].map((s) => (
            <button
              key={s}
              data-testid={`filter-status-${s}`}
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-2 text-xs tracking-[0.2em] uppercase border transition-all ${
                filter === s ? "bg-sun border-sun text-bg" : "border-white/10 text-muted hover:border-sun hover:text-sun"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        <div className="mt-8 space-y-4">
          {filtered.length === 0 && (
            <div data-testid="bookings-empty" className="card p-16 text-center">
              <Inbox size={32} className="mx-auto text-sun/60" />
              <p className="mt-5 font-display font-bold text-2xl text-ink">Nothing here yet.</p>
              <p className="mt-2 text-muted text-sm">New booking requests will appear in real time.</p>
            </div>
          )}

          {filtered.map((b, idx) => {
            const opt = STATUS_OPTIONS.find((o) => o.value === b.status);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                data-testid={`booking-card-${b.id}`}
                className="card p-6 lg:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display font-bold text-2xl text-ink">{b.name}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase ${opt?.color || "bg-white/10 text-white"}`}>{b.status}</span>
                    </div>
                    <p className="mt-1 font-serif italic text-sun text-lg">{serviceName(b)}</p>
                  </div>
                  <p className="text-xs tracking-wider uppercase text-muted">
                    {new Date(b.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <Info icon={Mail}    label="Email"    value={b.email} />
                  <Info icon={Phone}   label="Phone"    value={formatPhone(b.phone)} />
                  <Info icon={Calendar} label="Date"    value={b.preferred_date || "Flexible"} />
                  <Info icon={Users}   label="People"   value={b.people_count || "—"} />
                </div>

                {b.location && <Info icon={MapPin} label="Location" value={b.location} className="mt-4" />}
                {b.message && (
                  <div className="mt-5 border-l-2 border-sun/40 pl-4">
                    <p className="text-xs tracking-[0.2em] uppercase text-muted">Note</p>
                    <p className="text-ink text-sm leading-relaxed mt-1">{b.message}</p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-2 pt-5 border-t border-line">
                  <span className="text-xs tracking-[0.2em] uppercase text-muted mr-2">Mark as</span>
                  {STATUS_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      data-testid={`set-status-${o.value}-${b.id}`}
                      onClick={() => updateStatus(b.id, o.value)}
                      disabled={b.status === o.value}
                      className={`rounded-full px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase border transition-all ${
                        b.status === o.value
                          ? "border-sun text-sun opacity-50 cursor-not-allowed"
                          : "border-white/10 text-muted hover:border-sun hover:text-sun"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                  <button
                    data-testid={`delete-${b.id}`}
                    onClick={() => removeBooking(b.id)}
                    className="ml-auto text-muted hover:text-red-400 transition-colors p-2"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
        </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent }) {
  return (
    <div data-testid={`stat-${label.toLowerCase()}`} className={`rounded-3xl border ${accent ? "border-sun/40" : "border-line"} bg-surface p-6`}>
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-[0.2em] uppercase text-muted">{label}</p>
        <Icon size={16} className={accent ? "text-sun" : "text-muted"} />
      </div>
      <p className="mt-4 font-display font-bold text-4xl text-ink">{value}</p>
    </div>
  );
}

function Info({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <Icon size={14} className="text-sun mt-1 shrink-0" />
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted">{label}</p>
        <p className="text-ink mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}
