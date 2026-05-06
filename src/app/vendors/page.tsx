import Link from "next/link";

import { categories, vendors } from "@/lib/site-data";
import { vendorGlyph } from "@/lib/visuals";

type VendorSearchParams = {
  q?: string;
  sort?: "name" | "featured" | "category_count";
};

type VendorSort = NonNullable<VendorSearchParams["sort"]>;

const sortLabels: Record<VendorSort, string> = {
  name: "Name (A-Z)",
  featured: "Featured first",
  category_count: "Most categories",
};

function normalizeSearch(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function matchesSearch(vendorName: string, vendorHeadline: string, vendorCategories: string[], searchTerm: string, extraText = "") {
  if (!searchTerm) {
    return true;
  }

  const categoryNameLookup = vendorCategories
    .map((slug) => categories.find((category) => category.slug === slug)?.name ?? slug)
    .join(" ");

  const haystack = `${vendorName} ${vendorHeadline} ${categoryNameLookup} ${extraText}`.toLowerCase();
  return haystack.includes(searchTerm);
}

function vendorSortOrder(vendorsToSort: typeof vendors, sortBy: VendorSort) {
  const copy = [...vendorsToSort];

  switch (sortBy) {
    case "category_count":
      return copy.sort((a, b) => {
        if (b.categories.length !== a.categories.length) {
          return b.categories.length - a.categories.length;
        }
        return a.name.localeCompare(b.name);
      });
    case "featured":
      return copy.sort((a, b) => {
        const aScore = a.featured ? 1 : 0;
        const bScore = b.featured ? 1 : 0;
        if (bScore !== aScore) {
          return bScore - aScore;
        }
        return a.name.localeCompare(b.name);
      });
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<VendorSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const sort = (resolvedSearchParams?.sort as VendorSort) ?? "featured";
  const normalizedSort: VendorSort = sortLabels[sort] ? sort : "featured";
  const q = normalizeSearch(resolvedSearchParams?.q);

  const filteredVendors = vendors.filter((vendor) =>
    matchesSearch(
      vendor.name,
      vendor.headline,
      vendor.categories,
      q,
      [...(vendor.specialties ?? []), ...(vendor.regions ?? []), ...(vendor.buyer_types ?? []), vendor.project_scale ?? ""].join(" "),
    ),
  );
  const sortedVendors = vendorSortOrder(filteredVendors, normalizedSort);

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-14 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Companies</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Browse infrastructure companies.</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--muted-strong)]">
            Search by company, hosting model, cooling approach, deployment type, or infrastructure category.
          </p>
        </section>

        <form method="get" className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 lg:grid-cols-[1.2fr_0.6fr_auto_auto]">
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Search companies
            <input
              name="q"
              defaultValue={q}
              placeholder="GPU hosting, immersion, modular, bitcoin, colocation..."
              className="rounded-xl border border-[var(--border)] bg-[var(--background-strong)] px-4 py-3 text-sm text-white"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Sort by
            <select name="sort" defaultValue={normalizedSort} className="rounded-xl border border-[var(--border)] bg-[var(--background-strong)] px-4 py-3 text-sm text-white">
              {(Object.entries(sortLabels) as [VendorSort, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid content-end">
            <button type="submit" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#0f141a]">
              Search
            </button>
          </div>
          <div className="grid content-end">
            <Link href="/vendors" className="text-sm font-semibold text-[var(--accent)]">
              Clear filters
            </Link>
          </div>
        </form>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedVendors.length > 0 ? (
            sortedVendors.map((vendor) => (
              <article key={vendor.slug} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--card-soft)] text-sm font-semibold tracking-[0.12em] text-white">
                    {vendorGlyph(vendor.slug)}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-white">{vendor.name}</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">{vendor.verified ? "Verified company" : "Company listing"}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {vendor.categories.slice(0, 4).map((categorySlug) => (
                    <Link
                      key={categorySlug}
                      href={`/directory/${categorySlug}`}
                      className="rounded-full bg-[var(--card-soft)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]"
                    >
                      {categories.find((category) => category.slug === categorySlug)?.name ?? categorySlug}
                    </Link>
                  ))}
                </div>
                <Link href={`/vendors/${vendor.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                  View company
                </Link>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
              No companies match your current filters.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
