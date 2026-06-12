import { categories, getChildCategories, vendors, type Category } from "@/lib/site-data";

export type MainDomain = {
  slug: string;
  name: string;
  categorySlugs: string[];
};

export const mainDomains: MainDomain[] = [
  {
    slug: "power-electrical",
    name: "Power & Electrical",
    categorySlugs: [
      "power-and-electrical",
      "generators-and-microgrids",
      "ups-and-battery-storage",
      "high-density-rack-power",
    ],
  },
  {
    slug: "cooling-thermal",
    name: "Cooling & Thermal",
    categorySlugs: [
      "liquid-cooling",
      "immersion-cooling",
      "hvac-and-thermal-rejection",
      "rear-door-direct-to-chip-cooling",
    ],
  },
  {
    slug: "modular-infrastructure",
    name: "Modular Infrastructure",
    categorySlugs: [
      "modular-prefab",
      "containerized-data-centers",
    ],
  },
  {
    slug: "operations-maintenance",
    name: "Operations & Maintenance",
    categorySlugs: [
      "monitoring-and-controls",
      "field-services-and-maintenance",
      "epc-and-commissioning",
      "construction-and-integration",
      "commissioning-and-operations",
    ],
  },
  {
    slug: "ai-infrastructure-compute",
    name: "AI Infrastructure & Compute",
    categorySlugs: [
      "ai-colocation-gpu-hosting",
      "edge-micro-data-centers",
    ],
  },
  {
    slug: "network-connectivity",
    name: "Network & Connectivity",
    categorySlugs: [
      "network-fabric-and-connectivity",
    ],
  },
  {
    slug: "site-strategy-energy",
    name: "Site Strategy & Energy",
    categorySlugs: [
      "site-selection-and-land-strategy",
      "sustainability-and-energy-strategy",
    ],
  },
  {
    slug: "logistics-supply-chain",
    name: "Logistics & Supply Chain",
    categorySlugs: [
      "supply-chain-and-logistics",
    ],
  },
];

export type MainDomainCategoryRow = Category & {
  subcategoryCount: number;
  companyCount: number;
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
