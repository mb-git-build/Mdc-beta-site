import Image from "next/image";
import Link from "next/link";
import { categories, getGuides, getMarkdownPageBySlug, getFeaturedVendors } from "@/lib/site-data";

const page = getMarkdownPageBySlug("/");
const featuredVendors = getFeaturedVendors();
const guides = getGuides();

const scaleSignals = [
  "A category graph built to expand across modular, AI, bitcoin, colo, rental, power, cooling, software, and infrastructure services.",
  "Browse-first design so people can move through adjacent supplier segments without getting trapped in a thin funnel.",
  "A scalable market-map structure that can keep growing into new verticals without a full redesign.",
];

const topNavQuickFacts = [
  `${categories.length} live categories`,
  `${guides.length} guides`,
  `${vendorsVisibleCount(getFeaturedVendors())} visible vendors`,
];

const featuredSlices = [
  {
    label: "Power & Energy",
    body: "UPS, switchgear, transformers, generators, busway, batteries, and microgrid infrastructure.",
  },
  {
    label: "Cooling & Thermal",
    body: "Liquid cooling, immersion, HVAC, thermal rejection, airflow, and rack-density heat management.",
  },
  {
    label: "Facility Formats",
    body: "Modular, prefab, containerized, edge, colo, rental, and specialized deployment models.",
  },
  {
    label: "Delivery & Operations",
    body: "Engineering, commissioning, controls, logistics, land strategy, monitoring, and site operations.",
  },
];

