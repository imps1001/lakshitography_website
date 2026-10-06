import nodemailer from "nodemailer";
import { WHATSAPP_NUMBER } from "@/data/content";
import { formatPhone } from "@/lib/validation/booking";

// SMTP settings default to Gmail; any provider works by changing the env values.
//   SMTP_USER / SMTP_PASS  — required (for Gmail: the address + a 16-character App Password)
//   SMTP_HOST / SMTP_PORT  — optional, default smtp.gmail.com:465
//   NOTIFY_EMAIL           — where booking alerts go (defaults to ADMIN_EMAIL, then SMTP_USER)
//   MAIL_FROM              — sender shown to recipients (defaults to "Lakshitography <SMTP_USER>")
//   SEND_CUSTOMER_CONFIRMATION — set to "false" to stop emailing customers
let transporter;

function mailConfig() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, ""); // Gmail shows app passwords with spaces
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT) || 465;
  return {
    transport: { host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com", port, secure: port === 465, auth: { user, pass } },
    from: process.env.MAIL_FROM?.trim() || `Lakshitography <${user}>`,
    notifyTo: process.env.NOTIFY_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim() || user,
    confirmCustomer: process.env.SEND_CUSTOMER_CONFIRMATION !== "false",
  };
}

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Keep user-supplied text out of mail headers' line structure.
const oneLine = (value) => String(value ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 120);

function layout(title, body) {
  return `<!doctype html><html><body style="margin:0;background:#0C0B0A;padding:24px 12px;font-family:Helvetica,Arial,sans-serif;color:#F7F2EA">
  <div style="max-width:560px;margin:0 auto;background:#161412;border:1px solid #2a2622;border-radius:20px;overflow:hidden">
    <div style="padding:22px 28px;border-bottom:1px solid #2a2622;font-size:20px;font-weight:700">lakshit<span style="color:#FF6A3D;font-style:italic;font-weight:400">ography</span></div>
    <div style="padding:28px">
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2">${title}</h1>
      ${body}
    </div>
  </div></body></html>`;
}

function row(label, value) {
  if (!value) return "";
  return `<tr><td style="padding:8px 0;color:#A8A097;font-size:13px;width:130px;vertical-align:top">${label}</td>
    <td style="padding:8px 0;font-size:15px">${escapeHtml(value)}</td></tr>`;
}

function button(href, text, background) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;border-radius:999px;background:${background};color:#0C0B0A;font-weight:700;font-size:14px;text-decoration:none">${text}</a>`;
}

function adminEmail(booking) {
  const digits = booking.phone.replace(/[^\d+]/g, "");
  const waDigits = digits.replace(/^\+/, "");
  const waLink = `https://wa.me/${waDigits.length === 10 ? `91${waDigits}` : waDigits}`;
  const text = [
    `New booking request from ${booking.name}`,
    `Service: ${booking.service_name}`,
    `Email: ${booking.email}`,
    `Phone: ${formatPhone(booking.phone)}`,
    `Preferred date: ${booking.preferred_date || "Flexible"}`,
    `People: ${booking.people_count || "—"}`,
    `Location: ${booking.location || "—"}`,
    booking.message ? `\nMessage:\n${booking.message}` : "",
  ].join("\n");

  const html = layout(
    `New booking: ${escapeHtml(booking.service_name)}`,
    `<p style="margin:0 0 18px;color:#A8A097;font-size:15px">${escapeHtml(booking.name)} just sent a request through the website.</p>
    <table style="width:100%;border-collapse:collapse">
      ${row("Name", booking.name)}${row("Service", booking.service_name)}${row("Email", booking.email)}${row("Phone", formatPhone(booking.phone))}
      ${row("Preferred date", booking.preferred_date || "Flexible")}${row("People", booking.people_count)}${row("Location", booking.location)}
    </table>
    ${booking.message ? `<div style="margin-top:16px;padding:14px 16px;border-left:3px solid #FF6A3D;background:#0C0B0A;border-radius:8px;font-size:15px;white-space:pre-wrap">${escapeHtml(booking.message)}</div>` : ""}
    <div style="margin-top:24px">
      ${button(waLink, "WhatsApp them", "#9FF0C8")}${button(`tel:${digits}`, "Call", "#FFD84D")}${button(`mailto:${booking.email}`, "Reply by email", "#C8B6FF")}
    </div>
    <p style="margin:18px 0 0;color:#A8A097;font-size:12px">Manage it in the admin panel → Bookings. Replying to this email goes straight to the customer.</p>`,
  );
  return { subject: `New booking: ${oneLine(booking.service_name)} — ${oneLine(booking.name)}`, text, html };
}

function customerEmail(booking) {
  const firstName = oneLine(booking.name).split(" ")[0];
  const text = `Hi ${firstName},\n\nThanks for reaching out about a ${booking.service_name}! I've got your request and will reply within 24 hours.\n\nWant a quicker chat? Message me on WhatsApp: https://wa.me/${WHATSAPP_NUMBER}\n\n— Lakshit, Lakshitography`;
  const html = layout(
    `Got it, ${escapeHtml(firstName)}! ✨`,
    `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Thanks for reaching out about a <strong>${escapeHtml(booking.service_name)}</strong>. Your request landed safely and I'll reply within 24 hours — usually sooner.</p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 18px">
      ${row("Preferred date", booking.preferred_date || "Flexible")}${row("People", booking.people_count)}${row("Location", booking.location)}
    </table>
    ${button(`https://wa.me/${WHATSAPP_NUMBER}`, "Chat on WhatsApp", "#FF6A3D")}
    <p style="margin:18px 0 0;font-size:15px">— Lakshit</p>`,
  );
  return { subject: "Your Lakshitography booking request", text, html };
}

// Sends the booking alert (and optional customer confirmation). Never throws: a mail problem
// must not lose or fail a booking, which is already saved by the time this runs.
export async function sendBookingEmails(booking) {
  const config = mailConfig();
  if (!config) {
    console.warn("Booking email skipped: set SMTP_USER and SMTP_PASS to enable notifications.");
    return { sent: false, reason: "not-configured" };
  }
  transporter ||= nodemailer.createTransport(config.transport);

  const jobs = [
    transporter.sendMail({ from: config.from, to: config.notifyTo, replyTo: booking.email, ...adminEmail(booking) }),
  ];
  if (config.confirmCustomer) {
    jobs.push(transporter.sendMail({ from: config.from, to: booking.email, replyTo: config.notifyTo, ...customerEmail(booking) }));
  }
  const results = await Promise.allSettled(jobs);
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`Booking email (${i === 0 ? "admin alert" : "customer confirmation"}) failed:`, result.reason?.message);
    }
  });
  return { sent: results[0].status === "fulfilled" };
}

// Exposed for previews/tests only.
export const _templates = { adminEmail, customerEmail };
