import Link from "next/link";
import { getCategoryLineage } from "@/lib/site-data";
import { getMainDomainRows } from "@/lib/main-domains";

function GroupCard({
  title,
  rows,
}: {
  title: string;
  rows: ReturnType<typeof getMainDomainRows>[number]["categories"];
}) {
  if (!rows.length) {
    return null;
  }

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <div className="text-sm text-[var(--muted-strong)]">
          {rows.length} categories · {rows.reduce((sum, row) => sum + row.subcategoryCount, 0)} subcategories · {rows.reduce((sum, row) => sum + row.companyCount, 0)} companies
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((category) => {
          const lineage = getCategoryLineage(category.slug);

          return (
            <Link key={category.slug} href={`/directory/${category.slug}`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold tracking-tight text-white">{category.name}</h3>
                <span className="text-xs text-[var(--muted)]">{category.companyCount}</span>
              </div>
              <div className="mt-3 text-sm text-[var(--muted-strong)]">
                <span>{category.subcategoryCount} subcategories</span>
                <span className="mx-2 text-[var(--muted)]">·</span>
                <span>{category.companyCount} companies</span>
              </div>
              {lineage.children.length ? (
                <div className="mt-4 space-y-1 text-sm text-[var(--muted)]">
                  {lineage.children.slice(0, 4).map((child) => (
                    <div key={child.slug}>{child.name}</div>
                  ))}
                </div>
              ) : null}
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
    <main className="min-h-screen bg-[var(--background)] px-5 py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Categories</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Main domains → categories → subcategories.</h1>
        </section>

        <section className="mt-10 space-y-10">
          {mainDomains.map((domain) => (
            <GroupCard key={domain.slug} title={domain.name} rows={domain.categories} />
          ))}
        </section>
      </div>
    </main>
  );
}
