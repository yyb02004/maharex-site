import { cookies } from "next/headers";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { getModelCategory, modelCategories, modelSets } from "@/lib/admin-model-catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "3D 모델 관리", robots: { index: false, follow: false } };

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
};

export default async function AdminModelsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const safeLocale = locale === "ko" ? locale : "ko";
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) redirect(`/${safeLocale}/admin/rfq?error=auth`);
  const query = await searchParams;
  const category = getModelCategory(query.category);
  if (query.category !== undefined && !category) notFound();
  const base = `/${safeLocale}/admin/models`;
  const selectedModels = category?.models.map((key) => modelSets.find((model) => model.key === key)!);

  return (
    <section className="container py-9 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-black/15 pb-6">
        <div><p className="text-xs font-black text-signal">ADMIN / 3D MODELS</p><h1 className="mt-3 text-3xl font-black">3D 모델 관리</h1></div>
        <div className="flex items-center gap-3">
          <Link href={`/${safeLocale}/admin/rfq`} className="inline-flex min-h-11 items-center border border-black/20 bg-white px-4 py-2 text-sm font-black hover:border-signal">견적 목록</Link>
          <AdminLogoutButton />
        </div>
      </header>

      {!category ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modelCategories.map((item) => <Link key={item.key} href={`${base}?category=${item.key}`} className="group overflow-hidden border border-black/15 bg-white transition hover:border-signal">
            <div className="relative aspect-[16/9] bg-[#e9eeee]"><Image src={item.image} alt="" fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-contain p-4" /></div>
            <div className="flex min-h-24 items-center justify-between gap-3 p-5"><div><h2 className="text-xl font-black group-hover:text-signal">{item.label}</h2><p className="mt-2 text-sm text-steel">{item.models.length}개 모델</p></div><ChevronRight size={23} className="shrink-0 text-signal" aria-hidden="true" /></div>
          </Link>)}
        </div>
      ) : (
        <>
          <Link href={base} className="mt-4 inline-flex min-h-12 items-center gap-2 text-sm font-bold text-steel"><ArrowLeft size={18} aria-hidden="true" />전체 분류</Link>
          <nav aria-label="3D 모델 분류" className="mt-3 flex flex-wrap gap-x-5 border-b border-black/15">
            {modelCategories.map((item) => <Link key={item.key} href={`${base}?category=${item.key}`} aria-current={category.key === item.key ? "page" : undefined} className={`inline-flex min-h-12 items-center border-b-2 py-3 text-sm font-bold ${category.key === item.key ? "border-signal text-signal" : "border-transparent text-steel hover:text-graphite"}`}>{item.label}</Link>)}
          </nav>
          <div className="mb-3 mt-8 flex flex-wrap items-baseline gap-3"><h2 className="text-2xl font-black">{category.label}</h2><span className="text-sm text-steel">{category.models.length}개 모델</span></div>
          <div className="divide-y divide-black/15 border-y border-black/15">
            {selectedModels?.map((model) => <article key={model.key} className="grid gap-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="text-xs font-bold text-cobalt">{model.name} · {model.partCount}</p>
                <h3 className="mt-2 text-xl font-black">{model.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-steel">{model.revision}</p>
                <p className="mt-3 text-sm leading-7 text-steel">{model.description}</p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-steel" aria-label={`${model.title} 구성`}>{model.components.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <Link href={`${base}/${model.key}`} target="_blank" rel="noopener noreferrer" aria-label={`${model.title} 3D 열기 (새 창)`} className="inline-flex min-h-12 items-center justify-center gap-2 bg-graphite px-5 py-3 text-sm font-black text-white hover:bg-signal">3D 열기<ArrowUpRight size={18} aria-hidden="true" /></Link>
            </article>)}
          </div>
        </>
      )}
    </section>
  );
}
