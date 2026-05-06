"use client";

import { useMemo, useState } from "react";
import { projects, type ProjectItem } from "@/lib/project-data";

function groupByYear(items: ProjectItem[]) {
  const groups = new Map<number, ProjectItem[]>();

  items.forEach((item) => {
    const current = groups.get(item.year) ?? [];
    current.push(item);
    groups.set(item.year, current);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, group]) => [
      year,
      group.sort((a, b) => (b.month ?? 0) - (a.month ?? 0))
    ] as [number, ProjectItem[]]);
}

function MobileProjectCard({ project }: { project: ProjectItem }) {
  return (
    <article className="border border-black/10 bg-white p-5 shadow-sm transition hover:border-cobalt/30 md:hidden">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm font-black text-signal">{project.month ? `${project.month}월` : "-"}</strong>
        <span className="text-xs font-black uppercase tracking-[0.16em] text-steel">{project.year}</span>
      </div>
      <p className="mt-4 text-sm font-black text-cobalt">{project.client}</p>
      <h3 className="mt-2 text-lg font-black leading-snug text-graphite">{project.title}</h3>
    </article>
  );
}

function RecentProjectTable({ groups }: { groups: Array<[number, ProjectItem[]]> }) {
  return (
    <div className="space-y-8">
      {groups.map(([year, items]) => (
        <section key={year} className="soft-rise">
          <div className="mb-3 border-b border-cobalt/20 pb-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-steel">Project Reference</p>
            <h2 className="mt-1 text-3xl font-black text-graphite">{year}</h2>
          </div>

          <div className="hidden overflow-hidden border border-black/10 bg-white shadow-sm md:block">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[#f4f6f7] text-xs font-black uppercase tracking-[0.16em] text-steel">
                <tr>
                  <th className="w-20 px-5 py-4">연도</th>
                  <th className="w-20 px-5 py-4">월</th>
                  <th className="w-56 px-5 py-4">업체명</th>
                  <th className="px-5 py-4">공사명</th>
                </tr>
              </thead>
              <tbody>
                {items.map((project) => (
                  <tr key={project.id} className="border-t border-black/10 transition hover:bg-cobalt/5">
                    <td className="px-5 py-5 text-sm font-black text-graphite">{project.year}</td>
                    <td className="px-5 py-5 text-sm font-black text-signal">{project.month ? `${project.month}월` : "-"}</td>
                    <td className="px-5 py-5 text-sm font-black leading-6 text-cobalt">{project.client}</td>
                    <td className="px-5 py-5 text-base font-bold leading-7 text-graphite">{project.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {items.map((project) => (
              <MobileProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LegacyTimeline({ groups }: { groups: Array<[number, ProjectItem[]]> }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="border border-black/10 bg-white p-5 shadow-sm md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">History</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-graphite md:text-4xl">주요 연혁 / 과거 수행실적</h2>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="border border-cobalt/20 px-5 py-3 text-sm font-black text-cobalt transition hover:bg-cobalt hover:text-white"
        >
          {expanded ? "간략히 보기" : "2012~2020 실적 보기"}
        </button>
      </div>

      <div className="mt-8 space-y-6">
        {groups.map(([year, items]) => {
          const visibleItems = expanded ? items : items.slice(0, 2);

          return (
            <div key={year} className="grid gap-4 md:grid-cols-[110px_1fr]">
              <div className="border-l-4 border-signal pl-4">
                <p className="text-2xl font-black text-graphite">{year}</p>
              </div>
              <div className="space-y-3 border-l border-cobalt/15 pl-5">
                {visibleItems.map((project) => (
                  <article key={project.id} className="relative bg-[#f7f8f8] p-4 transition hover:bg-cobalt/5">
                    <span className="absolute -left-[27px] top-5 h-3 w-3 border-2 border-white bg-cobalt" />
                    <strong className="text-sm font-black text-cobalt">
                      {project.month ? `${project.month}월 · ` : ""}
                      {project.client}
                    </strong>
                    <h3 className="mt-2 text-base font-black leading-snug text-graphite">{project.title}</h3>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ReferenceExplorer() {
  const recentGroups = useMemo(() => groupByYear(projects.filter((project) => project.year >= 2021)), []);
  const legacyGroups = useMemo(() => groupByYear(projects.filter((project) => project.year >= 2012 && project.year <= 2020)), []);

  return (
    <div className="space-y-16">
      <RecentProjectTable groups={recentGroups} />
      <LegacyTimeline groups={legacyGroups} />
    </div>
  );
}
