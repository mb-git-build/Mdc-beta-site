import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { getDataPath } from "@/lib/storage-paths";

import {
  AdminLeadRequest,
  AdminLeadStatus,
  AdminSubmissionStatus,
  AdminSubmissionType,
  AdminVendorSubmission,
  VendorSubmissionDuplicateMatch,
  VendorSubmissionStatusTrailEntry,
  categories,
  vendors,
} from "@/lib/site-data";
import { recordConversionEvent } from "@/lib/conversion-events";

type FormPayload = Record<string, string>;

type QueueQueueType = "lead" | "vendor_submission";

const dataDir = getDataPath("");
const adminLeadsPath = getDataPath("admin_leads.json");
const adminVendorSubmissionsPath = getDataPath("admin_vendor_submissions.json");
const adminQueueAuditPath = getDataPath("admin_queue_audit.json");

const validLeadStatuses: AdminLeadStatus[] = ["new", "reviewing", "contacted", "closed"];
const validSubmissionStatuses: AdminSubmissionStatus[] = [
  "new",
  "in_review",
  "approved",
  "needs_more_info",
  "rejected",
  "claimed",
  "verified",
  "needs_followup",
];

function pick(...values: string[]) {
  for (const value of values) {
    const text = normalize(value);
    if (text.length > 0) {
      return text;
    }
  }

  return "";
}

function normalize(value?: string) {
  return (value ?? "").trim();
}

function normalizeLookup(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CLAIM_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DUPLICATE_SCORE_THRESHOLD = 78;
const MAX_DUPLICATE_MATCHES = 3;

function normalizeWebsite(value?: string) {
  const text = normalize(value).toLowerCase();
  if (!text) {
    return "";
  }

  const normalized = text.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  return normalized.replace(/\s+/g, "").trim();
}

function splitTokens(value: string) {
  return normalizeLookup(value)
    .split(" ")
    .filter(Boolean)
    .filter((token) => token.length > 1);
}

function intersectionShare(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return { overlap: 0, total: Math.max(left.length, right.length, 1) };
  }

  const rightSet = new Set(right);
  const overlap = left.filter((token) => rightSet.has(token)).length;

  return { overlap, total: Math.max(left.length, right.length) };
}

function calculateNameSimilarity(left: string, right: string) {
  const leftTokens = splitTokens(left);
  const rightTokens = splitTokens(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return 0;
  }

  const exactLeft = normalizeLookup(left);
  const exactRight = normalizeLookup(right);

  if (!exactLeft || !exactRight) {
    return 0;
  }

  if (exactLeft === exactRight) {
    return 100;
  }

  const { overlap, total } = intersectionShare(leftTokens, rightTokens);

  if (exactLeft.includes(exactRight) || exactRight.includes(exactLeft)) {
    return Math.min(95, 60 + Math.round((overlap / total) * 20));
  }

  if (overlap === 0) {
    return 0;
  }

  return Math.min(95, Math.round((overlap * 100) / total));
}

function calculateWebsiteSimilarity(left: string, right: string) {
  const leftWebsite = normalizeWebsite(left);
  const rightWebsite = normalizeWebsite(right);

  if (!leftWebsite || !rightWebsite) {
    return 0;
  }

  if (leftWebsite === rightWebsite) {
    return 100;
  }

  const leftTokens = leftWebsite.split(".");
  const rightTokens = rightWebsite.split(".");

  if (leftTokens.length > 0 && rightTokens.length > 0) {
    const shared = leftTokens.filter((token) => rightTokens.includes(token)).length;
    if (shared >= 2) {
      return Math.max(70, shared * 35);
    }
  }

  return 0;
}

function calculateConfidence(leftCompany: string, leftWebsite: string, rightCompany: string, rightWebsite: string) {
  const companyScore = calculateNameSimilarity(leftCompany, rightCompany);
  const websiteScore = calculateWebsiteSimilarity(leftWebsite, rightWebsite);

  if (companyScore >= 95 && websiteScore >= 95) {
    return 100;
  }

  if (websiteScore >= 95 && companyScore >= 40) {
    return Math.max(websiteScore, companyScore + 20);
  }

  return Math.max(companyScore, websiteScore);
}

function buildClaimStatusTrailEntry(args: {
  status: AdminSubmissionStatus;
  actor?: string;
  source?: string;
  reason?: string;
  note?: string;
}) {
  return {
    status: args.status,
    actor: args.actor ?? "system",
    at: new Date().toISOString(),
    ...(args.source ? { source: args.source } : {}),
    ...(args.reason ? { reason: args.reason } : {}),
    ...(args.note ? { note: args.note } : {}),
  } satisfies VendorSubmissionStatusTrailEntry;
}

