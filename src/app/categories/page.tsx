import Link from "next/link";
import { getCategoryLineage, getVendorsForCategory } from "@/lib/site-data";
import { getMainDomainRows } from "@/lib/main-domains";

function GroupCard({
  title,
  description,
  rows,
}: {
  title: string;
  description?: string;
  rows: ReturnType<typeof getMainDomainRows>[number]["categories"];
}) {
  if (!rows.length) {
    return null;
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{description}</p> : null}
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted-strong)]">
          {rows.length} categories · {rows.reduce((sum, row) => sum + row.companyCount, 0)} connected companies
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((category) => {
          const lineage = getCategoryLineage(category.slug);
          const directCompanies = getVendorsForCategory(category.slug);

          return (
            <Link key={category.slug} href={`/directory/${category.slug}`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                <span>{category.layer === "subcategory" ? "Subcategory" : "Category"}</span>
                {lineage.parent ? <span>{lineage.parent.name}</span> : null}
              </div>
              <h3 className="mt-2 text-base font-semibold tracking-tight text-white">{category.name}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-[var(--muted-strong)]">{category.companyCount} companies</p>
                {category.subcategoryCount ? (
                  <p className="text-xs text-[var(--muted)]">{category.subcategoryCount} subcategories</p>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                {directCompanies.slice(0, 4).map((company) => (
                  <span key={company.slug} className="rounded-full bg-[var(--card-soft)] px-2.5 py-1">
                    {company.name}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function CategoriesPage() {
  const mainDomains = getMainDomainRows();

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Categories</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Browse categories grouped by main domain.</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--muted-strong)]">
            Start with the broad ecosystem domain, then drill into the existing category and subcategory structure without losing the company-level destination.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Start here when</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">You want the industry table of contents first, then a cleaner path into the directory taxonomy.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Structure</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">Main domains are presentation-only. Categories, subcategories, and companies still use the existing live taxonomy.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Need a direct route?</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">Open any category below to continue into the existing directory and vendor pages.</p>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-12">
          {mainDomains.map((domain) => (
            <GroupCard key={domain.slug} title={domain.name} description={domain.description} rows={domain.categories} />
          ))}
        </section>
      </div>
    </main>
  );
}
