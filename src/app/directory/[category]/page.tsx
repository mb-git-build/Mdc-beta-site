import Link from "next/link";
import {
  categories,
  getCategory,
  getGuides,
  getMarkdownCategoryBySlug,
  getMarkdownPageBySlug,
  getVendorsForCategory,
} from "@/lib/site-data";
import { categoryGlyph, slugToAccent, vendorGlyph } from "@/lib/visuals";

type MarkdownGuide = ReturnType<typeof getGuides>[number];

type RelatedGuide = {
  title: string;
  slug: string;
};

const vendorsPage = getMarkdownPageBySlug("/vendors");

const guideByCategory: Record<string, string[]> = {
  "modular-prefab": ["Modular AI Data Center", "Modular vs. Traditional Data Center Build", "AI Colocation vs. Modular"],
  "liquid-cooling": ["AI Data Center Cooling", "AI Colocation vs. Modular"],
  "ai-colocation-gpu-hosting": ["AI Colocation vs. Modular"],
  "power-and-electrical": ["Modular vs. Traditional Data Center Build", "AI Data Center Cooling"],
  "epc-and-commissioning": ["Modular AI Data Center", "Modular vs. Traditional Data Center Build"],
};

const categoryClusters = [
  {
    label: "facility format",
    slugs: ["modular-prefab", "containerized-data-centers", "edge-micro-data-centers", "ai-colocation-gpu-hosting", "bare-metal-and-hpc-hosting"],
  },
  {
    label: "thermal stack",
    slugs: ["liquid-cooling", "immersion-cooling", "rear-door-and-direct-chip-cooling", "hvac-and-thermal-rejection", "rack-power-density"],
  },
  {
    label: "power chain",
    slugs: ["power-and-electrical", "ups-and-battery-storage", "generators-and-microgrids", "switchgear-and-pdus", "rack-power-density"],
  },
  {
    label: "delivery layer",
    slugs: ["epc-and-commissioning", "design-and-engineering", "construction-and-integration", "commissioning-and-operations", "supply-chain-and-logistics"],
  },
  {
    label: "operations layer",
    slugs: ["dcim-and-monitoring", "orchestration-and-automation", "network-fabric-and-connectivity", "physical-security-and-fire-protection"],
  },
  {
    label: "feasibility layer",
    slugs: ["sustainability-and-energy-strategy", "site-selection-and-land-strategy", "permits-incentives-and-policy"],
  },
];

function getRelatedGuides(categorySlug: string): RelatedGuide[] {
  const guides = getGuides();
  const preferred = guideByCategory[categorySlug] ?? [];

  const mapped = preferred
    .map((title) => guides.find((guide) => guide.title === title))
    .filter((guide): guide is MarkdownGuide => Boolean(guide));

  const fallback = guides.slice(0, 2).filter((guide) => !mapped.includes(guide));

  return [...mapped, ...fallback].map((guide) => ({
    title: guide.title,
    slug: guide.slug,
  }));
}

function getAdjacentCategories(categorySlug: string) {
  const ownCluster = categoryClusters.find((cluster) => cluster.slugs.includes(categorySlug));
  const sameCluster = ownCluster?.slugs ?? [];
  const strategicFallback = ["site-selection-and-land-strategy", "power-and-electrical", "liquid-cooling", "dcim-and-monitoring", "epc-and-commissioning"];

  return [...sameCluster, ...strategicFallback]
    .filter((slug) => slug !== categorySlug)
    .map((slug) => getCategory(slug))
    .filter((item): item is NonNullable<ReturnType<typeof getCategory>> => Boolean(item))
    .filter((item, index, list) => list.findIndex((candidate) => candidate.slug === item.slug) === index)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      clusterLabel: ownCluster?.slugs.includes(item.slug) ? ownCluster.label : "cross-stack dependency",
      vendorCount: getVendorsForCategory(item.slug).length,
    }));
}

type ResearchRoute = {
  title: string;
  body: string;
  steps: string[];
};

