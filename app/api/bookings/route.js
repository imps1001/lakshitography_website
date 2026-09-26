import { NextResponse, after } from "next/server";
import { createHash, randomUUID } from "crypto";
import { getAdminFromRequest } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";
import { apiError, requestJson } from "@/lib/server/http";
import { sendBookingEmails } from "@/lib/server/email";
import { serviceCollections } from "@/lib/server/services";
import { validateBooking } from "@/lib/validation/booking";

export const runtime = "nodejs";

const MIN_FILL_MS = 2500; // humans can't fill the form faster than this; bots usually do
const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 }; // per visitor
const DUPLICATE_WINDOW_MS = 30 * 60 * 1000; // same email + service counts as a resubmit

let indexesReady;
function ensureBookingIndexes(bookings) {
  indexesReady ||= Promise.all([
    bookings.createIndex({ ip_hash: 1, created_at: -1 }),
    bookings.createIndex({ email: 1, service: 1, created_at: -1 }),
  ]).catch((error) => { indexesReady = undefined; throw error; });
  return indexesReady;
}

// Visitors are rate-limited by a salted hash of their IP, so raw IPs are never stored.
function visitorHash(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${process.env.JWT_SECRET || ""}:${ip}`).digest("hex").slice(0, 32);
}

// Bots get a normal-looking success so they don't learn to adapt; nothing is saved or emailed.
const fakeSuccess = () => NextResponse.json({ id: randomUUID(), status: "new" }, { status: 201 });

export async function POST(request) {
  const body = await requestJson(request);
  if (!body || typeof body !== "object") return apiError("Invalid request.");

  // Spam checks: a hidden "company" field humans never see, and a minimum time on the form.
  if (typeof body.company === "string" && body.company.trim()) return fakeSuccess();
  const startedAt = Number(body.started_at);
  if (!Number.isFinite(startedAt)) return apiError("Please reload the page and try again.");
  if (Date.now() - startedAt < MIN_FILL_MS) return fakeSuccess();

  const { values, errors, valid } = validateBooking(body);
  if (!valid) {
    const [field] = Object.keys(errors);
    return apiError(errors[field], 400, { field, errors });
  }

  const { services } = await serviceCollections();
  const chosen = await services.findOne({ slug: values.service, visible: true });
  if (!chosen) {
    return apiError("That service isn't available any more — please pick another.", 400, { field: "service", errors: { service: "That service isn't available any more — please pick another." } });
  }

  const bookings = (await getDatabase()).collection("bookings");
  await ensureBookingIndexes(bookings);
  const ipHash = visitorHash(request);
  const now = Date.now();

  const duplicate = await bookings.findOne(
    { email: values.email, service: values.service, created_at: { $gte: new Date(now - DUPLICATE_WINDOW_MS).toISOString() } },
    { projection: { _id: 0, ip_hash: 0 } },
  );
  if (duplicate) return NextResponse.json({ ...duplicate, duplicate: true }, { status: 200 });

  const recent = await bookings.countDocuments({ ip_hash: ipHash, created_at: { $gte: new Date(now - RATE_LIMIT.windowMs).toISOString() } });
  if (recent >= RATE_LIMIT.max) {
    return apiError("You've sent a few requests already — please message me on WhatsApp instead.", 429);
  }

  const booking = {
    id: randomUUID(),
    ...values,
    service_name: chosen.name, // kept so the booking still reads correctly if the service is renamed or deleted
    status: "new",
    ip_hash: ipHash,
    created_at: new Date(now).toISOString(),
  };
  await bookings.insertOne(booking);
  delete booking._id;
  delete booking.ip_hash;
  // Email after responding so the visitor isn't kept waiting on the mail server.
  after(() => sendBookingEmails(booking));
  return NextResponse.json(booking, { status: 201 });
}

export async function GET(request) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);
  const bookings = await (await getDatabase()).collection("bookings")
    .find({}, { projection: { _id: 0, ip_hash: 0 } }).sort({ created_at: -1 }).limit(1000).toArray();
  return NextResponse.json(bookings);
}
