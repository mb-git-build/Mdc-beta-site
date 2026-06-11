import Link from "next/link";
import { categories, vendors } from "@/lib/site-data";
import { getMainDomainRows } from "@/lib/main-domains";

export default function Home() {
  const mainDomains = getMainDomainRows();
  const subcategoryCount = categories.filter((category) => category.parent_slug).length;
  const verifiedCompanyCount = vendors.filter((vendor) => vendor.verified).length;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section>
        <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-18">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Industry directory</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Explore the market through main domains, categories, and companies.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">
              Start broad, then drill into categories, subcategories, and company listings across the modular and AI data center ecosystem.
            </p>
          </div>

          <div className="mt-10 max-w-5xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)]">
            <form action="/vendors" method="get" className="flex flex-col gap-3 lg:flex-row">
              <input
                name="q"
                placeholder="Search categories, subcategories, and companies..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-strong)] px-5 py-4 text-base text-white outline-none placeholder:text-[#7f8b99]"
              />
              <button type="submit" className="rounded-xl bg-white px-6 py-4 text-sm font-semibold text-[#0f141a]">
                Search directory
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Market coverage</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">A table of contents for the directory.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Main domains</p>
              <p className="mt-2 text-2xl font-semibold text-white">{mainDomains.length}</p>
            </article>
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Subcategories</p>
              <p className="mt-2 text-2xl font-semibold text-white">{subcategoryCount}</p>
            </article>
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Companies</p>
              <p className="mt-2 text-2xl font-semibold text-white">{vendors.length}</p>
            </article>
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Verified companies</p>
              <p className="mt-2 text-2xl font-semibold text-white">{verifiedCompanyCount}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Main domains</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Browse the ecosystem at the right level first.</h2>
          </div>
          <Link href="/categories" className="text-sm font-semibold text-[var(--accent)]">View categories</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mainDomains.map((domain) => (
            <section key={domain.slug} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold tracking-tight text-white">{domain.name}</h3>
                <span className="rounded-full bg-[var(--card-soft)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                  {domain.categoryCount} categories
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{domain.description}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                <span>{domain.subcategoryCount} subcategories</span>
                <span>•</span>
                <span>{domain.companyCount} companies</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                {domain.categories.slice(0, 5).map((category) => (
                  <Link key={category.slug} href={`/directory/${category.slug}`} className="rounded-full bg-[var(--card-soft)] px-2.5 py-1 transition hover:text-white">
                    {category.name}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
