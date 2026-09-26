import { NextResponse } from "next/server";
import { listPortfolio, portfolioCollections } from "@/lib/server/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: everything the site needs to render photos — categories and photos, both in admin order.
export async function GET() {
  return NextResponse.json(await listPortfolio(await portfolioCollections()), {
    headers: { "Cache-Control": "no-store" },
  });
}
