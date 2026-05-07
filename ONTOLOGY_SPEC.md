# ONTOLOGY_SPEC.md

## Purpose

This document is the canonical ontology reference for `modulardatacenters.ai`.

It defines the structured modeling system that should guide:
- ecosystem expansion
- vendor ingestion
- category design
- metadata conventions
- relationship modeling
- discovery logic
- future schema refinement

Before major implementation passes, review:
- `PROJECT_CHARTER.md`
- `ONTOLOGY_SPEC.md`

---

## Ontology Goal

The project is evolving from a directory into a **typed infrastructure intelligence graph**.

That means the core system should increasingly model:
- typed entities
- typed attributes
- typed relationships
- layered infrastructure context
- adjacency and dependency structure
- deployment fit
- ecosystem role

The ontology should help make the system more:
- consistent
- extensible
- composable
- queryable
- useful for discovery

---

## Core Entity Types

### 1. Company
Represents a vendor, operator, integrator, supplier, developer, service provider, or other ecosystem participant.

Possible examples:
- power equipment manufacturer
- immersion cooling startup
- modular integrator
- regional electrical contractor
- GPU hosting operator
- field services provider
- energy platform company

### 2. Category
A major infrastructure segment.

Examples:
- Power & Electrical Infrastructure
- Liquid Cooling
- AI Colocation & GPU Hosting
- Monitoring & Controls
- Edge & Micro Data Centers

### 3. Subcategory
A more granular classification inside a category.

Examples:
- Switchgear, PDU & Busway
- Direct-to-Chip Cooling
- Modular Substations
- Electrical Integration Services
- Power Monitoring & Energy Management

### 4. Infrastructure Layer
A conceptual layer in the physical AI compute stack.

Examples:
- power
- cooling
- compute
- facility
- controls
- logistics
- services
- networking

### 5. Deployment Model
A deployment context or operational pattern.

Examples:
- hyperscale
- enterprise
- colocation
- modular
- containerized
- edge
- retrofit
- on-site generation
- regional

### 6. Workload / Focus Area
Represents compute or commercial context.

Examples:
- ai
- bitcoin
- hpc
- edge
- general

### 7. Ecosystem Role
Represents how an entity participates in the infrastructure stack.

Examples:
- manufacturer
- integrator
- operator
- service_provider
- developer
- distributor
- regional_provider
- niche_supplier

### 8. Technology / System Type
Represents a specific infrastructure or technical specialization.

Examples:
- switchgear
- pdu
- busway
- ups
- generator
- microgrid
- substation
- immersion
- direct_to_chip
- dcim
- observability

---

## Canonical Relationship Types

Relationships should be typed whenever possible.

### Company → Category
- `belongs_to_category`

### Company → Subcategory
- `belongs_to_subcategory`

### Company → Infrastructure Layer
- `operates_in_layer`
- `supports_layer`

### Company → Deployment Model
- `serves_deployment_model`

### Company → Workload / Focus Area
- `supports_workload`
- `focuses_on_workload`

### Company → Ecosystem Role
- `has_ecosystem_role`

### Company → Company
- `related_to_company`
- `commonly_compared_with`
- `commonly_used_with_company`
- `competes_with`
- `partners_with`
- `integrates_with_company`

### Company → Technology / System Type
- `supports_technology`
- `specializes_in`
- `integrates_with_technology`

### Category → Category
- `adjacent_to`
- `commonly_used_with`
- `depends_on`
- `is_upstream_of`
- `is_downstream_of`

### Deployment Model → Category
- `commonly_requires`
- `frequently_includes`

### Infrastructure Layer → Infrastructure Layer
- `depends_on_layer`
- `interacts_with_layer`

---

## Infrastructure Layers

These layers describe the physical AI compute ecosystem at a high level.

### Power
Examples:
- switchgear
- ATS
- substations
- busway
- PDUs
- UPS
- generators
- microgrids
- energy storage

### Cooling
Examples:
- immersion cooling
- liquid cooling
- direct-to-chip
- rear-door heat exchange
- HVAC
- heat rejection
- thermal controls

### Compute / Hosting
Examples:
- GPU hosting
- AI colocation
- HPC hosting
- mining infrastructure operations
- edge compute environments

### Facility / Physical Shell
Examples:
- modular buildings
- prefabricated skids
- containerized systems
- enclosures
- fabricated infrastructure packages

### Controls / Monitoring
Examples:
- DCIM
- power monitoring
- thermal observability
- automation
- telemetry
- energy management

### Networking / Connectivity
Examples:
- switching
- optics
- interconnects
- structured cabling
- fabric systems

### Services / Integration
Examples:
- EPC
- commissioning
- electrical integration
- field services
- maintenance
- deployment support

### Logistics / Delivery
Examples:
- heavy haul
- rigging
- site delivery
- modular transport
- deployment logistics

### Land / Energy / Siting
Examples:
- site selection
- land strategy
- utility coordination
- energy sourcing
- sustainability planning

---

## Ecosystem Role System

A company may have one or more ecosystem roles.

### Canonical roles
- `manufacturer`
- `integrator`
- `operator`
- `service_provider`
- `developer`
- `distributor`
- `regional_provider`
- `niche_supplier`

### Notes
- roles are not mutually exclusive
- role assignment should reflect real participation in the stack
- use multiple roles where necessary
- do not force one “primary” role when the company meaningfully spans several

