import Link from "next/link";

const participationNotes = [
  "Directory inclusion is reviewed before publication.",
  "Claim flows help existing listings stay current without opening the floodgates.",
  "Featured visibility can exist without making the core directory pay-to-appear.",
];

const proofPoints = [
  "Position your company in front of buyers already comparing vendors and deployment options.",
  "Keep your profile current through claim verification instead of back-channel update requests.",
  "Show where you fit, what you support, and which project types you can realistically serve.",
];

const fitChecks = [
  {
    title: "Good fit",
    body: "OEMs, integrators, cooling, power, enclosure, controls, and deployment partners with a clear role in modular data center delivery.",
  },
  {
    title: "Best submissions",
    body: "Teams with a credible website, defined service area, identifiable deployment strengths, and enough detail to help buyers shortlist quickly.",
  },
  {
    title: "Not a shortcut",
    body: "This is not instant self-serve directory access. Listings and claims are moderated so buyers trust what they see.",
  },
];

const readinessChecklist = [
  "Clear category fit (what you actually provide in the infrastructure stack)",
  "Named geographies and deployment scope (where you can deliver)",
  "Credible website + buyer-facing proof points (projects, specs, certifications)",
  "Realistic project profile (densities, timelines, integration boundaries)",
];

export default function ForVendorsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(244,248,251,0.94))] p-8 shadow-[var(--shadow-soft)]">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">For Vendors</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight lg:text-5xl">A moderated path to visibility — without wrecking the buyer experience.</h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                Vendors can participate here without turning the site into a noisy lead-gen landfill. The point is quality listings, clear category fit, and enough review friction to keep the directory useful for serious buyers.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/for-vendors/submit" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(16,44,60,0.18)] transition hover:-translate-y-0.5">
                  Submit a listing
                </Link>
                <Link href="/for-vendors/claim" className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]">
                  Claim an existing listing
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/90 p-5 shadow-[0_12px_30px_rgba(16,44,60,0.06)]">
              <h2 className="text-base font-semibold tracking-tight">Participation principles</h2>
              <ul className="mt-3 grid gap-2 text-sm leading-7 text-[var(--muted)]">
                {participationNotes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
              <div className="mt-5 rounded-[1.25rem] bg-[rgba(247,250,252,0.9)] p-4 text-sm leading-7 text-[var(--muted)]">
                Best fit: vendors who want qualified visibility, category clarity, and a cleaner path to trust than generic marketplace spam.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[0_10px_24px_rgba(16,44,60,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Why participate</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Earn qualified visibility without getting buried in a generic marketplace.</h2>
            <div className="mt-5 grid gap-3">
              {proofPoints.map((point) => (
                <div key={point} className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(247,250,252,0.9)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                  {point}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/for-vendors/submit" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(16,44,60,0.18)] transition hover:-translate-y-0.5">
                Start a new submission
              </Link>
              <Link href="/vendors" className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]">
                Review current listings
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {fitChecks.map((item) => (
              <div key={item.title} className="rounded-[1.35rem] border border-[var(--border)] bg-white p-5 shadow-[0_10px_24px_rgba(16,44,60,0.04)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(247,250,252,0.9)] p-6 shadow-[0_10px_24px_rgba(16,44,60,0.04)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Submission readiness</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Want faster review? Submit with a complete vendor brief.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                Complete submissions move faster because category placement and trust checks are easier to verify on first pass.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/for-vendors/submit" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(16,44,60,0.18)] transition hover:-translate-y-0.5">
                Submit with full brief
              </Link>
              <Link href="/for-vendors/claim" className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]">
                Claim existing listing
              </Link>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 md:grid-cols-2">
            {readinessChecklist.map((item) => (
              <li key={item} className="rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <ActionCard
            eyebrow="New vendor"
            title="Submit a Listing"
            body="For vendors not yet represented in the directory. Share your company, website, and category fit for review."
            href="/for-vendors/submit"
          />
          <ActionCard
            eyebrow="Existing profile"
            title="Claim a Listing"
            body="For teams that want to update or manage an existing profile with an ownership and verification trail."
            href="/for-vendors/claim"
          />
          <ActionCard
            eyebrow="Commercial policy"
            title="Featured Placement"
            body="Commercial visibility can exist here without turning basic inclusion into pay-to-appear."
            href="/methodology"
          />
        </section>
      </div>
    </main>
  );
}

function ActionCard({ eyebrow, title, body, href }: { eyebrow: string; title: string; body: string; href: string }) {
  return (
    <Link href={href} className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[0_10px_24px_rgba(16,44,60,0.04)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p>
      <h2 className="mt-3 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{body}</p>
    </Link>
  );
}
