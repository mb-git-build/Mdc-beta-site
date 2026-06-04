import Link from "next/link";

type RoutingPath = {
  question: string;
  routing: string;
  recommendedPath: string;
  supplierSet: string;
  href: string;
  cta: string;
  tone: "compare" | "directory" | "categories" | "vendors";
};

const routingPaths: RoutingPath[] = [
  {
    question: "I know the business problem, but not the right deployment path yet.",
    routing: "Start with the executive question.",
    recommendedPath: "Compare",
    supplierSet: "Cross-path supplier sets spanning hosting, modular delivery, cooling, power, and retrofit options.",
    href: "/compare",
    cta: "Start with compare",
    tone: "compare",
  },
  {
    question: "I need to move fast from a bottleneck into the right market lane.",
    routing: "Start with guided pathways.",
    recommendedPath: "Directory",
    supplierSet: "Category-linked supplier sets organized around common deployment bottlenecks and adjacent systems.",
    href: "/directory",
    cta: "Open guided pathways",
    tone: "directory",
  },
  {
    question: "I know the infrastructure problem, but not the exact segment.",
    routing: "Start with the category ecosystem.",
    recommendedPath: "Categories",
    supplierSet: "Relevant supplier sets grouped by cooling, power, deployment, operations, site strategy, and controls lanes.",
    href: "/categories",
    cta: "Explore categories",
    tone: "categories",
  },
  {
    question: "I already know the type of company I want to evaluate.",
    routing: "Start with company research.",
    recommendedPath: "Vendors",
    supplierSet: "Direct company profiles with category tags, overlap clues, service area context, and shortlist expansion links.",
    href: "/vendors",
    cta: "Review vendors",
    tone: "vendors",
  },
];

const executiveQuestions = [
  {
    title: "Need Capacity Fast",
    path: "Compare → Directory",
    body: "Frame the path first, then move into operators, modular delivery, and adjacent power lanes with a narrower supplier set.",
    href: "/compare",
  },
  {
    title: "Need GPU Hosting",
    path: "Compare → Directory",
    body: "Use hosting-first routing when the executive question is speed, outsourcing, or near-term capacity rather than full-stack ownership.",
    href: "/compare",
  },
  {
    title: "Need Modular Deployment",
    path: "Directory",
    body: "Go directly into modular, prefab power, integration, logistics, and commissioning pathways as one coherent deployment chain.",
    href: "/directory/modular-prefab",
  },
  {
    title: "Need Liquid Cooling",
    path: "Directory → Categories",
    body: "Open thermal pathways first, then branch into adjacent rejection, monitoring, and operational layers before narrowing vendors.",
    href: "/directory/liquid-cooling",
  },
  {
    title: "Have Constrained Power",
    path: "Compare → Categories",
    body: "Start from the bottleneck, then trace power, generation, UPS, siting, and resilience layers that shape which supplier set is actually relevant.",
    href: "/compare",
  },
  {
    title: "Need Supplier Research Now",
    path: "Vendors",
    body: "Move straight into company profiles when the architecture path is already clear and the immediate need is shortlist review.",
    href: "/vendors",
  },
];

const pathLegend = [
  {
    label: "Compare",
    body: "Best first step when the real decision is between deployment paths, not between brands.",
  },
  {
    label: "Directory",
    body: "Best first step when you need a guided route from bottleneck to relevant infrastructure lane.",
  },
  {
    label: "Categories",
    body: "Best first step when you know the technical problem but need the right ecosystem segment.",
  },
  {
    label: "Vendors",
    body: "Best first step when you already know the type of supplier you want to compare.",
  },
];

function toneClasses(tone: RoutingPath["tone"]) {
  switch (tone) {
    case "compare":
      return {
        pill: "bg-sky-100 text-sky-800",
        button: "bg-[var(--accent-strong)] text-white shadow-[0_12px_24px_rgba(16,44,60,0.14)]",
      };
    case "directory":
      return {
        pill: "bg-emerald-100 text-emerald-800",
        button: "bg-emerald-600 text-white shadow-[0_12px_24px_rgba(5,150,105,0.16)]",
      };
    case "categories":
      return {
        pill: "bg-violet-100 text-violet-800",
        button: "bg-violet-600 text-white shadow-[0_12px_24px_rgba(124,58,237,0.16)]",
      };
    case "vendors":
    default:
      return {
        pill: "bg-amber-100 text-amber-800",
        button: "bg-amber-500 text-slate-950 shadow-[0_12px_24px_rgba(245,158,11,0.18)]",
      };
  }
}

export default function GetMatchedPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Executive Starting Point</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl">One place to start when you are not sure where to begin.</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Start with the question you have right now. This page routes executives into the right next surface, recommends the best path, and points toward the supplier set that will actually matter.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pathLegend.map((item) => (
              <div key={item.label} className="rounded-[1.2rem] border border-[var(--border)] bg-[#f8fbfd] p-4">
                <p className="text-sm font-semibold tracking-tight text-[var(--foreground)]">{item.label}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--border)] bg-[rgba(247,250,252,0.92)] p-6 shadow-[0_10px_24px_rgba(16,44,60,0.04)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Question → routing → recommended path → supplier set</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Choose the clearest starting point.</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              If you do not know whether to begin with compare, directory, categories, or vendors, start here and pick the card that sounds most like your real situation.
            </p>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {routingPaths.map((path) => {
              const styles = toneClasses(path.tone);
              return (
                <article key={path.question} className="rounded-[1.3rem] border border-[var(--border)] bg-white p-5 shadow-[0_10px_24px_rgba(16,44,60,0.04)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${styles.pill}`}>
                      Recommended path: {path.recommendedPath}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-[var(--foreground)]">{path.question}</h3>
                  <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Routing</p>
                      <p>{path.routing}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Recommended path</p>
                      <p>{path.recommendedPath}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Relevant supplier sets</p>
                      <p>{path.supplierSet}</p>
                    </div>
                  </div>
                  <Link
                    href={path.href}
                    className={`mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${styles.button}`}
                  >
                    {path.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[0_10px_24px_rgba(16,44,60,0.04)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Common executive questions</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">A few obvious ways to begin.</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              These are the most common first questions. Each one routes into the path that makes the next supplier set easier to understand.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {executiveQuestions.map((item) => (
              <Link key={item.title} href={item.href} className="rounded-[1.2rem] border border-[var(--border)] bg-[#fbfcfd] p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{item.path}</p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
