import Image from "next/image";
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

const surfaceClass = "rounded-[1.25rem] border border-[var(--border)] bg-[var(--card-soft)] p-4";
const pillClass = "rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]";
const accentPillClass = "rounded-full border border-[rgba(127,179,213,0.18)] bg-[rgba(127,179,213,0.12)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]";

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
        <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Not Found</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">This vendor profile does not exist yet.</h1>
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
  const adjacentCategoryLinks = vendor.categories
    .flatMap((categorySlug) => getAdjacentCategoriesForSlug(categorySlug))
    .filter((value, index, array) => array.findIndex((item) => item.slug === value.slug) === index)
    .slice(0, 6);
  const dependencyCategories = (vendor.dependency_category_slugs ?? [])
    .map((categorySlug) => categories.find((category) => category.slug === categorySlug))
    .filter((category): category is (typeof categories)[number] => Boolean(category));
  const oftenUsedWithCategories = (vendor.often_used_with_category_slugs ?? [])
    .map((categorySlug) => categories.find((category) => category.slug === categorySlug))
    .filter((category): category is (typeof categories)[number] => Boolean(category));

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-soft)]">
          <div className="p-8 text-white" style={{ background: tone.gradient }}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="inline-flex h-18 w-18 items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10 text-2xl font-semibold tracking-[0.14em]">
                  {vendor.logo_url ? (
                    <Image src={vendor.logo_url} alt={`${vendor.name} logo`} width={72} height={72} className="h-full w-full object-contain bg-white p-2" unoptimized />
                  ) : (
                    vendorGlyph(vendor.slug)
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Vendor Profile</p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{vendorContent?.title ?? vendor.name}</h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-white/90">{vendor.headline}</p>
                </div>
              </div>
              <a
                href={vendor.website_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/18 transition hover:bg-white/18"
              >
                Visit Company Site
              </a>
            </div>
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex flex-wrap gap-3">
              {vendor.categories.map((categorySlug) => (
                <Link key={categorySlug} href={`/directory/${categorySlug}`} className={accentPillClass}>
                  {categories.find((category) => category.slug === categorySlug)?.name ?? categorySlug}
                </Link>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Link href="/categories" className="rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent)]">
                Explore adjacent categories
              </Link>
              <Link href={listedInPrimaryCategory} className="rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent)]">
                Browse this category
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Key facts</p>
            <dl className="mt-4 grid gap-4 text-sm">
              <div>
                <dt className="font-semibold text-white">Listing type</dt>
                <dd className="mt-1 leading-6 text-[var(--muted-strong)]">{vendor.verified ? "Verified listing" : "Profile under review"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-white">Primary role</dt>
                <dd className="mt-1 leading-6 text-[var(--muted-strong)]">Deployment-relevant infrastructure vendor</dd>
              </div>
              <div>
                <dt className="font-semibold text-white">Website</dt>
                <dd className="mt-1 break-all leading-6 text-[var(--muted-strong)]">{vendor.website_url}</dd>
              </div>
              {vendor.project_scale ? (
                <div>
                  <dt className="font-semibold text-white">Project scale</dt>
                  <dd className="mt-1 leading-6 text-[var(--muted-strong)]">{vendor.project_scale}</dd>
                </div>
              ) : null}
              {vendor.service_area ? (
                <div>
                  <dt className="font-semibold text-white">Service area</dt>
                  <dd className="mt-1 leading-6 text-[var(--muted-strong)]">{vendor.service_area}</dd>
                </div>
              ) : null}
              {vendor.regions?.length ? (
                <div>
                  <dt className="font-semibold text-white">Regions</dt>
                  <dd className="mt-1 leading-6 text-[var(--muted-strong)]">{vendor.regions.join(", ")}</dd>
                </div>
              ) : null}
              {overviewSection ? (
                <div>
                  <dt className="font-semibold text-white">Overview</dt>
                  <dd className="mt-1 leading-7 text-[var(--muted-strong)]">
                    {overviewSection.body[0] ?? "A concise company overview will appear here as profiles are expanded."}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-5 rounded-[1.25rem] border border-[var(--border)] bg-[var(--card-soft)] p-4">
              <p className="text-sm font-semibold text-white">Recommended guides</p>
              <ul className="mt-3 grid gap-2 text-sm text-[var(--muted-strong)]">
                {relatedGuides.map((guide) => (
                  <li key={guide.slug}>
                    <Link href={guide.slug} className="font-medium text-[var(--accent-strong)] transition hover:text-white">
                      {guide.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Profile summary</p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{vendor.headline}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className={surfaceClass}>
                <h2 className="text-base font-semibold tracking-tight text-white">Why it matters</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">
                  {keyCapabilities.length > 0
                    ? `This vendor is currently mapped to ${keyCapabilities.length} key ` +
                      (keyCapabilities.length === 1 ? "capability" : "capabilities") +
                      " in the directory."
                    : "This profile is included because it contributes to a buyer workflow around modular deployment, cooling, power, colocation, or other AI-relevant infrastructure decisions."}
                </p>
              </div>
              <div className={surfaceClass}>
                <h2 className="text-base font-semibold tracking-tight text-white">Typical fit</h2>
                <ul className="mt-2 grid gap-1 text-sm leading-7 text-[var(--muted-strong)]">
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
              <div className={`mt-4 ${surfaceClass}`}>
                <h2 className="text-base font-semibold tracking-tight text-white">Specialties</h2>
                <ul className="mt-2 grid gap-1 text-sm leading-7 text-[var(--muted-strong)]">
                  {vendor.specialties.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {vendor.deployment_types?.length ? (
              <div className={`mt-4 ${surfaceClass}`}>
                <h2 className="text-base font-semibold tracking-tight text-white">Deployment types</h2>
                <ul className="mt-2 grid gap-1 text-sm leading-7 text-[var(--muted-strong)]">
                  {vendor.deployment_types.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {inferredProfile.ecosystemRoles?.length ? (
                <div className={surfaceClass}>
                  <h2 className="text-base font-semibold tracking-tight text-white">Ecosystem role</h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {inferredProfile.ecosystemRoles.map((item) => (
                      <span key={item} className={accentPillClass}>
                        {item.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {inferredProfile.focusAreas?.length ? (
                <div className={surfaceClass}>
                  <h2 className="text-base font-semibold tracking-tight text-white">Focus areas</h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {inferredProfile.focusAreas.map((item) => (
                      <span key={item} className={pillClass}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {inferredProfile.subcategories?.length ? (
              <div className={`mt-4 ${surfaceClass}`}>
                <h2 className="text-base font-semibold tracking-tight text-white">Mapped subcategories</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {inferredProfile.subcategories.map((categorySlug) => (
                    <span key={categorySlug} className={pillClass}>
                      {categorySlug.replaceAll("-", " ")}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {inferredProfile.tags?.length ? (
              <div className={`mt-4 ${surfaceClass}`}>
                <h2 className="text-base font-semibold tracking-tight text-white">Metadata tags</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {inferredProfile.tags.map((tag) => (
                    <span key={tag} className={pillClass}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {relatedCompanies.length ? (
              <div className={`mt-4 ${surfaceClass}`}>
                <h2 className="text-base font-semibold tracking-tight text-white">Related companies</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {relatedCompanies.map((company) => (
                    <Link
                      key={company.slug}
                      href={`/vendors/${company.slug}`}
                      className="rounded-xl border border-[var(--border)] bg-[var(--background-strong)] p-3 text-sm font-medium text-white transition hover:border-[var(--accent)]"
                    >
                      <div>{company.name}</div>
                      <div className="mt-1 text-xs leading-6 text-[var(--muted-strong)]">{company.headline}</div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {adjacentCategoryLinks.length ? (
              <div className={`mt-4 ${surfaceClass}`}>
                <h2 className="text-base font-semibold tracking-tight text-white">Adjacent infrastructure</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {adjacentCategoryLinks.map((category) => (
                    <Link key={category.slug} href={`/directory/${category.slug}`} className={accentPillClass}>
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {dependencyCategories.length || oftenUsedWithCategories.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {dependencyCategories.length ? (
                  <div className={surfaceClass}>
                    <h2 className="text-base font-semibold tracking-tight text-white">Often depends on</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">
                      These categories commonly need to be solved upstream or alongside this vendor’s role in a real deployment.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dependencyCategories.map((category) => (
                        <Link key={category.slug} href={`/directory/${category.slug}`} className={accentPillClass}>
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                {oftenUsedWithCategories.length ? (
                  <div className={surfaceClass}>
                    <h2 className="text-base font-semibold tracking-tight text-white">Commonly deployed with</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">
                      These neighboring categories are frequently part of the same buyer path, shortlist, or deployment package.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {oftenUsedWithCategories.map((category) => (
                        <Link key={category.slug} href={`/directory/${category.slug}`} className={accentPillClass}>
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {considerations.length ? (
              <div className={`mt-4 ${surfaceClass}`}>
                <h2 className="text-base font-semibold tracking-tight text-white">Considerations</h2>
                <ul className="mt-2 grid gap-1 text-sm leading-7 text-[var(--muted-strong)]">
                  {considerations.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(21,27,34,0.98),rgba(14,20,27,0.98))] p-6 shadow-[var(--shadow-card)]">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Next move</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Keep exploring the market around this vendor.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">
                Use the category graph to compare adjacent systems, browse nearby supplier segments, or claim this listing if your team needs to update public details.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href={listedInPrimaryCategory} className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[#0f141a] transition hover:-translate-y-0.5">
                Browse this category
              </Link>
              <Link href="/categories" className="rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-5 py-3 text-sm font-semibold text-white transition hover:border-[var(--accent)]">
                Explore adjacent categories
              </Link>
              <Link href="/for-vendors/claim" className="rounded-full border border-[var(--accent)] bg-[rgba(127,179,213,0.12)] px-5 py-3 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[rgba(127,179,213,0.18)]">
                Claim or update listing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
