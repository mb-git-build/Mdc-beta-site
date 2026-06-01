import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { navigation, siteMeta } from "@/lib/site-data";

export const metadata: Metadata = {
  metadataBase: new URL("https://modulardatacenters.ai"),
  title: `${siteMeta.name} | ${siteMeta.shortDescriptor}`,
  description: siteMeta.heroDescriptor,
  applicationName: siteMeta.name,
  keywords: [
    "modular data centers",
    "data center infrastructure",
    "AI infrastructure",
    "liquid cooling",
    "GPU hosting",
    "data center vendors",
    "power and electrical infrastructure",
  ],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: ["/favicon.svg"],
  },
  openGraph: {
    type: "website",
    url: "https://modulardatacenters.ai",
    siteName: siteMeta.name,
    title: "The market map for data center infrastructure",
    description: "Explore suppliers, categories, and adjacent infrastructure layers across modular delivery, power, cooling, hosting, and operations.",
    images: [{ url: "/og-card.svg", width: 1200, height: 630, alt: `${siteMeta.name} market map social card` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The market map for data center infrastructure",
    description: "Explore suppliers, categories, and adjacent infrastructure layers across modular delivery, power, cooling, hosting, and operations.",
    images: ["/og-card.svg"],
  },
};

const navItems = navigation.main.map((item) => ({
  ...item,
  accent: item.href === "/for-vendors",
}));

const footerDiscoveryLinks = [
  { href: "/categories", label: "Browse by category" },
  { href: "/directory", label: "Open the market map" },
  { href: "/vendors", label: "Review company listings" },
  { href: "/guides", label: "Read infrastructure guides" },
];

const footerPathways = [
  {
    title: "Cooling & density",
    body: "Compare liquid, immersion, rear-door, and thermal-control paths before narrowing vendors.",
    href: "/directory/liquid-cooling",
  },
  {
    title: "Power & resilience",
    body: "Start with electrical backbone, UPS, generation, and rack-density constraints.",
    href: "/directory/power-and-electrical",
  },
  {
    title: "Vendor participation",
    body: "Submit or claim a listing with a moderated path that preserves buyer trust.",
    href: "/for-vendors",
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
          <header className="sticky top-0 z-40 border-b border-[var(--border-strong)] bg-[rgba(15,20,26,0.97)] backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/site-mark.svg" alt="modulardatacenters.ai" width={40} height={40} className="h-10 w-10 rounded-xl" priority />
                <div>
                  <p className="text-base font-semibold tracking-tight text-white">modulardatacenters.ai</p>
                  <p className="text-xs text-[var(--muted)]">Infrastructure company directory</p>
                </div>
              </Link>

              <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-[var(--muted-strong)]">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={item.accent ? "rounded-full border border-[#31536a] bg-[#15384d] px-4 py-2 text-white transition hover:border-[#4a6c83] hover:bg-[#1b4a63]" : "rounded-full px-2 py-2 transition hover:text-white"}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {children}

          <footer className="border-t border-[var(--border-strong)] bg-[#0b1015] text-[#d6dde6]">
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
              <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <Image src="/site-mark.svg" alt="modulardatacenters.ai" width={32} height={32} className="h-8 w-8 rounded-lg" />
                    <div>
                      <p className="text-sm font-semibold text-white">modulardatacenters.ai</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">Curated directory for modular data centers, AI infrastructure, cooling, power, hosting, and adjacent deployment layers.</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {footerDiscoveryLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-semibold text-white transition hover:border-[var(--border-strong)]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Suggested pathways</p>
                  <div className="grid gap-3">
                    {footerPathways.map((pathway) => (
                      <Link key={pathway.href} href={pathway.href} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--border-strong)]">
                        <p className="text-sm font-semibold text-white">{pathway.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{pathway.body}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 border-t border-[var(--border-strong)] pt-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Explore</p>
                  <nav className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted-strong)]">
                    {navigation.footer.map((item) => (
                      <Link key={item.href} href={item.href} className="transition hover:text-white">
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">What this site is for</p>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                    This is a research-first market map for buyers, operators, and infrastructure teams comparing categories, companies, and adjacent systems across modular delivery, thermal design, power strategy, controls, and deployment operations.
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
