"use client";

import Link from "next/link";
import { useState } from "react";
import { Locale } from "@/lib/site-data";

type MenuItem = readonly [string, string];

export function MobileMenu({
  locale,
  aboutMenu,
  productMenu,
  qualityMenu,
  isAdmin
}: {
  locale: Locale;
  aboutMenu: readonly MenuItem[];
  productMenu: readonly MenuItem[];
  qualityMenu: readonly MenuItem[];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "모바일 메뉴 닫기" : "모바일 메뉴 열기"}
        className="flex h-11 w-11 items-center justify-center border border-black/15 bg-white text-2xl font-black text-graphite shadow-sm"
      >
        {open ? "×" : "≡"}
      </button>

      {open ? (
        <div className="fixed left-3 right-3 top-24 z-50 max-h-[calc(100vh-112px)] overflow-auto border border-black/10 bg-white p-4 shadow-industrial">
          <div className="grid gap-4">
            <div>
              <Link href={`/${locale}/about/ceo`} onClick={close} className="block border-b border-black/10 pb-3 text-lg font-black">
                회사소개
              </Link>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {aboutMenu.map(([itemLabel, slug]) => (
                  <Link
                    key={itemLabel}
                    href={slug ? `/${locale}/about/${slug}` : `/${locale}/about/company`}
                    onClick={close}
                    className="bg-[#f5f6f4] px-3 py-3 text-sm font-bold leading-snug text-steel hover:text-signal"
                  >
                    {itemLabel}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <Link href={`/${locale}/products`} onClick={close} className="block border-b border-black/10 pb-3 text-lg font-black">
                제품
              </Link>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {productMenu.map(([itemLabel, slug]) => (
                  <Link
                    key={slug}
                    href={`/${locale}/products/${slug}`}
                    onClick={close}
                    className="bg-[#f5f6f4] px-3 py-3 text-sm font-bold leading-snug text-steel hover:text-signal"
                  >
                    {itemLabel}
                  </Link>
                ))}
              </div>
            </div>

            <Link href={`/${locale}/references`} onClick={close} className="border border-black/10 px-3 py-4 text-base font-black">
              납품실적
            </Link>

            <div>
              <Link href={`/${locale}/engineering`} onClick={close} className="block border-b border-black/10 pb-3 text-lg font-black">
                품질관리
              </Link>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {qualityMenu.map(([itemLabel, slug]) => (
                  <Link
                    key={itemLabel}
                    href={slug ? `/${locale}/engineering/${slug}` : `/${locale}/engineering`}
                    onClick={close}
                    className="bg-[#f5f6f4] px-3 py-3 text-sm font-bold leading-snug text-steel hover:text-signal"
                  >
                    {itemLabel}
                  </Link>
                ))}
              </div>
            </div>

            {isAdmin ? (
              <Link href={`/${locale}/admin/rfq`} onClick={close} className="border border-signal px-3 py-4 text-center text-base font-black text-signal">
                견적확인
              </Link>
            ) : null}
            <Link href={`/${locale}/contact`} onClick={close} className="bg-signal px-4 py-4 text-center text-base font-black text-white">
              문의/RFQ
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
