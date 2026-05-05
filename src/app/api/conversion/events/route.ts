import { NextRequest, NextResponse } from "next/server";

import { getConversionEvents, getConversionSummary, recordConversionEvent, type PublicConversionEventPayload } from "@/lib/conversion-events";
import { readJsonBody } from "@/lib/request-body";
import { buildRetryAfterHeader, checkThrottle, deriveThrottleKey } from "@/lib/request-throttle";

const CONVERSION_EVENT_THROTTLE = {
  limit: 120,
  windowMs: 60000,
};

const CONVERSION_QUERY_LIMIT = 300;

function isPlainObject(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function parseLimit(rawValue: string | null) {
  const parsed = Number.parseInt(rawValue ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 200;
  }

  return Math.max(1, Math.min(parsed, CONVERSION_QUERY_LIMIT));
}

function parseHorizonHours(rawValue: string | null) {
  const parsed = Number.parseInt(rawValue ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return 24;
  }

  return Math.max(1, Math.min(parsed, 168));
}

export async function POST(request: NextRequest) {
  try {
    const throttle = checkThrottle("conversion_event", deriveThrottleKey(request.headers), CONVERSION_EVENT_THROTTLE);

    if (!throttle.ok) {
      return NextResponse.json(
        { ok: false, error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds) } },
      );
    }

    const parsedBody = await readJsonBody<unknown>(request, { maxBytes: 24_000 });
    if (!parsedBody.ok) {
      return NextResponse.json({ ok: false, error: parsedBody.error }, { status: parsedBody.status });
    }

    if (!isPlainObject(parsedBody.body)) {
      return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
    }

    const payload = parsedBody.body as PublicConversionEventPayload;
    if (typeof payload.funnel !== "string" || typeof payload.eventName !== "string") {
      return NextResponse.json({ ok: false, error: "Missing conversion funnel or event name." }, { status: 400 });
    }

    const result = await recordConversionEvent({
      ...payload,
      source: payload.source || getClientIp(request),
      reference: payload.reference,
      status: payload.status,
      note: payload.note,
      submissionId: payload.submissionId,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("conversion event failed", error);
    return NextResponse.json({ ok: false, error: "Unable to record conversion event." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const throttle = checkThrottle("conversion_event_read", deriveThrottleKey(request.headers), {
    limit: 60,
    windowMs: 60000,
  });

  if (!throttle.ok) {
    return NextResponse.json(
      { ok: false, error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds) } },
    );
  }

  const params = request.nextUrl.searchParams;
  const mode = (params.get("mode") ?? "summary").toLowerCase();
  const limit = parseLimit(params.get("limit"));

  if (mode === "events") {
    const rows = await getConversionEvents(limit);
    return NextResponse.json({ ok: true, rows });
  }

  const horizonHours = parseHorizonHours(params.get("horizonHours"));
  const summary = await getConversionSummary({
    horizonHours,
  });
  return NextResponse.json({ ok: true, ...summary });
}
