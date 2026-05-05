"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { sendConversionEvent } from "@/lib/client-conversion-events";
import { emptyClaimForm, type ClaimFormState } from "@/lib/form-state";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ClaimForm() {
  const [form, setForm] = useState<ClaimFormState>(emptyClaimForm);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [claimToken, setClaimToken] = useState("");
  const [claimStatus, setClaimStatus] = useState("");

  function update<K extends keyof ClaimFormState>(key: K, value: ClaimFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const verificationLink = useMemo(() => {
    if (!submissionId || !claimToken) {
      return "";
    }

    return `/for-vendors/claim/verify?submissionId=${encodeURIComponent(submissionId)}&claimToken=${encodeURIComponent(claimToken)}`;
  }, [submissionId, claimToken]);

  useEffect(() => {
    try {
      const key = "mdc_conversion_claim_start";
      const isSent = sessionStorage.getItem(key) === "1";
      if (!isSent) {
        void sendConversionEvent({
          funnel: "vendor_claim",
          eventName: "form_start",
          source: "/for-vendors/claim",
        });
        sessionStorage.setItem(key, "1");
      }
    } catch {
      void sendConversionEvent({
        funnel: "vendor_claim",
        eventName: "form_start",
        source: "/for-vendors/claim",
      });
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    void sendConversionEvent({
      funnel: "vendor_claim",
      eventName: "form_submit",
      source: "/for-vendors/claim",
    });

    try {
      const response = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType: "claim", formData: form }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        submission?: { id: string; claimToken?: string; status?: string };
      };

      if (!response.ok || !payload.ok || !payload.submission) {
        throw new Error(payload.error ?? "Could not save your request.");
      }

      setSubmissionId(payload.submission.id);
      setClaimToken(payload.submission.claimToken ?? "");
      setClaimStatus(payload.submission.status ?? "");
      setStatus("success");
      setForm(emptyClaimForm);

      void sendConversionEvent({
        funnel: "vendor_claim",
        eventName: "form_submit_success",
        source: "/for-vendors/claim",
        submissionId: payload.submission.id,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save your request. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
      <Field label="Company name" value={form.companyName} onChange={(value) => update("companyName", value)} placeholder="Company name" required />
      <Field
        label="Company website"
        value={form.websiteUrl}
        onChange={(value) => update("websiteUrl", value)}
        placeholder="https://example.com"
        type="url"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" value={form.claimantName} onChange={(value) => update("claimantName", value)} placeholder="Full name" required />
        <Field
          label="Work email"
          value={form.claimantEmail}
          onChange={(value) => update("claimantEmail", value)}
          placeholder="name@company.com"
          type="email"
          required
        />
      </div>
      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Requested changes or ownership notes
        <textarea
          rows={5}
          value={form.notes}
          onChange={(event) => update("notes", event.target.value)}
          placeholder="Explain your relationship to the listing and what needs updating."
          className="rounded-2xl border border-[var(--border)] bg-[#fbfcfd] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
        />
      </label>
      <button
        type="submit"
        className="rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Submitting..." : "Submit Claim Request"}
      </button>
      {status === "success" ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
          <p className="font-semibold">Thanks — your claim request has been received and queued.</p>
          <p className="mt-1">Reference: {submissionId}</p>
          <p className="mt-1">Status: {claimStatus}</p>
          {claimToken ? (
            <>
              <p className="mt-1">Claim token: {claimToken}</p>
              <p className="mt-1">
                Verification link: <Link href={verificationLink} className="font-semibold text-emerald-900 underline">
                  Open verification page
                </Link>
              </p>
            </>
          ) : null}
          <p className="mt-1 text-[var(--muted)]">Keep this ID and token for claim verification or follow-up.</p>
          <p className="mt-3 text-[var(--muted)]">Need to verify now? Or submit another listing?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/for-vendors/claim/verify" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]">
              Go to verify flow
            </Link>
            <Link href="/for-vendors/submit" className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900">
              Submit a new listing
            </Link>
          </div>
        </div>
      ) : null}
      {status === "error" ? <p className="text-sm leading-7 text-rose-600">{errorMessage}</p> : null}
    </form>
  );
}

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
};

function Field({ label, placeholder, value, onChange, type = "text", required = false }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-[var(--border)] bg-[#fbfcfd] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
        required={required}
      />
    </label>
  );
}
