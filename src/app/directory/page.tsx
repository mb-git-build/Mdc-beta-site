import Link from "next/link";

import { categories, getCategoryLineage, getMarkdownPageBySlug, vendors } from "@/lib/site-data";

type DirectorySearchParams = {
  q?: string;
  sort?: "vendor_count" | "name";
};

type DirectorySort = NonNullable<DirectorySearchParams["sort"]>;

const sortLabels: Record<DirectorySort, string> = {
  vendor_count: "Most vendors",
  name: "Alphabetical",
};

const quickStarts = [
  {
    label: "Modular & prefab",
    href: "/directory/modular-prefab",
  },
  {
    label: "Power & electrical",
    href: "/directory/power-and-electrical",
  },
  {
    label: "Liquid cooling",
    href: "/directory/liquid-cooling",
  },
  {
    label: "DCIM & monitoring",
    href: "/directory/dcim-and-monitoring",
  },
];

function normalizeSearch(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

const categoryVendorCount = new Map(
  categories.map((category) => [
    category.slug,
    vendors.filter((vendor) => vendor.categories.includes(category.slug)).length,
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
        const bCount = categoryVendorCount.get(b.slug) ?? 0;
        const aCount = categoryVendorCount.get(a.slug) ?? 0;
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

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--border)] bg-[#f8fbfd] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
    </div>
  );
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

  const page = getMarkdownPageBySlug("/vendors");
  const featuredCategories = page?.sections.find((section) => section.heading === "Featured categories");

  const visibleCategories = categories
    .filter((category) => matchesSearch(category, q))
    .filter((category) => {
      const count = categoryVendorCount.get(category.slug) ?? 0;
      return count > 0;
    });

  const sortedCategories = sortCategoryRows(visibleCategories, normalizedSort);
  const totalVendorCount = vendors.length;

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Directory</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">A straightforward directory for categories and vendors.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Use the directory as a market map: start with a category, follow adjacent infrastructure layers, and move into vendor profiles with more context than a flat list provides.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            <StatPill label="Visible categories" value={String(sortedCategories.length)} />
            <StatPill label="Vendor profiles" value={String(totalVendorCount)} />
            <StatPill label="Sort" value={sortLabels[normalizedSort]} />
            <StatPill label="Use" value="Browse faster" />
          </div>
        </section>

        <form method="get" className="mt-8 grid gap-4 rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)] sm:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Search categories
            <input
              name="q"
              defaultValue={q}
              placeholder="cooling, power, modular..."
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Sort by
            <select name="sort" defaultValue={normalizedSort} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
              {(Object.entries(sortLabels) as [DirectorySort, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid content-end gap-2">
            <button type="submit" className="rounded-full bg-[var(--accent-strong)] px-4 py-3 text-sm font-semibold text-white">
              Update view
            </button>
            <Link href="/directory" className="text-sm text-[var(--accent)]">
              Clear filters
            </Link>
          </div>
        </form>

        <section className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Quick starts</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Popular places to begin</h2>
            </div>
            <Link href="/vendors" className="text-sm font-semibold text-[var(--accent)]">
              Or skip to vendors
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {quickStarts.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full border border-[var(--border)] bg-[#f8fbfd] px-4 py-2 text-sm font-medium transition hover:border-[var(--accent)]">
                {item.label}
              </Link>
            ))}
          </div>
          {featuredCategories?.bullets?.length ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {featuredCategories.bullets.slice(0, 4).map((item) => (
                <div key={item} className="rounded-[1rem] border border-[var(--border)] bg-[#fbfcfd] p-4 text-sm leading-6 text-[var(--muted)]">
                  {item}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedCategories.length > 0 ? (
            sortedCategories.map((category) => {
              const count = categoryVendorCount.get(category.slug) ?? 0;
              const lineage = getCategoryLineage(category.slug);
              return (
                <Link
                  key={category.slug}
                  href={`/directory/${category.slug}`}
                  className="rounded-[1.35rem] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    <span>{category.layer === "subcategory" ? "Subcategory" : "Category"}</span>
                    {lineage.parent ? <span>• {lineage.parent.name}</span> : null}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight">{category.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
                  <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">{count} vendor profiles</p>
                </Link>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">
              No categories match your filter.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
