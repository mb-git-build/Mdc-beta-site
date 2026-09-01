import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { siteMeta } from "@/lib/site-data";

export const viewport: Viewport = {
  themeColor: "#15233b",
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
    description: "Browse 38 infrastructure markets and 127 verified companies across the modular data center ecosystem.",
    images: [{ url: "/og-card.svg", width: 1200, height: 630, alt: `${siteMeta.name} directory social card` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The resource-first directory for data center infrastructure",
    description: "Browse 38 infrastructure markets and 127 verified companies across the modular data center ecosystem.",
    images: ["/og-card.svg"],
  },
};

const headerNav = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Categories" },
  { href: "/vendors", label: "Companies" },
  { href: "/methodology", label: "Methodology" },
  { href: "/for-vendors", label: "For Vendors" },
];

const footerNav = [
  { href: "/categories", label: "Categories" },
  { href: "/directory", label: "Directory" },
  { href: "/vendors", label: "Companies" },
  { href: "/methodology", label: "Methodology" },
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
        <div className="min-h-screen bg-[#f7f8fb] text-[var(--foreground)]">
          <header className="border-b border-[rgba(255,255,255,0.08)] bg-[#111827] text-white">
            <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/site-mark.svg" alt="modulardatacenters.ai" width={34} height={34} className="h-[34px] w-[34px] rounded-[6px]" priority />
                <p className="text-[27px] font-semibold leading-none tracking-[-0.04em] text-white">modulardatacenters.ai</p>
              </Link>

              <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] leading-6 text-[#e3e8f3]">
                {headerNav.map((item) => (
                  <Link key={item.href} href={item.href} className="transition hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {children}

          <footer className="border-t border-[#e6eaf1] bg-[#f7f8fb] text-[#5f6c83]">
            <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="max-w-[560px]">
                <p className="text-[15px] font-semibold text-[#171f2f]">modulardatacenters.ai</p>
                <p className="mt-1 text-[14px] leading-6 text-[#6a778b]">
                  Research directory for modular data center infrastructure across power, cooling, hosting, networking, operations, and site strategy.
                </p>
              </div>

              <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] leading-6 text-[#6a778b] lg:justify-end">
                {footerNav.map((item) => (
                  <Link key={item.href} href={item.href} className="transition hover:text-[#171f2f]">
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
