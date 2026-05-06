import Link from "next/link";
import { categories, getGuides, getFeaturedVendors } from "@/lib/site-data";
import { vendorGlyph } from "@/lib/visuals";

const featuredVendors = getFeaturedVendors().slice(0, 6);
const guides = getGuides().slice(0, 3);

const homepageCategorySlugs = [
  "modular-prefab",
  "containerized-data-centers",
  "ai-colocation-gpu-hosting",
  "immersion-cooling",
  "power-and-electrical",
  "edge-micro-data-centers",
  "generators-and-microgrids",
  "liquid-cooling",
];

const topicChips = [
  "GPU hosting",
  "Immersion cooling",
  "Bitcoin mining",
  "Modular data centers",
  "Edge data centers",
  "Microgrids",
];

export default function Home() {
  const homepageCategories = categories.filter((category) => homepageCategorySlugs.includes(category.slug));

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-[var(--shadow-soft)] lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Curated infrastructure directory</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">Find companies across modular data centers, cooling, power, and AI infrastructure.</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted-strong)]">
              A clean discovery site for modular data centers, containerized deployments, GPU hosting, immersion cooling, power vendors, and related infrastructure companies.
            </p>

            <div className="mt-8 rounded-[1.35rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4">
              <form action="/vendors" method="get" className="flex flex-col gap-3 lg:flex-row">
                <input
                  name="q"
                  placeholder="Search companies, cooling, GPU hosting, modular, bitcoin..."
                  className="w-full rounded-[1rem] border border-[var(--border)] bg-[rgba(7,16,23,0.85)] px-5 py-4 text-base text-white outline-none placeholder:text-[#7f96a4]"
                />
                <button type="submit" className="rounded-[1rem] bg-white px-6 py-4 text-sm font-semibold text-[#071017]">
                  Search
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                {topicChips.map((chip) => (
                  <span key={chip} className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)]">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Browse Categories</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Explore popular infrastructure categories.</h2>
          </div>
          <Link href="/categories" className="text-sm font-semibold text-[var(--accent)]">View all</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homepageCategories.map((category) => (
            <Link key={category.slug} href={`/directory/${category.slug}`} className="rounded-[1.35rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--accent)]">
              <h3 className="text-lg font-semibold tracking-tight text-white">{category.name}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Featured Companies</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Clean cards, readable descriptions, fast scanning.</h2>
            </div>
            <Link href="/vendors" className="text-sm font-semibold text-[var(--accent)]">Browse all</Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredVendors.map((vendor) => (
              <article key={vendor.slug} className="rounded-[1.35rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--accent)]">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-sm font-semibold tracking-[0.12em] text-white">
                    {vendorGlyph(vendor.slug)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-white">{vendor.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">{vendor.verified ? "Verified company" : "Featured listing"}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {vendor.categories.slice(0, 3).map((categorySlug) => (
                    <span key={categorySlug} className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                      {categories.find((category) => category.slug === categorySlug)?.name ?? categorySlug}
                    </span>
                  ))}
                </div>
                <Link href={`/vendors/${vendor.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">View company</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Guides</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">A few simple guides to help people get oriented.</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {guides.map((guide) => (
            <Link key={guide.slug} href={guide.slug} className="rounded-[1.35rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--accent)]">
              <h3 className="text-lg font-semibold tracking-tight text-white">{guide.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{guide.page.intro[0]}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
