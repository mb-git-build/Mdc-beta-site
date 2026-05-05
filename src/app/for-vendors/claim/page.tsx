import { ClaimForm } from "@/components/claim-form";

const claimNotes = [
  "Use a work email tied to the company when possible.",
  "Be specific about the listing updates or ownership issue.",
  "You’ll receive a verification path instead of a blind form submission black hole.",
];

const trustSignals = [
  "Verification helps prevent listing hijacks and stale ownership claims.",
  "Claim requests create a review trail for status, follow-up, and token-based verification.",
  "If your team already appears in the directory, this is the fastest clean path to updates.",
];

const claimFlow = [
  "Submit with a company-tied email so verification can be issued quickly.",
  "Receive claim-token guidance and complete verification via the follow-up flow.",
  "Once verified, listing updates can be reviewed and published with a trust trail.",
];

export default function ClaimListingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Claim a Listing</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Claim and update an existing listing.</h1>
          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
            If your company is already listed, use this flow to verify ownership, request updates, and keep public profile details accurate without bypassing review.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(247,250,252,0.9)] p-5">
            <h2 className="text-base font-semibold tracking-tight">Before you submit</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-7 text-[var(--muted)]">
              {claimNotes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,255,255,0.96)] p-5">
            <h2 className="text-base font-semibold tracking-tight">Why this process exists</h2>
            <div className="mt-4 grid gap-3">
              {trustSignals.map((signal) => (
                <div key={signal} className="rounded-[1rem] border border-[var(--border)] bg-[rgba(247,250,252,0.72)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)]">
          <div className="mb-6 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(247,250,252,0.9)] p-5">
            <h2 className="text-base font-semibold tracking-tight">Claim flow at a glance</h2>
            <div className="mt-3 grid gap-3">
              {claimFlow.map((step) => (
                <div key={step} className="rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                  {step}
                </div>
              ))}
            </div>
          </div>
          <ClaimForm />
        </section>
      </div>
    </main>
  );
}
