import Link from "next/link";

export function CertificateSlider({
  certificates,
  activeIndex,
  baseHref
}: {
  certificates: string[];
  activeIndex: number;
  baseHref: string;
}) {
  const safeIndex = Math.min(Math.max(activeIndex, 0), certificates.length - 1);
  const current = certificates[safeIndex];
  const prevIndex = safeIndex === 0 ? certificates.length - 1 : safeIndex - 1;
  const nextIndex = safeIndex === certificates.length - 1 ? 0 : safeIndex + 1;

  const hrefFor = (index: number) => `${baseHref}?cert=${index + 1}`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <div className="overflow-hidden border border-black/10 bg-white p-4 shadow-sm">
        <div className="relative">
          <img src={current} alt={`ISO 인증서 ${safeIndex + 1}`} className="mx-auto max-h-[760px] w-auto object-contain" />
          <Link
            href={hrefFor(prevIndex)}
            scroll={false}
            aria-label="이전 인증서"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-graphite/82 text-3xl font-black text-white hover:bg-signal"
          >
            &lt;
          </Link>
          <Link
            href={hrefFor(nextIndex)}
            scroll={false}
            aria-label="다음 인증서"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-graphite/82 text-3xl font-black text-white hover:bg-signal"
          >
            &gt;
          </Link>
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-graphite/82 px-4 py-2 text-sm font-black text-white">
            {safeIndex + 1} / {certificates.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
        {certificates.map((src, index) => (
          <Link
            key={src}
            href={hrefFor(index)}
            scroll={false}
            className={`border bg-white p-2 shadow-sm ${safeIndex === index ? "border-signal" : "border-black/10 hover:border-cobalt"}`}
          >
            <img src={src} alt={`ISO 인증서 썸네일 ${index + 1}`} className="aspect-[3/4] w-full object-contain" />
            <span className="mt-2 block text-xs font-black text-steel">인증서 {index + 1}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
