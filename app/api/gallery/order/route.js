import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/server/auth";
import { isIdList, portfolioCollections, saveOrder } from "@/lib/server/portfolio";
import { apiError, requestJson } from "@/lib/server/http";

export const runtime = "nodejs";

// Body: { ids: [...] } — the complete photo list in its new display order.
export async function PUT(request) {
  const admin = await getAdminFromRequest(request);
  if (admin.error) return apiError(admin.error, admin.status);
  const body = await requestJson(request);
  if (!isIdList(body?.ids)) return apiError("ids must be a list of unique photo ids.");
  await saveOrder((await portfolioCollections()).photos, body.ids);
  return NextResponse.json({ ok: true });
}