const researchRoutesByCategory: Record<string, ResearchRoute[]> = {
  "power-and-electrical": [
    {
      title: "Utility-constrained site launch",
      body: "Start with feasibility, then move through the power chain that determines whether the site can actually energize on schedule.",
      steps: ["site-selection-and-land-strategy", "power-and-electrical", "generators-and-microgrids", "switchgear-and-pdus", "dcim-and-monitoring"],
    },
    {
      title: "High-density electrical retrofit",
      body: "Map upstream capacity, rack-level distribution, backup power, and thermal implications before locking the upgrade scope.",
      steps: ["power-and-electrical", "switchgear-and-pdus", "ups-and-battery-storage", "rack-power-density", "liquid-cooling"],
    },
  ],
  "liquid-cooling": [
    {
      title: "Dense GPU retrofit",
      body: "Trace the path from rack density assumptions into liquid capture, heat rejection, and the telemetry needed to operate it confidently.",
      steps: ["rack-power-density", "liquid-cooling", "rear-door-and-direct-chip-cooling", "hvac-and-thermal-rejection", "dcim-and-monitoring"],
    },
    {
      title: "Modular AI deployment",
      body: "Treat cooling as part of the packaged system, not a bolt-on afterthought, then connect it back to the site thermal and operating model.",
      steps: ["modular-prefab", "liquid-cooling", "hvac-and-thermal-rejection", "power-and-electrical", "commissioning-and-operations"],
    },
  ],
  "dcim-and-monitoring": [
    {
      title: "Commissioning-to-operations handoff",
      body: "Use monitoring selection to preserve context from energization and startup into steady-state operations.",
      steps: ["epc-and-commissioning", "dcim-and-monitoring", "power-and-electrical", "hvac-and-thermal-rejection", "commissioning-and-operations"],
    },
    {
      title: "Distributed modular fleet visibility",
      body: "Map the monitoring layer across multiple sites so alarms, utilization, and capacity signals remain usable as the fleet grows.",
      steps: ["edge-micro-data-centers", "dcim-and-monitoring", "orchestration-and-automation", "network-fabric-and-connectivity", "physical-security-and-fire-protection"],
    },
  ],
  "switchgear-and-pdus": [
    {
      title: "Phased capacity expansion",
      body: "Research distribution architecture as the bridge between upstream power strategy and future module or room growth.",
      steps: ["power-and-electrical", "switchgear-and-pdus", "ups-and-battery-storage", "rack-power-density", "modular-prefab"],
    },
  ],
  "ups-and-battery-storage": [
    {
      title: "Resilience-first design",
      body: "Evaluate autonomy, ride-through, distribution, and monitoring together so backup strategy stays aligned with the actual load profile.",
      steps: ["power-and-electrical", "ups-and-battery-storage", "switchgear-and-pdus", "generators-and-microgrids", "dcim-and-monitoring"],
    },
  ],
};

