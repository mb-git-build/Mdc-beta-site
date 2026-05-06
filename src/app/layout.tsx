import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { navigation, siteMeta } from "@/lib/site-data";

export const metadata: Metadata = {
  metadataBase: new URL("https://modulardatacenters.ai"),
  title: `${siteMeta.name} | ${siteMeta.shortDescriptor}`,
  description: siteMeta.heroDescriptor,
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: `${siteMeta.name} | ${siteMeta.shortDescriptor}`,
    description: siteMeta.heroDescriptor,
    images: [{ url: "/og-card.svg", width: 1200, height: 630, alt: `${siteMeta.name} infrastructure market map card` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteMeta.name} | ${siteMeta.shortDescriptor}`,
    description: siteMeta.heroDescriptor,
    images: ["/og-card.svg"],
  },
};

const primaryNav = [
  { href: "/", label: "Discover" },
  { href: "/categories", label: "Categories" },
  { href: "/vendors", label: "Companies" },
  { href: "/directory", label: "Directory" },
  { href: "/compare", label: "Compare" },
];

const secondaryNav = [
  { href: "/guides", label: "Guides" },
  { href: "/for-vendors", label: "List your company" },
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
          <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(7,16,23,0.88)] backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <Link
                      href="/"
                      className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0d1f2b] shadow-[0_10px_24px_rgba(0,0,0,0.25)]"
                    >
                      <Image src="/site-mark.svg" alt="modulardatacenters.ai mark" width={48} height={48} className="h-10 w-10" priority />
                    </Link>
                    <div>
                      <Link href="/" className="block">
                        <Image src="/site-wordmark.svg" alt={siteMeta.name} width={500} height={86} className="h-11 w-auto sm:h-12" priority />
                      </Link>
                      <p className="mt-1 text-xs font-medium text-[var(--muted)]">Curated infrastructure discovery for modular, AI, power, cooling, and hosting.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/directory"
                      className="rounded-full bg-[var(--foreground)] px-4 py-2.5 text-sm font-semibold text-[#071017] transition hover:-translate-y-0.5"
                    >
                      Browse directory
                    </Link>
                    <Link
                      href="/vendors"
                      className="rounded-full border border-[var(--border-strong)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      Featured companies
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[var(--foreground)]">
                    {primaryNav.map((item) => (
                      <Link key={item.href} href={item.href} className="transition hover:text-[var(--accent)]">
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
                    {secondaryNav.map((item) => (
                      <Link key={item.href} href={item.href} className="transition hover:text-[var(--accent)]">
                        {item.label}
                      </Link>
                    ))}
                    {navigation.main
                      .filter((item) => ![...primaryNav, ...secondaryNav].some((navItem) => navItem.href === item.href))
                      .map((item) => (
                        <Link key={item.href} href={item.href} className="transition hover:text-[var(--accent)]">
                          {item.label}
                        </Link>
                      ))}
                  </nav>
                </div>
              </div>
            </div>
          </header>

          {children}

          <footer className="border-t border-[var(--border)] bg-[#050b10] text-[#d6e2e9]">
            <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0d1f2b]">
                  <Image src="/site-mark.svg" alt="modulardatacenters.ai mark" width={40} height={40} className="h-9 w-9" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{siteMeta.name}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[#9cb0bc]">{siteMeta.heroDescriptor}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7dd3fc]">Curated discovery  premium directory UX  modern infrastructure categories</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7dd3fc]">Explore</p>
                  <nav className="mt-3 grid gap-2 text-sm text-[#d6e2e9]">
                    {navigation.footer.map((item) => (
                      <Link key={item.href} href={item.href} className="transition hover:text-white">
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7dd3fc]">Browse</p>
                  <div className="mt-3 grid gap-2 text-sm text-[#d6e2e9]">
                    <Link href="/categories" className="transition hover:text-white">Categories</Link>
                    <Link href="/vendors" className="transition hover:text-white">Companies</Link>
                    <Link href="/directory" className="transition hover:text-white">Directory</Link>
                  </div>
                </div>
                <div className="sm:col-span-2 rounded-[1.25rem] border border-white/8 bg-white/4 p-4 text-sm text-[#d6e2e9]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7dd3fc]">Built for discoverability</p>
                  <p className="mt-2 leading-7 text-[#9cb0bc]">The public site should feel closer to a modern startup directory than a backoffice app: faster scanning, fewer clicks, stronger cards, and cleaner category browsing.</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
