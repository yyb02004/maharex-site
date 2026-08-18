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

function RecentProjectTable({ groups }: { groups: Array<[number, ProjectItem[]]> }) {
  return (
    <div className="space-y-8">
      {groups.map(([year, items]) => (
        <section key={year} className="render-later soft-rise">
          <div className="mb-3 border-b border-cobalt/20 pb-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-steel">Project Reference</p>
            <h2 className="mt-1 text-3xl font-black text-graphite">{year}</h2>
          </div>

          <div className="overflow-hidden border border-black/10 bg-white shadow-sm">
            <div className="hidden grid-cols-[80px_80px_224px_minmax(0,1fr)] bg-[#f4f6f7] text-xs font-black uppercase tracking-[0.16em] text-steel md:grid">
              <span className="px-5 py-4">연도</span>
              <span className="px-5 py-4">월</span>
              <span className="px-5 py-4">업체명</span>
              <span className="px-5 py-4">공사명</span>
            </div>

            {items.map((project) => (
              <article
                key={project.id}
                className="grid grid-cols-2 gap-4 border-t border-black/10 p-5 transition first:border-t-0 hover:bg-cobalt/5 md:grid-cols-[80px_80px_224px_minmax(0,1fr)] md:items-center md:gap-0"
              >
                <div>
                  <span className="block text-xs font-black text-steel md:hidden">연도</span>
                  <span className="mt-1 block text-sm font-black text-graphite md:mt-0">{project.year}</span>
                </div>
                <div>
                  <span className="block text-xs font-black text-steel md:hidden">월</span>
                  <span className="mt-1 block text-sm font-black text-signal md:mt-0">{project.month ? `${project.month}월` : "-"}</span>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <span className="block text-xs font-black text-steel md:hidden">업체명</span>
                  <span className="mt-1 block text-sm font-black leading-6 text-cobalt md:mt-0">{project.client}</span>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <span className="block text-xs font-black text-steel md:hidden">공사명</span>
                  <span className="mt-1 block text-base font-bold leading-7 text-graphite md:mt-0">{project.title}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LegacyGroups({ groups }: { groups: Array<[number, ProjectItem[]]> }) {
  return (
    <div className="space-y-5">
      {groups.map(([year, items]) => (
        <div key={year} className="render-later grid gap-4 border-l-4 border-cobalt bg-white p-5 shadow-sm md:grid-cols-[120px_1fr]">
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
  );
}

function LegacyTimeline({ groups }: { groups: Array<[number, ProjectItem[]]> }) {
  const visibleGroups = groups.slice(0, 3);
  const hiddenGroups = groups.slice(3);

  return (
    <section className="mt-20 border-t border-black/10 pt-14">
      <div className="mb-8">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">Archive</p>
        <h2 className="mt-3 text-3xl font-black text-graphite md:text-4xl">2012~2020 과거 수행실적</h2>
      </div>

      <LegacyGroups groups={visibleGroups} />

      {hiddenGroups.length ? (
        <details className="group mt-5">
          <summary className="w-fit cursor-pointer list-none border border-black/15 bg-white px-5 py-3 text-sm font-black hover:border-signal hover:text-signal">
            이전 실적 더 보기
          </summary>
          <div className="mt-5">
            <LegacyGroups groups={hiddenGroups} />
          </div>
        </details>
      ) : null}
    </section>
  );
}

const recentGroups = groupByYear(projects.filter((project) => project.year >= 2021));
const legacyGroups = groupByYear(projects.filter((project) => project.year >= 2012 && project.year <= 2020));

export function ReferenceExplorer() {
  return (
    <div>
      <div className="mb-10 border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">Recent Project Reference</p>
        <h2 className="mt-3 text-3xl font-black text-graphite md:text-4xl">최근 주요 납품실적</h2>
        <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-steel">
          2021년 이후 주요 프로젝트를 연도별 역순으로 정리했습니다.
        </p>
      </div>

      <RecentProjectTable groups={recentGroups} />
      <LegacyTimeline groups={legacyGroups} />
    </div>
  );
}
