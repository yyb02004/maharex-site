import type { ProjectCategory } from "@/lib/project-data";

export function SearchFilter({
  categories,
  years,
  query,
  category,
  year,
  onQueryChange,
  onCategoryChange,
  onYearChange
}: {
  categories: ProjectCategory[];
  years: number[];
  query: string;
  category: string;
  year: string;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onYearChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 border border-black/10 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_180px]">
      <label className="block">
        <span className="sr-only">프로젝트 검색</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="업체명 또는 프로젝트명 검색"
          className="h-12 w-full border border-black/10 bg-[#f7f8f8] px-4 text-sm font-bold text-graphite outline-none transition focus:border-cobalt"
        />
      </label>
      <label className="block">
        <span className="sr-only">장비 타입 필터</span>
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="h-12 w-full border border-black/10 bg-[#f7f8f8] px-4 text-sm font-black text-graphite outline-none transition focus:border-cobalt"
        >
          <option value="all">전체 장비</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="sr-only">연도 필터</span>
        <select
          value={year}
          onChange={(event) => onYearChange(event.target.value)}
          className="h-12 w-full border border-black/10 bg-[#f7f8f8] px-4 text-sm font-black text-graphite outline-none transition focus:border-cobalt"
        >
          <option value="all">전체 연도</option>
          {years.map((item) => (
            <option key={item} value={String(item)}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
