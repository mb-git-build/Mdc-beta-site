import Link from "next/link";
import { getGuides, getMarkdownPageBySlug } from "@/lib/site-data";

const indexPage = getMarkdownPageBySlug("/guides/");
const guides = getGuides();

export default function GuidesPage() {
  const preface = indexPage?.sections.find((section) => section.heading === "Guides")?.body ?? [];

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Guides</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Research-first buyer guidance</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            These guides are designed to help buyers compare deployment paths, infrastructure tradeoffs, and shortlist criteria.
          </p>
          {(preface.length > 0 ? preface : indexPage?.intro)?.map((paragraph) => (
            <p key={paragraph} className="mt-5 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {guides.map((guide, index) => (
            <article key={guide.slug} className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
              <div className="p-6 text-white" style={{ background: guideGradient(index) }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">Guide</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">{guide.title}</h2>
              </div>
              <div className="p-6">
                {guide.page.intro[0] ? <p className="text-sm leading-7 text-[var(--muted)]">{guide.page.intro[0]}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  <span>{guide.page.sections.length} sections</span>
                  <span>•</span>
                  <span>{guide.page.sections.reduce((count, section) => count + section.bullets.length + section.ordered.length, 0)} key checks</span>
                </div>
                <Link href={guide.slug} className="mt-6 inline-flex text-sm font-semibold text-[var(--accent)]">
                  Read guide →
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function guideGradient(index: number) {
  const gradients = [
    "linear-gradient(135deg,#102c3c 0%,#295a74 100%)",
    "linear-gradient(135deg,#1f2345 0%,#3b4ea1 100%)",
    "linear-gradient(135deg,#203227 0%,#3d7a55 100%)",
  ];

  return gradients[index % gradients.length];
}
