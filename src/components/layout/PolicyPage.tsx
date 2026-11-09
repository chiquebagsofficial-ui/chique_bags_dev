export default function PolicyPage({ title, updated, intro, sections }: { title: string; updated?: string; intro?: string; sections: { heading: string; body: string | string[] }[] }) {
  return (
    <div className="wrap max-w-3xl py-12 lg:py-16">
      <p className="eyebrow">Chique Bags</p>
      <h1 className="h-display mt-2 text-4xl sm:text-5xl">{title}</h1>
      {updated && <p className="mt-2 text-sm text-muted">Last updated {updated}</p>}
      {intro && <p className="mt-6 text-lg leading-relaxed text-muted">{intro}</p>}
      <div className="mt-10 space-y-9">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-serif text-2xl font-semibold">{s.heading}</h2>
            {Array.isArray(s.body) ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted">{s.body.map((b) => <li key={b}>{b}</li>)}</ul>
            ) : (
              <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
