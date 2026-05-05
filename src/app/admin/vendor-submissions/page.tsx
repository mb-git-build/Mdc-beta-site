import Link from "next/link";
import { AdminExportDownloadButton } from "@/components/admin-export-download";

import { AdminVendorSubmission, getAdminVendorSubmissions, getVendorBySlug, vendors } from "@/lib/site-data";
import { getSubmissionStatuses, isValidSubmissionStatus } from "@/lib/form-persistence";
import { getVendorRoutingTags } from "@/lib/admin-routing-tags";
import { CLAIM_TOKEN_ALERT_WINDOW_HOURS, buildClaimTokenAlertDigest, buildClaimTokenAlertStats, claimTokenRiskLabel, getClaimTokenRiskLevel as claimTokenRiskLevel, isClaimTokenExpired, isClaimTokenExpiringWithinWindow as isClaimTokenExpiringSoon } from "@/lib/claim-token-alerts";

export const dynamic = "force-dynamic";

type SubmissionQueueSearchParams = {
  status?: string;
  q?: string;
  routing?: string;
  page?: string;
  limit?: string;
  compact?: string;
  show_status?: string;
  show_routing?: string;
  show_date?: string;
  focus?: string;
  status_error?: string;
  status_error_message?: string;
  status_warning?: string;
  status_warning_message?: string;
  status_guard?: string;
  status_missing?: string;
  status_blocked?: string;
  status_blocked_count?: string;
  status_guard_message?: string;
};

type SubmissionQueueItem = AdminVendorSubmission;

type SubmissionQueueState = {
  status: string;
  q: string;
  routing: string;
  page: number;
  limit: number;
  compact: boolean;
  focus: "all" | "claims" | "needs_followup" | "duplicate_risk" | "tokens_expiring" | "tokens_expired" | "tokens_alerts";
  showStatus: boolean;
  showRouting: boolean;
  showDate: boolean;
};

type RouteSummary = {
  slug: string;
  label: string;
  total: number;
  open: number;
  today: number;
  yesterday: number;
};

type BlockedBatchTransition = {
  id: string;
  previousStatus: string;
  nextStatus: string;
  error: string;
};

