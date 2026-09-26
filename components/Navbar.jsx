"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Book" },
];

export function Logo({ className = "" }) {
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      lakshit<span className="font-serif font-normal italic text-sun">ography</span>
    </span>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header data-testid="site-navbar" className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div
        className={`mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full border pl-6 pr-2 transition-all duration-500 ${
          scrolled || open
            ? "border-ink/10 bg-bg/70 shadow-2xl shadow-black/40 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <Link href="/" data-testid="logo-link" className="text-xl">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const isActive = pathname === l.to;
            return (
              <Link
                key={l.to}
                href={l.to}
                data-testid={`nav-${l.label.toLowerCase()}`}
                className={`relative isolate rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-bg" : "text-muted hover:text-ink"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/contact" data-testid="nav-cta-book" className="btn-primary hidden !py-2.5 !pl-5 !pr-4 sm:inline-flex">
            Book a shoot <ArrowUpRight size={16} />
          </Link>
          <button
            data-testid="mobile-menu-toggle"
            className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mx-auto mt-3 max-w-6xl overflow-hidden rounded-3xl border border-ink/10 bg-surface/95 p-3 backdrop-blur-xl md:hidden"
          >
            {links.map((l, i) => {
              const isActive = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  href={l.to}
                  data-testid={`mobile-nav-${l.label.toLowerCase()}`}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 font-display text-2xl font-semibold transition-colors ${
                    isActive ? "bg-ink text-bg" : "text-ink hover:bg-ink/5"
                  }`}
                >
                  {l.label}
                  <span className="font-sans text-xs text-muted">0{i + 1}</span>
                </Link>
              );
            })}
            <Link href="/contact" data-testid="mobile-nav-cta-book" className="btn-primary mt-3 w-full">
              Book a shoot <ArrowUpRight size={16} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
