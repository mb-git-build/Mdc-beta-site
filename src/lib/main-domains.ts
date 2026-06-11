import { categories, getChildCategories, vendors, type Category } from "@/lib/site-data";

export type MainDomain = {
  slug: string;
  name: string;
  description: string;
  categorySlugs: string[];
};

export const mainDomains: MainDomain[] = [
  {
    slug: "modular-infrastructure",
    name: "Modular Infrastructure",
    description: "Factory-built, packaged, and rapidly deployable infrastructure systems spanning modular builds, containerized delivery, and prefabricated power blocks.",
    categorySlugs: [
      "modular-prefab",
      "containerized-data-centers",
    ],
  },
  {
    slug: "ai-infrastructure-compute",
    name: "AI Infrastructure & Compute",
    description: "AI-ready deployment models, dense rack environments, hosted GPU capacity, and edge compute pathways for modern infrastructure programs.",
    categorySlugs: [
      "ai-colocation-gpu-hosting",
      "edge-micro-data-centers",
      "high-density-rack-power",
    ],
  },
  {
    slug: "power-electrical",
    name: "Power & Electrical",
    description: "Electrical backbone, resiliency systems, generation, storage, and packaged power delivery for compute-heavy environments.",
    categorySlugs: [
      "power-and-electrical",
      "generators-and-microgrids",
      "ups-and-battery-storage",
    ],
  },
  {
    slug: "cooling-thermal",
    name: "Cooling & Thermal",
    description: "Thermal management lanes covering liquid, immersion, HVAC, rejection systems, and dense rack cooling strategies.",
    categorySlugs: [
      "liquid-cooling",
      "immersion-cooling",
      "hvac-and-thermal-rejection",
      "rear-door-direct-to-chip-cooling",
    ],
  },
  {
    slug: "network-connectivity",
    name: "Network & Connectivity",
    description: "Network fabric, connectivity, and related infrastructure layers that support AI clusters, colocation, and distributed deployment footprints.",
    categorySlugs: [
      "network-fabric-and-connectivity",
    ],
  },
  {
    slug: "operations-maintenance",
    name: "Operations & Maintenance",
    description: "Delivery, integration, commissioning, controls, and operational layers that make infrastructure work in the field and stay reliable.",
    categorySlugs: [
      "monitoring-and-controls",
      "field-services-and-maintenance",
      "epc-and-commissioning",
      "construction-and-integration",
      "commissioning-and-operations",
    ],
  },
  {
    slug: "site-strategy-energy",
    name: "Site Strategy & Energy",
    description: "Site selection, land strategy, energy planning, and longer-horizon deployment decisions that shape infrastructure feasibility.",
    categorySlugs: [
      "site-selection-and-land-strategy",
      "sustainability-and-energy-strategy",
    ],
  },
  {
    slug: "logistics-supply-chain",
    name: "Logistics & Supply Chain",
    description: "Physical deployment logistics, procurement friction, and supply-chain realities that determine whether infrastructure ships and lands on time.",
    categorySlugs: [
      "supply-chain-and-logistics",
    ],
  },
];

export type MainDomainCategoryRow = Category & {
  subcategoryCount: number;
  companyCount: number;
  representativeCompanies: typeof vendors;
};

export function getCategoryCompanySet(categorySlug: string) {
  const childSlugs = getChildCategories(categorySlug).map((child) => child.slug);
  const slugs = [categorySlug, ...childSlugs];
  return vendors.filter((vendor) => vendor.categories.some((slug) => slugs.includes(slug)));
}

export function getMainDomainRows() {
  return mainDomains.map((domain) => {
    const categoriesForDomain: MainDomainCategoryRow[] = domain.categorySlugs
      .map((slug) => categories.find((category) => category.slug === slug))
      .filter((category): category is Category => Boolean(category))
      .map((category) => {
        const subcategories = getChildCategories(category.slug);
        const categoryCompanies = getCategoryCompanySet(category.slug);

        return {
          ...category,
          subcategoryCount: subcategories.length,
          companyCount: categoryCompanies.length,
          representativeCompanies: categoryCompanies.slice(0, 5),
        };
      })
      .sort((a, b) => {
        if (b.companyCount !== a.companyCount) {
          return b.companyCount - a.companyCount;
        }
        return a.name.localeCompare(b.name);
      });

    return {
      ...domain,
      categories: categoriesForDomain,
      categoryCount: categoriesForDomain.length,
      subcategoryCount: categoriesForDomain.reduce((sum, category) => sum + category.subcategoryCount, 0),
      companyCount: categoriesForDomain.reduce((sum, category) => sum + category.companyCount, 0),
    };
  });
}
