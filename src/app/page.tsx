import Link from "next/link";
import { categories, getGuides, getFeaturedVendors, getMarkdownPageBySlug } from "@/lib/site-data";

const page = getMarkdownPageBySlug("/");
const featuredVendors = getFeaturedVendors().slice(0, 6);
const guides = getGuides().slice(0, 4);

const quickPaths = [
  {
    title: "Browse by category",
    body: "Start with power, cooling, modular builds, controls, networking, or operations.",
    href: "/categories",
    cta: "Explore categories",
  },
  {
    title: "Browse vendors",
    body: "Open supplier profiles directly and compare offerings across multiple infrastructure segments.",
    href: "/vendors",
    cta: "View vendors",
  },
  {
    title: "Use the directory",
    body: "Move through the site like a clean link directory with search, sorting, and category shortcuts.",
    href: "/directory",
    cta: "Open directory",
  },
];

const featuredGroups = [
  {
    title: "Power & electrical",
    description: "UPS, switchgear, generators, distribution, batteries, and rack power infrastructure.",
    href: "/directory/power-and-electrical",
  },
  {
    title: "Cooling & thermal",
    description: "Liquid cooling, immersion, HVAC, heat rejection, and high-density thermal management.",
    href: "/directory/liquid-cooling",
  },
  {
    title: "Modular & edge",
    description: "Prefab systems, edge deployments, containerized capacity, and compact site formats.",
    href: "/directory/modular-prefab",
  },
  {
    title: "Monitoring & operations",
    description: "DCIM, automation, controls, commissioning, and the tools that keep sites visible.",
    href: "/directory/dcim-and-monitoring",
  },
];

export default function Home() {
  const bodyIntro =
    page?.intro.filter((paragraph) => !paragraph.startsWith("Primary CTA:") && !paragraph.startsWith("Secondary CTA:")) ?? [];

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="border-b border-[var(--border)] bg-[linear-gradient(180deg,#f9fbfd_0%,#eef4f7_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-14">
          <div className="max-w-4xl rounded-[2rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)] lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Infrastructure supplier directory</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              A cleaner way to browse data center infrastructure categories and vendors.
            </h1>
            {(bodyIntro.length > 0 ? bodyIntro : ["Use the site like a practical directory: pick a category, open vendor profiles, and move through the market without visual overload."]).map((paragraph) => (
              <p key={paragraph} className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted-strong)]">
                {paragraph}
              </p>
            ))}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/directory" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(16,44,60,0.14)] transition hover:-translate-y-0.5">
                Browse directory
              </Link>
              <Link href="/categories" className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]">
                Explore categories
              </Link>
              <Link href="/vendors" className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]">
                View vendors
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <QuickStat label="Categories" value={String(categories.length)} />
              <QuickStat label="Featured vendors" value={String(featuredVendors.length)} />
              <QuickStat label="Guides" value={String(guides.length)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {quickPaths.map((item) => (
            <article key={item.title} className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Start here</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
              <Link href={item.href} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                {item.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Popular sections</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Browse the site by the way people actually search.</h2>
            </div>
            <Link href="/categories" className="text-sm font-semibold text-[var(--accent)]">
              See all categories
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredGroups.map((group) => (
              <Link
                key={group.title}
                href={group.href}
                className="rounded-[1.4rem] border border-[var(--border)] bg-[#f9fbfc] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
              >
                <h3 className="text-lg font-semibold tracking-tight">{group.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{group.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Featured vendors</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">A simple way to jump into supplier profiles.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Open a few listings, scan categories, compare positioning, and move on. Less decoration, more useful browsing.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {featuredVendors.map((vendor) => (
                <article key={vendor.slug} className="rounded-[1.35rem] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]">
                  <h3 className="text-lg font-semibold tracking-tight">{vendor.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{vendor.headline}</p>
                  <Link href={`/vendors/${vendor.slug}`} className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)]">
                    View profile
                  </Link>
                </article>
              ))}
            </div>
            <div className="mt-5">
              <Link href="/vendors" className="text-sm font-semibold text-[var(--accent)]">
                Browse the full vendor directory
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Guides</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Useful reading without getting in the way.</h2>
            <div className="mt-5 grid gap-4">
              {guides.map((guide) => (
                <article key={guide.slug} className="rounded-[1.2rem] border border-[var(--border)] bg-[#f9fbfc] p-4">
                  <h3 className="text-base font-semibold tracking-tight">{guide.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{guide.page.intro[0]}</p>
                  <Link href={guide.slug} className="mt-3 inline-flex text-sm font-semibold text-[var(--accent)]">
                    Read guide
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--border)] bg-[#f8fbfd] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
