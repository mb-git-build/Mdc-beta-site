import { categories, type Category, type Vendor } from "@/lib/site-data";

export type VendorRole = "manufacturer" | "integrator" | "service_provider" | "operator" | "developer" | "distributor";
export type InfrastructureFocus = "ai" | "bitcoin" | "hpc" | "edge" | "general";
export type InfrastructureType = "power" | "cooling" | "compute" | "facility" | "controls" | "services" | "logistics";
export type DeploymentModel = "hyperscale" | "colocation" | "edge" | "modular" | "containerized" | "retrofit" | "on_site_generation";
export type CoolingType = "immersion" | "direct_to_chip" | "rear_door" | "chilled_water" | "dx" | "evaporative" | "liquid_loop" | "hybrid";
export type PowerSpecialization = "switchgear" | "pdu" | "busway" | "ups" | "generator" | "microgrid" | "substation" | "ats" | "monitoring";

export type CategoryTaxonomyNode = {
  slug: string;
  parentSlug?: string;
  layer: "segment" | "subcategory";
  infrastructureTypes?: InfrastructureType[];
  tags?: string[];
  adjacentCategorySlugs?: string[];
  oftenUsedWith?: string[];
};

export type VendorRoleProfile = {
  slug: string;
  legalName?: string;
  aliases?: string[];
  tagline?: string;
  subcategories?: string[];
  tags?: string[];
  regions?: string[];
  infrastructureTypes?: InfrastructureType[];
  coolingTypes?: CoolingType[];
  powerSpecializations?: PowerSpecialization[];
  deploymentModels?: DeploymentModel[];
  ecosystemRoles?: VendorRole[];
  focusAreas?: InfrastructureFocus[];
  scaleFocus?: ("hyperscale" | "enterprise" | "edge" | "regional")[];
  companyTypes?: ("startup" | "public" | "private" | "regional_provider" | "industrial_supplier")[];
  relatedCompanySlugs?: string[];
  dependencyCategorySlugs?: string[];
  oftenUsedWithCategorySlugs?: string[];
  logoUrl?: string;
  lastMappedAt?: string;
};

