import { AdminLeadRequest, AdminVendorSubmission, categories } from "@/lib/site-data";

function normalize(value: string) {
  return (value ?? "").trim().toLowerCase();
}

function normalizeToken(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function tokenize(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function mapTokenToCategorySlug(value: string) {
  const normalized = normalizeToken(value);
  if (!normalized) {
    return "";
  }

  const direct = categories.find((category) => {
    const categoryName = normalizeToken(category.name);

    return (
      normalize(category.slug) === normalized ||
      categoryName === normalized ||
      categoryName.includes(normalized) ||
      normalized.includes(categoryName)
    );
  });

  if (direct) {
    return direct.slug;
  }

  const normalizedDash = normalized.replace(/\s+/g, "-");
  const dashed = categories.find((category) => {
    const categoryName = normalizeToken(category.name).replace(/\s+/g, " ");
    const normalizedCategorySlug = normalizeToken(category.slug).replace(/\s+/g, "-");

    return normalizedDash === normalizedCategorySlug || categoryName.includes(normalizedDash) || normalizedDash.includes(categoryName.replace(/\s+/g, "-"));
  });

  return dashed ? dashed.slug : "";
}

function canonicalize(values: string[]) {
  return dedupe(
    values
      .flatMap((raw) => tokenize(raw))
      .map((token) => mapTokenToCategorySlug(token))
      .filter(Boolean),
  );
}

function explicitLeadRoutingValues(row: AdminLeadRequest) {
  if (!row.formData) {
    return [];
  }

  return canonicalize([
    row.formData.routing_category ?? "",
    row.formData.routingCategory ?? "",
    row.formData.category_focus ?? "",
    row.formData.category_slug ?? "",
    row.formData.routing_slug ?? "",
  ]);
}

function explicitVendorRoutingValues(row: AdminVendorSubmission) {
  return canonicalize([
    ...(row.formData?.routing_category ? [row.formData.routing_category] : []),
    ...(row.formData?.routingCategory ? [row.formData.routingCategory] : []),
    ...(row.formData?.category_focus ? [row.formData.category_focus] : []),
    ...(row.formData?.category_slug ? [row.formData.category_slug] : []),
    ...(row.formData?.routing_slug ? [row.formData.routing_slug] : []),
    ...(row.categories ? [row.categories] : []),
  ]);
}

function categoryNameBySlug(slug: string) {
  const match = categories.find((category) => category.slug === slug);
  return match?.name ?? slug;
}

function fallbackLeadRoutingValues(row: AdminLeadRequest) {
  const legacy = canonicalize([row.formData?.workload_type ?? "", row.formData?.deployment_goal ?? "", row.formData?.deployment_model ?? ""]);
  return legacy;
}

function fallbackVendorRoutingValues(row: AdminVendorSubmission) {
  const legacy = canonicalize([row.categories ?? ""]);
  return legacy;
}

export function getLeadRoutingCategorySlugs(row: AdminLeadRequest): string[] {
  if (row.routingCategorySlugs && row.routingCategorySlugs.length > 0) {
    return dedupe(row.routingCategorySlugs);
  }

  const explicit = explicitLeadRoutingValues(row);
  if (explicit.length > 0) {
    return explicit;
  }

  return fallbackLeadRoutingValues(row);
}

export function getVendorRoutingCategorySlugs(row: AdminVendorSubmission): string[] {
  if (row.routingCategorySlugs && row.routingCategorySlugs.length > 0) {
    return dedupe(row.routingCategorySlugs);
  }

  const explicit = explicitVendorRoutingValues(row);
  if (explicit.length > 0) {
    return explicit;
  }

  return fallbackVendorRoutingValues(row);
}

export function formatRoutingCategoryLabels(slugs: string[]) {
  const list = dedupe(slugs)
    .map((slug) => categoryNameBySlug(slug))
    .filter(Boolean);

  return list;
}

export type RoutingTag = {
  slug: string;
  name: string;
};

export function getLeadRoutingTags(row: AdminLeadRequest): RoutingTag[] {
  const slugs = getLeadRoutingCategorySlugs(row);
  return dedupe(slugs).map((slug) => ({ slug, name: categoryNameBySlug(slug) }));
}

export function getVendorRoutingTags(row: AdminVendorSubmission): RoutingTag[] {
  const slugs = getVendorRoutingCategorySlugs(row);
  return dedupe(slugs).map((slug) => ({ slug, name: categoryNameBySlug(slug) }));
}

export function formatRoutingTagText(values: string[]) {
  return formatRoutingCategoryLabels(values).join(", ");
}

export function hasExplicitRoutingTag(row: AdminLeadRequest | AdminVendorSubmission): boolean {
  if ((row as AdminLeadRequest).routingCategorySlugs?.length || (row as AdminVendorSubmission).routingCategorySlugs?.length) {
    return true;
  }

  const leadRow = row as AdminLeadRequest;
  if (leadRow.formData) {
    return Boolean(
      leadRow.formData.routing_category ||
      leadRow.formData.routingCategory ||
      leadRow.formData.category_focus ||
      leadRow.formData.category_slug ||
      leadRow.formData.routing_slug,
    );
  }

  const vendorRow = row as AdminVendorSubmission;
  return Boolean(
    vendorRow.formData?.routing_category ||
      vendorRow.formData?.routingCategory ||
      vendorRow.formData?.category_focus ||
      vendorRow.formData?.category_slug ||
      vendorRow.formData?.routing_slug ||
      vendorRow.categories,
  );
}
