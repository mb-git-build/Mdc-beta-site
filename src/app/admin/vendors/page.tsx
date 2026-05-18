import Link from "next/link";
import { categories, getVendorMarkdownSlugs, vendors } from "@/lib/site-data";

export default function AdminVendorsPage() {
  const featuredCount = vendors.filter((vendor) => vendor.featured).length;
  const verifiedCount = vendors.filter((vendor) => vendor.verified).length;
  const vendorSlugs = new Set(vendors.map((vendor) => vendor.slug));
  const markdownOnlySlugs = getVendorMarkdownSlugs().filter((slug) => !vendorSlugs.has(slug));

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Admin / Vendors</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Vendor records</h1>
          <p className="text-sm leading-7 text-[var(--muted)]">{vendors.length} total vendors · {featuredCount} featured · {verifiedCount} verified</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-[1rem] border border-[var(--border)] bg-[#f7fafc] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Structured vendors</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{vendors.length}</p>
          </div>
          <div className="rounded-[1rem] border border-[var(--border)] bg-[#f7fafc] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Featured</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{featuredCount}</p>
          </div>
          <div className="rounded-[1rem] border border-[var(--border)] bg-[#f7fafc] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Verified</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{verifiedCount}</p>
          </div>
          <div className="rounded-[1rem] border border-[var(--border)] bg-[#f7fafc] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Markdown-only backlog</p>
            <p className="mt-1 text-lg font-semibold tracking-tight">{markdownOnlySlugs.length}</p>
          </div>
        </div>

        {markdownOnlySlugs.length ? (
          <section className="mt-6 rounded-[1.25rem] border border-[var(--border)] bg-[#f7fafc] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Promotion backlog</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">Vendor profiles written in content, but not yet promoted into structured data</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">Useful next-wave candidates for taxonomy-first expansion</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {markdownOnlySlugs.map((slug) => (
                <span key={slug} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--foreground)]">
                  {slug}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {vendors.map((vendor) => {
            const related = vendor.categories
              .map((categorySlug) => categories.find((category) => category.slug === categorySlug)?.name ?? categorySlug)
              .slice(0, 3);

            return (
              <div key={vendor.slug} className="rounded-[1.25rem] border border-[var(--border)] bg-[#f7fafc] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight">{vendor.name}</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">{vendor.categories.length} category assignment(s)</p>
                  </div>
                  <Link href={`/vendors/${vendor.slug}`} className="text-sm font-semibold text-[var(--accent)]">
                    View
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {related.map((categoryName) => (
                    <span key={categoryName} className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">
                      {categoryName}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
