import fs from "node:fs";
import path from "node:path";

import { getContentDataPath, getContentDirectory, getDataPath } from "@/lib/storage-paths";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  parent_slug?: string;
  layer?: "segment" | "subcategory";
  tags?: string[];
  adjacent_category_slugs?: string[];
  often_used_with?: string[];
};

export type CategoryLineage = {
  parent?: Category;
  children: Category[];
};

export type Vendor = {
  id: string;
  slug: string;
  name: string;
  website_url: string;
  categories: string[];
  headline: string;
  featured?: boolean;
  verified?: boolean;
  regions?: string[];
  deployment_types?: string[];
  buyer_types?: string[];
  specialties?: string[];
  proof_points?: string[];
  featured_capabilities?: string[];
  comparison_notes?: string[];
  hq?: string;
  service_area?: string;
  project_scale?: string;
  subcategories?: string[];
  tags?: string[];
  infrastructure_types?: string[];
  cooling_types?: string[];
  power_specializations?: string[];
  focus_areas?: string[];
  scale_focus?: string[];
  ecosystem_roles?: string[];
  company_types?: string[];
  related_company_slugs?: string[];
  dependency_category_slugs?: string[];
  often_used_with_category_slugs?: string[];
  logo_url?: string;
};

export type NavigationLink = {
  label: string;
  href: string;
};

export type LeadQuestion = {
  id: string;
  label: string;
  type: "text" | "email" | "textarea" | "select";
  options?: string[];
};

export type AdminLeadStatus = "new" | "reviewing" | "contacted" | "closed";

export type AdminLeadRequest = {
  id: string;
  name: string;
  company: string;
  email: string;
  type: "match_request";
  status: AdminLeadStatus;
  submittedAt: string;
  formData?: Record<string, string>;
  routingCategorySlugs?: string[];
};

export type AdminSubmissionType = "submit" | "claim";
export type AdminSubmissionStatus =
  | "new"
  | "in_review"
  | "approved"
  | "needs_more_info"
  | "rejected"
  | "claimed"
  | "verified"
  | "needs_followup";

export type VendorSubmissionStatusTrailEntry = {
  status: AdminSubmissionStatus;
  actor: string;
  at: string;
  source?: string;
  reason?: string;
  note?: string;
};

export type VendorSubmissionDuplicateMatch = {
  kind: "vendor" | "submission";
  id: string;
  label: string;
  confidence: number;
  reason: string;
};

export type AdminVendorSubmission = {
  id: string;
  company: string;
  contact: string;
  type: AdminSubmissionType;
  status: AdminSubmissionStatus;
  vendorSlug?: string;
  submittedAt: string;
  formData?: Record<string, string>;
  websiteUrl?: string;
  categories?: string;
  routingCategorySlugs?: string[];
  summary?: string;
  notes?: string;
  claimToken?: string;
  claimTokenExpiresAt?: string;
  statusTrail?: VendorSubmissionStatusTrailEntry[];
  duplicateConfidence?: number;
  duplicateMatches?: VendorSubmissionDuplicateMatch[];
  duplicateLabel?: string;
  validationState?: "matched" | "needs_followup";
  validationScore?: number;
};

export type PageIndexEntry = {
  slug: string;
  title: string;
  type: string;
  source: string;
};

export type MarkdownSection = {
  heading: string;
  body: string[];
  bullets: string[];
  ordered: string[];
};

export type MarkdownPage = {
  title: string;
  intro: string[];
  sections: MarkdownSection[];
};

export const siteMeta = {
  name: "modulardatacenters.ai",
  shortDescriptor: "AI-ready modular infrastructure intelligence",
  heroDescriptor: "Buyer-focused intelligence for modular, cooling, power, and colocation decisions",
};

function getRepoRoot() {
  return process.cwd();
}

function readJsonFile<T>(filename: string): T {
  const filePath = getContentDataPath(filename);
  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents) as T;
}

function readAdminJsonFile<T>(filename: string): T | null {
  const filePath = getDataPath(filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileContents) as T;
}

function resolveContentPath(relativePath: string) {
  if (relativePath.startsWith("content/")) {
    return path.join(getContentDirectory(), relativePath.slice("content/".length));
  }

  return path.join(getRepoRoot(), relativePath);
}

function readContentFile(relativePath: string) {
  const filePath = resolveContentPath(relativePath);
  return fs.readFileSync(filePath, "utf8");
}

