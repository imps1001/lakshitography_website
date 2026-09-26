"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { focusPosition, usePortfolio } from "@/lib/portfolio";
import { optimizedImage } from "@/lib/utils";

export default function Gallery() {
  const [active, setActive] = useState("all"); // "all" or a category id
  const [lightbox, setLightbox] = useState(null); // index into `items`
  const { gallery, categories, loading, categoryName, heroOf } = usePortfolio();

  const items = useMemo(
    () => (active === "all" ? gallery : gallery.filter((g) => g.category_id === active)),
    [active, gallery]
  );

  // Only categories that have something to show, in the order set in admin.
  const filters = useMemo(() => {
    const counts = {};
    gallery.forEach((g) => { counts[g.category_id] = (counts[g.category_id] || 0) + 1; });
    return categories
      .filter((c) => counts[c.id])
      .map((c) => ({ id: c.id, name: c.name, count: counts[c.id], cover: heroOf(c) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, gallery]);

  const step = useCallback(
    (dir) => setLightbox((i) => (i === null ? i : (i + dir + items.length) % items.length)),
    [items.length]
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, step]);

  const current = lightbox !== null ? items[lightbox] : null;

  return (
    <div data-testid="page-gallery" className="relative min-h-screen px-6 pb-12 pt-36">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-10 h-[26rem] w-[26rem] rounded-full bg-lilac/15 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-end gap-6 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Gallery</p>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
              A handful of <span className="font-serif font-normal italic text-gradient">quiet</span> frames.
            </h1>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-muted lg:justify-self-end">
            Afternoons, kitchens, terraces and tea-cup tables. Tap any photo to see it big.
          </p>
        </div>

        {/* Category filters */}
        {/* Category filters, styled like story highlights */}
        <div data-testid="gallery-filters" className="-mx-6 mt-10 flex gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:gap-6">
          <Highlight label="All" count={gallery.length} active={active === "all"} onClick={() => setActive("all")} testid="filter-all" />
          {filters.map((f) => (
            <Highlight
              key={f.id}
              label={f.name}
              count={f.count}
              cover={f.cover}
              active={active === f.id}
              onClick={() => setActive(f.id)}
              testid={`filter-${f.name.toLowerCase().replace(/\s+/g, "-")}`}
            />
          ))}
        </div>

        {/* Masonry */}
        {loading ? (
          <div className="mt-8 columns-2 gap-3 md:columns-3 lg:gap-4">
            {[4 / 5, 1, 3 / 4, 1, 4 / 5, 3 / 4].map((ratio, i) => (
              <div key={i} style={{ aspectRatio: ratio }} className="mb-3 animate-pulse rounded-3xl bg-surface lg:mb-4" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card mt-8 p-14 text-center">
            <p className="font-display text-2xl font-bold">Nothing here yet 👀</p>
            <p className="mt-2 text-muted">
              Fresh {active === "all" ? "" : `${categoryName(active).toLowerCase()} `}shots are on the way.
            </p>
          </div>
        ) : (
          <motion.div layout className="mt-8 columns-2 gap-3 md:columns-3 lg:gap-4">
            <AnimatePresence mode="popLayout">
              {items.map((g, i) => (
                <motion.button
                  key={g.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.45, delay: (i % 6) * 0.04 }}
                  onClick={() => setLightbox(i)}
                  data-testid={`gallery-item-${i}`}
                  className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-3xl bg-surface lg:mb-4"
                >
                  <img
                    src={optimizedImage(g.url, 900)}
                    alt={g.alt || categoryName(g.category_id)}
                    loading="lazy"
                    width={g.width}
                    height={g.height}
                    className="block w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-between opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <span className="rounded-full bg-bg/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">{categoryName(g.category_id)}</span>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-bg">
                      <Maximize2 size={14} />
                    </span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="mt-16 flex flex-col items-center text-center">
          <p className="font-display text-3xl font-bold sm:text-4xl">
            Want to be in the <span className="font-serif font-normal italic text-sun">next</span> batch?
          </p>
          <Link href="/contact" className="btn-primary mt-6">
            Book a session <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {current && (
          <motion.div
            data-testid="gallery-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl sm:p-10"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
          >
            <button
              data-testid="lightbox-close"
              aria-label="Close"
              className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              onClick={() => setLightbox(null)}
            >
              <X size={22} />
            </button>
            {items.length > 1 && (
              <>
                <LightboxNav side="left" onClick={(e) => { e.stopPropagation(); step(-1); }} />
                <LightboxNav side="right" onClick={(e) => { e.stopPropagation(); step(1); }} />
              </>
            )}
            <motion.img
              key={current.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              src={optimizedImage(current.url, 2400)}
              alt={current.alt || categoryName(current.category_id)}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain"
            />
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md">
              {current.alt || categoryName(current.category_id)} · {lightbox + 1}/{items.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LightboxNav({ side, onClick }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      onClick={onClick}
      className={`absolute top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 ${
        side === "left" ? "left-3 sm:left-6" : "right-3 sm:right-6"
      }`}
    >
      <Icon size={24} />
    </button>
  );
}

function Highlight({ label, count, cover, active, onClick, testid }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} data-testid={testid} className="group flex w-20 shrink-0 flex-col items-center gap-2">
      <span
        className={`rounded-full p-[3px] transition-all ${
          active ? "bg-gradient-to-tr from-sun via-blush to-lilac" : "bg-ink/15 group-hover:bg-ink/30"
        }`}
      >
        <span className="block h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full border-[3px] border-bg bg-surface-2">
          {cover ? (
            <img src={optimizedImage(cover.url, 200)} alt="" style={{ objectPosition: focusPosition(cover) }} className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center font-display text-lg font-bold text-ink/80">{count}</span>
          )}
        </span>
      </span>
      <span className={`w-full truncate text-center text-xs font-medium ${active ? "text-ink" : "text-muted"}`}>
        {label} <span className="opacity-60">{count}</span>
      </span>
    </button>
  );
}
