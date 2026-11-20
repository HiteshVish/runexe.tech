import { lookupIfsc, lookupPincode, lookupVat } from "@/lib/invoice";

export const runtime = "nodejs";

const EU_VAT_COUNTRIES = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU",
  "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK", "XI",
];

function validate(type: string, q: string): boolean {
  switch (type) {
    case "ifsc":
      return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(q);
    case "pincode":
      return /^[1-9][0-9]{5}$/.test(q);
    case "vat": {
      if (!/^[A-Z]{2}[A-Z0-9]{2,13}$/.test(q)) return false;
      const country = q.slice(0, 2);
      return EU_VAT_COUNTRIES.includes(country);
    }
    default:
      return false;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = (url.searchParams.get("type") || "").toLowerCase();
  let q = (url.searchParams.get("q") || "").toUpperCase().replace(/[\s.\-]/g, "");

  if (type === "vat" && q.startsWith("GR")) {
    q = "EL" + q.slice(2);
  }

  if (!validate(type, q)) {
    return Response.json({ ok: false, message: "Invalid lookup." }, { status: 422 });
  }

  let result;
  switch (type) {
    case "ifsc":
      result = await lookupIfsc(q);
      break;
    case "pincode":
      result = await lookupPincode(q);
      break;
    case "vat":
      result = await lookupVat(q);
      break;
    default:
      return Response.json({ ok: false, message: "Invalid lookup." }, { status: 422 });
  }

  const status = result.ok ? 200 : result.ok === false && "message" in result ? 404 : 502;
  return Response.json(result, {
    status: result.ok ? 200 : status,
    headers: { "Cache-Control": "no-store" },
  });
}