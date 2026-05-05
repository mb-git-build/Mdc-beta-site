import { AdminLeadRequest } from "@/lib/site-data";
import { getLeadRoutingTags, hasExplicitRoutingTag } from "@/lib/admin-routing-tags";

export type LeadValidationTier = "critical" | "warning" | "good";
export type LeadUrgencyLevel = "urgent" | "soon" | "standard";

export type LeadQualityAssessment = {
  score: number;
  scoreLabel: "Low" | "Medium" | "High";
  urgencyLevel: LeadUrgencyLevel;
  urgencyLabel: "Urgent" | "Soon" | "Standard";
  missingFields: string[];
  validationTier: LeadValidationTier;
  validationSummary: string;
  routingConfidence: number;
  routingConfidenceLabel: "Low" | "Medium" | "Strong";
  routingConfidenceReason: string;
};

const VAGUE_STRINGS = new Set([
  "not sure yet",
  "still evaluating options",
  "need help deciding",
  "need guidance",
  "prefer to discuss",
  "confidential / prefer to discuss",
  "just researching",
  "",
]);

const TIMELINE_SCORES: Record<string, number> = {
  "asap / urgent": 24,
  "0–3 months": 18,
  "0-3 months": 18,
  "3–6 months": 14,
  "3-6 months": 14,
  "6–12 months": 8,
  "6-12 months": 8,
  "just researching": 2,
};

const VOLUME_FIELDS = {
  deployment_goal: 15,
  workload_type: 12,
  power_density_needs: 12,
  budget_band: 12,
  cooling_preference: 8,
  deployment_model: 8,
  target_region: 5,
  notes: 4,
} as const;

const MANDATORY_FIELDS = [
  { key: "deployment_goal", label: "Deployment goal" },
  { key: "workload_type", label: "Workload type" },
  { key: "required_timeline", label: "Timeline" },
  { key: "power_density_needs", label: "Power density" },
  { key: "budget_band", label: "Budget stage" },
];

function normalize(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function normalizeValue(value?: string) {
  return normalize(value)
    .replace(/\s+/g, " ")
    .trim();
}

function isEmpty(value?: string) {
  return normalizeValue(value).length === 0;
}

function isVague(value?: string) {
  const normalized = normalize(value);
  return VAGUE_STRINGS.has(normalized);
}

function readField(row: AdminLeadRequest, key: string) {
  return normalizeValue(row.formData?.[key]);
}

function hasAnyRoutingSignal(row: AdminLeadRequest) {
  const routingSignalKeys = [
    "routing_category",
    "routingCategory",
    "category_focus",
    "category_slug",
    "routing_slug",
  ];

  return routingSignalKeys.some((key) => Boolean(readField(row, key)));
}

function clampScore(score: number) {
  if (score < 0) {
    return 0;
  }

  if (score > 100) {
    return 100;
  }

  return score;
}

function scoreField(value: string, weight: number) {
  if (isEmpty(value) || isVague(value)) {
    return 0;
  }

  return weight;
}

function scoreTimeline(value: string) {
  if (!value) {
    return 0;
  }

  return TIMELINE_SCORES[value] ?? 0;
}

function scoreRouting(row: AdminLeadRequest) {
  const tags = getLeadRoutingTags(row);
  if (tags.length >= 1) {
    return 10;
  }

  return 0;
}

function evaluateRoutingConfidence(row: AdminLeadRequest) {
  let score = 15;
  const hasRoutingSignals = hasAnyRoutingSignal(row);
  const routingTags = getLeadRoutingTags(row);
  const hasRoutingTags = routingTags.length > 0;

  if (hasRoutingSignals) {
    score += 30;
  }

  if (hasExplicitRoutingTag(row)) {
    score += 35;
  }

  if (hasRoutingTags) {
    score += 20;
  }

  if (!isEmpty(readField(row, "deployment_model"))) {
    score += 5;
  }

  if (!isEmpty(readField(row, "workload_type"))) {
    score += 5;
  }

  const normalized = clampScore(score);

  if (normalized >= 80) {
    return {
      score: normalized,
      label: "Strong" as const,
      reason: hasExplicitRoutingTag(row)
        ? "Direct category mapping from explicit routing fields"
        : "Routing derived from validated category clues",
    };
  }

  if (normalized >= 55) {
    return {
      score: normalized,
      label: "Medium" as const,
      reason: hasRoutingTags
        ? "Routing inferred from form category hints"
        : "Routing confidence is limited (few category hints)",
    };
  }

  return {
    score: normalized,
    label: "Low" as const,
    reason: "Route confidence is low; review form fields before triage.",
  };
}

function buildMissingFields(row: AdminLeadRequest) {
  const missing: string[] = [];

  for (const field of MANDATORY_FIELDS) {
    if (!readField(row, field.key)) {
      missing.push(field.label);
      continue;
    }

    if (isVague(row.formData?.[field.key])) {
      missing.push(field.label);
    }
  }

  return missing;
}

function determineTier(score: number, missingFields: string[]) {
  if (missingFields.length >= 3 || score < 45) {
    return {
      label: "critical" as const,
      summary: "Mandatory follow-up needed before assignment.",
    };
  }

  if (missingFields.length >= 1 || score < 70) {
    return {
      label: "warning" as const,
      summary: "Good lead but a quick follow-up improves qualification.",
    };
  }

  return {
    label: "good" as const,
    summary: "Lead form is qualification-complete.",
  };
}

function urgencyFromTimeline(value: string): LeadUrgencyLevel {
  const normalized = normalize(value);

  if (normalized.includes("asap") || normalized.includes("urgent") || normalized.startsWith("0") || normalized.startsWith("0-")) {
    return "urgent";
  }

  if (normalized.includes("3") || normalized.includes("6")) {
    return "soon";
  }

  return "standard";
}

export function evaluateLeadQuality(row: AdminLeadRequest): LeadQualityAssessment {
  const timelineValue = readField(row, "required_timeline");
  const routingConfidence = evaluateRoutingConfidence(row);
  const missingFields = buildMissingFields(row);

  const score = clampScore(
    scoreTimeline(timelineValue) +
      scoreRouting(row) +
      scoreField(readField(row, "deployment_goal"), VOLUME_FIELDS.deployment_goal) +
      scoreField(readField(row, "workload_type"), VOLUME_FIELDS.workload_type) +
      scoreField(readField(row, "power_density_needs"), VOLUME_FIELDS.power_density_needs) +
      scoreField(readField(row, "budget_band"), VOLUME_FIELDS.budget_band) +
      scoreField(readField(row, "cooling_preference"), VOLUME_FIELDS.cooling_preference) +
      scoreField(readField(row, "deployment_model"), VOLUME_FIELDS.deployment_model) +
      scoreField(readField(row, "target_region"), VOLUME_FIELDS.target_region) +
      scoreField(readField(row, "notes"), VOLUME_FIELDS.notes),
  );

  const tier = determineTier(score, missingFields);
  const urgencyLevel = urgencyFromTimeline(timelineValue);

  return {
    score,
    scoreLabel: score >= 80 ? "High" : score >= 60 ? "Medium" : "Low",
    urgencyLevel,
    urgencyLabel: urgencyLevel === "urgent" ? "Urgent" : urgencyLevel === "soon" ? "Soon" : "Standard",
    missingFields,
    validationTier: tier.label,
    validationSummary: tier.summary,
    routingConfidence: routingConfidence.score,
    routingConfidenceLabel: routingConfidence.label,
    routingConfidenceReason: routingConfidence.reason,
  };
}