function statusToneClass(status: SubmissionQueueItem["status"]) {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "needs_more_info":
      return "bg-amber-50 text-amber-700";
    case "needs_followup":
      return "bg-amber-100 text-amber-800";
    case "claimed":
      return "bg-violet-50 text-violet-700";
    case "verified":
      return "bg-cyan-50 text-cyan-700";
    case "in_review":
      return "bg-purple-50 text-purple-700";
    case "rejected":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

function summarizeDuplicate(row: SubmissionQueueItem) {
  const match = row.duplicateMatches?.[0];
  if (!match) {
    return null;
  }

  return `${match.kind === "vendor" ? "Vendor" : "Submission"} duplicate match: ${match.label} (${match.confidence}%) - ${match.reason}`;
}

function duplicateEscalationReason(row: SubmissionQueueItem) {
  const match = row.duplicateMatches?.[0];
  const label = row.duplicateLabel || match?.label;

  if (label) {
    const score = match?.confidence ?? row.duplicateConfidence;
    return `Duplicate candidate (${score ?? 0}% match): ${label}`;
  }

  return "Duplicate candidate detected. Manual review required.";
}

function shortClaimToken(token?: string) {
  if (!token || token.length < 12) {
    return token ?? "";
  }

  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

function formatClaimExpiry(rawExpiresAt?: string) {
  if (!rawExpiresAt) {
    return null;
  }

  const expiresAt = Date.parse(rawExpiresAt);
  if (!Number.isFinite(expiresAt)) {
    return null;
  }

  const now = Date.now();
  const remainingMs = expiresAt - now;

  if (remainingMs <= 0) {
    return "Claim token expired";
  }

  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} remaining`;
  }

  return `${hours} hour${hours === 1 ? "" : "s"} remaining`;
}

function normalizeSearch(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isFinite(parsed) && parsed >= 1) {
    return parsed;
  }

  return 1;
}

const MIN_QUEUE_LIMIT = 10;
const MAX_QUEUE_LIMIT = 200;
const DEFAULT_QUEUE_LIMIT = 25;
const DEFAULT_PAGE = 1;

function parseLimit(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_QUEUE_LIMIT;
  }

  if (parsed < MIN_QUEUE_LIMIT) {
    return MIN_QUEUE_LIMIT;
  }

  if (parsed > MAX_QUEUE_LIMIT) {
    return MAX_QUEUE_LIMIT;
  }

  return parsed;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  const normalized = (value ?? "").trim();

  if (normalized === "1" || normalized.toLowerCase() === "true") {
    return true;
  }

  if (normalized === "0" || normalized.toLowerCase() === "false") {
    return false;
  }

  return fallback;
}

function parseFocus(value?: string): SubmissionQueueState["focus"] {
  const normalized = normalizeSearch(value);
  const valid: SubmissionQueueState["focus"][] = [
    "all",
    "claims",
    "needs_followup",
    "duplicate_risk",
    "tokens_expiring",
    "tokens_expired",
    "tokens_alerts",
  ];

  if (valid.includes(normalized as SubmissionQueueState["focus"])) {
    return normalized as SubmissionQueueState["focus"];
  }

  return "all";
}

function parseFilters(searchParams: SubmissionQueueSearchParams): SubmissionQueueState {
  const requestedStatus = normalizeSearch(searchParams?.status);
  const status = isValidSubmissionStatus(requestedStatus) ? requestedStatus : "all";
  const q = normalizeSearch(searchParams?.q);
  const routing = normalizeSearch(searchParams?.routing) || "all";

  return {
    status,
    q,
    routing,
    page: parsePage(searchParams?.page),
    limit: parseLimit(searchParams?.limit),
    focus: parseFocus(searchParams?.focus),
    compact: parseBoolean(searchParams?.compact, false),
    showStatus: parseBoolean(searchParams?.show_status, true),
    showRouting: parseBoolean(searchParams?.show_routing, true),
    showDate: parseBoolean(searchParams?.show_date, false),
  };
}

function buildSubmissionUrl(
  base: SubmissionQueueState,
  overrides: Partial<SubmissionQueueState> & { page?: number; resetPage?: boolean },
) {
  const next = {
    status: overrides.status ?? base.status,
    q: overrides.q ?? base.q,
    routing: overrides.routing ?? base.routing,
    focus: overrides.focus ?? base.focus,
    page: overrides.resetPage ? null : overrides.page ?? base.page,
    limit: overrides.limit ?? base.limit,
    compact: overrides.compact ?? base.compact,
    showStatus: overrides.showStatus ?? base.showStatus,
    showRouting: overrides.showRouting ?? base.showRouting,
    showDate: overrides.showDate ?? base.showDate,
  };

  const params = new URLSearchParams();

  if (next.status && next.status !== "all") {
    params.set("status", next.status);
  }

  if (next.q) {
    params.set("q", next.q);
  }

  if (next.routing && next.routing !== "all") {
    params.set("routing", next.routing);
  }

  if (next.focus && next.focus !== "all") {
    params.set("focus", next.focus);
  }

  if (next.page && next.page > DEFAULT_PAGE) {
    params.set("page", String(next.page));
  }

  if (next.limit !== DEFAULT_QUEUE_LIMIT) {
    params.set("limit", String(next.limit));
  }

  if (next.compact) {
    params.set("compact", "1");
  }

  if (!next.showStatus) {
    params.set("show_status", "0");
  }

  if (!next.showRouting) {
    params.set("show_routing", "0");
  }

  if (next.showDate) {
    params.set("show_date", "1");
  }

  const query = params.toString();
  return `/admin/vendor-submissions${query ? `?${query}` : ""}`;
}

const DUPLICATE_RISK_SCORE = 78;

function isSubmissionOpen(status: SubmissionQueueItem["status"]) {
  return status !== "approved" && status !== "rejected";
}

function parseFocusState(row: SubmissionQueueItem, focus: SubmissionQueueState["focus"], now = Date.now()) {
  switch (focus) {
    case "all":
      return true;
    case "claims":
      return row.type === "claim";
    case "needs_followup":
      return row.type === "claim" && (row.status === "needs_followup" || row.validationState === "needs_followup");
    case "duplicate_risk":
      return (row.duplicateConfidence ?? 0) >= DUPLICATE_RISK_SCORE;
    case "tokens_expired":
      return row.type === "claim" && isClaimTokenExpired(row.claimTokenExpiresAt, now);
    case "tokens_expiring":
      return row.type === "claim" && isClaimTokenExpiringSoon(row.claimTokenExpiresAt, now, CLAIM_TOKEN_ALERT_WINDOW_HOURS);
    case "tokens_alerts":
      return row.type === "claim" && claimTokenRiskLevel(row.claimTokenExpiresAt, now, CLAIM_TOKEN_ALERT_WINDOW_HOURS) !== "ok";
    default:
      return true;
  }
}

function claimFollowupReason(row: SubmissionQueueItem) {
  const reasons = [];

  if (row.type === "claim") {
    if (claimTokenRiskLevel(row.claimTokenExpiresAt) === "expired") {
      reasons.push("Claim token expired; request verification reset.");
    } else if (claimTokenRiskLevel(row.claimTokenExpiresAt) === "expiring") {
      reasons.push("Claim token expiring soon; verify renewal path.");
    }

    if (row.validationState === "needs_followup") {
      reasons.push("Automated validation required follow-up.");
    }

    if (row.duplicateConfidence && row.duplicateConfidence >= 70) {
      reasons.push(duplicateEscalationReason(row));
    }
  }

  return reasons.length > 0 ? reasons.join(" | ") : "Operator follow-up requested.";
}

function claimFollowupClass(rawExpiresAt?: string) {
  if (isClaimTokenExpired(rawExpiresAt)) {
    return "text-rose-700";
  }

  if (isClaimTokenExpiringSoon(rawExpiresAt)) {
    return "text-amber-700";
  }

  return "text-[var(--muted)]";
}

function formatFocusLabel(focus: SubmissionQueueState["focus"]) {
  switch (focus) {
    case "all":
      return "All";
    case "claims":
      return "Claims";
    case "needs_followup":
      return "Needs follow-up";
    case "duplicate_risk":
      return "Duplicate risk";
    case "tokens_expiring":
      return "Tokens expiring";
    case "tokens_expired":
      return "Tokens expired";
    case "tokens_alerts":
      return "Token alerts";
    default:
      return "All";
  }
}

function parseStringList(rawValue?: string) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0);
    }
  } catch {
    // Ignore parser failures; fallback to comma-delimited parsing below.
  }

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function parseBlockedTransitions(rawValue?: string): BlockedBatchTransition[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const sanitized: BlockedBatchTransition[] = [];
    for (const candidate of parsed) {
      if (
        candidate &&
        typeof candidate.id === "string" &&
        typeof candidate.previousStatus === "string" &&
        typeof candidate.nextStatus === "string" &&
        typeof candidate.error === "string"
      ) {
        sanitized.push({
          id: candidate.id,
          previousStatus: candidate.previousStatus,
          nextStatus: candidate.nextStatus,
          error: candidate.error,
        });
      }
    }

    return sanitized;
  } catch {
    return [];
  }
}

function parseIntOrZero(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isFinite(parsed) && !Number.isNaN(parsed)) {
    return Math.max(parsed, 0);
  }

  return 0;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function getSubmissionWindowMarkers(submittedAt: string) {
  const timestamp = Date.parse(submittedAt);

  if (Number.isNaN(timestamp)) {
    return { today: false, yesterday: false };
  }

  const now = Date.now();
  const dayStart = now - DAY_MS;
  const previousDayStart = now - 2 * DAY_MS;

  const isToday = timestamp >= dayStart;
  const isYesterday = timestamp >= previousDayStart && timestamp < dayStart;

  return { today: isToday, yesterday: isYesterday };
}

function getRouteDelta(entry: RouteSummary) {
  return entry.today - entry.yesterday;
}

function renderRouteDelta(delta: number) {
  if (delta === 0) {
    return null;
  }

  const isUp = delta > 0;
  const toneClass = isUp ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";

  return (
    <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${toneClass}`}>
      {isUp ? "↑" : "↓"}
      {Math.abs(delta)}
    </span>
  );
}

