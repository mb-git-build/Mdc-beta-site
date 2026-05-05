type ThrottlePolicy = {
  limit: number;
  windowMs: number;
};

type ThrottleBucket = {
  timestamps: number[];
};

export type ThrottleResult = {
  ok: boolean;
  scope: string;
  key: string;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  limit: number;
  windowMs: number;
};

const BUCKET_CLEANUP_LIMIT = 3000;
const buckets = new Map<string, ThrottleBucket>();

export function normalizeThrottleScope(value: string) {
  return (value ?? "").trim().replace(/\s+/g, "-").toLowerCase();
}

function now() {
  return Date.now();
}

function makeKey(scope: string, requestKey: string) {
  const normalizedScope = normalizeThrottleScope(scope);
  const normalizedKey = (requestKey ?? "anonymous").trim().slice(0, 180).replace(/\s+/g, "-").toLowerCase();

  return `${normalizedScope}::${normalizedKey}`;
}

function normalizeIp(value: string) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return "anonymous";
  }

  const firstIp = trimmed.split(",")[0]?.trim();
  if (!firstIp) {
    return "anonymous";
  }

  return firstIp.toLowerCase();
}

export function deriveThrottleKey(headers: Headers, fallback = "anonymous") {
  const forwarded = headers.get("x-forwarded-for") ?? "";
  const realIp = headers.get("x-real-ip") ?? "";
  const cfIp = headers.get("cf-connecting-ip") ?? "";

  return normalizeIp(forwarded) || normalizeIp(realIp) || normalizeIp(cfIp) || (fallback || "anonymous");
}

export function checkThrottle(scope: string, requestKey: string, policy: ThrottlePolicy): ThrottleResult {
  const resolvedLimit = Math.max(1, Math.round(policy.limit));
  const resolvedWindow = Math.max(1000, Math.round(policy.windowMs));
  const key = makeKey(scope, requestKey);

  const bucket = buckets.get(key) ?? { timestamps: [] };
  const nowMs = now();

  const validWindowStart = nowMs - resolvedWindow;
  const active = bucket.timestamps.filter((timestamp) => timestamp >= validWindowStart);

  if (active.length >= resolvedLimit) {
    const oldest = active[0] ?? nowMs;
    const resetAt = oldest + resolvedWindow;
    const retryAfterMs = Math.max(0, resetAt - nowMs);
    return {
      ok: false,
      scope: scope,
      key,
      limit: resolvedLimit,
      windowMs: resolvedWindow,
      remaining: 0,
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  active.push(nowMs);
  bucket.timestamps = active;
  buckets.set(key, bucket);

  if (buckets.size > BUCKET_CLEANUP_LIMIT) {
    pruneBuckets(nowMs - resolvedWindow);
  }

  return {
    ok: true,
    scope,
    key,
    limit: resolvedLimit,
    windowMs: resolvedWindow,
    remaining: Math.max(0, resolvedLimit - active.length),
    resetAt: nowMs + resolvedWindow,
    retryAfterSeconds: 0,
  };
}

function pruneBuckets(cutoff: number) {
  for (const [key, bucket] of buckets.entries()) {
    bucket.timestamps = bucket.timestamps.filter((timestamp) => timestamp >= cutoff);

    if (bucket.timestamps.length === 0) {
      buckets.delete(key);
    }
  }
}

export function buildRetryAfterHeader(retryAfterSeconds: number) {
  return String(Math.max(1, Math.ceil(retryAfterSeconds)));
}

