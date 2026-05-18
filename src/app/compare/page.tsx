import Image from "next/image";
import Link from "next/link";

import { categories, getGuides, getMarkdownPageBySlug, vendors } from "@/lib/site-data";

const page = getMarkdownPageBySlug("/compare/");
const guides = getGuides();

const decisionPaths = [
  {
    title: "Need capacity quickly",
    body: "Start with colocation / GPU hosting options when timeline pressure matters more than owning every infrastructure layer.",
    categorySlugs: ["ai-colocation-gpu-hosting"],
  },
  {
    title: "Need long-term control",
    body: "Bias toward modular, power, cooling, and EPC combinations when the goal is control over deployment shape and operating model.",
    categorySlugs: ["modular-prefab", "power-and-electrical", "liquid-cooling", "epc-and-commissioning"],
  },
  {
    title: "Need a phased approach",
    body: "Compare hybrid paths that let teams combine near-term colo access with a longer-term modular or retrofit roadmap.",
    categorySlugs: ["ai-colocation-gpu-hosting", "modular-prefab", "liquid-cooling"],
  },
];

const comparisonChecks = [
  "Timeline pressure and deployment urgency",
  "Power, cooling, and density constraints",
  "Region, service area, and support coverage",
  "Project scale and implementation depth",
  "Need for design / EPC / commissioning support",
  "Whether you need shortlist speed or long-term infrastructure control",
];

const buyerPrompts = [
  "Compare categories first when the architecture path is still fuzzy.",
  "Compare vendors inside a category when you already know the deployment model.",
  "Use guides and adjacent categories to widen the market view before narrowing a shortlist.",
];

