import { categories, AdminLeadRequest, AdminVendorSubmission } from "@/lib/site-data";

type CategoryBucket = {
  leadTotal: number;
  leadOpen: number;
  submissionTotal: number;
  submissionOpen: number;
};

export type QueueCategoryPressure = {
  slug: string;
  name: string;
  leadTotal: number;
  leadOpen: number;
  submissionTotal: number;
  submissionOpen: number;
  pressure: number;
  todayTotal: number;
  yesterdayTotal: number;
};

const UNCATEGORIZED_SLUG = "unmapped";

const LEAD_OPEN_STATUSES: Array<AdminLeadRequest["status"]> = ["new", "reviewing", "contacted"];
const SUBMISSION_OPEN_STATUSES: Array<AdminVendorSubmission["status"]> = [
  "new",
  "in_review",
  "needs_more_info",
  "needs_followup",
  "claimed",
  "verified",
];

const LEAD_ROUTING_HINTS: Array<{ slug: string; keys: string[] }> = [
  {
    slug: "modular-prefab",
    keys: [
      "modular",
      "prefab",
      "prefabricated",
      "private ai",
      "edge",
      "hybrid",
      "modular /",
      "containerized",
    ],
  },
  {
    slug: "liquid-cooling",
    keys: ["liquid", "cooling", "thermal", "high density", "rack density"],
  },
  {
    slug: "ai-colocation-gpu-hosting",
    keys: ["colocation", "colocation capacity", "gpu", "hosting", "co-location", "deployment model"],
  },
  {
    slug: "power-and-electrical",
    keys: ["power", "electrical", "ups", "utility", "grid", "backup", "5 mw", "1-5 mw", "250kw", "1 mw"],
  },
  {
    slug: "epc-and-commissioning",
    keys: ["epc", "commission", "engineering", "procurement", "construction", "commissioning", "builder"],
  },
];

const SUBMISSION_ROUTING_HINTS: Array<{ slug: string; keys: string[] }> = [
  {
    slug: "modular-prefab",
    keys: ["modular", "prefab", "prefabricated", "modular data", "modular /", "container", "packaged"],
  },
  {
    slug: "liquid-cooling",
    keys: ["liquid", "cooling", "thermal", "chilled", "temperature", "heat"],
  },
  {
    slug: "ai-colocation-gpu-hosting",
    keys: ["colocation", "gpu", "hosting", "ai", "cloud", "colo", "hyperscale"],
  },
  {
    slug: "power-and-electrical",
    keys: ["power", "electrical", "ups", "switchgear", "transformer", "panel", "generator", "switchgear"],
  },
  {
    slug: "epc-and-commissioning",
    keys: ["epc", "commission", "engineering", "procurement", "construction", "commissioning", "consulting"],
  },
];

function normalize(value: string) {
  return (value ?? "").trim().toLowerCase();
}

