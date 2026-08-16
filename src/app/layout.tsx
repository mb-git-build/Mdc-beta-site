import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { navigation, siteMeta } from "@/lib/site-data";

export const viewport: Viewport = {
  themeColor: "#0d1217",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://modulardatacenters.ai"),
  title: `${siteMeta.name} | ${siteMeta.shortDescriptor}`,
  description: siteMeta.heroDescriptor,
  applicationName: siteMeta.name,
  manifest: "/site.webmanifest",
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
    title: "The resource-first directory for data center infrastructure",
    description: "Browse 37 categories and 125 companies across modular delivery, power, cooling, hosting, networking, operations, and site strategy.",
    images: [{ url: "/og-card.svg", width: 1200, height: 630, alt: `${siteMeta.name} directory social card` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The resource-first directory for data center infrastructure",
    description: "Browse 37 categories and 125 companies across modular delivery, power, cooling, hosting, networking, operations, and site strategy.",
    images: ["/og-card.svg"],
  },
};

const researchNav = navigation.main.filter((item) => item.href !== "/for-vendors");
const institutionalLinks = [
  { href: "/categories", label: "Categories" },
  { href: "/directory", label: "Directory" },
  { href: "/vendors", label: "Companies" },
  { href: "/methodology", label: "Methodology" },
  { href: "/guides", label: "Guides" },
  { href: "/about", label: "About" },
  { href: "/for-vendors", label: "For Vendors" },
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
          <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(13,18,23,0.96)] backdrop-blur-sm">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/site-mark.svg" alt="modulardatacenters.ai" width={34} height={34} className="h-8 w-8 rounded-sm" priority />
                <div>
                  <p className="text-sm font-semibold tracking-tight text-white">modulardatacenters.ai</p>
                  <p className="text-[11px] text-[var(--muted)]">Infrastructure ecosystem directory</p>
                </div>
              </Link>

              <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted-strong)]">
                {researchNav.map((item) => (
                  <Link key={item.href} href={item.href} className="transition hover:text-white">
                    {item.label}
                  </Link>
                ))}
                <Link href="/for-vendors" className="text-[var(--muted)] transition hover:text-white">
                  For Vendors
                </Link>
              </nav>
            </div>
          </header>

          {children}

          <footer className="border-t border-[var(--border)] bg-[var(--background-strong)] text-[var(--muted-strong)]">
            <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold text-white">modulardatacenters.ai</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    Built to help people think clearly. Powered by curiosity. Guided by Atlas.
                  </p>
                </div>

                <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted-strong)] lg:justify-end">
                  {institutionalLinks.map((item) => (
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
