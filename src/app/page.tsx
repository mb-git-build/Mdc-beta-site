import Link from "next/link";
import { categories, getGuides, getFeaturedVendors, vendors } from "@/lib/site-data";
import { slugToAccent, vendorGlyph, vendorPrimaryCategory } from "@/lib/visuals";

const featuredVendors = getFeaturedVendors().slice(0, 6);
const guides = getGuides().slice(0, 3);

const featuredCategories = [
  "modular-prefab",
  "ai-colocation-gpu-hosting",
  "liquid-cooling",
  "immersion-cooling",
  "edge-micro-data-centers",
  "power-and-electrical",
  "containerized-data-centers",
  "generators-and-microgrids",
];

const trendingTopics = [
  "GPU hosting",
  "Immersion cooling",
  "Modular AI campuses",
  "Bitcoin mining infrastructure",
  "Edge data centers",
  "Power density retrofits",
];

export default function Home() {
  const featuredCategoryRows = categories.filter((category) => featuredCategories.includes(category.slug));

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <div className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--hero-panel)] p-8 shadow-[var(--shadow-soft)] lg:p-10">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Directory-first infrastructure discovery</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl sm:leading-[1.02]">
                Find modular data center, AI infrastructure, cooling, power, and hosting companies faster.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted-strong)]">
                A curated, modern discovery platform for modular data centers, GPU hosting, immersion cooling, edge deployments, bitcoin mining infrastructure, and the vendors behind them.
              </p>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-[var(--border-strong)] bg-[rgba(255,255,255,0.04)] p-4 sm:p-5">
              <form action="/vendors" method="get" className="flex flex-col gap-3 lg:flex-row">
                <input
                  name="q"
                  placeholder="Search companies, categories, cooling, GPU hosting, modular, bitcoin..."
                  className="w-full rounded-[1.1rem] border border-[var(--border-strong)] bg-[rgba(7,16,23,0.82)] px-5 py-4 text-base text-white outline-none placeholder:text-[#7f96a4]"
                />
                <button
                  type="submit"
                  className="rounded-[1.1rem] bg-white px-6 py-4 text-sm font-semibold text-[#071017] transition hover:-translate-y-0.5"
                >
                  Search directory
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                {trendingTopics.map((topic) => (
                  <span key={topic} className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)]">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              <StatPill label="Categories" value={String(categories.length)} />
              <StatPill label="Companies" value={String(vendors.length)} />
              <StatPill label="Featured" value={String(featuredVendors.length)} />
              <StatPill label="Guides" value={String(guides.length)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Browse by category</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Start with the infrastructure segment you actually care about.</h2>
          </div>
          <Link href="/categories" className="text-sm font-semibold text-[var(--accent)]">
            See all categories
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredCategoryRows.map((category) => {
            const tone = slugToAccent(category.slug);
            const categoryVendorCount = vendors.filter((vendor) => vendor.categories.includes(category.slug)).length;

            return (
              <Link
                key={category.slug}
                href={`/directory/${category.slug}`}
                className="overflow-hidden rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-[var(--accent)]"
              >
                <div className="h-2 w-full" style={{ background: tone.gradient }} />
                <div className="p-5">
                  <h3 className="text-lg font-semibold tracking-tight text-white">{category.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
                  <p className="mt-4 text-sm font-semibold text-[var(--muted-strong)]">{categoryVendorCount} companies</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[rgba(255,255,255,0.02)]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Featured companies</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Premium cards, faster scanning, less clutter.</h2>
            </div>
            <Link href="/vendors" className="text-sm font-semibold text-[var(--accent)]">
              Browse all companies
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredVendors.map((vendor) => {
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
                          <h3 className="text-lg font-semibold tracking-tight text-white">{vendor.name}</h3>
                          <p className="mt-1 text-sm text-white/80">{vendor.verified ? "Verified" : "Curated listing"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {vendor.categories.slice(0, 3).map((categorySlug) => (
                        <span key={categorySlug} className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                          {categories.find((category) => category.slug === categorySlug)?.name ?? categorySlug}
                        </span>
                      ))}
                    </div>
                    <Link href={`/vendors/${vendor.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                      View company
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Trending infrastructure categories</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {trendingTopics.map((topic) => (
                <div key={topic} className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm font-medium text-[var(--muted-strong)]">
                  {topic}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Guides</p>
            <div className="mt-5 grid gap-4">
              {guides.map((guide) => (
                <Link key={guide.slug} href={guide.slug} className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4 transition hover:border-[var(--accent)]">
                  <h3 className="text-base font-semibold tracking-tight text-white">{guide.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{guide.page.intro[0]}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
