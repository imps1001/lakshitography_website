import { NextResponse } from "next/server";

// `extra` carries structured details, e.g. { errors: { phone: "…" } } for per-field form messages.
export function apiError(detail, status = 400, extra = {}) {
  return NextResponse.json({ detail, ...extra }, { status });
}

export async function requestJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
