import Image from "next/image";
import Link from "next/link";
import { getRelatedCompanies, inferVendorRoleProfile } from "@/lib/ecosystem";
import { categories, getMarkdownVendorBySlug, getVendorBySlug, vendors } from "@/lib/site-data";
import { slugToAccent, vendorGlyph, vendorPrimaryCategory } from "@/lib/visuals";

const surfaceClass = "rounded-[1.25rem] border border-[var(--border)] bg-[var(--card-soft)] p-4";
const accentPillClass = "rounded-full border border-[rgba(127,179,213,0.18)] bg-[rgba(127,179,213,0.12)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]";

export function generateStaticParams() {
  return vendors.map((vendor) => ({ slug: vendor.slug }));
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

  const listedInPrimaryCategory = vendor.categories[0] ? `/directory/${vendor.categories[0]}` : "/directory";
  const tone = slugToAccent(vendorPrimaryCategory(vendor.categories));
  const inferredProfile = inferVendorRoleProfile(vendor);
  const relatedCompanies = getRelatedCompanies(vendor, vendors);

  const companyType = inferredProfile.ecosystemRoles?.length
    ? inferredProfile.ecosystemRoles.map((item) => item.replaceAll("_", " ")).join(", ")
    : "Deployment-relevant infrastructure vendor";

  const marketsServed = Array.from(new Set([...(vendor.deployment_types ?? []), ...(inferredProfile.focusAreas ?? [])])).slice(0, 6);

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
              <Link href={listedInPrimaryCategory} className="rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent)]">
                Browse this category
              </Link>
              <Link href="/for-vendors/claim" className="rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent)]">
                Claim or update listing
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
                <dt className="font-semibold text-white">Company type</dt>
                <dd className="mt-1 leading-6 text-[var(--muted-strong)]">{companyType}</dd>
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
            </dl>
          </aside>

          <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Profile summary</p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{vendor.headline}</p>

            {overviewSection ? (
              <div className={`mt-5 ${surfaceClass}`}>
                <h2 className="text-base font-semibold tracking-tight text-white">Overview</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">
                  {overviewSection.body[0] ?? "A concise company overview will appear here as profiles are expanded."}
                </p>
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
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

            {marketsServed.length ? (
              <div className={`mt-4 ${surfaceClass}`}>
                <h2 className="text-base font-semibold tracking-tight text-white">Typical deployment context</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {marketsServed.map((item) => (
                    <span key={item} className="rounded-full border border-[var(--border)] bg-[var(--background-strong)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {relatedCompanies.length ? (
              <div className={`mt-4 ${surfaceClass}`}>
                <h2 className="text-base font-semibold tracking-tight text-white">Related companies</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">
                  These are other companies worth evaluating alongside this vendor in the same buyer workflow.
                </p>
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
      </div>
    </main>
  );
}
