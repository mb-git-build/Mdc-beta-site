import Link from "next/link";
import { getCategoryLineage } from "@/lib/site-data";
import { getMainDomainRows } from "@/lib/main-domains";

function GroupSection({
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
    <section className="border border-[var(--border)]">
      <div className="border-b border-[var(--border)] px-4 py-4 lg:px-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
          <div className="text-sm text-[var(--muted)]">
            {rows.length} categories · {rows.reduce((sum, row) => sum + row.subcategoryCount, 0)} subcategories · {rows.reduce((sum, row) => sum + row.companyCount, 0)} companies
          </div>
        </div>
      </div>

      <div>
        {rows.map((category, index) => {
          const lineage = getCategoryLineage(category.slug);
          return (
            <Link key={category.slug} href={`/directory/${category.slug}`} className={`block px-4 py-4 transition hover:bg-[var(--card-soft)] lg:px-5 ${index === 0 ? "" : "border-t border-[var(--border)]"}`}>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_240px] lg:items-start">
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-white">{category.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{category.description}</p>
                </div>
                <div className="text-sm text-[var(--muted)]">
                  <div>{category.subcategoryCount} subcategories</div>
                  <div>{category.companyCount} companies</div>
                </div>
                <div className="text-sm text-[var(--muted)]">
                  {lineage.children.length ? lineage.children.slice(0, 4).map((child) => <div key={child.slug}>{child.name}</div>) : <div>No subcategories listed</div>}
                </div>
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
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="max-w-4xl border-b border-[var(--border)] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Categories</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Main domains, categories, and subcategories.</h1>
          <p className="mt-4 text-sm leading-8 text-[var(--muted-strong)]">
            This page teaches the hierarchy of the ecosystem. Use it to move from broad infrastructure domains into categories and subcategories before narrowing into companies.
          </p>
        </section>

        <section className="mt-6 space-y-6">
          {mainDomains.map((domain) => (
            <GroupSection key={domain.slug} title={domain.name} rows={domain.categories} />
          ))}
        </section>
      </div>
    </main>
  );
}
