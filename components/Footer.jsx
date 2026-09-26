import Link from "next/link";
import { ArrowUpRight, Instagram, Mail, MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/data/content";

const explore = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Book a shoot" },
];

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="relative mt-24 overflow-hidden border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-10 pt-20 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Your people,
            <br />
            <span className="font-serif font-normal italic text-sun">unfiltered.</span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Candid photography for couples, small families and the gatherings in between.
          </p>
        </div>

        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Explore</p>
          <ul className="space-y-3">
            {explore.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group inline-flex items-center gap-1 text-ink/90 transition-colors hover:text-butter">
                  {l.label}
                  <ArrowUpRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Say hi</p>
          <ul className="space-y-3 text-ink/90">
            <li>
              <a href="mailto:hello@lakshitography.com" className="inline-flex items-center gap-3 transition-colors hover:text-butter">
                <Mail size={16} className="text-sun" /> hello@lakshitography.com
              </a>
            </li>
            <li>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 transition-colors hover:text-butter">
                <MessageCircle size={16} className="text-sun" /> WhatsApp
              </a>
            </li>
            <li>
              <a href="https://instagram.com/lakshitography" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 transition-colors hover:text-butter">
                <Instagram size={16} className="text-sun" /> @lakshitography
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Oversized wordmark */}
      <div aria-hidden className="pointer-events-none select-none px-4">
        <p className="text-center font-display text-[min(15vw,11rem)] font-extrabold leading-[0.8] tracking-tighter text-ink/[0.05]">
          lakshitography
        </p>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted md:flex-row">
          <p>© {new Date().getFullYear()} Lakshitography. All moments reserved.</p>
          <Link href="/admin/login" data-testid="admin-login-link" className="uppercase tracking-wider transition-colors hover:text-sun">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