export default function Home() {
  const whyThisExists = page?.sections.find((section) => section.heading === "Why this site exists");
  const featuredCategories = page?.sections.find((section) => section.heading === "Featured categories");
  const whoItsFor = page?.sections.find((section) => section.heading === "Who it's for");
  const ctaSection = page?.sections.find((section) => section.heading === "CTA");
  const primaryCta = page?.intro.find((paragraph) => paragraph.startsWith("Primary CTA:"))?.replace("Primary CTA:", "").trim();
  const secondaryCta = page?.intro.find((paragraph) => paragraph.startsWith("Secondary CTA:"))?.replace("Secondary CTA:", "").trim();
  const bodyIntro = page?.intro.filter((paragraph) => !paragraph.startsWith("Primary CTA:") && !paragraph.startsWith("Secondary CTA:")) ?? [];

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(35,111,160,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,44,60,0.18),transparent_32%),linear-gradient(180deg,#f5fbff_0%,#e8eef3_100%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.92)] p-8 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:p-10 lg:p-12">
              <div className="inline-flex items-center rounded-full border border-[var(--border-strong)] bg-[#f4f8fb] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                Category graph for modern data center infrastructure
              </div>
              <h1 className="mt-6 max-w-5xl text-5xl font-semibold tracking-tight text-[var(--foreground)] sm:text-6xl lg:text-[4.15rem] lg:leading-[1.02]">
                {page?.title ?? "The world's widest resource for data center infrastructure suppliers and systems."}
              </h1>
              {bodyIntro.map((paragraph) => (
                <p key={paragraph} className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">
                  {paragraph}
                </p>
              ))}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/categories"
                  className="rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(16,44,60,0.18)] transition hover:-translate-y-0.5 hover:opacity-95"
                >
                  {primaryCta ?? "Explore Categories"}
                </Link>
                <Link
                  href="/vendors"
                  className="rounded-full border border-[var(--border-strong)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                >
                  {secondaryCta ?? "Browse Vendors"}
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {topNavQuickFacts.map((fact) => (
                  <div key={fact} className="rounded-[1.1rem] border border-[var(--border)] bg-[#f7fafc] px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                    {fact}
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[#102c3c] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ed1e8]">Why this can keep expanding</p>
                <div className="mt-3 grid gap-2 text-sm leading-7 text-[#dbe5eb]">
                  {scaleSignals.map((signal) => (
                    <p key={signal}>{signal}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-rows-[1fr_auto]">
              <div className="overflow-hidden rounded-[2rem] border border-[#17394a] bg-[#0f2230] text-white shadow-[0_24px_60px_rgba(16,44,60,0.22)]">
                <div className="relative aspect-[1.15/1] min-h-[340px]">
                  <Image
                    src="/hero-orbit.svg"
                    alt="Abstract infrastructure intelligence routing graphic"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Metric label="Scope" value="Modular, AI, bitcoin, colo, rental" />
                <Metric label="Structure" value="Category graph, vendor graph, guides" />
                <Metric label="Goal" value="Become the first place people explore" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-6 py-18 lg:px-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Category Graph</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Wide by design, structured for endless expansion.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
            {(featuredCategories?.bullets ?? []).join("  ") ||
              "The category system is designed to scale into every adjacent segment of modern data center infrastructure without becoming a mess."}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featuredSlices.map((slice) => (
            <div
              key={slice.label}
              className="rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f6fafc_100%)] p-6 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_16px_40px_rgba(16,44,60,0.08)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Slice</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{slice.label}</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{slice.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/categories" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            Open the full category graph
          </Link>
          <Link href="/vendors" className="rounded-full border border-[var(--border-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]">
            Browse supplier profiles
          </Link>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-18 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
          <div className="grid gap-8 lg:grid-cols-2">
            {(whyThisExists?.bullets ?? []).map((item) => (
              <Insight key={item} title={item} body="Structured to feel huge without becoming unusable, so breadth turns into discovery rather than noise." />
            ))}
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[#102c3c] shadow-[0_22px_50px_rgba(16,44,60,0.14)]">
            <div className="relative aspect-[16/11] min-h-[280px]">
              <Image
                src="/brand-grid.svg"
                alt="Abstract datacenter routing and network graphic"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 38vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="vendors" className="mx-auto max-w-7xl px-6 py-18 lg:px-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Supplier Directory</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Browse suppliers inside a much larger ecosystem map.</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
            Follow category links, compare adjacent offerings, and move through the market the way actual sourcing research works.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {featuredVendors.length > 0 ? (
            featuredVendors.map((vendor) => (
              <VendorCard
                key={vendor.slug}
                slug={vendor.slug}
                name={vendor.name}
                website={vendor.website_url}
                headline={vendor.headline}
                verified={vendor.verified}
              />
            ))
          ) : (
            <div className="lg:col-span-2 xl:col-span-3 rounded-[1.75rem] border border-[var(--border)] bg-white p-6 text-sm leading-7 text-[var(--muted)]">
              Featured listings are still being curated, but the full supplier directory is available now.
              <div className="mt-4">
                <Link href="/vendors" className="font-semibold text-[var(--accent)]">
                  Explore all vendors
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="guides" className="border-y border-[var(--border)] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-18 lg:px-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Guides</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Utility content that makes the graph stickier.</h2>
            </div>
            <Link href="/guides" className="text-sm font-semibold text-[var(--accent)]">
              View all guides
            </Link>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {guides.map((guide) => (
              <article key={guide.slug} className="rounded-[1.5rem] border border-[var(--border)] bg-[#f9fbfc] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Guide</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{guide.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{guide.page.intro[0]}</p>
                <Link href={guide.slug} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)]">
                  Read guide
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="for-buyers" className="mx-auto max-w-7xl px-6 py-18 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Who it&apos;s for</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built for people mapping the market at scale.</h2>
          </div>
          <div className="grid gap-4 rounded-[1.75rem] border border-[var(--border)] bg-white p-6">
            {(whoItsFor?.bullets ?? []).map((item) => (
              <MethodologyItem key={item} title={item} body="Start wide, follow internal links, compare adjacent segments, and use the site like a living infrastructure atlas." />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--accent-strong)] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-18 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b8cfdb]">Start exploring</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Use the site like a market map, not a narrow directory.</h2>
            {ctaSection?.body.map((paragraph) => (
              <p key={paragraph} className="mt-5 max-w-xl text-sm leading-7 text-[#dbe5eb]">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="grid gap-4 rounded-[1.75rem] border border-white/15 bg-white/6 p-6 backdrop-blur-sm sm:grid-cols-3">
            <ProcessStep step="1" title="Pick a segment" body="Start with cooling, power, deployment, hosting, software, or an adjacent systems layer." />
            <ProcessStep step="2" title="Follow the graph" body="Move through related categories, guides, and vendor profiles to understand the market." />
            <ProcessStep step="3" title="Build your map" body="Use the site to assemble a richer picture of suppliers, systems, and adjacent options." />
          </div>
        </div>
      </section>
    </main>
  );
}

function vendorsVisibleCount(featured: Array<{ slug: string }>) {
  return featured.length > 0 ? featured.length : categories.length + 1;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--border)] bg-white p-4 shadow-[0_16px_24px_rgba(16,44,60,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function Insight({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--border)] bg-[#f9fbfc] p-6">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{body}</p>
    </article>
  );
}

function VendorCard({
  slug,
  name,
  website,
  headline,
  verified,
}: {
  slug: string;
  name: string;
  website: string;
  headline: string;
  verified?: boolean;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[0_18px_34px_rgba(16,44,60,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Supplier</p>
        {verified ? <span className="rounded-full bg-[#e9f6ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1e6a45]">Verified</span> : null}
      </div>
      <h3 className="mt-3 text-xl font-semibold tracking-tight">{name}</h3>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{headline}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/vendors/${slug}`} className="text-sm font-semibold text-[var(--accent)]">
          View profile
        </Link>
        <a href={website} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--muted-strong)]">
          Visit website
        </a>
      </div>
    </article>
  );
}

function MethodologyItem({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-[1.25rem] border border-[var(--border)] bg-[#f9fbfc] p-5">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{body}</p>
    </article>
  );
}

function ProcessStep({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <article className="rounded-[1.25rem] border border-white/12 bg-white/8 p-5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white">
        {step}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#dbe5eb]">{body}</p>
    </article>
  );
}
