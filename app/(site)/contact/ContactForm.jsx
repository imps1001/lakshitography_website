"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowUpRight, Check, Mail, MessageCircle, Minus, Phone, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { WHATSAPP_NUMBER } from "@/data/content";
import { useServices } from "@/lib/services";
import {
  FIELD_ORDER, LIMITS, formatPhone, latestBookableDate, todayInIndia, validateBooking, validateField,
} from "@/lib/validation/booking";

const empty = {
  name: "", email: "", phone: "",
  service: "",
  preferred_date: "",
  people_count: "",
  location: "",
  message: "",
};

const PHONE_DISPLAY = "+91 97947 47454";

export default function ContactForm() {
  const params = useSearchParams();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [emailSuggestion, setEmailSuggestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // null, "new" or "duplicate"
  const [honeypot, setHoneypot] = useState("");
  const startedAt = useRef(Date.now());
  const fieldRefs = useRef({});
  const { visible: services, loading: servicesLoading } = useServices();
  // Computed in the browser after mount (the page is pre-rendered at build time); undefined falls
  // back to "now" inside the validators.
  const [today, setToday] = useState(undefined);
  useEffect(() => setToday(todayInIndia()), []);

  // Preselect ?service=<slug> from the Services page, otherwise the first listed service.
  useEffect(() => {
    if (!services.length) return;
    const requested = params.get("service");
    setForm((f) => {
      if (requested && services.some((x) => x.slug === requested)) return { ...f, service: requested };
      return services.some((x) => x.slug === f.service) ? f : { ...f, service: services[0].slug };
    });
  }, [params, services]);

  const runCheck = (field, value) => {
    const result = validateField(field, value, today);
    setErrors((e) => ({ ...e, [field]: result.error || undefined }));
    if (field === "email") setEmailSuggestion(result.error ? null : result.suggestion);
    return result;
  };

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Once a field has been visited, re-check as they type so errors clear the moment they're fixed.
    if (touched[field] || errors[field]) runCheck(field, value);
  };

  const onBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const result = runCheck(field, form[field]);
    if (field === "phone" && result.value) setForm((f) => ({ ...f, phone: formatPhone(result.value) }));
    if (field === "name" && result.value) setForm((f) => ({ ...f, name: result.value }));
  };

  const focusField = (field) => {
    const el = fieldRefs.current[field];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  };

  const buildWhatsAppLink = (f) => {
    const svc = services.find((s) => s.slug === f.service)?.name || f.service || "—";
    const text =
      `Hi Lakshit! I'd love to book a session.\n\n` +
      `• Name: ${f.name}\n` +
      `• Service: ${svc}\n` +
      `• Preferred date: ${f.preferred_date || "Flexible"}\n` +
      `• People: ${f.people_count || "—"}\n` +
      `• Location: ${f.location || "—"}\n` +
      `• Phone: ${f.phone}\n` +
      (f.message ? `\nNote: ${f.message}\n` : "");
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  };

  const showErrors = (next) => {
    setErrors(next);
    setTouched(Object.fromEntries(FIELD_ORDER.map((f) => [f, true])));
    const first = FIELD_ORDER.find((f) => next[f]);
    if (first) focusField(first);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const { values, errors: found, valid } = validateBooking(form, { today });
    if (!valid) {
      showErrors(found);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/bookings", { ...values, company: honeypot, started_at: startedAt.current });
      setDone(data.duplicate ? "duplicate" : "new");
      toast.success(data.duplicate ? "I already have this request — talk soon!" : "Booking request sent. I'll get back within 24 hours.");
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        showErrors(data.errors);
        toast.error(data.detail);
      } else if (!err.response) {
        toast.error("You seem to be offline. Check your connection, or message me on WhatsApp.");
      } else {
        toast.error(formatApiErrorDetail(data?.detail) || "Could not submit. Try WhatsApp instead.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Common props for every text input: value, change/blur handling and accessibility wiring.
  const bind = (field) => ({
    id: `booking-${field}`,
    name: field,
    value: form[field],
    ref: (el) => { fieldRefs.current[field] = el; },
    onChange: (e) => update(field, e.target.value),
    onBlur: () => onBlur(field),
    "aria-invalid": errors[field] ? "true" : undefined,
    "aria-describedby": errors[field] ? `booking-${field}-error` : undefined,
    className: "input",
  });

  const stepPeople = (delta) => {
    const current = Number(form.people_count) || 0;
    const next = Math.min(LIMITS.peopleMax, Math.max(LIMITS.peopleMin, current + delta));
    update("people_count", String(next));
    setTouched((t) => ({ ...t, people_count: true }));
    runCheck("people_count", String(next));
  };

  const contacts = [
    { href: buildWhatsAppLink(form), icon: MessageCircle, label: "WhatsApp", value: "Fastest reply", testid: "contact-whatsapp-direct", external: true, accent: "bg-mint" },
    { href: "mailto:lakshitography@gmail.com", icon: Mail, label: "Email", value: "lakshitography@gmail.com", accent: "bg-lilac" },
    { href: `tel:+${WHATSAPP_NUMBER}`, icon: Phone, label: "Call", value: PHONE_DISPLAY, accent: "bg-butter" },
  ];

  return (
    <div data-testid="page-contact" className="relative min-h-screen px-6 pb-12 pt-36">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-10 h-[26rem] w-[26rem] rounded-full bg-sun/15 blur-[120px]" />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="eyebrow">Book a session</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
            Tell me about <span className="font-serif font-normal italic text-gradient">your day.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Fill the form or slide into my WhatsApp. I usually reply within a day — sometimes sooner, chai in hand ☕
          </p>

          <div className="mt-10 space-y-3">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noreferrer" } : {})}
                data-testid={c.testid}
                className="card group flex items-center gap-4 p-3 pr-5 transition-colors hover:border-ink/25"
              >
                <span className={`${c.accent} grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-bg`}>
                  <c.icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{c.label}</span>
                  <span className="block truncate text-sm text-muted">{c.value}</span>
                </span>
                <ArrowUpRight size={18} className="text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Right: form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="card p-6 sm:p-8 lg:p-10"
        >
          {done ? (
            <div data-testid="booking-success" className="py-10 text-center" role="status">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint text-bg">
                <Check size={30} strokeWidth={3} />
              </span>
              <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight">
                {done === "duplicate" ? "Already got it!" : "You're in my inbox!"}
              </h2>
              <p className="mt-4 text-muted">
                {done === "duplicate"
                  ? "Looks like this request reached me a little while ago — no need to send it again."
                  : "I'll reply within 24 hours. Want a quicker chat?"}
              </p>
              <a
                href={buildWhatsAppLink(form)}
                target="_blank"
                rel="noreferrer"
                data-testid="success-whatsapp-link"
                className="btn-primary mt-8"
              >
                Continue on WhatsApp <MessageCircle size={16} />
              </a>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate data-testid="booking-form" className="space-y-5">
              {/* Honeypot: invisible to people, tempting to bots. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  Company
                  <input type="text" name="company" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </label>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-ink/90">
                  What are we shooting?<span className="ml-1 text-sun">*</span>
                </legend>
                {servicesLoading ? (
                  <div className="flex gap-2">{[1, 2, 3].map((i) => <span key={i} className="h-10 w-24 animate-pulse rounded-full bg-ink/5" />)}</div>
                ) : services.length === 0 ? (
                  <p className="text-sm text-muted">Bookings are paused right now — message me on WhatsApp and I&apos;ll help you out.</p>
                ) : (
                  <div
                    data-testid="form-service"
                    role="radiogroup"
                    aria-invalid={errors.service ? "true" : undefined}
                    aria-describedby={errors.service ? "booking-service-error" : undefined}
                    className="flex flex-wrap gap-2"
                  >
                    {services.map((s, i) => (
                      <button
                        key={s.slug}
                        ref={i === 0 ? (el) => { fieldRefs.current.service = el; } : undefined}
                        type="button"
                        role="radio"
                        aria-checked={form.service === s.slug}
                        aria-pressed={form.service === s.slug}
                        data-testid={`form-service-${s.slug}`}
                        onClick={() => { update("service", s.slug); runCheck("service", s.slug); }}
                        className="chip"
                      >
                        {s.tag || s.name}
                      </button>
                    ))}
                  </div>
                )}
                <FieldError field="service" error={errors.service} />
              </fieldset>

              <Field field="name" label="Your name" required error={errors.name}>
                <input {...bind("name")} data-testid="form-name" autoComplete="name" maxLength={LIMITS.name} placeholder="What should I call you?" />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field field="email" label="Email" required error={errors.email}>
                  <input {...bind("email")} data-testid="form-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false} maxLength={LIMITS.email} placeholder="you@email.com" />
                  {emailSuggestion && !errors.email && (
                    <button
                      type="button"
                      onClick={() => { update("email", emailSuggestion); setEmailSuggestion(null); }}
                      className="mt-1.5 text-left text-xs text-butter hover:underline"
                      data-testid="email-suggestion"
                    >
                      Did you mean <strong>{emailSuggestion}</strong>?
                    </button>
                  )}
                </Field>
                <Field field="phone" label="Mobile number" required error={errors.phone} hint="Indian mobile, or add your country code">
                  <input {...bind("phone")} data-testid="form-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="98765 43210" />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field field="preferred_date" label="Preferred date" error={errors.preferred_date} hint="Leave empty if you're flexible">
                  <input {...bind("preferred_date")} data-testid="form-date" type="date" min={today} max={today && latestBookableDate(today)} />
                </Field>
                <Field field="people_count" label="How many people?" error={errors.people_count}>
                  <div className="flex items-center gap-2">
                    <StepButton label="Fewer people" onClick={() => stepPeople(-1)} disabled={!form.people_count || Number(form.people_count) <= LIMITS.peopleMin}><Minus size={16} /></StepButton>
                    <input
                      {...bind("people_count")}
                      onChange={(e) => update("people_count", e.target.value.replace(/\D/g, "").slice(0, 3))}
                      data-testid="form-people"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 4"
                      className="input text-center"
                    />
                    <StepButton label="More people" onClick={() => stepPeople(1)} disabled={Number(form.people_count) >= LIMITS.peopleMax}><Plus size={16} /></StepButton>
                  </div>
                </Field>
              </div>

              <Field field="location" label="Location / city" error={errors.location}>
                <input {...bind("location")} data-testid="form-location" autoComplete="address-level2" maxLength={LIMITS.location} placeholder="Delhi, Bangalore, home address…" />
              </Field>

              <Field
                field="message"
                label="Anything I should know?"
                error={errors.message}
                counter={<span className={form.message.length > LIMITS.message * 0.9 ? "text-butter" : ""}>{form.message.length}/{LIMITS.message}</span>}
              >
                <textarea {...bind("message")} data-testid="form-message" rows={4} maxLength={LIMITS.message} placeholder="The vibe, the occasion, the chaos — tell me everything." className="input resize-none" />
              </Field>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="submit" data-testid="form-submit" disabled={submitting || !services.length} aria-busy={submitting} className="btn-primary flex-1 disabled:opacity-60">
                  {submitting ? "Sending…" : "Send request"} <Send size={16} />
                </button>
                <a
                  href={buildWhatsAppLink(form)}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="form-whatsapp"
                  className="btn-ghost flex-1"
                >
                  WhatsApp instead <MessageCircle size={16} />
                </a>
              </div>
              <p className="text-center text-xs text-muted">I&apos;ll only use your details to reply about your booking.</p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// `counter` sits beside the label; `hint` shows under the input until there's an error to show instead.
function Field({ field, label, required, error, hint, counter, children }) {
  return (
    <div>
      <label htmlFor={`booking-${field}`} className="mb-2 flex items-baseline justify-between gap-2 text-sm font-medium text-ink/90">
        <span>
          {label}
          {required ? <span className="ml-1 text-sun" aria-hidden>*</span> : null}
        </span>
        {counter && <span className="text-xs font-normal text-muted">{counter}</span>}
      </label>
      {children}
      {error ? <FieldError field={field} error={error} /> : hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function FieldError({ field, error }) {
  if (!error) return null;
  return (
    <p id={`booking-${field}-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-300" data-testid={`error-${field}`}>
      <AlertCircle size={14} className="mt-px shrink-0" /> {error}
    </p>
  );
}

function StepButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-[3.25rem] w-12 shrink-0 place-items-center rounded-2xl border border-ink/10 bg-bg/60 text-ink transition-colors hover:border-ink/30 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