export const categoryTaxonomy: CategoryTaxonomyNode[] = [
  {
    slug: "power-and-electrical",
    layer: "segment",
    infrastructureTypes: ["power", "controls"],
    tags: ["electrical-distribution", "resiliency"],
    adjacentCategorySlugs: ["generators-and-microgrids", "ups-and-battery-storage", "monitoring-and-controls"],
    oftenUsedWith: ["high-density-rack-power", "site-selection-and-land-strategy"],
  },
  { slug: "switchgear-pdu-busway", parentSlug: "power-and-electrical", layer: "subcategory", infrastructureTypes: ["power"], tags: ["switchgear", "pdu", "busway"] },
  { slug: "modular-substations", parentSlug: "power-and-electrical", layer: "subcategory", infrastructureTypes: ["power"], tags: ["substation", "modular-power"] },
  { slug: "ats-and-transfer-systems", parentSlug: "power-and-electrical", layer: "subcategory", infrastructureTypes: ["power"], tags: ["ats", "transfer-switch"] },
  { slug: "power-monitoring-and-energy-management", parentSlug: "power-and-electrical", layer: "subcategory", infrastructureTypes: ["power", "controls"], tags: ["power-monitoring", "energy-management"] },

  {
    slug: "liquid-cooling",
    layer: "segment",
    infrastructureTypes: ["cooling"],
    tags: ["thermal-management", "high-density"],
    adjacentCategorySlugs: ["rear-door-direct-to-chip-cooling", "immersion-cooling", "hvac-and-thermal-rejection"],
    oftenUsedWith: ["high-density-rack-power", "monitoring-and-controls"],
  },
  { slug: "direct-to-chip-cooling", parentSlug: "liquid-cooling", layer: "subcategory", infrastructureTypes: ["cooling"], tags: ["cold-plate", "chip-cooling"] },
  { slug: "liquid-loop-systems", parentSlug: "liquid-cooling", layer: "subcategory", infrastructureTypes: ["cooling"], tags: ["cdus", "liquid-loop"] },
  { slug: "thermal-optimization-controls", parentSlug: "liquid-cooling", layer: "subcategory", infrastructureTypes: ["cooling", "controls"], tags: ["optimization", "controls"] },

  {
    slug: "generators-and-microgrids",
    layer: "segment",
    infrastructureTypes: ["power"],
    tags: ["backup-power", "resilience"],
    adjacentCategorySlugs: ["power-and-electrical", "sustainability-and-energy-strategy"],
    oftenUsedWith: ["modular-substations", "ups-and-battery-storage"],
  },
  { slug: "backup-generators", parentSlug: "generators-and-microgrids", layer: "subcategory", infrastructureTypes: ["power"], tags: ["gensets", "backup-power"] },
  { slug: "microgrid-controls-and-integration", parentSlug: "generators-and-microgrids", layer: "subcategory", infrastructureTypes: ["power", "controls"], tags: ["microgrids", "integration"] },

  {
    slug: "modular-prefab",
    layer: "segment",
    infrastructureTypes: ["facility", "services"],
    tags: ["prefabrication", "factory-built"],
    adjacentCategorySlugs: ["containerized-data-centers", "epc-and-commissioning", "site-selection-and-land-strategy"],
    oftenUsedWith: ["power-and-electrical", "liquid-cooling"],
  },
  { slug: "prefabricated-power-blocks", parentSlug: "modular-prefab", layer: "subcategory", infrastructureTypes: ["facility", "power"], tags: ["skids", "e-houses"] },
  { slug: "fabricated-enclosures-and-shells", parentSlug: "modular-prefab", layer: "subcategory", infrastructureTypes: ["facility"], tags: ["enclosures", "shells"] },

  {
    slug: "ai-colocation-gpu-hosting",
    layer: "segment",
    infrastructureTypes: ["compute", "facility"],
    tags: ["gpu-clusters", "hosting"],
    adjacentCategorySlugs: ["network-fabric-and-connectivity", "high-density-rack-power", "liquid-cooling"],
    oftenUsedWith: ["monitoring-and-controls", "site-selection-and-land-strategy"],
  },
  { slug: "bare-metal-gpu-hosting", parentSlug: "ai-colocation-gpu-hosting", layer: "subcategory", infrastructureTypes: ["compute"], tags: ["bare-metal", "gpu-hosting"] },
  { slug: "managed-ai-colocation", parentSlug: "ai-colocation-gpu-hosting", layer: "subcategory", infrastructureTypes: ["compute", "facility"], tags: ["colocation", "managed-services"] },

  {
    slug: "edge-micro-data-centers",
    layer: "segment",
    infrastructureTypes: ["facility", "compute"],
    tags: ["distributed-compute", "edge"],
    adjacentCategorySlugs: ["modular-prefab", "containerized-data-centers", "network-fabric-and-connectivity"],
    oftenUsedWith: ["microgrid-controls-and-integration", "field-services-and-maintenance"],
  },
  { slug: "regional-edge-operators", parentSlug: "edge-micro-data-centers", layer: "subcategory", infrastructureTypes: ["compute", "services"], tags: ["regional", "operator"] },

  {
    slug: "immersion-cooling",
    layer: "segment",
    infrastructureTypes: ["cooling"],
    tags: ["immersion", "high-density"],
    adjacentCategorySlugs: ["liquid-cooling", "high-density-rack-power"],
    oftenUsedWith: ["thermal-optimization-controls", "field-services-and-maintenance"],
  },
  { slug: "single-phase-immersion", parentSlug: "immersion-cooling", layer: "subcategory", infrastructureTypes: ["cooling"], tags: ["single-phase"] },
  { slug: "two-phase-immersion", parentSlug: "immersion-cooling", layer: "subcategory", infrastructureTypes: ["cooling"], tags: ["two-phase"] },

  {
    slug: "monitoring-and-controls",
    layer: "segment",
    infrastructureTypes: ["controls"],
    tags: ["dcim", "telemetry"],
    adjacentCategorySlugs: ["power-and-electrical", "liquid-cooling", "network-fabric-and-connectivity"],
    oftenUsedWith: ["power-monitoring-and-energy-management", "thermal-optimization-controls"],
  },
  { slug: "dcim-and-observability", parentSlug: "monitoring-and-controls", layer: "subcategory", infrastructureTypes: ["controls"], tags: ["dcim", "observability"] },

  {
    slug: "field-services-and-maintenance",
    layer: "segment",
    infrastructureTypes: ["services"],
    tags: ["operations", "commissioning"],
    adjacentCategorySlugs: ["epc-and-commissioning", "power-and-electrical", "liquid-cooling"],
    oftenUsedWith: ["regional-edge-operators", "microgrid-controls-and-integration"],
  },
  { slug: "electrical-integration-services", parentSlug: "field-services-and-maintenance", layer: "subcategory", infrastructureTypes: ["services", "power"], tags: ["integration", "electrical"] },
  { slug: "infrastructure-logistics", parentSlug: "field-services-and-maintenance", layer: "subcategory", infrastructureTypes: ["logistics", "services"], tags: ["logistics", "heavy-haul"] },
];

