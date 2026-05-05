import { NextRequest, NextResponse } from "next/server";

import {
  appendQueueAuditEntries,
  createFailedQueueAuditEntry,
  isValidLeadStatus,
  updateLeadStatus,
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

const ADMIN_LEAD_STATUS_THROTTLE = {
  limit: 60,
  windowMs: 60000,
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function POST(request: NextRequest, context: RouteContext) {
  const rawId = (await context.params).id;
  const id = sanitizeAdminId(rawId);

  if (!id) {
    return NextResponse.json({ ok: false, error: "Invalid row id." }, { status: 400 });
  }

  const throttle = checkThrottle(
    "admin_lead_status",
    `${deriveThrottleKey(request.headers)}:${id}`,
    ADMIN_LEAD_STATUS_THROTTLE,
  );

  if (!throttle.ok) {
    const retryAfterSeconds = throttle.retryAfterSeconds;
    return NextResponse.json(
      { ok: false, error: `Rate limit exceeded. Try again in ${retryAfterSeconds}s.` },
      {
        status: 429,
        headers: { "Retry-After": buildRetryAfterHeader(retryAfterSeconds) },
      },
    );
  }

  try {
    const payload = await extractPayload(request);

    if (!payload || !payload.status || !isValidLeadStatus(payload.status)) {
      await appendQueueAuditEntries([
        createFailedQueueAuditEntry(
          "lead",
          id,
          id,
          "unknown",
          payload?.status ?? "invalid",
          "Invalid lead status.",
          {
            source: payload?.source || "lead_single",
          },
        ),
      ]);

      return NextResponse.json({ ok: false, error: "Invalid lead status." }, { status: 400 });
    }

    const result = await updateLeadStatus(id, payload.status, {
      source: payload.source || "lead_single",
      reason: payload.reason || undefined,
    });

    if (!result.ok) {
      if (
        !requestAcceptsJson(request) &&
        typeof result.error === "string" &&
        result.error.toLowerCase().includes("repeated transition")
      ) {
        const redirectPath = resolveAdminReturnPath(request, payload.returnTo);
        redirectPath.searchParams.set("status_error", "1");
        redirectPath.searchParams.set("status_guard", "1");
        redirectPath.searchParams.set("status_error_message", result.error);
        return NextResponse.redirect(redirectPath, { status: 303 });
      }

      return NextResponse.json({ ok: false, error: result.error ?? "Unable to update lead." }, { status: 400 });
    }

    if (requestAcceptsJson(request)) {
      return NextResponse.json({ ok: true, submission: result.submission });
    }

    return NextResponse.redirect(resolveAdminReturnPath(request, payload.returnTo), { status: 303 });
  } catch (error) {
    console.error("lead status update failed", error);
    return NextResponse.json({ ok: false, error: "Unable to update lead status." }, { status: 500 });
  }
}

type LeadUpdatePayload = {
  status: string | null;
  source: string | null;
  reason: string | null;
  returnTo: string | null;
};

async function extractPayload(request: NextRequest): Promise<LeadUpdatePayload | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const parsedBody = await readJsonBody<Record<string, unknown>>(request);
    if (!parsedBody.ok) {
      return null;
    }

    return {
      status: sanitizeAdminStatus(parsedBody.body?.status),
      source: sanitizeAdminSource(parsedBody.body?.source),
      reason: sanitizeAdminReason(parsedBody.body?.reason),
      returnTo: sanitizeReturnTo(
        typeof parsedBody.body?.return_to === "string"
          ? parsedBody.body.return_to
          : parseReturnToCandidate(request),
      ),
    };
  }

  const formData = await request.formData();

  return {
    status: sanitizeAdminStatus(formData.get("status")),
    source: sanitizeAdminSource(formData.get("source")),
    reason: sanitizeAdminReason(formData.get("reason")),
    returnTo: sanitizeReturnTo(
      typeof formData.get("return_to") === "string"
        ? formData.get("return_to")
        : parseReturnToCandidate(request),
    ),
  };
}

function parseReturnToCandidate(request: NextRequest) {
  return sanitizeReturnTo(new URL(request.url).searchParams.get("return_to") || request.headers.get("referer"));
}

function requestAcceptsJson(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json");
}
