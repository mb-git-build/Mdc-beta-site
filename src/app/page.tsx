import Link from "next/link";
import { categories, getChildCategories, getVendorsForCategory, vendors } from "@/lib/site-data";

function getMainCategories() {
  return categories.filter((category) => !category.parent_slug);
}

function getCategoryCompanySet(categorySlug: string) {
  const childSlugs = getChildCategories(categorySlug).map((child) => child.slug);
  const slugs = [categorySlug, ...childSlugs];
  return vendors.filter((vendor) => vendor.categories.some((slug) => slugs.includes(slug)));
}

export default function Home() {
  const mainCategories = getMainCategories();
  const subcategoryCount = categories.filter((category) => category.parent_slug).length;
  const verifiedCompanyCount = vendors.filter((vendor) => vendor.verified).length;

  const categoryRows = mainCategories
    .map((category) => {
      const subcategories = getChildCategories(category.slug);
      const categoryCompanies = getCategoryCompanySet(category.slug);
      const representativeCompanies = categoryCompanies.slice(0, 5);

      return {
        ...category,
        subcategoryCount: subcategories.length,
        companyCount: categoryCompanies.length,
        representativeCompanies,
      };
    })
    .sort((a, b) => {
      if (b.companyCount !== a.companyCount) {
        return b.companyCount - a.companyCount;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section>
        <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-18">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Industry directory</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Explore the market across categories, subcategories, and companies.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">
              Browse the modular and AI data center supply ecosystem through its category structure and company inventory.
            </p>
          </div>

          <div className="mt-10 max-w-5xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)]">
            <form action="/vendors" method="get" className="flex flex-col gap-3 lg:flex-row">
              <input
                name="q"
                placeholder="Search categories, subcategories, and companies..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-strong)] px-5 py-4 text-base text-white outline-none placeholder:text-[#7f8b99]"
              />
              <button type="submit" className="rounded-xl bg-white px-6 py-4 text-sm font-semibold text-[#0f141a]">
                Search directory
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Market coverage</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">A simple index of the directory.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Main categories</p>
              <p className="mt-2 text-2xl font-semibold text-white">{mainCategories.length}</p>
            </article>
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Subcategories</p>
              <p className="mt-2 text-2xl font-semibold text-white">{subcategoryCount}</p>
            </article>
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Companies</p>
              <p className="mt-2 text-2xl font-semibold text-white">{vendors.length}</p>
            </article>
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Verified companies</p>
              <p className="mt-2 text-2xl font-semibold text-white">{verifiedCompanyCount}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Main categories</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Browse the market by category.</h2>
          </div>
          <Link href="/categories" className="text-sm font-semibold text-[var(--accent)]">View all</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoryRows.map((category) => (
            <Link key={category.slug} href={`/directory/${category.slug}`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold tracking-tight text-white">{category.name}</h3>
                <span className="rounded-full bg-[var(--card-soft)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                  {category.companyCount} companies
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                <span>{category.subcategoryCount} subcategories</span>
                <span>•</span>
                <span>{category.companyCount} companies</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                {category.representativeCompanies.map((company) => (
                  <span key={company.slug} className="rounded-full bg-[var(--card-soft)] px-2.5 py-1">
                    {company.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
