import { PAYLOAD_LENGTH_WARN, VPA_REGEX } from "./constants";
import type { PayloadResult, QrFormState, QrType, WifiSecurity } from "./types";

function ok(payload: string, warnings: string[] = []): PayloadResult {
  const w = [...warnings];
  if (payload.length > PAYLOAD_LENGTH_WARN) {
    w.push(
      `This content is long (${payload.length} characters). Very dense QR codes can be harder to scan. Try shortening text or using a higher error-correction level.`,
    );
  }
  return { payload, errors: [], warnings: w };
}

function fail(errors: string[]): PayloadResult {
  return { payload: null, errors, warnings: [] };
}

function isBlank(s: string): boolean {
  return !s.trim();
}

/** Escape WiFi QR special characters per ZXing format. */
export function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:\"])/g, "\\$1");
}

export function normalizeUrl(raw: string): { url: string | null; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { url: null, error: "Enter a URL." };
  let url = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
    url = `https://${url}`;
  }
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) {
      return { url: null, error: "Only http and https URLs are supported." };
    }
    return { url: u.toString() };
  } catch {
    return { url: null, error: "Enter a valid URL." };
  }
}

export function normalizePhoneDigits(country: string, local: string): { digits: string | null; error?: string } {
  const cc = country.replace(/\D/g, "");
  let num = local.replace(/[\s\-+().]/g, "");
  if (num.startsWith("00")) num = num.slice(2);
  if (num.startsWith(cc) && cc.length > 0) {
    num = num.slice(cc.length);
  }
  num = num.replace(/^0+/, "");
  num = num.replace(/\D/g, "");
  if (!num) return { digits: null, error: "Enter a phone number." };
  const full = cc + num;
  if (full.length < 8 || full.length > 15) {
    return { digits: null, error: "Phone number looks too short or too long." };
  }
  return { digits: full };
}

export function parseAmount(raw: string): { value: string | null; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null };
  const normalized = trimmed.replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return { value: null, error: "Amount must be a positive number with at most 2 decimal places." };
  }
  const n = parseFloat(normalized);
  if (!(n > 0)) return { value: null, error: "Amount must be greater than zero." };
  return { value: normalized };
}

export function buildUrlPayload(url: string): PayloadResult {
  const { url: resolved, error } = normalizeUrl(url);
  if (!resolved) return fail([error ?? "Invalid URL."]);
  return ok(resolved);
}

export function buildTextPayload(text: string): PayloadResult {
  const trimmed = text.trim();
  if (!trimmed) return fail(["Enter some text."]);
  return ok(text);
}

export function buildWifiPayload(
  ssid: string,
  password: string,
  security: WifiSecurity,
  hidden: boolean,
): PayloadResult {
  const s = ssid.trim();
  if (!s) return fail(["Network name (SSID) is required."]);
  const t = security === "nopass" ? "nopass" : security;
  const p = security === "nopass" ? "" : password;
  if (security !== "nopass" && !p.trim()) {
    return fail(["Password is required for this security type."]);
  }
  const payload =
    `WIFI:T:${t};S:${escapeWifiField(s)};` +
    (security === "nopass" ? "" : `P:${escapeWifiField(p)};`) +
    `H:${hidden ? "true" : "false"};;`;
  return ok(payload);
}

export function buildWhatsappPayload(country: string, phone: string, message: string): PayloadResult {
  const { digits, error } = normalizePhoneDigits(country, phone);
  if (!digits) return fail([error ?? "Invalid phone number."]);
  let url = `https://wa.me/${digits}`;
  const msg = message.trim();
  if (msg) url += `?text=${encodeURIComponent(msg)}`;
  return ok(url);
}

export function buildUpiPayload(vpa: string, name: string, amount: string, note: string): PayloadResult {
  const pa = vpa.trim().toLowerCase();
  if (!pa) return fail(["UPI ID (VPA) is required."]);
  if (!VPA_REGEX.test(pa)) {
    return fail(["Enter a valid UPI ID, for example shopname@okhdfcbank."]);
  }
  const pn = name.trim();
  if (!pn) return fail(["Payee name is required."]);
  const params = new URLSearchParams();
  params.set("pa", pa);
  params.set("pn", pn);
  params.set("cu", "INR");
  const warnings: string[] = [];
  if (amount.trim()) {
    const { value, error } = parseAmount(amount);
    if (error) return fail([error]);
    if (value) params.set("am", value);
  } else {
    warnings.push(
      "Amount is blank — customers can enter the amount when they scan. This is typical for a reusable shop QR.",
    );
  }
  const tn = note.trim();
  if (tn) params.set("tn", tn);
  const payload = `upi://pay?${params.toString()}`;
  return ok(payload, warnings);
}

export function buildEmailPayload(to: string, subject: string, body: string): PayloadResult {
  const addr = to.trim();
  if (!addr) return fail(["Email address is required."]);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return fail(["Enter a valid email address."]);
  const qs = new URLSearchParams();
  if (subject.trim()) qs.set("subject", subject.trim());
  if (body.trim()) qs.set("body", body.trim());
  const q = qs.toString();
  return ok(q ? `mailto:${addr}?${q}` : `mailto:${addr}`);
}

export function buildTelPayload(number: string): PayloadResult {
  const digits = number.replace(/[^\d+]/g, "");
  if (digits.length < 3) return fail(["Enter a phone number to call."]);
  return ok(`tel:${digits}`);
}

export function buildSmsPayload(number: string, body: string): PayloadResult {
  const digits = number.replace(/[^\d+]/g, "");
  if (digits.length < 3) return fail(["Enter a phone number for SMS."]);
  const msg = body.trim();
  if (msg) return ok(`smsto:${digits}:${msg}`);
  return ok(`smsto:${digits}`);
}

export function resolvePayload(type: QrType, form: QrFormState): PayloadResult {
  switch (type) {
    case "url":
      return buildUrlPayload(form.url);
    case "text":
      return buildTextPayload(form.text);
    case "wifi":
      return buildWifiPayload(form.wifiSsid, form.wifiPassword, form.wifiSecurity, form.wifiHidden);
    case "whatsapp":
      return buildWhatsappPayload(form.whatsappCountry, form.whatsappPhone, form.whatsappMessage);
    case "upi":
      return buildUpiPayload(form.upiVpa, form.upiName, form.upiAmount, form.upiNote);
    case "email":
      return buildEmailPayload(form.emailTo, form.emailSubject, form.emailBody);
    case "tel":
      return buildTelPayload(form.telNumber);
    case "sms":
      return buildSmsPayload(form.smsNumber, form.smsBody);
    default:
      return fail(["Unknown QR type."]);
  }
}