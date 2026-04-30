"use client";

import { useState } from "react";

export function CertificateSlider({ certificates }: { certificates: string[] }) {
  const [active, setActive] = useState(0);
  const current = certificates[active];

  const goPrev = () => {
    setActive((index) => (index === 0 ? certificates.length - 1 : index - 1));
  };

  const goNext = () => {
    setActive((index) => (index === certificates.length - 1 ? 0 : index + 1));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <div className="overflow-hidden border border-black/10 bg-white p-4 shadow-sm">
        <div className="relative">
          <img src={current} alt={`ISO 인증서 ${active + 1}`} className="mx-auto max-h-[760px] w-auto object-contain" />
          <button
            type="button"
            onClick={goPrev}
            aria-label="이전 인증서"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-graphite/82 text-3xl font-black text-white hover:bg-signal"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="다음 인증서"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-graphite/82 text-3xl font-black text-white hover:bg-signal"
          >
            &gt;
          </button>
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-graphite/82 px-4 py-2 text-sm font-black text-white">
            {active + 1} / {certificates.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
        {certificates.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(index)}
            className={`border bg-white p-2 shadow-sm ${active === index ? "border-signal" : "border-black/10 hover:border-cobalt"}`}
          >
            <img src={src} alt={`ISO 인증서 썸네일 ${index + 1}`} className="aspect-[3/4] w-full object-contain" />
            <span className="mt-2 block text-xs font-black text-steel">인증서 {index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
