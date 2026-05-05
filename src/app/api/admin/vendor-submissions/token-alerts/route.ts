import { NextRequest, NextResponse } from "next/server";

import { buildClaimTokenAlertDigest, CLAIM_TOKEN_ALERT_WINDOW_HOURS, buildClaimTokenAlertStats } from "@/lib/claim-token-alerts";
import { getAdminVendorSubmissions } from "@/lib/site-data";
import { buildRetryAfterHeader, checkThrottle, deriveThrottleKey } from "@/lib/request-throttle";

type TokenAlertRow = {
  id: string;
  company: string;
  contact: string;
  status: string;
  validationState?: string;
  risk: string;
  riskLabel: string;
  claimTokenExpiresAt?: string;
  submittedAt?: string;
};

const ADMIN_TOKEN_ALERTS_THROTTLE = {
  limit: 40,
  windowMs: 60000,
};

const MAX_TOKEN_ALERT_ROWS = 500;
const MAX_STATUS_FILTER_LENGTH = 64;
const MAX_CSV_FIELD_LENGTH = 1200;

function normalizeStatus(value: string | null) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().toLowerCase().slice(0, MAX_STATUS_FILTER_LENGTH) : null;
}

function normalizeFormat(value: string | null) {
  return value?.trim().toLowerCase() === "csv" ? "csv" : "json";
}

function normalizeNumber(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.max(1, Math.min(parsed, MAX_TOKEN_ALERT_ROWS));
}

function sanitizeCsvField(value: string) {
  const truncated = value.slice(0, MAX_CSV_FIELD_LENGTH);
  const safe = /^[=+\-@]/.test(truncated) ? `'${truncated}` : truncated;

  if (!safe.includes(",") && !safe.includes("\n") && !safe.includes('"')) {
    return safe;
  }

  return `"${safe.replaceAll('"', '""')}"`;
}

function toCsv(rows: TokenAlertRow[]) {
  const header = [
    "id",
    "company",
    "contact",
    "status",
    "validation_state",
    "risk",
    "risk_label",
    "claim_token_expires_at",
    "submitted_at",
  ];

  const rendered = rows.map((row) =>
    [
      row.id,
      row.company,
      row.contact,
      row.status,
      row.validationState ?? "",
      row.risk,
      row.riskLabel,
      row.claimTokenExpiresAt ?? "",
      row.submittedAt ?? "",
    ]
      .map((value) => sanitizeCsvField(value))
      .join(","),
  );

  return `${header.join(",")}\n${rendered.join("\n")}`;
}

export async function GET(request: NextRequest) {
  const throttle = checkThrottle("admin_token_alerts", deriveThrottleKey(request.headers), ADMIN_TOKEN_ALERTS_THROTTLE);

  if (!throttle.ok) {
    return NextResponse.json(
      { ok: false, error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.` },
      {
        status: 429,
        headers: { "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds) },
      },
    );
  }

  const requestUrl = new URL(request.url);
  const params = requestUrl.searchParams;

  const requestedFormat = normalizeFormat(params.get("format"));
  const horizonHours = Math.max(1, normalizeNumber(params.get("horizonHours"), CLAIM_TOKEN_ALERT_WINDOW_HOURS));
  const status = normalizeStatus(params.get("status"));
  const requestedLimit = params.get("limit");

  const now = Date.now();
  const submissions = getAdminVendorSubmissions();
  const digest = buildClaimTokenAlertDigest(submissions, {
    now,
    horizonHours,
  });

  const filtered = typeof status === "string" && status.length > 0 ? digest.filter((entry) => entry.row.status === status) : digest;
  const limited =
    requestedLimit === null || requestedLimit.trim().length === 0 ? filtered : filtered.slice(0, normalizeNumber(requestedLimit, filtered.length));

  const rows = limited.map<TokenAlertRow>((item) => ({
    id: item.row.id,
    company: item.row.company ?? "",
    contact: item.row.contact ?? "",
    status: item.row.status,
    validationState: item.row.validationState,
    risk: item.risk,
    riskLabel: item.riskLabel,
    claimTokenExpiresAt: item.row.claimTokenExpiresAt,
    submittedAt: item.row.submittedAt,
  }));

  const stats = buildClaimTokenAlertStats(filtered);

  if (requestedFormat === "csv") {
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="claim-token-alerts.csv"',
      },
    });
  }

  return NextResponse.json({
    generatedAt: new Date(now).toISOString(),
    horizonHours,
    status: status ?? null,
    stats,
    rows,
  });
}
