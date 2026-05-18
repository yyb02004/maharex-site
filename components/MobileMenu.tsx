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
        {open ? "×" : "☰"}
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-20 z-50 max-h-[calc(100vh-80px)] overflow-y-auto border-t border-black/10 bg-white p-5 shadow-industrial">
          <div className="grid gap-6">
            <MenuGroup title="회사소개" href={`/${locale}/about/ceo`} onClose={close}>
              {aboutMenu.map(([itemLabel, slug]) => (
                <Link key={itemLabel} href={`/${locale}/about/${slug}`} onClick={close} className="mobile-sub-link">
                  {itemLabel}
                </Link>
              ))}
            </MenuGroup>

            <MenuGroup title="제품" href={`/${locale}/products`} onClose={close}>
              {productMenu.map(([itemLabel, slug]) => (
                <Link key={slug} href={`/${locale}/products/${slug}`} onClick={close} className="mobile-sub-link">
                  {itemLabel}
                </Link>
              ))}
            </MenuGroup>

            <Link href={`/${locale}/references`} onClick={close} className="border border-black/10 px-4 py-4 text-base font-black">
              납품실적
            </Link>

            <MenuGroup title="품질관리" href={`/${locale}/engineering`} onClose={close}>
              {qualityMenu.map(([itemLabel, slug]) => (
                <Link key={itemLabel} href={slug ? `/${locale}/engineering/${slug}` : `/${locale}/engineering`} onClick={close} className="mobile-sub-link">
                  {itemLabel}
                </Link>
              ))}
            </MenuGroup>

            {isAdmin ? (
              <Link href={`/${locale}/admin/rfq`} onClick={close} className="border border-signal px-4 py-4 text-center text-base font-black text-signal">
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

function MenuGroup({ title, href, children, onClose }: { title: string; href: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div>
      <Link href={href} onClick={onClose} className="block border-b border-black/10 pb-3 text-lg font-black">
        {title}
      </Link>
      <div className="mt-3 grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}
