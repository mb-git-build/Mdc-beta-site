import Link from "next/link";

import { AdminLeadRequest, getAdminLeads } from "@/lib/site-data";
import { getLeadStatuses, isValidLeadStatus } from "@/lib/form-persistence";
import { evaluateLeadQuality, LeadQualityAssessment } from "@/lib/lead-qualification";
import { getLeadRoutingTags } from "@/lib/admin-routing-tags";

export const dynamic = "force-dynamic";

type LeadQueueSearchParams = {
  status?: string;
  q?: string;
  routing?: string;
  page?: string;
  limit?: string;
  compact?: string;
  show_status?: string;
  show_routing?: string;
  show_date?: string;
  show_quality?: string;
  status_error?: string;
  status_error_message?: string;
  status_warning?: string;
  status_guard?: string;
  status_missing?: string;
  status_blocked?: string;
  status_blocked_count?: string;
  status_guard_message?: string;
};

type LeadQueueState = {
  status: string;
  q: string;
  routing: string;
  page: number;
  limit: number;
  compact: boolean;
  showStatus: boolean;
  showRouting: boolean;
  showDate: boolean;
  showQuality: boolean;
};

type ScoredLeadRow = {
  lead: AdminLeadRequest;
  quality: LeadQualityAssessment;
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

function statusToneClass(status: AdminLeadRequest["status"]) {
  switch (status) {
    case "contacted":
      return "bg-emerald-50 text-emerald-700";
    case "reviewing":
      return "bg-amber-50 text-amber-700";
    case "closed":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

function qualityToneClass(score: number) {
  if (score >= 80) {
    return "bg-emerald-100 text-emerald-800";
  }

  if (score >= 60) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-rose-100 text-rose-800";
}

function urgencyToneClass(level: LeadQualityAssessment["urgencyLevel"]) {
  if (level === "urgent") {
    return "bg-rose-100 text-rose-800";
  }

  if (level === "soon") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-slate-100 text-slate-700";
}

function validationToneClass(tier: LeadQualityAssessment["validationTier"]) {
  if (tier === "critical") {
    return "text-rose-700";
  }

  if (tier === "warning") {
    return "text-amber-700";
  }

  return "text-emerald-700";
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

function parseFilters(searchParams: LeadQueueSearchParams): LeadQueueState {
  const requestedStatus = normalizeSearch(searchParams?.status);
  const status = isValidLeadStatus(requestedStatus) ? requestedStatus : "all";
  const q = normalizeSearch(searchParams?.q);
  const routing = normalizeSearch(searchParams?.routing) || "all";

  return {
    status,
    q,
    routing,
    page: parsePage(searchParams?.page),
    limit: parseLimit(searchParams?.limit),
    compact: parseBoolean(searchParams?.compact, false),
    showStatus: parseBoolean(searchParams?.show_status, true),
    showRouting: parseBoolean(searchParams?.show_routing, true),
    showDate: parseBoolean(searchParams?.show_date, false),
    showQuality: parseBoolean(searchParams?.show_quality, true),
  };
}

function clampQualityBuckets(rows: ScoredLeadRow[]) {
  const summary = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const row of rows) {
    if (row.quality.scoreLabel === "High") {
      summary.high += 1;
      continue;
    }

    if (row.quality.scoreLabel === "Medium") {
      summary.medium += 1;
      continue;
    }

    summary.low += 1;
  }

  return summary;
}

function buildLeadsUrl(
  base: LeadQueueState,
  overrides: Partial<LeadQueueState> & { page?: number; resetPage?: boolean },
) {
  const next = {
    status: overrides.status ?? base.status,
    q: overrides.q ?? base.q,
    routing: overrides.routing ?? base.routing,
    page: overrides.resetPage ? null : overrides.page ?? base.page,
    limit: overrides.limit ?? base.limit,
    compact: overrides.compact ?? base.compact,
    showStatus: overrides.showStatus ?? base.showStatus,
    showRouting: overrides.showRouting ?? base.showRouting,
    showDate: overrides.showDate ?? base.showDate,
    showQuality: overrides.showQuality ?? base.showQuality,
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

  if (!next.showQuality) {
    params.set("show_quality", "0");
  }

  const query = params.toString();
  return `/admin/leads${query ? `?${query}` : ""}`;
}

function isLeadOpen(status: AdminLeadRequest["status"]) {
  return status === "new" || status === "reviewing" || status === "contacted";
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

function getRoutingSummary(rows: AdminLeadRequest[]): RouteSummary[] {
  const summary = new Map<string, RouteSummary>();

  for (const row of rows) {
    const tags = getLeadRoutingTags(row);
    const resolvedTags =
      tags.length > 0
        ? tags
        : [
            {
              slug: "unmapped",
              name: "Unmapped",
            },
          ];

    const { today, yesterday } = getSubmissionWindowMarkers(row.submittedAt);

    for (const tag of resolvedTags) {
      const current = summary.get(tag.slug);

      if (!current) {
        summary.set(tag.slug, {
          slug: tag.slug,
          label: tag.name,
          total: 1,
          open: isLeadOpen(row.status) ? 1 : 0,
          today: today ? 1 : 0,
          yesterday: yesterday ? 1 : 0,
        });
        continue;
      }

      current.total += 1;
      current.open += isLeadOpen(row.status) ? 1 : 0;
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

function matchesLeadSearch(row: AdminLeadRequest, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }

  const tagText = getLeadRoutingTags(row)
    .map((tag) => tag.name)
    .join(" ")
    .toLowerCase();

  const haystack = `${row.name ?? ""} ${row.company ?? ""} ${row.email ?? ""} ${row.id ?? ""} ${tagText}`.toLowerCase();
  return haystack.includes(searchTerm);
}

function formatRoutingPillLink(baseState: LeadQueueState, route: string) {
  return buildLeadsUrl(baseState, {
    routing: route,
    resetPage: true,
  });
}

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<LeadQueueSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const rows = getAdminLeads();
  const baseState = parseFilters(resolvedSearchParams);

  const requestedRouting = normalizeSearch(resolvedSearchParams?.routing);
  const routingSummary = getRoutingSummary(rows);
  const availableRouting = new Set(routingSummary.map((entry) => entry.slug));
  const routingFilter = requestedRouting && availableRouting.has(requestedRouting) ? requestedRouting : "all";

  const leadRows = rows.filter((row) => {
    if (baseState.status !== "all" && row.status !== baseState.status) {
      return false;
    }

    if (routingFilter !== "all") {
      const tags = getLeadRoutingTags(row);
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

    return matchesLeadSearch(row, baseState.q);
  });

  const statusOptions = ["all", ...getLeadStatuses()] as const;
  const hasStatusError = resolvedSearchParams?.status_error === "1";
  const hasStatusWarning = resolvedSearchParams?.status_warning === "1";
  const hasStatusGuard = resolvedSearchParams?.status_guard === "1";
  const statusErrorMessage = resolvedSearchParams?.status_error_message;
  const missingRows = parseStringList(resolvedSearchParams?.status_missing);
  const blockedTransitions = parseBlockedTransitions(resolvedSearchParams?.status_blocked);
  const blockedRowsCount = parseIntOrZero(resolvedSearchParams?.status_blocked_count);
  const displayedGuardMessage = resolvedSearchParams?.status_guard_message;
  const scoredLeadRows: ScoredLeadRow[] = leadRows.map((lead) => ({
    lead,
    quality: evaluateLeadQuality(lead),
  }));
  const qualityBuckets = clampQualityBuckets(scoredLeadRows);

  const sortedLeadRows = [...scoredLeadRows].sort((a, b) => {
    if (a.quality.score !== b.quality.score) {
      return b.quality.score - a.quality.score;
    }

    if (!a.lead.submittedAt || !b.lead.submittedAt) {
      return 0;
    }

    return Date.parse(b.lead.submittedAt) - Date.parse(a.lead.submittedAt);
  });

  const isFiltering = baseState.status !== "all" || baseState.q.length > 0 || routingFilter !== "all";
  const filteredCount = sortedLeadRows.length;
  const safeLimit = baseState.limit;
  const totalPages = Math.max(1, Math.ceil(filteredCount / safeLimit));
  const safePage = Math.min(Math.max(DEFAULT_PAGE, baseState.page), totalPages);
  const paginatedRows = sortedLeadRows.slice((safePage - 1) * safeLimit, safePage * safeLimit);
  const pageStart = filteredCount === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const pageEnd = Math.min(safePage * safeLimit, filteredCount);
  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;

  const activeState = {
    ...baseState,
    routing: routingFilter,
    page: safePage,
    q: baseState.q,
  };

  const returnTo = buildLeadsUrl(activeState, {});

  const compactClass = activeState.compact ? "px-3 py-2 text-xs" : "px-4 py-3";
  const compactButton = activeState.compact ? "px-3 py-1 text-[11px]" : "px-3 py-2 text-xs";

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Admin / Leads</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-4xl font-semibold tracking-tight">Lead queue</h1>
          <p className="text-sm leading-7 text-[var(--muted)]">Review buyer match requests and track their status.</p>
        </div>

        <section className="sticky top-2 z-20 mt-6 space-y-4 rounded-[1.25rem] border border-[var(--border)] bg-white p-4">
          <form className="flex flex-wrap items-end gap-3" method="get" action="/admin/leads">
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
                className="w-60 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                placeholder="name, company, email"
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
            <input type="hidden" name="routing" value={activeState.routing} />
            <input type="hidden" name="page" value={"1"} />
            <input type="hidden" name="compact" value={activeState.compact ? "1" : "0"} />
            <input type="hidden" name="show_status" value={activeState.showStatus ? "1" : "0"} />
            <input type="hidden" name="show_routing" value={activeState.showRouting ? "1" : "0"} />
            <input type="hidden" name="show_date" value={activeState.showDate ? "1" : "0"} />
            <input type="hidden" name="show_quality" value={activeState.showQuality ? "1" : "0"} />
            <button type="submit" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">
              Apply
            </button>
            <Link href={buildLeadsUrl(activeState, { status: "all", q: "", routing: "all", page: DEFAULT_PAGE })} className="text-sm text-[var(--accent)]">
              Clear filter
            </Link>
          </form>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Views:</span>
            <Link
              href={buildLeadsUrl(activeState, { compact: !activeState.compact })}
              className={`rounded-full border px-3 py-1 ${activeState.compact ? "border-[var(--accent)] text-[var(--accent)]" : "border-slate-200 text-slate-600"}`}
            >
              {activeState.compact ? "Compact on" : "Compact off"}
            </Link>
            <Link
              href={buildLeadsUrl(activeState, { showStatus: !activeState.showStatus })}
              className={`rounded-full border px-3 py-1 ${activeState.showStatus ? "border-[var(--accent)] text-[var(--accent)]" : "border-slate-200 text-slate-600"}`}
            >
              {activeState.showStatus ? "Hide status" : "Show status"}
            </Link>
            <Link
              href={buildLeadsUrl(activeState, { showRouting: !activeState.showRouting })}
              className={`rounded-full border px-3 py-1 ${activeState.showRouting ? "border-[var(--accent)] text-[var(--accent)]" : "border-slate-200 text-slate-600"}`}
            >
              {activeState.showRouting ? "Hide routing" : "Show routing"}
            </Link>
            <Link
              href={buildLeadsUrl(activeState, { showDate: !activeState.showDate })}
              className={`rounded-full border px-3 py-1 ${activeState.showDate ? "border-[var(--accent)] text-[var(--accent)]" : "border-slate-200 text-slate-600"}`}
            >
              {activeState.showDate ? "Hide date" : "Show date"}
            </Link>
            <Link
              href={buildLeadsUrl(activeState, { showQuality: !activeState.showQuality })}
              className={`rounded-full border px-3 py-1 ${activeState.showQuality ? "border-[var(--accent)] text-[var(--accent)]" : "border-slate-200 text-slate-600"}`}
            >
              {activeState.showQuality ? "Hide quality" : "Show quality"}
            </Link>
          </div>

          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">Routing triage</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Trend = entries in last 24h minus previous 24h.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={buildLeadsUrl(activeState, { routing: "all", resetPage: true })}
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
            <div className="mt-2 text-xs text-[var(--muted)]">
              <span className="font-semibold text-slate-600">Lead qualification:</span>
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">High {qualityBuckets.high}</span>
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Medium {qualityBuckets.medium}</span>
              <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-rose-800">Low {qualityBuckets.low}</span>
            </div>
          </section>
        </section>

        <form
          id="lead-bulk-form"
          method="post"
          action="/api/admin/leads/batch-status"
          className="mt-6 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="source" value="lead_bulk_form" />
          <input type="hidden" name="return_to" value={returnTo} />
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Bulk status
            <select
              name="status"
              defaultValue="new"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
            >
              {getLeadStatuses().map((status) => (
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
            form="lead-bulk-form"
            type="submit"
            formAction="/api/admin/leads/batch-status?status=reviewing&source=lead_bulk_quick"
            className="rounded-full border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-700"
          >
            Mark reviewing
          </button>
          <button
            form="lead-bulk-form"
            type="submit"
            formAction="/api/admin/leads/batch-status?status=contacted&source=lead_bulk_quick"
            className="rounded-full border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-700"
          >
            Mark contacted
          </button>
          <button
            form="lead-bulk-form"
            type="submit"
            formAction="/api/admin/leads/batch-status?status=closed&source=lead_bulk_quick"
            className="rounded-full border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-700"
          >
            Mark closed
          </button>
          <p className="w-full text-xs text-[var(--muted)]">Tip: select multiple rows, then use a quick action.</p>
          <p id="lead-bulk-preview" className="w-full text-xs text-[var(--muted)]">
            Select leads first, then review transition preview.
          </p>
        </form>

        {hasStatusError ? (
          <p className="mt-4 text-sm text-rose-600">{statusErrorMessage ?? "No rows were selected. Please select at least one row."}</p>
        ) : null}
        {hasStatusWarning ? <p className="mt-4 text-sm text-amber-600">Some rows could not be updated and were skipped.</p> : null}
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
                    <a href={`#lead-row-${entry.id}`} className="font-medium underline underline-offset-2">
                      {entry.id}
                    </a>
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
            <thead className="bg-[#f7fafc] text-[var(--muted)]">
              <tr>
                <th className={compactClass}>Select</th>
                <th className={compactClass}>Name</th>
                <th className={compactClass}>Company</th>
                <th className={compactClass}>Email</th>
                {activeState.showStatus ? <th className={compactClass}>Status</th> : null}
                {activeState.showQuality ? <th className={compactClass}>Quality</th> : null}
                {activeState.showRouting ? <th className={compactClass}>Routing</th> : null}
                {activeState.showDate ? <th className={compactClass}>Submitted</th> : null}
                <th className={compactClass}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map(({ lead, quality }) => {
                const tags = getLeadRoutingTags(lead);
                const effectiveTags = tags.length > 0 ? tags : [{ slug: "unmapped", name: "Unmapped" }];
                const submitDate = lead.submittedAt ? new Date(lead.submittedAt).toLocaleString("en-US") : "n/a";

                return (
                  <tr id={`lead-row-${lead.id}`} key={lead.id} className="border-t border-[var(--border)]">
                    <td className={compactClass}>
                      <label htmlFor={`lead-${lead.id}`} className="sr-only">
                        Select lead row
                      </label>
                      <input
                        id={`lead-${lead.id}`}
                        form="lead-bulk-form"
                        name="ids"
                        value={lead.id}
                        type="checkbox"
                        data-status={lead.status}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className={compactClass}>{lead.name || "(No name provided)"}</td>
                    <td className={compactClass}>{lead.company || "(No company provided)"}</td>
                    <td className={compactClass}>{lead.email || "(No email provided)"}</td>
                    {activeState.showStatus ? (
                      <td className={compactClass}>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusToneClass(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                    ) : null}
                    {activeState.showQuality ? (
                      <td className={compactClass}>
                        <p className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${qualityToneClass(quality.score)}`}>
                          {quality.score} {quality.scoreLabel}
                        </p>
                        <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${urgencyToneClass(quality.urgencyLevel)}`}>
                          {quality.urgencyLabel}
                        </p>
                        <p className={`mt-1 text-[10px] ${validationToneClass(quality.validationTier)}`}>
                          {quality.validationSummary}
                        </p>
                        <p className="mt-1 text-[10px] text-[var(--muted)]">
                          Route confidence: {quality.routingConfidence}% ({quality.routingConfidenceLabel})
                        </p>
                      </td>
                    ) : null}
                    {activeState.showRouting ? (
                      <td className={compactClass}>
                        <div className="flex flex-wrap gap-1.5">
                          {effectiveTags.map((tag) => (
                            <Link
                              key={`${lead.id}-${tag.slug}`}
                              href={formatRoutingPillLink(activeState, tag.slug)}
                              className="inline-flex rounded-full bg-sky-100 px-2 py-1 text-[11px] font-medium text-sky-800 hover:bg-sky-200"
                            >
                              {tag.name}
                            </Link>
                          ))}
                        </div>
                        <p className="mt-1 text-[10px] text-[var(--muted)]">{quality.routingConfidenceReason}</p>
                      </td>
                    ) : null}
                    {activeState.showDate ? <td className={compactClass}>{submitDate}</td> : null}
                    <td className={compactClass}>
                      <div className="flex flex-col gap-1.5">
                        <form
                          className="flex flex-wrap items-center gap-1"
                          action={`/api/admin/leads/${lead.id}/status`}
                          method="post"
                        >
                          <input type="hidden" name="source" value="lead_row_form" />
                          <input type="hidden" name="return_to" value={returnTo} />
                          <label htmlFor={`lead-status-${lead.id}`} className="sr-only">
                            Lead status
                          </label>
                          <select
                            id={`lead-status-${lead.id}`}
                            name="status"
                            defaultValue={lead.status}
                            className={compactButton}
                          >
                            {getLeadStatuses().map((status) => (
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
                            className={compactButton}
                          />
                          <button
                            type="submit"
                            className="rounded-xl border border-[var(--accent)] px-2 py-1 text-[11px] font-semibold text-[var(--accent)]"
                          >
                            Save
                          </button>
                        </form>
                        <div className="flex flex-wrap gap-1">
                          <form method="post" action={`/api/admin/leads/${lead.id}/status`}>
                            <input type="hidden" name="source" value="lead_row_single" />
                            <input type="hidden" name="return_to" value={returnTo} />
                            <input type="hidden" name="status" value="reviewing" />
                            <button
                              type="submit"
                              className="rounded-xl border border-amber-500 px-2 py-1 text-[10px] font-semibold text-amber-700"
                            >
                              Review
                            </button>
                          </form>
                          <form method="post" action={`/api/admin/leads/${lead.id}/status`}>
                            <input type="hidden" name="source" value="lead_row_single" />
                            <input type="hidden" name="return_to" value={returnTo} />
                            <input type="hidden" name="status" value="contacted" />
                            <button
                              type="submit"
                              className="rounded-xl border border-emerald-600 px-2 py-1 text-[10px] font-semibold text-emerald-700"
                            >
                              Contact
                            </button>
                          </form>
                          <form method="post" action={`/api/admin/leads/${lead.id}/status`}>
                            <input type="hidden" name="source" value="lead_row_single" />
                            <input type="hidden" name="return_to" value={returnTo} />
                            <input type="hidden" name="status" value="closed" />
                            <button
                              type="submit"
                              className="rounded-xl border border-slate-500 px-2 py-1 text-[10px] font-semibold text-slate-700"
                            >
                              Close
                            </button>
                          </form>
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
                      (activeState.showQuality ? 1 : 0) +
                      (activeState.showRouting ? 1 : 0) +
                      (activeState.showDate ? 1 : 0)
                    }
                  >
                    {isFiltering ? "No leads match this filter and search." : "No lead rows are queued yet."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {filteredCount > 0 ? (
          <p className="mt-4 text-xs text-[var(--muted)]">
            Showing {pageStart}-{pageEnd} of {filteredCount} matching leads.
          </p>
        ) : (
          <p className="mt-4 text-xs text-[var(--muted)]">No leads are currently queued.</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          {hasPrev ? (
            <Link
              href={buildLeadsUrl(activeState, { page: safePage - 1 })}
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
              href={buildLeadsUrl(activeState, { page: safePage + 1 })}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Next →
            </Link>
          ) : (
            <span className="rounded-full border border-transparent bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">Next →</span>
          )}
        </div>

        <p className="mt-1 text-xs text-[var(--muted)]">Latest lead: {rows[0]?.submittedAt ? new Date(rows[0].submittedAt).toLocaleString("en-US") : "n/a"}</p>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var form = document.getElementById("lead-bulk-form");
                if (!form) {
                  return;
                }

                var preview = document.getElementById("lead-bulk-preview");
                var statusInput = form.querySelector('select[name="status"]');
                var reasonInput = form.querySelector('input[name="reason"]');
                var checkboxes = Array.from(form.querySelectorAll('input[name="ids"][type="checkbox"]'));

                var render = function () {
                  var selected = checkboxes.filter(function (checkbox) {
                    return checkbox.checked;
                  });

                  if (selected.length === 0) {
                    preview.textContent = "Select leads first, then review transition preview.";
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
