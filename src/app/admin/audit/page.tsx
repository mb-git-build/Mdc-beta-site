import Link from "next/link";

import { AdminExportDownloadButton } from "@/components/admin-export-download";
import { formatAuditEvent, getConfiguredAuditRetentionLimit, getQueueAudit } from "@/lib/form-persistence";

export const dynamic = "force-dynamic";

type AuditQueueType = "lead" | "vendor_submission";

type AuditSearchParams = {
  type?: string;
  q?: string;
  source?: string;
  actor?: string;
  status?: string;
  limit?: string;
  page?: string;
  from?: string;
  to?: string;
};

type AuditQueryState = {
  type: string;
  source: string;
  actor: string;
  status: string;
  q: string;
  limit: number;
  page: number;
  from: string;
  to: string;
};

const DEFAULT_AUDIT_LIMIT = 80;
const MIN_AUDIT_LIMIT = 20;
const MAX_AUDIT_LIMIT = 500;
const DEFAULT_AUDIT_PAGE = 1;

function normalizeSearch(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function parseLimit(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_AUDIT_LIMIT;
  }

  if (parsed < MIN_AUDIT_LIMIT) {
    return MIN_AUDIT_LIMIT;
  }

  if (parsed > MAX_AUDIT_LIMIT) {
    return MAX_AUDIT_LIMIT;
  }

  return parsed;
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < DEFAULT_AUDIT_PAGE) {
    return DEFAULT_AUDIT_PAGE;
  }

  return parsed;
}

function parseDateFilter(value?: string) {
  const normalized = (value ?? "").trim();

  if (!normalized) {
    return "";
  }

  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return normalized;
}

function toDateBoundary(value: string, isEnd: boolean) {
  if (!value) {
    return undefined;
  }

  const base = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(base.getTime())) {
    return undefined;
  }

  if (!isEnd) {
    return base.getTime();
  }

  return new Date(base.getTime() + 24 * 60 * 60 * 1000 - 1).getTime();
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function utcDaysBefore(days: number) {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

  base.setUTCDate(base.getUTCDate() - days);

  return toDateInput(base);
}

function parseFilters(searchParams: AuditSearchParams) {
  const requestedType = normalizeSearch(searchParams?.type);
  const type = isAuditQueueType(requestedType) ? requestedType : "all";
  const q = normalizeSearch(searchParams?.q);
  const source = normalizeSearch(searchParams?.source);
  const actor = normalizeSearch(searchParams?.actor);
  const status = normalizeSearch(searchParams?.status);
  const limit = parseLimit(searchParams?.limit);
  const page = parsePage(searchParams?.page);
  const from = parseDateFilter(searchParams?.from);
  const to = parseDateFilter(searchParams?.to);

  return {
    type,
    q,
    source,
    actor,
    status,
    limit,
    page,
    from,
    to,
  };
}

function isAuditQueueType(value: string): value is AuditQueueType {
  return value === "lead" || value === "vendor_submission";
}

function buildTargetUrl(event: {
  queueType: "lead" | "vendor_submission";
  itemId: string;
}) {
  const target = event.queueType === "lead" ? "/admin/leads" : "/admin/vendor-submissions";
  const query = new URLSearchParams({ q: event.itemId });

  return `${target}?${query.toString()}`;
}

function getSourceLabel(value?: string) {
  return value || "admin_ui";
}

function buildFilterValues<T>(rows: T[], selector: (value: T) => string | undefined | null) {
  const values = new Set<string>(["all"]);

  for (const row of rows) {
    const selected = selector(row)?.trim();
    if (selected) {
      values.add(selected.toLowerCase());
    }
  }

  return [...values].sort((a, b) => a.localeCompare(b));
}

function buildStatusFilterValues(rows: Awaited<ReturnType<typeof getQueueAudit>>): string[] {
  const values = new Set<string>(["all"]);

  for (const row of rows) {
    const from = row.previousStatus.trim().toLowerCase();
    const to = row.newStatus.trim().toLowerCase();

    if (from) {
      values.add(from);
    }

    if (to) {
      values.add(to);
    }
  }

  return [...values].sort((a, b) => a.localeCompare(b));
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleString("en-US");
}

