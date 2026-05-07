import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { siteMeta } from "@/lib/site-data";

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
    images: [{ url: "/og-card.svg", width: 1200, height: 630, alt: `${siteMeta.name} infrastructure directory card` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteMeta.name} | ${siteMeta.shortDescriptor}`,
    description: siteMeta.heroDescriptor,
    images: ["/og-card.svg"],
  },
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Categories" },
  { href: "/vendors", label: "Companies" },
  { href: "/directory", label: "Market Map" },
  { href: "/guides", label: "Guides" },
  { href: "/for-vendors", label: "Submit Company", accent: true },
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
            <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Image src="/site-mark.svg" alt="modulardatacenters.ai" width={32} height={32} className="h-8 w-8 rounded-lg" />
                  <div>
                    <p className="text-sm font-semibold text-white">modulardatacenters.ai</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Curated directory for modular data centers, AI infrastructure, cooling, power, and hosting.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Link href="/categories" className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 font-semibold text-white transition hover:border-[var(--border-strong)]">
                    Start with categories
                  </Link>
                  <Link href="/vendors" className="rounded-full border border-transparent bg-transparent px-2 py-2 font-semibold text-[var(--accent)] transition hover:text-white">
                    Browse companies
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Explore the market map</p>
                <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted-strong)]">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} className="transition hover:text-white">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
