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

const sourcingPathways = [
  {
    title: "Power systems",
    description: "Prefabricated electrical rooms, microgrids, transfer systems, and energization partners.",
    href: "/vendors?focus=power&sort=category_count",
  },
  {
    title: "Cooling",
    description: "Liquid, immersion, thermal rejection, and control-layer companies for high-density deployments.",
    href: "/vendors?focus=cooling&sort=category_count",
  },
  {
    title: "Modular deployment",
    description: "Packaged deployment, shells, logistics, and field integration companies for fast infrastructure delivery.",
    href: "/vendors?focus=modular&sort=category_count",
  },
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
    <main className="min-h-screen bg-[var(--background)] px-5 py-14 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Companies</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Browse infrastructure companies.</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--muted-strong)]">
            Search by company, hosting model, cooling approach, deployment type, or infrastructure category.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Best when</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">You already know the type of company or deployment path you want to compare.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Next move</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">Open company profiles, then follow category tags to widen the shortlist intelligently.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Need broader context?</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">Start from categories or the market map if the architecture path is still fuzzy.</p>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {vendorFocusLenses.map((lens) => {
            const active = focus === lens.value;
            const href = lens.value ? `/vendors?focus=${encodeURIComponent(lens.value)}` : "/vendors";
            return (
              <Link
                key={lens.label}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-white text-[#0f141a]" : "border border-[var(--border)] bg-[var(--card)] text-[var(--muted-strong)] hover:border-[var(--accent)] hover:text-white"}`}
              >
                {lens.label}
              </Link>
            );
          })}
        </div>

        <form method="get" className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 lg:grid-cols-[1.2fr_0.6fr_0.7fr_auto_auto]">
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
          <label className="grid gap-2 text-sm font-medium text-[var(--muted-strong)]">
            Focus lens
            <select name="focus" defaultValue={focus} className="rounded-xl border border-[var(--border)] bg-[var(--background-strong)] px-4 py-3 text-sm text-white">
              {vendorFocusLenses.map((lens) => (
                <option key={lens.label} value={lens.value}>
                  {lens.label}
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

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Shortlist workflow</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Use company pages as decision nodes, not just profile pages.</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/categories" className="rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-4 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:text-white">
                Start with categories
              </Link>
              <Link href="/directory" className="rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-4 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:text-white">
                Open market map
              </Link>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-strong)] p-4 text-sm leading-7 text-[var(--muted-strong)]">
              1. Search for a company, capability, or infrastructure segment.
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-strong)] p-4 text-sm leading-7 text-[var(--muted-strong)]">
              2. Open profiles and follow category tags to see where each vendor actually fits.
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-strong)] p-4 text-sm leading-7 text-[var(--muted-strong)]">
              3. Move back into category pages and guides before finalizing outreach.
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {sourcingPathways.map((pathway) => (
              <Link
                key={pathway.title}
                href={pathway.href}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background-strong)] p-4 transition hover:border-[var(--accent)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Pathway</p>
                <h3 className="mt-2 text-base font-semibold tracking-tight text-white">{pathway.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">{pathway.description}</p>
              </Link>
            ))}
          </div>

        </section>

        <p className="text-sm text-[var(--muted)]">Showing {sortedVendors.length} company{sortedVendors.length === 1 ? "" : "ies"}{focus ? ` for ${vendorFocusLenses.find((lens) => lens.value === focus)?.label ?? focus}` : ""}.</p>

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

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {vendor.project_scale ? (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-3 py-1 text-[var(--muted-strong)]">
                      Scale: {vendor.project_scale}
                    </span>
                  ) : null}
                  {vendor.service_area ? (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-3 py-1 text-[var(--muted-strong)]">
                      Coverage: {vendor.service_area}
                    </span>
                  ) : null}
                  {vendor.focus_areas?.length ? (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-3 py-1 text-[var(--muted-strong)]">
                      Focus: {vendor.focus_areas.join(" / ")}
                    </span>
                  ) : null}
                </div>

                {vendor.specialties?.length ? (
                  <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--background-strong)] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Why this result matters</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">
                      {vendor.specialties.slice(0, 3).join(" · ")}
                    </p>
                  </div>
                ) : null}

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
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link href={`/vendors/${vendor.slug}`} className="inline-flex text-sm font-semibold text-[var(--accent)]">
                    View company
                  </Link>
                  {vendor.related_company_slugs?.[0] ? (
                    <span className="text-xs text-[var(--muted)]">Related graph links included in profile</span>
                  ) : null}
                </div>
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
