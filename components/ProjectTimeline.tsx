import type { ProjectItem } from "@/lib/project-data";

export function ProjectTimeline({ groups }: { groups: Array<[number, ProjectItem[]]> }) {
  if (!groups.length) {
    return (
      <div className="border border-dashed border-black/20 bg-white p-8 text-center text-sm font-bold text-steel">
        조건에 맞는 2012~2020 프로젝트가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {groups.map(([year, items]) => (
        <section key={year} className="soft-rise grid gap-5 md:grid-cols-[120px_1fr]">
          <div className="md:sticky md:top-28 md:self-start">
            <div className="border-l-4 border-signal bg-white px-5 py-4 shadow-sm">
              <p className="text-3xl font-black text-graphite">{year}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-steel">{items.length} Projects</p>
            </div>
          </div>
          <div className="relative border-l border-cobalt/20 pl-5 md:pl-8">
            <div className="space-y-3">
              {items.map((project) => (
                <article key={project.id} className="group relative border border-black/10 bg-white p-5 shadow-sm transition hover:border-cobalt/30 hover:shadow-industrial">
                  <span className="absolute -left-[27px] top-6 h-3 w-3 border-2 border-white bg-cobalt shadow-sm md:-left-[35px]" />
                  <div className="flex flex-wrap items-center gap-3">
                    <strong className="text-sm font-black text-cobalt">{project.client}</strong>
                    <span className="border border-cobalt/15 px-2 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-steel">
                      {project.category}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black leading-snug text-graphite">{project.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-7 text-steel">{project.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
