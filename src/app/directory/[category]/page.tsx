import Image from "next/image";
import Link from "next/link";
import {
  categories,
  getCategory,
  getCategoryLineage,
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

type DecisionFrame = {
  title: string;
  body: string;
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

const decisionFramesByCategory: Record<string, DecisionFrame[]> = {
  "modular-prefab": [
    { title: "Open this when", body: "You want faster time-to-capacity and need to understand which power, cooling, and integration layers travel with a modular build." },
    { title: "Compare against", body: "Traditional site build, hosted GPU capacity, and phased hybrid approaches where near-term speed and long-term control compete." },
    { title: "Do not stop here", body: "Widen immediately into prefab power, cooling, construction, logistics, and commissioning before you shortlist suppliers." },
  ],
  "ai-colocation-gpu-hosting": [
    { title: "Open this when", body: "You need capacity quickly, want an operating environment instead of building from scratch, or need a bridge before longer-term deployment." },
    { title: "Compare against", body: "Modular deployment and phased hybrid paths where control, cost structure, and speed to capacity need to be weighed together." },
    { title: "Do not stop here", body: "Check adjacent power, cooling, and siting layers so hosted capacity is compared against what a build path would actually require." },
  ],
  "liquid-cooling": [
    { title: "Open this when", body: "Your density target or GPU profile has already pushed you beyond conventional air assumptions." },
    { title: "Compare against", body: "Rear-door, direct-to-chip, immersion, and supporting thermal rejection or controls paths before locking on one cooling narrative." },
    { title: "Do not stop here", body: "Widen into rack power, monitoring, commissioning, and thermal plant categories so the shortlist reflects the full operating stack." },
  ],
  "power-and-electrical": [
    { title: "Open this when", body: "Utility access, resilience, rack power, energization, or delivery speed is the real gating factor in the project." },
    { title: "Compare against", body: "On-site generation bridges, prefab power packages, ATS / switchgear paths, and hosting alternatives when utility delay is severe." },
    { title: "Do not stop here", body: "Widen into substations, microgrids, commissioning, and site-selection context before assuming the power answer lives in one vendor lane." },
  ],
  "rear-door-direct-to-chip-cooling": [
    { title: "Open this when", body: "You are evaluating retrofit density upgrades and need a more incremental thermal path than a full immersion shift." },
    { title: "Compare against", body: "Liquid cooling and immersion paths where density, operational disruption, and plant complexity trade off differently." },
    { title: "Do not stop here", body: "Widen into rack power, controls, construction, and operations so the retrofit plan is not evaluated as a cooling-only decision." },
  ],
  "generators-and-microgrids": [
    { title: "Open this when", body: "Constrained utility power, resilience requirements, or behind-the-meter strategy may determine whether deployment is feasible at all." },
    { title: "Compare against", body: "Grid-first, bridge-power, and packaged-generation approaches depending on schedule pressure and operating model." },
    { title: "Do not stop here", body: "Widen into UPS, site selection, sustainability, and electrical integration before you assume generation solves the whole problem." },
  ],
};

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
    .slice(0, 6)
    .map((item) => ({
      ...item,
      vendorCount: getVendorsForCategory(item.slug).length,
      clusterLabel: ownCluster?.label ?? "Related",
    }));
}

function getDecisionFrames(categorySlug: string, categoryDescription: string): DecisionFrame[] {
  const frames = decisionFramesByCategory[categorySlug];

  if (frames?.length) {
    return frames;
  }

  return [
    {
      title: "Open this when",
      body: `This category becomes useful when ${categoryDescription.charAt(0).toLowerCase()}${categoryDescription.slice(1)}`,
    },
    {
      title: "Compare against",
      body: "Use adjacent categories and related guides to decide whether this is the right path or just one layer inside a broader deployment choice.",
    },
    {
      title: "Do not stop here",
      body: "Widen into neighboring facility, thermal, power, delivery, and operations layers before narrowing to a vendor shortlist.",
    },
  ];
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
  const ecosystemMapSection = categoryContent?.sections.find((section) => section.heading === "Ecosystem map");
  const deploymentStacksSection = categoryContent?.sections.find((section) => section.heading === "Operational deployment stacks");
  const vendors = getVendorsForCategory(categorySlug);
  const relatedGuides = getRelatedGuides(category.slug);
  const adjacentCategories = getAdjacentCategories(category.slug);
  const lineage = getCategoryLineage(category.slug);
  const decisionFrames = getDecisionFrames(category.slug, category.description);

  const featuredCompanies = vendors.slice(0, Math.min(6, vendors.length));
  const directoryCompanies = vendors.slice(featuredCompanies.length);
  const quickPoints = [
    ...(compareSection?.bullets ?? []),
    ...(ecosystemMapSection?.bullets ?? []),
    ...(deploymentStacksSection?.body ?? []),
  ].slice(0, 6);
  const childCategories = lineage.children.map((child) => ({
    ...child,
    vendorCount: getVendorsForCategory(child.slug).length,
  }));
  const siblingCategories = lineage.parent
    ? getCategoryLineage(lineage.parent.slug).children
        .filter((child) => child.slug !== category.slug)
        .map((child) => ({
          ...child,
          vendorCount: getVendorsForCategory(child.slug).length,
        }))
    : [];

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Category</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{category.name}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">{category.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Companies</p>
              <p className="mt-2 text-lg font-semibold text-white">{vendors.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Guides</p>
              <p className="mt-2 text-lg font-semibold text-white">{relatedGuides.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Related</p>
              <p className="mt-2 text-lg font-semibold text-white">{adjacentCategories.length}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Decision frame</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">When this category matters in the decision process</h2>
            </div>
            <Link href="/compare" className="text-sm font-semibold text-[var(--accent)]">
              Open executive workflows
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {decisionFrames.map((frame) => (
              <article key={frame.title} className="rounded-2xl border border-[var(--border)] bg-[#1a2129] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">{frame.title}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{frame.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Featured companies</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Key companies in this segment</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredCompanies.length ? (
                featuredCompanies.map((vendor, index) => (
                  <article
                    key={vendor.slug}
                    className={`rounded-2xl border border-[var(--border-strong)] bg-[#1a2129] p-5 transition hover:border-[#5e7285] ${index < 2 ? "md:p-6" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white text-sm font-semibold tracking-[0.12em] text-[#0f141a]">
                        {vendor.logo_url ? (
                          <Image src={vendor.logo_url} alt={`${vendor.name} logo`} width={48} height={48} className="h-full w-full object-contain p-1.5" unoptimized />
                        ) : (
                          vendorGlyph(vendor.slug)
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold tracking-tight text-white">{vendor.name}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">{vendor.verified ? "Verified company" : "Company listing"}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">{vendor.headline}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {vendor.categories.slice(0, 3).map((categorySlug) => (
                        <span key={categorySlug} className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                          {categories.find((entry) => entry.slug === categorySlug)?.name ?? categorySlug}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <Link href={`/vendors/${vendor.slug}`} className="text-sm font-semibold text-[var(--accent)]">View company</Link>
                      <a href={vendor.website_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white/85">
                        Visit
                      </a>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
                  No companies are currently listed in this category yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Quick scan</p>
              <div className="mt-4 grid gap-3">
                {(quickPoints.length ? quickPoints : [categoryContent?.intro[0] ?? category.description]).map((item) => (
                  <div key={item} className="rounded-xl bg-[#1a2129] p-4 text-sm leading-7 text-[var(--muted-strong)]">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            {lineage.parent ? (
              <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Parent category</p>
                <div className="mt-4 grid gap-3">
                  <Link href={`/directory/${lineage.parent.slug}`} className="rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 transition hover:border-[#5e7285]">
                    <h3 className="text-sm font-semibold text-white">{lineage.parent.name}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">Return to the broader segment</p>
                  </Link>
                </div>
              </section>
            ) : null}

            {childCategories.length ? (
              <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Explore subcategories</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {childCategories.map((child) => (
                    <Link key={child.slug} href={`/directory/${child.slug}`} className="rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 transition hover:border-[#5e7285]">
                      <h3 className="text-sm font-semibold text-white">{child.name}</h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">{child.vendorCount} companies</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {siblingCategories.length ? (
              <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Related subcategories</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {siblingCategories.map((sibling) => (
                    <Link key={sibling.slug} href={`/directory/${sibling.slug}`} className="rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 transition hover:border-[#5e7285]">
                      <h3 className="text-sm font-semibold text-white">{sibling.name}</h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">{sibling.vendorCount} companies</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {adjacentCategories.length ? (
              <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Related categories</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {adjacentCategories.map((adjacent) => (
                    <Link key={adjacent.slug} href={`/directory/${adjacent.slug}`} className="rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 transition hover:border-[#5e7285]">
                      <h3 className="text-sm font-semibold text-white">{adjacent.name}</h3>
                      <p className="mt-1 text-xs text-[var(--muted)]">{adjacent.vendorCount} companies</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Directory</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Browse more companies in this category</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(directoryCompanies.length ? directoryCompanies : featuredCompanies).map((vendor) => (
                <article key={vendor.slug} className="rounded-2xl border border-[var(--border-strong)] bg-[#1a2129] p-5 transition hover:border-[#5e7285]">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white text-sm font-semibold tracking-[0.12em] text-[#0f141a]">
                      {vendor.logo_url ? (
                        <Image src={vendor.logo_url} alt={`${vendor.name} logo`} width={44} height={44} className="h-full w-full object-contain p-1.5" unoptimized />
                      ) : (
                        vendorGlyph(vendor.slug)
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-tight text-white">{vendor.name}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{vendor.verified ? "Verified company" : "Company listing"}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">{vendor.headline}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <Link href={`/vendors/${vendor.slug}`} className="text-sm font-semibold text-[var(--accent)]">View company</Link>
                    <a href={vendor.website_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white/85">
                      Visit
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Related guides</p>
              <div className="mt-4 grid gap-3">
                {relatedGuides.map((guide) => (
                  <Link key={guide.slug} href={guide.slug} className="rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 text-sm font-medium text-white transition hover:border-[#5e7285]">
                    {guide.title}
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Browse pathways</p>
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 text-sm leading-7 text-[var(--muted-strong)]">
                Best next move: review a few companies here, then widen the decision set through related categories and guides before narrowing to outreach.
              </div>
              <div className="mt-4 grid gap-3">
                <Link href="/compare" className="rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 text-sm font-medium text-white transition hover:border-[#5e7285]">
                  Open decision paths
                </Link>
                <Link href="/categories" className="rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 text-sm font-medium text-white transition hover:border-[#5e7285]">
                  Explore all categories
                </Link>
                <Link href="/vendors" className="rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 text-sm font-medium text-white transition hover:border-[#5e7285]">
                  Browse all companies
                </Link>
                <Link href="/guides" className="rounded-xl border border-[var(--border)] bg-[#1a2129] p-4 text-sm font-medium text-white transition hover:border-[#5e7285]">
                  Read infrastructure guides
                </Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
