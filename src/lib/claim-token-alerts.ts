import { AdminVendorSubmission } from "@/lib/site-data";

export const CLAIM_TOKEN_ALERT_WINDOW_HOURS = 24;

export type ClaimTokenAlertRisk = "expired" | "expiring";

export type ClaimTokenAlertItem = {
  row: AdminVendorSubmission;
  risk: ClaimTokenAlertRisk;
  riskLabel: string;
  riskPriority: number;
  expiresAtMs: number;
};

const CLAIM_TOKEN_MS_PER_HOUR = 60 * 60 * 1000;

function parseExpirationAt(rawExpiresAt?: string) {
  const parsed = Date.parse(rawExpiresAt ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

export function getClaimTokenRiskLevel(
  rawExpiresAt: string | undefined,
  now = Date.now(),
  horizonHours = CLAIM_TOKEN_ALERT_WINDOW_HOURS,
): ClaimTokenAlertRisk | "ok" {
  const parsed = parseExpirationAt(rawExpiresAt);
  if (parsed === null) {
    return "ok";
  }

  const remaining = parsed - now;
  if (remaining <= 0) {
    return "expired";
  }

  const horizonMs = Math.max(1, horizonHours) * CLAIM_TOKEN_MS_PER_HOUR;
  if (remaining <= horizonMs) {
    return "expiring";
  }

  return "ok";
}

export function isClaimTokenExpired(rawExpiresAt?: string, now = Date.now()) {
  const parsed = parseExpirationAt(rawExpiresAt);
  return parsed !== null && parsed <= now;
}

export function isClaimTokenExpiringWithinWindow(rawExpiresAt?: string, now = Date.now(), windowHours = CLAIM_TOKEN_ALERT_WINDOW_HOURS) {
  const parsed = parseExpirationAt(rawExpiresAt);
  if (parsed === null) {
    return false;
  }

  const remaining = parsed - now;
  if (remaining <= 0) {
    return false;
  }

  const cutoffMs = Math.max(1, windowHours) * CLAIM_TOKEN_MS_PER_HOUR;
  return remaining <= cutoffMs;
}

export function claimTokenRiskLabel(rawExpiresAt?: string, now = Date.now()) {
  const parsed = parseExpirationAt(rawExpiresAt);
  if (parsed === null) {
    return null;
  }

  const remaining = parsed - now;
  if (remaining <= 0) {
    return "Expired";
  }

  const hours = Math.floor(remaining / CLAIM_TOKEN_MS_PER_HOUR);
  return `${Math.max(hours, 1)}h remaining`;
}

export function buildClaimTokenAlertDigest(
  rows: AdminVendorSubmission[],
  options: {
    status?: string;
    now?: number;
    horizonHours?: number;
  } = {},
): ClaimTokenAlertItem[] {
  const now = options.now ?? Date.now();
  const horizonHours = options.horizonHours ?? CLAIM_TOKEN_ALERT_WINDOW_HOURS;
  const requestedStatus = (options.status ?? "").trim().toLowerCase();

  const alerts: ClaimTokenAlertItem[] = [];

  for (const row of rows) {
    if (row.type !== "claim") {
      continue;
    }

    if (requestedStatus && row.status !== requestedStatus) {
      continue;
    }

    const risk = getClaimTokenRiskLevel(row.claimTokenExpiresAt, now, horizonHours);
    if (risk === "ok") {
      continue;
    }

    const expiresAtMs = parseExpirationAt(row.claimTokenExpiresAt);
    if (expiresAtMs === null) {
      continue;
    }

    const label = claimTokenRiskLabel(row.claimTokenExpiresAt, now);
    if (!label) {
      continue;
    }

    alerts.push({
      row,
      risk,
      riskLabel: label,
      riskPriority: risk === "expired" ? 0 : 1,
      expiresAtMs,
    });
  }

  return alerts.sort((a, b) => {
    if (a.riskPriority !== b.riskPriority) {
      return a.riskPriority - b.riskPriority;
    }

    if (a.expiresAtMs !== b.expiresAtMs) {
      return a.expiresAtMs - b.expiresAtMs;
    }

    return a.row.submittedAt.localeCompare(b.row.submittedAt);
  });
}

export function buildClaimTokenAlertStats(rows: ClaimTokenAlertItem[]) {
  let expired = 0;
  let expiring = 0;

  for (const item of rows) {
    if (item.risk === "expired") {
      expired += 1;
    } else {
      expiring += 1;
    }
  }

  return {
    expired,
    expiring,
    total: rows.length,
  };
}
