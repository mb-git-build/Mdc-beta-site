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
  { href: "/guides", label: "Guides" },
  { href: "/for-vendors", label: "Submit Company" },
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
          <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(7,16,23,0.92)] backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <Link href="/" className="flex items-center">
                <Image src="/site-wordmark.svg" alt={siteMeta.name} width={500} height={86} className="h-10 w-auto sm:h-11" priority />
              </Link>

              <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[var(--muted-strong)]">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="transition hover:text-[var(--foreground)]">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {children}

          <footer className="border-t border-[var(--border)] bg-[#050b10] text-[#d6e2e9]">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
              <div>
                <p className="text-sm font-semibold text-white">modulardatacenters.ai</p>
                <p className="mt-2 text-sm text-[#9cb0bc]">Curated directory for modular data centers, AI infrastructure, cooling, power, and hosting.</p>
              </div>
              <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#d6e2e9]">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="transition hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
