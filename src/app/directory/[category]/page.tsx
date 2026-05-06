import Link from "next/link";
import {
  categories,
  getCategory,
  getGuides,
  getMarkdownCategoryBySlug,
  getVendorsForCategory,
} from "@/lib/site-data";
import { vendorGlyph } from "@/lib/visuals";

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
        <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Not found</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">This category does not exist yet.</h1>
        </div>
      </main>
    );
  }

  const categoryContent = getMarkdownCategoryBySlug(category.slug);
  const compareSection = categoryContent?.sections.find((section) => section.heading === "What to compare");
  const scenarioSection = categoryContent?.sections.find((section) => section.heading === "Decision scenarios");
  const vendors = getVendorsForCategory(categorySlug);
  const relatedGuides = getRelatedGuides(category.slug);
  const adjacentCategories = getAdjacentCategories(category.slug);

  const featuredCompanies = vendors.slice(0, Math.min(4, vendors.length));
  const directoryCompanies = vendors.slice(featuredCompanies.length);
  const trendingCompanies = [...vendors].slice(0, 6);
  const overviewBullets = compareSection?.bullets.slice(0, 4) ?? [];

  const ecosystemLabel = (() => {
    if (category.slug.includes("immersion")) return "Top immersion cooling vendors";
    if (category.slug.includes("modular")) return "Leading modular infrastructure companies";
    if (category.slug.includes("gpu") || category.slug.includes("ai")) return "Leading AI infrastructure providers";
    if (category.slug.includes("edge")) return "Edge infrastructure ecosystem";
    if (category.slug.includes("power") || category.slug.includes("electrical")) return "Power and electrical infrastructure leaders";
    return `${category.name} ecosystem highlights`;
  })();

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Category</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{category.name}</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--muted-strong)]">{category.description}</p>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Category overview</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--muted)]">
              <p>{categoryContent?.intro[0] ?? `${category.name} is part of the modular infrastructure ecosystem and connects into broader power, cooling, hosting, deployment, and operations decisions.`}</p>
              <p>
                This segment matters because buyers rarely evaluate it in isolation. The strongest directories show where the category fits, which companies matter, and what adjacent infrastructure layers influence the decision.
              </p>
            </div>
            {overviewBullets.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {overviewBullets.map((item) => (
                  <div key={item} className="rounded-xl bg-[var(--card-soft)] p-4 text-sm leading-7 text-[var(--muted-strong)]">
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Ecosystem snapshot</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <SnapshotStat label="Companies" value={`${vendors.length}`} />
              <SnapshotStat label="Related guides" value={`${relatedGuides.length}`} />
              <SnapshotStat label="Related segments" value={`${adjacentCategories.length}`} />
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold text-white">{ecosystemLabel}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {trendingCompanies.map((vendor) => (
                  <Link key={vendor.slug} href={`/vendors/${vendor.slug}`} className="rounded-full bg-[var(--card-soft)] px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)]">
                    {vendor.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {featuredCompanies.length ? (
          <section className="mt-12">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Featured companies</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Recognizable companies and high-signal listings in this segment.</h2>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              {featuredCompanies.slice(0, 2).map((vendor) => (
                <article key={vendor.slug} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition hover:border-[var(--border-strong)]">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--card-soft)] text-sm font-semibold tracking-[0.12em] text-white">
                      {vendorGlyph(vendor.slug)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-white">{vendor.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{vendor.verified ? "Verified company" : "Featured listing"}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {vendor.categories.slice(0, 4).map((categorySlug) => (
                      <span key={categorySlug} className="rounded-full bg-[var(--card-soft)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                        {categories.find((entry) => entry.slug === categorySlug)?.name ?? categorySlug}
                      </span>
                    ))}
                  </div>
                  <Link href={`/vendors/${vendor.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">View company</Link>
                </article>
              ))}

              <div className="grid gap-4">
                {featuredCompanies.slice(2, 5).map((vendor) => (
                  <article key={vendor.slug} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
                    <h3 className="text-base font-semibold tracking-tight text-white">{vendor.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                    <Link href={`/vendors/${vendor.slug}`} className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]">View company</Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <aside className="space-y-6">
            {adjacentCategories.length ? (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Related categories</p>
                <div className="mt-4 grid gap-3">
                  {adjacentCategories.map((adjacent) => (
                    <Link key={adjacent.slug} href={`/directory/${adjacent.slug}`} className="rounded-xl bg-[var(--card-soft)] p-4 transition hover:bg-[#1c242d]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{adjacent.clusterLabel}</p>
                      <h3 className="mt-1 text-sm font-semibold text-white">{adjacent.name}</h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">{adjacent.vendorCount} companies</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {scenarioSection?.bullets?.length ? (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Ecosystem highlights</p>
                <div className="mt-4 grid gap-3">
                  {scenarioSection.bullets.slice(0, 4).map((item) => (
                    <div key={item} className="rounded-xl bg-[var(--card-soft)] p-4 text-sm leading-7 text-[var(--muted-strong)]">
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Related guides</p>
              <div className="mt-4 grid gap-3">
                {relatedGuides.map((guide) => (
                  <Link key={guide.slug} href={guide.slug} className="rounded-xl bg-[var(--card-soft)] p-4 text-sm font-medium text-white transition hover:bg-[#1c242d]">
                    {guide.title}
                  </Link>
                ))}
              </div>
            </section>
          </aside>

          <section>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Directory</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Browse the wider company set in this category.</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(directoryCompanies.length ? directoryCompanies : featuredCompanies).map((vendor) => (
                <article key={vendor.slug} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--card-soft)] text-sm font-semibold tracking-[0.12em] text-white">
                      {vendorGlyph(vendor.slug)}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-white">{vendor.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{vendor.verified ? "Verified company" : "Company listing"}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {vendor.categories.slice(0, 3).map((categorySlug) => (
                      <span key={categorySlug} className="rounded-full bg-[var(--card-soft)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                        {categories.find((entry) => entry.slug === categorySlug)?.name ?? categorySlug}
                      </span>
                    ))}
                  </div>
                  <Link href={`/vendors/${vendor.slug}`} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">View company</Link>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function SnapshotStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--card-soft)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}
