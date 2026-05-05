import { getMarkdownPageBySlug } from "@/lib/site-data";

const page = getMarkdownPageBySlug("/about");

export default function AboutPage() {
  const firstTwo = page?.sections.slice(0, 2) ?? [];
  const remaining = page?.sections.slice(2) ?? [];

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
          <div className="bg-[linear-gradient(135deg,#102c3c_0%,#295a74_100%)] p-8 text-white lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">About</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{page?.title ?? "About modulardatacenters.ai"}</h1>
            <p className="mt-5 max-w-3xl text-sm leading-8 text-white/85">
              Buyer-first infrastructure intelligence for modular, cooling, power, and colocation decisions.
            </p>
          </div>
          <div className="p-8 lg:p-10">
            {page?.intro.map((paragraph) => (
              <p key={paragraph} className="mt-5 max-w-3xl text-sm leading-8 text-[var(--muted)] first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {firstTwo.length > 0 ? (
          <section className="grid gap-6 lg:grid-cols-2">
            {firstTwo.map((section) => (
              <article key={section.heading} className="rounded-[1.5rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-card)]">
                <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-sm leading-8 text-[var(--muted)]">
                    {paragraph}
                  </p>
                ))}
                {section.bullets.length > 0 ? (
                  <ul className="mt-5 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                    {section.bullets.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </section>
        ) : null}

        {remaining.map((section) => (
          <section key={section.heading} className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-sm leading-8 text-[var(--muted)]">
                {paragraph}
              </p>
            ))}
            {section.bullets.length > 0 ? (
              <ul className="mt-5 grid gap-3 text-sm leading-7 text-[var(--muted)]">
                {section.bullets.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
