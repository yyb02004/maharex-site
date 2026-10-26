import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { copy, products } from "@/lib/site-data";
import { rotaryDryerSpecifications, rotaryDryerTypes } from "@/lib/rotary-dryer-data";

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) return {};
  return { title: product.ko.name, description: product.ko.summary, alternates: { canonical: `/ko/products/${slug}` } };
}

export function generateStaticParams() {
  return products.map((product) => ({ locale: "ko", slug: product.slug }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  const p = product.ko;
  const contactHref = `/ko/contact?product=${product.slug}`;

  return (
    <>
      <section className="border-b border-black/10 bg-white">
        <div className="container py-7 sm:py-10 lg:py-12">
          <Link href="/ko/products" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-steel"><ChevronLeft size={17} aria-hidden="true" />전체 제품</Link>
          <p className="mt-4 text-xs font-black text-signal">{p.category}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{p.name}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-steel sm:text-lg sm:leading-8">{p.summary}</p>
          <Link href={contactHref} className="mt-6 inline-flex min-h-12 items-center gap-3 bg-signal px-5 py-3 text-sm font-black text-white hover:bg-graphite">{copy.ko.rfq}<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="container py-10 sm:py-14 lg:py-16" aria-label={`${p.name} 상세 정보`}>
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="grid gap-4">
            {product.gallery.map((src, index) => (
              <figure key={src}>
                <div className="relative aspect-[4/3] bg-[#e9eeee]">
                  <Image src={src} alt={`${p.name} 제품 사진 ${index + 1}`} fill priority={index === 0} sizes="(max-width: 1023px) 100vw, 50vw" className="object-contain" />
                </div>
              </figure>
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-cobalt">PRODUCT OVERVIEW</p>
            <h2 className="mt-2 text-2xl font-black">제품 개요</h2>
            <p className="mt-4 text-base leading-8 text-steel">{p.details}</p>
            <h3 className="mt-8 border-b-2 border-graphite pb-3 text-lg font-black">주요 특징</h3>
            <ul className="divide-y divide-black/10">
              {p.specs.map((spec, index) => (
                <li key={spec} className="flex gap-4 py-4 text-sm font-bold leading-6"><span className="shrink-0 text-signal">{String(index + 1).padStart(2, "0")}</span>{spec}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {slug === "rotary-dryers" && (
        <section className="border-y border-black/10 bg-white py-10 sm:py-16">
          <div className="container">
            <p className="text-xs font-black text-cobalt">DRYER CONFIGURATIONS</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">원료와 공정에 맞는 건조기 구성</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {rotaryDryerTypes.map((type) => <article key={type.name} className="border-t-2 border-signal pt-5">
                <p className="text-sm font-bold text-cobalt">{type.englishName}</p>
                <h3 className="mt-2 text-xl font-black">{type.name}</h3>
                <p className="mt-3 text-base leading-8 text-steel">{type.description}</p>
              </article>)}
            </div>
            <h3 className="mt-12 text-xl font-black">설계 검토 사양</h3>
            <dl className="mt-4 border-t-2 border-graphite">
              {rotaryDryerSpecifications.map(([label, value]) => <div key={label} className="grid gap-2 border-b border-black/10 py-4 sm:grid-cols-[150px_1fr] sm:gap-6">
                <dt className="text-sm font-black">{label}</dt><dd className="text-sm leading-7 text-steel">{value}</dd>
              </div>)}
            </dl>
            <p className="mt-4 text-sm leading-6 text-steel">적용 가능 여부와 최종 사양은 원료 및 운전 조건 검토 후 확정합니다.</p>
          </div>
        </section>
      )}

      <section className="container grid gap-10 border-t border-black/10 py-10 sm:py-16 lg:grid-cols-2 lg:gap-12">
        <div>
          <p className="text-xs font-black text-cobalt">PRODUCT USAGE</p>
          <h2 className="mt-2 text-2xl font-black">적용 가능 산업</h2>
          <ul className="mt-5 grid grid-cols-2 gap-x-6">
            {p.applications.map((item) => <li key={item} className="border-b border-black/10 py-4 text-base font-bold">{item}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-xs font-black text-cobalt">PROCESS NOTES</p>
          <h2 className="mt-2 text-2xl font-black">적용 공정</h2>
          <ul className="mt-5 divide-y divide-black/10">
            {p.engineering.map((item) => <li key={item} className="py-4 text-sm leading-7 text-steel">{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="bg-graphite py-10 text-white sm:py-14">
        <div className="container flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div><h2 className="text-2xl font-black">공정에 맞는 설비를 상담하세요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">원료와 처리량 등 알고 계신 조건부터 알려주세요. 상세 사양과 설비 구성은 함께 검토합니다.</p></div>
          <Link href={contactHref} className="inline-flex min-h-12 shrink-0 items-center gap-3 bg-signal px-5 py-3 text-sm font-black text-white hover:bg-white hover:text-graphite">{copy.ko.rfq}<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>
    </>
  );
}
