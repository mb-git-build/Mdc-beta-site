"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { sendConversionEvent } from "@/lib/client-conversion-events";
import type { LeadQuestion } from "@/lib/site-data";

type LeadFormProps = {
  questions: LeadQuestion[];
};

export function LeadForm({ questions }: LeadFormProps) {
  const initialState = useMemo(
    () => Object.fromEntries(questions.map((question) => [question.id, ""])) as Record<string, string>,
    [questions],
  );

  const [form, setForm] = useState<Record<string, string>>(initialState);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submissionId, setSubmissionId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  type SubmitPayload = {
    ok: boolean;
    submission?: { id: string };
    error?: string;
  };

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    try {
      const key = "mdc_conversion_lead_start";
      const isSent = sessionStorage.getItem(key) === "1";
      if (!isSent) {
        void sendConversionEvent({
          funnel: "lead",
          eventName: "form_start",
          source: "/get-matched",
        });
        sessionStorage.setItem(key, "1");
      }
    } catch {
      void sendConversionEvent({
        funnel: "lead",
        eventName: "form_start",
        source: "/get-matched",
      });
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    void sendConversionEvent({
      funnel: "lead",
      eventName: "form_submit",
      source: "/get-matched",
    });

    try {
      const response = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType: "lead", formData: form }),
      });

      const payload = (await response.json()) as SubmitPayload;

      if (!response.ok || !payload.ok || !payload.submission) {
        throw new Error(payload.error ?? "Could not save your submission.");
      }

      setSubmissionId(payload.submission.id);
      setStatus("success");
      setForm(initialState);

      void sendConversionEvent({
        funnel: "lead",
        eventName: "form_submit_success",
        source: "/get-matched",
        submissionId: payload.submission.id,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save your request. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      {questions.map((question) => (
        <QuestionField
          key={question.id}
          id={question.id}
          label={question.label}
          type={question.type}
          options={question.options}
          value={form[question.id] ?? ""}
          onChange={(value) => update(question.id, value)}
        />
      ))}
      <button
        type="submit"
        className="mt-2 rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(16,44,60,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Submitting..." : "Submit Match Request"}
      </button>
      {status === "success" ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
          <p className="font-semibold">Thanks — your request has been captured for follow-up.</p>
          <p className="mt-1">Reference ID: {submissionId}</p>
          <p className="mt-3 text-[var(--muted)]">Helpful next steps:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/directory" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]">
              Explore the directory
            </Link>
            <Link href="/vendors" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]">
              Browse curated vendors
            </Link>
            <Link href="/get-matched" className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900">
              Edit your submission
            </Link>
          </div>
        </div>
      ) : null}
      {status === "error" ? <p className="text-sm leading-7 text-rose-600">{errorMessage}</p> : null}
    </form>
  );
}

type QuestionFieldProps = {
  id: string;
  label: string;
  type: "text" | "email" | "textarea" | "select";
  options?: string[];
  value: string;
  onChange: (value: string) => void;
};

function QuestionField({ id, label, type, options, value, onChange }: QuestionFieldProps) {
  const className = "rounded-2xl border border-[var(--border)] bg-[rgba(251,252,253,0.92)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(41,90,116,0.08)]";

  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]" htmlFor={id}>
      {label}
      {type === "textarea" ? (
        <textarea
          id={id}
          rows={5}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
          required={id === "contact_name" || id === "email" || id === "company_name"}
        />
      ) : type === "select" ? (
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
          required={id === "contact_name" || id === "email" || id === "company_name"}
        >
          <option value="">Select an option</option>
          {(options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
          required={id === "contact_name" || id === "email" || id === "company_name"}
        />
      )}
    </label>
  );
}