function getRoutingSummary(rows: SubmissionQueueItem[]): RouteSummary[] {
  const summary = new Map<string, RouteSummary>();

  for (const row of rows) {
    const tags = getVendorRoutingTags(row);
    const resolvedTags = tags.length > 0 ? tags : [{ slug: "unmapped", name: "Unmapped" }];
    const { today, yesterday } = getSubmissionWindowMarkers(row.submittedAt);

    for (const tag of resolvedTags) {
      const current = summary.get(tag.slug);

      if (!current) {
        summary.set(tag.slug, {
          slug: tag.slug,
          label: tag.name,
          total: 1,
          open: isSubmissionOpen(row.status) ? 1 : 0,
          today: today ? 1 : 0,
          yesterday: yesterday ? 1 : 0,
        });
        continue;
      }

      current.total += 1;
      current.open += isSubmissionOpen(row.status) ? 1 : 0;
      current.today += today ? 1 : 0;
      current.yesterday += yesterday ? 1 : 0;
    }
  }

  return [...summary.values()].sort((a, b) => {
    if (b.open !== a.open) {
      return b.open - a.open;
    }

    return b.total - a.total;
  });
}

function matchesSubmissionSearch(row: SubmissionQueueItem, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }

  const vendor = row.vendorSlug ? getVendorBySlug(row.vendorSlug) : null;
  const tagText = getVendorRoutingTags(row)
    .map((tag) => tag.name)
    .join(" ")
    .toLowerCase();

  const haystack = `${row.company ?? ""} ${row.contact ?? ""} ${row.type ?? ""} ${row.id ?? ""} ${row.vendorSlug ?? ""} ${vendor?.name ?? ""} ${row.status ?? ""} ${tagText}`.toLowerCase();

  return haystack.includes(searchTerm);
}

function formatRoutingPillLink(base: SubmissionQueueState, route: string) {
  return buildSubmissionUrl(base, {
    routing: route,
    resetPage: true,
  });
}

