import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { Section } from "@/components/Section";
import { Locale, copy, industries, processSteps, productImages, products, references } from "@/lib/site-data";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const c = copy[locale];

  return (
    <>
      <section className="relative min-h-[720px] overflow-hidden border-b border-black/10 bg-graphite text-white">
        <img
          src={productImages.factoryExterior}
          alt="마하렉스 회사 전경"
          className="hero-photo-animate absolute inset-0 h-full w-full object-cover object-[center_70%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/72 to-graphite/18" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite/80 via-transparent to-transparent" />
        <div className="container relative flex min-h-[720px] items-center py-20">
          <div className="soft-rise max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">MAHAREX PROCESS EQUIPMENT</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">{c.heroTitle}</h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/78 md:text-lg">{c.heroText}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={`/${locale}/products`} className="bg-signal px-6 py-4 text-sm font-black text-white hover:bg-white hover:text-graphite">
                {c.viewProducts}
              </Link>
              <Link href={`/${locale}/contact`} className="border border-white/35 px-6 py-4 text-sm font-black text-white hover:border-signal hover:text-signal">
                {c.rfq}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/15 bg-graphite/88 backdrop-blur">
          <div className="container grid gap-px md:grid-cols-3">
            {["Reaction", "Drying", "Filtration"].map((item) => (
              <div key={item} className="process-glow border-r border-white/10 px-6 py-5 last:border-r-0">
                <span className="block text-xs uppercase tracking-[0.24em] text-white/50">Process</span>
                <strong className="mt-1 block text-xl">{item}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white py-8">
        <div className="container flex flex-wrap items-center gap-3">
          <span className="mr-2 text-xs font-black uppercase tracking-[0.22em] text-steel">Industries</span>
          {industries[locale].map((industry) => (
            <span key={industry} className="border border-black/10 px-4 py-2 text-sm font-bold">
              {industry}
            </span>
          ))}
        </div>
      </section>

      <Section eyebrow="제품 라인업" title={c.productsTitle}>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} locale={locale} />
          ))}
        </div>
      </Section>

      <Section eyebrow="품질관리 프로세스" title="공정 조건에서 검사·출하까지 이어지는 품질 체계" dark>
        <div className="grid gap-4 lg:grid-cols-5">
          {processSteps[locale].map(([number, title, text]) => (
            <div key={number} className="border border-white/15 p-5">
              <span className="text-sm font-black text-signal">{number}</span>
              <h3 className="mt-4 text-xl font-black">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/65">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="납품·적용 분야" title="동종 업계가 찾는 깊이 있는 제품 정보와 납품 신뢰도">
        <div className="grid gap-4 md:grid-cols-5">
          {references[locale].map((item) => (
            <div key={item} className="border-l-4 border-signal bg-white p-5 text-sm font-bold leading-7 shadow-sm">
              {item}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
