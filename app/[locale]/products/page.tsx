import { ProductCard } from "@/components/ProductCard";
import type { Metadata } from "next";
import { products } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "제품",
  description: "반응기, 진공 건조기, 로터리 드라이어, Nutsche Filter, 분쇄기 등 마하렉스의 주요 공정 장비를 확인하세요.",
  alternates: { canonical: "/ko/products" }
};

export default function ProductsPage() {
  return (
    <section className="py-10 sm:py-16 lg:py-20">
      <div className="container">
        <div className="mb-8 max-w-4xl sm:mb-12">
          <p className="text-xs font-black text-signal">PRODUCTS</p>
          <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">주요 제품</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-steel md:text-lg">
            반응, 건조, 여과, 분쇄 공정에 필요한 장비를 원료 특성, 처리량, 온도·압력, 세척 조건에 맞춰 설계·제작합니다.
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
