import Link from "next/link";
import { Locale, copy, products } from "@/lib/site-data";

type Product = (typeof products)[number];

export function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const p = product[locale];
  return (
    <Link href={`/${locale}/products/${product.slug}`} className="group block overflow-hidden border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-industrial">
      <div className="aspect-[4/3] overflow-hidden bg-[#eef1f1]">
        <img src={product.image} alt={p.name} className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]" />
      </div>
      <div className="p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cobalt">{p.category}</p>
        <h3 className="mt-3 text-2xl font-black">{p.name}</h3>
        <p className="mt-3 min-h-20 text-sm leading-7 text-steel">{p.summary}</p>
        <span className="mt-6 inline-flex border-b-2 border-signal pb-1 text-sm font-black text-graphite">{copy[locale].rfq}</span>
      </div>
    </Link>
  );
}
