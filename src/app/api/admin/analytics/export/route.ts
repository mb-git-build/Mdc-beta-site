import { NextRequest, NextResponse } from "next/server";

import { categories, getAdminLeads, getAdminVendorSubmissions, vendors } from "@/lib/site-data";
import { getConversionSummary } from "@/lib/conversion-events";
import { formatQueueCategoryMetricRows } from "@/lib/admin-queue-metrics";
import { buildRetryAfterHeader, checkThrottle, deriveThrottleKey } from "@/lib/request-throttle";

type CsvRow = {
  metric: string;
  value: string | number;
  metadata: string;
};

const ADMIN_ANALYTICS_EXPORT_THROTTLE = {
  limit: 20,
  windowMs: 60000,
};
const ANALYTICS_CSV_MAX_LENGTH = 2000;

function sanitizeCsvField(value: string) {
  const truncated = value.slice(0, ANALYTICS_CSV_MAX_LENGTH);
  const safe = /^[=+\-@]/.test(truncated) ? `'${truncated}` : truncated;

  if (!safe.includes(",") && !safe.includes("\n") && !safe.includes('"')) {
    return safe;
  }

  return `"${safe.replaceAll('"', '""')}"`;
}

function toCsvRow(row: CsvRow): string {
  return [row.metric, String(row.value), row.metadata].map(sanitizeCsvField).join(",");
}

