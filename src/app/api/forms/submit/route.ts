import { NextRequest, NextResponse } from "next/server";

import { submitClaim, submitLead, submitVendorSubmission } from "@/lib/form-persistence";
import { sanitizeText } from "@/lib/request-sanitization";
import { readJsonBody } from "@/lib/request-body";
import { buildRetryAfterHeader, checkThrottle, deriveThrottleKey } from "@/lib/request-throttle";

type FormType = "lead" | "submit" | "claim";

type FormSubmitRequest = {
  formType: FormType;
  formData: Record<string, string>;
};

const DEFAULT_FORM_SUBMIT_PAYLOAD_LIMIT = 64_000;
const DEFAULT_FORM_FIELD_LIMIT = 80;
const DEFAULT_FORM_KEY_LIMIT = 64;
const DEFAULT_FORM_VALUE_LIMIT = 1200;
const FORM_SUBMIT_THROTTLE = {
  limit: 20,
  windowMs: 60_000,
};

export async function POST(request: NextRequest) {
  try {
    const throttleKey = deriveThrottleKey(request.headers);
    const throttle = checkThrottle("form_submit", throttleKey, FORM_SUBMIT_THROTTLE);

    if (!throttle.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds),
          },
        },
      );
    }

    const parsedBody = await readJsonBody<unknown>(request, { maxBytes: DEFAULT_FORM_SUBMIT_PAYLOAD_LIMIT });
    if (!parsedBody.ok) {
      return NextResponse.json({ ok: false, error: parsedBody.error }, { status: parsedBody.status });
    }

    const body = parsedBody.body;

    if (!isPlainObject(body)) {
      return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
    }

    const { formType, formData } = body as FormSubmitRequest;

    if (!isValidFormType(formType)) {
      return NextResponse.json({ ok: false, error: "Invalid form type." }, { status: 400 });
    }

    const sanitizedFormData = sanitizeSubmissionPayload(formData);
    if (!sanitizedFormData) {
      return NextResponse.json({ ok: false, error: "Form data invalid or malformed." }, { status: 400 });
    }

    if (formType === "lead") {
      const result = await submitLead(sanitizedFormData);
      return NextResponse.json(result);
    }

    if (formType === "submit") {
      const result = await submitVendorSubmission(sanitizedFormData);
      return NextResponse.json(result);
    }

    const result = await submitClaim(sanitizedFormData);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "required_fields_missing") {
      return NextResponse.json({ ok: false, error: "Please complete required fields." }, { status: 400 });
    }

    console.error("form submit failed", error);
    return NextResponse.json({ ok: false, error: "Unable to save your submission." }, { status: 500 });
  }
}

function isPlainObject(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidFormType(value: string | undefined): value is FormType {
  return value === "lead" || value === "submit" || value === "claim";
}

function sanitizeSubmissionPayload(value: unknown): Record<string, string> | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const rawEntries = Object.entries(value as Record<string, unknown>);
  if (rawEntries.length === 0 || rawEntries.length > DEFAULT_FORM_FIELD_LIMIT) {
    return null;
  }

  const normalized: Record<string, string> = {};

  for (const [key, rawValue] of rawEntries) {
    const safeKey = sanitizeText(key, {
      maxLength: DEFAULT_FORM_KEY_LIMIT,
      preserveNewlines: false,
      collapseWhitespace: true,
      lowerCase: false,
    });

    if (!safeKey) {
      return null;
    }

    if (typeof rawValue !== "string") {
      return null;
    }

    const safeValue = sanitizeText(rawValue, {
      maxLength: DEFAULT_FORM_VALUE_LIMIT,
      preserveNewlines: true,
      collapseWhitespace: false,
      lowerCase: false,
    });

    if (safeValue === null) {
      return null;
    }

    normalized[safeKey] = safeValue;
  }

  return normalized;
}
