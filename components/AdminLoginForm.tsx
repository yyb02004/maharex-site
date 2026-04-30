export function AdminLoginForm() {
  return (
    <form action="/api/admin/login-form" method="post" className="mx-auto grid max-w-md gap-4 bg-white p-8 shadow-sm">
      <input name="id" className="border border-black/15 p-4" placeholder="관리자 ID" autoComplete="username" required />
      <input name="password" type="password" className="border border-black/15 p-4" placeholder="비밀번호" autoComplete="current-password" required />
      <button type="submit" className="bg-signal px-6 py-4 text-sm font-black text-white hover:bg-graphite">
        관리자 로그인
      </button>
      <p className="text-xs font-semibold leading-6 text-steel">
        로그인 후 관리자 전용 견적 확인 페이지로 이동합니다.
      </p>
    </form>
  );
}
