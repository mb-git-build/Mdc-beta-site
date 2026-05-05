import Link from "next/link";
import { categories, getVendorsForCategory } from "@/lib/site-data";

export default function AdminCategoriesPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Admin / Categories</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Category taxonomy</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Review taxonomy, descriptions, and directory coverage by category.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {categories.map((category) => {
            const vendorCount = getVendorsForCategory(category.slug).length;
            return (
              <article key={category.slug} className="rounded-[1.25rem] border border-[var(--border)] bg-[#f7fafc] p-4">
                <h2 className="text-base font-semibold tracking-tight">{category.name}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">{vendorCount} linked vendor profiles</p>
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
