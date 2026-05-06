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
  { href: "/directory", label: "Directory" },
  { href: "/categories", label: "Categories" },
  { href: "/vendors", label: "Vendors" },
  { href: "/guides", label: "Guides" },
  { href: "/compare", label: "Compare" },
];

const secondaryNav = [
  { href: "/for-vendors", label: "For vendors" },
  { href: "/about", label: "About" },
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
          <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/96 backdrop-blur">
            <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <Link
                      href="/"
                      className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0F2230] shadow-[0_10px_24px_rgba(16,44,60,0.1)]"
                    >
                      <Image src="/site-mark.svg" alt="modulardatacenters.ai mark" width={48} height={48} className="h-10 w-10" priority />
                    </Link>
                    <div>
                      <Link href="/" className="block">
                        <Image src="/site-wordmark.svg" alt={siteMeta.name} width={500} height={86} className="h-11 w-auto sm:h-12" priority />
                      </Link>
                      <p className="mt-1 text-xs font-medium text-[var(--muted)]">Browse categories, vendors, and guides without the clutter.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/directory"
                      className="rounded-full bg-[var(--accent-strong)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(16,44,60,0.12)] transition hover:-translate-y-0.5"
                    >
                      Browse directory
                    </Link>
                    <Link
                      href="/vendors"
                      className="rounded-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                    >
                      View vendors
                    </Link>
                    <Link
                      href="/for-vendors"
                      className="rounded-full border border-[var(--border)] bg-[#f7fafc] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                    >
                      List your company
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-[1.25rem] border border-[var(--border)] bg-[#f8fbfd] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
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

          <footer className="border-t border-[var(--border)] bg-[#0f2230] text-[#d6e2e9]">
            <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#14384D]">
                  <Image src="/site-mark.svg" alt="modulardatacenters.ai mark" width={40} height={40} className="h-9 w-9" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{siteMeta.name}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[#b7c9d4]">{siteMeta.heroDescriptor}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8ed1e8]">Category directory  vendor discovery  practical infrastructure research</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8ed1e8]">Explore</p>
                  <nav className="mt-3 grid gap-2 text-sm text-[#d6e2e9]">
                    {navigation.footer.map((item) => (
                      <Link key={item.href} href={item.href} className="transition hover:text-white">
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8ed1e8]">Start here</p>
                  <div className="mt-3 grid gap-2 text-sm text-[#d6e2e9]">
                    <Link href="/directory" className="transition hover:text-white">Browse directory</Link>
                    <Link href="/categories" className="transition hover:text-white">Explore categories</Link>
                    <Link href="/vendors" className="transition hover:text-white">Vendor directory</Link>
                  </div>
                </div>
                <div className="sm:col-span-2 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-[#d6e2e9]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8ed1e8]">Built for easier browsing</p>
                  <p className="mt-2 leading-7 text-[#b7c9d4]">Use the directory to scan categories fast, open vendor profiles without friction, and move through the infrastructure landscape with a cleaner, calmer interface.</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
