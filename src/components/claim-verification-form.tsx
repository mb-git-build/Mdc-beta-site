"use client";

import { useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";

type ClaimVerificationFormProps = {
  initialSubmissionId?: string;
  initialClaimToken?: string;
};

type VerificationPayload = {
  ok: boolean;
  error?: string;
  submission?: {
    id: string;
    status: string;
    type?: string;
    validationState?: string;
    vendorSlug?: string;
    claimToken?: string;
  };
};

export function ClaimVerificationForm({ initialSubmissionId = "", initialClaimToken = "" }: ClaimVerificationFormProps) {
  const [submissionId, setSubmissionId] = useState(initialSubmissionId);
  const [claimToken, setClaimToken] = useState(initialClaimToken);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const [submission, setSubmission] = useState<VerificationPayload["submission"] | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    if (!submissionId.trim() || !claimToken.trim()) {
      setMessage("Submission ID and claim token are required.");
      setStatus("error");
      return;
    }

    try {
      const response = await fetch("/api/vendor-claims/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId.trim(),
          claimToken: claimToken.trim(),
        }),
      });

      const payload = (await response.json()) as VerificationPayload;
      if (!response.ok || !payload.ok || !payload.submission) {
        throw new Error(payload.error ?? "Unable to verify claim token.");
      }

      setSubmission(payload.submission);
      setStatus("success");
      setMessage("Claim has been verified and this submission moved to verified status.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to verify claim token.");
      setStatus("error");
    }
  }

  const verificationLink = submissionId && claimToken
    ? `/for-vendors/claim/verify?submissionId=${encodeURIComponent(submissionId)}&claimToken=${encodeURIComponent(claimToken)}`
    : null;

  return (
    <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Submission ID
        <input
          value={submissionId}
          onChange={(event) => setSubmissionId(event.target.value)}
          placeholder="submission-2026-..."
          className="rounded-2xl border border-[var(--border)] bg-[#fbfcfd] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Claim token
        <input
          value={claimToken}
          onChange={(event) => setClaimToken(event.target.value)}
          placeholder="paste claim token from your confirmation"
          className="rounded-2xl border border-[var(--border)] bg-[#fbfcfd] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          required
        />
      </label>

      <button
        type="submit"
        className="rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Verifying..." : "Verify claim now"}
      </button>

      {verificationLink ? (
        <p className="text-xs text-[var(--muted)]">
          You can also verify this claim from this link: <a href={verificationLink} className="text-[var(--accent)] underline">Open verification link</a>.
        </p>
      ) : null}

      {status === "success" ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <p className="font-semibold">Verification successful</p>
          <p className="mt-1">Submission: {submission?.id}</p>
          <p className="mt-1">Status: {submission?.status}</p>
          {submission?.vendorSlug ? <p className="mt-1">Vendor match: {submission.vendorSlug}</p> : null}
          {submission?.validationState ? <p className="mt-1">Validation: {submission.validationState}</p> : null}
          <div className="mt-3 rounded-2xl border border-emerald-100 bg-white/80 p-3 text-emerald-900">
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">What this means</p>
            <div className="mt-2 grid gap-1.5 text-sm">
              <p>• The claim token was accepted and the submission moved into a verified state.</p>
              <p>• Review can now proceed with a stronger ownership trail.</p>
              <p>• Keep this submission ID for any later follow-up about the same listing.</p>
            </div>
          </div>
          <p className="mt-3">Return link: <a href={verificationLink ?? "#"} className="text-emerald-900 underline">Open this verification state again</a></p>
        </div>
      ) : null}

      {status === "error" ? <p className="text-sm leading-7 text-rose-600">{message}</p> : null}
    </form>
  );
}
