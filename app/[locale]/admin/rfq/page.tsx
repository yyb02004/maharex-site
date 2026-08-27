import { cookies } from "next/headers";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { readRfqSubmissions, type RfqSubmission } from "@/lib/rfq-store";

export const dynamic = "force-dynamic";

export default async function AdminRfqPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const cookieStore = await cookies();
  const isAdmin = verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
  const query = searchParams ? await searchParams : {};

  if (!isAdmin) {
    return (
      <section className="py-24">
        <div className="container">
          <div className="mb-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">Admin</p>
            <h1 className="mt-4 text-4xl font-black">견적 확인</h1>
            <p className="mt-4 text-sm font-semibold text-steel">관리자 로그인 후 접수된 RFQ를 확인할 수 있습니다.</p>
          </div>
          {query.error === "login" ? (
            <p className="mx-auto mb-4 max-w-md bg-white px-5 py-4 text-sm font-bold text-signal shadow-sm">
              아이디 또는 비밀번호가 올바르지 않습니다.
            </p>
          ) : null}
          {query.error === "auth" ? (
            <p className="mx-auto mb-4 max-w-md bg-white px-5 py-4 text-sm font-bold text-signal shadow-sm">
              관리자 로그인이 필요합니다.
            </p>
          ) : null}
          {query.error === "rate" ? (
            <p className="mx-auto mb-4 max-w-md bg-white px-5 py-4 text-sm font-bold text-signal shadow-sm">
              로그인 시도가 너무 많습니다. 10분 후 다시 시도해 주세요.
            </p>
          ) : null}
          {query.error === "config" ? (
            <p className="mx-auto mb-4 max-w-md bg-white px-5 py-4 text-sm font-bold text-signal shadow-sm">
              관리자 보안 설정을 확인해 주세요.
            </p>
          ) : null}
          <AdminLoginForm />
        </div>
      </section>
    );
  }

  let submissions: RfqSubmission[] = [];
  let loadError = false;

  try {
    submissions = await readRfqSubmissions();
  } catch {
    loadError = true;
  }

  return (
    <section className="py-24">
      <div className="container">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">Admin</p>
            <h1 className="mt-4 text-4xl font-black">견적 확인</h1>
            <p className="mt-4 text-sm font-semibold text-steel">총 {submissions.length}건의 견적 요청이 접수되었습니다.</p>
          </div>
          <AdminLogoutButton />
        </div>

        {loadError ? (
          <p className="mb-6 bg-white px-5 py-4 text-sm font-bold text-signal shadow-sm">
            견적 요청 데이터를 불러오지 못했습니다. 저장소 설정을 확인해 주세요.
          </p>
        ) : null}

        {submissions.length ? (
          <div className="grid gap-4">
            {submissions.map((item) => (
              <article key={item.id} className="border border-black/10 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-signal">{item.product || "제품 미선택"}</p>
                    <h2 className="mt-2 text-2xl font-black">{item.company}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <time className="text-sm font-bold text-steel">{new Date(item.createdAt).toLocaleString("ko-KR")}</time>
                    <form action="/api/admin/rfq/delete" method="post">
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="bg-signal px-3 py-2 text-xs font-black text-white hover:bg-graphite">
                        삭제
                      </button>
                    </form>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-black text-steel">담당자</p>
                    <p className="mt-1 font-bold">{item.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-steel">연락처</p>
                    <p className="mt-1 font-bold">{item.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-black text-steel">Email</p>
                    <p className="mt-1 font-bold">{item.email || "-"}</p>
                  </div>
                </div>
                <div className="mt-5 bg-[#f5f6f4] p-5">
                  <p className="text-xs font-black text-steel">요청 사항</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-graphite">{item.message}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-black/10 bg-white p-10 text-center shadow-sm">
            <p className="font-bold text-steel">아직 접수된 견적 요청이 없습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}
