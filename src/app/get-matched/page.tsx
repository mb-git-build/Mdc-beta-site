import Link from "next/link";

const nextSteps = [
  {
    title: "Start with a category",
    body: "Open the full market map and begin with the systems layer you care about most: power, cooling, modular delivery, controls, land, or operations.",
    href: "/categories",
    cta: "Explore categories",
  },
  {
    title: "Browse suppliers",
    body: "Move from category pages into vendor profiles to compare who shows up across adjacent infrastructure segments.",
    href: "/vendors",
    cta: "View vendors",
  },
  {
    title: "Use a guided path",
    body: "If you want a more structured jump-off point, the directory highlights common sourcing pathways and adjacent systems to review next.",
    href: "/directory",
    cta: "Browse directory",
  },
];

export default function GetMatchedPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Legacy Route</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">The public intake flow has been retired.</h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          This site now prioritizes category discovery, supplier research, and market-map navigation over lead-funnel workflows. Instead of filling out a buyer intake form, start broad and move through the infrastructure graph.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/categories" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(16,44,60,0.14)] transition hover:-translate-y-0.5">
            Explore categories
          </Link>
          <Link href="/vendors" className="rounded-full border border-[var(--border-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]">
            View vendors
          </Link>
          <Link href="/directory" className="rounded-full border border-[var(--border-strong)] bg-[#f7fafc] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]">
            Browse directory
          </Link>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {nextSteps.map((step) => (
            <article key={step.title} className="rounded-[1.4rem] border border-[var(--border)] bg-[#f9fbfc] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Next step</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--foreground)]">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{step.body}</p>
              <Link href={step.href} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                {step.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[#102c3c] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8ed1e8]">How to use the site now</p>
          <div className="mt-3 grid gap-3 text-sm leading-7 text-[#dbe5eb] sm:grid-cols-3">
            <p>Pick a system layer like cooling, power, deployment, or monitoring.</p>
            <p>Follow adjacent links to understand how neighboring categories connect in real projects.</p>
            <p>Use vendor profiles and guides to turn browsing into a practical sourcing map.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