function normalizeToken(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalize(value)
    .split(/[,;|\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function slugOrNameToSlug(value: string) {
  const normalized = normalizeToken(value);
  if (!normalized) {
    return "";
  }

  const normalizedSlug = normalized.replace(/\s+/g, "-");

  const found = categories.find((category) => {
    const candidateName = normalizeToken(category.name);
    const candidateSlug = normalizeToken(category.slug);

    return (
      category.slug.toLowerCase() === value.toLowerCase() ||
      candidateSlug === normalized ||
      candidateSlug === normalizedSlug ||
      candidateName === normalized ||
      candidateName.includes(normalized) ||
      normalized.includes(candidateName)
    );
  });

  return found ? found.slug : "";
}

function mapByExplicit(value: string) {
  const parts = tokenize(value);
  return parts.flatMap((entry) => {
    const direct = slugOrNameToSlug(entry);
    if (direct) {
      return [direct];
    }

    return entry
      .split("/")
      .map((token) => slugOrNameToSlug(token))
      .filter(Boolean);
  });
}

function mapByHints(value: string, hints: Array<{ slug: string; keys: string[] }>) {
  const normalized = normalize(value);
  if (!normalized) {
    return [];
  }

  const matched: string[] = [];

  for (const hint of hints) {
    if (hint.keys.some((key) => normalized.includes(key))) {
      matched.push(hint.slug);
    }
  }

  return dedupe(matched);
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

function parseExplicitLeadRouting(formData?: Record<string, string>) {
  if (!formData) {
    return [];
  }

  const explicitValues = dedupe([
    formData.routing_category ?? "",
    formData.routingCategory ?? "",
    formData.category_focus ?? "",
    formData.category_slug ?? "",
    formData.routing_slug ?? "",
  ]).filter(Boolean);

  return dedupe(
    explicitValues.flatMap((value) => {
      const mapped = mapByExplicit(value);
      return mapped.length > 0 ? mapped : mapByHints(value, LEAD_ROUTING_HINTS);
    }),
  );
}

function parseExplicitSubmissionRouting(formData?: Record<string, string>, categoriesText = "") {
  if (!formData && !categoriesText) {
    return [];
  }

  const explicitValues = dedupe([
    formData?.routing_category ?? "",
    formData?.routingCategory ?? "",
    formData?.category_focus ?? "",
    formData?.category_slug ?? "",
    formData?.routing_slug ?? "",
  ]).filter(Boolean);

  const fromExplicit = dedupe(
    explicitValues.flatMap((value) => {
      const mapped = mapByExplicit(value);
      return mapped.length > 0 ? mapped : mapByHints(value, SUBMISSION_ROUTING_HINTS);
    }),
  );

  if (fromExplicit.length > 0) {
    return fromExplicit;
  }

  return dedupe((categoriesText ? tokenize(categoriesText) : []).flatMap((entry) => {
    const matched = mapByExplicit(entry);
    return matched.length > 0 ? matched : mapByHints(entry, SUBMISSION_ROUTING_HINTS);
  }));
}

function createAccumulator() {
  const map = new Map<string, QueueCategoryPressure & CategoryBucket>();

  for (const category of categories) {
    map.set(category.slug, {
      slug: category.slug,
      name: category.name,
      leadTotal: 0,
      leadOpen: 0,
      submissionTotal: 0,
      submissionOpen: 0,
      pressure: 0,
      todayTotal: 0,
      yesterdayTotal: 0,
    });
  }

  map.set(UNCATEGORIZED_SLUG, {
    slug: UNCATEGORIZED_SLUG,
    name: "Unmapped / Other",
    leadTotal: 0,
    leadOpen: 0,
    submissionTotal: 0,
    submissionOpen: 0,
    pressure: 0,
    todayTotal: 0,
    yesterdayTotal: 0,
  });

  return map;
}

function addOpenPressures(bucket: QueueCategoryPressure & CategoryBucket) {
  bucket.pressure = bucket.leadOpen + bucket.submissionOpen;
}

function resolveLeadTargetSlugs(lead: AdminLeadRequest) {
  if (lead.routingCategorySlugs?.length) {
    return dedupe(lead.routingCategorySlugs);
  }

  const explicit = parseExplicitLeadRouting(lead.formData);
  if (explicit.length > 0) {
    return explicit;
  }

  if (!lead.formData) {
    return [UNCATEGORIZED_SLUG];
  }

  const fieldValues = [
    lead.formData.deployment_goal,
    lead.formData.deployment_model,
    lead.formData.cooling_preference,
    lead.formData.workload_type,
    lead.formData.power_density_needs,
    lead.formData.required_timeline,
    lead.formData.budget_band,
    lead.formData.target_region,
    lead.formData.notes,
  ];

  const matches = dedupe(
    fieldValues.flatMap((value) => {
      if (!value) {
        return [];
      }

      const hinted = mapByHints(value, LEAD_ROUTING_HINTS);
      const mapped = mapByHints(value.toLowerCase(), LEAD_ROUTING_HINTS);

      return hinted.length > 0 ? hinted : mapped;
    }),
  );

  if (matches.length === 0) {
    return [UNCATEGORIZED_SLUG];
  }

  return matches;
}

function resolveSubmissionTargetSlugs(submission: AdminVendorSubmission) {
  if (submission.routingCategorySlugs?.length) {
    return dedupe(submission.routingCategorySlugs);
  }

  const fromForm = parseExplicitSubmissionRouting(submission.formData, submission.categories);
  if (fromForm.length > 0) {
    return fromForm;
  }

  return [UNCATEGORIZED_SLUG];
}

export function getQueueCategoryPressure(
  leadQueue: AdminLeadRequest[],
  submissionQueue: AdminVendorSubmission[],
): QueueCategoryPressure[] {
  const buckets = createAccumulator();

  for (const lead of leadQueue) {
    const targetSlugs = resolveLeadTargetSlugs(lead);
    const { today, yesterday } = getSubmissionWindowMarkers(lead.submittedAt);

    for (const slug of targetSlugs) {
      const bucket = buckets.get(slug) ?? buckets.get(UNCATEGORIZED_SLUG);
      if (!bucket) {
        continue;
      }

      bucket.leadTotal += 1;
      bucket.leadOpen += LEAD_OPEN_STATUSES.includes(lead.status) ? 1 : 0;
      bucket.todayTotal += today ? 1 : 0;
      bucket.yesterdayTotal += yesterday ? 1 : 0;
      addOpenPressures(bucket);
    }
  }

  for (const submission of submissionQueue) {
    const targetSlugs = resolveSubmissionTargetSlugs(submission);
    const { today, yesterday } = getSubmissionWindowMarkers(submission.submittedAt);

    for (const slug of targetSlugs) {
      const bucket = buckets.get(slug) ?? buckets.get(UNCATEGORIZED_SLUG);
      if (!bucket) {
        continue;
      }

      bucket.submissionTotal += 1;
      bucket.submissionOpen += SUBMISSION_OPEN_STATUSES.includes(submission.status) ? 1 : 0;
      bucket.todayTotal += today ? 1 : 0;
      bucket.yesterdayTotal += yesterday ? 1 : 0;
      addOpenPressures(bucket);
    }
  }

  return [...buckets.values()]
    .filter((bucket) => bucket.leadTotal > 0 || bucket.submissionTotal > 0)
    .sort((a, b) => {
      if (b.pressure !== a.pressure) {
        return b.pressure - a.pressure;
      }

      return (b.leadOpen + b.submissionOpen) - (a.leadOpen + a.submissionOpen);
    })
    .map((bucket) => ({
      ...bucket,
      pressure: bucket.leadOpen + bucket.submissionOpen,
    }));
}

export function formatQueueCategoryMetricRows(
  leadQueue: AdminLeadRequest[],
  submissionQueue: AdminVendorSubmission[],
): Array<{ metric: string; value: number; metadata: string }> {
  const buckets = getQueueCategoryPressure(leadQueue, submissionQueue);

  return buckets.flatMap((bucket) => [
    {
      metric: `queue_pressure:${bucket.slug}:leads_total`,
      value: bucket.leadTotal,
      metadata: `${bucket.name} lead queue volume`,
    },
    {
      metric: `queue_pressure:${bucket.slug}:leads_open`,
      value: bucket.leadOpen,
      metadata: `${bucket.name} open lead pressure`,
    },
    {
      metric: `queue_pressure:${bucket.slug}:submissions_total`,
      value: bucket.submissionTotal,
      metadata: `${bucket.name} vendor submission volume`,
    },
    {
      metric: `queue_pressure:${bucket.slug}:submissions_open`,
      value: bucket.submissionOpen,
      metadata: `${bucket.name} open submission pressure`,
    },
  ]);
}
