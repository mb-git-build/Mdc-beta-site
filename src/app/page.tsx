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

const topicChips = ["GPU hosting", "Immersion cooling", "Bitcoin mining", "Modular data centers", "Edge data centers", "Microgrids"];

const ecosystemLanes = [
  {
    title: "Compute delivery & capacity",
    description:
      "Explore operators, hosting environments, modular delivery models, and adjacent infrastructure layers that shape how compute capacity reaches the market.",
    categorySlugs: ["ai-colocation-gpu-hosting", "modular-prefab", "containerized-data-centers", "edge-micro-data-centers"],
  },
  {
    title: "Cooling, density & thermal operations",
    description:
      "Follow liquid, immersion, rack-density, rejection, and controls relationships to understand the thermal side of the ecosystem.",
    categorySlugs: ["liquid-cooling", "immersion-cooling", "hvac-and-thermal-rejection", "monitoring-and-controls"],
  },
  {
    title: "Power, resilience & site execution",
    description:
      "Trace the electrical backbone from packaged power and substations into generation, siting, commissioning, and long-term operational support.",
    categorySlugs: ["power-and-electrical", "generators-and-microgrids", "site-selection-and-land-strategy", "commissioning-and-operations"],
  },
];

const proofPoints = [
  {
    title: "See the market by category",
    description: "Browse the ecosystem through real infrastructure segments instead of a flat directory or a narrow vendor list.",
  },
  {
    title: "Follow relationships across the stack",
    description: "Move through adjacent categories and supplier clusters to understand how cooling, power, deployment, and operations connect.",
  },
  {
    title: "Use the map for supplier discovery",
    description: "Find established and emerging suppliers with enough market context to make the discovery process more intelligent.",
  },
];

const marketUtilities = [
  {
    title: "Compare paths",
    description: "Use guided comparison only when you want help moving through the ecosystem from a specific infrastructure question.",
    href: "/compare",
    cta: "Open compare",
  },
  {
    title: "Get matched",
    description: "Use the routing surface when you want a fast suggestion for which ecosystem view to open first.",
    href: "/get-matched",
    cta: "Open get matched",
  },
  {
    title: "Decision utilities",
    description: "Treat workflow tools as secondary utilities layered on top of the market map, not as the product itself.",
    href: "/directory",
    cta: "Open utilities",
  },
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

  const laneRows = ecosystemLanes.map((lane) => {
    const laneCategories = lane.categorySlugs
      .map((slug) => categories.find((category) => category.slug === slug))
      .filter((category): category is NonNullable<(typeof categories)[number]> => Boolean(category));

    const vendorCount = vendors.filter((vendor) => lane.categorySlugs.some((slug) => vendor.categories.includes(slug))).length;

    return {
      ...lane,
      laneCategories,
      vendorCount,
    };
  });

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section>
        <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-18">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Data center ecosystem map</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Explore the market across categories, suppliers, and infrastructure relationships.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">
              Browse the ecosystem through power, cooling, modular delivery, hosting, operations, site strategy, and adjacent supplier networks with more context than a flat directory provides.
            </p>
          </div>

          <div className="mt-10 max-w-5xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-soft)]">
            <form action="/vendors" method="get" className="flex flex-col gap-3 lg:flex-row">
              <input
                name="q"
                placeholder="Search suppliers, categories, cooling, power, modular, GPU hosting..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-strong)] px-5 py-4 text-base text-white outline-none placeholder:text-[#7f8b99]"
              />
              <button type="submit" className="rounded-xl bg-white px-6 py-4 text-sm font-semibold text-[#0f141a]">
                Search market
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {topicChips.map((chip) => (
                <span key={chip} className="rounded-full bg-[var(--card-soft)] px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)]">
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-5 md:grid-cols-4">
              <Link href="/categories" className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4 transition hover:border-[var(--border-strong)]">
                <p className="text-sm font-semibold text-white">Browse categories</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Start with the ecosystem structure and move through the market by segment.</p>
              </Link>
              <Link href="/vendors" className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4 transition hover:border-[var(--border-strong)]">
                <p className="text-sm font-semibold text-white">Browse suppliers</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Go straight into company profiles, category tags, and related market context.</p>
              </Link>
              <Link href="/directory" className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4 transition hover:border-[var(--border-strong)]">
                <p className="text-sm font-semibold text-white">Open the market map</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Trace the market through categories, supplier counts, and connected infrastructure lanes.</p>
              </Link>
              <Link href="/compare" className="rounded-2xl border border-[#31536a] bg-[#15384d] p-4 transition hover:border-[#4a6c83] hover:bg-[#1b4a63]">
                <p className="text-sm font-semibold text-white">Use comparison tools</p>
                <p className="mt-2 text-sm leading-6 text-[#d6e2e9]">Open guided utilities only when you want help exploring the ecosystem from a specific angle.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Why teams use this market map</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">The product is the ecosystem, not just the workflow around it.</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {proofPoints.map((point) => (
                <article key={point.title} className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4">
                  <h3 className="text-sm font-semibold text-white">{point.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{point.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#31536a] bg-[linear-gradient(180deg,rgba(21,56,77,0.88),rgba(11,16,21,0.96))] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9edcf0]">Market coverage</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
                <p className="text-sm font-semibold text-white">{categories.length} categories mapped</p>
                <p className="mt-2 text-sm leading-6 text-[#d6e2e9]">Coverage spans compute delivery, thermal systems, power infrastructure, monitoring, operations, and site strategy.</p>
              </div>
              <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4">
                <p className="text-sm font-semibold text-white">{vendors.length} suppliers visible</p>
                <p className="mt-2 text-sm leading-6 text-[#d6e2e9]">Browse established vendors, emerging players, and supplier relationships across the infrastructure stack.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Featured categories</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">See the market through its category structure.</h2>
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

      <section className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Ecosystem relationships</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Follow how major infrastructure lanes connect.</h2>
          </div>
          <Link href="/directory" className="text-sm font-semibold text-[var(--accent)]">Open the market map</Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {laneRows.map((lane) => (
            <article key={lane.title} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{lane.vendorCount} connected companies</p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">{lane.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{lane.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {lane.laneCategories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/directory/${category.slug}`}
                    className="rounded-full bg-[var(--card-soft)] px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)] transition hover:bg-[#1f303c] hover:text-white"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Featured suppliers</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Supplier discovery across key infrastructure segments.</h2>
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
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Recently added suppliers</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Track the market as the supplier map grows.</h2>
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Market topics</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topicChips.map((chip) => (
                <span key={chip} className="rounded-full bg-[var(--card-soft)] px-3 py-1.5 text-sm font-medium text-[var(--muted-strong)]">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Market intelligence</p>
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

      <section className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Exploration utilities</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Use workflow tools as secondary ways to explore the market.</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {marketUtilities.map((utility) => (
            <Link key={utility.title} href={utility.href} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
              <h3 className="text-base font-semibold tracking-tight text-white">{utility.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{utility.description}</p>
              <p className="mt-5 text-sm font-semibold text-[var(--accent)]">{utility.cta}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