function safeCountRecent(entries: { submittedAt: string }[], horizonHours: number) {
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

async function makeRows() {
  const leadQueue = getAdminLeads();
  const submissionQueue = getAdminVendorSubmissions();
  const conversionSummary = await getConversionSummary({ horizonHours: 24 });

  const rows: CsvRow[] = [];

  const categoryRows = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    count: vendors.filter((vendor) => vendor.categories.includes(category.slug)).length,
  }));

  const topCategories = [...categoryRows].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }

    return a.name.localeCompare(b.name);
  });

  const activeCount = categoryRows.filter((category) => category.count > 0).length;

  rows.push({ metric: "snapshot_generated_at", value: new Date().toISOString(), metadata: "UTC timestamp" });
  rows.push({ metric: "vendors_total", value: vendors.length, metadata: "Total vendor records" });
  rows.push({ metric: "categories_total", value: categories.length, metadata: "Total categories" });
  rows.push({ metric: "categories_active", value: activeCount, metadata: "Categories with >=1 vendor" });
  rows.push({ metric: "vendors_featured", value: vendors.filter((vendor) => vendor.featured).length, metadata: "Featured vendor records" });
  rows.push({ metric: "vendors_verified", value: vendors.filter((vendor) => vendor.verified).length, metadata: "Verified vendor records" });

  rows.push({ metric: "queue_leads_total", value: leadQueue.length, metadata: "Total lead submissions" });
  rows.push({ metric: "queue_submissions_total", value: submissionQueue.length, metadata: "Total vendor submissions" });
  rows.push({ metric: "queue_leads_24h", value: safeCountRecent(leadQueue, 24), metadata: "Lead submissions in last 24h" });
  rows.push({ metric: "queue_leads_7d", value: safeCountRecent(leadQueue, 168), metadata: "Lead submissions in last 7d" });
  rows.push({ metric: "queue_submissions_24h", value: safeCountRecent(submissionQueue, 24), metadata: "Vendor submissions in last 24h" });
  rows.push({ metric: "queue_submissions_7d", value: safeCountRecent(submissionQueue, 168), metadata: "Vendor submissions in last 7d" });

  const claimSubmissionRows = submissionQueue.filter((submission) => submission.type === "claim");
  const claimNeedsFollowup = claimSubmissionRows.filter(
    (submission) => submission.status === "needs_followup" || submission.validationState === "needs_followup",
  ).length;
  const duplicateRiskRows = submissionQueue.filter((submission) => (submission.duplicateConfidence ?? 0) >= 78).length;
  const claimTokenExpired = claimSubmissionRows.filter((submission) => isExpired(submission.claimTokenExpiresAt)).length;
  const claimTokenExpiringSoon = claimSubmissionRows.filter((submission) => isExpiringWithin24h(submission.claimTokenExpiresAt)).length;

  rows.push({ metric: "queue_claim_total", value: claimSubmissionRows.length, metadata: "Vendor claim submissions" });
  rows.push({ metric: "queue_claim_needs_followup", value: claimNeedsFollowup, metadata: "Claims currently marked as needs_followup" });
  rows.push({ metric: "queue_claim_duplicate_risk", value: duplicateRiskRows, metadata: "Vendor submissions with duplicate confidence >= 78" });
  rows.push({ metric: "queue_claim_tokens_expired", value: claimTokenExpired, metadata: "Claim tokens already expired" });
  rows.push({ metric: "queue_claim_tokens_expiring_24h", value: claimTokenExpiringSoon, metadata: "Claim tokens expiring within 24h" });

  rows.push({ metric: "conversion_lead_starts_24h", value: conversionSummary.lead.starts, metadata: "Lead form starts in last 24h" });
  rows.push({ metric: "conversion_lead_submits_24h", value: conversionSummary.lead.submits, metadata: "Lead form submits in last 24h" });
  rows.push({ metric: "conversion_lead_success_24h", value: conversionSummary.lead.successes, metadata: "Lead form success in last 24h" });
  rows.push({ metric: "conversion_lead_queue_inserts_24h", value: conversionSummary.lead.queueInserts, metadata: "Lead queue inserts in last 24h" });
  rows.push({ metric: "conversion_lead_submit_success_rate", value: conversionSummary.lead.submitSuccessRate, metadata: "Lead submit success rate (24h)" });
  rows.push({ metric: "conversion_lead_queue_insert_rate", value: conversionSummary.lead.insertSuccessRate, metadata: "Lead submit to queue insert rate (24h)" });

  rows.push({ metric: "conversion_vendor_submit_starts_24h", value: conversionSummary.vendorSubmit.starts, metadata: "Vendor submission starts in last 24h" });
  rows.push({ metric: "conversion_vendor_submit_submits_24h", value: conversionSummary.vendorSubmit.submits, metadata: "Vendor submission submits in last 24h" });
  rows.push({ metric: "conversion_vendor_submit_success_24h", value: conversionSummary.vendorSubmit.successes, metadata: "Vendor submission success in last 24h" });
  rows.push({ metric: "conversion_vendor_submit_queue_inserts_24h", value: conversionSummary.vendorSubmit.queueInserts, metadata: "Vendor submission queue inserts in last 24h" });

  rows.push({ metric: "conversion_vendor_claim_starts_24h", value: conversionSummary.vendorClaim.starts, metadata: "Vendor claim starts in last 24h" });
  rows.push({ metric: "conversion_vendor_claim_submits_24h", value: conversionSummary.vendorClaim.submits, metadata: "Vendor claim submits in last 24h" });
  rows.push({ metric: "conversion_vendor_claim_success_24h", value: conversionSummary.vendorClaim.successes, metadata: "Vendor claim success in last 24h" });
  rows.push({ metric: "conversion_vendor_claim_queue_inserts_24h", value: conversionSummary.vendorClaim.queueInserts, metadata: "Vendor claim queue inserts in last 24h" });

  rows.push({ metric: "category_rank_start", value: "", metadata: "" });
  for (const category of topCategories) {
    rows.push({
      metric: `category_vendor_count:${category.slug}`,
      value: category.count,
      metadata: `${category.name}`,
    });
  }

  rows.push({ metric: "queue_pressure_start", value: "", metadata: "" });
  rows.push(...formatQueueCategoryMetricRows(leadQueue, submissionQueue));

  return rows;
}

export async function GET(request: NextRequest) {
  const throttle = checkThrottle("admin_analytics_export", deriveThrottleKey(request.headers), ADMIN_ANALYTICS_EXPORT_THROTTLE);

  if (!throttle.ok) {
    return NextResponse.json(
      { ok: false, error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.` },
      {
        status: 429,
        headers: { "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds) },
      },
    );
  }

  const rows = await makeRows();
  const csv = ["metric,value,metadata", ...rows.map(toCsvRow)].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="modulardatacenters-admin-snapshot.csv"',
    },
  });
}