export default async function AdminVendorSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SubmissionQueueSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const rows = getAdminVendorSubmissions();
  const baseState = parseFilters(resolvedSearchParams);

  // Use current wall-clock time for trust-expiry classification during this request.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const requestedRouting = normalizeSearch(resolvedSearchParams?.routing);
  const routingSummary = getRoutingSummary(rows);
  const availableRouting = new Set(routingSummary.map((entry) => entry.slug));
  const routingFilter = requestedRouting && availableRouting.has(requestedRouting) ? requestedRouting : "all";

  const tokenAlertDigest = buildClaimTokenAlertDigest(rows, {
    now,
    horizonHours: CLAIM_TOKEN_ALERT_WINDOW_HOURS,
  });
  const tokenAlertStats = buildClaimTokenAlertStats(tokenAlertDigest);
  const tokenAlertOrder = new Map(tokenAlertDigest.map((entry, index) => [entry.row.id, index]));

  const submissionRowsSource = rows.filter((row) => {
    if (baseState.status !== "all" && row.status !== baseState.status) {
      return false;
    }

    if (routingFilter !== "all") {
      const tags = getVendorRoutingTags(row);
      const tagsAreEmpty = tags.length === 0;
      const tagSlugs = tags.map((tag) => tag.slug);

      if (routingFilter === "unmapped") {
        if (!tagsAreEmpty) {
          return false;
        }
      } else if (tagsAreEmpty || !tagSlugs.includes(routingFilter)) {
        return false;
      }
    }

    if (!parseFocusState(row, baseState.focus, now)) {
      return false;
    }

    return matchesSubmissionSearch(row, baseState.q);
  });

  const submissionRows = [...submissionRowsSource];
  if (baseState.focus === "tokens_alerts") {
    submissionRows.sort((a, b) => {
      const aOrder = tokenAlertOrder.get(a.id);
      const bOrder = tokenAlertOrder.get(b.id);
      if (aOrder === undefined && bOrder === undefined) {
        return 0;
      }
      if (aOrder === undefined) {
        return 1;
      }
      if (bOrder === undefined) {
        return -1;
      }
      return aOrder - bOrder;
    });
  }

  const statusOptions = ["all", ...getSubmissionStatuses()] as const;
  const hasStatusError = resolvedSearchParams?.status_error === "1";
  const hasStatusWarning = resolvedSearchParams?.status_warning === "1";
  const statusWarningMessage = resolvedSearchParams?.status_warning_message;
  const hasStatusGuard = resolvedSearchParams?.status_guard === "1";
  const statusErrorMessage = resolvedSearchParams?.status_error_message;
  const missingRows = parseStringList(resolvedSearchParams?.status_missing);
  const blockedTransitions = parseBlockedTransitions(resolvedSearchParams?.status_blocked);
  const blockedRowsCount = parseIntOrZero(resolvedSearchParams?.status_blocked_count);
  const displayedGuardMessage = resolvedSearchParams?.status_guard_message;
  const isFiltering =
    baseState.status !== "all" ||
    baseState.q.length > 0 ||
    routingFilter !== "all" ||
    baseState.focus !== "all";
  const filteredCount = submissionRows.length;
  const safeLimit = baseState.limit;
  const totalPages = Math.max(1, Math.ceil(filteredCount / safeLimit));
  const safePage = Math.min(Math.max(DEFAULT_PAGE, baseState.page), totalPages);
  const paginatedRows = submissionRows.slice((safePage - 1) * safeLimit, safePage * safeLimit);
  const pageStart = filteredCount === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const pageEnd = Math.min(safePage * safeLimit, filteredCount);
  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  const trustRows = rows.filter((row) => row.type === "claim");
  const trustNeedsFollowup = trustRows.filter(
    (row) => row.status === "needs_followup" || row.validationState === "needs_followup",
  ).length;
  const duplicateRiskRows = rows.filter((row) => (row.duplicateConfidence ?? 0) >= DUPLICATE_RISK_SCORE).length;
  const expiringTokens = tokenAlertStats.expiring;
  const expiredTokens = tokenAlertStats.expired;
  const activeState = {
    ...baseState,
    routing: routingFilter,
    page: safePage,
    q: baseState.q,
  };

  const returnTo = buildSubmissionUrl(activeState, {});

  const compactClass = activeState.compact ? "px-3 py-2 text-xs" : "px-4 py-3";

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Admin / Vendor Submissions</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-4xl font-semibold tracking-tight">Moderation queue</h1>
          <p className="text-sm leading-7 text-[var(--muted)]">Review listing submissions, claim requests, and moderation status.</p>
        </div>

        <section className="sticky top-2 z-20 mt-6 space-y-4 rounded-[1.25rem] border border-[var(--border)] bg-white p-4">
          <form method="get" action="/admin/vendor-submissions" className="mt-6 flex flex-wrap items-end gap-3">
            <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
              Filter status
              <select
                name="status"
                defaultValue={activeState.status}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
              Search
              <input
                name="q"
                defaultValue={activeState.q}
                className="w-72 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                placeholder="company, contact, type, vendor"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
              Rows
              <input
                name="limit"
                defaultValue={String(activeState.limit)}
                type="number"
                min={MIN_QUEUE_LIMIT}
                max={MAX_QUEUE_LIMIT}
                step={5}
                className="w-24 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              />
            </label>
            <input type="hidden" name="focus" value={activeState.focus} />
            <input type="hidden" name="routing" value={activeState.routing} />
            <input type="hidden" name="page" value={"1"} />
            <input type="hidden" name="compact" value={activeState.compact ? "1" : "0"} />
            <input type="hidden" name="show_status" value={activeState.showStatus ? "1" : "0"} />
            <input type="hidden" name="show_routing" value={activeState.showRouting ? "1" : "0"} />
            <input type="hidden" name="show_date" value={activeState.showDate ? "1" : "0"} />
            <button type="submit" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">
              Apply
            </button>
            <Link
              href={buildSubmissionUrl(activeState, { status: "all", q: "", routing: "all", focus: "all", page: DEFAULT_PAGE })}
              className="text-sm text-[var(--accent)]"
            >
              Clear filter
            </Link>
          </form>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Views:</span>
            <Link
              href={buildSubmissionUrl(activeState, { compact: !activeState.compact })}
              className={`rounded-full border px-3 py-1 ${activeState.compact ? "border-[var(--accent)] text-[var(--accent)]" : "border-slate-200 text-slate-600"}`}
            >
              {activeState.compact ? "Compact on" : "Compact off"}
            </Link>
            <Link
              href={buildSubmissionUrl(activeState, { showStatus: !activeState.showStatus })}
              className={`rounded-full border px-3 py-1 ${activeState.showStatus ? "border-[var(--accent)] text-[var(--accent)]" : "border-slate-200 text-slate-600"}`}
            >
              {activeState.showStatus ? "Hide status" : "Show status"}
            </Link>
            <Link
              href={buildSubmissionUrl(activeState, { showRouting: !activeState.showRouting })}
              className={`rounded-full border px-3 py-1 ${activeState.showRouting ? "border-[var(--accent)] text-[var(--accent)]" : "border-slate-200 text-slate-600"}`}
            >
              {activeState.showRouting ? "Hide routing" : "Show routing"}
            </Link>
            <Link
              href={buildSubmissionUrl(activeState, { showDate: !activeState.showDate })}
              className={`rounded-full border px-3 py-1 ${activeState.showDate ? "border-[var(--accent)] text-[var(--accent)]" : "border-slate-200 text-slate-600"}`}
            >
              {activeState.showDate ? "Hide date" : "Show date"}
            </Link>
          </div>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">Routing triage</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Trend = entries in last 24h minus previous 24h.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={buildSubmissionUrl(activeState, { routing: "all", resetPage: true })}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  routingFilter === "all" ? "bg-[var(--accent)] text-white" : "bg-[#f1f5f9] text-[#334155]"
                }`}
              >
                All routes: {rows.length}
              </Link>
              {routingSummary.map((entry) => (
                <Link
                  key={entry.slug}
                  href={formatRoutingPillLink(activeState, entry.slug)}
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                    routingFilter === entry.slug ? "bg-sky-700 text-white" : "bg-sky-100 text-sky-800"
                  }`}
                >
                  {entry.label} · {entry.open}/{entry.total}
                  {renderRouteDelta(getRouteDelta(entry))}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">Trust triage</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Focused views for claim trust operations.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={buildSubmissionUrl(activeState, { focus: "all", resetPage: true })}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  activeState.focus === "all" ? "bg-[var(--accent)] text-white" : "bg-[#f1f5f9] text-[#334155]"
                }`}
              >
                All submissions: {rows.length}
              </Link>
              <Link
                href={buildSubmissionUrl(activeState, { focus: "claims", resetPage: true })}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  activeState.focus === "claims" ? "bg-violet-700 text-white" : "bg-violet-100 text-violet-800"
                }`}
              >
                Claim requests: {trustRows.length}
              </Link>
              <Link
                href={buildSubmissionUrl(activeState, { focus: "needs_followup", resetPage: true })}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  activeState.focus === "needs_followup" ? "bg-amber-700 text-white" : "bg-amber-100 text-amber-800"
                }`}
              >
                Needs follow-up: {trustNeedsFollowup}
              </Link>
              <Link
                href={buildSubmissionUrl(activeState, { focus: "duplicate_risk", resetPage: true })}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  activeState.focus === "duplicate_risk" ? "bg-rose-700 text-white" : "bg-rose-100 text-rose-800"
                }`}
              >
                Duplicate risk: {duplicateRiskRows}
              </Link>
              <Link
                href={buildSubmissionUrl(activeState, { focus: "tokens_expiring", resetPage: true })}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  activeState.focus === "tokens_expiring" ? "bg-cyan-700 text-white" : "bg-cyan-100 text-cyan-800"
                }`}
              >
                Token expiring: {expiringTokens}
              </Link>
              <Link
                href={buildSubmissionUrl(activeState, { focus: "tokens_expired", resetPage: true })}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  activeState.focus === "tokens_expired" ? "bg-red-700 text-white" : "bg-red-100 text-red-800"
                }`}
              >
                Token expired: {expiredTokens}
              </Link>
              <Link
                href={buildSubmissionUrl(activeState, { focus: "tokens_alerts", resetPage: true })}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                  activeState.focus === "tokens_alerts" ? "bg-purple-700 text-white" : "bg-purple-100 text-purple-800"
                }`}
              >
                Token alerts: {expiredTokens + expiringTokens}
              </Link>
            </div>
            <p className="mt-2 text-[11px] text-[var(--muted)]">
              Current trust focus: <span className="font-semibold text-[var(--foreground)]">{formatFocusLabel(activeState.focus)}</span>
            </p>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[#f8fbff] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Token alert digest</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Auto-captured claim tokens expiring in the next {CLAIM_TOKEN_ALERT_WINDOW_HOURS}h and expired tokens. Updated: {new Date().toLocaleString("en-US")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <AdminExportDownloadButton
              href="/api/admin/vendor-submissions/token-alerts?format=csv&horizonHours=24"
              label="Download token alert digest (CSV)"
              className="rounded-full border border-[var(--accent)] px-3 py-1.5 font-semibold text-[var(--accent)]"
              messageClassName="text-[11px] text-amber-600"
            />
              <Link
                href={buildSubmissionUrl(activeState, { focus: "tokens_alerts", resetPage: true })}
                className="rounded-full border border-purple-700 px-3 py-1.5 text-[11px] font-semibold text-purple-700"
              >
                Open token alerts queue
              </Link>
              <span>
                Expired: <span className="font-semibold text-rose-700">{expiredTokens}</span> · Expiring: <span className="font-semibold text-amber-700">{expiringTokens}</span>
              </span>
            </div>
            {tokenAlertDigest.length === 0 ? (
              <p className="mt-2 text-[11px] text-emerald-700">No token alerts right now.</p>
            ) : (
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-[11px]">
                {tokenAlertDigest.slice(0, 6).map((entry) => (
                  <li key={entry.row.id} className="text-[var(--muted)]">
                    <a href={`#submission-row-${entry.row.id}`} className="font-semibold text-[var(--foreground)] underline underline-offset-2">
                      {entry.row.company || "(no company)"}
                    </a>{" "}
                    · {entry.riskLabel} · {entry.row.contact}
                    {entry.row.claimTokenExpiresAt ? ` · expires ${formatClaimExpiry(entry.row.claimTokenExpiresAt)}` : ""}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </section>

        <form
          id="submission-bulk-form"
          method="post"
          action="/api/admin/vendor-submissions/batch-status"
          className="mt-6 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="source" value="submission_bulk_form" />
          <input type="hidden" name="return_to" value={returnTo} />
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Bulk status
            <select
              name="status"
              defaultValue="new"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
            >
              {getSubmissionStatuses().map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Optional reason
            <input
              name="reason"
              type="text"
              autoComplete="off"
              placeholder="Add reason for this batch"
              className="w-72 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <button type="submit" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            Update selected
          </button>
          <span className="text-xs text-[var(--muted)]">Quick actions:</span>
          <button
            form="submission-bulk-form"
            type="submit"
            formAction="/api/admin/vendor-submissions/batch-status?status=approved&source=submission_bulk_quick"
            className="rounded-full border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-700"
          >
            Approve selected
          </button>
          <button
            form="submission-bulk-form"
            type="submit"
            formAction="/api/admin/vendor-submissions/batch-status?status=needs_more_info&source=submission_bulk_quick"
            className="rounded-full border border-amber-600 px-3 py-2 text-xs font-semibold text-amber-700"
          >
            Need info
          </button>
          <button
            form="submission-bulk-form"
            type="submit"
            formAction="/api/admin/vendor-submissions/batch-status?status=rejected&source=submission_bulk_quick"
            className="rounded-full border border-rose-600 px-3 py-2 text-xs font-semibold text-rose-700"
          >
            Reject selected
          </button>
          <button
            form="submission-bulk-form"
            type="submit"
            formAction="/api/admin/vendor-submissions/batch-status?status=needs_followup&source=submission_bulk_duplicate_risk&reason=Duplicate%20risk%20auto-escalation"
            className="rounded-full border border-amber-700 px-3 py-2 text-xs font-semibold text-amber-800"
          >
            Flag duplicate risk
          </button>
          <button
            form="submission-bulk-form"
            type="submit"
            formAction="/api/admin/vendor-submissions/batch-status?status=needs_followup&source=submission_bulk_tokens_unverified&reason=Claim%20token%20follow-up%20required"
            className="rounded-full border border-rose-700 px-3 py-2 text-xs font-semibold text-rose-800"
          >
            Flag token follow-up
          </button>
          <button
            form="submission-bulk-form"
            type="submit"
            formAction="/api/admin/vendor-submissions/batch-claim-token?source=submission_bulk_claim_token&reason=Expired%20or%20expiring%20tokens"
            className="rounded-full border border-sky-700 px-3 py-2 text-xs font-semibold text-sky-800"
          >
            Regenerate selected tokens
          </button>
          <p className="w-full text-xs text-[var(--muted)]">Tip: select multiple rows, then use a quick action.</p>
          <p id="submission-bulk-preview" className="w-full text-xs text-[var(--muted)]">
            Select submissions first, then review transition preview.
          </p>
        </form>

        {hasStatusError ? (
          <p className="mt-4 text-sm text-rose-600">{statusErrorMessage ?? "No rows were selected. Please select at least one row."}</p>
        ) : null}
        {hasStatusWarning ? <p className="mt-4 text-sm text-amber-600">{statusWarningMessage ?? "Some rows could not be updated and were skipped."}</p> : null}
        {hasStatusGuard ? <p className="mt-2 text-sm text-slate-700">Moderation guardrail was triggered for one or more rows. Add a reason for repeated rapid status transitions.</p> : null}
        {displayedGuardMessage ? <p className="mt-2 text-sm text-slate-700">{displayedGuardMessage}</p> : null}
        {missingRows.length > 0 ? (
          <p className="mt-2 text-sm text-amber-700">Missing rows at operation time: {missingRows.join(", ")}</p>
        ) : null}
        {blockedTransitions.length > 0 ? (
          <div className="mt-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">
              Blocked transitions ({blockedRowsCount > 0 ? `${blockedRowsCount} ` : ""}that were prevented):
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {blockedTransitions.map((entry) => {
                const transitionLabel = `${entry.previousStatus} → ${entry.nextStatus}`;
                return (
                  <li key={entry.id}>
                    <a href={`#submission-row-${entry.id}`} className="font-medium underline underline-offset-2">
                      {entry.id}
                    </a>{" "}
                    — {transitionLabel}. {entry.error}
                  </li>
                );
              })}
            </ul>
            {blockedRowsCount > blockedTransitions.length ? (
              <p className="mt-2 text-xs text-amber-700">Only showing first {blockedTransitions.length} blocked rows.</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[var(--border)]">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#f7faff] text-[var(--muted)]">
              <tr>
                <th className={compactClass}>Select</th>
                <th className={compactClass}>Company</th>
                <th className={compactClass}>Contact</th>
                <th className={compactClass}>Type</th>
                {activeState.showStatus ? <th className={compactClass}>Status</th> : null}
                {activeState.showRouting ? <th className={compactClass}>Routing</th> : null}
                {activeState.showDate ? <th className={compactClass}>Submitted</th> : null}
                <th className={compactClass}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const vendor = row.vendorSlug ? getVendorBySlug(row.vendorSlug) : null;
                const tags = getVendorRoutingTags(row);
                const effectiveTags = tags.length > 0 ? tags : [{ slug: "unmapped", name: "Unmapped" }];
                const submitDate = row.submittedAt ? new Date(row.submittedAt).toLocaleString("en-US") : "n/a";
                const duplicateSummary = summarizeDuplicate(row);
                const duplicateEscalation = duplicateEscalationReason(row);
                const hasDuplicateEvidence = Boolean(row.duplicateConfidence && row.duplicateConfidence >= 70);
                const tokenRisk = claimTokenRiskLevel(row.claimTokenExpiresAt);
                const tokenRiskLabel = claimTokenRiskLabel(row.claimTokenExpiresAt);
                const hasTokenWarning = tokenRisk === "expired" || tokenRisk === "expiring";
                const claimFollowupDefaultReason = claimFollowupReason(row);

                return (
                  <tr id={`submission-row-${row.id}`} key={row.id} className="border-t border-[var(--border)]">
                    <td className={compactClass}>
                      <label htmlFor={`submission-${row.id}`} className="sr-only">
                        Select submission row
                      </label>
                      <input
                        id={`submission-${row.id}`}
                        form="submission-bulk-form"
                        name="ids"
                        value={row.id}
                        type="checkbox"
                        data-status={row.status}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className={compactClass}>
                      <div>
                        <p>{row.company || "(No company provided)"}</p>
                        {vendor ? <p className="text-xs text-[var(--muted)]">{vendor.name}</p> : null}
                        {row.type === "claim" && row.claimToken ? (
                          <p className={`text-[11px] ${claimFollowupClass(row.claimTokenExpiresAt)}`}>
                            Claim token: {shortClaimToken(row.claimToken)}
                            {row.claimTokenExpiresAt ? ` • ${formatClaimExpiry(row.claimTokenExpiresAt) || ""}` : ""}
                            {tokenRiskLabel ? ` (${tokenRiskLabel})` : ""}
                          </p>
                        ) : null}
                        {row.type === "claim" && hasTokenWarning ? (
                          <p className="text-[11px] font-semibold" style={{ color: tokenRisk === "expired" ? "#b91c1c" : "#b45309" }}>
                            Attention: {tokenRisk === "expired" ? "token expired" : "token expiring soon"}
                          </p>
                        ) : null}
                        {row.validationState ? (
                          <p className="text-[11px] text-[var(--muted)]">Claim validation: {row.validationState}</p>
                        ) : null}
                        {duplicateSummary ? (
                          <p className="text-[11px] text-amber-700">{duplicateSummary}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className={compactClass}>{row.contact || "(No contact provided)"}</td>
                    <td className={compactClass}>{row.type}</td>
                    {activeState.showStatus ? (
                      <td className={compactClass}>
                        <div>
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusToneClass(row.status)}`}>
                            {row.status}
                          </span>
                          {row.statusTrail && row.statusTrail.length > 0 ? (
                            <p className="mt-1 text-[11px] text-[var(--muted)]">
                              Trail: {row.statusTrail.length} event{row.statusTrail.length === 1 ? "" : "s"} · last: {row.statusTrail[row.statusTrail.length - 1]?.at?.slice(0, 16).replace("T", " ")}
                            </p>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                    {activeState.showRouting ? (
                      <td className={compactClass}>
                        <div className="flex flex-wrap gap-1.5">
                          {effectiveTags.map((tag) => (
                            <Link
                              key={`${row.id}-${tag.slug}`}
                              href={formatRoutingPillLink(activeState, tag.slug)}
                              className="inline-flex rounded-full bg-sky-100 px-2 py-1 text-[11px] font-medium text-sky-800 hover:bg-sky-200"
                            >
                              {tag.name}
                            </Link>
                          ))}
                        </div>
                      </td>
                    ) : null}
                    {activeState.showDate ? <td className={compactClass}>{submitDate}</td> : null}
                    <td className={compactClass}>
                      <div className="flex flex-col gap-1.5">
                        <form
                          className="flex flex-wrap items-center gap-1"
                          action={`/api/admin/vendor-submissions/${row.id}/status`}
                          method="post"
                        >
                          <input type="hidden" name="source" value="submission_row_form" />
                                <input type="hidden" name="return_to" value={returnTo} />
                          <label htmlFor={`submission-status-${row.id}`} className="sr-only">
                            Submission status
                          </label>
                          <select
                            id={`submission-status-${row.id}`}
                            name="status"
                            defaultValue={row.status}
                            className="w-28 rounded-2xl border border-[var(--border)] px-2 py-1 text-xs"
                          >
                            {getSubmissionStatuses().map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            name="reason"
                            placeholder="Reason (optional)"
                            autoComplete="off"
                            className="rounded-2xl border border-[var(--border)] px-2 py-1 text-[11px]"
                          />
                          <button
                            type="submit"
                            className="rounded-xl border border-[var(--accent)] px-2 py-1 text-[11px] font-semibold text-[var(--accent)]"
                          >
                            Save
                          </button>
                        </form>
                        <div className="flex flex-wrap gap-1">
                          <form method="post" action={`/api/admin/vendor-submissions/${row.id}/status`}>
                            <input type="hidden" name="source" value="submission_row_single" />
                            <input type="hidden" name="return_to" value={returnTo} />
                            <input type="hidden" name="status" value="approved" />
                            <button
                              type="submit"
                              className="rounded-xl border border-emerald-600 px-2 py-1 text-[10px] font-semibold text-emerald-700"
                            >
                              Approve
                            </button>
                          </form>
                          <form method="post" action={`/api/admin/vendor-submissions/${row.id}/status`}>
                            <input type="hidden" name="source" value="submission_row_single" />
                            <input type="hidden" name="return_to" value={returnTo} />
                            <input type="hidden" name="status" value="rejected" />
                            <button
                              type="submit"
                              className="rounded-xl border border-rose-600 px-2 py-1 text-[10px] font-semibold text-rose-700"
                            >
                              Reject
                            </button>
                          </form>
                          {row.type === "claim" ? (
                            <>
                              <form method="post" action={`/api/admin/vendor-submissions/${row.id}/status`}>
                                <input type="hidden" name="source" value="submission_row_single_claim" />
                                <input type="hidden" name="return_to" value={returnTo} />
                                <input type="hidden" name="status" value="verified" />
                                <button
                                  type="submit"
                                  className="rounded-xl border border-cyan-600 px-2 py-1 text-[10px] font-semibold text-cyan-700"
                                >
                                  Verify
                                </button>
                              </form>
                              <form method="post" action={`/api/admin/vendor-submissions/${row.id}/status`}>
                                <input type="hidden" name="source" value="submission_row_single_claim" />
                                <input type="hidden" name="return_to" value={returnTo} />
                                <input type="hidden" name="status" value="needs_followup" />
                                <input type="hidden" name="reason" value={claimFollowupDefaultReason} />
                                <button
                                  type="submit"
                                  className="rounded-xl border border-amber-600 px-2 py-1 text-[10px] font-semibold text-amber-700"
                                >
                                  Mark follow-up
                                </button>
                              </form>
                              <form method="post" action={`/api/admin/vendor-submissions/${row.id}/claim-token`}>
                                <input type="hidden" name="return_to" value={returnTo} />
                                <button
                                  type="submit"
                                  className={`rounded-xl border px-2 py-1 text-[10px] font-semibold ${
                                    hasTokenWarning ? "border-rose-700 text-rose-700" : "border-sky-600 text-sky-700"
                                  }`}
                                >
                                  Regenerate token
                                </button>
                              </form>
                              {hasTokenWarning ? (
                                <form method="post" action={`/api/admin/vendor-submissions/${row.id}/status`}>
                                  <input type="hidden" name="source" value="submission_row_single_token_warning" />
                                  <input type="hidden" name="return_to" value={returnTo} />
                                  <input type="hidden" name="status" value="needs_followup" />
                                  <input
                                    type="hidden"
                                    name="reason"
                                    value={tokenRisk === "expired" ? "Claim token expired; reset trust verification." : "Claim token expiring soon; request follow-up."}
                                  />
                                  <button
                                    type="submit"
                                    className="rounded-xl border border-rose-600 px-2 py-1 text-[10px] font-semibold text-rose-700"
                                  >
                                    Escalate token risk
                                  </button>
                                </form>
                              ) : null}
                            </>
                          ) : null}
                          {hasDuplicateEvidence ? (
                            <form method="post" action={`/api/admin/vendor-submissions/${row.id}/status`}>
                              <input type="hidden" name="source" value="submission_row_duplicate_followup" />
                            <input type="hidden" name="return_to" value={returnTo} />
                              <input type="hidden" name="status" value="needs_followup" />
                              <input type="hidden" name="reason" value={duplicateEscalation} />
                              <button
                                type="submit"
                                className="rounded-xl border border-amber-700 px-2 py-1 text-[10px] font-semibold text-amber-800"
                              >
                                Flag duplicate
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedRows.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <td
                    className="px-4 py-6 text-[var(--muted)]"
                    colSpan={
                      5 +
                      (activeState.showStatus ? 1 : 0) +
                      (activeState.showRouting ? 1 : 0) +
                      (activeState.showDate ? 1 : 0)
                    }
                  >
                    {isFiltering ? "No submissions match this filter and search." : "No vendor-submission rows are queued yet."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {filteredCount > 0 ? (
          <p className="mt-4 text-xs text-[var(--muted)]">
            Showing {pageStart}-{pageEnd} of {filteredCount} matching moderation items.
          </p>
        ) : (
          <p className="mt-4 text-xs text-[var(--muted)]">No vendor submissions are currently queued.</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          {hasPrev ? (
            <Link
              href={buildSubmissionUrl(activeState, { page: safePage - 1 })}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              ← Previous
            </Link>
          ) : (
            <span className="rounded-full border border-transparent bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">← Previous</span>
          )}

          <p className="text-sm font-semibold text-[var(--muted)]">Page {safePage} of {totalPages}</p>

          {hasNext ? (
            <Link
              href={buildSubmissionUrl(activeState, { page: safePage + 1 })}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Next →
            </Link>
          ) : (
            <span className="rounded-full border border-transparent bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">Next →</span>
          )}
        </div>

        <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
          {vendors.length > 0 ? `${vendors.length} vendor records are currently active in the directory.` : "No vendor records are currently available."}
        </p>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var form = document.getElementById("submission-bulk-form");
                if (!form) {
                  return;
                }

                var preview = document.getElementById("submission-bulk-preview");
                var statusInput = form.querySelector('select[name="status"]');
                var reasonInput = form.querySelector('input[name="reason"]');
                var checkboxes = Array.from(form.querySelectorAll('input[name="ids"][type="checkbox"]'));

                var render = function () {
                  var selected = checkboxes.filter(function (checkbox) {
                    return checkbox.checked;
                  });

                  if (selected.length === 0) {
                    preview.textContent = "Select submissions first, then review transition preview.";
                    return;
                  }

                  var targetStatus = statusInput ? statusInput.value : "new";
                  var reason = reasonInput ? reasonInput.value : "";
                  var buckets = {};

                  for (var i = 0; i < selected.length; i += 1) {
                    var nextStatus = selected[i].getAttribute("data-status") || "unknown";
                    buckets[nextStatus] = (buckets[nextStatus] || 0) + 1;
                  }

                  var segments = [];
                  for (var status in buckets) {
                    if (Object.prototype.hasOwnProperty.call(buckets, status)) {
                      segments.push(String(buckets[status]) + " × " + status + " → " + targetStatus);
                    }
                  }

                  var summary = selected.length + " row" + (selected.length === 1 ? "" : "s") + " selected. Transitions: " + segments.join(", ");
                  if (!reason || reason.trim().length === 0) {
                    summary += " ";
                    summary += "Tip: add a short reason to avoid guardrail repeats on quick successive edits.";
                  }

                  preview.textContent = summary;
                };

                checkboxes.forEach(function (checkbox) {
                  checkbox.addEventListener("change", render);
                });

                if (statusInput) {
                  statusInput.addEventListener("change", render);
                }

                if (reasonInput) {
                  reasonInput.addEventListener("input", render);
                }

                render();
              })();
            `,
          }}
        />

        <Link href="/admin" className="mt-6 inline-flex text-sm font-semibold text-[var(--accent)]">
          Return to admin home →
        </Link>
      </div>
    </main>
  );
}














