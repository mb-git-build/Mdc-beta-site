import { NextRequest, NextResponse } from "next/server";

import {
  appendQueueAuditEntries,
  createFailedQueueAuditEntry,
  regenerateVendorClaimTokens,
} from "@/lib/form-persistence";
import {
  sanitizeAdminId,
  sanitizeAdminReason,
  sanitizeAdminSource,
  sanitizeReturnTo,
} from "@/lib/request-sanitization";
import { readJsonBody } from "@/lib/request-body";
import { buildRetryAfterHeader, checkThrottle, deriveThrottleKey } from "@/lib/request-throttle";

const ADMIN_VENDOR_BATCH_CLAIM_TOKEN_THROTTLE = {
  limit: 20,
  windowMs: 60000,
};

const ADMIN_VENDOR_BATCH_CLAIM_TOKEN_MAX_IDS = 200;

type BatchClaimTokenPayload = {
  ids: string[];
  source: string | null;
  reason: string | null;
  returnTo: string | null;
};

function resolveAdminReturnPath(request: NextRequest, returnTo: string | null) {
  const fallback = new URL("/admin/vendor-submissions", request.url);

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

const MAX_TOKEN_ALERT_ROWS = 500;

export async function POST(request: NextRequest) {
  try {
    const throttle = checkThrottle(
      "admin_vendor_batch_claim_token",
      deriveThrottleKey(request.headers),
      ADMIN_VENDOR_BATCH_CLAIM_TOKEN_THROTTLE,
    );

    if (!throttle.ok) {
      return NextResponse.json(
        {
          ok: false,
          updated: 0,
          regenerated: [],
          skipped: [],
          missing: [],
          error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.`,
        },
        {
          status: 429,
          headers: { "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds) },
        },
      );
    }

    const payload = await extractPayload(request);
    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          updated: 0,
          regenerated: [],
          skipped: [],
          missing: [],
          error: "Invalid batch token payload.",
        },
        { status: 400 },
      );
    }

    const source = payload.source || "submission_batch_claim_token";

    if (payload.ids.length > ADMIN_VENDOR_BATCH_CLAIM_TOKEN_MAX_IDS) {
      await appendQueueAuditEntries([
        createFailedQueueAuditEntry(
          "vendor_submission",
          "bulk",
          "Bulk claim token rotation",
          "unknown",
          "unknown",
          `Too many rows selected (${payload.ids.length}).`,
          {
            source,
          },
        ),
      ]);

      return NextResponse.json(
        {
          ok: false,
          updated: 0,
          regenerated: [],
          skipped: [],
          missing: [],
          error: "Too many rows selected.",
        },
        { status: 400 },
      );
    }

    if (payload.ids.length === 0) {
      await appendQueueAuditEntries([
        createFailedQueueAuditEntry(
          "vendor_submission",
          "bulk",
          "Bulk claim token rotation",
          "unknown",
          "unknown",
          "No rows selected.",
          {
            source,
          },
        ),
      ]);

      if (requestAcceptsJson(request)) {
        return NextResponse.json(
          {
            ok: false,
            updated: 0,
            regenerated: [],
            skipped: [],
            missing: [],
            error: "No rows selected.",
          },
          { status: 400 },
        );
      }

      const redirectPath = resolveAdminReturnPath(request, payload.returnTo);
      return NextResponse.redirect(addErrorQuery(redirectPath, "No rows selected."), { status: 303 });
    }

    const result = await regenerateVendorClaimTokens(payload.ids, {
      source,
      reason: payload.reason || undefined,
    });

    if (!result.ok && result.error && result.missing.length === 0 && result.skipped.length === 0) {
      await appendQueueAuditEntries([
        createFailedQueueAuditEntry(
          "vendor_submission",
          "bulk",
          "Bulk claim token rotation",
          "unknown",
          "unknown",
          result.error,
          {
            source,
          },
        ),
      ]);
    }

    if (requestAcceptsJson(request)) {
      return NextResponse.json(result);
    }

    const redirectPath = resolveAdminReturnPath(request, payload.returnTo);
    return NextResponse.redirect(addResultSummary(redirectPath, result), { status: 303 });
  } catch (error) {
    console.error("batch claim token rotation failed", error);
    return NextResponse.json({ ok: false, updated: 0, regenerated: [], skipped: [], missing: [], error: "Unable to rotate claim tokens." }, { status: 500 });
  }
}

function addResultSummary(
  redirectPath: URL,
  result: {
    ok: boolean;
    regenerated: string[];
    skipped: string[];
    missing: string[];
    updated: number;
    error?: string;
  },
) {
  const entries: string[] = [];

  if (result.updated > 0) {
    entries.push(`Rotated ${result.updated} token(s).`);
  }

  if (result.skipped.length > 0) {
    entries.push(`Skipped ${result.skipped.length} non-claim row(s).`);
  }

  if (result.missing.length > 0) {
    const shown = result.missing.slice(0, MAX_TOKEN_ALERT_ROWS).join(", ");
    entries.push(`Missing row(s): ${shown}${result.missing.length > MAX_TOKEN_ALERT_ROWS ? "…" : ""}`);
  }

  const message = entries.length > 0 ? entries.join(" ") : result.error ?? "Token rotation completed without changes.";

  if (result.ok) {
    redirectPath.searchParams.set("status_warning", "1");
    redirectPath.searchParams.set("status_warning_message", message);
  } else {
    redirectPath.searchParams.set("status_error", "1");
    redirectPath.searchParams.set("status_error_message", message);
  }

  return redirectPath;
}

function addErrorQuery(redirectPath: URL, message: string) {
  redirectPath.searchParams.set("status_error", "1");
  redirectPath.searchParams.set("status_error_message", message);
  return redirectPath;
}

async function extractPayload(request: NextRequest): Promise<BatchClaimTokenPayload | null> {
  const contentType = request.headers.get("content-type") ?? "";
  const requestUrl = new URL(request.url);
  const querySource = sanitizeAdminSource(requestUrl.searchParams.get("source"));
  const queryReason = requestUrl.searchParams.get("reason");

  if (contentType.includes("application/json")) {
    const parsedBody = await readJsonBody<Record<string, unknown>>(request);
    if (!parsedBody.ok) {
      return null;
    }

    return {
      ids: parseIdList(parsedBody.body?.ids, sanitizeAdminId),
      source: sanitizeAdminSource(parsedBody.body?.source || querySource),
      reason: sanitizeAdminReason(
        typeof parsedBody.body?.reason === "string"
          ? parsedBody.body.reason
          : queryReason,
      ),
      returnTo: sanitizeReturnTo(
        typeof parsedBody.body?.return_to === "string"
          ? parsedBody.body?.return_to
          : requestReturnToCandidate(request),
      ),
    };
  }

  const formData = await request.formData();
  const ids = parseIdList(formData.getAll("ids"), sanitizeAdminId);
  const sourceValue = sanitizeAdminSource(formData.get("source"));
  const reasonValue = sanitizeAdminReason(formData.get("reason"));
  const returnToValue = sanitizeReturnTo(
    typeof formData.get("return_to") === "string"
      ? (formData.get("return_to") as string)
      : requestReturnToCandidate(request),
  );

  return {
    ids,
    source: sourceValue || querySource,
    reason: reasonValue,
    returnTo: returnToValue,
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
      if (unique.size >= ADMIN_VENDOR_BATCH_CLAIM_TOKEN_MAX_IDS) {
        break;
      }
    }

    return Array.from(unique);
  }

  if (typeof values === "string") {
    const split = values
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    for (const item of split) {
      const normalized = parser(item);
      if (!normalized) {
        continue;
      }

      unique.add(normalized);
      if (unique.size >= ADMIN_VENDOR_BATCH_CLAIM_TOKEN_MAX_IDS) {
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
