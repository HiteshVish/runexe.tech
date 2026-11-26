export const dynamic = "force-dynamic";

type IspLookup = { isp?: string; org?: string; as?: string };

function firstHeader(req: Request, names: string[]): string | null {
  for (const name of names) {
    const v = req.headers.get(name);
    if (v?.trim()) return v.trim();
  }
  return null;
}

function clientIp(req: Request): string {
  const cf = firstHeader(req, ["cf-connecting-ip"]);
  if (cf) return cf.split(",")[0].trim();

  const xff = firstHeader(req, ["x-forwarded-for"]);
  if (xff) return xff.split(",")[0].trim();

  const real = firstHeader(req, ["x-real-ip"]);
  if (real) return real.split(",")[0].trim();

  return "127.0.0.1";
}

function normalizeIp(ip: string): string {
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}

function isLocal(ip: string): boolean {
  const v = normalizeIp(ip);
  return (
    v === "127.0.0.1" ||
    v === "::1" ||
    v === "0.0.0.0" ||
    v === "localhost" ||
    v.startsWith("10.") ||
    v.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(v)
  );
}

async function lookupIsp(ip: string): Promise<IspLookup> {
  if (isLocal(ip)) return {};
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1500);
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return {};
    const data = (await res.json()) as {
      org?: string;
      asn?: string | number;
      error?: boolean;
    };
    if (data.error) return {};
    return {
      isp: data.org || undefined,
      org: data.org || undefined,
      as: data.asn != null ? String(data.asn) : undefined,
    };
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const ip = normalizeIp(clientIp(request));
  const local = isLocal(ip);
  const city = firstHeader(request, ["x-vercel-ip-city", "cf-ipcity"]);
  const region = firstHeader(request, ["x-vercel-ip-country-region", "cf-region"]);
  const country = firstHeader(request, ["x-vercel-ip-country", "cf-ipcountry"]);

  const isp = local ? {} : await lookupIsp(ip);

  const locationParts = local
    ? ["Local Network"]
    : [city, region, country].filter(Boolean).map((p) => decodeURIComponent(p!.replace(/\+/g, " ")));

  return Response.json(
    {
      ip: local ? "127.0.0.1" : ip,
      isp: isp.isp ?? (local ? "Local Network" : null),
      asn: isp.as ?? null,
      city: local ? null : city ? decodeURIComponent(city.replace(/\+/g, " ")) : null,
      region: local ? null : region,
      country: local ? null : country,
      location: locationParts.join(", ") || null,
      serverNode: process.env.VERCEL_REGION || process.env.FLY_REGION || "runexe.tech",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );
}
