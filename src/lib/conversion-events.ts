import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { getDataPath } from "@/lib/storage-paths";

export type ConversionFunnel = "lead" | "vendor_submit" | "vendor_claim";
export type ConversionEventName = "form_start" | "form_submit" | "form_submit_success" | "queue_insert";

type ConversionEventStatus = "ok" | "error" | "queued";

type ConversionEvent = {
  id: string;
  funnel: ConversionFunnel;
  eventName: ConversionEventName;
  occurredAt: string;
  source?: string;
  submissionId?: string;
  status?: ConversionEventStatus;
  note?: string;
  reference?: string;
};

export type ConversionSummaryRow = {
  funnel: ConversionFunnel | "all";
  starts: number;
  submits: number;
  successes: number;
  queueInserts: number;
  submitSuccessRate: number;
  insertSuccessRate: number;
};

const dataPath = getDataPath("conversion_events.json");
const DEFAULT_RETENTION_LIMIT = 4000;
const MIN_RETENTION_LIMIT = 250;
const MAX_RETENTION_LIMIT = 20000;

function buildId(prefix: string) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 10)}`;
}

function parseRetentionLimit() {
  const requested = Number.parseInt(process.env.CONVERSION_EVENTS_RETENTION_LIMIT ?? "", 10);
  if (Number.isFinite(requested) && requested >= MIN_RETENTION_LIMIT) {
    return Math.min(requested, MAX_RETENTION_LIMIT);
  }

  return DEFAULT_RETENTION_LIMIT;
}

function normalizeFunnel(value: string): ConversionFunnel | null {
  if (value === "lead" || value === "vendor_submit" || value === "vendor_claim") {
    return value;
  }

  if (value === "lead_match") {
    return "lead";
  }

  return null;
}

function normalizeEventName(value: string): ConversionEventName | null {
  if (
    value === "form_start" ||
    value === "form_submit" ||
    value === "form_submit_success" ||
    value === "queue_insert"
  ) {
    return value;
  }

  return null;
}

function normalizeStatus(value: string | undefined): ConversionEventStatus | null {
  if (value === "ok" || value === "error" || value === "queued") {
    return value;
  }

  return null;
}

function sanitize(value: string | undefined) {
  return (value ?? "").trim().slice(0, 255);
}

async function readConversionEvents(): Promise<ConversionEvent[]> {
  try {
    const raw = await fs.readFile(dataPath, "utf8");
    const parsed = JSON.parse(raw) as ConversionEvent[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    console.error("Failed to read conversion events:", error);
    return [];
  }
}

async function writeConversionEvents(rows: ConversionEvent[]) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(rows, null, 2), "utf8");
}

export type PublicConversionEventPayload = {
  funnel: string;
  eventName: string;
  source?: string;
  submissionId?: string;
  status?: string;
  note?: string;
  reference?: string;
};

export async function recordConversionEvent(payload: PublicConversionEventPayload) {
  const funnel = normalizeFunnel(payload.funnel);
  const eventName = normalizeEventName(payload.eventName);
  if (!funnel || !eventName) {
    return { ok: false, error: "Invalid conversion payload." };
  }

  const rows = await readConversionEvents();
  const nextRows: ConversionEvent[] = [
    {
      id: buildId("conv"),
      funnel,
      eventName,
      occurredAt: new Date().toISOString(),
      source: sanitize(payload.source),
      submissionId: sanitize(payload.submissionId),
      status: normalizeStatus(payload.status) ?? undefined,
      note: sanitize(payload.note),
      reference: sanitize(payload.reference),
    },
    ...rows,
  ].slice(0, parseRetentionLimit());

  await writeConversionEvents(nextRows);

  return { ok: true };
}

function buildRate(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 10000) / 100;
}

function summarizeRows(rows: ConversionEvent[], funnel: ConversionFunnel | "all") {
  const filtered = funnel === "all" ? rows : rows.filter((row) => row.funnel === funnel);

  const starts = filtered.filter((row) => row.eventName === "form_start").length;
  const submits = filtered.filter((row) => row.eventName === "form_submit").length;
  const successes = filtered.filter((row) => row.eventName === "form_submit_success").length;
  const queueInserts = filtered.filter((row) => row.eventName === "queue_insert").length;

  return {
    funnel,
    starts,
    submits,
    successes,
    queueInserts,
    submitSuccessRate: buildRate(successes, Math.max(submits, 0)),
    insertSuccessRate: buildRate(queueInserts, Math.max(successes, 1)),
  };
}

export async function getConversionEvents(limit = 200) {
  const events = await readConversionEvents();
  return events.slice(0, Math.max(0, Math.min(limit, 1000)));
}

export async function getConversionSummary(options?: { now?: number; horizonHours?: number }) {
  const now = options?.now ?? Date.now();
  const horizonHours = options?.horizonHours ?? 24;
  const cutoff = now - Math.max(1, horizonHours) * 60 * 60 * 1000;

  const rows = await readConversionEvents();
  const filtered = rows.filter((row) => Date.parse(row.occurredAt) >= cutoff);

  return {
    asOf: new Date(now).toISOString(),
    horizonHours,
    totalEvents: filtered.length,
    all: summarizeRows(filtered, "all"),
    lead: summarizeRows(filtered, "lead"),
    vendorSubmit: summarizeRows(filtered, "vendor_submit"),
    vendorClaim: summarizeRows(filtered, "vendor_claim"),
  };
}
