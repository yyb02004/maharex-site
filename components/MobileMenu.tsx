"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { Locale } from "@/lib/site-data";

type MenuItem = readonly [string, string];

export function MobileMenu({ locale, aboutMenu, productMenu, qualityMenu }: {
  locale: Locale;
  aboutMenu: readonly MenuItem[];
  productMenu: readonly MenuItem[];
  qualityMenu: readonly MenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", onResize);
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", onResize);
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);

  const groups = [
    { title: "제품", items: [["전체 제품", `/${locale}/products`], ...productMenu.map(([label, slug]) => [label, `/${locale}/products/${slug}`])] },
    { title: "회사소개", items: aboutMenu.map(([label, slug]) => [label, `/${locale}/about/${slug}`]) },
    { title: "품질관리", items: qualityMenu.map(([label, slug]) => [label, `/${locale}/engineering${slug ? `/${slug}` : ""}`]) }
  ];

  return (
    <div className="lg:hidden">
      <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mobile-navigation" aria-label="메뉴 열기" title="메뉴 열기" className="flex h-11 w-11 shrink-0 items-center justify-center text-graphite">
        <Menu size={25} aria-hidden="true" />
      </button>
      {mounted && createPortal(
        <dialog ref={dialog} id="mobile-navigation" className="mobile-navigation" aria-labelledby="mobile-navigation-title" onCancel={close}>
          <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-black/10 px-5">
            <Link href={`/${locale}`} onClick={close} id="mobile-navigation-title" className="text-lg font-black">MAHAREX</Link>
            <button type="button" autoFocus onClick={close} aria-label="메뉴 닫기" title="메뉴 닫기" className="flex h-11 w-11 items-center justify-center"><X size={25} aria-hidden="true" /></button>
          </div>
          <nav aria-label="모바일 메뉴" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            {groups.map((group, index) => (
              <details key={group.title} open={index === 0} className="group border-b border-black/10">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 text-lg font-black">
                  {group.title}<ChevronDown size={20} className="transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="grid pb-4">
                  {group.items.map(([label, href]) => <Link key={href} href={href} onClick={close} className="flex min-h-12 items-center px-3 py-3 text-base text-steel hover:bg-mist">{label}</Link>)}
                </div>
              </details>
            ))}
            <Link href={`/${locale}/references`} onClick={close} className="flex min-h-14 items-center border-b border-black/10 text-lg font-black">납품실적</Link>
            <Link href={`/${locale}/contact`} onClick={close} className="mt-6 flex min-h-14 items-center justify-center bg-signal px-4 py-3 font-black text-white">제작·견적 문의</Link>
            <a href="tel:0316735888" className="mt-2 flex min-h-12 items-center justify-center gap-2 text-sm font-bold text-steel"><Phone size={17} aria-hidden="true" />031-673-5888</a>
          </nav>
        </dialog>, document.body
      )}
    </div>
  );
}
