import Link from "next/link";
import { getAdjacentCategoriesForSlug, getRelatedCompanies, inferVendorRoleProfile } from "@/lib/ecosystem";
import { categories, getGuides, getMarkdownVendorBySlug, getVendorBySlug, vendors } from "@/lib/site-data";
import { slugToAccent, vendorGlyph, vendorPrimaryCategory } from "@/lib/visuals";


type RelatedGuide = {
  title: string;
  slug: string;
};

const guideByCategory: Record<string, string[]> = {
  "modular-prefab": ["Modular AI Data Center", "Modular vs. Traditional Data Center Build", "AI Colocation vs. Modular"],
  "liquid-cooling": ["AI Data Center Cooling", "AI Colocation vs. Modular"],
  "ai-colocation-gpu-hosting": ["AI Colocation vs. Modular", "Modular vs. Traditional Data Center Build"],
  "power-and-electrical": ["Modular vs. Traditional Data Center Build", "AI Data Center Cooling"],
  "epc-and-commissioning": ["Modular AI Data Center", "AI Colocation vs. Modular"],
};

export function generateStaticParams() {
  return vendors.map((vendor) => ({ slug: vendor.slug }));
}

function getRelatedGuides(vendorCategorySlugs: string[]): RelatedGuide[] {
  const guides = getGuides();
  const seen = new Set<string>();

  const prioritized = vendorCategorySlugs.flatMap((slug) => guideByCategory[slug] ?? []);
  const byName = (prioritized
    .map((title) => guides.find((guide) => guide.title === title))
    .filter((guide): guide is (typeof guides)[number] => Boolean(guide))
    .filter((guide) => {
      if (seen.has(guide.slug)) {
        return false;
      }
      seen.add(guide.slug);
      return true;
    })) as (typeof guides)[number][];

  const fallback = guides.filter((guide) => !seen.has(guide.slug)).slice(0, 2);

  return [...byName, ...fallback].map((guide) => ({
    title: guide.title,
    slug: guide.slug,
  }));
}

