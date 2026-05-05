import { NextRequest, NextResponse } from "next/server";

import { verifyVendorClaimToken } from "@/lib/form-persistence";
import { sanitizeText } from "@/lib/request-sanitization";
import { readJsonBody } from "@/lib/request-body";
import { buildRetryAfterHeader, checkThrottle, deriveThrottleKey } from "@/lib/request-throttle";

type ClaimVerifyPayload = {
  submissionId: string | null;
  claimToken: string | null;
};

const CLAIM_VERIFY_THROTTLE = {
  limit: 10,
  windowMs: 60000,
};

const SUBMISSION_ID_MAX_LENGTH = 160;
const CLAIM_TOKEN_MAX_LENGTH = 128;

export async function POST(request: NextRequest) {
  try {
    const payload = await extractPayload(request);
    if (payload === null) {
      return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
    }

    if (!payload.submissionId || !payload.claimToken) {
      return NextResponse.json({ ok: false, error: "Missing submissionId or claimToken." }, { status: 400 });
    }

    const throttle = checkThrottle(
      "claim_verify",
      `${deriveThrottleKey(request.headers)}:${payload.submissionId}`,
      CLAIM_VERIFY_THROTTLE,
    );

    if (!throttle.ok) {
      return NextResponse.json(
        { ok: false, error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.` },
        {
          status: 429,
          headers: {
            "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds),
          },
        },
      );
    }

    const result = await verifyVendorClaimToken(payload.submissionId, payload.claimToken, {
      source: "claim_token_verify",
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error ?? "Unable to verify claim." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, submission: result.submission });
  } catch (error) {
    console.error("claim verification failed", error);
    return NextResponse.json({ ok: false, error: "Unable to verify claim token." }, { status: 500 });
  }
}

function requestAcceptsJson(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json");
}

async function extractPayload(request: NextRequest): Promise<ClaimVerifyPayload | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const parsedBody = await readJsonBody<Record<string, unknown>>(request, { maxBytes: 4000 });
    if (!parsedBody.ok) {
      return null;
    }

    return {
      submissionId: sanitizeText(parsedBody.body?.submissionId, {
        maxLength: SUBMISSION_ID_MAX_LENGTH,
        preserveNewlines: false,
        lowerCase: false,
        collapseWhitespace: true,
      }),
      claimToken: sanitizeText(parsedBody.body?.claimToken, {
        maxLength: CLAIM_TOKEN_MAX_LENGTH,
        preserveNewlines: false,
        lowerCase: false,
        collapseWhitespace: true,
      }),
    };
  }

  const submissionId = sanitizeText(new URL(request.url).searchParams.get("submissionId"), {
    maxLength: SUBMISSION_ID_MAX_LENGTH,
    preserveNewlines: false,
    lowerCase: false,
    collapseWhitespace: true,
  });

  const claimToken = sanitizeText(new URL(request.url).searchParams.get("claimToken"), {
    maxLength: CLAIM_TOKEN_MAX_LENGTH,
    preserveNewlines: false,
    lowerCase: false,
    collapseWhitespace: true,
  });

  const formData = await request.formData().catch(() => null);

  return {
    submissionId:
      typeof formData?.get("submissionId") === "string"
        ? sanitizeText(formData.get("submissionId"), {
            maxLength: SUBMISSION_ID_MAX_LENGTH,
            preserveNewlines: false,
            lowerCase: false,
            collapseWhitespace: true,
          })
        : submissionId,
    claimToken:
      typeof formData?.get("claimToken") === "string"
        ? sanitizeText(formData.get("claimToken"), {
            maxLength: CLAIM_TOKEN_MAX_LENGTH,
            preserveNewlines: false,
            lowerCase: false,
            collapseWhitespace: true,
          })
        : claimToken,
  };
}

export async function GET(request: NextRequest) {
  const urlSubmissionId = sanitizeText(new URL(request.url).searchParams.get("submissionId"), {
    maxLength: SUBMISSION_ID_MAX_LENGTH,
    preserveNewlines: false,
    lowerCase: false,
    collapseWhitespace: true,
  });
  const urlClaimToken = sanitizeText(new URL(request.url).searchParams.get("claimToken"), {
    maxLength: CLAIM_TOKEN_MAX_LENGTH,
    preserveNewlines: false,
    lowerCase: false,
    collapseWhitespace: true,
  });

  if (!urlSubmissionId || !urlClaimToken) {
    return NextResponse.json({ ok: false, error: "Missing submissionId or claimToken." }, { status: 400 });
  }

  const throttle = checkThrottle(
    "claim_verify",
    `${deriveThrottleKey(request.headers)}:${urlSubmissionId}`,
    CLAIM_VERIFY_THROTTLE,
  );

  if (!throttle.ok) {
    return NextResponse.json(
      { ok: false, error: `Rate limit exceeded. Try again in ${throttle.retryAfterSeconds}s.` },
      {
        status: 429,
        headers: {
          "Retry-After": buildRetryAfterHeader(throttle.retryAfterSeconds),
        },
      },
    );
  }

  const result = await verifyVendorClaimToken(urlSubmissionId, urlClaimToken, {
    source: "claim_token_verify",
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "Unable to verify claim." }, { status: 400 });
  }

  if (requestAcceptsJson(request)) {
    return NextResponse.json({ ok: true, submission: result.submission });
  }

  return NextResponse.redirect(new URL(`/admin/vendor-submissions?status=${result.submission?.status ?? ""}`, request.url), {
    status: 303,
  });
}
