import Link from "next/link";
import { categories, vendors } from "@/lib/site-data";
import { getMainDomainRows } from "@/lib/main-domains";

const domainIconMap: Record<string, string> = {
  "Power & Electrical": "▦",
  "Cooling & Thermal": "◫",
  "Modular Infrastructure": "▣",
  "Operations & Maintenance": "⊞",
  "AI Infrastructure & Compute": "◈",
  "Network & Connectivity": "◎",
  "Site Strategy & Energy": "△",
  "Logistics & Supply Chain": "⋮",
};

export default function Home() {
  const mainDomains = getMainDomainRows();
  const subcategoryCount = categories.filter((category) => category.parent_slug).length;
  const verifiedCompanyCount = vendors.filter((vendor) => vendor.verified).length;

  const stats = [
    { value: String(verifiedCompanyCount), label: "Verified Companies" },
    { value: String(categories.length), label: "Infrastructure Markets" },
    { value: String(subcategoryCount), label: "Subcategories" },
    { value: String(mainDomains.length), label: "Main Domains" },
  ];

  return (
    <main className="bg-[#f6f8fb] text-[var(--foreground)]">
      <section className="border-b border-[#1f314e] bg-[#122033] text-white">
        <div className="hero-topology">
          <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-11">
            <div className="max-w-[740px]">
              <h1 className="max-w-[620px] text-[36px] font-semibold leading-[1.01] tracking-[-0.03em] text-white sm:text-[48px] lg:text-[58px]">
                Data Center Infrastructure <span className="text-[#88bdd0]">Directory</span>
              </h1>

              <p className="mt-4 max-w-[700px] text-[17px] leading-7 text-[#c4cfde] sm:text-[18px]">
                Discover 127 verified infrastructure companies across power, cooling, modular deployment, hosting, networking,
                operations, and site strategy.
              </p>

              <form action="/directory" method="get" className="mt-7 flex max-w-[700px] flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[18px] text-[#88bdd0]">⌕</span>
                  <input
                    id="directory-search"
                    name="q"
                    placeholder="Search power, cooling, modular, networking, commissioning..."
                    className="h-[58px] w-full rounded-[12px] border border-[rgba(136,189,208,0.24)] bg-[rgba(255,255,255,0.05)] pl-14 pr-5 text-[16px] text-white outline-none placeholder:text-[#8ea0b9]"
                  />
                </div>
                <button
                  type="submit"
                  className="h-[58px] rounded-[12px] bg-[#6e9fb2] px-8 text-[16px] font-semibold text-[#0f1a27] transition hover:bg-[#7aaabd] sm:min-w-[140px]"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-[12px] border border-[rgba(136,189,208,0.16)] bg-[rgba(17,27,42,0.74)] px-5 py-4"
                >
                  <p className="text-[40px] font-semibold leading-none text-white">{stat.value}</p>
                  <p className="mt-2 text-[14px] leading-6 text-[#aebccf]">{stat.label}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f8fb]">
        <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-[#141c2b] sm:text-[26px]">Browse the Ecosystem</h2>
          <p className="mt-2 text-[18px] leading-7 text-[#66748b]">38 infrastructure markets across 8 main domains</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {mainDomains.map((domain) => (
              <Link
                key={domain.slug}
                href="/directory"
                className="group relative flex min-h-[104px] items-start justify-between rounded-[14px] border border-[#dbe3eb] bg-white px-5 py-5 transition hover:border-[#bfd0da] hover:bg-[#fbfcfe]"
              >
                <span className="absolute inset-x-0 top-0 h-[3px] rounded-t-[14px] bg-[#8db4c1]" />
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#d6e2e8] bg-[#f3f8fa] text-[18px] text-[#6e9fb2]">
                    {domainIconMap[domain.name] ?? "•"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold leading-6 text-[#171f2f]">{domain.name}</p>
                    <p className="mt-1 text-[14px] leading-6 text-[#7a8598]">
                      {domain.categoryCount} categories &middot; {domain.subcategoryCount} subcategories
                    </p>
                  </div>
                </div>
                <div className="ml-3 shrink-0 pt-1 text-[18px] leading-none text-[#98a7b8] transition group-hover:text-[#6e8194]">›</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