export default async function VendorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = getVendorBySlug(slug);

  if (!vendor) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Not Found</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">This vendor profile does not exist yet.</h1>
        </div>
      </main>
    );
  }

  const vendorContent = getMarkdownVendorBySlug(vendor.slug);
  const overviewSection = vendorContent?.sections.find((section) => section.heading === "Overview");
  const keyCapabilities = vendorContent?.sections.find((section) => section.heading === "Key capabilities")?.bullets ?? [];
  const bestFit = vendorContent?.sections.find((section) => section.heading === "Best fit for")?.bullets ?? [];
  const considerations = vendorContent?.sections.find((section) => section.heading === "Considerations")?.bullets ?? [];

  const relatedGuides = getRelatedGuides(vendor.categories);
  const listedInPrimaryCategory = vendor.categories[0] ? `/directory/${vendor.categories[0]}` : "/directory";
  const tone = slugToAccent(vendorPrimaryCategory(vendor.categories));
  const inferredProfile = inferVendorRoleProfile(vendor);
  const relatedCompanies = getRelatedCompanies(vendor, vendors);
  const adjacentCategoryLinks = vendor.categories.flatMap((slug) => getAdjacentCategoriesForSlug(slug)).filter((value, index, array) => array.findIndex((item) => item.slug === value.slug) === index).slice(0, 6);

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white shadow-[0_16px_40px_rgba(16,44,60,0.06)]">
          <div className="p-8 text-white" style={{ background: tone.gradient }}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="inline-flex h-18 w-18 items-center justify-center rounded-[1.75rem] border border-white/15 bg-white/10 text-2xl font-semibold tracking-[0.14em]">
                  {vendorGlyph(vendor.slug)}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Vendor Profile</p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight">{vendorContent?.title ?? vendor.name}</h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85">{vendor.headline}</p>
                </div>
              </div>
              <a
                href={vendor.website_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/18"
              >
                Visit Company Site
              </a>
            </div>
          </div>

          <div className="p-8">
            <div className="flex flex-wrap gap-3">
            {vendor.categories.map((categorySlug) => (
              <Link
                key={categorySlug}
                href={`/directory/${categorySlug}`}
                className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]"
              >
                {categories.find((category) => category.slug === categorySlug)?.name ?? categorySlug}
              </Link>
            ))}
          </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <Link href="/categories" className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
                Explore adjacent categories
              </Link>
              <Link href={listedInPrimaryCategory} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
                Browse this category
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Key facts</p>
            <dl className="mt-4 grid gap-4 text-sm">
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Listing type</dt>
                <dd className="mt-1 text-[var(--muted)]">{vendor.verified ? "Verified listing" : "Profile under review"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Primary role</dt>
                <dd className="mt-1 text-[var(--muted)]">Deployment-relevant infrastructure vendor</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--foreground)]">Website</dt>
                <dd className="mt-1 text-[var(--muted)] break-all">{vendor.website_url}</dd>
              </div>
              {vendor.project_scale ? (
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Project scale</dt>
                  <dd className="mt-1 text-[var(--muted)]">{vendor.project_scale}</dd>
                </div>
              ) : null}
              {vendor.service_area ? (
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Service area</dt>
                  <dd className="mt-1 text-[var(--muted)]">{vendor.service_area}</dd>
                </div>
              ) : null}
              {vendor.regions?.length ? (
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Regions</dt>
                  <dd className="mt-1 text-[var(--muted)]">{vendor.regions.join(", ")}</dd>
                </div>
              ) : null}
              {overviewSection ? (
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">Overview</dt>
                  <dd className="mt-1 text-[var(--muted)]">
                    {overviewSection.body[0] ?? "A concise company overview will appear here as profiles are expanded."}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 rounded-[1.25rem] bg-[#f7fafc] p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">Recommended guides</p>
              <ul className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
                {relatedGuides.map((guide) => (
                  <li key={guide.slug}>
                    <Link href={guide.slug} className="font-medium text-[var(--accent)]">
                      {guide.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Profile summary</p>
            <p className="mt-4 text-sm leading-8 text-[var(--muted)]">{vendor.headline}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.25rem] bg-[#f7fafc] p-4">
                <h2 className="text-base font-semibold tracking-tight">Why it matters</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {keyCapabilities.length > 0
                    ? `This vendor is currently mapped to ${keyCapabilities.length} key ` +
                      (keyCapabilities.length === 1 ? "capability" : "capabilities") +
                      " in the directory."
                    : "This profile is included because it contributes to a buyer workflow around modular deployment, cooling, power, colocation, or other AI-relevant infrastructure decisions."}
                </p>
              </div>
              <div className="rounded-[1.25rem] bg-[#f7fafc] p-4">
                <h2 className="text-base font-semibold tracking-tight">Typical fit</h2>
                <ul className="mt-2 grid gap-2 text-sm leading-7 text-[var(--muted)]">
                  {bestFit.length > 0 ? (
                    bestFit.map((item) => <li key={item}>• {item}</li>)
                  ) : vendor.buyer_types?.length ? (
                    vendor.buyer_types.map((item) => <li key={item}>• {item}</li>)
                  ) : (
                    <li key="default-fit">• Best for comparing deployment architecture options.</li>
                  )}
                </ul>
              </div>
            </div>

            {vendor.specialties?.length ? (
              <div className="mt-4 rounded-[1.25rem] bg-[#f7fafc] p-4">
                <h2 className="text-base font-semibold tracking-tight">Specialties</h2>
                <ul className="mt-2 grid gap-2 text-sm leading-7 text-[var(--muted)]">
                  {vendor.specialties.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {vendor.deployment_types?.length ? (
              <div className="mt-4 rounded-[1.25rem] bg-[#f7fafc] p-4">
                <h2 className="text-base font-semibold tracking-tight">Deployment types</h2>
                <ul className="mt-2 grid gap-2 text-sm leading-7 text-[var(--muted)]">
                  {vendor.deployment_types.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {inferredProfile.ecosystemRoles?.length ? (
                <div className="rounded-[1.25rem] bg-[#f7fafc] p-4">
                  <h2 className="text-base font-semibold tracking-tight">Ecosystem role</h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {inferredProfile.ecosystemRoles.map((item) => (
                      <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-strong)]">
                        {item.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {inferredProfile.focusAreas?.length ? (
                <div className="rounded-[1.25rem] bg-[#f7fafc] p-4">
                  <h2 className="text-base font-semibold tracking-tight">Focus areas</h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {inferredProfile.focusAreas.map((item) => (
                      <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--foreground)]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {inferredProfile.subcategories?.length ? (
              <div className="mt-4 rounded-[1.25rem] bg-[#f7fafc] p-4">
                <h2 className="text-base font-semibold tracking-tight">Mapped subcategories</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {inferredProfile.subcategories.map((slug) => (
                    <span key={slug} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                      {slug.replaceAll("-", " ")}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {inferredProfile.tags?.length ? (
              <div className="mt-4 rounded-[1.25rem] bg-[#f7fafc] p-4">
                <h2 className="text-base font-semibold tracking-tight">Metadata tags</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {inferredProfile.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {relatedCompanies.length ? (
              <div className="mt-4 rounded-[1.25rem] bg-[#f7fafc] p-4">
                <h2 className="text-base font-semibold tracking-tight">Related companies</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {relatedCompanies.map((company) => (
                    <Link key={company.slug} href={`/vendors/${company.slug}`} className="rounded-xl border border-[var(--border)] bg-white p-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]">
                      <div>{company.name}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">{company.headline}</div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {adjacentCategoryLinks.length ? (
              <div className="mt-4 rounded-[1.25rem] bg-[#f7fafc] p-4">
                <h2 className="text-base font-semibold tracking-tight">Adjacent infrastructure</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {adjacentCategoryLinks.map((category) => (
                    <Link key={category.slug} href={`/directory/${category.slug}`} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {considerations.length ? (
              <div className="mt-4 rounded-[1.25rem] bg-[#f7fafc] p-4">
                <h2 className="text-base font-semibold tracking-tight">Considerations</h2>
                <ul className="mt-2 grid gap-2 text-sm leading-7 text-[var(--muted)]">
                  {considerations.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(135deg,#f7fafc_0%,#eef4f8_100%)] p-6 shadow-[0_12px_28px_rgba(16,44,60,0.05)]">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Next move</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Keep exploring the market around this vendor.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                Use the category graph to compare adjacent systems, browse nearby supplier segments, or claim this listing if your team needs to update public details.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href={listedInPrimaryCategory} className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                Browse this category
              </Link>
              <Link href="/categories" className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]">
                Explore adjacent categories
              </Link>
              <Link href="/for-vendors/claim" className="rounded-full border border-[var(--accent)] bg-[#f4f8fb] px-5 py-3 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[#e8f1f7]">
                Claim or update listing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
