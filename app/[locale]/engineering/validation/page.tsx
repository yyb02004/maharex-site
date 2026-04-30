export default function ValidationPage() {
  const flow = [
    ["URS", "요구사항 정의", "사용자 요구사항과 공정 조건을 문서화합니다."],
    ["PMP", "프로젝트 계획", "범위, 일정, 책임, 산출물을 정리합니다."],
    ["VMP", "검증 종합 계획", "Validation 수행 범위와 문서 체계를 수립합니다."],
    ["DQ", "설계 적격성", "설계가 요구사항과 GMP 관점에 적합한지 확인합니다."],
    ["FAT", "공장 입회 검사", "출하 전 제작사 현장에서 기능과 사양을 점검합니다."],
    ["SAT", "현장 입회 검사", "설치 현장에서 장비 상태와 연결 조건을 확인합니다."],
    ["IQ", "설치 적격성", "설치, 배관, 계장, 유틸리티 구성이 적합한지 검증합니다."],
    ["OQ", "운전 적격성", "운전 범위에서 장비가 정상 작동하는지 확인합니다."],
    ["PQ", "성능 적격성", "실제 공정 조건에서 요구 성능을 안정적으로 확보하는지 검증합니다."]
  ];

  const validationTypes = ["Process Validation", "Cleaning Validation", "Method Validation", "Computerized System Validation"];

  return (
    <>
      <section className="bg-graphite py-24 text-white">
        <div className="container">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-signal">Validation Flow</p>
          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">적격성평가</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
            설계, 제작, 설치, 운전 단계에서 장비가 사용 목적과 품질 요구사항에 맞게 작동하는지 확인하고 문서화합니다.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mb-10 rounded-[24px] border-2 border-cobalt/25 bg-white p-7 shadow-sm md:p-9">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-signal">Validation 이란</p>
            <div className="mt-4 max-w-4xl space-y-3 text-base font-semibold leading-8 text-graphite">
              <p>공정, 시설 또는 시스템이 사용자가 의도한 대로 기능하고 있음을 체계적으로 조사·검토하여 문서화하는 활동입니다.</p>
              <p>품질 규격에 적합한 제품 또는 설비가 일관되게 제공될 수 있음을 증명하는 절차입니다.</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {flow.map(([abbr, title, text], index) => (
              <div key={abbr} className="relative border border-black/10 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-4xl font-black text-cobalt">{abbr}</span>
                  <span className="text-sm font-black text-signal">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h2 className="mt-5 text-xl font-black">{title}</h2>
                <p className="mt-4 text-sm font-semibold leading-7 text-steel">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container grid gap-10 lg:grid-cols-[0.72fr_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-signal">Validation Scope</p>
            <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight md:text-4xl">GMP 품질 대응을 위한 검증 범위</h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-steel md:text-lg">
              프로젝트 특성에 따라 필요한 범위는 달라집니다. 장비 사양과 고객 요구 문서를 기준으로 수행 항목을 협의합니다.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {validationTypes.map((item) => (
              <div key={item} className="border border-black/10 bg-[#f5f6f4] p-6">
                <span className="block h-2 w-2 bg-signal" />
                <h3 className="mt-4 text-lg font-black leading-7">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
