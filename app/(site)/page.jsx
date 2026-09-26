"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Camera, Heart, Sparkles, Sun, X } from "lucide-react";
import HeroGrid from "@/components/HeroGrid";
import Marquee from "@/components/Marquee";
import PortfolioImage from "@/components/PortfolioImage";
import { usePortfolio } from "@/lib/portfolio";
import { countWord, shortPrice } from "@/lib/format";
import { useServices } from "@/lib/services";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.08, ease: [0.22, 0.61, 0.36, 1] },
  }),
};

const inView = { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-80px" }, variants: fadeUp };

const NOT_FOR_ME = [
  { t: "Big weddings as the main photographer", d: "Big days deserve a whole team. I'm happy to shoot the intimate pre/post events instead." },
  { t: "Heavily staged, directed shoots", d: "If a moment needs choreography to exist, it isn't yours yet." },
  { t: "High-pressure, run-of-show coverage", d: "I miss the chaos on purpose and chase the quiet in between." },
];

const APPROACH = [
  { icon: Sun, t: "Natural & candid", d: "Available light, real moments. The camera waits, it doesn't direct.", bg: "bg-butter" },
  { icon: Heart, t: "Comfort first", d: "Shy in front of cameras? Same. The first twenty minutes are just for warming up.", bg: "bg-blush" },
  { icon: Sparkles, t: "Small & intimate", d: "Groups stay small on purpose. Fewer people, deeper photographs.", bg: "bg-lilac" },
  { icon: Camera, t: "No chaos, no rush", d: "We build in slow time. You'll never feel like I'm chasing the next frame.", bg: "bg-mint" },
];

export default function Home() {
  const { hero, coverFor, loading } = usePortfolio();
  const { visible: services, startingPrice, loading: servicesLoading } = useServices();

  return (
    <div data-testid="page-home">
      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-16 pt-32 lg:pt-36">
        {/* ambient glow */}
        <div aria-hidden className="pointer-events-none absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-sun/20 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 h-[24rem] w-[24rem] rounded-full bg-lilac/15 blur-[120px]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <motion.div initial="hidden" animate="show" data-testid="hero-content">
            <motion.div variants={fadeUp} custom={0} className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink/90">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
                </span>
                Booking {new Date().getFullYear()} sessions
              </span>
              <span className="text-xs text-muted">Pan-India · Based in India</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mt-7 font-display text-[3.2rem] font-extrabold leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem]"
            >
              Photos that
              <br />
              feel like <span className="font-serif font-normal italic text-gradient">home.</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="mt-7 max-w-md text-lg leading-relaxed text-muted">
              Couples, small families, birthdays and the quiet gatherings in between —{" "}
              <span className="text-ink">zero awkward posing, zero rush.</span>
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" data-testid="hero-cta-book" className="btn-primary">
                Book a session <ArrowRight size={16} />
              </Link>
              <Link href="/services" data-testid="hero-cta-services" className="btn-ghost">
                See packages
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="mt-12 flex items-center gap-8">
              <Stat value="100%" label="candid" />
              <div className="h-10 w-px bg-line" />
              <Stat value="24h" label="reply time" />
              <div className="h-10 w-px bg-line" />
              <Stat value={startingPrice != null ? shortPrice(startingPrice) : "—"} label="starting at" />
            </motion.div>
          </motion.div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px] sm:aspect-square">
            <HeroGrid photos={hero} loading={loading} />

            {/* Stickers */}
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, type: "spring", stiffness: 260, damping: 18 }}
              className="sticker absolute -left-3 top-8 animate-float bg-butter [--r:-8deg] sm:-left-6"
            >
              ✦ no awkward posing
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 18 }}
              className="sticker absolute -right-2 bottom-24 animate-float bg-lilac [--r:6deg] [animation-delay:1.5s] sm:-right-5"
            >
              real moments only
            </motion.span>

            {/* Spinning book badge */}
            <Link
              href="/contact"
              aria-label="Book a session"
              className="group absolute -bottom-6 -left-2 grid h-28 w-28 place-items-center rounded-full bg-sun text-bg shadow-2xl shadow-sun/40 transition-transform hover:scale-105 sm:-bottom-8 sm:-left-8"
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin-slow">
                <defs>
                  <path id="circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
                </defs>
                <text className="fill-current text-[10.5px] font-bold uppercase tracking-[0.18em]">
                  <textPath href="#circle">book a shoot • book a shoot •</textPath>
                </text>
              </svg>
              <ArrowUpRight size={28} className="transition-transform group-hover:rotate-45" />
            </Link>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="relative z-10 my-10 -rotate-2 scale-105 border-y-2 border-bg bg-butter py-4 font-display text-2xl font-bold text-bg sm:text-3xl">
        <Marquee items={["Couples", "Families", "Birthdays", "Anniversaries", "Kitty parties", "Zero awkward posing", "Golden hour"]} />
      </div>

      {/* WHAT I DO */}
      <section data-testid="section-what-i-do" className="px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="What I shoot"
            title={<>Warm, human, <Serif>unhurried.</Serif></>}
            copy={`${services.length ? `${countWord(services.length)} things` : "The things"} I love photographing more than anything. At home, in cafés, at small venues — wherever you feel most like yourselves.`}
          />

          {/* Portrait "story" cards: portrait photos stay mostly uncropped. Swipe row on mobile, 5-up on desktop. */}
          <div className={`-mx-6 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] lg:mx-0 lg:grid ${desktopColumns(servicesLoading ? 5 : services.length)} lg:overflow-visible lg:px-0 lg:pb-0`}>
            {servicesLoading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] w-[72%] shrink-0 animate-pulse rounded-[1.75rem] bg-surface sm:w-[44%] md:w-[31%] lg:aspect-[2/3] lg:w-auto" />
            ))}
            {services.map((s, i) => (
              <motion.div key={s.slug} {...inView} custom={i} className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[31%] lg:w-auto">
                <Link
                  href={`/services#${s.slug}`}
                  data-testid={`what-i-do-card-${s.slug}`}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-surface lg:aspect-[2/3]"
                >
                  <PortfolioImage
                    photo={coverFor(s)}
                    loading={loading}
                    width={800}
                    fallbackAlt={s.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/20" />
                  <div className="absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-1.5">
                    <span className="rounded-full bg-bg/60 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur-md">{s.tag}</span>
                    <span className="rounded-full bg-butter px-2.5 py-1 text-[11px] font-bold text-bg">from {shortPrice(s.price_min)}</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <h3 className="font-display text-xl font-bold leading-tight text-white">{s.name}</h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/70">{s.blurb}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-butter">
                      Explore <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW I WORK */}
      <section data-testid="section-my-approach" className="px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="How I work"
            title={<>Four tiny <Serif>promises.</Serif></>}
            copy="Nothing fancy — just a way of working that's gentle on you, and kind to the images."
          />

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {APPROACH.map((b, i) => {
              const I = b.icon;
              return (
                <motion.div
                  key={b.t}
                  {...inView}
                  custom={i}
                  data-testid={`approach-block-${i}`}
                  className={`${b.bg} group relative flex min-h-[13rem] flex-col gap-8 sm:min-h-[18rem] justify-between overflow-hidden rounded-[2rem] p-7 text-bg transition-transform duration-300 hover:-translate-y-1 hover:-rotate-1`}
                >
                  <div className="flex items-start justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-bg text-ink">
                      <I size={20} />
                    </span>
                    <span className="font-display text-5xl font-extrabold opacity-20">0{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold leading-tight">{b.t}</h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-bg/75">{b.d}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VIBE CHECK */}
      <section data-testid="section-what-i-dont-do" className="px-6 py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <p className="eyebrow">Vibe check</p>
            <h2 className="mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              What I <span className="font-serif font-normal italic text-sun line-through decoration-2">do</span> don&apos;t do.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Honesty before booking. Not things I&apos;m bad at — just not the kind of work I want to make.
            </p>
            <blockquote className="mt-10 border-l-2 border-sun pl-5 font-serif text-2xl italic leading-snug text-ink/90">
              &ldquo;I focus on calm, meaningful moments — the kind that don&apos;t shout for attention.&rdquo;
            </blockquote>
          </div>

          <div className="space-y-4">
            {NOT_FOR_ME.map((it, i) => (
              <motion.div
                key={it.t}
                {...inView}
                custom={i}
                data-testid={`dont-do-item-${i}`}
                className="card flex items-start gap-5 p-6 transition-colors hover:border-sun/40 sm:p-7"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sun/15 text-sun">
                  <X size={18} strokeWidth={2.5} />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold leading-tight">{it.t}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{it.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section data-testid="section-final-cta" className="px-4 py-12 sm:px-6">
        <motion.div
          {...inView}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-sun via-[#ff8a5c] to-blush px-6 py-20 text-center text-bg sm:px-12 lg:py-28"
        >
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-[28px] border-bg/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-butter/40 blur-3xl" />

          <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-bg/70">Let&apos;s make something</p>
          <h2 className="relative mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl">
            Small moments, <span className="font-serif font-normal italic">big feelings.</span> Let&apos;s capture yours.
          </h2>
          <p className="relative mx-auto mt-6 max-w-lg text-lg text-bg/75">
            Tell me your date, your people, and the feeling you want to remember.
          </p>
          <div className="relative mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              data-testid="final-cta-book"
              className="inline-flex items-center gap-2 rounded-full bg-bg px-7 py-4 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
            >
              Book your session <ArrowRight size={16} />
            </Link>
            <Link
              href="/gallery"
              data-testid="final-cta-gallery"
              className="inline-flex items-center gap-2 rounded-full border-2 border-bg/80 px-7 py-4 text-sm font-semibold transition-colors hover:bg-bg/10"
            >
              See the work
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

// Keeps desktop rows full-ish for any number of services (Tailwind needs literal class names).
function desktopColumns(count) {
  const cols = count <= 5 ? Math.max(count, 3) : count % 3 === 0 ? 3 : 4;
  return { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" }[cols];
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

function Serif({ children }) {
  return <span className="font-serif font-normal italic text-sun">{children}</span>;
}

function SectionHead({ eyebrow, title, copy }) {
  return (
    <div className="grid items-end gap-6 lg:grid-cols-2">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">{title}</h2>
      </div>
      <p className="max-w-md text-lg leading-relaxed text-muted lg:justify-self-end">{copy}</p>
    </div>
  );
}
