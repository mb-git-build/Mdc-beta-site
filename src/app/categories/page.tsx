import Link from "next/link";
import {
  categories,
  getMarkdownCategoryBySlug,
  getVendorsForCategory,
  vendors,
} from "@/lib/site-data";

const simpleGroups = [
  {
    title: "Facility formats",
    slugs: ["modular-prefab", "containerized-data-centers", "edge-micro-data-centers", "ai-colocation-gpu-hosting", "bare-metal-and-hpc-hosting"],
  },
  {
    title: "Cooling & thermal",
    slugs: ["liquid-cooling", "immersion-cooling", "rear-door-and-direct-chip-cooling", "hvac-and-thermal-rejection", "rack-power-density"],
  },
  {
    title: "Power & electrical",
    slugs: ["power-and-electrical", "ups-and-battery-storage", "generators-and-microgrids", "switchgear-and-pdus", "racks-cabinets-and-enclosures"],
  },
  {
    title: "Delivery & integration",
    slugs: ["epc-and-commissioning", "design-and-engineering", "construction-and-integration", "commissioning-and-operations", "supply-chain-and-logistics"],
  },
  {
    title: "Controls & networking",
    slugs: ["dcim-and-monitoring", "orchestration-and-automation", "network-fabric-and-connectivity", "physical-security-and-fire-protection"],
  },
  {
    title: "Land, energy & policy",
    slugs: ["sustainability-and-energy-strategy", "site-selection-and-land-strategy", "permits-incentives-and-policy"],
  },
];

export default function CategoriesPage() {
  const categoryRows = categories.map((category) => {
    const vendorCount = getVendorsForCategory(category.slug).length;
    const categoryMarkdown = getMarkdownCategoryBySlug(category.slug);

    return {
      ...category,
      vendorCount,
      blurb:
        categoryMarkdown?.intro[0] ??
        categoryMarkdown?.sections.find((section) => section.heading === "What to compare")?.bullets[0] ??
        category.description,
    };
  });

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Categories</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">A cleaner category directory for data center infrastructure.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">
            This page is meant to feel like a browsable index, not a presentation deck. Pick a category, see how many vendor profiles are inside it, and move on quickly.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatTile label="Categories" value={String(categories.length)} />
            <StatTile label="Vendor profiles" value={String(vendors.length)} />
            <StatTile label="Best next step" value="Open a category" />
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <Link href="/directory" className="rounded-[1.4rem] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--accent)]">
            <h2 className="text-lg font-semibold tracking-tight">Open the main directory</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Use search and sorting to scan the full site structure faster.</p>
          </Link>
          <Link href="/vendors" className="rounded-[1.4rem] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--accent)]">
            <h2 className="text-lg font-semibold tracking-tight">Go straight to vendors</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Skip category browsing and jump directly into supplier listings.</p>
          </Link>
          <Link href="/guides" className="rounded-[1.4rem] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--accent)]">
            <h2 className="text-lg font-semibold tracking-tight">Read guides</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Use explainers when you need context before narrowing vendors.</p>
          </Link>
        </section>

        <section className="mt-10 space-y-8">
          {simpleGroups.map((group) => {
            const rows = categoryRows.filter((category) => group.slugs.includes(category.slug));
            if (rows.length === 0) return null;

            return (
              <section key={group.title} className="rounded-[1.6rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Category group</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">{group.title}</h2>
                  </div>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">Simple grouped navigation so visitors can find the right area without wading through visual noise.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {rows.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/directory/${category.slug}`}
                      className="rounded-[1.3rem] border border-[var(--border)] bg-[#fbfcfd] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
                    >
                      <h3 className="text-lg font-semibold tracking-tight">{category.name}</h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
                      <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">{category.vendorCount} vendor profiles</p>
                      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">{category.blurb}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--border)] bg-[#f8fbfd] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--foreground)]">{value}</p>
    </div>
  );
}
