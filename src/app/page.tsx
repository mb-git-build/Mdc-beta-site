import Link from "next/link";
import { categories, vendors } from "@/lib/site-data";
import { getMainDomainRows } from "@/lib/main-domains";

export default function Home() {
  const mainDomains = getMainDomainRows();
  const subcategoryCount = categories.filter((category) => category.parent_slug).length;
  const verifiedCompanyCount = vendors.filter((vendor) => vendor.verified).length;

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      <section>
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Industry directory</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Main domains, categories, subcategories, companies.</h1>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/categories" className="font-semibold text-[var(--accent)]">All categories</Link>
              <Link href="/vendors" className="font-semibold text-[var(--muted-strong)]">All companies</Link>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Main domains</p>
              <p className="mt-1 text-xl font-semibold text-white">{mainDomains.length}</p>
            </article>
            <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Subcategories</p>
              <p className="mt-1 text-xl font-semibold text-white">{subcategoryCount}</p>
            </article>
            <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Companies</p>
              <p className="mt-1 text-xl font-semibold text-white">{vendors.length}</p>
            </article>
            <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Verified</p>
              <p className="mt-1 text-xl font-semibold text-white">{verifiedCompanyCount}</p>
            </article>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Main domains</p>
            <p className="text-xs text-[var(--muted)]">{mainDomains.length} inventory groups</p>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {mainDomains.map((domain) => (
              <section key={domain.slug} className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-semibold tracking-tight text-white">{domain.name}</h2>
                  <span className="text-[11px] font-medium text-[var(--muted)]">{domain.categoryCount}</span>
                </div>
                <div className="mt-2 text-xs text-[var(--muted-strong)]">
                  <span>{domain.categoryCount} categories</span>
                  <span className="mx-1.5 text-[var(--muted)]">·</span>
                  <span>{domain.companyCount} companies</span>
                </div>
                <div className="mt-3 space-y-1.5 text-[13px] leading-5">
                  {domain.categories.slice(0, 4).map((category) => (
                    <Link key={category.slug} href={`/directory/${category.slug}`} className="block text-[var(--muted-strong)] transition hover:text-white">
                      {category.name}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