function appendStatusTrail(
  existing: VendorSubmissionStatusTrailEntry[] = [],
  entry: VendorSubmissionStatusTrailEntry,
): VendorSubmissionStatusTrailEntry[] {
  const trail = [...existing.filter((row) => row.status && row.at), entry];

  if (trail.length <= 1) {
    return trail;
  }

  return trail.slice(-10);
}

function dedupeDuplicateCandidates(candidates: VendorSubmissionDuplicateMatch[]) {
  const byId = new Map<string, VendorSubmissionDuplicateMatch>();

  for (const candidate of candidates) {
    const key = `${candidate.kind}:${candidate.id}`;
    const existing = byId.get(key);
    if (!existing || candidate.confidence > existing.confidence) {
      byId.set(key, candidate);
    }
  }

  return [...byId.values()]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_DUPLICATE_MATCHES);
}

function detectDuplicateMatches(company: string, websiteUrl: string, rows: PersistedVendorSubmission[]) {
  const candidates: VendorSubmissionDuplicateMatch[] = [];

  for (const row of rows) {
    const confidence = calculateConfidence(company, websiteUrl, row.company, row.websiteUrl ?? "");
    if (confidence >= DUPLICATE_SCORE_THRESHOLD && row.id) {
      candidates.push({
        kind: "submission",
        id: row.id,
        label: `${row.company} (${row.contact})`,
        confidence,
        reason: confidence >= 95 ? "Exact submission match" : "High similarity in company or domain",
      });
    }
  }

  for (const vendor of vendors) {
    const confidence = calculateConfidence(company, websiteUrl, vendor.name, vendor.website_url);
    if (confidence >= DUPLICATE_SCORE_THRESHOLD) {
      candidates.push({
        kind: "vendor",
        id: vendor.slug,
        label: vendor.name,
        confidence,
        reason: confidence >= 95 ? "Exact vendor match" : "Strong vendor similarity",
      });
    }
  }

  return dedupeDuplicateCandidates(candidates);
}

function evaluateClaimValidation(
  company: string,
  websiteUrl: string,
  rows: PersistedVendorSubmission[],
): {
  status: AdminSubmissionStatus;
  vendorSlug?: string;
  score: number;
  validation: "matched" | "needs_followup";
  reason: string;
} {
  const vendorMatches = detectDuplicateMatches(company, websiteUrl, rows).filter((match) => match.kind === "vendor");

  if (vendorMatches.length > 0) {
    const top = vendorMatches[0]!;

    return {
      status: "claimed",
      vendorSlug: top.id,
      score: top.confidence,
      validation: "matched",
      reason: `Matched existing vendor ${top.label}`,
    };
  }

  return {
    status: "needs_followup",
    score: 0,
    validation: "needs_followup",
    reason: "No matching vendor found for claim validation",
  };
}

function parseDelimitedValues(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/[,;\n|]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .flatMap(splitBySlashPair);
}

function splitBySlashPair(value: string) {
  if (value.includes(" / ")) {
    return value
      .split("/")
      .map((token) => token.trim())
      .filter(Boolean);
  }

  return [value];
}

