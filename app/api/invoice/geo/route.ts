import { visitorCountry } from "@/lib/invoice";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const override = url.searchParams.get("country");
  if (override && /^[A-Za-z]{2}$/.test(override)) {
    return Response.json({ country: override.toUpperCase() });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  const vercelCountry = request.headers.get("x-vercel-ip-country");
  const country =
    visitorCountry(ip) ||
    (vercelCountry && /^[A-Z]{2}$/.test(vercelCountry) ? vercelCountry : null);

  return Response.json({ country });
}