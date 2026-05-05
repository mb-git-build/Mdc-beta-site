import { NextRequest, NextResponse } from "next/server";

import { getLeadStatuses, isValidLeadStatus, updateLeadStatuses } from "@/lib/form-persistence";
import {
  appendQueueAuditEntries,
  createFailedQueueAuditEntry,
} from "@/lib/form-persistence";
import {
  sanitizeAdminId,
  sanitizeAdminReason,
  sanitizeAdminSource,
  sanitizeAdminStatus,
  sanitizeReturnTo,
} from "@/lib/request-sanitization";
import { readJsonBody } from "@/lib/request-body";
import { buildRetryAfterHeader, checkThrottle, deriveThrottleKey } from "@/lib/request-throttle";

const ADMIN_LEAD_BATCH_STATUS_THROTTLE = {
  limit: 30,
  windowMs: 60000,
};

const ADMIN_LEAD_BATCH_MAX_IDS = 200;

type BlockedBatchTransition = {
  id: string;
  previousStatus: string;
  nextStatus: string;
  error: string;
};

type BatchStatusResult = {
  ok: boolean;
  updated: number;
  missing: string[];
  blocked?: Array<{
    id: string;
    previousStatus: string;
    error: string;
  }>;
  error?: string;
};

type BatchStatusPayload = {
  ids: string[];
  status: string | null;
  source: string | null;
  reason: string | null;
  returnTo: string | null;
};

const MAX_DEBUG_ROWS = 12;

function resolveAdminReturnPath(request: NextRequest, returnTo: string | null) {
  const fallback = new URL("/admin/leads", request.url);
  if (!returnTo) {
    return fallback;
  }

  try {
    const target = new URL(returnTo, request.url);
    if (target.origin !== new URL(request.url).origin) {
      return fallback;
    }

    if (!target.pathname.startsWith("/admin/")) {
      return fallback;
    }

    return target;
  } catch {
    return fallback;
  }
}

function requestReturnToCandidate(request: NextRequest) {
  return sanitizeReturnTo(new URL(request.url).searchParams.get("return_to") || request.headers.get("referer"));
}

