import Link from "next/link";

import { categories, vendors } from "@/lib/site-data";
import { vendorGlyph } from "@/lib/visuals";

type VendorSearchParams = {
  q?: string;
  sort?: "name" | "featured" | "category_count";
  focus?: string;
};

type VendorSort = NonNullable<VendorSearchParams["sort"]>;

const sortLabels: Record<VendorSort, string> = {
  name: "Name (A-Z)",
  featured: "Featured first",
  category_count: "Most categories",
};

const vendorFocusLenses = [
  { value: "", label: "All companies" },
  { value: "ai", label: "AI infrastructure" },
  { value: "bitcoin", label: "Bitcoin / mining" },
  { value: "power", label: "Power systems" },
  { value: "cooling", label: "Cooling" },
  { value: "colo", label: "Colocation / hosting" },
  { value: "modular", label: "Modular / prefab" },
  { value: "regional", label: "Regional / niche" },
] as const;

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

function matchesFocusLens(vendor: (typeof vendors)[number], focus: string) {
  if (!focus) {
    return true;
  }

  switch (focus) {
    case "ai":
      return vendor.focus_areas?.includes("ai") ?? false;
    case "bitcoin":
      return vendor.focus_areas?.includes("bitcoin") ?? false;
    case "power":
      return vendor.infrastructure_types?.includes("power") ?? false;
    case "cooling":
      return vendor.infrastructure_types?.includes("cooling") ?? false;
    case "colo":
      return vendor.categories.includes("ai-colocation-gpu-hosting");
    case "modular":
      return vendor.categories.includes("modular-prefab") || vendor.categories.includes("fabricated-enclosures-and-shells");
    case "regional":
      return vendor.company_types?.includes("regional_provider") || vendor.scale_focus?.includes("regional");
    default:
      return true;
  }
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
  const focus = resolvedSearchParams?.focus ?? "";

  const filteredVendors = vendors.filter((vendor) =>
    matchesSearch(
      vendor.name,
      vendor.headline,
      vendor.categories,
      q,
      [...(vendor.specialties ?? []), ...(vendor.regions ?? []), ...(vendor.buyer_types ?? []), vendor.project_scale ?? ""].join(" "),
    ) && matchesFocusLens(vendor, focus),
  );
  const sortedVendors = vendorSortOrder(filteredVendors, normalizedSort);

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="border-b border-[var(--border)] pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Companies</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Browse infrastructure companies.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[var(--muted-strong)]">
            Search by company, infrastructure lane, deployment context, or category relationship, then move into vendor profiles for deeper research.
          </p>
        </section>

        <form method="get" className="mt-6 grid gap-3 border border-[var(--border)] bg-[var(--card)] p-4 lg:grid-cols-[1.2fr_0.45fr_0.55fr_auto] lg:items-end">
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Search companies
            <input
              name="q"
              defaultValue={q}
              placeholder="GPU hosting, immersion, modular, bitcoin, colocation..."
              className="border border-[var(--border)] bg-[var(--background-strong)] px-4 py-3 text-sm text-white"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Sort
            <select name="sort" defaultValue={normalizedSort} className="border border-[var(--border)] bg-[var(--background-strong)] px-4 py-3 text-sm text-white">
              {(Object.entries(sortLabels) as [VendorSort, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Focus
            <select name="focus" defaultValue={focus} className="border border-[var(--border)] bg-[var(--background-strong)] px-4 py-3 text-sm text-white">
              {vendorFocusLenses.map((lens) => (
                <option key={lens.label} value={lens.value}>
                  {lens.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-3">
            <button type="submit" className="border border-[var(--border-strong)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--card-soft)]">
              Search
            </button>
            <Link href="/vendors" className="px-2 py-3 text-sm text-[var(--muted-strong)] transition hover:text-white">
              Clear
            </Link>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
          {vendorFocusLenses.map((lens) => {
            const active = focus === lens.value;
            const href = lens.value ? `/vendors?focus=${encodeURIComponent(lens.value)}` : "/vendors";
            return (
              <Link
                key={lens.label}
                href={href}
                className={`border px-3 py-2 text-sm transition ${active ? "border-[var(--border-strong)] bg-[var(--card-soft)] text-white" : "border-[var(--border)] text-[var(--muted-strong)] hover:border-[var(--border-strong)] hover:text-white"}`}
              >
                {lens.label}
              </Link>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-[var(--muted)]">Showing {sortedVendors.length} companies{focus ? ` for ${vendorFocusLenses.find((lens) => lens.value === focus)?.label ?? focus}` : ""}.</p>

        <section className="mt-4 border border-[var(--border)]">
          {sortedVendors.length > 0 ? (
            sortedVendors.map((vendor, index) => (
              <article key={vendor.slug} className={`px-4 py-4 lg:px-5 ${index === 0 ? "" : "border-t border-[var(--border)]"}`}>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)_220px] lg:items-start">
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center border border-[var(--border)] bg-[var(--card-soft)] text-sm font-semibold tracking-[0.12em] text-white">
                        {vendorGlyph(vendor.slug)}
                      </div>
                      <div>
                        <h2 className="text-base font-semibold tracking-tight text-white">{vendor.name}</h2>
                        <p className="mt-1 text-sm text-[var(--muted)]">{vendor.verified ? "Verified company" : "Company listing"}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{vendor.headline}</p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {vendor.categories.slice(0, 4).map((categorySlug) => (
                        <Link
                          key={categorySlug}
                          href={`/directory/${categorySlug}`}
                          className="border border-[var(--border)] px-2.5 py-1 text-[var(--muted-strong)] transition hover:border-[var(--border-strong)] hover:text-white"
                        >
                          {categories.find((category) => category.slug === categorySlug)?.name ?? categorySlug}
                        </Link>
                      ))}
                    </div>
                    {(vendor.project_scale || vendor.service_area || vendor.focus_areas?.length) ? (
                      <div className="mt-3 space-y-1 text-sm text-[var(--muted)]">
                        {vendor.project_scale ? <div>Scale: {vendor.project_scale}</div> : null}
                        {vendor.service_area ? <div>Coverage: {vendor.service_area}</div> : null}
                        {vendor.focus_areas?.length ? <div>Focus: {vendor.focus_areas.join(" / ")}</div> : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <Link href={`/vendors/${vendor.slug}`} className="text-sm font-semibold text-white underline-offset-4 hover:underline">
                      View company
                    </Link>
                    {vendor.related_company_slugs?.[0] ? <div className="text-xs text-[var(--muted)]">Related graph links included</div> : null}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-[var(--muted)]">No companies match your current filters.</div>
          )}
        </section>
      </div>
    </main>
  );
}