const categoryMap = new Map(categories.map((category) => [category.slug, category]));
const taxonomyMap = new Map(categoryTaxonomy.map((node) => [node.slug, node]));

function normalizeTokens(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

export function getCategoryTaxonomyNode(slug: string) {
  return taxonomyMap.get(slug);
}

export function getSubcategoriesForParent(parentSlug: string) {
  return categoryTaxonomy.filter((node) => node.parentSlug === parentSlug);
}

export function getAdjacentCategoriesForSlug(slug: string) {
  const related = new Set<string>();
  const node = getCategoryTaxonomyNode(slug);

  node?.adjacentCategorySlugs?.forEach((item) => related.add(item));
  node?.oftenUsedWith?.forEach((item) => related.add(item));

  categoryTaxonomy
    .filter((entry) => entry.adjacentCategorySlugs?.includes(slug) || entry.oftenUsedWith?.includes(slug))
    .forEach((entry) => related.add(entry.slug));

  return [...related]
    .map((item) => categoryMap.get(item))
    .filter((item): item is Category => Boolean(item));
}

export function inferVendorRoleProfile(vendor: Vendor): VendorRoleProfile {
  const text = normalizeTokens([
    vendor.name,
    vendor.headline,
    ...(vendor.specialties ?? []),
    ...(vendor.featured_capabilities ?? []),
    ...(vendor.proof_points ?? []),
    ...(vendor.buyer_types ?? []),
    ...(vendor.deployment_types ?? []),
  ].join(" "));

  const roles = new Set<VendorRole>();
  const focusAreas = new Set<InfrastructureFocus>();
  const infrastructureTypes = new Set<InfrastructureType>();
  const coolingTypes = new Set<CoolingType>();
  const powerSpecializations = new Set<PowerSpecialization>();
  const deploymentModels = new Set<DeploymentModel>();
  const companyTypes = new Set<"startup" | "public" | "private" | "regional_provider" | "industrial_supplier">();
  const scaleFocus = new Set<"hyperscale" | "enterprise" | "edge" | "regional">();
  const subcategories = new Set<string>();
  const tags = new Set<string>();
  const dependencyCategorySlugs = new Set<string>();
  const oftenUsedWithCategorySlugs = new Set<string>();

  vendor.categories.forEach((slug) => {
    const node = taxonomyMap.get(slug);
    node?.infrastructureTypes?.forEach((type) => infrastructureTypes.add(type));
    node?.tags?.forEach((tag) => tags.add(tag));
    node?.oftenUsedWith?.forEach((item) => oftenUsedWithCategorySlugs.add(item));
    node?.adjacentCategorySlugs?.forEach((item) => dependencyCategorySlugs.add(item));
  });

  if (includesAny(text, ["manufacturer", "fabrication", "fabricated", "oem", "builds", "designs"])) roles.add("manufacturer");
  if (includesAny(text, ["integrator", "integration", "epc", "commissioning", "turnkey"])) roles.add("integrator");
  if (includesAny(text, ["service", "maintenance", "field", "support", "operations"])) roles.add("service_provider");
  if (includesAny(text, ["host", "hosting", "colocation", "operator", "mine", "mining"])) roles.add("operator");
  if (includesAny(text, ["startup", "platform", "software", "developer"])) roles.add("developer");

  if (includesAny(text, ["ai", "gpu", "ml", "inference", "training"])) focusAreas.add("ai");
  if (includesAny(text, ["bitcoin", "mining", "asic"])) focusAreas.add("bitcoin");
  if (includesAny(text, ["hpc"])) focusAreas.add("hpc");
  if (includesAny(text, ["edge", "distributed"])) focusAreas.add("edge");
  if (!focusAreas.size) focusAreas.add("general");

  if (includesAny(text, ["power", "electrical", "generator", "ups", "substation", "switchgear", "busway", "pdu"])) infrastructureTypes.add("power");
  if (includesAny(text, ["cooling", "immersion", "thermal", "hvac", "liquid", "rear door", "chip cooling"])) infrastructureTypes.add("cooling");
  if (includesAny(text, ["gpu", "compute", "hosting", "colocation", "cluster"])) infrastructureTypes.add("compute");
  if (includesAny(text, ["modular", "containerized", "prefab", "enclosure", "shell"])) infrastructureTypes.add("facility");
  if (includesAny(text, ["dcim", "controls", "monitoring", "telemetry", "software"])) infrastructureTypes.add("controls");
  if (includesAny(text, ["commissioning", "field service", "maintenance", "integration"])) infrastructureTypes.add("services");
  if (includesAny(text, ["logistics", "shipping", "transport", "heavy haul"])) infrastructureTypes.add("logistics");

  if (includesAny(text, ["immersion"])) coolingTypes.add("immersion");
  if (includesAny(text, ["direct to chip", "direct-to-chip", "cold plate"])) coolingTypes.add("direct_to_chip");
  if (includesAny(text, ["rear door", "rear-door"])) coolingTypes.add("rear_door");
  if (includesAny(text, ["chilled water"])) coolingTypes.add("chilled_water");
  if (includesAny(text, ["dx", "direct expansion"])) coolingTypes.add("dx");
  if (includesAny(text, ["evaporative"])) coolingTypes.add("evaporative");
  if (includesAny(text, ["liquid loop", "cdu"])) coolingTypes.add("liquid_loop");

  if (includesAny(text, ["switchgear"])) powerSpecializations.add("switchgear");
  if (includesAny(text, ["pdu"])) powerSpecializations.add("pdu");
  if (includesAny(text, ["busway", "bus duct"])) powerSpecializations.add("busway");
  if (includesAny(text, ["ups", "battery"])) powerSpecializations.add("ups");
  if (includesAny(text, ["generator", "genset"])) powerSpecializations.add("generator");
  if (includesAny(text, ["microgrid"])) powerSpecializations.add("microgrid");
  if (includesAny(text, ["substation"])) powerSpecializations.add("substation");
  if (includesAny(text, ["ats", "transfer switch"])) powerSpecializations.add("ats");
  if (includesAny(text, ["monitoring", "metering", "energy management"])) powerSpecializations.add("monitoring");

  if (includesAny(text, ["hyperscale"])) deploymentModels.add("hyperscale");
  if (includesAny(text, ["colocation", "hosting"])) deploymentModels.add("colocation");
  if (includesAny(text, ["edge", "distributed"])) deploymentModels.add("edge");
  if (includesAny(text, ["modular", "prefab"])) deploymentModels.add("modular");
  if (includesAny(text, ["containerized", "container"])) deploymentModels.add("containerized");
  if (includesAny(text, ["retrofit", "upgrade"])) deploymentModels.add("retrofit");
  if (includesAny(text, ["microgrid", "on site generation", "on-site generation"])) deploymentModels.add("on_site_generation");

  if (includesAny(text, ["startup", "emerging"])) companyTypes.add("startup");
  if (includesAny(text, ["regional", "local", "midwest", "texas", "europe", "latam", "apac"])) companyTypes.add("regional_provider");
  if (includesAny(text, ["industrial", "fabrication", "electrical contractor", "oem"])) companyTypes.add("industrial_supplier");
  if (!companyTypes.size) companyTypes.add("private");

  if (includesAny(text, ["hyperscale"])) scaleFocus.add("hyperscale");
  if (includesAny(text, ["edge"])) scaleFocus.add("edge");
  if (includesAny(text, ["regional", "distributed"])) scaleFocus.add("regional");
  if (!scaleFocus.size) scaleFocus.add("enterprise");

  if (vendor.categories.includes("power-and-electrical")) {
    subcategories.add("switchgear-pdu-busway");
    dependencyCategorySlugs.add("generators-and-microgrids");
  }
  if (vendor.categories.includes("liquid-cooling")) {
    subcategories.add("direct-to-chip-cooling");
    subcategories.add("liquid-loop-systems");
  }
  if (vendor.categories.includes("immersion-cooling")) {
    subcategories.add("single-phase-immersion");
  }
  if (vendor.categories.includes("modular-prefab")) {
    subcategories.add("fabricated-enclosures-and-shells");
  }
  if (vendor.categories.includes("ai-colocation-gpu-hosting")) {
    subcategories.add("managed-ai-colocation");
  }
  if (vendor.categories.includes("edge-micro-data-centers")) {
    subcategories.add("regional-edge-operators");
  }
  if (vendor.categories.includes("monitoring-and-controls")) {
    subcategories.add("dcim-and-observability");
  }
  if (vendor.categories.includes("field-services-and-maintenance")) {
    subcategories.add("electrical-integration-services");
  }

  const relatedCompanySlugs = inferRelatedCompanies(vendor, { tags: [...tags], focusAreas: [...focusAreas], infrastructureTypes: [...infrastructureTypes] });

  return {
    slug: vendor.slug,
    legalName: vendor.name,
    tagline: vendor.headline,
    subcategories: [...subcategories],
    tags: [...tags],
    regions: vendor.regions ?? [],
    infrastructureTypes: [...infrastructureTypes],
    coolingTypes: [...coolingTypes],
    powerSpecializations: [...powerSpecializations],
    deploymentModels: [...deploymentModels],
    ecosystemRoles: [...roles],
    focusAreas: [...focusAreas],
    scaleFocus: [...scaleFocus],
    companyTypes: [...companyTypes],
    relatedCompanySlugs,
    dependencyCategorySlugs: [...dependencyCategorySlugs],
    oftenUsedWithCategorySlugs: [...oftenUsedWithCategorySlugs],
    lastMappedAt: "2026-05-06",
  };
}

function inferRelatedCompanies(vendor: Vendor, profile: { tags: string[]; focusAreas: InfrastructureFocus[]; infrastructureTypes: InfrastructureType[] }) {
  const vendorTokens = new Set(vendor.categories);
  profile.tags.forEach((tag) => vendorTokens.add(tag));
  profile.focusAreas.forEach((tag) => vendorTokens.add(tag));
  profile.infrastructureTypes.forEach((tag) => vendorTokens.add(tag));

  return [] as string[];
}

export function getRelatedCompanies(vendor: Vendor, allVendors: Vendor[]) {
  const profile = inferVendorRoleProfile(vendor);
  const selfTokens = new Set([
    ...vendor.categories,
    ...(profile.subcategories ?? []),
    ...(profile.tags ?? []),
    ...(profile.focusAreas ?? []),
    ...(profile.infrastructureTypes ?? []),
  ]);

  return allVendors
    .filter((candidate) => candidate.slug !== vendor.slug)
    .map((candidate) => {
      const candidateProfile = inferVendorRoleProfile(candidate);
      const candidateTokens = new Set([
        ...candidate.categories,
        ...(candidateProfile.subcategories ?? []),
        ...(candidateProfile.tags ?? []),
        ...(candidateProfile.focusAreas ?? []),
        ...(candidateProfile.infrastructureTypes ?? []),
      ]);

      const overlap = [...selfTokens].filter((token) => candidateTokens.has(token)).length;
      return { candidate, overlap };
    })
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || a.candidate.name.localeCompare(b.candidate.name))
    .slice(0, 6)
    .map((entry) => entry.candidate);
}
