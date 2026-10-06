"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Film, Image as ImageIcon, Users } from "lucide-react";
import PortfolioImage from "@/components/PortfolioImage";
import { priceRange } from "@/lib/format";
import { useServices } from "@/lib/services";
import { usePortfolio } from "@/lib/portfolio";

const INCLUDED = ["Pre-shoot vibe call", "Hand-edited, colour-graded photos", "Private online gallery", "Delivery in ~2 weeks"];

export default function Services() {
  const { coverFor, loading } = usePortfolio();
  const { visible: services, loading: servicesLoading } = useServices();

  return (
    <div data-testid="page-services" className="relative min-h-screen px-6 pb-12 pt-36">
      <div aria-hidden className="pointer-events-none absolute -right-32 top-0 h-[26rem] w-[26rem] rounded-full bg-sun/15 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
          className="max-w-3xl"
        >
          <p className="eyebrow">Services & pricing</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
            Sessions that <span className="font-serif font-normal italic text-gradient">feel slow.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Transparent pricing, small groups, and editing that takes its time. No hidden fees, no upsells — ever.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {INCLUDED.map((item) => (
              <span key={item} className="rounded-full border border-ink/15 bg-ink/5 px-4 py-2 text-sm text-ink/90">
                ✓ {item}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="mt-16 space-y-5">
          {servicesLoading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[26rem] animate-pulse rounded-3xl bg-surface" />
          ))}
          {!servicesLoading && services.length === 0 && (
            <div className="card p-14 text-center">
              <p className="font-display text-2xl font-bold">New packages coming soon ✨</p>
              <p className="mt-2 text-muted">Message me in the meantime and I&apos;ll put something together for you.</p>
            </div>
          )}
          {services.map((s, i) => (
            <motion.article
              key={s.slug}
              id={s.slug}
              data-testid={`service-card-${s.slug}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
              className="card group grid scroll-mt-28 gap-3 overflow-hidden p-3 transition-colors duration-300 hover:border-sun/40 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
            >
              {/* Portrait frame so people-shots aren't sliced; alternates sides on wider screens. */}
              <div className={`relative aspect-[4/5] overflow-hidden rounded-[1.4rem] md:aspect-auto md:min-h-[26rem] ${i % 2 ? "md:order-2" : ""}`}>
                <PortfolioImage
                  photo={coverFor(s)}
                  loading={loading}
                  width={1200}
                  fallbackAlt={s.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-full bg-bg/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                  {s.tag || s.name}
                </span>
              </div>

              <div className="flex flex-col justify-center p-5 sm:p-6 lg:p-10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-display text-3xl font-bold leading-tight lg:text-4xl">{s.name}</h2>
                  <span className="rounded-full bg-butter px-4 py-1.5 font-display text-sm font-bold text-bg">{priceRange(s)}</span>
                </div>
                {s.blurb && <p className="mt-3 leading-relaxed text-muted">{s.blurb}</p>}

                <div className="mt-6 grid grid-cols-2 gap-2 lg:max-w-xl">
                  <Detail icon={Clock} label="Duration" value={s.duration} />
                  <Detail icon={ImageIcon} label="Delivery" value={s.photos} />
                  <Detail icon={Users} label="Group size" value={s.people} />
                  <Detail icon={Film} label="Add-on" value={s.add_on} />
                </div>

                <Link
                  href={`/contact?service=${s.slug}`}
                  data-testid={`book-${s.slug}`}
                  className="btn-primary mt-6 w-full sm:w-fit"
                >
                  Book this session <ArrowRight size={16} />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start gap-6 rounded-[2rem] border border-dashed border-ink/20 p-8 sm:flex-row sm:items-center sm:justify-between lg:p-10">
          <div>
            <p className="eyebrow">A note on pricing</p>
            <p className="mt-3 max-w-2xl font-serif text-2xl italic leading-snug text-ink/90 lg:text-3xl">
              Prices shift a little with location and travel. Brackets stay tight so you always know what to expect.
            </p>
          </div>
          <Link href="/contact" className="btn-ghost shrink-0">
            Ask a question
          </Link>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  if (!value) return null; // optional fields left blank in admin
  return (
    <div className="rounded-2xl bg-bg/60 p-3.5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
        <Icon size={14} className="text-sun" /> {label}
      </div>
      <p className="mt-1.5 text-sm leading-snug text-ink">{value}</p>
    </div>
  );
}