export default function ComparePage() {
  if (!page) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[1.5rem] border border-[var(--border)] bg-white p-8">
          <h1 className="text-4xl font-semibold tracking-tight">Compare</h1>
          <p className="mt-4 text-[var(--muted)]">Page content is not yet available.</p>
        </div>
      </main>
    );
  }

  const firstSection = page.sections[0];
  const remainingSections = page.sections.slice(1);
  const featuredGuides = guides.slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white shadow-[0_16px_40px_rgba(16,44,60,0.06)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Compare</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">{page.title}</h1>
              {page.intro.map((paragraph) => (
                <p key={paragraph} className="mt-4 max-w-3xl text-sm leading-8 text-[var(--muted)]">
                  {paragraph}
                </p>
              ))}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/categories/" className="inline-flex rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(16,44,60,0.18)]">
                  Explore Category Graph
                </Link>
                <Link href="/vendors/" className="inline-flex rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--accent)]">
                  Browse Vendors
                </Link>
                <Link href="/guides/" className="inline-flex rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--accent)]">
                  Read Guides
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <StatCard label="Vendors mapped" value={String(vendors.length)} />
                <StatCard label="Coverage categories" value={String(categories.length)} />
                <StatCard label="Buyer guides" value={String(guides.length)} />
              </div>
            </div>
            <div className="relative min-h-[320px] bg-[#102c3c]">
              <Image src="/compare-stack.svg" alt="Comparison decision stack graphic" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 lg:p-8">
            <div className="mb-5 rounded-[1.25rem] border border-[var(--border)] bg-[#f7fafc] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">How to use this page</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {buyerPrompts.map((prompt) => (
                  <div key={prompt} className="rounded-[1rem] border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--muted)]">
                    {prompt}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Comparison framework</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">{firstSection?.heading ?? "How to compare providers without guessing"}</h2>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-3 text-sm leading-7 text-[var(--muted)]">
                {(firstSection?.body ?? []).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {firstSection?.ordered?.length ? (
                  <ol className="mt-4 grid gap-2 text-sm leading-7 text-[var(--muted)]">
                    {firstSection.ordered.map((item, index) => (
                      <li key={item}>{index + 1}. {item}</li>
                    ))}
                  </ol>
                ) : null}
              </div>
              <div className="rounded-[1.25rem] bg-[#f7fafc] p-5">
                <p className="text-sm font-semibold text-[var(--foreground)]">What to weigh first</p>
                <ul className="mt-3 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                  {(firstSection?.bullets?.length ? firstSection.bullets : comparisonChecks).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,#102c3c_0%,#17394a_100%)] p-6 text-white lg:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8ed1e8]">Fastest useful path</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Use the market in layers, not all at once.</h2>
            <div className="mt-5 grid gap-3">
              <ProcessStep index={1} title="Pick the deployment path" body="Separate quick-capacity, long-term control, and hybrid paths before you compare brands." />
              <ProcessStep index={2} title="Shortlist by category fit" body="Use category coverage, project scale, and region to shrink the field to something useful." />
              <ProcessStep index={3} title="Expand into adjacent segments" body="Move into related categories and guides so the shortlist reflects the broader infrastructure market, not just one narrow lane." />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Decision paths</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Start with the buying situation, not the logo list.</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              This is where the site becomes more useful than a static list: it helps buyers choose how to compare, not just which company to click first.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {decisionPaths.map((path) => {
              const relatedCategories = categories.filter((category) => path.categorySlugs.includes(category.slug));
              const relatedVendors = vendors.filter((vendor) => vendor.categories.some((slug) => path.categorySlugs.includes(slug))).slice(0, 5);

              return (
                <article key={path.title} className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[0_10px_24px_rgba(16,44,60,0.04)]">
                  <h3 className="text-xl font-semibold tracking-tight">{path.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{path.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {relatedCategories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/directory/${category.slug}`}
                        className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-5 rounded-[1.25rem] bg-[#f7fafc] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Example vendors to start with</p>
                    <div className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
                      {relatedVendors.map((vendor) => (
                        <Link key={vendor.slug} href={`/vendors/${vendor.slug}`} className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]">
                          {vendor.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-white p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Category market map</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">See where the current directory is strongest.</h2>
            </div>
            <Link href="/directory" className="text-sm font-semibold text-[var(--accent)]">
              Browse full directory
            </Link>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {categories.map((category) => {
              const categoryVendors = vendors.filter((vendor) => vendor.categories.includes(category.slug));
              const featured = categoryVendors.filter((vendor) => vendor.featured).length;
              const verified = categoryVendors.filter((vendor) => vendor.verified).length;

              return (
                <div key={category.slug} className="rounded-[1.25rem] border border-[var(--border)] bg-[#fbfcfd] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">{category.name}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{category.description}</p>
                    </div>
                    <Link href={`/directory/${category.slug}`} className="text-sm font-semibold text-[var(--accent)]">
                      Open category →
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Vendors" value={String(categoryVendors.length)} />
                    <MiniStat label="Featured" value={String(featured)} />
                    <MiniStat label="Verified" value={String(verified)} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
                    {categoryVendors.slice(0, 5).map((vendor) => (
                      <Link key={vendor.slug} href={`/vendors/${vendor.slug}`} className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)]">
                        {vendor.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Guide-led comparison</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Use the guides to sharpen the shortlist.</h2>
            <div className="mt-5 grid gap-4">
              {featuredGuides.map((guide) => (
                <Link key={guide.slug} href={guide.slug} className="rounded-[1.25rem] border border-[var(--border)] bg-[#f7fafc] p-4 transition hover:border-[var(--accent)]">
                  <p className="text-base font-semibold tracking-tight text-[var(--foreground)]">{guide.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{guide.page.intro[0] ?? "Open the guide for comparison context and key buying checks."}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--accent-strong)] p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b8cfdb]">Next action</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Turn research into a stronger market map.</h2>
            <p className="mt-4 text-sm leading-8 text-[#dbe5eb]">
              Once a buyer has a rough path in mind, the highest-value move is widening the comparison set, surfacing adjacent systems, and making the shortlist smarter before outreach.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/categories" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--accent-strong)]">
                Open category graph
              </Link>
              <Link href="/for-vendors" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white">
                Vendor participation
              </Link>
            </div>
          </div>
        </section>

        {remainingSections.length > 0 ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {remainingSections.map((section) => (
              <article key={section.heading} className="rounded-[1.25rem] border border-[var(--border)] bg-white p-6">
                <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
                <div className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {section.body.map((line) => (
                    <p key={line} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
                  {section.bullets.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {section.ordered.length > 0 ? (
                    <ol className="mt-3 list-decimal space-y-2 pl-5">
                      {section.ordered.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-[var(--border)] bg-[#f7fafc] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--border)] bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-base font-semibold tracking-tight text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function ProcessStep({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ed1e8]">Step {index}</p>
      <h3 className="mt-2 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#dbe5eb]">{body}</p>
    </div>
  );
}