function uniq(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function categorySlugByHint(value: string) {
  const normalized = normalizeLookup(value);
  if (!normalized) {
    return "";
  }

  const normalizedSlug = normalized.replace(/\s+/g, "-");

  const match = categories.find((category) => {
    const categoryName = normalizeLookup(category.name);
    const categorySlug = normalizeLookup(category.slug);

    return (
      category.slug === value ||
      category.slug.toLowerCase() === normalized.toLowerCase() ||
      category.slug.toLowerCase() === normalizedSlug ||
      categoryName === normalized ||
      categorySlug === normalized ||
      categoryName.includes(normalized) ||
      normalized.includes(categoryName)
    );
  });

  return match ? match.slug : "";
}

function dedupeCategorySlugs(values: string[]) {
  const slugs = values
    .flatMap((value) => parseDelimitedValues(value))
    .map((value) => categorySlugByHint(value))
    .filter(Boolean);

  return uniq(slugs);
}

function getRoutingCategorySlugs(values: FormPayload): string[] {
  const explicitInput = uniq([
    values.routing_category ?? "",
    values.routingCategory ?? "",
    values.routing_slug ?? "",
    values.routingSlugs ?? "",
    values.category_focus ?? "",
    values.category_slug ?? "",
  ]);

  const explicit = dedupeCategorySlugs(explicitInput);
  if (explicit.length > 0) {
    return explicit;
  }

  const fallback = dedupeCategorySlugs([values.categories ?? ""]);
  return fallback;
}

function createId(prefix: "lead" | "submission") {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
}

function createAuditId() {
  return `audit-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
}

function toVendorSubmissionContact(name: string, email: string) {
  if (name && email) {
    return `${name} · ${email}`;
  }

  return name || email || "Unknown";
}

function ensureDataDir() {
  return fs.mkdir(dataDir, { recursive: true });
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as T[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    console.error(`Failed to read ${path.basename(filePath)}:`, error);
    return [];
  }
}

async function writeJsonArray<T>(filePath: string, rows: T[]) {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
}

function ensureLeadRequirements(values: FormPayload): { name: string; company: string; email: string } {
  const name = pick(values.fullName, values.contactName, values.contact_name, values.name);
  const company = pick(values.company_name, values.companyName, values.company, values.organization);
  const email = pick(values.email, values.contactEmail, values.contact_email, values.emailAddress);

  if (!name || !email) {
    throw new Error("required_fields_missing");
  }

  return { name, company, email };
}

function ensureVendorSubmissionRequirements(values: FormPayload): {
  company: string;
  websiteUrl: string;
  contactName: string;
  contactEmail: string;
  categories: string;
  summary: string;
  notes: string;
  routingCategorySlugs: string[];
} {
  const company = pick(values.companyName, values.company_name, values.company);
  const websiteUrl = normalize(values.websiteUrl || values.website || values.url || values.companyUrl);
  const contactName = pick(values.contactName, values.claimantName, values.submitterName, values.yourName);
  const contactEmail = pick(values.contactEmail, values.claimantEmail, values.email, values.submitterEmail);
  const categories = normalize(values.categories);
  const summary = normalize(values.summary);
  const notes = normalize(values.notes || values.claimNotes || "");
  const routingCategorySlugs = getRoutingCategorySlugs(values);

  if (!company || !contactName || !contactEmail) {
    throw new Error("required_fields_missing");
  }

  return { company, websiteUrl, contactName, contactEmail, categories, summary, notes, routingCategorySlugs };
}

function auditLabel(queueType: QueueQueueType, statusFrom: string, statusTo: string) {
  return `${queueType === "lead" ? "Lead" : "Vendor submission"} status: ${statusFrom} → ${statusTo}`;
}

export type PersistedLead = AdminLeadRequest;

export type PersistedVendorSubmission = AdminVendorSubmission;

export type FormSubmitResult<T> = {
  ok: boolean;
  submission: T;
};

export type QueueUpdateResult<T> = {
  ok: boolean;
  submission: T | null;
  error?: string;
};

export type QueueBatchResult = {
  ok: boolean;
  updated: number;
  missing: string[];
  blocked?: {
    id: string;
    previousStatus: string;
    error: string;
  }[];
};

export type QueueAuditEntry = {
  id: string;
  queueType: QueueQueueType;
  itemId: string;
  itemLabel: string;
  previousStatus: string;
  newStatus: string;
  updatedAt: string;
  actor: string;
  source?: string;
  reason?: string;
};

export type QueueAuditContext = {
  actor?: string;
  source?: string;
  reason?: string;
};

const DEFAULT_AUDIT_RETENTION_LIMIT = 500;
const MIN_AUDIT_RETENTION_LIMIT = 20;
const MAX_AUDIT_RETENTION_LIMIT = 2000;
const DEFAULT_AUDIT_GUARD_WINDOW_MS = 120000;
const MIN_AUDIT_GUARD_WINDOW_MS = 5000;

const STATUS_TRANSITION_REASON_MIN_LENGTH = 4;

type AuditContext = QueueAuditContext;

function getStatusGuardWindowMs() {
  const requestedWindow = Number.parseInt(process.env.ADMIN_STATUS_GUARD_WINDOW_MS ?? "", 10);

  if (Number.isFinite(requestedWindow) && requestedWindow >= MIN_AUDIT_GUARD_WINDOW_MS) {
    return requestedWindow;
  }

  return DEFAULT_AUDIT_GUARD_WINDOW_MS;
}

function hasReason(value?: string) {
  return (value ?? "").trim().length >= STATUS_TRANSITION_REASON_MIN_LENGTH;
}

async function hasRapidRepetition(
  queueType: QueueQueueType,
  itemId: string,
  previousStatus: string,
  nextStatus: string,
  actor: string,
  rows: QueueAuditEntry[],
): Promise<boolean> {
  const guardWindowMs = getStatusGuardWindowMs();
  const now = Date.now();

  if (guardWindowMs <= 0) {
    return false;
  }

  const marker = now - guardWindowMs;

  for (const row of rows) {
    if (
      row.queueType !== queueType ||
      row.itemId !== itemId ||
      row.actor !== actor ||
      row.previousStatus !== previousStatus ||
      row.newStatus !== nextStatus
    ) {
      continue;
    }

    const updatedAt = Date.parse(row.updatedAt);
    if (Number.isFinite(updatedAt) && updatedAt >= marker) {
      return true;
    }
  }

  return false;
}

async function validateTransition(
  queueType: QueueQueueType,
  itemId: string,
  previousStatus: string,
  nextStatus: string,
  context: AuditContext,
  existingAuditRows?: QueueAuditEntry[],
): Promise<{ ok: boolean; error?: string }> {
  const actor = (context.actor || "admin").toLowerCase();
  const auditRows = existingAuditRows ?? (await readJsonArray<QueueAuditEntry>(adminQueueAuditPath));

  if (previousStatus === nextStatus) {
    return {
      ok: true,
    };
  }

  if (previousStatus && !hasReason(context.reason) && (await hasRapidRepetition(queueType, itemId, previousStatus, nextStatus, actor, auditRows))) {
    return {
      ok: false,
      error: "Repeated transition requires a reason. Enter one in the audit reason field before applying this change.",
    };
  }

  return { ok: true };
}

function getQueueAuditRetentionLimit() {
  const requestedLimit = Number.parseInt(process.env.ADMIN_AUDIT_RETENTION_LIMIT ?? "", 10);

  if (Number.isFinite(requestedLimit) && requestedLimit >= MIN_AUDIT_RETENTION_LIMIT) {
    return Math.min(requestedLimit, MAX_AUDIT_RETENTION_LIMIT);
  }

  return DEFAULT_AUDIT_RETENTION_LIMIT;
}

export function getConfiguredAuditRetentionLimit() {
  return getQueueAuditRetentionLimit();
}

function createQueueAuditEntry(
  queueType: QueueQueueType,
  itemId: string,
  itemLabel: string,
  previousStatus: string,
  newStatus: string,
  context?: AuditContext,
) {
  return {
    id: createAuditId(),
    queueType,
    itemId,
    itemLabel,
    previousStatus,
    newStatus,
    updatedAt: new Date().toISOString(),
    actor: (context?.actor ?? "admin").toLowerCase(),
    source: context?.source,
    reason: context?.reason,
  } satisfies QueueAuditEntry;
}

export function createFailedQueueAuditEntry(
  queueType: QueueQueueType,
  itemId: string,
  itemLabel: string,
  previousStatus: string,
  newStatus: string,
  error: string,
  context: AuditContext = {},
) {
  const safeError = (error ?? "unknown failure").trim();
  const reason = safeError.startsWith("Blocked:") ? safeError : `Blocked transition: ${safeError}`;
  const source = context.source ?? "validation_guard";

  return createQueueAuditEntry(queueType, itemId, itemLabel, previousStatus, newStatus, {
    actor: context.actor ?? "admin",
    source,
    reason,
  });
}

async function appendAudit(entries: QueueAuditEntry[]) {
  if (entries.length === 0) {
    return;
  }

  const rows = await readJsonArray<QueueAuditEntry>(adminQueueAuditPath);
  const retentionLimit = getQueueAuditRetentionLimit();
  const nextRows = [...entries, ...rows].slice(0, retentionLimit);
  await writeJsonArray(adminQueueAuditPath, nextRows);
}

async function appendQueueAudit(entries: QueueAuditEntry[]) {
  await appendAudit(entries);
}

export async function appendQueueAuditEntries(entries: QueueAuditEntry[]) {
  return appendQueueAudit(entries);
}

export async function getQueueAudit(limit = 12): Promise<QueueAuditEntry[]> {
  const rows = await readJsonArray<QueueAuditEntry>(adminQueueAuditPath);

  return rows.slice(0, limit);
}

export async function getQueueAuditSummary() {
  const rows = await readJsonArray<QueueAuditEntry>(adminQueueAuditPath);

  return {
    total: rows.length,
    retentionLimit: getQueueAuditRetentionLimit(),
    newestUpdatedAt: rows[0]?.updatedAt ?? null,
    oldestUpdatedAt: rows.length > 0 ? rows.at(-1)?.updatedAt ?? null : null,
  };
}

export type QueueAuditPruneResult = {
  ok: boolean;
  requestedBefore: string | null;
  removed: number;
  retained: number;
  totalBefore: number;
  totalAfter: number;
  retentionLimit: number;
  dryRun: boolean;
  error?: string;
};

export async function pruneQueueAudit(options: { before?: string; dryRun?: boolean }): Promise<QueueAuditPruneResult> {
  const { before, dryRun = false } = options;
  const rows = await readJsonArray<QueueAuditEntry>(adminQueueAuditPath);
  const totalBefore = rows.length;
  const retentionLimit = getQueueAuditRetentionLimit();

  let nextRows = rows;
  if (before) {
    const beforeDate = Date.parse(before);

    if (!Number.isFinite(beforeDate)) {
      return {
        ok: false,
        requestedBefore: before ?? null,
        removed: 0,
        retained: totalBefore,
        totalBefore,
        totalAfter: totalBefore,
        retentionLimit,
        dryRun,
        error: "Invalid before date.",
      };
    }

    nextRows = rows.filter((row) => {
      const updatedAt = Date.parse(row.updatedAt);
      return Number.isFinite(updatedAt) && updatedAt >= beforeDate;
    });
  }

  nextRows = nextRows.slice(0, retentionLimit);

  const totalAfter = nextRows.length;
  const removed = totalBefore - totalAfter;

  if (!dryRun && removed > 0) {
    await writeJsonArray(adminQueueAuditPath, nextRows);
  }

  return {
    ok: removed > 0,
    requestedBefore: before ?? null,
    removed,
    retained: totalAfter,
    totalBefore,
    totalAfter,
    retentionLimit,
    dryRun,
  };
}

export function isValidLeadStatus(value: string): value is AdminLeadStatus {
  return validLeadStatuses.includes(value as AdminLeadStatus);
}

export function isValidSubmissionStatus(value: string): value is AdminSubmissionStatus {
  return validSubmissionStatuses.includes(value as AdminSubmissionStatus);
}

export function getLeadStatuses(): AdminLeadStatus[] {
  return [...validLeadStatuses];
}

export function getSubmissionStatuses(): AdminSubmissionStatus[] {
  return [...validSubmissionStatuses];
}

export async function appendLeadSubmission(formData: FormPayload): Promise<FormSubmitResult<PersistedLead>> {
  const { name, company, email } = ensureLeadRequirements(formData);
  const rows = await readJsonArray<PersistedLead>(adminLeadsPath);
  const routingCategorySlugs = getRoutingCategorySlugs(formData);

  const submission: PersistedLead = {
    id: createId("lead"),
    name,
    company,
    email,
    type: "match_request",
    status: "new",
    submittedAt: new Date().toISOString(),
    formData: { ...formData },
    ...(routingCategorySlugs.length > 0 ? { routingCategorySlugs } : {}),
  };

  rows.unshift(submission);
  await writeJsonArray(adminLeadsPath, rows);
  await recordConversionEvent({
    funnel: "lead",
    eventName: "queue_insert",
    source: "admin_lead_submit",
    submissionId: submission.id,
    status: "queued",
  });

  return { ok: true, submission };
}

export async function appendVendorSubmission(
  formData: FormPayload,
  submissionType: AdminSubmissionType,
): Promise<FormSubmitResult<PersistedVendorSubmission>> {
  const {
    company,
    websiteUrl,
    contactName,
    contactEmail,
    categories,
    summary,
    notes,
    routingCategorySlugs,
  } = ensureVendorSubmissionRequirements(formData);

  const rows = await readJsonArray<PersistedVendorSubmission>(adminVendorSubmissionsPath);

  const duplicateMatches = detectDuplicateMatches(company, websiteUrl, rows);
  const topDuplicateMatch = duplicateMatches.length > 0 ? duplicateMatches[0] : undefined;
  const topDuplicateConfidence = topDuplicateMatch ? topDuplicateMatch.confidence : 0;

  const claimValidation =
    submissionType === "claim"
      ? evaluateClaimValidation(company, websiteUrl, rows)
      : {
          status: "new" as const,
          score: 0,
          validation: "needs_followup" as const,
          reason: "",
          vendorSlug: undefined,
        };

  const initialStatus = claimValidation.status;
  const claimToken = submissionType === "claim" ? randomUUID() : undefined;
  const claimTokenExpiresAt = submissionType === "claim" ? new Date(Date.now() + CLAIM_TOKEN_TTL_MS).toISOString() : undefined;
  const now = new Date().toISOString();
  const nowStatusTrail = buildClaimStatusTrailEntry({
    status: initialStatus,
    actor: "system",
    source: "vendor_claim_submit",
    reason: claimValidation.reason,
  });

  const submission: PersistedVendorSubmission = {
    id: createId("submission"),
    company,
    contact: toVendorSubmissionContact(contactName, contactEmail),
    type: submissionType,
    status: initialStatus,
    submittedAt: now,
    formData,
    websiteUrl,
    categories,
    summary,
    notes: notes || undefined,
    ...(routingCategorySlugs.length > 0 ? { routingCategorySlugs } : {}),
    ...(topDuplicateConfidence > 0
      ? {
          duplicateConfidence: topDuplicateConfidence,
          duplicateMatches,
          duplicateLabel: topDuplicateMatch?.label,
        }
      : {}),
    ...(submissionType === "claim"
      ? {
          claimToken,
          claimTokenExpiresAt,
          vendorSlug: claimValidation.vendorSlug,
          validationState: claimValidation.validation,
          validationScore: claimValidation.score,
          statusTrail: [nowStatusTrail],
        }
      : {}),
  };

  rows.unshift(submission);
  await writeJsonArray(adminVendorSubmissionsPath, rows);
  await recordConversionEvent({
    funnel: submissionType === "submit" ? "vendor_submit" : "vendor_claim",
    eventName: "queue_insert",
    source: "admin_vendor_submission_submit",
    submissionId: submission.id,
    status: "queued",
  });

  return { ok: true, submission };
}

export async function submitLead(formData: FormPayload) {
  return appendLeadSubmission(formData);
}

export async function submitVendorSubmission(formData: FormPayload) {
  return appendVendorSubmission(formData, "submit");
}

export async function submitClaim(formData: FormPayload) {
  return appendVendorSubmission(formData, "claim");
}

export async function verifyVendorClaimToken(
  submissionId: string,
  claimToken: string,
  context: AuditContext = {},
): Promise<QueueUpdateResult<PersistedVendorSubmission>> {
  const rows = await readJsonArray<PersistedVendorSubmission>(adminVendorSubmissionsPath);
  const index = rows.findIndex((row) => row.id === submissionId);

  if (index < 0) {
    return { ok: false, submission: null, error: "Submission not found." };
  }

  const current = rows[index];
  if (current.type !== "claim") {
    return { ok: false, submission: null, error: "Not a claim submission." };
  }

  const previousStatus = current.status;
  const expectedToken = (current.claimToken ?? "").trim();
  if (!expectedToken || claimToken.trim() !== expectedToken) {
    return { ok: false, submission: null, error: "Invalid claim token." };
  }

  const expiresAt = current.claimTokenExpiresAt;
  if (expiresAt && Date.parse(expiresAt) < Date.now()) {
    return { ok: false, submission: null, error: "Claim token has expired." };
  }

  if (previousStatus === "verified") {
    return { ok: true, submission: current };
  }

  const transition = await validateTransition("vendor_submission", current.id, previousStatus, "verified", context);
  if (!transition.ok) {
    return { ok: false, submission: null, error: transition.error ?? "Invalid status transition." };
  }

  rows[index] = {
    ...current,
    status: "verified",
    statusTrail: appendStatusTrail(current.statusTrail, buildClaimStatusTrailEntry({
      status: "verified",
      actor: context.actor,
      source: context.source ?? "claim_token",
      reason: context.reason,
      note: "claim token verification",
    })),
  };

  await writeJsonArray(adminVendorSubmissionsPath, rows);
  await appendAudit([
    createQueueAuditEntry("vendor_submission", current.id, current.company || current.contact || current.id, previousStatus, "verified", context),
  ]);

  return { ok: true, submission: rows[index] };
}

export async function regenerateVendorClaimToken(
  submissionId: string,
  context: AuditContext = {},
): Promise<QueueUpdateResult<PersistedVendorSubmission>> {
  const rows = await readJsonArray<PersistedVendorSubmission>(adminVendorSubmissionsPath);
  const index = rows.findIndex((row) => row.id === submissionId);

  if (index < 0) {
    return { ok: false, submission: null, error: "Submission not found." };
  }

  const current = rows[index];
  if (current.type !== "claim") {
    return { ok: false, submission: null, error: "Not a claim submission." };
  }

  const result = regenerateClaimTokenRow(current, context);

  if (!result) {
    return { ok: false, submission: null, error: "Unable to regenerate claim token." };
  }

  rows[index] = {
    ...current,
    ...result,
  };

  await writeJsonArray(adminVendorSubmissionsPath, rows);
  const actor = context.actor ?? "system";
  const auditContext = {
    source: context.source ?? "claim_token_regenerate",
    actor,
    reason: context.reason ?? "Claim token regenerated.",
  };

  await appendAudit([
    createQueueAuditEntry(
      "vendor_submission",
      current.id,
      current.company || current.contact || current.id,
      current.status,
      current.status,
      auditContext,
    ),
  ]);

  return { ok: true, submission: rows[index] };
}

export async function regenerateVendorClaimTokens(
  submissionIds: string[],
  context: AuditContext = {},
): Promise<{
  ok: boolean;
  regenerated: string[];
  skipped: string[];
  missing: string[];
  updated: number;
  error?: string;
}> {
  const rows = await readJsonArray<PersistedVendorSubmission>(adminVendorSubmissionsPath);

  const normalizedIds = submissionIds.map((id) => id.trim()).filter(Boolean);
  const requested = new Set(normalizedIds);
  if (requested.size === 0) {
    return { ok: false, regenerated: [], skipped: [], missing: [], updated: 0, error: "No rows selected." };
  }

  const toIdToIndex = new Map(rows.map((row, index) => [row.id, index] as const));
  const skipped: string[] = [];
  const missing: string[] = [];
  const regenerated: string[] = [];
  const auditRows: ReturnType<typeof createQueueAuditEntry>[] = [];
  const actor = context.actor ?? "system";

  for (const id of requested) {
    const row = toIdToIndex.has(id) ? rows[toIdToIndex.get(id)!] : undefined;
    if (!row) {
      missing.push(id);
      continue;
    }

    if (row.type !== "claim") {
      skipped.push(id);
      continue;
    }

    const nextClaim = regenerateClaimTokenRow(row, context);
    if (!nextClaim) {
      skipped.push(id);
      continue;
    }

    rows[toIdToIndex.get(id)!] = {
      ...row,
      ...nextClaim,
    };
    regenerated.push(id);
    auditRows.push(
      createQueueAuditEntry(
        "vendor_submission",
        row.id,
        row.company || row.contact || row.id,
        row.status,
        row.status,
        {
          source: context.source ?? "claim_token_batch_rotate",
          actor,
          reason: context.reason || "Claim token regenerated.",
        },
      ),
    );
  }

  if (regenerated.length > 0) {
    await writeJsonArray(adminVendorSubmissionsPath, rows);
    await appendAudit(auditRows);
  }

  return {
    ok: regenerated.length > 0,
    regenerated,
    skipped,
    missing,
    updated: regenerated.length,
    error: regenerated.length === 0 ? "No claim tokens were regenerated." : undefined,
  };
}

function regenerateClaimTokenRow(row: PersistedVendorSubmission, context: AuditContext) {
  if (row.type !== "claim") {
    return null;
  }

  return {
    claimToken: randomUUID(),
    claimTokenExpiresAt: new Date(Date.now() + CLAIM_TOKEN_TTL_MS).toISOString(),
    statusTrail: appendStatusTrail(row.statusTrail, buildClaimStatusTrailEntry({
      status: row.status,
      actor: context.actor,
      source: context.source ?? "claim_token_regenerate",
      reason: context.reason,
      note: "claim token regenerated",
    })),
  };
}

export async function updateLeadStatus(
  id: string,
  status: AdminLeadStatus,
  context: AuditContext = {},
): Promise<QueueUpdateResult<PersistedLead>> {
  const rows = await readJsonArray<PersistedLead>(adminLeadsPath);
  const index = rows.findIndex((row) => row.id === id);

  if (index < 0) {
    await appendQueueAudit([
      createFailedQueueAuditEntry("lead", id, id, "unknown", status, "Lead not found."),
    ]);
    return { ok: false, submission: null, error: "Lead not found." };
  }

  const current = rows[index];
  const previousStatus = current.status;

  const transition = await validateTransition(
    "lead",
    id,
    previousStatus,
    status,
    context,
  );
  if (!transition.ok) {
    await appendQueueAudit([
      createFailedQueueAuditEntry(
        "lead",
        id,
        current.name || current.company || id,
        previousStatus,
        status,
        transition.error ?? "Invalid status transition.",
        context,
      ),
    ]);

    return { ok: false, submission: null, error: transition.error ?? "Invalid status transition." };
  }

  if (previousStatus === status) {
    return { ok: true, submission: current };
  }

  rows[index] = {
    ...current,
    status,
  };

  await writeJsonArray(adminLeadsPath, rows);
  await appendAudit([
    createQueueAuditEntry("lead", id, current.name || current.company || id, previousStatus, status, context),
  ]);

  return { ok: true, submission: rows[index] };
}

export async function updateVendorSubmissionStatus(
  id: string,
  status: AdminSubmissionStatus,
  context: AuditContext = {},
): Promise<QueueUpdateResult<PersistedVendorSubmission>> {
  const rows = await readJsonArray<PersistedVendorSubmission>(adminVendorSubmissionsPath);
  const index = rows.findIndex((row) => row.id === id);

  if (index < 0) {
    await appendQueueAudit([
      createFailedQueueAuditEntry("vendor_submission", id, id, "unknown", status, "Submission not found."),
    ]);
    return { ok: false, submission: null, error: "Submission not found." };
  }

  const current = rows[index];
  const previousStatus = current.status;

  const transition = await validateTransition(
    "vendor_submission",
    id,
    previousStatus,
    status,
    context,
  );
  if (!transition.ok) {
    await appendQueueAudit([
      createFailedQueueAuditEntry(
        "vendor_submission",
        id,
        current.company || current.contact || id,
        previousStatus,
        status,
        transition.error ?? "Invalid status transition.",
        context,
      ),
    ]);

    return { ok: false, submission: null, error: transition.error ?? "Invalid status transition." };
  }

  if (previousStatus === status) {
    return { ok: true, submission: current };
  }

  rows[index] = {
    ...current,
    status,
    statusTrail: appendStatusTrail(current.statusTrail, buildClaimStatusTrailEntry({
      status,
      actor: context.actor,
      source: context.source,
      reason: context.reason,
      note: "admin status update",
    })),
  };

  await writeJsonArray(adminVendorSubmissionsPath, rows);
  await appendAudit([
    createQueueAuditEntry(
      "vendor_submission",
      id,
      current.company || current.contact || id,
      previousStatus,
      status,
      context,
    ),
  ]);

  return { ok: true, submission: rows[index] };
}

export async function updateLeadStatuses(
  ids: string[],
  status: AdminLeadStatus,
  context: AuditContext = {},
): Promise<QueueBatchResult> {
  const rows = await readJsonArray<PersistedLead>(adminLeadsPath);
  const auditRows = await readJsonArray<QueueAuditEntry>(adminQueueAuditPath);
  const missing: string[] = [];
  const blocked: QueueBatchResult["blocked"] = [];
  let updated = 0;
  const newAuditRows: QueueAuditEntry[] = [];

  const rowById = new Map(rows.map((row) => [row.id, row]));
  for (const id of ids) {
    const row = rowById.get(id);
    if (!row) {
    missing.push(id);
    await appendQueueAudit([
      createFailedQueueAuditEntry(
        "lead",
        id,
        id,
        "unknown",
        status,
        "Row not found.",
        { source: context.source },
      ),
    ]);
    continue;
  }

    const previousStatus = row.status;
    if (previousStatus === status) {
      continue;
    }

    const transition = await validateTransition("lead", row.id, previousStatus, status, context, auditRows);
    if (!transition.ok) {
    blocked.push({ id: row.id, previousStatus, error: transition.error ?? "Invalid status transition." });
    await appendQueueAudit([
      createFailedQueueAuditEntry(
        "lead",
        row.id,
        row.name || row.company || row.id,
        previousStatus,
        status,
        transition.error ?? "Invalid status transition.",
        context,
      ),
    ]);
    continue;
  }

    row.status = status;
    updated += 1;
    const auditRow = createQueueAuditEntry("lead", row.id, row.name || row.company || row.id, previousStatus, status, context);
    newAuditRows.push(auditRow);
    auditRows.push(auditRow);
  }

  if (updated > 0) {
    await writeJsonArray(adminLeadsPath, rows);
    await appendAudit(newAuditRows);
  }

  return {
    ok: (missing.length === 0 && blocked.length === 0) || updated > 0,
    updated,
    missing,
    blocked,
  };
}

export async function updateVendorSubmissionStatuses(
  ids: string[],
  status: AdminSubmissionStatus,
  context: AuditContext = {},
): Promise<QueueBatchResult> {
  const rows = await readJsonArray<PersistedVendorSubmission>(adminVendorSubmissionsPath);
  const auditRows = await readJsonArray<QueueAuditEntry>(adminQueueAuditPath);
  const missing: string[] = [];
  const blocked: QueueBatchResult["blocked"] = [];
  let updated = 0;
  const newAuditRows: QueueAuditEntry[] = [];

  const rowById = new Map(rows.map((row) => [row.id, row]));
  for (const id of ids) {
    const row = rowById.get(id);
    if (!row) {
    missing.push(id);
    await appendQueueAudit([
      createFailedQueueAuditEntry(
        "vendor_submission",
        id,
        id,
        "unknown",
        status,
        "Row not found.",
        { source: context.source },
      ),
    ]);
    continue;
  }

    const previousStatus = row.status;
    if (previousStatus === status) {
      continue;
    }

    const transition = await validateTransition("vendor_submission", row.id, previousStatus, status, context, auditRows);
    if (!transition.ok) {
    blocked.push({ id: row.id, previousStatus, error: transition.error ?? "Invalid status transition." });
    await appendQueueAudit([
      createFailedQueueAuditEntry(
        "vendor_submission",
        row.id,
        row.company || row.contact || row.id,
        previousStatus,
        status,
        transition.error ?? "Invalid status transition.",
        context,
      ),
    ]);
    continue;
  }

    row.status = status;
    row.statusTrail = appendStatusTrail(row.statusTrail, buildClaimStatusTrailEntry({
      status,
      actor: context.actor,
      source: context.source,
      reason: context.reason,
      note: "admin batch status update",
    }));
    updated += 1;
    const auditRow = createQueueAuditEntry(
      "vendor_submission",
      row.id,
      row.company || row.contact || row.id,
      previousStatus,
      status,
      context,
    );
    newAuditRows.push(auditRow);
    auditRows.push(auditRow);
  }

  if (updated > 0) {
    await writeJsonArray(adminVendorSubmissionsPath, rows);
    await appendAudit(newAuditRows);
  }

  return {
    ok: (missing.length === 0 && blocked.length === 0) || updated > 0,
    updated,
    missing,
    blocked,
  };
}

export function formatAuditEvent(event: QueueAuditEntry) {
  const source = event.source ? ` (${event.source})` : "";

  return `${event.actor} changed ${auditLabel(event.queueType, event.previousStatus, event.newStatus)} on ${event.itemLabel}${source}`;
}