export async function POST(request: NextRequest) {
  try {
    const throttle = checkThrottle(
      "admin_lead_batch_status",
      deriveThrottleKey(request.headers),
      ADMIN_LEAD_BATCH_STATUS_THROTTLE,
    );
    if (!throttle.ok) {
      return NextResponse.json(
        { ok: false, updated: 0, missing: [], error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.` },
        {
          status: 429,
          headers: { "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds) },
        },
      );
    }

    const payload = await extractPayload(request);
    if (!payload) {
      return NextResponse.json({ ok: false, updated: 0, missing: [], error: "Invalid batch status payload." }, { status: 400 });
    }

    const source = payload.source || "lead_bulk";

    if (payload.ids.length > ADMIN_LEAD_BATCH_MAX_IDS) {
      await appendQueueAuditEntries([
        createFailedQueueAuditEntry(
          "lead",
          "bulk",
          "Bulk lead status update",
          "unknown",
          payload.status || "invalid",
          `Too many rows selected (${payload.ids.length}).`,
          {
            source,
          },
        ),
      ]);

      return NextResponse.json({ ok: false, updated: 0, missing: [], error: "Too many rows selected." }, { status: 400 });
    }

    if (payload.ids.length === 0) {
      await appendQueueAuditEntries([
        createFailedQueueAuditEntry("lead", "bulk", "Bulk lead status update", "unknown", payload.status || "invalid", "No rows selected.", {
          source,
        }),
      ]);

      return NextResponse.json({ ok: false, updated: 0, missing: [], error: "No rows selected." }, { status: 400 });
    }

    if (!payload.status || !isValidLeadStatus(payload.status)) {
      await appendQueueAuditEntries([
        createFailedQueueAuditEntry(
          "lead",
          "bulk",
          "Bulk lead status update",
          "unknown",
          payload.status || "invalid",
          "Invalid lead status.",
          {
            source,
          },
        ),
      ]);

      return NextResponse.json({ ok: false, updated: 0, missing: [], error: "Invalid lead status." }, { status: 400 });
    }

    const nextStatus = payload.status;

    const result = await updateLeadStatuses(payload.ids, payload.status, {
      source,
      reason: payload.reason || undefined,
    });
    const responseBody: BatchStatusResult = {
      ok: result.ok,
      updated: result.updated,
      missing: result.missing,
      blocked: result.blocked,
    };

    if (requestAcceptsJson(request)) {
      return NextResponse.json(responseBody);
    }

    const redirectPath = resolveAdminReturnPath(request, payload.returnTo);
    const hasBlocked = Boolean(result.blocked && result.blocked.length > 0);

    if (result.missing.length > 0 || hasBlocked) {
      redirectPath.searchParams.set("status_warning", "1");
    }

    if (result.missing.length > 0) {
      redirectPath.searchParams.set("status_missing", JSON.stringify(result.missing));
      redirectPath.searchParams.set(
        "status_error_message",
        "Some selected rows were not found and were skipped."
      );
    }

    if (hasBlocked) {
      const blockedTransitions: BlockedBatchTransition[] = (result.blocked ?? [])
        .slice(0, MAX_DEBUG_ROWS)
        .map((entry) => ({
          id: entry.id,
          previousStatus: entry.previousStatus,
          nextStatus: nextStatus,
          error: entry.error,
        }));

      redirectPath.searchParams.set("status_guard", "1");
      redirectPath.searchParams.set("status_blocked_count", String(result.blocked?.length ?? 0));
      redirectPath.searchParams.set("status_blocked", JSON.stringify(blockedTransitions));
      if (blockedTransitions.length > 0) {
        redirectPath.searchParams.set("status_guard_message", blockedTransitions[0].error);
      }
    }

    if (hasBlocked && result.updated === 0) {
      redirectPath.searchParams.set("status_error_message", "No rows were updated because moderation guardrail blocked transitions.");
    }

    if (!result.ok && result.updated === 0) {
      if (result.missing.length > 0) {
        redirectPath.searchParams.set("status_error", "1");
      } else if (hasBlocked) {
        redirectPath.searchParams.set("status_warning", "1");
      } else {
        redirectPath.searchParams.set("status_error", "1");
      }

      return NextResponse.redirect(redirectPath, { status: 303 });
    }

    return NextResponse.redirect(redirectPath, {
      status: 303,
    });
  } catch (error) {
    console.error("bulk lead status update failed", error);
    return NextResponse.json({ ok: false, updated: 0, missing: [], error: "Unable to update lead statuses." }, { status: 500 });
  }
}

async function extractPayload(request: NextRequest): Promise<BatchStatusPayload | null> {
  const contentType = request.headers.get("content-type") ?? "";
  const requestUrl = new URL(request.url);
  const queryStatus = sanitizeAdminStatus(requestUrl.searchParams.get("status"));
  const querySource = sanitizeAdminSource(requestUrl.searchParams.get("source"));
  const queryReason = requestUrl.searchParams.get("reason");

  if (contentType.includes("application/json")) {
    const parsedBody = await readJsonBody<Record<string, unknown>>(request);
    if (!parsedBody.ok) {
      return null;
    }

    const ids = parseIdList(parsedBody.body?.ids, sanitizeAdminId);
    return {
      ids,
      status: sanitizeAdminStatus(parsedBody.body?.status ?? queryStatus),
      source: sanitizeAdminSource(parsedBody.body?.source ?? querySource),
      reason: sanitizeAdminReason(
        typeof parsedBody.body?.reason === "string"
          ? parsedBody.body?.reason
          : queryReason,
      ),
      returnTo: sanitizeReturnTo(
        typeof parsedBody.body?.return_to === "string"
          ? parsedBody.body.return_to
          : requestReturnToCandidate(request),
      ),
    };
  }

  const formData = await request.formData();
  const ids = parseIdList(formData.getAll("ids"), sanitizeAdminId);
  const statusValue =
    typeof formData.get("status") === "string" ? formData.get("status") : queryStatus;

  return {
    ids,
    status: sanitizeAdminStatus(statusValue),
    source: sanitizeAdminSource(
      typeof formData.get("source") === "string"
        ? formData.get("source")
        : querySource,
    ),
    reason: sanitizeAdminReason(
      typeof formData.get("reason") === "string"
        ? formData.get("reason")
        : queryReason,
    ),
    returnTo: sanitizeReturnTo(
      typeof formData.get("return_to") === "string"
        ? (formData.get("return_to") as string)
        : requestReturnToCandidate(request),
    ),
  };
}

function parseIdList(values: unknown, parser: (value: unknown) => string | null): string[] {
  const unique = new Set<string>();

  if (Array.isArray(values)) {
    for (const value of values) {
      const normalized = parser(value);
      if (!normalized) {
        continue;
      }

      unique.add(normalized);
      if (unique.size >= ADMIN_LEAD_BATCH_MAX_IDS) {
        break;
      }
    }

    return Array.from(unique);
  }

  if (typeof values === "string") {
    const split = values.split(",").map((item) => item.trim()).filter(Boolean);
    for (const value of split) {
      const normalized = parser(value);
      if (!normalized) {
        continue;
      }

      unique.add(normalized);
      if (unique.size >= ADMIN_LEAD_BATCH_MAX_IDS) {
        break;
      }
    }
  }

  return Array.from(unique);
}

function requestAcceptsJson(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json");
}

export function GET() {
  return NextResponse.json({
    allowedStatuses: getLeadStatuses(),
  });
}
