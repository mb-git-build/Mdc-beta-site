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
    title: "The industry directory for data center infrastructure",
    description: "Browse categories, subcategories, and companies across modular delivery, power, cooling, hosting, and operations.",
    images: [{ url: "/og-card.svg", width: 1200, height: 630, alt: `${siteMeta.name} directory social card` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The industry directory for data center infrastructure",
    description: "Browse categories, subcategories, and companies across modular delivery, power, cooling, hosting, and operations.",
    images: ["/og-card.svg"],
  },
};

const navItems = navigation.main.map((item) => ({
  ...item,
  accent: item.href === "/for-vendors",
}));

const compactFooterLinks = [
  { href: "/categories", label: "Categories" },
  { href: "/vendors", label: "Companies" },
  { href: "/methodology", label: "Methodology" },
  { href: "/for-vendors", label: "For Vendors" },
  { href: "/guides", label: "Guides" },
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
          <header className="sticky top-0 z-40 border-b border-[var(--border-strong)] bg-[rgba(15,20,26,0.97)] backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/site-mark.svg" alt="modulardatacenters.ai" width={36} height={36} className="h-9 w-9 rounded-lg" priority />
                <div>
                  <p className="text-sm font-semibold tracking-tight text-white">modulardatacenters.ai</p>
                  <p className="text-[11px] text-[var(--muted)]">Infrastructure company directory</p>
                </div>
              </Link>

              <nav className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-medium text-[var(--muted-strong)]">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={item.accent ? "rounded-full border border-[#31536a] bg-[#15384d] px-3 py-1.5 text-white transition hover:border-[#4a6c83] hover:bg-[#1b4a63]" : "rounded-full px-2 py-1.5 transition hover:text-white"}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {children}

          <footer className="border-t border-[var(--border-strong)] bg-[#0b1015] text-[#d6dde6]">
            <div className="mx-auto max-w-7xl px-4 py-5 lg:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/site-mark.svg" alt="modulardatacenters.ai" width={28} height={28} className="h-7 w-7 rounded-md" />
                  <div>
                    <p className="text-sm font-semibold text-white">modulardatacenters.ai</p>
                    <p className="text-xs text-[var(--muted)]">Categories, subcategories, companies.</p>
                  </div>
                </div>

                <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted-strong)]">
                  {compactFooterLinks.map((item) => (
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
