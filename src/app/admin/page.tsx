import Link from "next/link";
import { categories, getAdminLeads, getAdminVendorSubmissions, vendors } from "@/lib/site-data";
import { formatAuditEvent, getLeadStatuses, getQueueAudit, getSubmissionStatuses } from "@/lib/form-persistence";
import { getConversionSummary } from "@/lib/conversion-events";
import { getQueueCategoryPressure } from "@/lib/admin-queue-metrics";
import { AdminExportDownloadButton } from "@/components/admin-export-download";

function getRouteDelta(entry: { todayTotal: number; yesterdayTotal: number }) {
  return entry.todayTotal - entry.yesterdayTotal;
}

function renderRouteDelta(delta: number) {
  if (delta === 0) {
    return null;
  }

  const isUp = delta > 0;
  const toneClass = isUp ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";

  return (
    <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${toneClass}`}>
      {isUp ? "↑" : "↓"}
      {Math.abs(delta)}
    </span>
  );
}

function buildQueueRoutingLink(path: "/admin/leads" | "/admin/vendor-submissions", routing: string) {
  const query = new URLSearchParams();
  query.set("routing", routing);

  return `${path}?${query.toString()}`;
}

type LeadStatusCount = {
  status: string;
  count: number;
};

type SubmissionStatusCount = {
  status: string;
  count: number;
};

export const dynamic = "force-dynamic";

function getCategoryMetrics() {
  const rows = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    count: vendors.filter((vendor) => vendor.categories.includes(category.slug)).length,
  }));

  const byVendorCount = [...rows].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }

    return a.name.localeCompare(b.name);
  });

  return {
    rows,
    byVendorCount,
    active: rows.filter((row) => row.count > 0).length,
    top: byVendorCount.filter((row) => row.count > 0).slice(0, 3),
    understock: rows.filter((row) => row.count === 0).slice(0, 6),
  };
}

function getRecentQueueCounts(entries: { submittedAt: string }[]) {
  const now = new Date();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  const sevenDaysMs = 7 * twentyFourHoursMs;
  const oneDayAgo = now.getTime() - twentyFourHoursMs;
  const weekAgo = now.getTime() - sevenDaysMs;

  const safeCount = (cutoff: number) =>
    entries.filter((entry) => {
      const ts = Date.parse(entry.submittedAt);
      return Number.isNaN(ts) ? false : ts >= cutoff;
    }).length;

  return {
    last24h: safeCount(oneDayAgo),
    last7d: safeCount(weekAgo),
  };
}

function getLatestUpdate(entries: { submittedAt: string }[]) {
  const latest = [...entries]
    .map((entry) => Date.parse(entry.submittedAt))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];

  if (!latest) {
    return null;
  }

  return new Date(latest).toLocaleString("en-US");
}

function isExpired(expiration?: string) {
  const parsed = Date.parse(expiration ?? "");
  return Number.isFinite(parsed) && parsed <= Date.now();
}

function isExpiringWithin24h(expiration?: string) {
  const parsed = Date.parse(expiration ?? "");
  if (!Number.isFinite(parsed)) {
    return false;
  }

  const remaining = parsed - Date.now();
  return remaining > 0 && remaining <= 24 * 60 * 60 * 1000;
}

export default async function AdminPage() {
  const leadQueue = getAdminLeads();
  const submissionQueue = getAdminVendorSubmissions();
  const recentAudit = await getQueueAudit(8);

  const leadStatusCounts: LeadStatusCount[] = getLeadStatuses().map((status) => ({
    status,
    count: leadQueue.filter((lead) => lead.status === status).length,
  }));

  const submissionStatusCounts: SubmissionStatusCount[] = getSubmissionStatuses().map((status) => ({
    status,
    count: submissionQueue.filter((item) => item.status === status).length,
  }));

  const leadQueuePending = leadQueue.filter((lead) => lead.status === "new").length;
  const submissionQueuePending = submissionQueue.filter((item) => item.status !== "approved" && item.status !== "rejected").length;

  const claimQueue = submissionQueue.filter((submission) => submission.type === "claim");
  const claimNeedsFollowup = claimQueue.filter(
    (submission) => submission.status === "needs_followup" || submission.validationState === "needs_followup",
  ).length;
  const claimDuplicateRisk = submissionQueue.filter((submission) => (submission.duplicateConfidence ?? 0) >= 78).length;
  const claimTokensExpired = claimQueue.filter((submission) => isExpired(submission.claimTokenExpiresAt)).length;
  const claimTokensExpiringSoon = claimQueue.filter((submission) => isExpiringWithin24h(submission.claimTokenExpiresAt)).length;

  const featuredCount = vendors.filter((vendor) => vendor.featured).length;
  const verifiedCount = vendors.filter((vendor) => vendor.verified).length;
  const { top: topCategories, understock, active, rows: categoryRows } = getCategoryMetrics();
  const conversionSummary = await getConversionSummary({ horizonHours: 24 });
  const leadActivity = getRecentQueueCounts(leadQueue);
  const submissionActivity = getRecentQueueCounts(submissionQueue);
  const lastLead = getLatestUpdate(leadQueue);
  const lastSubmission = getLatestUpdate(submissionQueue);
  const exportGeneratedAt = new Date().toLocaleString("en-US");
  const queueCategoryPressure = getQueueCategoryPressure(leadQueue, submissionQueue);

  const adminCards = [
    {
      title: "Leads",
      body: `Queue: ${leadQueuePending} open of ${leadQueue.length} total buyer match requests.`,
      href: "/admin/leads",
    },
    {
      title: "Vendor Submissions",
      body: `Queue: ${submissionQueuePending} open of ${submissionQueue.length} total moderation items. Claim trust follow-up: ${claimNeedsFollowup}.`,
      href: "/admin/vendor-submissions",
    },
    {
      title: "Vendors",
      body: `Manage the vendor directory (${vendors.length} total records) and featured flags.`,
      href: "/admin/vendors",
    },
    {
      title: "Categories",
      body: "Refine taxonomy, descriptions, and category ordering for better routing.",
      href: "/admin/categories",
    },
    {
      title: "Moderation audit",
      body: "Review full status-change history and export audit events for internal reporting.",
      href: "/admin/audit",
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Admin</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            Use this dashboard to review incoming buyer requests, vendor submissions, and directory coverage.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {adminCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 transition hover:border-[var(--accent)]"
            >
              <h2 className="text-lg font-semibold tracking-tight">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{card.body}</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-5">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight">Directory inventory</h2>
            <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
              <p>Total vendors: {vendors.length}</p>
              <p>Categories: {categories.length}</p>
              <p>Active categories: {active}</p>
              <p>Empty categories: {categoryRows.length - active}</p>
              <p>Featured vendors: {featuredCount}</p>
              <p>Verified vendors: {verifiedCount}</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight">Directory depth (top categories)</h2>
            {topCategories.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm">
                {topCategories.map((category) => (
                  <li key={category.slug} className="rounded-xl bg-[#f8fafc] p-3">
                    <Link href={`/directory/${category.slug}`} className="font-semibold text-[var(--foreground)]">
                      {category.name}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--muted)]">{category.count} vendor profiles</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">No categorized vendors yet.</p>
            )}
            {understock.length > 0 ? (
              <>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Categories needing profiles</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {understock.map((category) => (
                    <span
                      key={category.slug}
                      className="rounded-full bg-[#fee2e2] px-2 py-1 text-[11px] font-medium text-[#7f1d1d]"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight">Queue activity</h2>
            <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
              <p>Lead form submissions: {leadQueue.length}</p>
              <p>New leads (24h): {leadActivity.last24h}</p>
              <p>New leads (7d): {leadActivity.last7d}</p>
              <p>Vendor-submission forms: {submissionQueue.length}</p>
              <p>New submissions (24h): {submissionActivity.last24h}</p>
              <p>New submissions (7d): {submissionActivity.last7d}</p>
              <p>Claim requests: {claimQueue.length}</p>
              <p>Claim needs follow-up: {claimNeedsFollowup}</p>
              <p>Claim duplicate-risk candidates: {claimDuplicateRisk}</p>
              <p>Claim tokens expiring within 24h: {claimTokensExpiringSoon}</p>
              <p>Claim tokens expired: {claimTokensExpired}</p>
            </div>
            <p className="mt-4 text-[11px] text-[var(--muted)]">
              Lead freshness: {lastLead ?? "n/a"} · Submission freshness: {lastSubmission ?? "n/a"}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight">Queue routing pressure</h2>
            <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">Open pressure = active review demand</p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Trend = entries in last 24h minus previous 24h.</p>
            {queueCategoryPressure.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm">
                {queueCategoryPressure.slice(0, 5).map((row) => (
                  <li key={row.slug} className="rounded-xl bg-[#f8fafc] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--foreground)]">{row.name}</p>
                      <Link
                        href={buildQueueRoutingLink("/admin/leads", row.slug)}
                        className="rounded-full border border-[#bfdbfe] px-2 py-0.5 text-[10px] font-semibold text-[#1d4ed8]"
                      >
                        leads
                      </Link>
                      <Link
                        href={buildQueueRoutingLink("/admin/vendor-submissions", row.slug)}
                        className="rounded-full border border-[#bae6fd] px-2 py-0.5 text-[10px] font-semibold text-[#0c4a6e]"
                      >
                        submissions
                      </Link>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Leads open/total: {row.leadOpen}/{row.leadTotal} · Submissions open/total: {row.submissionOpen}/{row.submissionTotal}
                      {renderRouteDelta(getRouteDelta(row))}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">No routing signals yet.</p>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight">Operational snapshot</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">Generated: {exportGeneratedAt}</p>
            <AdminExportDownloadButton
              href="/api/admin/analytics/export"
              label="Download CSV snapshot"
              className="mt-4 inline-flex rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white"
              messageClassName="mt-2 text-xs text-amber-600"
              successMessagePrefix="Download prepared"
            />
          </div>
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight">Conversion funnel (24h)</h2>
            <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
              <p>
                Lead starts / submits / success: {conversionSummary.lead.starts} / {conversionSummary.lead.submits} / {conversionSummary.lead.successes}
              </p>
              <p>Lead queue inserts: {conversionSummary.lead.queueInserts}</p>
              <p>Lead submit→success: {conversionSummary.lead.submitSuccessRate}%</p>
              <p>Lead submit→queue: {conversionSummary.lead.insertSuccessRate}%</p>
              <p>
                Vendor starts / submits / success: {conversionSummary.vendorSubmit.starts} / {conversionSummary.vendorSubmit.submits} / {conversionSummary.vendorSubmit.successes}
              </p>
              <p>
                Claim starts / submits / success: {conversionSummary.vendorClaim.starts} / {conversionSummary.vendorClaim.submits} / {conversionSummary.vendorClaim.successes}
              </p>
              <p>Total events tracked: {conversionSummary.totalEvents}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight">Lead queue by status</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {leadStatusCounts.map((entry) => (
                <Link
                  key={entry.status}
                  href={`/admin/leads?status=${entry.status}`}
                  className="inline-flex items-center rounded-full bg-[#eef2ff] px-3 py-1.5 text-xs font-semibold text-[#1e293b]"
                >
                  {entry.status}: {entry.count}
                </Link>
              ))}
              <Link
                href="/admin/leads"
                className="inline-flex items-center rounded-full bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-[#1e293b]"
              >
                all: {leadQueue.length}
              </Link>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight">Submission queue by status</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {submissionStatusCounts.map((entry) => (
                <Link
                  key={entry.status}
                  href={`/admin/vendor-submissions?status=${entry.status}`}
                  className="inline-flex items-center rounded-full bg-[#ecfdf5] px-3 py-1.5 text-xs font-semibold text-[#1e293b]"
                >
                  {entry.status}: {entry.count}
                </Link>
              ))}
              <Link
                href="/admin/vendor-submissions"
                className="inline-flex items-center rounded-full bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-[#1e293b]"
              >
                all: {submissionQueue.length}
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
          <h2 className="text-lg font-semibold tracking-tight">Recent moderation activity</h2>
          {recentAudit.length === 0 ? (
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">No moderation updates yet.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {recentAudit.map((event) => (
                <li key={event.id} className="rounded-xl bg-[#f8fafc] p-3">
                  <p>{formatAuditEvent(event)}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{new Date(event.updatedAt).toLocaleString("en-US")}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Link href="/admin/audit" className="text-sm font-semibold text-[var(--accent)]">
              View full moderation audit trail →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}















