import { NextRequest, NextResponse } from "next/server";

import { getQueueAudit } from "@/lib/form-persistence";
import { buildRetryAfterHeader, checkThrottle, deriveThrottleKey } from "@/lib/request-throttle";

type QueueFilter = "lead" | "vendor_submission";
type ExportFormat = "csv" | "json";

type QueueEventExportRow = {
  eventId: string;
  queueType: string;
  itemId: string;
  itemLabel: string;
  actor: string;
  source: string;
  reason: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
};

const DEFAULT_EXPORT_LIMIT = 500;
const AUDIT_SEARCH_MAX_LENGTH = 180;
const AUDIT_FILTER_VALUE_MAX_LENGTH = 120;
const AUDIT_CSV_MAX_LENGTH = 1200;
const ADMIN_AUDIT_EXPORT_THROTTLE = {
  limit: 20,
  windowMs: 60000,
};

function sanitizeCsvField(value: string, maxLength = AUDIT_CSV_MAX_LENGTH) {
  const truncated = value.slice(0, maxLength);
  const safe = /^[=+\-@]/.test(truncated) ? `'${truncated}` : truncated;

  if (!safe.includes(",") && !safe.includes("\n") && !safe.includes('"')) {
    return safe;
  }

  return `"${safe.replaceAll('"', '""')}"`;
}

function toCsvRow(row: QueueEventExportRow): string {
  return [
    row.eventId,
    row.queueType,
    row.itemId,
    row.itemLabel,
    row.actor,
    row.source,
    row.reason,
    row.previousStatus,
    row.newStatus,
    row.updatedAt,
  ]
    .map((value) => sanitizeCsvField(value))
    .join(",");
}

function isQueueFilter(value: string | null): value is QueueFilter {
  return value === "lead" || value === "vendor_submission";
}

function isExportFormat(value: string | null): value is ExportFormat {
  return value === "json" || value === "csv";
}

function normalize(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function normalizeFilter(value?: string | null, maxLength = AUDIT_FILTER_VALUE_MAX_LENGTH) {
  return (value ?? "").trim().toLowerCase().slice(0, maxLength);
}

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_EXPORT_LIMIT;
  }

  return Math.max(1, Math.min(parsed, DEFAULT_EXPORT_LIMIT));
}

function parseDateFilter(value: string | null, isEnd: boolean) {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return undefined;
  }

  const baseDate = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(baseDate.getTime())) {
    return undefined;
  }

  if (!isEnd) {
    return baseDate.getTime();
  }

  return new Date(baseDate.getTime() + 24 * 60 * 60 * 1000 - 1).getTime();
}

function parseBoolean(value: string | null, fallback = false) {
  if (value === null) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  const throttle = checkThrottle(
    "admin_audit_export",
    deriveThrottleKey(request.headers),
    ADMIN_AUDIT_EXPORT_THROTTLE,
  );

  if (!throttle.ok) {
    return NextResponse.json(
      { ok: false, error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.` },
      {
        status: 429,
        headers: { "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds) },
      },
    );
  }

  const queueType = requestUrl.searchParams.get("type");
  const source = requestUrl.searchParams.get("source");
  const actor = requestUrl.searchParams.get("actor");
  const status = requestUrl.searchParams.get("status");
  const q = normalize(requestUrl.searchParams.get("q")).slice(0, AUDIT_SEARCH_MAX_LENGTH);
  const limit = parseLimit(requestUrl.searchParams.get("limit"));
  const from = parseDateFilter(requestUrl.searchParams.get("from"), false);
  const to = parseDateFilter(requestUrl.searchParams.get("to"), true);
  const format = isExportFormat(requestUrl.searchParams.get("format")) ? requestUrl.searchParams.get("format")! : "csv";
  const includeSource = parseBoolean(requestUrl.searchParams.get("includeSource"), true);
  const includeReason = parseBoolean(requestUrl.searchParams.get("includeReason"), true);

  const rows = await getQueueAudit(limit);

  const normalizedQueueType = normalizeFilter(queueType);
  const normalizedSource = normalizeFilter(source);
  const normalizedActor = normalizeFilter(actor);
  const normalizedStatus = normalizeFilter(status);

  const filteredRows = rows.filter((entry) => {
    const updatedAt = new Date(entry.updatedAt).getTime();
    if (normalizedQueueType && isQueueFilter(normalizedQueueType) && entry.queueType !== normalizedQueueType) {
      return false;
    }

    const normalizedEntrySource = normalize(entry.source || "admin_ui");
    if (normalizedSource && normalizedSource !== "all" && normalizedEntrySource !== normalizedSource) {
      return false;
    }

    const normalizedEntryActor = normalize(entry.actor);
    if (normalizedActor && normalizedActor !== "all" && normalizedEntryActor !== normalizedActor) {
      return false;
    }

    const previousStatus = normalize(entry.previousStatus);
    const newStatus = normalize(entry.newStatus);
    if (normalizedStatus && normalizedStatus !== "all" && normalizedStatus !== previousStatus && normalizedStatus !== newStatus) {
      return false;
    }

    if (from !== undefined && updatedAt < from) {
      return false;
    }

    if (to !== undefined && updatedAt > to) {
      return false;
    }

    if (!q) {
      return true;
    }

    const haystack = `${entry.id} ${entry.itemId} ${entry.itemLabel} ${entry.actor} ${includeSource ? normalize(entry.source || "admin_ui") : ""} ${
      entry.previousStatus
    } ${entry.newStatus} ${includeReason ? normalize(entry.reason ?? "") : ""}`.toLowerCase();

    return haystack.includes(q);
  });

  const exportRows: QueueEventExportRow[] = filteredRows.map((entry) => ({
    eventId: entry.id,
    queueType: entry.queueType,
    itemId: entry.itemId,
    itemLabel: entry.itemLabel,
    actor: entry.actor,
    source: includeSource ? entry.source || "admin_ui" : "",
    reason: includeReason ? entry.reason || "" : "",
    previousStatus: entry.previousStatus,
    newStatus: entry.newStatus,
    updatedAt: entry.updatedAt,
  }));

  const safeType = normalizedQueueType || "all";
  const fileDate = new Date().toISOString().slice(0, 10);
  const fileNameBase =
    safeType === "lead"
      ? `modulardatacenters-admin-audit-leads-${fileDate}`
      : safeType === "vendor_submission"
        ? `modulardatacenters-admin-audit-vendors-${fileDate}`
        : `modulardatacenters-admin-audit-${fileDate}`;

  if (format === "json") {
    const payload = {
      generatedAt: new Date().toISOString(),
      filter: {
        type: normalizedQueueType || "all",
        source: normalizedSource || "all",
        actor: normalizedActor || "all",
        status: normalizedStatus || "all",
        q,
        limit,
        from: requestUrl.searchParams.get("from") || "",
        to: requestUrl.searchParams.get("to") || "",
      },
      summary: {
        total: exportRows.length,
        includeSource,
        includeReason,
      },
      rows: exportRows,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${fileNameBase}.json"`,
      },
    });
  }

  const csv = [
    "eventId,queueType,itemId,itemLabel,actor,source,reason,previousStatus,newStatus,updatedAt",
    ...exportRows.map(toCsvRow),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileNameBase}.csv"`,
    },
  });
}
