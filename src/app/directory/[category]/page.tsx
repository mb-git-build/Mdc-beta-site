import Image from "next/image";
import Link from "next/link";
import { categories, getCategory, getCategoryLineage, getChildCategories, getVendorsForCategory, vendors } from "@/lib/site-data";
import { vendorGlyph } from "@/lib/visuals";

function getCompanyInventory(categorySlug: string) {
  const childSlugs = getChildCategories(categorySlug).map((child) => child.slug);
  const scope = [categorySlug, ...childSlugs];

  return vendors.filter((vendor) => vendor.categories.some((slug) => scope.includes(slug)));
}

function rankCompanies(items: typeof vendors) {
  return [...items].sort((a, b) => {
    const aFeatured = a.featured ? 1 : 0;
    const bFeatured = b.featured ? 1 : 0;

    if (bFeatured !== aFeatured) {
      return bFeatured - aFeatured;
    }

    const aVerified = a.verified ? 1 : 0;
    const bVerified = b.verified ? 1 : 0;

    if (bVerified !== aVerified) {
      return bVerified - aVerified;
    }

    return a.name.localeCompare(b.name);
  });
}

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = getCategory(categorySlug);

  if (!category) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Not found</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">This category does not exist yet.</h1>
        </div>
      </main>
    );
  }

  const lineage = getCategoryLineage(category.slug);
  const isSubcategory = Boolean(category.parent_slug);

  const childCategories = lineage.children.map((child) => ({
    ...child,
    vendorCount: getVendorsForCategory(child.slug).length,
    representativeCompanies: rankCompanies(getVendorsForCategory(child.slug)).slice(0, 4),
  }));

  const siblingCategories = lineage.parent
    ? getCategoryLineage(lineage.parent.slug).children
        .filter((child) => child.slug !== category.slug)
        .map((child) => ({
          ...child,
          vendorCount: getVendorsForCategory(child.slug).length,
        }))
        .sort((a, b) => b.vendorCount - a.vendorCount || a.name.localeCompare(b.name))
    : [];

  const categoryCompanies = isSubcategory ? rankCompanies(getVendorsForCategory(category.slug)) : rankCompanies(getCompanyInventory(category.slug));
  const representativeCompanies = categoryCompanies.slice(0, 6);
  const remainingCompanies = categoryCompanies.slice(6);

  if (!isSubcategory) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Main category</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{category.name}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">{category.description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Subcategories</p>
                <p className="mt-2 text-lg font-semibold text-white">{childCategories.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Companies</p>
                <p className="mt-2 text-lg font-semibold text-white">{categoryCompanies.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Direct listings</p>
                <p className="mt-2 text-lg font-semibold text-white">{getVendorsForCategory(category.slug).length}</p>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)]">
            <form action="/vendors" method="get" className="flex flex-col gap-3 lg:flex-row">
              <input
                name="q"
                defaultValue={category.name}
                placeholder={`Search companies in ${category.name}...`}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-strong)] px-5 py-4 text-base text-white outline-none placeholder:text-[#7f8b99]"
              />
              <button type="submit" className="rounded-xl bg-white px-6 py-4 text-sm font-semibold text-[#0f141a]">
                Search companies
              </button>
            </form>
          </section>

          <section className="mt-8 rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Subcategories</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Browse inventory within {category.name}.</h2>
              </div>
            </div>

            {childCategories.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {childCategories.map((child) => (
                  <Link key={child.slug} href={`/directory/${child.slug}`} className="rounded-2xl border border-[var(--border-strong)] bg-[#1a2129] p-5 transition hover:border-[#5e7285]">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base font-semibold tracking-tight text-white">{child.name}</h3>
                      <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">{child.vendorCount}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{child.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                      {child.representativeCompanies.map((company) => (
                        <span key={company.slug} className="rounded-full bg-white/8 px-2.5 py-1">
                          {company.name}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border)] bg-[#1a2129] p-6 text-sm text-[var(--muted)]">
                No subcategories are listed under this category yet.
              </div>
            )}
          </section>

          <section className="mt-8 rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Representative companies</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Representative companies in {category.name}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {representativeCompanies.length ? (
                representativeCompanies.map((vendor) => (
                  <article key={vendor.slug} className="rounded-2xl border border-[var(--border-strong)] bg-[#1a2129] p-5 transition hover:border-[#5e7285]">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white text-sm font-semibold tracking-[0.12em] text-[#0f141a]">
                        {vendor.logo_url ? (
                          <Image src={vendor.logo_url} alt={`${vendor.name} logo`} width={48} height={48} className="h-full w-full object-contain p-1.5" unoptimized />
                        ) : (
                          vendorGlyph(vendor.slug)
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold tracking-tight text-white">{vendor.name}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">{vendor.verified ? "Verified company" : "Company listing"}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">{vendor.headline}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <Link href={`/vendors/${vendor.slug}`} className="text-sm font-semibold text-[var(--accent)]">View company</Link>
                      <a href={vendor.website_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white/85">
                        Visit
                      </a>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] bg-[#1a2129] p-6 text-sm text-[var(--muted)]">
                  No companies are currently listed in this category yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link href={lineage.parent ? `/directory/${lineage.parent.slug}` : "/categories"} className="text-sm font-semibold text-[var(--accent)]">
            {lineage.parent ? `← ${lineage.parent.name}` : "← Categories"}
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Subcategory</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{category.name}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">{category.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Parent</p>
              <p className="mt-2 text-sm font-semibold text-white">{lineage.parent?.name ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Companies</p>
              <p className="mt-2 text-lg font-semibold text-white">{categoryCompanies.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Sibling subcategories</p>
              <p className="mt-2 text-lg font-semibold text-white">{siblingCategories.length}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)]">
          <form action="/vendors" method="get" className="flex flex-col gap-3 lg:flex-row">
            <input
              name="q"
              defaultValue={category.name}
              placeholder={`Search companies in ${category.name}...`}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-strong)] px-5 py-4 text-base text-white outline-none placeholder:text-[#7f8b99]"
            />
            <button type="submit" className="rounded-xl bg-white px-6 py-4 text-sm font-semibold text-[#0f141a]">
              Search companies
            </button>
          </form>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Companies</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Companies in {category.name}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {categoryCompanies.length ? (
                [...representativeCompanies, ...remainingCompanies].map((vendor) => (
                  <article key={vendor.slug} className="rounded-2xl border border-[var(--border-strong)] bg-[#1a2129] p-5 transition hover:border-[#5e7285]">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white text-sm font-semibold tracking-[0.12em] text-[#0f141a]">
                        {vendor.logo_url ? (
                          <Image src={vendor.logo_url} alt={`${vendor.name} logo`} width={44} height={44} className="h-full w-full object-contain p-1.5" unoptimized />
                        ) : (
                          vendorGlyph(vendor.slug)
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold tracking-tight text-white">{vendor.name}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">{vendor.verified ? "Verified company" : "Company listing"}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">{vendor.headline}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <Link href={`/vendors/${vendor.slug}`} className="text-sm font-semibold text-[var(--accent)]">View company</Link>
                      <a href={vendor.website_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white/85">
                        Visit
                      </a>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] bg-[#1a2129] p-6 text-sm text-[var(--muted)]">
                  No companies are currently listed in this subcategory yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {lineage.parent ? (
              <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Parent category</p>
                <div className="mt-4 grid gap-3">
                  <Link href={`/directory/${lineage.parent.slug}`} className="rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 transition hover:border-[#5e7285]">
                    <h3 className="text-sm font-semibold text-white">{lineage.parent.name}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">Return to the main category</p>
                  </Link>
                </div>
              </section>
            ) : null}

            {siblingCategories.length ? (
              <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Sibling subcategories</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {siblingCategories.map((sibling) => (
                    <Link key={sibling.slug} href={`/directory/${sibling.slug}`} className="rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 transition hover:border-[#5e7285]">
                      <h3 className="text-sm font-semibold text-white">{sibling.name}</h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">{sibling.vendorCount} companies</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
