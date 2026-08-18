import Image from "next/image";
import Link from "next/link";
import { MobileMenu } from "@/components/MobileMenu";
import { Locale, aboutMenu, copy, nav, products, qualityMenu } from "@/lib/site-data";

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const c = copy[locale];
  const productMenu = products.map((product) => [product[locale].name, product.slug] as const);

  return (
    <div className="min-h-screen bg-[#f4f6f6] text-graphite">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/94 backdrop-blur">
        <div className="container flex h-20 items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-8">
            <Link href={`/${locale}`} className="flex shrink-0 items-center" aria-label="Maharex home">
              <Image src="/maharex-logo-transparent.png" alt="마하렉스" width={178} height={94} priority sizes="178px" className="h-12 w-auto object-contain" />
            </Link>

            <nav className="hidden items-center gap-7 text-[15px] font-black text-graphite lg:flex">
              {nav[locale].map(([label, href]) =>
                href.endsWith("/about") ? (
                  <div key={href} className="group relative py-7">
                    <Link href={`/${locale}/about/ceo`} className="transition hover:text-signal">
                      {label}
                    </Link>
                    <DesktopDropdown>
                      {aboutMenu.map(([itemLabel, slug]) => (
                        <Link key={itemLabel} href={`/${locale}/about/${slug}`} className="dropdown-link">
                          {itemLabel}
                        </Link>
                      ))}
                    </DesktopDropdown>
                  </div>
                ) : href.endsWith("/products") ? (
                  <div key={href} className="group relative py-7">
                    <Link href={href} className="transition hover:text-signal">
                      {label}
                    </Link>
                    <DesktopDropdown>
                      {productMenu.map(([itemLabel, slug]) => (
                        <Link key={slug} href={`/${locale}/products/${slug}`} className="dropdown-link">
                          {itemLabel}
                        </Link>
                      ))}
                    </DesktopDropdown>
                  </div>
                ) : href.endsWith("/engineering") ? (
                  <div key={href} className="group relative py-7">
                    <Link href={href} className="transition hover:text-signal">
                      {label}
                    </Link>
                    <DesktopDropdown>
                      {qualityMenu.map(([itemLabel, slug]) => (
                        <Link key={itemLabel} href={slug ? `/${locale}/engineering/${slug}` : `/${locale}/engineering`} className="dropdown-link">
                          {itemLabel}
                        </Link>
                      ))}
                    </DesktopDropdown>
                  </div>
                ) : (
                  <Link key={href} href={href} className="py-7 transition hover:text-signal">
                    {label}
                  </Link>
                )
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/${locale}/contact`} className="hidden bg-signal px-5 py-3 text-sm font-black text-white transition hover:bg-graphite sm:inline-flex">
              {c.rfq}
            </Link>
            <MobileMenu locale={locale} aboutMenu={aboutMenu} productMenu={productMenu} qualityMenu={qualityMenu} />
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 bg-graphite py-7 text-white">
        <div className="container grid gap-6 md:grid-cols-[1fr_1.35fr_0.65fr] md:items-start">
          <div>
            <Image src="/maharex-logo-transparent.png" alt="마하렉스" width={170} height={90} sizes="170px" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
            <p className="mt-4 max-w-md text-sm leading-6 text-white/65">반응, 건조, 여과, 분쇄 공정을 위한 주문형 산업 설비 제조.</p>
          </div>

          <div className="text-sm leading-7 text-white/68">
            <strong className="block text-white">회사 정보</strong>
            <p className="mt-2">상호명 : ㈜마하렉스</p>
            <p>사업자등록번호 : 125-81-78072</p>
            <p>주소 : 경기도 안성시 양성면 한내로 534</p>
            <p>대표 이메일 : maharex@naver.com</p>
            <p>Tel. 031-673-5888&nbsp;&nbsp; Fax. 031-673-5288</p>
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

function DesktopDropdown({ children }: { children: React.ReactNode }) {
  return (
    <div className="invisible absolute left-0 top-full w-56 translate-y-2 border border-black/10 bg-white py-3 opacity-0 shadow-industrial transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
      {children}
    </div>
  );
}
