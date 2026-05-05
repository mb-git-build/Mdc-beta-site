import Link from "next/link";
import { getGuides } from "@/lib/site-data";

const guides = getGuides();

function normalizeGuideSlug(slug: string) {
  return slug.replace(/^\/guides\//, "").replace(/\/$/, "");
}

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: normalizeGuideSlug(guide.slug) }));
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const matchedGuide = guides.find((guide) => normalizeGuideSlug(guide.slug) === slug);

  if (!matchedGuide) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-[var(--border)] bg-white p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Not found</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Guide not found</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">This guide is not available yet.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
          <div className="bg-[linear-gradient(135deg,#102c3c_0%,#295a74_100%)] p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">Guide</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{matchedGuide.title}</h1>
            <div className="mt-5 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.14em] text-white/70">
              <span>{matchedGuide.page.sections.length} sections</span>
              <span>{matchedGuide.page.sections.reduce((count, section) => count + section.bullets.length + section.ordered.length, 0)} decision points</span>
            </div>
          </div>
          <div className="p-8">
            {matchedGuide.page.intro.map((paragraph) => (
              <p key={paragraph} className="mt-5 max-w-3xl text-sm leading-8 text-[var(--muted)] first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <div className="grid gap-6">
          {matchedGuide.page.sections.map((section, index) => (
            <section key={section.heading} className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-strong)]">
                  {index + 1}
                </span>
                <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
              </div>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-sm leading-7 text-[var(--muted)]">
                  {paragraph}
                </p>
              ))}
              {section.bullets.length > 0 ? (
                <ul className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                  {section.bullets.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : null}
              {section.ordered.length > 0 ? (
                <ol className="mt-4 grid gap-2 text-sm leading-7 text-[var(--muted)]">
                  {section.ordered.map((item, orderedIndex) => (
                    <li key={item}>{orderedIndex + 1}. {item}</li>
                  ))}
                </ol>
              ) : null}
            </section>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/guides" className="inline-flex rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--accent)]">
            Back to guides
          </Link>
          <Link href="/categories" className="inline-flex rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white">
            Explore category graph
          </Link>
        </div>
      </div>
    </main>
  );
}
