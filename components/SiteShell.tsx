import { cookies } from "next/headers";
import Link from "next/link";
import { MobileMenu } from "@/components/MobileMenu";
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
            <MobileMenu locale={locale} aboutMenu={aboutMenu} productMenu={productMenu} qualityMenu={qualityMenu} isAdmin={isAdmin} />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-white/10 bg-graphite py-8 text-white">
        <div className="container grid gap-7 lg:grid-cols-[1fr_1.35fr_0.55fr] lg:items-start">
          <div>
            <img
              src="/maharex-logo-transparent.png"
              alt="마하렉스"
              className="h-11 w-auto max-w-[190px] object-contain brightness-0 invert opacity-90"
            />
            <p className="mt-4 max-w-md text-sm leading-6 text-white/68">
              반응, 건조, 여과, 분쇄 공정을 위한 주문형 산업 설비 제조.
            </p>
          </div>

          <div className="text-sm leading-7 text-white/68">
            <strong className="block text-white">회사 정보</strong>
            <p className="mt-2">
              상호명 : (주)마하렉스&nbsp;&nbsp; 사업자등록번호 : 125-81-78072
            </p>
            <p>주소 : 경기도 안성시 양성면 한내로 534</p>
            <p>
              대표 이메일 : maharex@naver.com&nbsp;&nbsp; Tel. 031-673-5888&nbsp;&nbsp; Fax. 031-673-5288
            </p>
          </div>

          <div className="text-sm leading-7 text-white/68">
            <strong className="block text-white">바로가기</strong>
            <Link href={`/${locale}/products`} className="mt-2 block hover:text-signal">
              제품
            </Link>
            <Link href={`/${locale}/contact`} className="block hover:text-signal">
              문의/RFQ
            </Link>
            <Link href={`/${locale}/privacy`} className="block font-bold text-white hover:text-signal">
              개인정보처리방침
            </Link>
            <Link href={`/${locale}/admin/rfq`} className="block hover:text-signal" title="Admin">
              www.maharex.com
            </Link>
          </div>
        </div>
        <div className="container mt-6 border-t border-white/10 pt-5 text-xs font-bold uppercase tracking-[0.08em] text-white/42">
          Copyright © Maharex. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
