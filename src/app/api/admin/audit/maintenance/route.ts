import { NextRequest, NextResponse } from "next/server";

import {
  getQueueAuditSummary,
  getConfiguredAuditRetentionLimit,
  pruneQueueAudit,
} from "@/lib/form-persistence";
import { buildRetryAfterHeader, checkThrottle, deriveThrottleKey } from "@/lib/request-throttle";

type PrunePayload = {
  maxAgeDays: number | null;
  dryRun: boolean;
};

const ADMIN_AUDIT_GET_THROTTLE = {
  limit: 30,
  windowMs: 60000,
};

const ADMIN_AUDIT_MAINTENANCE_THROTTLE = {
  limit: 6,
  windowMs: 60000,
};

const MAX_AUDIT_MAINTENANCE_AGE_DAYS = 1825;

function parseInteger(value: unknown, fallback: number | null = null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : fallback;
  }

  const parsed = Number.parseInt(typeof value === "string" ? value : "", 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function parseBoolean(value: string | null, fallback = false) {
  if (value === null) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export async function GET(request: NextRequest) {
  const throttle = checkThrottle("admin_audit_maintenance_status", deriveThrottleKey(request.headers), ADMIN_AUDIT_GET_THROTTLE);

  if (!throttle.ok) {
    return NextResponse.json(
      { ok: false, error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.` },
      {
        status: 429,
        headers: { "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds) },
      },
    );
  }

  const summary = await getQueueAuditSummary();
  const retentionLimit = getConfiguredAuditRetentionLimit();

  return NextResponse.json({
    total: summary.total,
    newestUpdatedAt: summary.newestUpdatedAt,
    oldestUpdatedAt: summary.oldestUpdatedAt,
    retentionLimit,
    message: `Configured retention target: ${retentionLimit}`,
  });
}

export async function POST(request: NextRequest) {
  const throttle = checkThrottle("admin_audit_maintenance", deriveThrottleKey(request.headers), ADMIN_AUDIT_MAINTENANCE_THROTTLE);

  if (!throttle.ok) {
    return NextResponse.json(
      { ok: false, error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.` },
      {
        status: 429,
        headers: { "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds) },
      },
    );
  }

  try {
    const requestUrl = new URL(request.url);
    const contentType = request.headers.get("content-type") ?? "";

    let maxAgeDays: number | null = null;
    let dryRun = false;

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      const payload = {
        maxAgeDays: parseInteger(body?.maxAgeDays ?? null),
        dryRun:
          typeof body?.dryRun === "boolean"
            ? body.dryRun
            : parseBoolean(typeof body?.dryRun === "string" ? body.dryRun : null, false),
      } as PrunePayload;

      maxAgeDays = payload.maxAgeDays;
      dryRun = payload.dryRun;
    } else {

      const formData = await request.formData();
      maxAgeDays = parseInteger(formData.get("maxAgeDays")?.toString() ?? null, null);
      dryRun = parseBoolean(formData.get("dryRun")?.toString() ?? null, false);
    }

    if (maxAgeDays === null || Number.isNaN(maxAgeDays) || maxAgeDays < 1) {
      maxAgeDays = parseInteger(requestUrl.searchParams.get("maxAgeDays"), null);
    }

    if (maxAgeDays === null || Number.isNaN(maxAgeDays) || maxAgeDays < 1) {
      return NextResponse.json({ ok: false, error: "maxAgeDays must be a positive integer." }, { status: 400 });
    }

    if (maxAgeDays > MAX_AUDIT_MAINTENANCE_AGE_DAYS) {
      return NextResponse.json(
        { ok: false, error: `maxAgeDays must be <= ${MAX_AUDIT_MAINTENANCE_AGE_DAYS}.` },
        { status: 400 },
      );
    }

    const before = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();
    const queryDryRun = parseBoolean(requestUrl.searchParams.get("dryRun"), false);
    dryRun = dryRun || queryDryRun;

    const result = await pruneQueueAudit({ before, dryRun });

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        ok: result.ok,
        dryRun,
        maxAgeDays,
        requestedBefore: before,
        removed: result.removed,
        retained: result.retained,
        totalBefore: result.totalBefore,
        totalAfter: result.totalAfter,
        retentionLimit: result.retentionLimit,
      },
      {
        headers: dryRun
          ? {}
          : {
              "cache-control": "no-store",
            },
      },
    );
  } catch (error) {
    console.error("audit retention maintenance failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to perform audit retention maintenance.",
      },
      { status: 500 },
    );
  }
}
