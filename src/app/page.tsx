import Link from "next/link";
import { categories, getGuides, vendors } from "@/lib/site-data";
import { vendorGlyph } from "@/lib/visuals";

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
  const trendingCompanies = vendors.filter((vendor) => vendor.featured).slice(0, 9);
  const recentlyAddedCompanies = vendors.slice(0, 9);
  const categoryPreviewRows = homepageCategories.map((category) => ({
    ...category,
    companyCount: vendors.filter((vendor) => vendor.categories.includes(category.slug)).length,
    sampleCompanies: vendors.filter((vendor) => vendor.categories.includes(category.slug)).slice(0, 4),
  }));

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section>
        <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-18">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Curated infrastructure directory</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">A serious industry directory for modular infrastructure, cooling, power, and AI compute.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">
              Use the site as a discovery and research gateway: browse categories, compare credible companies, and map the modular infrastructure ecosystem more efficiently.
            </p>
          </div>

          <div className="mt-10 max-w-5xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)]">
            <form action="/vendors" method="get" className="flex flex-col gap-3 lg:flex-row">
              <input
                name="q"
                placeholder="Search companies, cooling, GPU hosting, modular, bitcoin..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-strong)] px-5 py-4 text-base text-white outline-none placeholder:text-[#7f8b99]"
              />
              <button type="submit" className="rounded-xl bg-white px-6 py-4 text-sm font-semibold text-[#0f141a]">
                Search
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {topicChips.map((chip) => (
                <span key={chip} className="rounded-full bg-[var(--card-soft)] px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)]">
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-5 md:grid-cols-3">
              <Link href="/categories" className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4 transition hover:border-[var(--border-strong)]">
                <p className="text-sm font-semibold text-white">Start with categories</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Jump straight into power, cooling, modular, hosting, edge, and operations segments.</p>
              </Link>
              <Link href="/directory" className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4 transition hover:border-[var(--border-strong)]">
                <p className="text-sm font-semibold text-white">Use the market map</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Follow common buyer paths for new AI deployments, retrofits, and distributed capacity buildouts.</p>
              </Link>
              <Link href="/for-vendors" className="rounded-2xl border border-[#31536a] bg-[#15384d] p-4 transition hover:border-[#4a6c83] hover:bg-[#1b4a63]">
                <p className="text-sm font-semibold text-white">Submit your company</p>
                <p className="mt-2 text-sm leading-6 text-[#d6e2e9]">Get listed with clearer review expectations, stronger trust signals, and a direct path into the directory.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Featured categories</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Browse the ecosystem by segment.</h2>
          </div>
          <Link href="/categories" className="text-sm font-semibold text-[var(--accent)]">View all</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categoryPreviewRows.map((category) => (
            <Link key={category.slug} href={`/directory/${category.slug}`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
              <h3 className="text-base font-semibold tracking-tight text-white">{category.name}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
              <p className="mt-4 text-sm font-medium text-[var(--muted-strong)]">{category.companyCount} companies</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                {category.sampleCompanies.map((company) => (
                  <span key={company.slug} className="rounded-full bg-[var(--card-soft)] px-2.5 py-1">
                    {company.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Trending companies</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">High-signal companies across key infrastructure segments.</h2>
              </div>
              <Link href="/vendors" className="text-sm font-semibold text-[var(--accent)]">Browse all</Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {trendingCompanies.map((vendor) => (
                <article key={vendor.slug} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--card-soft)] text-sm font-semibold tracking-[0.12em] text-white">
                      {vendorGlyph(vendor.slug)}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-white">{vendor.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{vendor.verified ? "Verified company" : "Featured listing"}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                  <Link href={`/vendors/${vendor.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">View company</Link>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Recently added companies</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Use the directory like a live industry watchlist.</h2>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="grid gap-4">
                {recentlyAddedCompanies.map((vendor) => (
                  <Link key={vendor.slug} href={`/vendors/${vendor.slug}`} className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-white">{vendor.name}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{vendor.headline}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-[var(--accent)]">Open</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Trending topics</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topicChips.map((chip) => (
                <span key={chip} className="rounded-full bg-[var(--card-soft)] px-3 py-1.5 text-sm font-medium text-[var(--muted-strong)]">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Latest guides</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {guides.map((guide) => (
                <Link key={guide.slug} href={guide.slug} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
                  <h3 className="text-base font-semibold tracking-tight text-white">{guide.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{guide.page.intro[0]}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
