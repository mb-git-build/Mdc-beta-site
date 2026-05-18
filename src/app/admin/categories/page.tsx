import Link from "next/link";
import { categories, getVendorsForCategory } from "@/lib/site-data";

export default function AdminCategoriesPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Admin / Categories</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Category taxonomy</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Review taxonomy, descriptions, directory coverage, and relationship richness by category.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-[1rem] border border-[var(--border)] bg-[#f7fafc] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Total categories</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{categories.length}</p>
          </div>
          <div className="rounded-[1rem] border border-[var(--border)] bg-[#f7fafc] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Segments</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{categories.filter((category) => category.layer !== "subcategory").length}</p>
          </div>
          <div className="rounded-[1rem] border border-[var(--border)] bg-[#f7fafc] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Subcategories</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{categories.filter((category) => category.layer === "subcategory").length}</p>
          </div>
          <div className="rounded-[1rem] border border-[var(--border)] bg-[#f7fafc] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">With adjacency links</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{categories.filter((category) => (category.adjacent_category_slugs?.length ?? 0) > 0 || (category.often_used_with?.length ?? 0) > 0).length}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {categories.map((category) => {
            const vendorCount = getVendorsForCategory(category.slug).length;
            const adjacent = (category.adjacent_category_slugs ?? [])
              .map((slug) => categories.find((entry) => entry.slug === slug)?.name ?? slug)
              .slice(0, 4);
            const oftenUsedWith = (category.often_used_with ?? [])
              .map((slug) => categories.find((entry) => entry.slug === slug)?.name ?? slug)
              .slice(0, 4);

            return (
              <article key={category.slug} className="rounded-[1.25rem] border border-[var(--border)] bg-[#f7fafc] p-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  <span>{category.layer === "subcategory" ? "Subcategory" : "Segment"}</span>
                  {category.parent_slug ? <span>• parent: {categories.find((entry) => entry.slug === category.parent_slug)?.name ?? category.parent_slug}</span> : null}
                </div>
                <h2 className="mt-2 text-base font-semibold tracking-tight">{category.name}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
                <div className="mt-3 grid gap-2 text-xs text-[var(--muted)]">
                  <p>{vendorCount} linked vendor profiles</p>
                  <p>Adjacency links: {category.adjacent_category_slugs?.length ?? 0}</p>
                  <p>Often-used-with links: {category.often_used_with?.length ?? 0}</p>
                </div>
                {adjacent.length ? (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Adjacent categories</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {adjacent.map((label) => (
                        <span key={label} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {oftenUsedWith.length ? (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Commonly deployed with</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {oftenUsedWith.map((label) => (
                        <span key={label} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <Link href={`/admin/vendors?category=${category.slug}`} className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]">
                  Review vendors
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
