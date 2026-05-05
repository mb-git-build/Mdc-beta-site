import Link from "next/link";

import { AdminExportDownloadButton } from "@/components/admin-export-download";
import { getQueueCategoryPressure } from "@/lib/admin-queue-metrics";
import { getConversionSummary } from "@/lib/conversion-events";
import { getLeadStatuses, getSubmissionStatuses } from "@/lib/form-persistence";
import { categories, getAdminLeads, getAdminVendorSubmissions, type AdminLeadRequest, type AdminVendorSubmission, vendors } from "@/lib/site-data";

export const dynamic = "force-dynamic";

type AlertTone = "critical" | "warning" | "info";

type OperatorAlert = {
  id: string;
  tone: AlertTone;
  title: string;
  body: string;
  href: string;
  cta: string;
};

function getRouteDelta(entry: { todayTotal: number; yesterdayTotal: number }) {
  return entry.todayTotal - entry.yesterdayTotal;
}

function renderRouteDelta(delta: number) {
  if (delta === 0) {
    return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">flat</span>;
  }

  const isUp = delta > 0;
  const toneClass = isUp ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClass}`}>
      {isUp ? "↑" : "↓"}
      {Math.abs(delta)} vs prev 24h
    </span>
  );
}

function buildQueueRoutingLink(path: "/admin/leads" | "/admin/vendor-submissions", routing: string) {
  const query = new URLSearchParams();
  query.set("routing", routing);

  return `${path}?${query.toString()}`;
}

function safeCountRecent(entries: Array<AdminLeadRequest | AdminVendorSubmission>, horizonHours: number) {
  const cutoff = Date.now() - horizonHours * 60 * 60 * 1000;
  return entries.filter((entry) => {
    const ts = Date.parse(entry.submittedAt);
    return Number.isFinite(ts) && ts >= cutoff;
  }).length;
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

function getTopCategoryCoverage() {
  return categories
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      count: vendors.filter((vendor) => vendor.categories.includes(category.slug)).length,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.name.localeCompare(b.name);
    })
    .slice(0, 5);
}

function rateTone(rate: number) {
  if (rate >= 80) {
    return "text-emerald-700";
  }

  if (rate >= 50) {
    return "text-amber-700";
  }

  return "text-rose-700";
}

function alertToneClasses(tone: AlertTone) {
  switch (tone) {
    case "critical":
      return {
        card: "border-rose-200 bg-rose-50",
        badge: "bg-rose-100 text-rose-800",
        cta: "text-rose-700",
      };
    case "warning":
      return {
        card: "border-amber-200 bg-amber-50",
        badge: "bg-amber-100 text-amber-800",
        cta: "text-amber-700",
      };
    default:
      return {
        card: "border-sky-200 bg-sky-50",
        badge: "bg-sky-100 text-sky-800",
        cta: "text-sky-700",
      };
  }
}

function buildOperatorAlerts(args: {
  leadQueue: AdminLeadRequest[];
  submissionQueue: AdminVendorSubmission[];
  leadSubmitSuccessRate: number;
  vendorSubmitSuccessRate: number;
  vendorClaimSuccessRate: number;
  claimNeedsFollowup: number;
  claimDuplicateRisk: number;
  claimTokenExpired: number;
  claimTokenExpiringSoon: number;
  topPressure: ReturnType<typeof getQueueCategoryPressure>;
}) {
  const alerts: OperatorAlert[] = [];

  const openLeads = args.leadQueue.filter((lead) => lead.status !== "closed").length;
  const freshLeads = safeCountRecent(args.leadQueue, 24);
  const openSubmissions = args.submissionQueue.filter(
    (submission) => submission.status !== "approved" && submission.status !== "rejected",
  ).length;

  if (args.claimTokenExpired > 0) {
    alerts.push({
      id: "expired-claim-tokens",
      tone: "critical",
      title: "Expired claim tokens need trust triage",
      body: `${args.claimTokenExpired} claim token${args.claimTokenExpired === 1 ? " is" : "s are"} already expired. Review the alert queue and resolve stale claim trust follow-ups.`,
      href: "/admin/vendor-submissions?focus=tokens_expired",
      cta: "Open expired token queue →",
    });
  }

  if (args.claimNeedsFollowup > 0) {
    alerts.push({
      id: "claim-followup",
      tone: args.claimNeedsFollowup >= 3 ? "critical" : "warning",
      title: "Claim follow-up queue is active",
      body: `${args.claimNeedsFollowup} claim item${args.claimNeedsFollowup === 1 ? " is" : "s are"} sitting in needs_followup and likely want an operator decision.`,
      href: "/admin/vendor-submissions?focus=needs_followup",
      cta: "Open follow-up lane →",
    });
  }

  if (args.claimTokenExpiringSoon > 0) {
    alerts.push({
      id: "claim-tokens-expiring",
      tone: "warning",
      title: "Claim tokens are expiring within 24 hours",
      body: `${args.claimTokenExpiringSoon} active claim token${args.claimTokenExpiringSoon === 1 ? " is" : "s are"} nearing expiry. Review before vendors fall into a stale trust loop.`,
      href: "/admin/vendor-submissions?focus=tokens_alerts",
      cta: "Open token alerts →",
    });
  }

  if (args.claimDuplicateRisk > 0) {
    alerts.push({
      id: "duplicate-risk",
      tone: args.claimDuplicateRisk >= 3 ? "warning" : "info",
      title: "Duplicate-risk claim traffic detected",
      body: `${args.claimDuplicateRisk} submission${args.claimDuplicateRisk === 1 ? " has" : "s have"} high duplicate confidence and may need manual trust review or merge handling.`,
      href: "/admin/vendor-submissions?focus=duplicate_risk",
      cta: "Review duplicate-risk queue →",
    });
  }

  if (args.leadSubmitSuccessRate > 0 && args.leadSubmitSuccessRate < 70) {
    alerts.push({
      id: "lead-funnel-dropoff",
      tone: args.leadSubmitSuccessRate < 50 ? "critical" : "warning",
      title: "Lead funnel success rate looks soft",
      body: `Lead submit→success is ${args.leadSubmitSuccessRate}%, which suggests friction or validation drop-off in the buyer intake path.`,
      href: "/get-matched",
      cta: "Inspect buyer intake path →",
    });
  }

  if (args.vendorSubmitSuccessRate > 0 && args.vendorSubmitSuccessRate < 70) {
    alerts.push({
      id: "vendor-submit-dropoff",
      tone: args.vendorSubmitSuccessRate < 50 ? "critical" : "warning",
      title: "Vendor submission funnel needs attention",
      body: `Vendor submit→success is ${args.vendorSubmitSuccessRate}%, so the vendor onboarding path may be too heavy or unclear.`,
      href: "/for-vendors/submit",
      cta: "Inspect vendor submit path →",
    });
  }

  if (args.vendorClaimSuccessRate > 0 && args.vendorClaimSuccessRate < 70) {
    alerts.push({
      id: "vendor-claim-dropoff",
      tone: args.vendorClaimSuccessRate < 50 ? "critical" : "warning",
      title: "Vendor claim flow is dropping users",
      body: `Vendor claim submit→success is ${args.vendorClaimSuccessRate}%, so claim UX or validation may be blocking completions.`,
      href: "/for-vendors/claim",
      cta: "Inspect claim flow →",
    });
  }

  if (openLeads >= 8 || (openLeads >= 4 && freshLeads === 0)) {
    alerts.push({
      id: "lead-queue-buildup",
      tone: openLeads >= 8 ? "critical" : "warning",
      title: "Lead queue needs operator motion",
      body: `${openLeads} lead${openLeads === 1 ? " is" : "s are"} still open. ${freshLeads === 0 ? "No fresh leads landed in the last 24h, so backlog cleanup should be cheap." : `${freshLeads} arrived in the last 24h.`}`,
      href: "/admin/leads",
      cta: "Open lead queue →",
    });
  }

  if (openSubmissions >= 8) {
    alerts.push({
      id: "submission-queue-buildup",
      tone: "warning",
      title: "Vendor moderation queue is getting thick",
      body: `${openSubmissions} vendor submission item${openSubmissions === 1 ? " is" : "s are"} still open across review states.`,
      href: "/admin/vendor-submissions",
      cta: "Open submission queue →",
    });
  }

  const hottestCategory = args.topPressure[0];
  if (hottestCategory && hottestCategory.pressure >= 3) {
    alerts.push({
      id: "routing-hotspot",
      tone: "info",
      title: `Routing hotspot: ${hottestCategory.name}`,
      body: `${hottestCategory.pressure} open queue item${hottestCategory.pressure === 1 ? " is" : "s are"} clustered here across lead + vendor moderation.`,
      href: buildQueueRoutingLink("/admin/leads", hottestCategory.slug),
      cta: "Open hottest lead route →",
    });
  }

  return alerts.slice(0, 6);
}

export default async function AdminAnalyticsPage() {
  const leadQueue = getAdminLeads();
  const submissionQueue = getAdminVendorSubmissions();
  const conversionSummary = await getConversionSummary({ horizonHours: 24 });
  const queuePressure = getQueueCategoryPressure(leadQueue, submissionQueue);

  const leadStatusCounts = getLeadStatuses().map((status) => ({
    status,
    count: leadQueue.filter((lead) => lead.status === status).length,
  }));

  const submissionStatusCounts = getSubmissionStatuses().map((status) => ({
    status,
    count: submissionQueue.filter((submission) => submission.status === status).length,
  }));

  const claimQueue = submissionQueue.filter((submission) => submission.type === "claim");
  const claimNeedsFollowup = claimQueue.filter(
    (submission) => submission.status === "needs_followup" || submission.validationState === "needs_followup",
  ).length;
  const claimDuplicateRisk = submissionQueue.filter((submission) => (submission.duplicateConfidence ?? 0) >= 78).length;
  const claimTokenExpired = claimQueue.filter((submission) => isExpired(submission.claimTokenExpiresAt)).length;
  const claimTokenExpiringSoon = claimQueue.filter((submission) => isExpiringWithin24h(submission.claimTokenExpiresAt)).length;

  const topPressure = queuePressure.slice(0, 6);
  const topCoverage = getTopCategoryCoverage();
  const operatorAlerts = buildOperatorAlerts({
    leadQueue,
    submissionQueue,
    leadSubmitSuccessRate: conversionSummary.lead.submitSuccessRate,
    vendorSubmitSuccessRate: conversionSummary.vendorSubmit.submitSuccessRate,
    vendorClaimSuccessRate: conversionSummary.vendorClaim.submitSuccessRate,
    claimNeedsFollowup,
    claimDuplicateRisk,
    claimTokenExpired,
    claimTokenExpiringSoon,
    topPressure: queuePressure,
  });

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Admin analytics</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Operational analytics</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            Read the last 24 hours across conversion flow, moderation queues, and category routing pressure without exporting raw files first.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <AdminExportDownloadButton
              href="/api/admin/analytics/export"
              label="Download CSV snapshot"
              className="inline-flex rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white"
              messageClassName="mt-2 text-xs text-amber-600"
              successMessagePrefix="Download prepared"
            />
            <Link
              href="/admin"
              className="inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Back to dashboard
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Operator alerts</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">Actionable watch items generated from the current analytics snapshot.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {operatorAlerts.length} active
            </span>
          </div>
          {operatorAlerts.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {operatorAlerts.map((alert) => {
                const classes = alertToneClasses(alert.tone);
                return (
                  <div key={alert.id} className={`rounded-2xl border p-4 ${classes.card}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-semibold tracking-tight">{alert.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${classes.badge}`}>
                        {alert.tone}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{alert.body}</p>
                    <Link href={alert.href} className={`mt-4 inline-flex text-sm font-semibold ${classes.cta}`}>
                      {alert.cta}
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">No urgent operator alerts right now. The current snapshot looks calm.</p>
          )}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Lead funnel</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{conversionSummary.lead.starts}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">starts in the last 24h</p>
            <p className="mt-4 text-sm text-[var(--muted)]">submits: {conversionSummary.lead.submits}</p>
            <p className={`text-sm font-semibold ${rateTone(conversionSummary.lead.submitSuccessRate)}`}>
              submit→success: {conversionSummary.lead.submitSuccessRate}%
            </p>
            <p className={`text-sm font-semibold ${rateTone(conversionSummary.lead.insertSuccessRate)}`}>
              success→queue: {conversionSummary.lead.insertSuccessRate}%
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Vendor submit funnel</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{conversionSummary.vendorSubmit.starts}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">starts in the last 24h</p>
            <p className="mt-4 text-sm text-[var(--muted)]">submits: {conversionSummary.vendorSubmit.submits}</p>
            <p className={`text-sm font-semibold ${rateTone(conversionSummary.vendorSubmit.submitSuccessRate)}`}>
              submit→success: {conversionSummary.vendorSubmit.submitSuccessRate}%
            </p>
            <p className={`text-sm font-semibold ${rateTone(conversionSummary.vendorSubmit.insertSuccessRate)}`}>
              success→queue: {conversionSummary.vendorSubmit.insertSuccessRate}%
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Vendor claim funnel</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{conversionSummary.vendorClaim.starts}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">starts in the last 24h</p>
            <p className="mt-4 text-sm text-[var(--muted)]">submits: {conversionSummary.vendorClaim.submits}</p>
            <p className={`text-sm font-semibold ${rateTone(conversionSummary.vendorClaim.submitSuccessRate)}`}>
              submit→success: {conversionSummary.vendorClaim.submitSuccessRate}%
            </p>
            <p className={`text-sm font-semibold ${rateTone(conversionSummary.vendorClaim.insertSuccessRate)}`}>
              success→queue: {conversionSummary.vendorClaim.insertSuccessRate}%
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Events tracked</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{conversionSummary.totalEvents}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">conversion events in the last 24h</p>
            <p className="mt-4 text-sm text-[var(--muted)]">lead queue inserts: {conversionSummary.lead.queueInserts}</p>
            <p className="text-sm text-[var(--muted)]">vendor submit queue inserts: {conversionSummary.vendorSubmit.queueInserts}</p>
            <p className="text-sm text-[var(--muted)]">claim queue inserts: {conversionSummary.vendorClaim.queueInserts}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight">Queue health snapshot</h2>
            <div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
              <p>Lead submissions (24h): {safeCountRecent(leadQueue, 24)}</p>
              <p>Lead submissions (7d): {safeCountRecent(leadQueue, 168)}</p>
              <p>Vendor submissions (24h): {safeCountRecent(submissionQueue, 24)}</p>
              <p>Vendor submissions (7d): {safeCountRecent(submissionQueue, 168)}</p>
              <p>Claim queue total: {claimQueue.length}</p>
              <p>Needs follow-up: {claimNeedsFollowup}</p>
              <p>Duplicate risk: {claimDuplicateRisk}</p>
              <p>Tokens expiring &lt;24h: {claimTokenExpiringSoon}</p>
              <p>Tokens expired: {claimTokenExpired}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin/vendor-submissions?focus=tokens_alerts" className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-xs font-semibold text-[#1e293b]">
                token alerts
              </Link>
              <Link href="/admin/vendor-submissions?focus=needs_followup" className="rounded-full bg-[#fef3c7] px-3 py-1.5 text-xs font-semibold text-[#92400e]">
                follow-up queue
              </Link>
            </div>
          </div>

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
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight">Routing pressure by category</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Where open queue demand is clustering right now.</p>
            {topPressure.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm">
                {topPressure.map((row) => (
                  <li key={row.slug} className="rounded-xl bg-[#f8fafc] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--foreground)]">{row.name}</p>
                      {renderRouteDelta(getRouteDelta(row))}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      pressure: {row.pressure} · leads open/total: {row.leadOpen}/{row.leadTotal} · submissions open/total: {row.submissionOpen}/{row.submissionTotal}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={buildQueueRoutingLink("/admin/leads", row.slug)}
                        className="rounded-full border border-[#bfdbfe] px-2 py-0.5 text-[10px] font-semibold text-[#1d4ed8]"
                      >
                        open leads
                      </Link>
                      <Link
                        href={buildQueueRoutingLink("/admin/vendor-submissions", row.slug)}
                        className="rounded-full border border-[#bae6fd] px-2 py-0.5 text-[10px] font-semibold text-[#0c4a6e]"
                      >
                        open submissions
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">No routing signals yet.</p>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight">Directory coverage</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">The categories with the deepest current vendor coverage.</p>
            {topCoverage.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm">
                {topCoverage.map((category) => (
                  <li key={category.slug} className="rounded-xl bg-[#f8fafc] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/directory/${category.slug}`} className="font-semibold text-[var(--foreground)]">
                        {category.name}
                      </Link>
                      <span className="rounded-full bg-[#e2e8f0] px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {category.count} vendors
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">No directory coverage data yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
