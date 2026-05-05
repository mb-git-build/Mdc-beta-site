import Link from "next/link";

import { categories, getMarkdownPageBySlug, vendors } from "@/lib/site-data";
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

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-[var(--border)] bg-white/72 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<VendorSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const sort = (resolvedSearchParams?.sort as VendorSort) ?? "name";
  const normalizedSort: VendorSort = sortLabels[sort] ? sort : "name";
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
  const featuredPage = getMarkdownPageBySlug("/vendors");

  const featuredCount = sortedVendors.filter((vendor) => vendor.featured).length;
  const verifiedCount = sortedVendors.filter((vendor) => vendor.verified).length;

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.86)] p-8 shadow-[var(--shadow-soft)] backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Vendors</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{featuredPage?.title ?? "Vendors"}</h1>
          {featuredPage?.intro.map((paragraph) => (
            <p key={paragraph} className="mt-5 max-w-3xl text-sm leading-8 text-[var(--muted)]">
              {paragraph}
            </p>
          ))}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StatChip label="Visible vendors" value={String(sortedVendors.length)} />
            <StatChip label="Featured" value={String(featuredCount)} />
            <StatChip label="Verified" value={String(verifiedCount)} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <form method="get" className="grid gap-4 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,255,255,0.88)] p-6 shadow-[var(--shadow-card)] backdrop-blur-sm sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
                Search vendors
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="name, headline, category"
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
                Sort by
                <select name="sort" defaultValue={normalizedSort} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
                  {(Object.entries(sortLabels) as [VendorSort, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-full bg-[var(--accent-strong)] px-4 py-3 text-sm font-semibold text-white"
              >
                Update view
              </button>
              <Link href="/vendors" className="inline-flex items-center text-sm text-[var(--accent)]">
                Clear filters
              </Link>
            </form>

            <section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
              <h2 className="text-xl font-semibold tracking-tight">Featured categories</h2>
              <ul className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                {(featuredPage?.sections.find((section) => section.heading === "Featured categories")?.bullets ?? []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
              <h2 className="text-xl font-semibold tracking-tight">How to use this directory</h2>
              <ul className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                {(featuredPage?.sections.find((section) => section.heading === "How to use this directory")?.bullets ?? []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="grid gap-5 md:grid-cols-2">
            {sortedVendors.length > 0 ? (
              sortedVendors.map((vendor) => {
                const tone = slugToAccent(vendorPrimaryCategory(vendor.categories));
                return (
                  <article key={vendor.slug} className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,255,255,0.92)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_18px_44px_rgba(16,44,60,0.1)] backdrop-blur-sm">
                    <div className="p-6 text-white" style={{ background: tone.gradient }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg font-semibold tracking-[0.12em]">
                            {vendorGlyph(vendor.slug)}
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold tracking-tight">{vendor.name}</h2>
                            <p className="mt-2 text-sm text-white/80">{vendor.verified ? "Verified listing" : "Profile under review"}</p>
                          </div>
                        </div>
                        <a href={vendor.website_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-white/90">
                          Visit
                        </a>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {vendor.categories.map((categorySlug) => (
                          <Link
                            key={categorySlug}
                            href={`/directory/${categorySlug}`}
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={{ background: tone.chip, color: "#143446" }}
                          >
                            {categories.find((category) => category.slug === categorySlug)?.name ?? categorySlug}
                          </Link>
                        ))}
                      </div>
                      <div className="mt-4 grid gap-2 text-[11px] text-[var(--muted)]">
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
                        {vendor.service_area ? (
                          <p>
                            <span className="font-semibold text-[var(--foreground)]">Service area:</span> {vendor.service_area}
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(vendor.buyer_types ?? []).slice(0, 2).map((buyerType) => (
                          <span key={buyerType} className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-medium text-[var(--foreground)]">
                            {buyerType}
                          </span>
                        ))}
                      </div>
                      <Link href={`/vendors/${vendor.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                        View profile
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">
                No vendors match your current filters.
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
