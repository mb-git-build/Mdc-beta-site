import { VendorSubmissionForm } from "@/components/vendor-submission-form";

const notes = [
  "Submissions are reviewed before publication.",
  "Clear category fit helps the right buyers find you faster.",
  "A strong summary beats a pile of vague marketing claims.",
];

const checklist = [
  "Use your company website, not a generic contact landing page.",
  "Name the product or service categories you actually support.",
  "Describe deployment strengths, regions served, and typical project scale.",
];

const nextSteps = [
  "Immediate confirmation with a submission reference so your team can track follow-up.",
  "Moderation pass to validate category fit, trust signals, and listing clarity.",
  "If approved, your listing enters the public directory with cleaner buyer-facing context.",
];

export default function SubmitListingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Submit a Listing</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Submit your company for review.</h1>
          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
            Share your company, website, category fit, and a crisp summary of what you actually do. This form is designed to improve listing quality before anything goes live.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(247,250,252,0.9)] p-5">
            <h2 className="text-base font-semibold tracking-tight">What improves approval odds</h2>
            <ul className="mt-3 grid gap-2 text-sm leading-7 text-[var(--muted)]">
              {notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,255,255,0.96)] p-5">
            <h2 className="text-base font-semibold tracking-tight">Before you hit submit</h2>
            <div className="mt-4 grid gap-3">
              {checklist.map((item) => (
                <div key={item} className="rounded-[1rem] border border-[var(--border)] bg-[rgba(247,250,252,0.72)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)]">
          <div className="mb-6 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(247,250,252,0.9)] p-5">
            <h2 className="text-base font-semibold tracking-tight">What happens after submission</h2>
            <div className="mt-3 grid gap-3">
              {nextSteps.map((step) => (
                <div key={step} className="rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                  {step}
                </div>
              ))}
            </div>
          </div>
          <VendorSubmissionForm />
        </section>
      </div>
    </main>
  );
}
