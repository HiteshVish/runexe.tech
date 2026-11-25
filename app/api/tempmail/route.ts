import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { TESTMAIL_APIKEY, TESTMAIL_NAMESPACE } from "@/lib/tempmail/testmail-config";
import { checkTempmailRateLimit, normalizeTempmailAction } from "@/lib/tempmail/rate-limit";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, X-CSRF-TOKEN",
};

function json(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(data, {
    status,
    headers: { ...corsHeaders, ...extraHeaders },
  });
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

async function testmailGet(params: Record<string, string | number>, timeout = 20000) {
  const url = "https://api.testmail.app/api/json?" + new URLSearchParams(params as Record<string, string>).toString();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    const body = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(body) as Record<string, unknown>;
    } catch {
      data = {};
    }
    return { ok: true as const, status: res.status, data };
  } catch (e) {
    return { ok: false as const, message: e instanceof Error ? e.message : "Request failed", status: 0 };
  } finally {
    clearTimeout(t);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  return handleAction(req);
}

export async function POST(req: NextRequest) {
  return handleAction(req);
}

async function resolveAction(req: NextRequest): Promise<string> {
  let action = req.nextUrl.searchParams.get("action");
  if (!action) {
    try {
      const body = await req.json().catch(() => ({}));
      if (body && typeof body === "object" && "action" in body) {
        action = String((body as { action: string }).action);
      }
    } catch {
      /* ignore */
    }
  }
  return action || "";
}

async function handleAction(req: NextRequest) {
  const apikey = TESTMAIL_APIKEY;
  const namespace = TESTMAIL_NAMESPACE;

  const action = await resolveAction(req);
  const rateAction = normalizeTempmailAction(action);
  const limit = checkTempmailRateLimit(clientIp(req), rateAction);
  if (!limit.allowed) {
    return json(
      {
        ok: false,
        message: limit.message,
        retryAfterSec: limit.retryAfterSec,
      },
      429,
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  if (action === "generate") {
    const tag = randomBytes(3).toString("hex").toLowerCase();
    return json({
      ok: true,
      namespace,
      tag,
      email: `${namespace}.${tag}@inbox.testmail.app`,
      timestamp_from: Math.round(Date.now()),
    });
  }

  if (action === "inbox") {
    const tag = req.nextUrl.searchParams.get("tag") || "";
    if (!tag) {
      return json({ ok: false, message: "Missing tag." }, 422);
    }
    const limitRaw = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
    const offsetRaw = parseInt(req.nextUrl.searchParams.get("offset") || "0", 10);
    const limit = Math.min(Math.max(limitRaw, 0), 100);
    const offset = Math.max(offsetRaw, 0);

    const params: Record<string, string | number> = {
      apikey,
      namespace,
      tag,
      limit,
      offset,
      from_parsed: "true",
    };
    const ts = req.nextUrl.searchParams.get("timestamp_from");
    if (ts && /^\d+$/.test(ts)) {
      params.timestamp_from = parseInt(ts, 10);
    }

    const res = await testmailGet(params, 20000);
    if (!res.ok || res.status >= 400) {
      return json({ ok: false, message: "Failed to query inbox." }, 502);
    }
    const data = res.data;
    if (data.result !== "success") {
      return json({ ok: false, message: (data.message as string) || "Unexpected API response." }, 502);
    }

    const emails: unknown[] = [];
    const rawEmails = (data.emails as unknown[]) || [];
    for (const raw of rawEmails) {
      if (!raw || typeof raw !== "object") continue;
      const e = raw as Record<string, unknown>;
      const fromParsed = e.from_parsed;
      let first: Record<string, unknown> | null = null;
      if (Array.isArray(fromParsed)) {
        first =
          fromParsed[0] && typeof fromParsed[0] === "object"
            ? (fromParsed[0] as Record<string, unknown>)
            : null;
      } else if (fromParsed && typeof fromParsed === "object" && "address" in (fromParsed as object)) {
        first = fromParsed as Record<string, unknown>;
      }
      const attachments: unknown[] = [];
      for (const a of (e.attachments as unknown[]) || []) {
        if (!a || typeof a !== "object") continue;
        const att = a as Record<string, unknown>;
        attachments.push({
          filename: att.filename ?? "attachment",
          size: att.size != null ? Number(att.size) : null,
          contentType: att.contentType ?? null,
          downloadUrl: att.downloadUrl ?? null,
        });
      }
      emails.push({
        id: e.id ?? e.oid ?? e.messageId ?? null,
        tag: e.tag ?? null,
        from: e.from ?? null,
        from_address: first?.address ?? null,
        from_name: first?.name && first.name !== "" ? first.name : null,
        subject: e.subject ?? "(no subject)",
        text: e.text ?? null,
        html: e.html ?? null,
        spf: e.SPF ?? e.spf ?? null,
        dkim: e.dkim ?? null,
        attachments,
        downloadUrl: e.downloadUrl ?? null,
        timestamp: e.timestamp ?? null,
        raw: e,
      });
    }

    return json({
      ok: true,
      count: Number(data.count ?? emails.length),
      emails,
    });
  }

  return json({ ok: false, message: "Unknown action." }, 400);
}