function buildAuditHref(
  base: AuditQueryState,
  overrides: {
    type?: string | null;
    source?: string | null;
    actor?: string | null;
    status?: string | null;
    q?: string | null;
    limit?: number | null;
    page?: number | null;
    from?: string | null;
    to?: string | null;
  },
) {
  const nextType = overrides.type ?? base.type;
  const nextSource = overrides.source ?? base.source;
  const nextActor = overrides.actor ?? base.actor;
  const nextStatus = overrides.status ?? base.status;
  const nextQ = overrides.q !== undefined ? overrides.q : base.q;
  const nextLimit = overrides.limit ?? base.limit;
  const nextPage = overrides.page !== undefined ? overrides.page : base.page;
  const nextFrom = overrides.from !== undefined ? overrides.from : base.from;
  const nextTo = overrides.to !== undefined ? overrides.to : base.to;

  const params = new URLSearchParams();

  if (nextType && nextType !== "all") {
    params.set("type", nextType);
  }

  if (nextSource && nextSource !== "all") {
    params.set("source", nextSource);
  }

  if (nextActor && nextActor !== "all") {
    params.set("actor", nextActor);
  }

  if (nextStatus && nextStatus !== "all") {
    params.set("status", nextStatus);
  }

  if (nextQ) {
    params.set("q", nextQ);
  }

  if (nextLimit) {
    params.set("limit", String(Math.max(1, nextLimit)));
  }

  if (nextPage && nextPage > 1) {
    params.set("page", String(Math.max(DEFAULT_AUDIT_PAGE, nextPage)));
  }

  if (nextFrom) {
    params.set("from", nextFrom);
  }

  if (nextTo) {
    params.set("to", nextTo);
  }

  const query = params.toString();
  return `/admin/audit${query ? `?${query}` : ""}`;
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<AuditSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const { type, q, source, actor, status, limit, page, from, to } = parseFilters(resolvedSearchParams);
  const rows = await getQueueAudit(MAX_AUDIT_LIMIT);
  const retentionLimit = getConfiguredAuditRetentionLimit();

  const sourceFilterOptions = buildFilterValues(rows, (row) => getSourceLabel(row.source));
  const actorFilterOptions = buildFilterValues(rows, (row) => row.actor);
  const statusFilterOptions = buildStatusFilterValues(rows);

  const fromTimestamp = toDateBoundary(from, false);
  const toTimestamp = toDateBoundary(to, true);

  const exportFilter = new URLSearchParams({
    ...(type === "all" ? {} : { type }),
    ...(source && source !== "all" ? { source } : {}),
    ...(actor && actor !== "all" ? { actor } : {}),
    ...(status && status !== "all" ? { status } : {}),
    ...(q ? { q } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    limit: String(limit),
  });
  const exportUrl = `/api/admin/audit/export?${exportFilter.toString()}`;
  const jsonExportFilter = new URLSearchParams(exportFilter);
  jsonExportFilter.set("format", "json");
  const jsonExportUrl = `/api/admin/audit/export?${jsonExportFilter.toString()}`;

  const filteredRows = rows.filter((entry) => {
    const eventSource = getSourceLabel(entry.source).toLowerCase();
    const eventActor = entry.actor.toLowerCase();
    const statusFrom = entry.previousStatus.toLowerCase();
    const statusTo = entry.newStatus.toLowerCase();
    const updatedAt = new Date(entry.updatedAt).getTime();

    if (type !== "all" && entry.queueType !== type) {
      return false;
    }

    if (source && source !== "all" && eventSource !== source) {
      return false;
    }

    if (actor && actor !== "all" && eventActor !== actor) {
      return false;
    }

    if (status && status !== "all" && status !== statusFrom && status !== statusTo) {
      return false;
    }

    if (fromTimestamp !== undefined && updatedAt < fromTimestamp) {
      return false;
    }

    if (toTimestamp !== undefined && updatedAt > toTimestamp) {
      return false;
    }

    if (!q) {
      return true;
    }

    const haystack = `${entry.id} ${entry.itemId} ${entry.itemLabel} ${entry.actor} ${getSourceLabel(
      entry.source,
    )} ${entry.previousStatus} ${entry.newStatus}`.toLowerCase();

    return haystack.includes(q);
  });

  const filteredCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / limit));
  const safePage = Math.min(Math.max(DEFAULT_AUDIT_PAGE, page), totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * limit, safePage * limit);
  const pageStart = filteredCount === 0 ? 0 : (safePage - 1) * limit + 1;
  const pageEnd = Math.min(safePage * limit, filteredCount);

  const baseQuery: AuditQueryState = { type, source, actor, status, q, limit, page: safePage, from, to };
  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;
  const now = new Date();
  const todayInput = toDateInput(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)),
  );

  const presetLinks: { label: string; from?: string; to?: string }[] = [
    {
      label: "All time",
      from: "",
      to: "",
    },
    {
      label: "Last 24h",
      from: utcDaysBefore(1),
      to: todayInput,
    },
    {
      label: "Last 7d",
      from: utcDaysBefore(7),
      to: todayInput,
    },
    {
      label: "Last 30d",
      from: utcDaysBefore(30),
      to: todayInput,
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Admin / Audit Trail</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-4xl font-semibold tracking-tight">Moderation audit trail</h1>
          <p className="text-sm leading-7 text-[var(--muted)]">Review status transitions for lead and vendor moderation actions.</p>
        </div>

        <form method="get" className="mt-6 flex flex-wrap items-end gap-3" action="/admin/audit">
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Filter queue
            <select name="type" defaultValue={type} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
              <option value="all">All</option>
              <option value="lead">Lead queue</option>
              <option value="vendor_submission">Vendor submissions</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Source
            <select name="source" defaultValue={source || "all"} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
              {sourceFilterOptions.map((sourceValue) => (
                <option key={sourceValue} value={sourceValue}>
                  {sourceValue}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Actor
            <select name="actor" defaultValue={actor || "all"} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
              {actorFilterOptions.map((actorValue) => (
                <option key={actorValue} value={actorValue}>
                  {actorValue}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Status
            <select name="status" defaultValue={status || "all"} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
              {statusFilterOptions.map((statusValue) => (
                <option key={statusValue} value={statusValue}>
                  {statusValue}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Search
            <input
              name="q"
              defaultValue={q}
              className="w-72 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
              placeholder="label, id, status, actor"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            From
            <input
              name="from"
              type="date"
              defaultValue={from}
              className="w-36 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            To
            <input
              name="to"
              type="date"
              defaultValue={to}
              className="w-36 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Rows
            <input
              name="limit"
              defaultValue={String(limit)}
              type="number"
              min={MIN_AUDIT_LIMIT}
              max={MAX_AUDIT_LIMIT}
              step={20}
              className="w-24 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <button type="submit" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">
            Apply
          </button>
          <Link href="/admin/audit" className="text-sm text-[var(--accent)]">
            Clear
          </Link>
          <AdminExportDownloadButton href={exportUrl} label="Export CSV" className="ml-auto rounded-full border border-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent)]" messageClassName="mt-2 text-xs text-amber-600" />
          <AdminExportDownloadButton
            href={jsonExportUrl}
            label="Export incident pack (JSON)"
            className="rounded-full border border-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
            messageClassName="mt-2 text-xs text-amber-600"
          />
        </form>

        <div className="mt-3 text-xs text-[var(--muted)]">
          Loaded rows cap: <strong>{MAX_AUDIT_LIMIT}</strong> (configured audit retention: <strong>{retentionLimit}</strong>).
          Optional incident bundle and retention maintenance are available at <code>/api/admin/audit/export</code> and <code>/api/admin/audit/maintenance</code>.
        </div>

        <form method="post" action="/api/admin/audit/maintenance" className="mt-3 flex flex-wrap items-center gap-2">
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Prune audit entries older than (days)
            <input
              name="maxAgeDays"
              type="number"
              min={1}
              defaultValue={30}
              className="w-32 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Dry run?
            <input type="checkbox" name="dryRun" value="true" className="h-4 w-4" />
          </label>
          <button type="submit" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
            Run maintenance
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--muted)]">Quick ranges:</span>
          {presetLinks.map((preset) => {
            const linkFrom = preset.from || "";
            const linkTo = preset.to || "";

            return (
              <Link
                key={`${preset.label}-${linkFrom}-${linkTo}`}
                href={buildAuditHref(baseQuery, {
                  from: linkFrom || null,
                  to: linkTo || null,
                  page: null,
                })}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {preset.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[var(--border)]">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#f7fafc] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Queue</th>
                <th className="px-4 py-3 font-medium">Transition</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Jump</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[var(--muted)]" colSpan={8}>
                    No audit entries match these filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((event) => {
                  const eventSource = normalizeSearch(getSourceLabel(event.source));
                  const eventActor = normalizeSearch(event.actor);
                  const previousStatus = normalizeSearch(event.previousStatus);
                  const nextStatus = normalizeSearch(event.newStatus);

                  return (
                    <tr key={event.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-3">{formatDate(event.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            event.queueType === "lead" ? "bg-blue-50 text-blue-700" : "bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {event.queueType === "lead" ? "Lead" : "Vendor"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{formatAuditEvent(event)}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          <Link
                            href={buildAuditHref(baseQuery, { status: previousStatus, page: null })}
                            className="rounded-full border border-slate-200 px-2 py-1"
                          >
                            {previousStatus}
                          </Link>
                          <span className="mx-1">→</span>
                          <Link
                            href={buildAuditHref(baseQuery, { status: nextStatus, page: null })}
                            className="rounded-full border border-slate-200 px-2 py-1"
                          >
                            {nextStatus}
                          </Link>
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--muted)]">
                        <Link href={buildTargetUrl(event)} className="font-medium text-[var(--accent)] hover:underline">
                          {event.itemLabel}
                        </Link>
                        <p className="mt-1 text-[10px]">{event.itemId}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--muted)]">
                        <Link
                          href={buildAuditHref(baseQuery, { actor: eventActor, q: "", page: null })}
                          className="inline-flex rounded-full bg-slate-100 px-2 py-1 font-semibold text-[11px] text-slate-800"
                        >
                          {event.actor}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--muted)]">
                        <Link
                          href={buildAuditHref(baseQuery, { source: eventSource, q: "", page: null })}
                          className="inline-flex rounded-full bg-slate-100 px-2 py-1 font-semibold text-[11px] text-slate-800"
                        >
                          {getSourceLabel(event.source)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--muted)]">
                        {event.reason ? event.reason : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={buildTargetUrl(event)}
                          className="inline-flex rounded-full border border-[#bfdbfe] px-2 py-1 text-[11px] font-semibold text-[#1d4ed8]"
                        >
                          Open in queue
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-[var(--muted)]">
          Showing {pageStart}-{pageEnd} of {filteredCount} matching moderation events (from {rows.length} loaded).
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          {hasPrev ? (
            <Link
              href={buildAuditHref(baseQuery, { page: safePage - 1 })}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              ← Previous
            </Link>
          ) : (
            <span className="rounded-full border border-transparent bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">
              ← Previous
            </span>
          )}

          <p className="text-sm font-semibold text-[var(--muted)]">Page {safePage} of {totalPages}</p>

          {hasNext ? (
            <Link
              href={buildAuditHref(baseQuery, { page: safePage + 1 })}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Next →
            </Link>
          ) : (
            <span className="rounded-full border border-transparent bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">
              Next →
            </span>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Link href="/admin" className="inline-flex text-sm font-semibold text-[var(--accent)]">
            Return to admin home →
          </Link>
          <Link href="/admin/leads" className="inline-flex text-sm text-[var(--accent)]">
            Open lead queue
          </Link>
        </div>
      </div>
    </main>
  );
}









