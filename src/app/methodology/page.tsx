import { categories } from "@/lib/site-data";

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Methodology</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Curated listings require explicit rules.</h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-[var(--muted)]">
            The directory is meant to be selective, buyer-relevant, and commercially useful. The goal is signal, not a landfill of barely related company names.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <Card title="Buyer relevance first" body="Listings should help buyers evaluate, source, or deploy modular and AI-ready infrastructure." />
          <Card title="Curated, not exhaustive" body="Inclusion is selective and category-driven, not merely a keyword grab." />
          <Card title="Moderated participation" body="Vendor submissions and claim requests should be reviewed before publication or major revision." />
          <Card title="Commercial clarity" body="Featured visibility can exist without collapsing the distinction between editorial structure and sponsorship." />
        </section>

        <section className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Launch categories</p>
          <div className="mt-6 grid gap-4">
            {categories.map((category) => (
              <div key={category.slug} className="rounded-[1.25rem] bg-[#f7fafc] p-4">
                <h2 className="text-lg font-semibold tracking-tight">{category.name}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{body}</p>
    </div>
  );
}