Examples:
- a modular AI infrastructure startup may be both `developer` and `integrator`
- a cooling OEM may be `manufacturer`
- a regional electrical contractor may be `integrator` and `service_provider`
- a GPU hosting operator is usually `operator`

---

## Deployment Model System

Deployment models should describe where and how infrastructure is used.

### Canonical models
- `hyperscale`
- `enterprise`
- `colocation`
- `modular`
- `containerized`
- `edge`
- `retrofit`
- `on_site_generation`
- `regional`
- `industrial`

### Rules
- use deployment models to describe context, not marketing language
- a company may support multiple models
- deployment models are a discovery and filtering dimension

---

## Workload / Focus Area System

These classify the operational or market context.

### Canonical focus areas
- `ai`
- `bitcoin`
- `hpc`
- `edge`
- `general`

### Rules
- `general` is acceptable when specialization is unclear
- do not over-assign `ai` unless it is genuinely relevant
- `bitcoin` matters because mining infrastructure overlaps with physical AI compute infrastructure in meaningful ways

---

## Taxonomy Structure Rules

### 1. Categories should represent meaningful infrastructure segments
Categories should be legible to real operators, builders, and researchers.

### 2. Subcategories should improve precision, not add noise
Only create subcategories when they increase discovery quality or structural usefulness.

### 3. Parent-child relationships must stay clear
A subcategory should point to one clear parent category unless there is a very strong reason otherwise.

### 4. Cross-category relevance belongs in relationships, not taxonomy confusion
If something touches several segments, keep taxonomy clean and express overlap through relationships.

### 5. Taxonomy should reflect real-world deployment patterns
The taxonomy should mirror how infrastructure is actually bought, deployed, integrated, and operated.

---

## Metadata Conventions

Metadata should be structured, typed, and reusable.

### Company metadata targets
- `slug`
- `name`
- `website_url`
- `headline`
- `categories`
- `subcategories`
- `tags`
- `regions`
- `deployment_types`
- `buyer_types`
- `specialties`
- `infrastructure_types`
- `cooling_types`
- `power_specializations`
- `focus_areas`
- `scale_focus`
- `ecosystem_roles`
- `company_types`
- `related_company_slugs`
- `dependency_category_slugs`
- `often_used_with_category_slugs`
- `proof_points`
- `featured_capabilities`
- `comparison_notes`
- `hq`
- `service_area`
- `project_scale`
- `logo_url` (optional)

### Category metadata targets
- `slug`
- `name`
- `description`
- `parent_slug` (for subcategories)
- `layer`
- `tags`
- `adjacent_category_slugs`
- `often_used_with`

### Rules
- prefer arrays over overloaded strings where structure matters
- avoid mixing prose and structured tags in the same field
- use normalized slugs for relationships
- avoid one-off custom fields unless they unlock repeated value

---

## Adjacency Logic

Adjacency is important because users often need to move across neighboring infrastructure layers.

### Category adjacency means
Two categories are commonly explored together because they are:
- technically related
- operationally related
- procurement-adjacent
- deployment-adjacent
- dependency-linked

Examples:
- `power-and-electrical` ↔ `generators-and-microgrids`
- `liquid-cooling` ↔ `high-density-rack-power`
- `modular-prefab` ↔ `field-services-and-maintenance`
- `ai-colocation-gpu-hosting` ↔ `network-fabric-and-connectivity`

### Adjacency rules
- adjacency should improve discovery
- adjacency should reflect real user movement through the stack
- adjacency should not become a random related-links dump

---

## Dependency Modeling

Dependencies are stronger than adjacency.

A dependency suggests one layer or category is often functionally required by another.

Examples:
- high-density GPU hosting may depend on liquid cooling and high-density rack power
- modular deployments may depend on electrical integration and logistics
- on-site generation deployments may depend on substations, ATS systems, and controls

### Rules
- use dependency logic sparingly and meaningfully
- distinguish between “related” and “required”
- model strong operational relationships explicitly when useful

---

## Relationship Quality Rules

### 1. Typed beats implied
If a relationship matters repeatedly, it should eventually be modeled explicitly.

### 2. Real-world usefulness beats theoretical completeness
Do not add ontology complexity that does not improve discovery, classification, or user understanding.

### 3. Consistency matters more than cleverness
A simpler consistent model is better than an elaborate inconsistent one.

### 4. Avoid speculative relationship inflation
Do not invent too many exotic relationship types prematurely.
Add structure when it solves a real repeated problem.

---

## Future Extensibility Rules

As the system scales to hundreds or thousands of entities:

### Preserve
- typed entities
- typed relationships
- normalized slugs
- stable category hierarchy
- consistent metadata naming
- self-contained repo clarity where practical

### Avoid
- ad hoc field sprawl
- taxonomy duplication
- inconsistent relationship naming
- overly editorial, non-structured records
- schema drift caused by one-off ingestion shortcuts

### Add only when justified
New fields or relationship types should be added when they:
- improve discovery
- improve filtering
- improve modeling fidelity
- improve ecosystem intelligence
- apply across multiple entities or categories

---

## Operational Doctrine

Before major future implementation passes:
1. review `PROJECT_CHARTER.md`
2. review `ONTOLOGY_SPEC.md`
3. confirm the work improves structured ecosystem intelligence
4. avoid architectural drift
5. prefer graph quality over page quantity

---

## Guiding Principle

The product should move from:
- records with copy

toward:
- typed entities with typed relationships

That is the path from directory to infrastructure intelligence graph.
