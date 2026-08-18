import Image from "next/image";
import Link from "next/link";
import { Locale, products } from "@/lib/site-data";

type Product = (typeof products)[number];

export function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const p = product[locale];

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-industrial"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#eef1f1]">
        <Image
          src={product.image}
          alt={p.name}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cobalt">{p.category}</p>
        <h3 className="mt-3 text-2xl font-black">{p.name}</h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-steel">{p.summary}</p>
        <span className="mt-6 inline-flex w-fit border-b-2 border-signal pb-1 text-sm font-black text-graphite">상세 보기</span>
      </div>
    </Link>
  );
}
