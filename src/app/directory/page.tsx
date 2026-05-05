import Link from "next/link";

import { categories, getMarkdownPageBySlug, vendors } from "@/lib/site-data";

type DirectorySearchParams = {
  q?: string;
  sort?: "vendor_count" | "name";
};

type DirectorySort = NonNullable<DirectorySearchParams["sort"]>;

const sortLabels: Record<DirectorySort, string> = {
  vendor_count: "Most vendors",
  name: "Alphabetical",
};

const sourcingPrompts = [
  {
    question: "Planning a modular AI site?",
    href: "/categories",
    answer: "Start with the full graph, then move through site strategy, modular systems, power, liquid cooling, and monitoring.",
  },
  {
    question: "Retrofitting dense racks?",
    href: "/directory/rack-power-density",
    answer: "Begin with rack power density, then compare adjacent electrical distribution, direct cooling, and heat rejection layers.",
  },
  {
    question: "Building distributed edge capacity?",
    href: "/directory/edge-micro-data-centers",
    answer: "Use edge and micro data centers as the anchor, then branch into enclosures, connectivity, security, and automation.",
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
    <div className="rounded-[1.35rem] border border-[var(--border)] bg-white/72 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
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
  const usageSection = page?.sections.find((section) => section.heading === "How to use this directory");

  const visibleCategories = categories
    .filter((category) => matchesSearch(category, q))
    .filter((category) => {
      const count = categoryVendorCount.get(category.slug) ?? 0;
      return count > 0;
    });

  const sortedCategories = sortCategoryRows(visibleCategories, normalizedSort);
  const totalVendorCount = vendors.length;

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.88)] p-8 shadow-[var(--shadow-soft)] backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Directory</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Supplier discovery organized around real infrastructure decisions.</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            Browse launch categories, explore vendor profiles, and move toward a stronger supplier shortlist with clearer buyer guidance.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatPill label="Active categories" value={String(sortedCategories.length)} />
            <StatPill label="Vendor profiles" value={String(totalVendorCount)} />
            <StatPill label="Top sort" value={normalizedSort === "vendor_count" ? "Most vendors" : "Alphabetical"} />
            <StatPill label="Intent" value="Shortlist faster" />
          </div>
        </div>

        <form method="get" className="mt-8 grid gap-4 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,255,255,0.88)] p-6 shadow-[var(--shadow-card)] backdrop-blur-sm sm:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Search categories
            <input
              name="q"
              defaultValue={q}
              placeholder="modular, cooling, power..."
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

        <section className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,255,255,0.9)] p-6 shadow-[var(--shadow-card)] backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Quick exploration actions</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Need a stronger next move?</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Open the broader category graph, follow a common sourcing path, continue through vendor profiles, or submit your own listing to deepen the map.
          </p>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {sourcingPrompts.map((prompt) => (
              <Link key={prompt.question} href={prompt.href} className="rounded-[1.15rem] border border-[var(--border)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
                <p className="text-sm font-semibold text-[var(--foreground)]">{prompt.question}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{prompt.answer}</p>
              </Link>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/categories" className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white">
              Open category graph
            </Link>
            <Link href="/for-vendors/submit" className="rounded-full bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
              Submit vendor details
            </Link>
            <Link href="/for-vendors/claim" className="rounded-full bg-[#eef2ff] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
              File a claim
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <section className="rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,255,255,0.88)] p-6 shadow-[var(--shadow-card)] backdrop-blur-sm">
              <h2 className="text-xl font-semibold tracking-tight">Featured categories</h2>
              <ul className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                {(featuredCategories?.bullets ?? []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,255,255,0.88)] p-6 shadow-[var(--shadow-card)] backdrop-blur-sm">
              <h2 className="text-xl font-semibold tracking-tight">How to use this directory</h2>
              <ul className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                {(usageSection?.bullets ?? []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
            {sortedCategories.length > 0 ? (
              sortedCategories.map((category) => {
                const count = categoryVendorCount.get(category.slug) ?? 0;
                return (
                  <Link
                    key={category.slug}
                    href={`/directory/${category.slug}`}
                    className="rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,255,255,0.92)] p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_18px_44px_rgba(16,44,60,0.1)] backdrop-blur-sm"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Category</p>
                    <h3 className="mt-3 text-lg font-semibold tracking-tight">{category.name}</h3>
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
          </div>
        </section>
      </div>
    </main>
  );
}
