"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sendConversionEvent } from "@/lib/client-conversion-events";
import { emptyVendorSubmissionForm, type VendorSubmissionFormState } from "@/lib/form-state";

type RouteCategoryOption = {
  label: string;
  slug: string;
};

type FormStatus = "idle" | "submitting" | "success" | "error";

const ROUTE_CATEGORY_OPTIONS: RouteCategoryOption[] = [
  {
    label: "Modular / Prefabricated Data Center Vendors",
    slug: "modular-prefab",
  },
  {
    label: "Liquid Cooling Providers",
    slug: "liquid-cooling",
  },
  {
    label: "AI Colocation / GPU Hosting Partners",
    slug: "ai-colocation-gpu-hosting",
  },
  {
    label: "Power and Electrical Infrastructure",
    slug: "power-and-electrical",
  },
  {
    label: "EPC and Commissioning Partners",
    slug: "epc-and-commissioning",
  },
];

const qualificationCards = [
  {
    title: "Best fit",
    body: "Vendors with a clear infrastructure role and enough detail for fast category placement.",
  },
  {
    title: "Speeds review",
    body: "Use a work email, a credible website, and a concise operator-level summary.",
  },
  {
    title: "Why review exists",
    body: "Moderation keeps the directory cleaner, more credible, and easier to use.",
  },
];

export function VendorSubmissionForm() {
  const [form, setForm] = useState<VendorSubmissionFormState>(emptyVendorSubmissionForm);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [submissionId, setSubmissionId] = useState("");

  function update<K extends keyof VendorSubmissionFormState>(key: K, value: VendorSubmissionFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    try {
      const key = "mdc_conversion_vendor_submit_start";
      const isSent = sessionStorage.getItem(key) === "1";
      if (!isSent) {
        void sendConversionEvent({
          funnel: "vendor_submit",
          eventName: "form_start",
          source: "/for-vendors/submit",
        });
        sessionStorage.setItem(key, "1");
      }
    } catch {
      void sendConversionEvent({
        funnel: "vendor_submit",
        eventName: "form_start",
        source: "/for-vendors/submit",
      });
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    void sendConversionEvent({
      funnel: "vendor_submit",
      eventName: "form_submit",
      source: "/for-vendors/submit",
    });

    try {
      const response = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType: "submit", formData: form }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        submission?: { id: string };
      };

      if (!response.ok || !payload.ok || !payload.submission) {
        throw new Error(payload.error ?? "Could not save your submission.");
      }

      setSubmissionId(payload.submission.id);
      setStatus("success");
      setForm(emptyVendorSubmissionForm);

      void sendConversionEvent({
        funnel: "vendor_submit",
        eventName: "form_submit_success",
        source: "/for-vendors/submit",
        submissionId: payload.submission.id,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not save your request. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-3 md:grid-cols-3">
        {qualificationCards.map((card) => (
          <div key={card.title} className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(247,250,252,0.72)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">{card.title}</p>
            <p className="mt-2">{card.body}</p>
          </div>
        ))}
      </div>
      <Field label="Company name" value={form.companyName} onChange={(value) => update("companyName", value)} placeholder="Company name" required />
      <Field
        label="Website"
        value={form.websiteUrl}
        onChange={(value) => update("websiteUrl", value)}
        placeholder="https://example.com"
        type="url"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" value={form.contactName} onChange={(value) => update("contactName", value)} placeholder="Full name" required />
        <Field
          label="Contact email"
          value={form.contactEmail}
          onChange={(value) => update("contactEmail", value)}
          placeholder="name@company.com"
          type="email"
          required
        />
      </div>
      <Field label="Categories" value={form.categories} onChange={(value) => update("categories", value)} placeholder="Modular Data Center Vendors" />
      <SelectField
        label="Preferred routing category (optional)"
        value={form.routingCategory}
        options={ROUTE_CATEGORY_OPTIONS}
        onChange={(value) => update("routingCategory", value)}
      />
      <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
        Summary
        <textarea
          rows={5}
          value={form.summary}
          onChange={(event) => update("summary", event.target.value)}
          placeholder="What does your company offer?"
          className="rounded-2xl border border-[var(--border)] bg-[#fbfcfd] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
        />
      </label>
      <button
        type="submit"
        className="rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Submitting..." : "Submit for Review"}
      </button>
      {status === "success" ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold">Thanks — your submission has been received and queued for review.</p>
          <p className="mt-1">Reference: {submissionId}</p>
          <div className="mt-3 rounded-2xl border border-emerald-100 bg-white/80 p-3 text-emerald-900">
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">What happens next</p>
            <div className="mt-2 grid gap-1.5 text-sm">
              <p>• We review category fit, trust signals, and listing clarity.</p>
              <p>• Save this reference for follow-up.</p>
            </div>
          </div>
          <p className="mt-3 text-[var(--muted)]">Want to review your positioning while moderation is in progress?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/directory" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]">
              Review the directory map
            </Link>
            <Link href="/categories" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]">
              Check category fit
            </Link>
            <Link href="/for-vendors/claim" className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900">
              Claim an existing listing
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

type SelectFieldProps = {
  label: string;
  value: string;
  options: RouteCategoryOption[];
  onChange: (value: string) => void;
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

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[var(--border)] bg-[#fbfcfd] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
      >
        <option value="">Select one (optional)</option>
        {options.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
