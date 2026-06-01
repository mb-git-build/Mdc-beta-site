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

const executiveQuestions = [
  {
    title: "Need capacity fast",
    description: "Start with hosting, modular deployment, and power-constrained options before you sink time into the wrong build path.",
    href: "/compare",
    cta: "Open fast-capacity paths",
  },
  {
    title: "Have constrained power",
    description: "Follow the utility, generation, packaged-power, and siting layers that usually determine what is actually feasible.",
    href: "/directory/generators-and-microgrids",
    cta: "Explore constrained-power options",
  },
  {
    title: "Need liquid cooling",
    description: "Compare liquid, immersion, rear-door, and supporting thermal layers before narrowing suppliers.",
    href: "/directory/liquid-cooling",
    cta: "Open cooling paths",
  },
  {
    title: "Need modular deployment",
    description: "Move from modular shell to prefab power, integration, logistics, and commissioning as one deployment chain.",
    href: "/directory/modular-prefab",
    cta: "Open modular path",
  },
  {
    title: "Need GPU hosting",
    description: "Start with operator and hosting environments when time-to-capacity matters more than owning every infrastructure layer.",
    href: "/directory/ai-colocation-gpu-hosting",
    cta: "Browse hosting options",
  },
  {
    title: "Need retrofit guidance",
    description: "Use cooling, rack power, controls, and integration layers to map higher-density retrofit options.",
    href: "/directory/rear-door-direct-to-chip-cooling",
    cta: "Open retrofit path",
  },
];

const ecosystemLanes = [
  {
    title: "Launch a modular AI site",
    description:
      "Start with prefabricated infrastructure, then trace the power, cooling, and delivery layers that usually determine time-to-capacity.",
    categorySlugs: ["modular-prefab", "prefabricated-power-blocks", "liquid-cooling", "construction-and-integration"],
  },
  {
    title: "Retrofit for higher rack density",
    description:
      "Use the directory to compare thermal upgrade paths, rack power implications, and the controls needed to run denser halls safely.",
    categorySlugs: ["rear-door-direct-to-chip-cooling", "liquid-cooling", "high-density-rack-power", "monitoring-and-controls"],
  },
  {
    title: "Build around constrained power",
    description:
      "Follow the energy side of the graph when utility access, resilience, or behind-the-meter strategy is the real bottleneck.",
    categorySlugs: ["generators-and-microgrids", "ups-and-battery-storage", "site-selection-and-land-strategy", "sustainability-and-energy-strategy"],
  },
];

const proofPoints = [
  {
    title: "Start from the deployment problem",
    description: "Use executive questions and market-map entry paths when you need to frame the decision before comparing specific brands.",
  },
  {
    title: "Follow adjacent decisions",
    description: "See what is commonly sourced together so cooling, rack power, controls, and deployment strategy are considered as one system.",
  },
  {
    title: "Shortlist faster",
    description: "Use category pages, decision paths, and company detail pages to get to a tighter first-pass shortlist without starting from scratch.",
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Executive infrastructure research</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Answer deployment questions faster across modular infrastructure, cooling, power, and AI compute.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">
              Start with the infrastructure problem you are trying to solve, compare plausible paths, then move into categories and suppliers with more context than a flat directory provides.
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
              <Link href="/compare" className="rounded-2xl border border-[var(--border)] bg-[var(--card-soft)] p-4 transition hover:border-[var(--border-strong)]">
                <p className="text-sm font-semibold text-white">Start with your problem</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Use decision paths for fast capacity, constrained power, hosted GPU, modular build, and retrofit questions.</p>
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
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Why teams use this directory</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">It is built for infrastructure research, not generic browsing.</h2>
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9edcf0]">Best next steps</p>
            <div className="mt-5 space-y-4">
              <Link href="/compare" className="block rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4 transition hover:bg-[rgba(255,255,255,0.08)]">
                <p className="text-sm font-semibold text-white">Use decision paths</p>
                <p className="mt-2 text-sm leading-6 text-[#d6e2e9]">Start from fast capacity, constrained power, modular delivery, hosting, or retrofit instead of guessing the right category first.</p>
              </Link>
              <Link href="/vendors" className="block rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-4 transition hover:bg-[rgba(255,255,255,0.08)]">
                <p className="text-sm font-semibold text-white">Browse companies</p>
                <p className="mt-2 text-sm leading-6 text-[#d6e2e9]">Go straight into company profiles when you already know the segment you want to investigate.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Executive questions</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Start with the decision you need to make.</h2>
          </div>
          <Link href="/compare" className="text-sm font-semibold text-[var(--accent)]">
            View comparison paths
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {executiveQuestions.map((question) => (
            <Link key={question.title} href={question.href} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
              <h3 className="text-base font-semibold tracking-tight text-white">{question.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{question.description}</p>
              <p className="mt-5 text-sm font-semibold text-[var(--accent)]">{question.cta}</p>
            </Link>
          ))}
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

      <section className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Ecosystem lanes</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Start with a real build problem, not a flat list.</h2>
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
