/**
 * Per-IP fixed-window rate limits for tempmail API actions.
 * In-memory only: effective per serverless instance on Vercel, not global.
 */

export type TempmailRateAction = "generate" | "inbox" | "unknown";

type WindowRule = { limit: number; windowMs: number };

const RULES: Record<TempmailRateAction, WindowRule> = {
  generate: { limit: 10, windowMs: 60 * 60 * 1000 },
  inbox: { limit: 40, windowMs: 60 * 1000 },
  unknown: { limit: 120, windowMs: 60 * 1000 },
};

type Bucket = { count: number; windowStartMs: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function pruneBuckets(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, b] of buckets) {
    const rule = RULES[key.split(":")[0] as TempmailRateAction] || RULES.unknown;
    if (now - b.windowStartMs > rule.windowMs * 2) buckets.delete(key);
    if (buckets.size <= MAX_BUCKETS * 0.9) break;
  }
}

export function normalizeTempmailAction(action: string): TempmailRateAction {
  if (action === "generate" || action === "inbox") return action;
  return "unknown";
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number; message: string };

export function checkTempmailRateLimit(
  clientIp: string,
  action: TempmailRateAction,
): RateLimitResult {
  const rule = RULES[action] || RULES.unknown;
  const ip = clientIp || "unknown";
  const key = `${action}:${ip}`;
  const now = Date.now();
  pruneBuckets(now);

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStartMs >= rule.windowMs) {
    bucket = { count: 0, windowStartMs: now };
    buckets.set(key, bucket);
  }

  if (bucket.count >= rule.limit) {
    const retryAfterMs = rule.windowMs - (now - bucket.windowStartMs);
    const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return {
      allowed: false,
      retryAfterSec,
      message: `Too many requests. Try again in ${retryAfterSec} second${retryAfterSec === 1 ? "" : "s"}.`,
    };
  }

  bucket.count += 1;
  return { allowed: true };
}