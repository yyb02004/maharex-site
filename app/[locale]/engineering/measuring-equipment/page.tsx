export default function MeasuringEquipmentPage() {
  const instruments = [
    "입도 분포 측정 장비",
    "소음 측정기",
    "속도 측정기",
    "절연 저항 측정기",
    "적외선 온도 측정기",
    "압력 측정기",
    "진동 측정기",
    "표면 상태 측정 장비"
  ];

  return (
    <>
      <section className="bg-graphite py-24 text-white">
        <div className="container">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-signal">Measuring Instrument</p>
          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">측정용 장비</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
            장비 사용자의 안전, 제품 품질, 성능 확보를 위해 주요 품질관리 항목에 필요한 측정 장비를 운용합니다.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container grid gap-12 lg:grid-cols-[0.85fr_1fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-signal">보유 장비</p>
            <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight md:text-4xl">품질 확인을 위한 주요 측정 장비</h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-steel md:text-lg">
              실제 보유 장비 목록과 교정 현황은 최신 장비 운용 상태를 기준으로 업데이트할 수 있도록 구성했습니다.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {instruments.map((item) => (
                <div key={item} className="flex items-center justify-between border border-black/10 bg-white p-4 shadow-sm">
                  <span className="font-bold">{item}</span>
                  <span className="h-2 w-2 bg-signal" />
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden border border-black/10 bg-white p-4 shadow-sm">
            <img src="/quality/measuring-equipment.jpg" alt="품질관리 측정용 장비" className="w-full object-contain" />
          </div>
        </div>
      </section>
    </>
  );
}
