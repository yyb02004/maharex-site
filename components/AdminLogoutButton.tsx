export function AdminLogoutButton() {
  return (
    <form action="/api/admin/logout-form" method="post">
      <button type="submit" className="border border-black/15 px-4 py-2 text-sm font-black hover:border-signal hover:text-signal">
        로그아웃
      </button>
    </form>
  );
}
