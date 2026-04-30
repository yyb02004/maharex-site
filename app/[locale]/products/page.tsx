import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/site-data";

export default function ProductsPage() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="mb-12 max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">Products</p>
          <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
            공정 조건에 맞춘
            <br />
            Maharex 주요 설비
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-steel md:text-lg">
            반응, 건조, 여과, 분쇄 공정에 필요한 핵심 장비를 현장 조건과 원료 특성에 맞춰 설계·제작합니다.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} locale="ko" />
          ))}
        </div>
      </div>
    </section>
  );
}
