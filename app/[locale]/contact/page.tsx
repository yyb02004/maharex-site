import { RfqForm } from "@/components/RfqForm";
import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Locale, products } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "견적 문의",
  description: "마하렉스 산업용 공정 장비 제작 및 견적을 문의하세요.",
  alternates: { canonical: "/ko/contact" }
};

export default async function ContactPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ product?: string | string[] }> }) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const query = await searchParams;
  const initialProduct = products.find((product) => product.slug === query.product)?.slug || "";

  return (
    <section className="container py-10 sm:py-16 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:gap-16">
        <div>
          <p className="text-xs font-black text-signal">CONTACT / RFQ</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">제작·견적 문의</h1>
          <p className="mt-5 max-w-md text-base leading-8 text-steel">공정에 필요한 장비를 함께 검토합니다.<br />사양이 정해지지 않았어도 편하게 문의해주세요.</p>
          <div className="mt-6 flex flex-col gap-1 border-y border-black/10 py-3 sm:mt-8">
            <a href="tel:0316735888" className="flex min-h-12 items-center gap-3 font-bold"><Phone size={19} className="text-signal" aria-hidden="true" />031-673-5888</a>
            <a href="mailto:maharex@naver.com" className="flex min-h-12 items-center gap-3 font-bold"><Mail size={19} className="shrink-0 text-signal" aria-hidden="true" />maharex@naver.com</a>
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-steel">담당자가 내용을 확인한 후 연락드립니다. 기밀 도면이나 원료 배합 정보는 첫 문의에 포함하지 않으셔도 됩니다.</p>
        </div>
        <RfqForm key={initialProduct} locale={locale} initialProduct={initialProduct} />
      </div>
    </section>
  );
}
