import Link from "next/link";
import { categories, vendors } from "@/lib/site-data";
import { getMainDomainRows } from "@/lib/main-domains";

const quickStarts = [
  { label: "Power & electrical", href: "/directory/power-and-electrical" },
  { label: "Liquid cooling", href: "/directory/liquid-cooling" },
  { label: "AI colocation & GPU hosting", href: "/directory/ai-colocation-gpu-hosting" },
  { label: "Modular & prefab", href: "/directory/modular-prefab" },
];

export default function Home() {
  const mainDomains = getMainDomainRows();
  const subcategoryCount = categories.filter((category) => category.parent_slug).length;
  const verifiedCompanyCount = vendors.filter((vendor) => vendor.verified).length;

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-10">
        <section className="border-b border-[var(--border)] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Infrastructure ecosystem directory</p>
          <h1 className="mt-3 max-w-5xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            The authoritative directory for data center infrastructure research.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--muted-strong)] sm:text-base">
            MDC maps the infrastructure ecosystem across power, cooling, modular delivery, hosting, networking, operations,
            logistics, and site strategy. Start with the domain, move into the category structure, and use company profiles as
            leaves of the graph.
          </p>

          <form action="/directory" method="get" className="mt-6 grid gap-3 border border-[var(--border)] bg-[var(--card)] p-4 lg:grid-cols-[1fr_auto]">
            <input
              name="q"
              placeholder="Search power, cooling, modular, networking, commissioning..."
              className="w-full border border-[var(--border)] bg-[var(--background-strong)] px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--muted)]"
            />
            <button type="submit" className="border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--card-soft)]">
              Search directory
            </button>
          </form>

          <div className="mt-6 grid gap-px border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3 lg:grid-cols-4">
            <StatCell label="Main domains" value={String(mainDomains.length)} />
            <StatCell label="Categories" value={String(categories.length - subcategoryCount)} />
            <StatCell label="Subcategories" value={String(subcategoryCount)} />
            <StatCell label="Verified companies" value={String(verifiedCompanyCount)} />
          </div>
        </section>

        <section className="py-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Main domains</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Start with the broad infrastructure lanes.</h2>
            </div>
            <div className="flex gap-4 text-sm text-[var(--muted-strong)]">
              <Link href="/directory" className="font-semibold text-white">Open directory</Link>
              <Link href="/categories" className="transition hover:text-white">View hierarchy</Link>
            </div>
          </div>

          <div className="mt-5 border border-[var(--border)]">
            {mainDomains.map((domain, index) => (
              <section key={domain.slug} className={index === 0 ? "" : "border-t border-[var(--border)]"}>
                <div className="grid gap-4 px-4 py-4 lg:grid-cols-[260px_1fr] lg:px-5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-white">{domain.name}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {domain.categoryCount} categories · {domain.subcategoryCount} subcategories · {domain.companyCount} companies
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {domain.categories.map((category) => (
                      <Link key={category.slug} href={`/directory/${category.slug}`} className="border border-[var(--border)] px-4 py-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--card-soft)]">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm font-medium text-white">{category.name}</span>
                          <span className="text-xs text-[var(--muted)]">{category.companyCount}</span>
                        </div>
                        <p className="mt-2 text-xs text-[var(--muted)]">{category.subcategoryCount} subcategories</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--border)] pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Common starting points</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Frequently researched categories.</h2>
            </div>
            <Link href="/vendors?sort=category_count" className="text-sm text-[var(--muted-strong)] transition hover:text-white">
              Browse companies
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {quickStarts.map((item) => (
              <Link key={item.href} href={item.href} className="border border-[var(--border)] px-3 py-2 text-sm text-[var(--muted-strong)] transition hover:border-[var(--border-strong)] hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <article className="bg-[var(--card)] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </article>
  );
}
