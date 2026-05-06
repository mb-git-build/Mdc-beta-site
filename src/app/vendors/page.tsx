import Link from "next/link";

import { categories, vendors } from "@/lib/site-data";
import { slugToAccent, vendorGlyph, vendorPrimaryCategory } from "@/lib/visuals";

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
    <main className="min-h-screen bg-[var(--background)] px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--hero-panel)] p-8 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Companies</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Curated infrastructure companies, designed for fast scanning.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted-strong)]">
            Browse modern cards instead of heavy tables. Search by company, hosting model, cooling system, deployment type, or infrastructure category.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatChip label="Visible companies" value={String(sortedVendors.length)} />
            <StatChip label="Featured" value={String(sortedVendors.filter((vendor) => vendor.featured).length)} />
            <StatChip label="Verified" value={String(sortedVendors.filter((vendor) => vendor.verified).length)} />
          </div>
        </section>

        <form method="get" className="grid gap-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] lg:grid-cols-[1.2fr_0.6fr_auto_auto]">
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Search companies
            <input
              name="q"
              defaultValue={q}
              placeholder="GPU hosting, immersion, modular, bitcoin, colocation..."
              className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-white"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Sort by
            <select name="sort" defaultValue={normalizedSort} className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-white">
              {(Object.entries(sortLabels) as [VendorSort, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid content-end">
            <button type="submit" className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#071017]">
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
            sortedVendors.map((vendor) => {
              const tone = slugToAccent(vendorPrimaryCategory(vendor.categories));
              return (
                <article key={vendor.slug} className="overflow-hidden rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-[var(--accent)]">
                  <div className="p-5" style={{ background: tone.gradient }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sm font-semibold tracking-[0.16em] text-white">
                          {vendorGlyph(vendor.slug)}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold tracking-tight text-white">{vendor.name}</h2>
                          <p className="mt-1 text-sm text-white/80">{vendor.verified ? "Verified listing" : "Curated company card"}</p>
                        </div>
                      </div>
                      <a href={vendor.website_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-white/90">
                        Visit
                      </a>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {vendor.categories.slice(0, 4).map((categorySlug) => (
                        <Link
                          key={categorySlug}
                          href={`/directory/${categorySlug}`}
                          className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]"
                        >
                          {categories.find((category) => category.slug === categorySlug)?.name ?? categorySlug}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 grid gap-2 text-[12px] text-[var(--muted)]">
                      {vendor.specialties?.length ? (
                        <p>
                          <span className="font-semibold text-[var(--foreground)]">Specialties:</span> {vendor.specialties.slice(0, 3).join(" • ")}
                        </p>
                      ) : null}
                      {vendor.project_scale ? (
                        <p>
                          <span className="font-semibold text-[var(--foreground)]">Scale:</span> {vendor.project_scale}
                        </p>
                      ) : null}
                    </div>
                    <Link href={`/vendors/${vendor.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                      View company
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
              No companies match your current filters.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
