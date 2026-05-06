import Link from "next/link";
import { categories, getVendorsForCategory } from "@/lib/site-data";

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
  {
    title: "All categories",
    slugs: categories.map((category) => category.slug),
  },
];

export default function CategoriesPage() {
  const shown = new Set<string>();

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Categories</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Browse infrastructure categories.</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--muted-strong)]">
            Explore the modular infrastructure ecosystem by segment, with company counts and direct paths into each category directory.
          </p>
        </section>

        <section className="mt-12 space-y-12">
          {featuredGroups.map((group) => {
            const rows = group.slugs
              .map((slug) => categories.find((category) => category.slug === slug))
              .filter((category): category is NonNullable<(typeof categories)[number]> => Boolean(category))
              .filter((category) => {
                if (group.title === "All categories" && shown.has(category.slug)) {
                  return false;
                }
                shown.add(category.slug);
                return true;
              })
              .map((category) => ({
                ...category,
                companies: getVendorsForCategory(category.slug),
              }));

            if (!rows.length) return null;

            return (
              <section key={group.title}>
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold tracking-tight text-white">{group.title}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {rows.map((category) => (
                    <Link key={category.slug} href={`/directory/${category.slug}`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--border-strong)]">
                      <h3 className="text-base font-semibold tracking-tight text-white">{category.name}</h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
                      <p className="mt-4 text-sm font-medium text-[var(--muted-strong)]">{category.companies.length} companies</p>
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
          })}
        </section>
      </div>
    </main>
  );
}