function readOptionalContentFile(relativePath: string) {
  const filePath = resolveContentPath(relativePath);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, "utf8");
}

function normalizeHref(href: string) {
  if (href === "/") {
    return href;
  }

  return href.endsWith("/") ? href.slice(0, -1) : href;
}

function parseMarkdown(markdown: string): MarkdownPage {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let title = "";
  const intro: string[] = [];
  const sections: MarkdownSection[] = [];
  let currentSectionIndex = -1;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (line.startsWith("# ")) {
      title = line.slice(2).trim();
      continue;
    }

    if (line.startsWith("## ")) {
      sections.push({ heading: line.slice(3).trim(), body: [], bullets: [], ordered: [] });
      currentSectionIndex = sections.length - 1;
      continue;
    }

    const currentSection = currentSectionIndex >= 0 ? sections[currentSectionIndex] : null;

    if (line.startsWith("- ")) {
      if (currentSection) {
        currentSection.bullets.push(line.slice(2).trim());
      } else {
        intro.push(line.slice(2).trim());
      }
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const item = line.replace(/^\d+\.\s/, "").trim();
      if (currentSection) {
        currentSection.ordered.push(item);
      } else {
        intro.push(item);
      }
      continue;
    }

    const cleaned = line.replace(/`/g, "").replace(/^\*\*(.+)\*\*:?$/, "$1").trim();
    if (currentSection) {
      currentSection.body.push(cleaned);
    } else {
      intro.push(cleaned);
    }
  }

  return { title, intro, sections };
}

export const categories: Category[] = readJsonFile<Category[]>("categories.json");
export const vendors: Vendor[] = readJsonFile<Vendor[]>("vendors.json");
export const navigation: { main: NavigationLink[]; footer: NavigationLink[] } = readJsonFile("navigation.json");
export const pagesIndex: PageIndexEntry[] = readJsonFile<PageIndexEntry[]>("pages.json");

export function getLeadQuestions() {
  return readJsonFile<LeadQuestion[]>("lead_questions.json");
}

export function getAdminLeads() {
  return readAdminJsonFile<AdminLeadRequest[]>("admin_leads.json") ?? [];
}

export function getAdminVendorSubmissions() {
  return readAdminJsonFile<AdminVendorSubmission[]>("admin_vendor_submissions.json") ?? [];
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getVendorBySlug(slug: string) {
  return vendors.find((vendor) => vendor.slug === slug);
}

export function getVendorsForCategory(slug: string) {
  return vendors.filter((vendor) => vendor.categories.includes(slug));
}

export function getFeaturedVendors() {
  return vendors.filter((vendor) => vendor.featured);
}

export function getChildCategories(parentSlug: string) {
  return categories.filter((category) => category.parent_slug === parentSlug);
}

export function getCategoryLineage(slug: string): CategoryLineage {
  const current = getCategory(slug);
  const parent = current?.parent_slug ? getCategory(current.parent_slug) : undefined;
  const children = getChildCategories(slug);

  return {
    parent,
    children,
  };
}

export function getPageIndexEntry(slug: string) {
  const normalizedSlug = normalizeHref(slug);
  return pagesIndex.find((entry) => normalizeHref(entry.slug) === normalizedSlug);
}

export function getMarkdownPageBySource(source: string) {
  return parseMarkdown(readContentFile(source));
}

export function getMarkdownPageBySourceSafe(source: string): MarkdownPage | null {
  const raw = readOptionalContentFile(source);
  if (!raw) {
    return null;
  }

  return parseMarkdown(raw);
}

export function getMarkdownPageBySlug(slug: string) {
  const entry = getPageIndexEntry(slug);
  if (!entry || !entry.source.startsWith("content/")) {
    return null;
  }

  return getMarkdownPageBySource(entry.source);
}

export function getMarkdownCategoryBySlug(categorySlug: string) {
  return getMarkdownPageBySourceSafe(`content/categories/${categorySlug}.md`);
}

export function getMarkdownVendorBySlug(vendorSlug: string) {
  return getMarkdownPageBySourceSafe(`content/vendors/${vendorSlug}.md`);
}

export function getGuides() {
  return pagesIndex
    .filter((entry) => entry.type === "guide" && entry.source.startsWith("content/"))
    .map((entry) => ({ ...entry, page: getMarkdownPageBySource(entry.source) }));
}
