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
  const visibleGroups = expanded ? groups : groups.slice(0, 3);

  return (
    <section className="mt-20 border-t border-black/10 pt-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">Archive</p>
          <h2 className="mt-3 text-3xl font-black text-graphite md:text-4xl">2012~2020 과거 수행실적</h2>
        </div>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="border border-black/15 bg-white px-5 py-3 text-sm font-black hover:border-signal hover:text-signal">
          {expanded ? "간략히 보기" : "2012~2020 실적 보기"}
        </button>
      </div>

      <div className="space-y-5">
        {visibleGroups.map(([year, items]) => (
          <div key={year} className="grid gap-4 border-l-4 border-cobalt bg-white p-5 shadow-sm md:grid-cols-[120px_1fr]">
            <div>
              <span className="text-3xl font-black text-cobalt">{year}</span>
            </div>
            <div className="grid gap-3">
              {items.map((project) => (
                <div key={project.id} className="border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                  <p className="text-sm font-black text-signal">{project.month ? `${project.month}월` : "-"}</p>
                  <p className="mt-1 text-sm font-black text-cobalt">{project.client}</p>
                  <p className="mt-1 text-base font-bold leading-7 text-graphite">{project.title}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReferenceExplorer() {
  const recent = useMemo(() => projects.filter((project) => project.year >= 2021), []);
  const legacy = useMemo(() => projects.filter((project) => project.year >= 2012 && project.year <= 2020), []);

  return (
    <div>
      <div className="mb-10 border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">Recent Project Reference</p>
        <h2 className="mt-3 text-3xl font-black text-graphite md:text-4xl">최근 주요 납품실적</h2>
        <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-steel">
          2021년 이후 주요 프로젝트를 연도별 역순으로 정리했습니다.
        </p>
      </div>

      <RecentProjectTable groups={groupByYear(recent)} />
      <LegacyTimeline groups={groupByYear(legacy)} />
    </div>
  );
}
