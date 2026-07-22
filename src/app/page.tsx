import Link from "next/link";
import { categories, vendors } from "@/lib/site-data";
import { getMainDomainRows } from "@/lib/main-domains";

const startPaths = [
  {
    eyebrow: "Directory",
    title: "Browse the structured infrastructure ecosystem",
    body: "Best when you want to scan categories, subcategories, and relevant adjacent infrastructure domains from one place.",
    href: "/directory",
    cta: "Open directory",
  },
  {
    eyebrow: "Compare",
    title: "Review selected research paths side by side",
    body: "Best when you want to compare infrastructure approaches or company options without jumping straight into one vendor profile.",
    href: "/compare",
    cta: "Open compare",
  },
  {
    eyebrow: "Categories",
    title: "Explore individual infrastructure domains",
    body: "Best when you already know the lane and want to dig into a specific category and its subcategories.",
    href: "/categories",
    cta: "Browse categories",
  },
];

const quickStarts = [
  { label: "Modular & prefab", href: "/directory/modular-prefab" },
  { label: "GPU hosting", href: "/directory/ai-colocation-gpu-hosting" },
  { label: "Liquid cooling", href: "/directory/liquid-cooling" },
  { label: "Power & electrical", href: "/directory/power-and-electrical" },
  { label: "Network fabric", href: "/directory/network-fabric-and-connectivity" },
  { label: "Site strategy", href: "/directory/site-selection-and-land-strategy" },
];

export default function Home() {
  const mainDomains = getMainDomainRows();
  const subcategoryCount = categories.filter((category) => category.parent_slug).length;
  const verifiedCompanyCount = vendors.filter((vendor) => vendor.verified).length;
  const featuredCompanies = vendors.filter((vendor) => vendor.featured).length;

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      <section>
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-10">
          <div className="rounded-[1.75rem] border border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(16,44,60,0.92),rgba(11,20,28,0.96))] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.28)] lg:p-8">
            <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8ed1e8]">Industry directory</p>
                <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Explore infrastructure categories, supplier profiles, and relevant adjacent domains.
                </h1>
                <p className="mt-5 max-w-3xl text-sm leading-8 text-[#d6dde6] sm:text-base">
                  MDC is a research and supplier-discovery surface for data center infrastructure. Start with the ecosystem,
                  narrow into categories, and move into company research as the question becomes more specific.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/directory" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#102c3c] transition hover:-translate-y-0.5">
                    Open directory
                  </Link>
                  <Link href="/compare" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40">
                    Compare paths
                  </Link>
                  <Link href="/categories" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40">
                    Browse categories
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard label="Main domains" value={String(mainDomains.length)} />
                <StatCard label="Subcategories" value={String(subcategoryCount)} />
                <StatCard label="Companies" value={String(vendors.length)} />
                <StatCard label="Verified companies" value={String(verifiedCompanyCount)} />
                <StatCard label="Featured profiles" value={String(featuredCompanies)} />
                <StatCard label="Best use" value="Research & discovery" />
              </div>
            </div>
          </div>

          <section className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Pick the right entry point</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Choose the surface that fits the research task.</h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">
                Use directory for broad ecosystem scanning, categories for domain-specific research, and compare for side-by-side review.
              </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {startPaths.map((path) => (
                <Link key={path.href} href={path.href} className="rounded-[1.25rem] border border-[var(--border)] bg-[#111820] p-5 transition hover:border-[var(--accent)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">{path.eyebrow}</p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">{path.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{path.body}</p>
                  <p className="mt-5 text-sm font-semibold text-white">{path.cta}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Quick starts</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Common places to begin infrastructure research.</h2>
              </div>
              <Link href="/vendors?sort=category_count" className="text-sm font-semibold text-[var(--accent)]">
                See all companies
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {quickStarts.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-full border border-[var(--border)] bg-[#111820] px-4 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Main domains</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Current top-level infrastructure domains.</h2>
              </div>
              <Link href="/categories" className="text-sm font-semibold text-[var(--accent)]">
                Open all categories
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {mainDomains.map((domain) => (
                <section key={domain.slug} className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold tracking-tight text-white">{domain.name}</h3>
                    <span className="text-[11px] font-medium text-[var(--muted)]">{domain.companyCount}</span>
                  </div>
                  <div className="mt-2 text-xs text-[var(--muted-strong)]">
                    <span>{domain.categoryCount} categories</span>
                    <span className="mx-1.5 text-[var(--muted)]">·</span>
                    <span>{domain.subcategoryCount} subcategories</span>
                  </div>
                  <div className="mt-4 space-y-1.5 text-[13px] leading-5">
                    {domain.categories.slice(0, 5).map((category) => (
                      <Link key={category.slug} href={`/directory/${category.slug}`} className="block text-[var(--muted-strong)] transition hover:text-white">
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8ed1e8]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </article>
  );
}
