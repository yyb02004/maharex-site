import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { copy, products } from "@/lib/site-data";

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);

  if (!product) return {};

  return {
    title: product.ko.name,
    description: product.ko.summary,
    alternates: { canonical: `/ko/products/${slug}` }
  };
}

export function generateStaticParams() {
  return products.map((product) => ({ locale: "ko", slug: product.slug }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  const p = product.ko;
  const c = copy.ko;
  const gallery = "gallery" in product ? product.gallery : [];

  return (
    <>
      <section className="bg-graphite text-white">
        <div className="container grid min-h-[560px] items-center gap-10 py-16 lg:grid-cols-[0.95fr_1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">{p.category}</p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{p.name}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">{p.summary}</p>
            <Link href={`/ko/contact?product=${product.slug}`} className="mt-9 inline-flex bg-signal px-6 py-4 text-sm font-black text-white transition hover:bg-white hover:text-graphite">
              {c.rfq}
            </Link>
          </div>
          <div className="relative h-[430px] overflow-hidden bg-white/10">
            <Image src={product.image} alt={p.name} fill loading="eager" sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover object-center" />
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">Product Overview</p>
          <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight md:text-4xl">공정에 맞춰 깊게 설계하는 제품 상세</h2>

          <div className="mt-10 grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-start">
            <div className="border-l-4 border-cobalt pl-5 md:pl-6">
              <p className="text-base leading-8 text-steel md:text-lg">{p.details}</p>
            </div>

            <aside className="border border-black/10 border-t-4 border-t-cobalt bg-white p-6 shadow-sm md:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cobalt">Key Specifications</p>
              <h3 className="mt-2 text-2xl font-black text-graphite">주요 사양</h3>
              <div className="mt-5 border-y border-black/10">
                {p.specs.map((spec, index) => (
                  <div key={spec} className="grid min-h-16 grid-cols-[36px_1fr_8px] items-center gap-3 border-b border-black/10 py-4 last:border-b-0">
                    <span className="text-xs font-black text-signal">{String(index + 1).padStart(2, "0")}</span>
                    <span className="font-bold leading-6 text-graphite">{spec}</span>
                    <span className="h-2 w-2 bg-signal" />
                  </div>
                ))}
              </div>
            </aside>

            {gallery.length ? (
              <div className={`grid gap-4 lg:col-start-1 lg:row-start-2 ${gallery.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {gallery.map((src, index) => (
                  <div key={src} className="overflow-hidden border border-black/10 bg-white shadow-sm">
                    <div className="relative aspect-[4/3] bg-[#eef1f1]">
                      <Image
                        src={src}
                        alt={`${p.name} 제품 사진 ${index + 1}`}
                        fill
                        loading={src === product.image ? "eager" : "lazy"}
                        sizes={gallery.length > 1 ? "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 28vw" : "(max-width: 1023px) 100vw, 55vw"}
                        className="object-cover object-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <div className="border border-black/10 bg-white p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cobalt">Product Usage</p>
              <h3 className="mt-3 text-2xl font-black md:text-3xl">적용 가능 산업</h3>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {p.applications.map((item, index) => (
                  <div key={item} className="border border-black/10 px-4 py-4">
                    <span className="text-sm font-black text-signal">{String(index + 1).padStart(2, "0")}</span>
                    <p className="mt-2 text-lg font-black">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-black/10 bg-white p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cobalt">Process Notes</p>
              <h3 className="mt-3 text-2xl font-black md:text-3xl">적용 공정</h3>
              <div className="mt-6 space-y-4">
                {p.engineering.map((item, index) => (
                  <div key={item} className="flex gap-4 border-b border-black/10 pb-4 last:border-b-0">
                    <span className="font-black text-signal">0{index + 1}</span>
                    <p className="text-sm font-bold leading-7 text-steel">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 bg-graphite p-8 text-white">
            <h3 className="text-2xl font-black md:text-3xl">RFQ 검토에 필요한 정보</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {["원료명·특성", "처리량", "운전 온도·압력", "재질 및 옵션"].map((item) => (
                <div key={item} className="border border-white/15 p-4 text-sm font-bold text-white/80">
                  {item}
                </div>
              ))}
            </div>
            <Link href={`/ko/contact?product=${product.slug}`} className="mt-8 inline-flex bg-white px-6 py-4 text-sm font-black text-graphite transition hover:bg-signal hover:text-white">
              {c.rfq}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
