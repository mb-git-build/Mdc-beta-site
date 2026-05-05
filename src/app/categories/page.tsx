import Link from "next/link";
import {
  categories,
  getMarkdownPageBySlug,
  getMarkdownCategoryBySlug,
  getVendorsForCategory,
  vendors,
} from "@/lib/site-data";
import { categoryGlyph, slugToAccent } from "@/lib/visuals";

const page = getMarkdownPageBySlug("/categories");

const graphBands = [
  {
    title: "Facility Formats",
    description: "Deployment models and hosting environments where buyers first decide what shape the infrastructure should take.",
    slugs: ["modular-prefab", "containerized-data-centers", "edge-micro-data-centers", "ai-colocation-gpu-hosting", "bare-metal-and-hpc-hosting"],
  },
  {
    title: "Cooling & Thermal",
    description: "Thermal systems for high-density AI, edge, and modular environments where heat rejection becomes a site-selection constraint.",
    slugs: ["liquid-cooling", "immersion-cooling", "rear-door-and-direct-chip-cooling", "hvac-and-thermal-rejection", "rack-power-density"],
  },
  {
    title: "Power & Electrical",
    description: "Utility interconnect, backup power, distribution, storage, and rack-level electrical layers that decide whether a project can scale.",
    slugs: ["power-and-electrical", "ups-and-battery-storage", "generators-and-microgrids", "switchgear-and-pdus", "racks-cabinets-and-enclosures"],
  },
  {
    title: "Delivery & Integration",
    description: "The engineering, construction, commissioning, and logistics layers that turn equipment choices into deployable capacity.",
    slugs: ["epc-and-commissioning", "design-and-engineering", "construction-and-integration", "commissioning-and-operations", "supply-chain-and-logistics"],
  },
  {
    title: "Operations, Controls & Network",
    description: "Software, monitoring, security, automation, and network fabric categories that keep deployed sites visible and manageable.",
    slugs: ["dcim-and-monitoring", "orchestration-and-automation", "network-fabric-and-connectivity", "physical-security-and-fire-protection"],
  },
  {
    title: "Energy, Land & Policy",
    description: "Upstream constraints that increasingly shape data center feasibility before equipment selection even starts.",
    slugs: ["sustainability-and-energy-strategy", "site-selection-and-land-strategy", "permits-incentives-and-policy"],
  },
];

const sourcingPaths = [
  {
    title: "Launch a modular AI site",
    description: "Follow the chain from site feasibility to packaged capacity, dense power, cooling, and operational visibility.",
    slugs: ["site-selection-and-land-strategy", "modular-prefab", "power-and-electrical", "liquid-cooling", "dcim-and-monitoring"],
  },
  {
    title: "Retrofit for high-density racks",
    description: "Start with rack-level constraints, then branch into electrical distribution, direct cooling, heat rejection, and commissioning.",
    slugs: ["rack-power-density", "switchgear-and-pdus", "rear-door-and-direct-chip-cooling", "hvac-and-thermal-rejection", "commissioning-and-operations"],
  },
  {
    title: "Stand up distributed edge capacity",
    description: "Map the small-format deployment stack from enclosures and micro sites through network, security, logistics, and automation.",
    slugs: ["edge-micro-data-centers", "racks-cabinets-and-enclosures", "network-fabric-and-connectivity", "physical-security-and-fire-protection", "orchestration-and-automation"],
  },
];

