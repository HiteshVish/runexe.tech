import { lookupGst } from "@/lib/invoice";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const gstin = (url.searchParams.get("gstin") || "").trim().toUpperCase();

  if (!gstin) {
    return Response.json({ ok: false, message: "Missing GSTIN." }, { status: 422 });
  }

  const result = await lookupGst(gstin);
  const status = result.ok ? 200 : 404;
  return Response.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}