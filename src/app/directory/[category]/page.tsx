import Link from "next/link";
import {
  categories,
  getCategory,
  getGuides,
  getMarkdownCategoryBySlug,
  getVendorsForCategory,
} from "@/lib/site-data";
import { categoryGlyph, slugToAccent, vendorGlyph } from "@/lib/visuals";

type MarkdownGuide = ReturnType<typeof getGuides>[number];

type RelatedGuide = {
  title: string;
  slug: string;
};

const guideByCategory: Record<string, string[]> = {
  "modular-prefab": ["Modular AI Data Center", "Modular vs. Traditional Data Center Build", "AI Colocation vs. Modular"],
  "liquid-cooling": ["AI Data Center Cooling", "AI Colocation vs. Modular"],
  "ai-colocation-gpu-hosting": ["AI Colocation vs. Modular"],
  "power-and-electrical": ["Modular vs. Traditional Data Center Build", "AI Data Center Cooling"],
  "epc-and-commissioning": ["Modular AI Data Center", "Modular vs. Traditional Data Center Build"],
};

const categoryClusters = [
  {
    label: "Related formats",
    slugs: ["modular-prefab", "containerized-data-centers", "edge-micro-data-centers", "ai-colocation-gpu-hosting", "bare-metal-and-hpc-hosting"],
  },
  {
    label: "Cooling stack",
    slugs: ["liquid-cooling", "immersion-cooling", "rear-door-and-direct-chip-cooling", "hvac-and-thermal-rejection", "rack-power-density"],
  },
  {
    label: "Power stack",
    slugs: ["power-and-electrical", "ups-and-battery-storage", "generators-and-microgrids", "switchgear-and-pdus", "rack-power-density"],
  },
  {
    label: "Delivery stack",
    slugs: ["epc-and-commissioning", "design-and-engineering", "construction-and-integration", "commissioning-and-operations", "supply-chain-and-logistics"],
  },
  {
    label: "Operations stack",
    slugs: ["dcim-and-monitoring", "orchestration-and-automation", "network-fabric-and-connectivity", "physical-security-and-fire-protection"],
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

  return sameCluster
    .filter((slug) => slug !== categorySlug)
    .map((slug) => getCategory(slug))
    .filter((item): item is NonNullable<ReturnType<typeof getCategory>> => Boolean(item))
    .slice(0, 5)
    .map((item) => ({
      ...item,
      vendorCount: getVendorsForCategory(item.slug).length,
      clusterLabel: ownCluster?.label ?? "Related",
    }));
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
      <main className="min-h-screen bg-[var(--background)] px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Not found</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">This category does not exist yet.</h1>
        </div>
      </main>
    );
  }

  const tone = slugToAccent(category.slug);
  const categoryContent = getMarkdownCategoryBySlug(category.slug);
  const compareSection = categoryContent?.sections.find((section) => section.heading === "What to compare");
  const scenarioSection = categoryContent?.sections.find((section) => section.heading === "Decision scenarios");
  const vendors = getVendorsForCategory(categorySlug);
  const relatedGuides = getRelatedGuides(category.slug);
  const adjacentCategories = getAdjacentCategories(category.slug);

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
          <div className="p-8 lg:p-10" style={{ background: tone.gradient }}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/10 text-2xl text-white">
                  {categoryGlyph(category.slug)}
                </div>
                <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Category</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{category.name}</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-white/88">{category.description}</p>
                {categoryContent?.intro[0] ? <p className="mt-4 max-w-3xl text-sm leading-7 text-white/78">{categoryContent.intro[0]}</p> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:w-[30rem] lg:grid-cols-3">
                <MetricCard label="Companies" value={`${vendors.length}`} />
                <MetricCard label="Guides" value={`${relatedGuides.length}`} />
                <MetricCard label="Checks" value={`${compareSection?.bullets.length ?? 0}`} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.36fr_1fr]">
          <aside className="space-y-6">
            <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Quick filters</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">{vendors.length} companies</span>
                <span className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">{relatedGuides.length} guides</span>
                <span className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">Curated category</span>
              </div>
              {compareSection?.bullets.length ? (
                <ul className="mt-5 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                  {compareSection.bullets.slice(0, 4).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            {adjacentCategories.length ? (
              <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Related categories</p>
                <div className="mt-4 grid gap-3">
                  {adjacentCategories.map((adjacent) => (
                    <Link key={adjacent.slug} href={`/directory/${adjacent.slug}`} className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4 transition hover:border-[var(--accent)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{adjacent.clusterLabel}</p>
                      <h3 className="mt-1 text-sm font-semibold text-white">{adjacent.name}</h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">{adjacent.vendorCount} companies</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Guides</p>
              <div className="mt-4 grid gap-3">
                {relatedGuides.map((guide) => (
                  <Link key={guide.slug} href={guide.slug} className="rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4 text-sm font-medium text-white transition hover:border-[var(--accent)]">
                    {guide.title}
                  </Link>
                ))}
              </div>
            </section>
          </aside>

          <section>
            {scenarioSection?.bullets?.length ? (
              <div className="mb-6 rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Decision scenarios</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {scenarioSection.bullets.map((item) => (
                    <div key={item} className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-7 text-[var(--muted-strong)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              {vendors.length ? (
                vendors.map((vendor) => (
                  <article key={vendor.slug} className="overflow-hidden rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-[var(--accent)]">
                    <div className="p-5" style={{ background: tone.gradient }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sm font-semibold tracking-[0.16em] text-white">
                            {vendorGlyph(vendor.slug)}
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold tracking-tight text-white">{vendor.name}</h2>
                            <p className="mt-1 text-sm text-white/80">{vendor.verified ? "Verified listing" : "Curated company card"}</p>
                          </div>
                        </div>
                        <a href={vendor.website_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-white/90">
                          Visit
                        </a>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {vendor.categories.slice(0, 3).map((categorySlug) => (
                          <span key={categorySlug} className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                            {categories.find((entry) => entry.slug === categorySlug)?.name ?? categorySlug}
                          </span>
                        ))}
                      </div>
                      <Link href={`/vendors/${vendor.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                        View company
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
                  No companies are currently listed in this category yet.
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/12 bg-white/6 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