export default function CategoriesPage() {
  const introBullets = page?.sections.find((section) => section.heading === "Featured categories");
  const usageBullets = page?.sections.find((section) => section.heading === "What this section means");

  const categoriesWithVendors = categories.map((category) => {
    const vendorCount = getVendorsForCategory(category.slug).length;
    const categoryMarkdown = getMarkdownCategoryBySlug(category.slug);

    return {
      ...category,
      vendorCount,
      blurb:
        categoryMarkdown?.sections.find((section) => section.heading === "What to compare")?.bullets.slice(0, 2).join("  ") ??
        categoryMarkdown?.intro[0] ??
        category.description,
    };
  });

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#edf4f8_100%)] p-8 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Category Graph</p>
          <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight sm:text-5xl">A wide, scalable map of data center infrastructure supply.</h1>
          {page?.intro.map((paragraph) => (
            <p key={paragraph} className="mt-5 max-w-4xl text-sm leading-7 text-[var(--muted)]">
              {paragraph}
            </p>
          ))}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatTile label="Live categories" value={String(categories.length)} />
            <StatTile label="Visible vendors" value={String(vendors.length)} />
            <StatTile label="Expansion model" value="Add new segments without redesign" />
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <h2 className="text-xl font-semibold tracking-tight">How this graph is structured</h2>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
              {usageBullets?.bullets.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-[var(--border)] bg-[#102c3c] p-6 text-white shadow-[0_22px_50px_rgba(16,44,60,0.14)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8ed1e8]">Coverage model</p>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-[#dbe5eb]">
              {introBullets?.bullets.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-10 space-y-8">
          {graphBands.map((band) => {
            const bandCategories = categoriesWithVendors.filter((category) => band.slugs.includes(category.slug));
            if (bandCategories.length === 0) return null;

            return (
              <section key={band.title} className="rounded-[1.75rem] border border-[var(--border)] bg-white p-6 shadow-[0_20px_40px_rgba(16,44,60,0.04)]">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Graph band</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">{band.title}</h2>
                  </div>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
                    {band.description} Explore adjacent categories inside the same sourcing layer, then branch into vendors, guides, and neighboring systems.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {bandCategories.map((category) => {
                    const tone = slugToAccent(category.slug);
                    return (
                      <Link
                        key={category.slug}
                        href={`/directory/${category.slug}`}
                        className="group overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_22px_44px_rgba(16,44,60,0.08)]"
                      >
                        <div className="p-6 text-white" style={{ background: tone.gradient }}>
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Category</p>
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl transition group-hover:scale-105">
                              {categoryGlyph(category.slug)}
                            </span>
                          </div>
                          <h3 className="mt-4 text-xl font-semibold tracking-tight">{category.name}</h3>
                        </div>
                        <div className="p-6">
                          <p className="text-sm leading-7 text-[var(--muted)]">{category.description}</p>
                          <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                            <span className="font-semibold text-[var(--foreground)]">{category.vendorCount} vendor profiles</span>
                            <span className="text-[var(--accent)]">Explore</span>
                          </div>
                          {category.blurb ? <p className="mt-4 text-xs leading-6 text-[var(--muted)]">{category.blurb}</p> : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-[var(--border)] bg-white p-6 shadow-[0_20px_44px_rgba(16,44,60,0.05)]">
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Sourcing paths</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Turn the category graph into practical buying routes.</h2>
            </div>
            <p className="text-sm leading-7 text-[var(--muted)]">
              Buyers rarely compare one isolated category. These path cards make the map feel actionable by showing which segments tend to be researched together for common infrastructure programs.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {sourcingPaths.map((path) => {
              const pathCategories = path.slugs
                .map((slug) => categoriesWithVendors.find((category) => category.slug === slug))
                .filter((category): category is (typeof categoriesWithVendors)[number] => Boolean(category));

              return (
                <article key={path.title} className="rounded-[1.5rem] border border-[var(--border)] bg-[#f7fafc] p-5">
                  <h3 className="text-lg font-semibold tracking-tight">{path.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{path.description}</p>
                  <ol className="mt-5 space-y-3">
                    {pathCategories.map((category, index) => (
                      <li key={category.slug} className="flex gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[var(--accent)] ring-1 ring-[var(--border)]">
                          {index + 1}
                        </span>
                        <div>
                          <Link href={`/directory/${category.slug}`} className="text-sm font-semibold text-[var(--foreground)] transition hover:text-[var(--accent)]">
                            {category.name}
                          </Link>
                          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{category.vendorCount} vendor profiles in this segment</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(180deg,#0f2230_0%,#14384d_100%)] p-8 text-white shadow-[0_22px_50px_rgba(16,44,60,0.18)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8ed1e8]">Keep expanding the graph</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Designed for wide adjacency, not a one-time taxonomy.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#dbe5eb]">
                New segments can keep getting layered in across bitcoin data center infrastructure, AI factories, energy systems, rental fleets, colo ecosystems, operations software, logistics networks, land strategy, and whatever adjacent category turns out to matter next.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/vendors" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#102c3c] transition hover:-translate-y-0.5">
                Browse vendors
              </Link>
              <Link href="/guides" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8">
                Read guides
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--foreground)]">{value}</p>
    </div>
  );
}
