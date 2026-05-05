import { NextRequest, NextResponse } from "next/server";

import {
  appendQueueAuditEntries,
  createFailedQueueAuditEntry,
  regenerateVendorClaimToken,
} from "@/lib/form-persistence";
import {
  sanitizeAdminId,
  sanitizeReturnTo,
} from "@/lib/request-sanitization";
import { buildRetryAfterHeader, checkThrottle, deriveThrottleKey } from "@/lib/request-throttle";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ADMIN_VENDOR_TOKEN_THROTTLE = {
  limit: 40,
  windowMs: 60000,
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

function extractReturnTo(request: NextRequest): string | null {
  const body = new URLSearchParams(new URL(request.url).search);
  return sanitizeReturnTo(body.get("return_to") || requestReturnToCandidate(request));
}

export async function POST(request: NextRequest, context: RouteContext) {
  const rawId = (await context.params).id;
  const id = sanitizeAdminId(rawId);

  if (!id) {
    await appendQueueAuditEntries([
      createFailedQueueAuditEntry(
        "vendor_submission",
        "invalid",
        "Invalid claim token row id",
        "unknown",
        "unknown",
        "Invalid row id.",
        {
          source: "admin_claim_token_regen",
        },
      ),
    ]);

    return NextResponse.json({ ok: false, error: "Invalid row id." }, { status: 400 });
  }

  try {
    const requestAcceptsJson = requestAcceptsJsonHeader(request);
    const returnTo = extractReturnTo(request);

    const throttle = checkThrottle(
      "admin_vendor_claim_token",
      `${deriveThrottleKey(request.headers)}:${id}`,
      ADMIN_VENDOR_TOKEN_THROTTLE,
    );

    if (!throttle.ok) {
      const message = `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.`;
      if (requestAcceptsJson) {
        return NextResponse.json({ ok: false, error: message }, { status: 429, headers: { "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds) } });
      }

      const redirectPath = resolveAdminReturnPath(request, returnTo);
      redirectPath.searchParams.set("status_error", "1");
      redirectPath.searchParams.set("status_error_message", message);
      return NextResponse.redirect(redirectPath, { status: 303 });
    }

    const formData = await request.formData().catch(() => null);
    const maybeReturnTo =
      typeof formData?.get("return_to") === "string" ? sanitizeReturnTo(formData.get("return_to")) : null;
    const finalReturnTo = maybeReturnTo || returnTo;

    const result = await regenerateVendorClaimToken(id, {
      source: "admin_claim_token_regen",
    });

    if (!result.ok) {
      if (requestAcceptsJson) {
        return NextResponse.json({ ok: false, error: result.error ?? "Unable to rotate claim token." }, { status: 400 });
      }

      const redirectPath = resolveAdminReturnPath(request, finalReturnTo);
      redirectPath.searchParams.set("status_error", "1");
      redirectPath.searchParams.set("status_error_message", result.error ?? "Unable to rotate claim token.");
      return NextResponse.redirect(redirectPath, { status: 303 });
    }

    if (requestAcceptsJson) {
      return NextResponse.json({ ok: true, submission: result.submission });
    }

    const redirectPath = resolveAdminReturnPath(request, finalReturnTo);
    redirectPath.searchParams.set("status_warning", "1");
    redirectPath.searchParams.set("status_warning_message", "Claim token rotated successfully.");
    return NextResponse.redirect(redirectPath, { status: 303 });
  } catch (error) {
    console.error("claim token rotation failed", error);
    return NextResponse.json({ ok: false, error: "Unable to rotate claim token." }, { status: 500 });
  }
}

function requestAcceptsJsonHeader(request: NextRequest) {
  return (request.headers.get("accept") ?? "").includes("application/json");
}
