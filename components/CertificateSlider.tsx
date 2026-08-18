"use client";

import Image from "next/image";
import { useState } from "react";

export function CertificateSlider({ certificates }: { certificates: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = certificates[activeIndex];
  const prevIndex = activeIndex === 0 ? certificates.length - 1 : activeIndex - 1;
  const nextIndex = activeIndex === certificates.length - 1 ? 0 : activeIndex + 1;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <div className="overflow-hidden border border-black/10 bg-white p-4 shadow-sm">
        <div className="relative mx-auto aspect-[892/1263] w-full max-w-[537px]">
          <Image src={current} alt={`ISO 인증서 ${activeIndex + 1}`} fill loading="eager" sizes="(max-width: 1023px) 100vw, 537px" className="object-contain" />
          <button
            type="button"
            onClick={() => setActiveIndex(prevIndex)}
            aria-label="이전 인증서"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-graphite/82 text-3xl font-black text-white hover:bg-signal"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex(nextIndex)}
            aria-label="다음 인증서"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-graphite/82 text-3xl font-black text-white hover:bg-signal"
          >
            &gt;
          </button>
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-graphite/82 px-4 py-2 text-sm font-black text-white">
            {activeIndex + 1} / {certificates.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
        {certificates.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`인증서 ${index + 1} 보기`}
            aria-pressed={activeIndex === index}
            className={`border bg-white p-2 text-left shadow-sm ${activeIndex === index ? "border-signal" : "border-black/10 hover:border-cobalt"}`}
          >
            <span className="relative block aspect-[3/4] w-full">
              <Image src={src} alt={`ISO 인증서 썸네일 ${index + 1}`} fill sizes="(max-width: 1023px) 30vw, 240px" className="object-contain" />
            </span>
            <span className="mt-2 block text-xs font-black text-steel">인증서 {index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
