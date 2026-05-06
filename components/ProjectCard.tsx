import type { ProjectItem } from "@/lib/project-data";

export function ProjectCard({ project, compact = false }: { project: ProjectItem; compact?: boolean }) {
  return (
    <article
      className={[
        "group border border-black/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-signal/40 hover:shadow-industrial",
        compact ? "p-5" : "p-6 md:p-7"
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-graphite px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">{project.year}</span>
            {project.month ? <span className="text-xs font-black text-steel">{project.month}월</span> : null}
            {project.featured ? <span className="bg-signal px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">NEW</span> : null}
          </div>
          <p className="mt-4 text-sm font-black text-cobalt">{project.client}</p>
        </div>
        <span className="shrink-0 border border-cobalt/15 bg-cobalt/5 px-3 py-1 text-xs font-black text-cobalt">{project.category}</span>
      </div>

      <h3 className="mt-5 text-xl font-black leading-snug text-graphite md:text-2xl">{project.title}</h3>
      <p className="mt-4 text-sm font-semibold leading-7 text-steel md:text-[15px]">{project.summary}</p>
      <div className="mt-6 h-[3px] w-12 bg-signal transition-all duration-300 group-hover:w-24" />
    </article>
  );
}