function getResearchRoutes(categorySlug: string) {
  const routes = researchRoutesByCategory[categorySlug] ?? [];

  return routes
    .map((route) => ({
      ...route,
      steps: route.steps
        .map((slug) => getCategory(slug))
        .filter((item): item is NonNullable<ReturnType<typeof getCategory>> => Boolean(item))
        .map((item) => ({
          slug: item.slug,
          name: item.name,
          vendorCount: getVendorsForCategory(item.slug).length,
        })),
    }))
    .filter((route) => route.steps.length > 0);
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
      <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Not Found</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">This category does not exist yet.</h1>
        </div>
      </main>
    );
  }

  const tone = slugToAccent(category.slug);
  const categoryContent = getMarkdownCategoryBySlug(category.slug);
  const compareSection = categoryContent?.sections.find((section) => section.heading === "What to compare");
  const scenarioSection = categoryContent?.sections.find((section) => section.heading === "Decision scenarios");
  const signalSection = categoryContent?.sections.find((section) => section.heading === "Deployment signals");
  const vendors = getVendorsForCategory(categorySlug);
  const usageSection = vendorsPage?.sections.find((section) => section.heading === "How to use this directory");
  const relatedGuides = getRelatedGuides(category.slug);
  const adjacentCategories = getAdjacentCategories(category.slug);
  const researchRoutes = getResearchRoutes(category.slug);

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white shadow-[0_16px_40px_rgba(16,44,60,0.06)]">
          <div className="p-8 text-white" style={{ background: tone.gradient }}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/15 bg-white/10 text-2xl">
                  {categoryGlyph(category.slug)}
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Category</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">{category.name}</h1>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-white/85">{category.description}</p>
                {categoryContent ? <p className="mt-4 text-sm leading-7 text-white/80">{categoryContent.intro.join(" ")}</p> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:w-[26rem] lg:grid-cols-1">
                <MetricCard label="Vendor coverage" value={`${vendors.length} profiles`} />
                <MetricCard label="Guide support" value={`${relatedGuides.length} linked guides`} />
                <MetricCard label="Compare focus" value={`${compareSection?.bullets.length ?? 0} buyer checks`} />
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-6">
            <section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">What this category covers</p>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                This category is framed around buyer relevance, not vague adjacency. Listings should help a serious buyer evaluate real deployment options in this area.
              </p>
              {compareSection?.bullets.length ? (
                <ul className="mt-5 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                  {compareSection.bullets.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : null}
              {usageSection?.bullets.length ? (
                <ul className="mt-5 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                  {usageSection.bullets.slice(0, 2).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            {scenarioSection?.bullets.length ? (
              <section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Decision scenarios</p>
                {scenarioSection.body.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-sm leading-7 text-[var(--muted)]">
                    {paragraph}
                  </p>
                ))}
                <ul className="mt-5 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                  {scenarioSection.bullets.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {signalSection?.bullets.length ? (
              <section className="rounded-[1.5rem] border border-[var(--border)] bg-[#f7fafc] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Deployment signals</p>
                <ul className="mt-5 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                  {signalSection.bullets.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Decision actions</p>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/categories"
                  className="inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
                >
                  Return to category graph
                </Link>
                <Link href="/vendors" className="inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
                  Browse all vendors
                </Link>
              </div>
            </section>

            {adjacentCategories.length ? (
              <section className="rounded-[1.5rem] border border-[var(--border)] bg-[#102c3c] p-6 text-white shadow-[0_20px_44px_rgba(16,44,60,0.12)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8ed1e8]">Adjacent map</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">Research this category with its neighboring infrastructure layers.</h2>
                <div className="mt-5 grid gap-3">
                  {adjacentCategories.map((adjacent) => (
                    <Link
                      key={adjacent.slug}
                      href={`/directory/${adjacent.slug}`}
                      className="group rounded-[1.1rem] border border-white/10 bg-white/7 p-4 transition hover:border-[#8ed1e8]/60 hover:bg-white/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">{adjacent.clusterLabel}</p>
                          <h3 className="mt-1 text-sm font-semibold leading-6 text-white group-hover:text-[#bdefff]">{adjacent.name}</h3>
                        </div>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/75">{adjacent.vendorCount}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {researchRoutes.length ? (
              <section className="rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f6fafc_100%)] p-6 shadow-[0_16px_34px_rgba(16,44,60,0.05)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Common research routes</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">Turn this category into a practical sourcing path.</h2>
                <div className="mt-5 grid gap-4">
                  {researchRoutes.map((route) => (
                    <article key={route.title} className="rounded-[1.1rem] border border-[var(--border)] bg-white p-4">
                      <h3 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">{route.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{route.body}</p>
                      <ol className="mt-4 grid gap-2">
                        {route.steps.map((step, index) => (
                          <li key={step.slug} className="flex gap-3">
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-semibold text-[var(--accent-strong)]">
                              {index + 1}
                            </span>
                            <div>
                              <Link href={`/directory/${step.slug}`} className="text-sm font-semibold text-[var(--foreground)] transition hover:text-[var(--accent)]">
                                {step.name}
                              </Link>
                              <p className="text-[11px] leading-5 text-[var(--muted)]">{step.vendorCount} vendor profiles in this step</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Recommended guides</p>
              <div className="mt-4 grid gap-3 text-sm">
                {relatedGuides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={guide.slug}
                    className="rounded-[1rem] bg-[#f7fafc] p-4 font-medium text-[var(--foreground)] transition hover:bg-[#eef6fb]"
                  >
                    {guide.title}
                  </Link>
                ))}
              </div>
            </section>
          </aside>

          <section className="grid gap-5">
            {vendors.length ? (
              vendors.map((vendor) => (
                <article key={vendor.slug} className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-4 p-6" style={{ background: tone.chip }}>
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-black/5 bg-white text-lg font-semibold tracking-[0.12em] text-[#143446]">
                        {vendorGlyph(vendor.slug)}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight">{vendor.name}</h2>
                        <p className="mt-2 text-sm text-[var(--muted)]">{vendor.verified ? "Verified listing" : "Profile under review"}</p>
                      </div>
                    </div>
                    <a href={vendor.website_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--accent)]">
                      Visit
                    </a>
                  </div>
                  <div className="p-6">
                    <p className="text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {vendor.categories.map((categorySlug) => (
                        <span
                          key={categorySlug}
                          className="rounded-full px-3 py-1 text-[11px] font-medium"
                          style={{ background: tone.chip, color: "#143446" }}
                        >
                          {categories.find((category) => category.slug === categorySlug)?.name ?? categorySlug}
                        </span>
                      ))}
                    </div>
                    <Link href={`/vendors/${vendor.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                      View profile →
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">
                No vendors are currently listed in this category yet.
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
