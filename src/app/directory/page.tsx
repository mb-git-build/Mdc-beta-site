import Link from "next/link";

import { categories, getCategoryLineage, vendors } from "@/lib/site-data";

export const dynamic = "force-dynamic";

type DirectorySearchParams = {
  q?: string;
  sort?: "vendor_count" | "name";
};

type DirectorySort = NonNullable<DirectorySearchParams["sort"]>;

const sortLabels: Record<DirectorySort, string> = {
  vendor_count: "Most companies",
  name: "Alphabetical",
};

function normalizeSearch(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

const categoryCompanyCount = new Map(
  categories.map((category) => [
    category.slug,
    category.layer === "subcategory"
      ? vendors.filter((vendor) => vendor.subcategories?.includes(category.slug)).length
      : vendors.filter((vendor) => vendor.categories.includes(category.slug)).length,
  ]),
);

function sortCategoryRows(rows: typeof categories, sortBy: DirectorySort) {
  const copy = [...rows];

  switch (sortBy) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "vendor_count":
    default:
      return copy.sort((a, b) => {
        const bCount = categoryCompanyCount.get(b.slug) ?? 0;
        const aCount = categoryCompanyCount.get(a.slug) ?? 0;
        if (bCount !== aCount) {
          return bCount - aCount;
        }
        return a.name.localeCompare(b.name);
      });
  }
}

function matchesSearch(category: { name: string; description: string }, term: string) {
  if (!term) {
    return true;
  }

  return `${category.name} ${category.description}`.toLowerCase().includes(term);
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = normalizeSearch(resolvedSearchParams?.q);
  const sort = (resolvedSearchParams?.sort as DirectorySort) ?? "vendor_count";
  const normalizedSort: DirectorySort = sortLabels[sort] ? sort : "vendor_count";

  const visibleCategories = categories
    .filter((category) => matchesSearch(category, q))
    .filter((category) => {
      const count = categoryCompanyCount.get(category.slug) ?? 0;
      return count > 0;
    });

  const sortedCategories = sortCategoryRows(visibleCategories, normalizedSort);

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="border-b border-[var(--border)] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Directory</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Browse the category graph.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--muted-strong)]">
            The directory is the canonical browse and search surface for the MDC ecosystem. Search broadly, scan the category inventory, and move from infrastructure lane to deeper graph research.
          </p>
        </section>

        <form method="get" className="mt-6 grid gap-3 border border-[var(--border)] bg-[var(--card)] p-4 lg:grid-cols-[1.2fr_0.45fr_auto] lg:items-end">
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Search categories
            <input
              name="q"
              defaultValue={q}
              placeholder="power, cooling, modular, commissioning, hosting..."
              className="border border-[var(--border)] bg-[var(--background-strong)] px-4 py-3 text-sm text-white"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Sort
            <select name="sort" defaultValue={normalizedSort} className="border border-[var(--border)] bg-[var(--background-strong)] px-4 py-3 text-sm text-white">
              {(Object.entries(sortLabels) as [DirectorySort, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-3">
            <button type="submit" className="border border-[var(--border-strong)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--card-soft)]">
              Search
            </button>
            <Link href="/directory" className="px-2 py-3 text-sm text-[var(--muted-strong)] transition hover:text-white">
              Clear
            </Link>
          </div>
        </form>

        <div className="mt-4 text-sm text-[var(--muted)]">
          {sortedCategories.length} visible categories{q ? ` for “${q}”` : ""}.
        </div>

        <section className="mt-4 border border-[var(--border)]">
          {sortedCategories.length > 0 ? (
            sortedCategories.map((category, index) => {
              const count = categoryCompanyCount.get(category.slug) ?? 0;
              const lineage = getCategoryLineage(category.slug);
              return (
                <Link
                  key={category.slug}
                  href={`/directory/${category.slug}`}
                  className={`block px-4 py-4 transition hover:bg-[var(--card-soft)] lg:px-5 ${index === 0 ? "" : "border-t border-[var(--border)]"}`}
                >
                  <div className="grid gap-3 lg:grid-cols-[120px_minmax(0,1fr)_140px_220px] lg:items-start">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {category.layer === "subcategory" ? "Subcategory" : "Category"}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-white">{category.name}</h2>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{category.description}</p>
                    </div>
                    <div className="text-sm text-[var(--muted)]">{count} companies</div>
                    <div className="text-sm text-[var(--muted)]">
                      {lineage.parent ? lineage.parent.name : "Top-level category"}
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="px-4 py-6 text-sm text-[var(--muted)]">No categories match your filter.</div>
          )}
        </section>
      </div>
    </main>
  );
}
