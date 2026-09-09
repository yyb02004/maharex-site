import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { modelSets, plannedModelSets } from "@/lib/admin-model-catalog";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminModelsPage({ params }: PageProps) {
  const { locale } = await params;
  const safeLocale = locale === "ko" ? locale : "ko";
  const cookieStore = await cookies();

  if (!verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value)) {
    redirect(`/${safeLocale}/admin/rfq?error=auth`);
  }

  return (
    <section className="py-16 sm:py-24">
      <div className="container">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-black/15 pb-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">Admin</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">3D 모델 관리</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${safeLocale}/admin/rfq`}
              className="border border-black/20 bg-white px-4 py-2 text-sm font-black transition hover:border-signal hover:text-signal"
            >
              견적 목록
            </Link>
            <AdminLogoutButton />
          </div>
        </header>

        {modelSets.map((model, index) => (
          <section key={model.key} className="mt-10" aria-labelledby={`${model.key}-set`}>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-graphite pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-signal">
                  Model Set {String(index + 1).padStart(2, "0")}
                </p>
                <h2 id={`${model.key}-set`} className="mt-2 text-2xl font-black">
                  {model.title}
                </h2>
                <p className="mt-2 text-sm font-semibold text-steel">{model.revision}</p>
              </div>
              <span className="bg-[#e7f4ec] px-3 py-2 text-xs font-black text-[#17663a]">사용 가능</span>
            </div>

            <div className="border-x border-b border-black/10 bg-white">
              <article className="grid gap-5 bg-[#f5f6f4] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{model.name}</h3>
                    <span className="bg-signal px-2 py-1 text-[11px] font-black text-white">전체 세트</span>
                    <span className="text-xs font-bold text-steel">{model.partCount}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-steel">{model.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${model.title} 구성`}>
                    {model.components.map((item) => (
                      <li key={item} className="border border-black/15 bg-white px-2.5 py-1.5 text-xs font-bold text-graphite">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={`/${safeLocale}/admin/models/${model.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center bg-graphite px-4 py-2 text-sm font-black text-white transition hover:bg-signal"
                >
                  3D 열기
                </Link>
              </article>
            </div>
          </section>
        ))}

        <section className="mt-14" aria-labelledby="planned-model-sets">
          <div className="border-b-2 border-graphite pb-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-signal">Next Model Sets</p>
            <h2 id="planned-model-sets" className="mt-2 text-2xl font-black">
              추가 예정 장비
            </h2>
          </div>
          <div className="divide-y divide-black/10 border-x border-b border-black/10 bg-white">
            {plannedModelSets.map((name, index) => (
              <div key={name} className="flex min-h-16 items-center justify-between gap-4 px-5 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="w-7 shrink-0 text-xs font-black text-steel">{String(index + modelSets.length + 1).padStart(2, "0")}</span>
                  <h3 className="font-black">{name}</h3>
                </div>
                <span className="shrink-0 text-xs font-bold text-steel">모델 준비 중</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
