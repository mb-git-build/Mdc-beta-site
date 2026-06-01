import Link from "next/link";
import { categories, getCategoryLineage, getVendorsForCategory } from "@/lib/site-data";

type CategoryGroup = {
  title: string;
  description: string;
  slugs: string[];
};

const featuredGroups = [
  {
    title: "Featured categories",
    slugs: [
      "modular-prefab",
      "containerized-data-centers",
      "ai-colocation-gpu-hosting",
      "immersion-cooling",
      "power-and-electrical",
      "edge-micro-data-centers",
      "generators-and-microgrids",
      "liquid-cooling",
    ],
  },
];

const categoryGroups: CategoryGroup[] = [
  {
    title: "Compute delivery & deployment models",
    description: "Start here when the first question is how capacity gets delivered: modular builds, containerized systems, hosted GPU environments, and distributed edge footprints.",
    slugs: [
      "modular-prefab",
      "containerized-data-centers",
      "ai-colocation-gpu-hosting",
      "managed-ai-colocation",
      "bare-metal-and-hpc-hosting",
      "edge-micro-data-centers",
    ],
  },
  {
    title: "Cooling & thermal infrastructure",
    description: "Trace the thermal stack from liquid and immersion approaches through rejection, control, and density-specific upgrade paths.",
    slugs: [
      "liquid-cooling",
      "direct-to-chip-cooling",
      "liquid-loop-systems",
      "rear-door-direct-to-chip-cooling",
      "immersion-cooling",
      "single-phase-immersion",
      "two-phase-immersion",
      "thermal-optimization-controls",
      "hvac-and-thermal-rejection",
    ],
  },
  {
    title: "Power, resiliency & electrical backbone",
    description: "Use this lane when utility access, rack power, resilience, and packaged electrical delivery are the gating factors.",
    slugs: [
      "power-and-electrical",
      "switchgear-pdu-busway",
      "modular-substations",
      "ats-and-transfer-systems",
      "power-monitoring-and-energy-management",
      "high-density-rack-power",
      "ups-and-battery-storage",
      "generators-and-microgrids",
      "microgrid-controls-and-integration",
      "prefabricated-power-blocks",
    ],
  },
  {
    title: "Delivery, integration & operations",
    description: "Follow the companies that turn plans into working infrastructure: EPC, trades, integration, commissioning, field support, and logistics.",
    slugs: [
      "epc-and-commissioning",
      "construction-and-integration",
      "commissioning-and-operations",
      "field-services-and-maintenance",
      "electrical-integration-services",
      "infrastructure-logistics",
      "supply-chain-and-logistics",
    ],
  },
  {
    title: "Controls, software & monitoring",
    description: "Map the visibility and orchestration layers that sit on top of physical infrastructure and help dense environments run predictably.",
    slugs: [
      "monitoring-and-controls",
      "dcim-and-observability",
      "network-fabric-and-connectivity",
      "orchestration-and-automation",
    ],
  },
  {
    title: "Site strategy, risk & long-horizon planning",
    description: "Open this lane when the real work is site selection, permitting, security posture, energy strategy, and early design framing.",
    slugs: [
      "site-selection-and-land-strategy",
      "sustainability-and-energy-strategy",
      "permits-incentives-and-policy",
      "physical-security-and-fire-protection",
      "design-and-engineering",
      "fabricated-enclosures-and-shells",
    ],
  },
];

function buildRows(slugs: string[]) {
  return slugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is NonNullable<(typeof categories)[number]> => Boolean(category))
    .map((category) => ({
      ...category,
      companies: getVendorsForCategory(category.slug),
      lineage: getCategoryLineage(category.slug),
    }));
}

function GroupCard({
  title,
  description,
  rows,
}: {
  title: string;
  description?: string;
  rows: ReturnType<typeof buildRows>;
}) {
  if (!rows.length) {
    return null;
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{description}</p> : null}
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted-strong)]">
          {rows.length} categories · {rows.reduce((sum, row) => sum + row.companies.length, 0)} connected companies
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((category) => (
          <Link key={category.slug} href={`/directory/${category.slug}`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              <span>{category.layer === "subcategory" ? "Subcategory" : "Category"}</span>
              {category.lineage.parent ? <span>{category.lineage.parent.name}</span> : null}
            </div>
            <h3 className="mt-2 text-base font-semibold tracking-tight text-white">{category.name}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-[var(--muted-strong)]">{category.companies.length} companies</p>
              {category.lineage.children.length ? (
                <p className="text-xs text-[var(--muted)]">{category.lineage.children.length} subcategories</p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              {category.companies.slice(0, 4).map((company) => (
                <span key={company.slug} className="rounded-full bg-[var(--card-soft)] px-2.5 py-1">
                  {company.name}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function CategoriesPage() {
  const featuredRows = buildRows(featuredGroups[0].slugs);

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Categories</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Browse infrastructure categories as a real ecosystem.</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--muted-strong)]">
            Explore the modular infrastructure market by functional lane instead of one undifferentiated list. Start with the bottleneck you are solving, then widen into adjacent systems and vendor sets.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Start here when</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">You know the infrastructure problem, but not yet which segment, vendor set, or dependency chain should frame the search.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Best next step</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">Open a lane, compare a few categories inside it, then jump into company pages or adjacent layers that usually move with the same deployment decision.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Need a guided path?</p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">Use the market map if you want buyer-oriented exploration flows instead of a taxonomy-first browse.</p>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-12">
          <GroupCard title={featuredGroups[0].title} rows={featuredRows} />

          {categoryGroups.map((group) => (
            <GroupCard key={group.title} title={group.title} description={group.description} rows={buildRows(group.slugs)} />
          ))}
        </section>
      </div>
    </main>
  );
}
