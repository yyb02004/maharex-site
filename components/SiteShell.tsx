import { cookies } from "next/headers";
import Link from "next/link";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { Locale, aboutMenu, copy, nav, products, qualityMenu } from "@/lib/site-data";

export async function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const c = copy[locale];
  const productMenu = products.map((product) => [product[locale].name, product.slug] as const);
  const cookieStore = await cookies();
  const isAdmin = verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f5f6f4]/90 backdrop-blur">
        <div className="container flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-10">
            <Link href={`/${locale}`} className="flex items-center">
              <img src="/maharex-logo-transparent.png" alt="마하렉스" className="h-12 w-auto max-w-[180px] object-contain" />
            </Link>
            <nav className="hidden items-center gap-8 text-base font-bold text-graphite lg:flex">
              {nav[locale].map(([label, href]) =>
                href.endsWith("/about") ? (
                  <div key={href} className="group relative py-7">
                    <Link href={`/${locale}/about/ceo`} className="hover:text-signal">
                      {label}
                    </Link>
                    <div className="invisible absolute left-0 top-full w-52 translate-y-2 border border-black/10 bg-white py-3 opacity-0 shadow-industrial transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      {aboutMenu.map(([itemLabel, slug]) => (
                        <Link
                          key={itemLabel}
                          href={slug ? `/${locale}/about/${slug}` : `/${locale}/about/company`}
                          className="block px-5 py-3 text-sm font-bold text-graphite hover:bg-[#f5f6f4] hover:text-signal"
                        >
                          {itemLabel}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : href.endsWith("/products") ? (
                  <div key={href} className="group relative py-7">
                    <Link href={href} className="hover:text-signal">
                      {label}
                    </Link>
                    <div className="invisible absolute left-0 top-full w-52 translate-y-2 border border-black/10 bg-white py-3 opacity-0 shadow-industrial transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      {productMenu.map(([itemLabel, slug]) => (
                        <Link
                          key={slug}
                          href={`/${locale}/products/${slug}`}
                          className="block px-5 py-3 text-sm font-bold text-graphite hover:bg-[#f5f6f4] hover:text-signal"
                        >
                          {itemLabel}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : href.endsWith("/engineering") ? (
                  <div key={href} className="group relative py-7">
                    <Link href={href} className="hover:text-signal">
                      {label}
                    </Link>
                    <div className="invisible absolute left-0 top-full w-52 translate-y-2 border border-black/10 bg-white py-3 opacity-0 shadow-industrial transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      {qualityMenu.map(([itemLabel, slug]) => (
                        <Link
                          key={itemLabel}
                          href={slug ? `/${locale}/engineering/${slug}` : `/${locale}/engineering`}
                          className="block px-5 py-3 text-sm font-bold text-graphite hover:bg-[#f5f6f4] hover:text-signal"
                        >
                          {itemLabel}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link key={href} href={href} className="py-7 hover:text-signal">
                    {label}
                  </Link>
                )
              )}
              {isAdmin ? (
                <Link href={`/${locale}/admin/rfq`} className="py-7 text-signal hover:text-graphite">
                  견적확인
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/${locale}/contact`} className="hidden bg-signal px-4 py-2 text-sm font-bold text-white hover:bg-graphite sm:inline-flex">
              {c.rfq}
            </Link>
            <details className="group lg:hidden">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center border border-black/15 bg-white text-2xl font-black text-graphite shadow-sm marker:hidden">
                <span className="group-open:hidden">≡</span>
                <span className="hidden group-open:block">×</span>
              </summary>
              <div className="fixed left-4 right-4 top-24 max-h-[calc(100vh-120px)] overflow-auto border border-black/10 bg-white p-5 shadow-industrial">
                <div className="grid gap-5">
                  <div>
                    <Link href={`/${locale}/about/ceo`} className="block border-b border-black/10 pb-3 text-lg font-black">
                      회사소개
                    </Link>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {aboutMenu.map(([itemLabel, slug]) => (
                        <Link
                          key={itemLabel}
                          href={slug ? `/${locale}/about/${slug}` : `/${locale}/about/company`}
                          className="bg-[#f5f6f4] px-3 py-3 text-sm font-bold text-steel hover:text-signal"
                        >
                          {itemLabel}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Link href={`/${locale}/products`} className="block border-b border-black/10 pb-3 text-lg font-black">
                      제품
                    </Link>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {productMenu.map(([itemLabel, slug]) => (
                        <Link
                          key={slug}
                          href={`/${locale}/products/${slug}`}
                          className="bg-[#f5f6f4] px-3 py-3 text-sm font-bold text-steel hover:text-signal"
                        >
                          {itemLabel}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <Link href={`/${locale}/references`} className="border border-black/10 px-3 py-4 text-base font-black">
                    납품실적
                  </Link>
                  <div>
                    <Link href={`/${locale}/engineering`} className="block border-b border-black/10 pb-3 text-lg font-black">
                      품질관리
                    </Link>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {qualityMenu.map(([itemLabel, slug]) => (
                        <Link
                          key={itemLabel}
                          href={slug ? `/${locale}/engineering/${slug}` : `/${locale}/engineering`}
                          className="bg-[#f5f6f4] px-3 py-3 text-sm font-bold text-steel hover:text-signal"
                        >
                          {itemLabel}
                        </Link>
                      ))}
                    </div>
                  </div>
                  {isAdmin ? (
                    <Link href={`/${locale}/admin/rfq`} className="border border-signal px-3 py-4 text-center text-base font-black text-signal">
                      견적확인
                    </Link>
                  ) : null}
                  <Link href={`/${locale}/contact`} className="bg-signal px-4 py-4 text-center text-base font-black text-white">
                    문의/RFQ
                  </Link>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-black/10 bg-white py-12 text-graphite">
        <div className="container grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <img src="/maharex-logo-transparent.png" alt="마하렉스" className="h-12 w-auto max-w-[210px] object-contain" />
            <p className="mt-4 max-w-md text-sm leading-7 text-steel">
              반응, 건조, 여과, 분쇄 공정을 위한 주문형 산업 설비 제조.
            </p>
          </div>
          <div className="text-sm text-steel">
            <strong className="block text-graphite">제품</strong>
            <Link href={`/${locale}/products`} className="mt-3 block hover:text-signal">
              반응기 / 건조기 / 필터 / 분쇄기
            </Link>
          </div>
          <div className="text-sm text-steel">
            <strong className="block text-graphite">문의</strong>
            <span className="mt-3 block">maharex@naver.com</span>
            <span className="block">Tel. 031-673-5888</span>
            <span className="block">Fax. 031-673-5288</span>
            <Link href={`/${locale}/admin/rfq`} className="block hover:text-signal" title="Admin">
              maharex.com
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
